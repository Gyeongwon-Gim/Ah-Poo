import { describe, it, expect } from 'vitest';
import {
  buildBlogSearchQueryFallbacks,
  filterRelevantBlogReviews,
  isNetworkFetchError,
  pickBestBlogReview,
  toBlogFetchErrorMessage,
  type PoolBlogReviewItem,
} from './naverBlog';

const pool = { name: '강남구민체육센터 수영장' };

function item(
  partial: Partial<PoolBlogReviewItem> & Pick<PoolBlogReviewItem, 'title'>,
): PoolBlogReviewItem {
  return {
    link: partial.link ?? 'https://blog.example.com/1',
    description: partial.description ?? '',
    bloggerName: partial.bloggerName ?? '블로거',
    postDate: partial.postDate ?? '20240101',
    ...partial,
  };
}

describe('naverBlog fetch errors', () => {
  it('Failed to fetch를 네트워크 안내 문구로 바꾼다', () => {
    expect(
      toBlogFetchErrorMessage(new TypeError('Failed to fetch')),
    ).toBe('네트워크 연결을 확인한 뒤 다시 시도해 주세요.');
  });

  it('Safari Load failed도 네트워크 오류로 본다', () => {
    expect(isNetworkFetchError(new TypeError('Load failed'))).toBe(true);
    expect(toBlogFetchErrorMessage(new TypeError('Load failed'))).toBe(
      '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    );
  });

  it('타임아웃 메시지를 사용자 친화적으로 바꾼다', () => {
    expect(toBlogFetchErrorMessage(new Error('REQUEST_TIMEOUT'))).toBe(
      '응답 시간이 초과됐어요. 다시 시도해 주세요.',
    );
  });

  it('AbortError는 그대로 전달한다', () => {
    expect(() =>
      toBlogFetchErrorMessage(new DOMException('Aborted', 'AbortError')),
    ).toThrow();
  });

  it('네이버 API 오류는 일시 장애 안내로 바꾼다', () => {
    expect(
      toBlogFetchErrorMessage(new Error('네이버 API 오류 (429)')),
    ).toBe(
      '블로그 검색 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.',
    );
  });
});

describe('filterRelevantBlogReviews', () => {
  it('수영장 이름이 언급된 글을 우선 반환한다', () => {
    const items = [
      item({ title: '서울 수영 후기', link: 'https://a.com/1' }),
      item({
        title: '강남구민체육센터 자유수영',
        link: 'https://a.com/2',
      }),
    ];
    const result = filterRelevantBlogReviews(items, pool);
    expect(result[0]?.title).toContain('강남구민체육센터');
  });

  it('관련 글이 없으면 raw items fallback을 반환한다', () => {
    const items = [
      item({ title: '12345', link: 'https://a.com/1' }),
      item({ title: '67890', link: 'https://a.com/2' }),
    ];
    expect(filterRelevantBlogReviews(items, pool)).toHaveLength(2);
  });

  it('pickBestBlogReview는 첫 번째 관련 글을 반환한다', () => {
    const items = [
      item({ title: '강남구민체육센터 후기', link: 'https://a.com/1' }),
      item({ title: '다른 글', link: 'https://a.com/2', description: '강남구민체육센터' }),
    ];
    expect(pickBestBlogReview(items, pool)?.title).toContain('강남구민체육센터');
  });
});

describe('buildBlogSearchQueryFallbacks', () => {
  it('자유수영·이름·수영장 순 fallback 검색어를 만든다', () => {
    expect(buildBlogSearchQueryFallbacks(pool)).toEqual([
      '"강남구민체육센터 수영장" 자유수영',
      '"강남구민체육센터 수영장"',
      '강남구민체육센터 수영장 수영장',
    ]);
  });
});
