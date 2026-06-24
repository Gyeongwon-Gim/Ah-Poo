import { describe, it, expect } from 'vitest';
import { filterBySearchTerm, poolMatchesQuery } from './poolSearch';

const pools = [
  { name: '강남수영장', address: '서울 강남구 테헤란로 1', fee: '5000원' },
  { name: 'Olympic Pool', address: '서울 송파구 올림픽로 25', fee: '무료' },
  { name: '없음풀', address: null, fee: undefined },
];

describe('filterBySearchTerm', () => {
  it('검색어가 비어있으면 원본 배열을 그대로 반환한다', () => {
    expect(filterBySearchTerm(pools, '')).toBe(pools);
  });

  it('공백만 입력하면 원본을 그대로 반환한다', () => {
    expect(filterBySearchTerm(pools, '   ')).toBe(pools);
  });

  it('이름으로 매칭한다', () => {
    const result = filterBySearchTerm(pools, '강남수영장');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('강남수영장');
  });

  it('구 단위 주소로 매칭한다', () => {
    const result = filterBySearchTerm(pools, '송파구');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Olympic Pool');
  });

  it('요금으로 매칭한다', () => {
    const result = filterBySearchTerm(pools, '무료');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Olympic Pool');
  });

  it('대소문자를 구분하지 않는다', () => {
    expect(filterBySearchTerm(pools, 'olympic')).toHaveLength(1);
    expect(filterBySearchTerm(pools, 'OLYMPIC')).toHaveLength(1);
  });

  it('name/address/fee가 null·undefined여도 에러 없이 처리한다', () => {
    expect(() => filterBySearchTerm(pools, '없음')).not.toThrow();
    expect(filterBySearchTerm(pools, '없음')).toHaveLength(1);
  });

  it('매칭이 없으면 빈 배열을 반환한다', () => {
    expect(filterBySearchTerm(pools, '존재하지않는검색어')).toEqual([]);
  });
});

describe('위치 인식 검색 (region 칼럼 없이 주소 토큰 기반)', () => {
  const regionPools = [
    { name: '두류수영장', address: '대구 달서구 두류공원로 1', fee: '3000원' },
    { name: '수성못수영장', address: '대구 수성구 무학로 2', fee: '3000원' },
    { name: '해운대수영장', address: '부산 해운대구 우동 3', fee: '4000원' },
    { name: '경산시민수영장', address: '경상북도 경산시 경안로 43', fee: '2000원' },
  ];

  it("'대구' 검색이 '해운대구' 풀을 잡지 않는다", () => {
    const result = filterBySearchTerm(regionPools, '대구');
    const names = result.map((p) => p.name);
    expect(names).toContain('두류수영장');
    expect(names).toContain('수성못수영장');
    expect(names).not.toContain('해운대수영장');
  });

  it("'해운대구' 검색은 부산 해운대구 풀만 잡는다", () => {
    const result = filterBySearchTerm(regionPools, '해운대구');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('해운대수영장');
  });

  it("'수성구' 검색은 구 단위로 정확히 매칭한다", () => {
    const result = filterBySearchTerm(regionPools, '수성구');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('수성못수영장');
  });

  it("'대구 수영장'처럼 일반 단어가 섞여도 위치 토큰으로 동작한다", () => {
    const result = filterBySearchTerm(regionPools, '대구 수영장');
    const names = result.map((p) => p.name);
    expect(names).toContain('두류수영장');
    expect(names).toContain('수성못수영장');
    expect(names).not.toContain('해운대수영장');
  });

  it("'대구 수성구'는 시/도와 구를 모두 만족하는 풀만 잡는다", () => {
    const result = filterBySearchTerm(regionPools, '대구 수성구');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('수성못수영장');
  });

  it("시/도 약칭과 전체 명칭을 동일하게 본다 ('경북'·'경상북도')", () => {
    expect(filterBySearchTerm(regionPools, '경북')).toHaveLength(1);
    expect(filterBySearchTerm(regionPools, '경상북도')).toHaveLength(1);
    expect(filterBySearchTerm(regionPools, '경북')[0].name).toBe('경산시민수영장');
  });

  it("'수영장'만 입력하면(일반 단어뿐) 전체를 반환한다", () => {
    expect(filterBySearchTerm(regionPools, '수영장')).toHaveLength(
      regionPools.length,
    );
  });

  it('poolMatchesQuery는 단일 풀에 대한 매칭을 판정한다', () => {
    expect(poolMatchesQuery(regionPools[2], '해운대구')).toBe(true);
    expect(poolMatchesQuery(regionPools[2], '대구')).toBe(false);
  });
});
