/** 스토리에서 재사용하는 가짜 수영장 데이터 (실제 API 응답 형태를 흉내냅니다) */
export const MOCK_POOLS = [
  {
    name: '올림픽수영장',
    address: '서울 송파구 올림픽로 424',
    lat: 37.5215,
    lng: 127.1255,
    fee: '5000',
    distanceKm: 0.4,
    is50m: 1,
    isWeekday: 1,
    isSaturday: 1,
    isSunday: 0,
    isHoliday: 0,
  },
  {
    name: '강남구민체육센터 수영장',
    address: '서울 강남구 삼성로 521',
    lat: 37.5102,
    lng: 127.0631,
    fee: '성인 4500원',
    distanceKm: 1.8,
    is50m: 0,
    isWeekday: 1,
    isSaturday: 0,
    isSunday: 1,
    isHoliday: 1,
  },
  {
    name: '잠실종합운동장 실내수영장',
    address: '서울 송파구 올림픽로 25',
    lat: 37.5159,
    lng: 127.0731,
    fee: '무료',
    distanceKm: 12.3,
    is50m: 1,
    isWeekday: 0,
    isSaturday: 1,
    isSunday: 1,
    isHoliday: 0,
  },
];

export const SINGLE_POOL = MOCK_POOLS[0];
