export function buildBlogSearchQuery(pool) {
  return `"${pool.name}" 자유수영`;
}

/** YYYYMMDD → YYYY.MM.DD */
export function formatPostDate(postDate) {
  const s = String(postDate ?? '');
  if (s.length !== 8 || !/^\d{8}$/.test(s)) return s;
  return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
}

function poolNameVariants(pool) {
  const full = pool.name.trim();
  const short = full.replace(/\s*수영장\s*$/, '').trim();
  return [...new Set([full, short].filter(Boolean))];
}

/** 제목이 숫자·기호뿐이면 스팸/무관 글로 간주 */
function isLowQualityTitle(title) {
  if (!title) return true;
  if (/[가-힣]/.test(title)) return false;
  return /^[\d\s&+.,!?\-_/|\\]*$/.test(title);
}

function mentionsPool(text, variants) {
  if (!text) return false;
  return variants.some((name) => text.includes(name));
}

/** display 여러 건 중 수영장 이름이 언급된 글 우선 선택 */
export function pickBestBlogReview(items, pool) {
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
      withPoolMention.find((item) => item.thumbnailUrl) ?? withPoolMention[0]
    );
  }

  const withKoreanTitle = items.filter(
    (item) => !isLowQualityTitle(item.title),
  );
  if (withKoreanTitle.length) {
    return (
      withKoreanTitle.find((item) => item.thumbnailUrl) ?? withKoreanTitle[0]
    );
  }

  return items.find((item) => mentionsPool(item.description, variants)) ?? null;
}

export async function fetchPoolBlogReviews(
  pool,
  { display = 10, signal } = {},
) {
  const params = new URLSearchParams({
    query: buildBlogSearchQuery(pool),
    display: String(display),
    sort: 'date',
  });

  const response = await fetch(`/api/naver-blog?${params}`, { signal });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.items ?? [];
}

export async function fetchPoolBlogReview(pool, options = {}) {
  const items = await fetchPoolBlogReviews(pool, options);
  return pickBestBlogReview(items, pool);
}
