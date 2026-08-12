/**
 * 목록 시트 4종(검색 결과·즐겨찾기·주변·50m)은 렌더링 로직이 동일하고
 * 제목·단위·빈 메시지·aria-label 같은 "표시용 문자열"만 다르다.
 * 그 차이를 값으로 뽑아 PoolListSheet에 주입하는 설정 묶음.
 */
export interface PoolListPreset {
  /** 시트 루트의 aria-label */
  ariaLabel: string;
  /** 헤더 제목(개수 앞 텍스트) */
  title: string;
  /** 개수 뒤 단위 — '곳' | '건' */
  countSuffix: string;
  /** 목록이 비었을 때 문구 */
  emptyMessage: string;
  /** 시트 루트 data-testid(선택) */
  testId?: string;
  /** 개수 span의 data-testid(선택) */
  countTestId?: string;
}

export const POOL_LIST_PRESETS = {
  favorites: {
    ariaLabel: '즐겨찾기',
    title: '즐겨찾는 수영장',
    countSuffix: '곳',
    emptyMessage: '즐겨찾기한 수영장이 없어요',
    testId: 'favorites-panel',
  },
  nearby: {
    ariaLabel: '주변 수영장',
    title: '주변 수영장',
    countSuffix: '곳을 찾아왔어요',
    emptyMessage: '주변에 등록된 수영장이 없어요',
    testId: 'nearby-panel',
    countTestId: 'nearby-count',
  },
  pools50m: {
    ariaLabel: '50m 레인',
    title: '50m레인',
    countSuffix: '곳',
    emptyMessage: '등록된 50m 수영장이 없어요',
    testId: 'pools50m-panel',
    countTestId: 'pools50m-count',
  },
} satisfies Record<string, PoolListPreset>;

/** 검색 결과는 aria-label이 검색어에 따라 달라져 헬퍼로 생성한다. */
export function searchResultPreset(searchTerm: string): PoolListPreset {
  return {
    ariaLabel: `'${searchTerm}' 검색 결과`,
    title: '검색 결과',
    countSuffix: '건',
    emptyMessage: '검색 결과가 없습니다',
    testId: 'results-panel',
  };
}
