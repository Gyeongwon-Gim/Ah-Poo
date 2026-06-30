import type { Pool } from '../types/pool';

/** API 응답을 정규화한 블로그 리뷰 항목 */
export interface PoolBlogReviewItem {
  title: string;
  link: string;
  description: string;
  bloggerName: string;
  postDate: string;
  thumbnailUrl?: string;
}

export function buildBlogSearchQuery(pool: Pick<Pool, 'name'>): string {
  return `"${pool.name}" 자유수영`;
}

/** YYYYMMDD → YYYY.MM.DD */
export function formatPostDate(postDate: string | number | null | undefined): string {
  const s = String(postDate ?? '');
  if (s.length !== 8 || !/^\d{8}$/.test(s)) return s;
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function poolNameVariants(pool: Pick<Pool, 'name'>): string[] {
  const full = pool.name.trim();
  const short = full.replace(/\s*수영장\s*$/, '').trim();
  return [...new Set([full, short].filter(Boolean))];
}

/** 제목이 숫자·기호뿐이면 스팸/무관 글로 간주 */
function isLowQualityTitle(title: string | null | undefined): boolean {
  if (!title) return true;
  if (/[가-힣]/.test(title)) return false;
  return /^[\d\s&+.,!?\-_/|\\]*$/.test(title);
}

function mentionsPool(text: string | null | undefined, variants: string[]): boolean {
  if (!text) return false;
  return variants.some((name) => text.includes(name));
}

/** display 여러 건 중 수영장 이름이 언급된 글 우선 선택 */
export function pickBestBlogReview(
  items: PoolBlogReviewItem[] | null | undefined,
  pool: Pick<Pool, 'name'>,
): PoolBlogReviewItem | null {
  if (!items?.length) return null;

  const variants = poolNameVariants(pool);
  const withPoolMention = items.filter(
    (item) =>
      !isLowQualityTitle(item.title) &&
      (mentionsPool(item.title, variants) ||
        mentionsPool(item.description, variants)),
  );
  if (withPoolMention.length) {
    return (
      withPoolMention.find((item) => item.thumbnailUrl) ?? withPoolMention[0] ?? null
    );
  }

  const withKoreanTitle = items.filter(
    (item) => !isLowQualityTitle(item.title),
  );
  if (withKoreanTitle.length) {
    return (
      withKoreanTitle.find((item) => item.thumbnailUrl) ?? withKoreanTitle[0] ?? null
    );
  }

  return items.find((item) => mentionsPool(item.description, variants)) ?? null;
}

const CLIENT_TIMEOUT_MS = 15000;
const MAX_NETWORK_RETRIES = 2;
const RETRY_DELAY_MS = 800;

export function isNetworkFetchError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return false;
  if (err instanceof TypeError) return true;
  const msg = String((err as Error | undefined)?.message ?? '');
  return (
    msg === 'Failed to fetch' ||
    msg === 'NetworkError when attempting to fetch resource.' ||
    msg === 'Load failed'
  );
}

export function toBlogFetchErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'AbortError'
  ) {
    throw err;
  }

  const msg = String((err as Error | undefined)?.message ?? '');

  if (msg === 'REQUEST_TIMEOUT') {
    return '응답 시간이 초과됐어요. 다시 시도해 주세요.';
  }
  if (isNetworkFetchError(err)) {
    return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
  }
  if (msg.includes('네이버 API') || msg.startsWith('HTTP 502')) {
    return '블로그 검색 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.';
  }
  if (msg.includes('환경 변수') || msg.includes('NAVER_CLIENT')) {
    return '블로그 리뷰를 일시적으로 불러올 수 없어요.';
  }
  if (msg.startsWith('HTTP ')) {
    return '리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return msg || '리뷰를 불러오지 못했습니다.';
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

interface FetchWithTimeoutOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

async function fetchWithTimeout(
  url: string,
  { signal, timeoutMs = CLIENT_TIMEOUT_MS }: FetchWithTimeoutOptions = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  if (signal?.aborted) {
    window.clearTimeout(timeoutId);
    throw new DOMException('Aborted', 'AbortError');
  }

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('REQUEST_TIMEOUT');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onAbort);
  }
}

interface FetchPoolBlogReviewsOptions {
  display?: number;
  signal?: AbortSignal;
}

async function fetchPoolBlogReviewsOnce(
  pool: Pick<Pool, 'name'>,
  { display = 10, signal }: FetchPoolBlogReviewsOptions = {},
): Promise<PoolBlogReviewItem[]> {
  const params = new URLSearchParams({
    query: buildBlogSearchQuery(pool),
    display: String(display),
    sort: 'date',
  });

  const response = await fetchWithTimeout(`/api/naver-blog?${params}`, {
    signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  const data = (await response.json()) as { items?: PoolBlogReviewItem[] };
  return data.items ?? [];
}

export async function fetchPoolBlogReviews(
  pool: Pick<Pool, 'name'>,
  { display = 10, signal }: FetchPoolBlogReviewsOptions = {},
): Promise<PoolBlogReviewItem[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_NETWORK_RETRIES; attempt += 1) {
    try {
      return await fetchPoolBlogReviewsOnce(pool, { display, signal });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;

      lastError = err;
      const canRetry =
        isNetworkFetchError(err) ||
        String((err as Error | undefined)?.message ?? '') === 'REQUEST_TIMEOUT';

      if (!canRetry || attempt === MAX_NETWORK_RETRIES) {
        throw new Error(toBlogFetchErrorMessage(err));
      }

      await delay(RETRY_DELAY_MS, signal);
    }
  }

  throw new Error(toBlogFetchErrorMessage(lastError));
}

export async function fetchPoolBlogReview(
  pool: Pick<Pool, 'name'>,
  options: FetchPoolBlogReviewsOptions = {},
): Promise<PoolBlogReviewItem | null> {
  const items = await fetchPoolBlogReviews(pool, options);
  return pickBestBlogReview(items, pool);
}
