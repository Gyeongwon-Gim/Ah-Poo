/**
 * 위치 인식 수영장 검색.
 *
 * 단순 부분문자열 매칭은 "대구"가 "해운대구"에 걸리는 문제가 있어,
 * 행정구역(시/도·시군구)은 토큰 단위로 정확히 비교하고
 * 이름/요금만 부분문자열로 비교한다.
 */

// 이름에 흔히 붙는 일반 단어. 위치 토큰을 가리지 않도록 검색에서 무시한다.
const STOPWORDS = new Set([
  '수영장',
  '실내수영장',
  '실내',
  '수영',
  '수영강습',
  '풀',
  'pool',
  'swimming',
]);

// 표준 시·도 약칭 ↔ 전체 명칭 (양방향 정규화용 표준키)
const SIDO_CANONICAL = [
  ['서울', '서울특별시', '서울시'],
  ['부산', '부산광역시'],
  ['대구', '대구광역시'],
  ['인천', '인천광역시'],
  ['광주', '광주광역시'],
  ['대전', '대전광역시'],
  ['울산', '울산광역시'],
  ['세종', '세종특별자치시', '세종시'],
  ['경기', '경기도'],
  ['강원', '강원도', '강원특별자치도'],
  ['충북', '충청북도'],
  ['충남', '충청남도'],
  ['전북', '전라북도', '전북특별자치도'],
  ['전남', '전라남도'],
  ['경북', '경상북도'],
  ['경남', '경상남도'],
  ['제주', '제주도', '제주특별자치도'],
];

// 모든 별칭 → 표준 약칭 매핑 (예: '대구광역시' → '대구')
const SIDO_ALIAS = new Map();
for (const [canonical, ...aliases] of SIDO_CANONICAL) {
  SIDO_ALIAS.set(canonical, canonical);
  for (const alias of aliases) SIDO_ALIAS.set(alias, canonical);
}

/** 시/도 토큰을 표준 약칭으로 정규화. 매핑이 없으면 그대로 소문자 반환. */
function normalizeSido(token) {
  return SIDO_ALIAS.get(token) ?? token.toLowerCase();
}

/** 주소를 공백 기준 토큰 배열로 분리. */
function addressTokens(address) {
  return (address ?? '').trim().split(/\s+/).filter(Boolean);
}

/** 주소 토큰 중 시/군/구로 끝나는 행정구역 토큰만 추출. */
function districtTokens(tokens) {
  return tokens.filter((t) => /(시|군|구)$/.test(t));
}

/** 검색 토큰 하나가 수영장과 매칭되는지 판정. */
function tokenMatchesPool(token, pool) {
  const lower = token.toLowerCase();
  const tokens = addressTokens(pool.address);

  // 시/도: 주소 첫 토큰과 정규화 비교
  if (tokens.length > 0 && normalizeSido(tokens[0]) === normalizeSido(token)) {
    return true;
  }

  // 시군구: 구/군/시로 끝나는 주소 토큰과 정확 일치
  if (districtTokens(tokens).includes(token)) {
    return true;
  }

  // 이름/요금: 부분문자열
  if ((pool.name ?? '').toLowerCase().includes(lower)) return true;
  if ((pool.fee ?? '').toLowerCase().includes(lower)) return true;

  return false;
}

/** 검색어(여러 토큰)가 수영장과 매칭되는지 판정. stopword만 있으면 매칭으로 본다. */
export function poolMatchesQuery(pool, searchTerm) {
  const tokens = (searchTerm ?? '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const meaningful = tokens.filter((t) => !STOPWORDS.has(t.toLowerCase()));
  if (meaningful.length === 0) return true;

  return meaningful.every((token) => tokenMatchesPool(token, pool));
}

/**
 * 토큰 하나가 수영장에 얼마나 관련있는지 점수 반환.
 * 이름 일치일수록 높고, 주소(시도/시군구) 일치는 낮다.
 */
function tokenScore(token, pool) {
  const lower = token.toLowerCase();
  const name = (pool.name ?? '').toLowerCase();
  const addrTokens = addressTokens(pool.address);

  if (name === lower) return 100;
  if (name.startsWith(lower)) return 80;
  if (name.includes(lower)) return 50;

  if (districtTokens(addrTokens).includes(token)) return 30;
  if (addrTokens.length > 0 && normalizeSido(addrTokens[0]) === normalizeSido(token)) return 20;

  if ((pool.fee ?? '').toLowerCase().includes(lower)) return 5;

  return 0;
}

/** 검색어에 대한 수영장의 관련도 점수 합산. */
export function scorePool(pool, searchTerm) {
  const tokens = (searchTerm ?? '').trim().split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((t) => !STOPWORDS.has(t.toLowerCase()));
  if (meaningful.length === 0) return 0;

  return meaningful.reduce((sum, token) => sum + tokenScore(token, pool), 0);
}

/** 검색어에 매칭되는 수영장만 필터링하고, 관련도 높은 순으로 정렬한다. 검색어가 비면 원본을 그대로 반환. */
export function filterBySearchTerm(pools, searchTerm) {
  const term = (searchTerm ?? '').trim();
  if (!term) return pools;

  const matched = pools.filter((pool) => poolMatchesQuery(pool, term));
  matched.sort((a, b) => scorePool(b, term) - scorePool(a, term));
  return matched;
}
