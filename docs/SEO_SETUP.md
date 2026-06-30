# SEO 설정 가이드

어푸!(https://ah-poo.kr) 검색엔진 노출을 위한 수동 설정 및 운영 절차입니다.

## 1. Google Search Console

1. [Google Search Console](https://search.google.com/search-console) 접속
2. **속성 추가** → URL 접두어 `https://ah-poo.kr` 입력
3. 소유권 확인 (HTML 태그 또는 DNS TXT 중 편한 방법 선택)
4. **Sitemaps** 메뉴 → `https://ah-poo.kr/sitemap.xml` 제출
5. **URL 검사**로 홈(`/`)과 수영장 상세(`/pool/:id`) 색인 요청

## 2. Naver Search Advisor (필수)

한국 "자유수영" 검색 유입에 중요합니다.

1. [Naver Search Advisor](https://searchadvisor.naver.com) 접속
2. **웹마스터 도구** → 사이트 등록 `https://ah-poo.kr`
3. 소유권 확인 (HTML 메타 태그 또는 파일 업로드)
4. **요청 → 사이트맵 제출** → `https://ah-poo.kr/sitemap.xml`
5. **수집 현황**에서 색인 상태 주간 확인

## 3. Bing Webmaster (선택)

1. [Bing Webmaster Tools](https://www.bing.com/webmasters) 접속
2. 사이트 추가 및 소유권 확인
3. sitemap 제출: `https://ah-poo.kr/sitemap.xml`

## 4. 빌드·배포 시 자동 갱신

- `npm run build` 실행 시 `prebuild` 훅이 Supabase에서 수영장 ID를 조회해 `public/sitemap.xml`을 생성합니다.
- Vercel 환경 변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 설정되어 있어야 합니다.
- 수영장 데이터 추가·수정 후 **재배포**하면 sitemap과 프리렌더 HTML이 갱신됩니다.

## 5. Vercel Analytics

코드에 `@vercel/analytics`가 연동되어 있습니다. Vercel 대시보드 → 프로젝트 → **Analytics** 탭에서 트래픽을 확인할 수 있습니다.

별도 GA4를 쓰려면:

1. [Google Analytics](https://analytics.google.com)에서 GA4 속성 생성
2. 측정 ID(`G-XXXXXXXX`) 발급
3. `index.html` `<head>`에 gtag 스크립트 추가:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
```

## 6. 프리렌더

빌드 시 Playwright 기반 `scripts/prerender.mjs`가 `/` 및 `/pool/:id` HTML 스냅샷을 생성합니다.

- `npm run build` → `prebuild`(sitemap) → `vite build` → `prerender.mjs`
- 전체 수영장 프리렌더: Vercel 환경 변수 `PRERENDER_ALL=true` 설정
- 프리렌더 건너뛰기: `SKIP_PRERENDER=true`
- 일부만 테스트: `PRERENDER_MAX_ROUTES=10`

프리렌더가 실패하거나 비활성화된 경우:

- `SeoHead` 컴포넌트가 클라이언트에서 동적 메타 태그를 설정합니다.
- sitemap과 Search Console/Naver 제출만으로도 크롤링은 가능하나, JS 미실행 크롤러(Naver 등) 대응은 프리렌더가 유리합니다.

## 7. 모니터링 체크리스트 (주간)

- [ ] Search Console: 색인 페이지 수, 커버리지 오류
- [ ] Search Console: 검색 쿼리·클릭·노출
- [ ] Naver Search Advisor: 수집·색인 현황
- [ ] Vercel Analytics: 페이지뷰·유입 경로
- [ ] Supabase `pools` 데이터 완성도 (요금, 전화번호, 운영일)
