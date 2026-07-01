import { enrichBlogThumbnails } from './fetchBlogThumbnail';

export type NaverBlogSearchErrorCode =
  | 'INVALID_QUERY'
  | 'MISSING_CREDENTIALS'
  | 'NAVER_API_ERROR';

export interface NaverBlogSearchError extends Error {
  code: NaverBlogSearchErrorCode;
  status?: number;
}

function createSearchError(
  message: string,
  code: NaverBlogSearchErrorCode,
  status?: number,
): NaverBlogSearchError {
  const err = new Error(message) as NaverBlogSearchError;
  err.code = code;
  if (status !== undefined) err.status = status;
  return err;
}

export function isNaverBlogSearchError(
  error: unknown,
): error is NaverBlogSearchError {
  return (
    error instanceof Error &&
    typeof (error as NaverBlogSearchError).code === 'string'
  );
}

const HTML_ENTITY: Record<string, string> = {
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeNumericEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

export function stripHtml(text: string | null | undefined): string {
  return decodeNumericEntities(
    (text ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/&(?:quot|amp|lt|gt|#39|nbsp);/g, (match) => HTML_ENTITY[match] ?? match),
  ).trim();
}

interface RawNaverBlogItem {
  title?: string;
  link?: string;
  description?: string;
  bloggername?: string;
  postdate?: string;
}

export interface NormalizedBlogItem {
  title: string;
  link: string;
  description: string;
  bloggerName: string;
  postDate: string;
  thumbnailUrl?: string;
}

export function normalizeBlogItems(
  items: RawNaverBlogItem[] | null | undefined,
): NormalizedBlogItem[] {
  return (items ?? []).map((item) => ({
    title: stripHtml(item.title),
    link: item.link ?? '',
    description: stripHtml(item.description),
    bloggerName: item.bloggername ?? '',
    postDate: item.postdate ?? '',
  }));
}

interface SearchNaverBlogParams {
  query?: string | string[];
  display?: string | string[] | number;
  start?: string | string[] | number;
  sort?: string | string[];
  includeThumbnails?: boolean;
}

interface SearchNaverBlogCredentials {
  clientId?: string;
  clientSecret?: string;
}

interface NaverBlogApiResponse {
  items?: RawNaverBlogItem[];
  total?: number;
}

export interface NaverBlogSearchResult {
  items: NormalizedBlogItem[];
  total: number;
}

export async function searchNaverBlog(
  {
    query,
    display = 1,
    start = 1,
    sort = 'date',
    includeThumbnails = true,
  }: SearchNaverBlogParams,
  { clientId, clientSecret }: SearchNaverBlogCredentials = {},
): Promise<NaverBlogSearchResult> {
  const id = clientId ?? process.env.NAVER_CLIENT_ID;
  const secret = clientSecret ?? process.env.NAVER_CLIENT_SECRET;

  if (!id || !secret) {
    throw createSearchError(
      'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.',
      'MISSING_CREDENTIALS',
    );
  }

  const rawQuery = Array.isArray(query) ? query[0] : query;
  const trimmedQuery = (rawQuery ?? '').trim();
  if (!trimmedQuery) {
    throw createSearchError('query 파라미터가 필요합니다.', 'INVALID_QUERY');
  }

  const displayValue = Array.isArray(display) ? display[0] : display;
  const startValue = Array.isArray(start) ? start[0] : start;
  const sortValue = Array.isArray(sort) ? sort[0] : sort;
  const safeDisplay = Math.min(Math.max(Number(displayValue) || 1, 1), 100);
  const safeStart = Math.min(Math.max(Number(startValue) || 1, 1), 1000);
  const safeSort = sortValue === 'sim' ? 'sim' : 'date';

  const url = new URL('https://openapi.naver.com/v1/search/blog.json');
  url.searchParams.set('query', trimmedQuery);
  url.searchParams.set('display', String(safeDisplay));
  url.searchParams.set('start', String(safeStart));
  url.searchParams.set('sort', safeSort);

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'X-Naver-Client-Id': id,
        'X-Naver-Client-Secret': secret,
      },
    });
  } catch (err) {
    const message =
      (err as Error | undefined)?.name === 'AbortError'
        ? '네이버 API 응답 시간 초과'
        : '네이버 API 연결에 실패했습니다.';
    throw createSearchError(message, 'NAVER_API_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw createSearchError(
      `네이버 API 오류 (${response.status})`,
      'NAVER_API_ERROR',
      response.status,
    );
  }

  const data = (await response.json()) as NaverBlogApiResponse;
  let items = normalizeBlogItems(data.items);

  if (includeThumbnails && items.length > 0) {
    try {
      items = await enrichBlogThumbnails(items, { limit: 3 });
    } catch {
      /* 썸네일은 부가 정보 — 실패해도 검색 결과는 반환 */
    }
  }

  return {
    items,
    total: data.total ?? 0,
  };
}
