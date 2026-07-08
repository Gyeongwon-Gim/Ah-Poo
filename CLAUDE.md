# CLAUDE.md

어푸(ah-poo) — 전국의 일일 입장 가능 수영장을 지도로 찾는 모바일 웹(PWA). 배포: [ah-poo.kr](https://ah-poo.kr)

## 명령어

```bash
npm run dev          # vite 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run typecheck    # tsc --noEmit
npm run lint         # eslint (소스만 검사)
npx vitest run --project unit   # 유닛 테스트 (jsdom) ← 평소 이걸로
npm test             # 전체 테스트 (unit + storybook 브라우저)
```

- **테스트는 두 프로젝트**로 나뉜다: `unit`(jsdom, `*.test.ts`)와 `storybook`(브라우저, `*.stories` 기반, Playwright chromium 필요). 로직 검증은 `--project unit`만 돌리면 된다.
- 변경 후 최소 검증: `npm run typecheck` + `npx vitest run --project unit`.

## 스택

- React 18 + Vite 5 + TypeScript(strict, `noUncheckedIndexedAccess`)
- 라우팅: react-router-dom v6 · 경로 alias `@/*` → `src/*`
- 데이터: Supabase · 카카오맵(JS SDK) · 네이버 블로그 검색(서버리스)
- 배포: Vercel (`middleware.ts`, `api/`) · PWA(vite-plugin-pwa) · SEO 프리렌더(playwright)

## 아키텍처

- **사실상 화면은 하나**다. `/` → `pages/Home/Home.tsx`가 지도·검색·즐겨찾기·주변·상세시트를 모두 품는다. 검색결과/즐겨찾기/주변은 별도 페이지가 아니라 Home 내부의 패널 전환(`MainTabContext`).
- `/pool/:id` → `pages/PoolDetail`은 **SEO 딥링크/프리렌더용** 랜딩이다. 앱 내에서 이 경로로 이동하지 않으며, 진입하면 `/`로 리다이렉트한다.
- **지도 레이어**: `pages/Home/components/PoolMap/`
  - `useKakaoMap.ts` 훅이 지도 **생명주기**(SDK 로드 → 컨테이너 크기 준비 → 인스턴스 생성 → relayout 유지 → 관성 드래그)를 전담한다. 반환 계약 `KakaoMapController`가 벤더 교체 이음새 — 동일 형태의 `useNaverMap`을 만들면 훅만 갈아끼우면 된다.
  - `PoolMap.tsx`는 그 위에서 **마커·카메라·사용자 위치**만 다룬다.
  - 관성 드래그(`utils/mapInertia.ts`)는 카카오가 기본 제공하지 않아 직접 구현한 것 — 잘 격리돼 있으니 유지.

## 컨벤션 / 주의사항

- **스타일링**: 컴포넌트별 BEM CSS(`*.css`) + `src/styles/tokens.css`의 `--pf-*` 디자인 토큰. **Tailwind는 설치돼 있지만 실사용 0%** — 유틸리티 클래스를 새로 추가하지 말고 기존 BEM + 토큰 방식을 따를 것.
- **제스처/애니메이션 코드는 손으로 짜여 크다**: `hooks/useListSheet.ts`(~766줄), `usePoolDetailSheetExpand/Layout.ts`, `utils/sheetInertia.ts` 등. 바텀시트 드래그·스냅·관성 물리엔진이 직접 구현돼 있다.
- ⚠️ **`useKakaoMap.ts` 이펙트 4의 `scheduleMapRelayout(map, el)` 호출을 제거하지 말 것.** 중복처럼 보이지만 검색 fit(panTo 중심·레벨)이 틀어진다 — 코드에 이유 주석이 있다.
- **`knip` 오탐 주의**: `api/naver-blog.ts`, `middleware.ts`, `scripts/**`는 import가 아니라 플랫폼이 호출하는 진입점이라 "미사용"으로 잡힌다. 삭제 금지.

## 환경변수 (`.env`, `.env.example` 참고)

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_KAKAO_MAP_APP_KEY` — 클라이언트
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` — **서버 전용**(VITE_ 접두사 없음), 블로그 후기 API용

## Git

- main 직접 커밋이 관행이나, 작업은 브랜치에서 하고 fast-forward 병합하는 흐름을 쓴다.
- 커밋 메시지: 구어체 없이 깔끔한 기술 서술. 끝에 `Co-Authored-By` 트레일러 유지.
