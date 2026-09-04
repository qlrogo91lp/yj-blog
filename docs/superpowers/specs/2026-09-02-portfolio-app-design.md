# 포트폴리오 앱 설계

> **2026-09-04 갱신:** 이 문서의 Vite + HTML 파티셜 구조는 Astro 7로 이전했다.
> `2026-09-04-portfolio-astro-migration-design.md` 참조.

**작성일:** 2026-09-02
**상태:** 검토 대기
**선행 스펙:** `2026-09-02-monorepo-migration-design.md` — `apps/` 구조, pnpm, Turborepo가 먼저 들어와야 한다

---

## 배경

이력서는 "무엇을 했다"의 목록이다. 포트폴리오는 프로젝트마다 "왜, 어떻게, 그래서 무엇이 됐는가"를 몇 페이지씩
풀어 쓰는 문서다. 이력서의 불릿 하나가 포트폴리오에서는 한 절이 된다.

결과물은 둘이다. 웹(`portfolio.yjlogs.com`)과 PDF(지원 시 첨부). 하나의 HTML로 둘 다 내기 위해 처음부터
A4 폭으로 고정한 문서형 페이지로 만든다. 이력서 저장소(`yj-resume`)에서 검증된 Vite + HTML 파티셜 + Tailwind
v4 구조를 그대로 가져온다. 인쇄 CSS를 따로 관리하는 일반 웹 포트폴리오는 PDF 품질을 보장하기 어려워 택하지 않는다.

이 페이지는 이력서에서만 링크한다. 검색에 노출하지 않고, 블로그에서도 링크하지 않는다.

## 결정 사항

### 채택

- 기술 스택: **Vite 8 + Tailwind CSS v4**(`@tailwindcss/vite`). 프레임워크 없음. 커스텀 include 플러그인, Pretendard 웹폰트
- A4 세로, 문서형 단일 페이지. 웹에서도 A4 폭의 종이가 회색 배경 위에 놓인 모양
- 프로젝트 네 장: 학원관리 시스템 웹, Xamfinity 하이브리드 앱, Ralli · GolfCounter, yjlogs
- 장마다 같은 틀: 개요 → 문제 → 접근과 선택 → 구현 → 결과 → 회고
- 프로젝트당 화면 캡처 1~2장 + 구조도 1장. 구조도는 인라인 SVG로 직접 그린다
- 검색 제외: `<meta name="robots" content="noindex, nofollow">` + `public/robots.txt` `Disallow: /`
- PDF 내보내기 스크립트: `vite preview` + 헤드리스 Chrome으로 `dist/portfolio.pdf` 생성
- Vercel 두 번째 프로젝트(Root Directory `apps/portfolio`), 도메인 `portfolio.yjlogs.com`

### 제외

- 이력서 저장소 편입 — private 유지 (선행 스펙에서 결정)
- 전화번호·주소·프로필 사진 — public 저장소와 공개 URL에 올라간다. 연락처는 이메일·GitHub·블로그만
- 다크 모드 — 인쇄 문서다. 라이트 고정
- 페이지 번호 — CSS `@page` 마진 박스의 Chrome 지원이 불안정하다. 목차는 페이지 번호 없이 프로젝트 목록만
- PDF 파일을 저장소에 커밋 — 갱신 때마다 바이너리가 쌓인다. PDF는 스크립트로 로컬 생성해서 첨부한다
- 콘텐츠 데이터화(JSON → 템플릿) — 프로젝트 넷을 손으로 쓰는 편이 빠르다
- 테스트 프레임워크 — 정적 HTML이다. 빌드 통과, Prettier, PDF 육안 검토가 검증이다
- 이미지 최적화 파이프라인 — 캡처를 2x 해상도로 넣고 CSS로 줄인다. 총량이 수 MB 수준이라 충분하다

## 구조

```
apps/portfolio/
├─ package.json            name: "portfolio"
├─ vite.config.js          includePlugin (yj-resume에서 복사), base './'
├─ vercel.json             ignoreCommand: npx turbo-ignore
├─ index.html              <head> 메타·폰트, <body>에 include 지시어 나열
├─ public/
│  ├─ robots.txt           User-agent: * / Disallow: /
│  ├─ hakon/               학원관리 웹 캡처 (가린 것)
│  ├─ xamfinity/           Xamfinity 앱 스토어 스크린샷
│  ├─ watch-apps/          Ralli·GolfCounter 캡처 (apps/web/public/{ralli,golf-counter}에서 복사)
│  └─ yjlogs/              블로그 캡처
├─ scripts/
│  └─ export-pdf.mjs       dist → dist/portfolio.pdf
└─ src/
   ├─ globals.css          @theme 토큰, 문서 컴포넌트 클래스, @page
   ├─ components/
   │  ├─ cover.html        표지
   │  ├─ toc.html          목차
   │  ├─ projects/
   │  │  ├─ hakon.html
   │  │  ├─ xamfinity.html
   │  │  ├─ watch-apps.html
   │  │  └─ yjlogs.html
   │  └─ closing.html      링크 모음
   └─ diagrams/
      ├─ hakon-pipeline.svg        GitHub Actions → GHCR → 서버 배포 흐름
      ├─ xamfinity-bridge.svg      Flutter ↔ WebView(React) MethodChannel·EventChannel
      ├─ watch-apps-yjkit.svg      YJKit 프로덕트와 앱 타깃 의존 관계, 워치↔폰 역할
      └─ yjlogs-stack.svg          Next.js · Neon · Clerk · R2 · Vercel 배치
```

### include 플러그인

`index.html`의 `<!-- include: src/components/cover.html -->` 지시어를 `transformIndexHtml`에서 파일 내용으로
치환한다. yj-resume의 `vite.config.js`를 그대로 가져온다. SVG 구조도도 같은 지시어로 파티셜 안에 넣는다
(`<!-- include: src/diagrams/xamfinity-bridge.svg -->`). SVG를 `<img>`가 아니라 인라인으로 두는 이유는
텍스트가 선택·검색되고, 색을 CSS 토큰으로 맞출 수 있어서다.

Tailwind v4는 소스를 자동 탐지하므로 `tailwind.config.js`를 두지 않는다. `globals.css`에서
`@import 'tailwindcss'`와 `@source '../index.html'`, `@source './components'`로 범위를 명시한다.

## 페이지 구성

### 표지 (`cover.html`)

- 이름, "Frontend / App Developer", 경력 연차(정적 텍스트. 이력서의 `duration.js`는 가져오지 않는다)
- 세 줄 소개. 이력서 헤더의 자기소개를 조금 늘린 것
- 연락처: 이메일, `github.com/qlrogo91lp`, `yjlogs.com`
- 하단에 "이 문서는 A4 인쇄용으로 만들어졌습니다" 같은 안내는 넣지 않는다

### 목차 (`toc.html`)

프로젝트 네 개를 번호·제목·한 줄 요약·기간으로 나열한다. 페이지 번호는 없다.

### 프로젝트 장 (`projects/*.html`)

각 장은 `break-before: page`로 새 페이지에서 시작한다. 절 순서는 고정이다.

| 절 | 내용 | 분량 |
|---|---|---|
| 헤더 | 번호, 제목, 한 줄 요약. 메타 표: 기간 · 역할 · 인원 · 스택 | 헤더 |
| 개요 | 무엇을, 누구를 위해, 어떤 상태(운영 중·출시·베타). 캡처 1장 | 3~5문장 |
| 문제 | 시작 시점에 무엇이 문제였나. 숫자가 있으면 숫자로 | 3~5문장 |
| 접근과 선택 | 대안이 무엇이었고 왜 이걸 골랐나. 이 절이 차별점이다 | 5~8문장 또는 표 |
| 구현 | 구조도 1장 + 핵심 판단이 드러나는 부분 2~3개 | 구조도 + 불릿 |
| 결과 | 이력서의 숫자를 전후 비교로. 캡처가 있으면 1장 더 | 표 또는 불릿 |
| 회고 | 아쉬운 점, 다시 한다면 바꿀 것 | 2~4문장 |

회사 프로젝트 둘은 각 절을 꽉 채워 3페이지 안팎, 개인 프로젝트 둘은 2페이지 안팎으로 잡는다. 회사 쪽이 더
무겁게 읽혀야 한다.

### 장별 핵심 내용

**1. 학원관리 시스템 웹** (`hakon.html`)
- 문제: 36개 학원·약 7,000명이 쓰던 PHP 레거시. 페이지 전환마다 전체 리로드, 깜박임
- 선택: Next.js·TypeScript 재구축. 파일 기반 라우팅, SSR·코드 스플리팅, prefetch
- 구현: QR 출결 → WebSocket 실시간 모니터링. Storybook·Vitest
- CI/CD와 운영 절: 서버 직접 빌드 → GitHub Actions·GHCR 이미지 배포. Docker 2.4GB → 500MB, 빌드·배포 10분 → 7분. Slack Webhook 알림
- 결과: 약 500명 규모 베타 운영 중
- 구조도: 배포 파이프라인
- 캡처: 학원명·학생 정보를 가린 화면 1~2장 (사용자 제공)

**2. Xamfinity 하이브리드 앱** (`xamfinity.html`)
- 문제: iOS·Android 네이티브 코드를 각각 관리
- 선택: Flutter + WebView(React). 네이티브가 필요한 것과 웹으로 충분한 것의 경계
- 구현: MethodChannel·EventChannel 양방향 브리지, 인앱결제·푸시·Remote Config, Crashlytics, Android kiosk 모드·자동 업데이트, Fastlane으로 두 스토어 자동 업로드
- 결과: 누적 약 8,000 다운로드, MAU 약 3,000, 현재 버전 비정상 종료 0건
- 구조도: 네이티브 ↔ 웹뷰 브리지
- 캡처: 스토어 스크린샷 1~2장 (사용자 제공)

**3. Ralli · GolfCounter** (`watch-apps.html`)
- 문제: 경기 중 폰을 꺼내지 않고 기록하고 싶다. 워치가 메인 입력
- 선택: HealthKit·WatchConnectivity·SwiftData 계층을 공통 패키지(YJKit)로 분리. 코어는 도메인을 모른다
- 구현: Live Activity·Complication·CloudKit. 레포 3개 → 모노레포, 변경된 앱만 빌드하는 CI
- 결과: App Store 출시. ASO·리디자인으로 앱 2종 월간 유료 판매 전월 대비 121%(7월 19건 → 8월 42건)
- 구조도: YJKit 프로덕트와 앱 타깃 의존 관계
- 캡처: `apps/web/public/ralli`, `apps/web/public/golf-counter`에서 복사

**4. yjlogs** (`yjlogs.html`)
- 문제: 출시 앱들의 랜딩과 글을 둘 곳. 직접 만들면서 풀스택을 한 번 훑고 싶었다
- 선택: Neon + Drizzle, Clerk, R2, Vercel. 각각 왜 골랐는지 한 줄씩
- 구현: SEO(사이트맵·JSON-LD·OG 자동 생성), GA4, 그리고 이번 모노레포 전환(pnpm·Turborepo·Vercel 다중 프로젝트)
- 결과: 운영 중. 검색 유입 지표가 있으면 표로
- 구조도: 스택 배치
- 캡처: 블로그 홈·글 상세 1~2장 (사용자 제공 또는 실제 페이지에서 캡처)

### 마무리 (`closing.html`)

GitHub, 블로그, App Store 링크 두 개. URL 텍스트를 그대로 노출한다. 종이에서는 클릭이 안 된다.

## 스타일

### 토큰 (`@theme`)

yj-resume의 팔레트를 출발점으로 쓴다. `--color-accent`(#1f4e79), `--color-ink` 4단계, `--color-line`,
`--color-accent-soft`, `--color-surface`, `--color-page`. 폰트는 Pretendard, 본문 12px / 행간 1.55.
포트폴리오는 이력서보다 여백이 넉넉해야 하므로 본문을 12.5px, 절 제목을 14px로 한 단계 올린다.

### 문서 컴포넌트 (`@layer components`)

이력서에 없던 요소들이다. 파티셜에서 유틸리티를 길게 나열하지 않도록 여기서 정의한다.

| 클래스 | 용도 |
|---|---|
| `.page` | 프로젝트 장 래퍼. `break-before: page` |
| `.chapter-head` | 번호·제목·요약 |
| `.meta-table` | 기간·역할·인원·스택 2열 표 |
| `.section-h` | 절 제목 (문제 / 접근과 선택 / …) |
| `.figure`, `.figure-caption` | 캡처·구조도 래퍼. `break-inside: avoid`, 캡션 11px muted |
| `.kpi` | 결과 절의 숫자 강조. 전 → 후 |
| `.callout` | 접근과 선택 절에서 "왜"를 한 문장으로 박는 상자 |
| `.compare-table` | 대안 비교표 |

### 인쇄

- `@page { size: A4; margin: 14mm 12mm }` — 최상위. `@media print` 안에 넣으면 Chrome이 용지 크기를 무시한다
- `-webkit-print-color-adjust: exact` — 배경색·구조도 색 유지
- 화면 전용 요소(인쇄 버튼, 회색 배경, 그림자)는 `print:hidden` 또는 `print:` 유틸리티로 제거
- 웹 뷰 우상단에 "PDF로 저장" 버튼. `window.print()` 호출. 인쇄 시 숨김

### 이미지

- 캡처는 2x 해상도로 저장하고 `max-width: 100%`로 줄인다
- 폰 캡처(세로)는 2장을 나란히, 웹 캡처(가로)는 1장 전폭
- 모든 `.figure`는 `break-inside: avoid`. 캡션이 그림과 떨어지지 않는다

## PDF 내보내기 (`scripts/export-pdf.mjs`)

인쇄 대화상자를 거치지 않고 한 명령으로 PDF를 만든다.

1. `vite preview --port 4173`을 자식 프로세스로 띄운다
2. Chrome 헤드리스로 `http://localhost:4173/`을 `--print-to-pdf=dist/portfolio.pdf`, `--no-pdf-header-footer`로 출력한다
3. preview를 내린다
4. 페이지 수를 출력한다

Chrome 경로는 macOS 기본(`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`)을 쓰고, `CHROME_PATH`
환경변수로 덮어쓸 수 있다. 다른 OS는 지원하지 않는다. `file://`로 열면 `crossorigin` 속성 때문에 CSS가 막히므로
반드시 HTTP로 연다.

스크립트: `"pdf": "vite build && node scripts/export-pdf.mjs"`. 루트에서는 `pnpm --filter portfolio pdf`.

## 검색 제외

- `index.html`: `<meta name="robots" content="noindex, nofollow">`
- `public/robots.txt`: `User-agent: *` / `Disallow: /`
- 블로그(`apps/web`)에서 링크하지 않는다. sitemap은 블로그 프로젝트 것이라 애초에 포함되지 않는다
- 이력서 Links 절에만 URL을 적는다

## 배포

### Vercel (사용자가 직접)

1. 대시보드에서 같은 GitHub 저장소를 한 번 더 import. 프로젝트 이름 `portfolio`
2. Root Directory `apps/portfolio`. Framework Preset은 Vite로 자동 인식
3. Production Branch `main`
4. Domains에 `portfolio.yjlogs.com` 추가. Vercel이 알려주는 CNAME 값을 Cloudflare DNS에 등록 (Proxy 상태는 DNS only 권장 — Vercel이 TLS를 발급한다)
5. 환경변수 없음

### 코드

`apps/portfolio/vercel.json`:

```json
{
  "ignoreCommand": "npx turbo-ignore"
}
```

블로그만 고친 커밋에는 포트폴리오가 배포되지 않는다.

### Discord 알림

`.github/workflows/discord-notify.yml`은 같은 커밋에 배포가 둘 생기면 두 번 발화한다. 메시지에 프로젝트를
구분할 수 있게 `github.event.deployment_status.environment_url`을 필드로 추가한다. 이 워크플로 수정은
포트폴리오 작업에 포함한다.

## 콘텐츠 작성 방식

- 언어: 한국어. 경어 없이 이력서와 같은 서술체
- 문장은 짧게. 한 문장에 판단 하나
- 숫자는 전후 비교로. "개선했다"가 아니라 "10분 → 7분"
- 팀 프로젝트는 본인 몫을 분명히. "설계·주도", "단독 개발"처럼
- 회사 프로젝트의 내부 명칭·데이터는 노출하지 않는다. 학원명·학생명은 캡처에서 가린다

### 사용자가 제공할 재료

| 프로젝트 | 필요한 것 |
|---|---|
| 학원관리 웹 | 가린 캡처 1~2장, 공개 표기용 제품명(내부명 `학온`을 그대로 쓸지) |
| Xamfinity 앱 | 스토어 스크린샷 1~2장, 스토어 URL |
| Ralli · GolfCounter | 없음. 블로그 public 이미지 복사 |
| yjlogs | 검색 유입 수치가 있으면 (없어도 됨) |

재료가 늦으면 자리에 회색 플레이스홀더 박스를 두고 텍스트부터 완성한다.

## 작업 순서

1. `develop`에서 `feature/portfolio` 브랜치
2. 스캐폴드: `package.json`, `vite.config.js`, `index.html`, `globals.css`, 빈 파티셜. `pnpm dev --filter portfolio`로 뜨는지 확인
3. 스타일 컴포넌트와 표지·목차·마무리
4. 프로젝트 장 넷을 하나씩. 각 장마다 PDF로 뽑아 페이지 나눔 확인
5. 구조도 SVG 넷
6. `export-pdf.mjs`, `robots.txt`, `vercel.json`, Discord 워크플로
7. 루트 README 표의 "예정" 제거, `.claude/launch.json`에 `portfolio` 항목 추가
8. PR → preview에서 확인 → `develop` → `main`
9. Vercel 프로젝트 생성·도메인 연결 (사용자)

## 검증 기준

| 항목 | 기준 |
|---|---|
| 빌드 | `pnpm build --filter portfolio` 통과, `dist/index.html` 단일 파일 + assets |
| 포맷 | `pnpm format:check` 통과 |
| PDF | `pnpm --filter portfolio pdf`로 생성. 장마다 새 페이지에서 시작, 그림·캡션이 쪼개지지 않음, 절 제목이 페이지 끝에 홀로 남지 않음 |
| 분량 | 전체 10~12페이지 |
| 검색 제외 | 응답 HTML에 noindex 메타, `/robots.txt`가 `Disallow: /` |
| 배포 | `portfolio.yjlogs.com` HTTPS 200. 블로그만 고친 커밋에 포트폴리오 배포 없음 |
| 알림 | Discord 메시지에 배포 URL 표시 |

## 리스크

- **캡처 지연.** 텍스트와 구조도를 먼저 완성하고 캡처는 플레이스홀더로 둔다. 캡처가 들어오면 크기만 맞춘다.
- **페이지 나눔.** 절이 페이지 끝에 걸리면 `break-inside: avoid`와 여백 조정으로 푼다. 이력서에서 쓴 헤드리스 측정 방식을 `export-pdf.mjs`가 대신한다.
- **Pretendard CDN 의존.** jsDelivr가 막히면 폰트가 시스템 폰트로 떨어진다. 인쇄 시점에 네트워크가 있으면 문제없다. 오프라인 대비가 필요해지면 폰트 파일을 `public/fonts`에 두는 것으로 바꾼다.
- **선행 스펙 의존.** `apps/` 구조와 pnpm이 `develop`에 머지된 뒤에 브랜치를 딴다. 그 전에 시작하면 이사 커밋과 충돌한다.
