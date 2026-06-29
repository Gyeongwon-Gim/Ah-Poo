const HTML_ENTITY = {
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeNumericEntities(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

export function stripHtml(text) {
  return decodeNumericEntities(
    (text ?? '')
      .replace(/<[^>]+>/g, '')
      .replace(/&(?:quot|amp|lt|gt|#39|nbsp);/g, (match) => HTML_ENTITY[match] ?? match),
  ).trim();
}

import { enrichBlogThumbnails } from './fetchBlogThumbnail.js';

export function normalizeBlogItems(items) {
  return (items ?? []).map((item) => ({
    title: stripHtml(item.title),
    link: item.link ?? '',
    description: stripHtml(item.description),
    bloggerName: item.bloggername ?? '',
    postDate: item.postdate ?? '',
  }));
}

export async function searchNaverBlog(
  { query, display = 1, sort = 'date', includeThumbnails = true },
  { clientId, clientSecret } = {},
) {
  const id = clientId ?? process.env.NAVER_CLIENT_ID;
  const secret = clientSecret ?? process.env.NAVER_CLIENT_SECRET;

  if (!id || !secret) {
    const err = new Error(
      'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.',
    );
    err.code = 'MISSING_CREDENTIALS';
    throw err;
  }

  const trimmedQuery = (query ?? '').trim();
  if (!trimmedQuery) {
    const err = new Error('query 파라미터가 필요합니다.');
    err.code = 'INVALID_QUERY';
    throw err;
  }

  const safeDisplay = Math.min(Math.max(Number(display) || 1, 1), 10);
  const safeSort = sort === 'sim' ? 'sim' : 'date';

  const url = new URL('https://openapi.naver.com/v1/search/blog.json');
  url.searchParams.set('query', trimmedQuery);
  url.searchParams.set('display', String(safeDisplay));
  url.searchParams.set('sort', safeSort);

  let response;
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
      err?.name === 'AbortError'
        ? '네이버 API 응답 시간 초과'
        : '네이버 API 연결에 실패했습니다.';
    const apiErr = new Error(message);
    apiErr.code = 'NAVER_API_ERROR';
    throw apiErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const err = new Error(`네이버 API 오류 (${response.status})`);
    err.code = 'NAVER_API_ERROR';
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
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
