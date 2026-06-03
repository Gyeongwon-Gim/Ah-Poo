# 🏊 수영장 위치 정보 제공 서비스

모바일 최적화된 수영장 위치 정보 제공 웹 애플리케이션입니다.

## 주요 기능

- 📍 수영장 위치 정보 제공
- 🔍 수영장 이름 및 지역 검색
- 💰 이용요금 및 운영 정보

## 기술 스택

- React 18
- React Router
- Vite
- Supabase (수영장 데이터)
- Tailwind CSS (AQUA FLOW)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.example 참고)
cp .env.example .env

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트를 생성합니다.
2. **Project Settings → API**에서 URL과 `anon` public key를 복사합니다.
3. 프로젝트 루트에 `.env` 파일을 만들고 아래 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_KAKAO_MAP_APP_KEY=your-kakao-javascript-key
```

## 카카오맵 설정

1. [카카오 개발자 콘솔](https://developers.kakao.com)에서 앱을 만들고 **JavaScript 키**를 발급합니다 (REST API 키가 아닙니다).
2. **내 애플리케이션 → 해당 앱 → 제품 설정**에서 **「지도/로컬」(OPEN_MAP_AND_LOCAL)** 을 **ON**으로 켭니다. 이 단계가 없으면 SDK가 로드되지 않습니다.
3. **앱 설정 → 플랫폼 → Web**에 사이트 도메인을 등록합니다.
   - 로컬: `http://localhost:3000` (Vite 기본 포트)
   - 휴대폰에서 `http://192.168.x.x:3000`으로 접속한다면 해당 주소도 추가
4. `.env`에 `VITE_KAKAO_MAP_APP_KEY`를 추가한 뒤 개발 서버를 재시작합니다 (`npm run dev`).

5. Supabase 대시보드 **SQL Editor**에서 `supabase/schema.sql` 내용을 실행합니다.
   - `pools` 테이블 생성
   - 읽기용 RLS 정책
   - 샘플 수영장 데이터 삽입

6. 개발 서버를 재시작합니다 (`npm run dev`).

## 라우트

| 경로              | 설명                          |
| ----------------- | ----------------------------- |
| `/`               | 수영장 찾기 (카카오맵 + 마커) |
| `/pool`           | 수영장 상세                   |
| `/swimming-diary` | 운동 기록                     |

## 프로젝트 구조

```
src/
  ├── lib/supabase.js      # Supabase 클라이언트
  ├── services/pools.js    # pools 테이블 조회
  ├── pages/               # Home, PoolDetail, AquaFlow
  └── components/
supabase/schema.sql        # DB 스키마 및 샘플 데이터
```

## 향후 개선사항

- [x] 카카오맵 메인 화면 연동
- [ ] 현재 위치 기반 거리 계산
- [ ] 필터링 기능 (가격, 시설 등)
- [ ] 즐겨찾기 기능
- [ ] 리뷰 및 평점 기능

## 라이선스

MIT
