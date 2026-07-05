# GSC 색인 커버리지 분석 (2026-07-04)

Google Search Console에서 "색인 생성되지 않음" 알림 메일을 받고 원인을 조사한 기록.

## 배경

GSC "페이지 색인 생성" 리포트에서 아래 카테고리로 URL이 제외됨. 최초 의심은 admin 페이지(로그인 필요)였으나, **확인 결과 admin은 하나도 없었음**. `robots.ts`에서 `disallow: '/admin/'`으로 애초에 차단되어 있고, `admin/layout.tsx`가 미인증 요청을 `redirect('/')`로 보내므로 admin은 색인 대상에서 정상 제외됨.

## 영향받은 URL과 원인

| 카테고리 | URL | 원인 | 조치 |
|---|---|---|---|
| 리디렉션 포함 | `http://yjlogs.com/` | http→https 리디렉션 (정상) | 무시 |
| 내용 없이 색인 | `clerk.yjlogs.com` | Clerk 인증 서브도메인, 콘텐츠 없음 | 무시 (블로그와 무관) |
| 404 | `/posts/javascript-closure` | 예전 테스트 글, 현재 미존재 | 무시 (자연 소멸) |
| 404 | `/posts/post-1773612232339` | 타임스탬프 자동생성 slug의 옛 테스트 글, 현재 미존재 | 무시 (자연 소멸) |
| NOINDEX | `/apps/timelens` | GSC 데이터가 오래됨 (앱 추가 이전 404 시점 기록) | 재색인 요청 + sitemap 추가 |
| NOINDEX | `/posts/react-hooks-deep-dive` | 예전 테스트 글, 현재 미존재 | 무시 (자연 소멸) |

## 핵심 메커니즘: `notFound()` → noindex

Next.js는 `notFound()`가 호출되면 HTTP 404와 함께 `<meta name="robots" content="noindex">`를 자동으로 붙인다. 그래서 존재하지 않거나 미발행인 글은 상황에 따라 GSC에서 **404** 또는 **NOINDEX**로 분류될 수 있다 (Google이 상태코드를 봤는지 meta 태그를 봤는지에 따라 갈림).

- 글 상세: `src/app/(main)/posts/[slug]/page.tsx` — `!post || post.status !== 'published'`이면 `notFound()`
- 즉 404·NOINDEX로 뜬 `/posts/*` URL들은 **모두 지금은 존재하지 않는 옛 테스트 글**이며, 정상 동작임. 시간이 지나면 GSC에서 자동으로 빠진다.

`/apps/timelens`만 예외 — 현재 `apps-data.ts`에 정상 등록되어 유효한 페이지(200)임. GSC 기록이 앱 추가 이전(당시 404→noindex) 시점 것이라 오래된 데이터임.

## 실제 개선 사항: sitemap에 apps 누락

`src/app/sitemap.ts`가 홈·`/posts`·글 상세만 포함하고 **`/apps` 계열 URL을 빠뜨리고 있었음**. TimeLens·Ralli 앱 페이지가 sitemap에 없어 색인이 느렸다.

**수정 (2026-07-04)**: `apps-data.ts`의 `apps`를 import해 `/apps` 및 `/apps/{slug}` 엔트리를 sitemap에 추가.

## 후속 조치 체크리스트

- [x] sitemap에 `/apps`, `/apps/{slug}` 추가
- [ ] GSC에서 `/apps/timelens` URL 검사 → 색인 요청 (재크롤링 유도)
- [ ] `sitemap.xml` 재제출 후 apps 페이지 색인 확인
- [ ] (선택) `clerk.yjlogs.com` 서브도메인 색인 방지는 Clerk 도메인 설정에서 처리 — 우선순위 낮음
