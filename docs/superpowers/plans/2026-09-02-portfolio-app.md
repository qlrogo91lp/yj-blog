# 포트폴리오 앱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/portfolio`에 A4 문서형 포트폴리오 페이지를 만들고 `portfolio.yjlogs.com`에 배포한다. 같은 HTML이 웹과 PDF 둘 다가 된다.

**Architecture:** Vite 8 + Tailwind CSS v4, 프레임워크 없음. `index.html`의 `<!-- include: … -->` 지시어를 커스텀 플러그인이 파티셜 파일로 치환해 단일 `dist/index.html`을 만든다. 프로젝트 장 넷은 각각 파티셜 하나와 인라인 SVG 구조도 하나를 갖는다. 인쇄 규칙은 `@page`와 `break-*` 유틸리티로 통제한다.

**Tech Stack:** Vite 8, `@tailwindcss/vite` 4, Pretendard(jsDelivr), Chrome 헤드리스(PDF), Vercel

**Spec:** `docs/superpowers/specs/2026-09-02-portfolio-app-design.md`

## Global Constraints

- 선행: 모노레포 전환(`refactor/monorepo`)이 `develop`에 머지된 뒤 시작한다. `apps/web`, 루트 `pnpm-workspace.yaml`, `turbo.json`이 있어야 한다
- 워크스페이스 이름 `portfolio`. 루트에서 `pnpm --filter portfolio <script>`
- 프레임워크·상태관리·라우터 없음. HTML 파티셜 + Tailwind 유틸리티 + `@layer components`
- `tailwind.config.js` 없음. `globals.css`의 `@source`로 범위 지정
- 공개 정보: 이메일·GitHub·블로그만. 전화번호·주소·사진 없음
- 검색 제외: `<meta name="robots" content="noindex, nofollow">` + `public/robots.txt` `Disallow: /`
- 라이트 고정. 다크 모드 없음
- `@page { size: A4; margin: 14mm 12mm }`는 최상위에 둔다 (`@media print` 안에 넣지 않는다)
- 캡처 이미지는 사용자가 제공한다. 오기 전에는 `.figure-placeholder` 회색 상자로 자리를 잡는다
- 커밋 메시지 gitmoji prefix. 브랜치 `feature/portfolio` → PR to `develop` → `main`

---

## 사전 확인

```bash
cd /Users/yj/Workspace/yjlogs
git checkout develop && git pull --ff-only origin develop
ls apps/web/package.json pnpm-workspace.yaml turbo.json   # 셋 다 있어야 함
git status --short                                         # 비어 있어야 함
git checkout -b feature/portfolio
```

셋 중 하나라도 없으면 모노레포 전환이 아직 머지되지 않은 것이다. 멈추고 사용자에게 알린다.

## File Structure

| 경로 | 책임 |
|---|---|
| `apps/portfolio/package.json` | 워크스페이스 패키지, 스크립트 |
| `apps/portfolio/vite.config.js` | include 플러그인, base `./` |
| `apps/portfolio/vercel.json` | `ignoreCommand` |
| `apps/portfolio/index.html` | `<head>` 메타·폰트·CSS, `<body>` include 나열, 인쇄 버튼 |
| `apps/portfolio/public/robots.txt` | 크롤러 차단 |
| `apps/portfolio/public/{hakon,xamfinity,watch-apps,yjlogs}/` | 캡처 이미지 |
| `apps/portfolio/scripts/export-pdf.mjs` | preview + Chrome 헤드리스 → `dist/portfolio.pdf` |
| `apps/portfolio/src/globals.css` | 토큰, 문서 컴포넌트, 구조도 스타일, 인쇄 |
| `apps/portfolio/src/components/cover.html` | 표지 |
| `apps/portfolio/src/components/toc.html` | 목차 |
| `apps/portfolio/src/components/projects/hakon.html` | 1장 학원관리 웹 |
| `apps/portfolio/src/components/projects/xamfinity.html` | 2장 Xamfinity |
| `apps/portfolio/src/components/projects/watch-apps.html` | 3장 Ralli · GolfCounter |
| `apps/portfolio/src/components/projects/yjlogs.html` | 4장 yjlogs |
| `apps/portfolio/src/components/closing.html` | 링크 |
| `apps/portfolio/src/diagrams/hakon-pipeline.svg` | 배포 파이프라인 구조도 |
| `apps/portfolio/src/diagrams/xamfinity-bridge.svg` | 네이티브↔웹뷰 브리지 구조도 |
| `apps/portfolio/src/diagrams/watch-apps-yjkit.svg` | YJKit 의존 관계 구조도 |
| `apps/portfolio/src/diagrams/yjlogs-stack.svg` | 스택 배치 구조도 |
| `.github/workflows/discord-notify.yml` | 배포 URL 필드 추가 |
| `README.md` (루트) | 포트폴리오 행의 "(예정)" 제거 |
| `.claude/launch.json` | `portfolio` 항목 추가 |

---

### Task 1: 스캐폴드

**Files:**
- Create: `apps/portfolio/package.json`, `apps/portfolio/vite.config.js`, `apps/portfolio/vercel.json`, `apps/portfolio/index.html`, `apps/portfolio/public/robots.txt`, `apps/portfolio/src/globals.css`(최소), `apps/portfolio/src/components/cover.html`(임시 한 줄)

**Interfaces:**
- Produces: include 지시어 형식 `<!-- include: src/components/<파일> -->`. 경로는 `apps/portfolio/` 기준. 이후 모든 파티셜과 SVG가 이 형식으로 들어간다.

- [ ] **Step 1: `package.json`**

```json
{
  "name": "portfolio",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "pdf": "vite build && node scripts/export-pdf.mjs"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "tailwindcss": "^4.3.3",
    "vite": "^8.1.5"
  }
}
```

- [ ] **Step 2: `vite.config.js`**

```js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// `<!-- include: src/components/foo.html -->` 를 파일 내용으로 치환한다.
// 치환된 내용 안의 include 지시어도 처리하도록 재귀한다 (파티셜 안의 SVG include용).
function includePlugin() {
  const pattern = /<!--\s*include:\s*(.+?)\s*-->/g;
  function expand(html, depth = 0) {
    if (depth > 5) return html;
    return html.replace(pattern, (match, filePath) => {
      const fullPath = resolve(__dirname, filePath);
      try {
        return expand(readFileSync(fullPath, 'utf-8'), depth + 1);
      } catch (error) {
        console.error(`Failed to include ${fullPath}:`, error.message);
        return match;
      }
    });
  }
  return {
    name: 'include-plugin',
    transformIndexHtml(html) {
      return expand(html);
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  base: './',
  plugins: [tailwindcss(), includePlugin()],
});
```

- [ ] **Step 3: `vercel.json`, `public/robots.txt`**

`vercel.json`:

```json
{
  "ignoreCommand": "npx turbo-ignore"
}
```

`public/robots.txt`:

```
User-agent: *
Disallow: /
```

- [ ] **Step 4: `index.html`**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>김윤재 — Portfolio</title>
    <link
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
      rel="stylesheet"
    />
    <link href="/src/globals.css" rel="stylesheet" />
  </head>
  <body class="bg-page text-primary print:bg-white">
    <button
      type="button"
      onclick="window.print()"
      class="print:hidden fixed top-4 right-4 z-10 text-xs font-semibold text-white bg-accent px-3 py-1.5 rounded shadow hover:opacity-90"
    >
      PDF로 저장
    </button>

    <div class="doc">
      <!-- include: src/components/cover.html -->
      <!-- include: src/components/toc.html -->
      <!-- include: src/components/projects/hakon.html -->
      <!-- include: src/components/projects/xamfinity.html -->
      <!-- include: src/components/projects/watch-apps.html -->
      <!-- include: src/components/projects/yjlogs.html -->
      <!-- include: src/components/closing.html -->
    </div>
  </body>
</html>
```

- [ ] **Step 5: 최소 `globals.css`와 임시 파티셜**

`src/globals.css` (Task 2에서 전체로 교체한다):

```css
@import 'tailwindcss';
@source '../index.html';
@source './components';

@theme {
  --color-primary: #1a1d24;
  --color-accent: #1f4e79;
  --color-page: #f0f2f5;
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
}

.doc {
  @apply max-w-205 mx-auto my-6 bg-white px-12 pt-11 pb-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] print:my-0 print:max-w-full print:shadow-none print:px-1;
}

@page {
  size: A4;
  margin: 14mm 12mm;
}
```

`src/components/cover.html`, `toc.html`, `closing.html`, `projects/hakon.html`, `projects/xamfinity.html`, `projects/watch-apps.html`, `projects/yjlogs.html` 일곱 파일을 만들고 각각 다음 한 줄만 둔다 (파일명만 다르게).

```html
<section><!-- cover --></section>
```

- [ ] **Step 6: 설치 및 dev 확인**

```bash
cd /Users/yj/Workspace/yjlogs
pnpm install 2>&1 | tail -3
pnpm --filter portfolio dev &
sleep 4
curl -s http://localhost:5173/ | grep -c 'PDF로 저장'
kill %1
```

Expected: `pnpm install`이 `portfolio`를 워크스페이스로 잡고, curl 결과가 `1`.

- [ ] **Step 7: 빌드 확인**

```bash
pnpm --filter portfolio build 2>&1 | tail -5
grep -c 'include:' apps/portfolio/dist/index.html
grep -o 'noindex, nofollow' apps/portfolio/dist/index.html
ls apps/portfolio/dist/robots.txt
```

Expected: 빌드 성공. include 지시어 남은 개수 `0`. noindex 메타 존재. robots.txt가 dist에 복사됨.

- [ ] **Step 8: 커밋**

```bash
git add apps/portfolio pnpm-lock.yaml
git commit -m "🎉 feat(portfolio): Vite + Tailwind 스캐폴드

include 플러그인, noindex 메타, robots.txt, vercel.json ignoreCommand."
```

---

### Task 2: 스타일 컴포넌트, 표지, 목차, 마무리

**Files:**
- Modify: `apps/portfolio/src/globals.css` (전체 교체)
- Modify: `apps/portfolio/src/components/cover.html`, `toc.html`, `closing.html`

**Interfaces:**
- Produces: 문서 컴포넌트 클래스 `.page`, `.chapter-head`, `.chapter-no`, `.chapter-title`, `.chapter-summary`, `.meta-table`, `.section-h`, `.figure`, `.figure-placeholder`, `.figure-caption`, `.figure-row`, `.kpi`, `.kpi-from`, `.kpi-to`, `.callout`, `.compare-table`, `.bullet`, `.stack`. 구조도용 `.dg-box`, `.dg-box-soft`, `.dg-text`, `.dg-label`, `.dg-line`. Task 3~6의 장 파티셜이 이 이름을 그대로 쓴다.

- [ ] **Step 1: `globals.css` 전체**

```css
@import 'tailwindcss';
@source '../index.html';
@source './components';

@theme {
  /* 텍스트 톤 4단계 (진한 순) */
  --color-primary: #1a1d24;
  --color-secondary: #2f3540;
  --color-tertiary: #5a6472;
  --color-muted: #8a929e;
  --color-line: #e3e6eb;
  --color-accent: #1f4e79;
  --color-accent-soft: #eef2f7;
  --color-surface: #f4f6f9;
  --color-page: #f0f2f5;

  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

  /* 이력서보다 한 단계 크게. 본문 12.5px, 행간 1.6 */
  --text-2xs: 11px;
  --text-2xs--line-height: 1.55;
  --text-xs: 11.5px;
  --text-xs--line-height: 1.55;
  --text-base: 12.5px;
  --text-base--line-height: 1.6;
  --text-h: 14px;
  --text-h--line-height: 1.4;
  --text-title: 22px;
  --text-title--line-height: 1.25;
}

@layer base {
  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: var(--text-base--line-height);
    letter-spacing: -0.01em;
  }
}

@layer components {
  /* 종이 */
  .doc {
    @apply max-w-205 mx-auto my-6 bg-white px-12 pt-11 pb-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] print:my-0 print:max-w-full print:shadow-none print:px-1 print:pt-0;
  }

  /* 프로젝트 장. 항상 새 페이지에서 시작 */
  .page {
    @apply break-before-page pt-2;
  }

  /* 장 헤더 */
  .chapter-head {
    @apply pb-3 mb-4 border-b-2 border-accent;
  }
  .chapter-no {
    @apply text-xs font-extrabold tracking-[0.12em] text-accent uppercase;
  }
  .chapter-title {
    @apply text-title font-extrabold tracking-[-0.02em] mt-1;
  }
  .chapter-summary {
    @apply text-sm text-tertiary mt-1.5;
  }

  /* 기간·역할·인원·스택 */
  .meta-table {
    @apply grid grid-cols-[72px_1fr] gap-x-3 gap-y-1 text-xs mt-3;
  }
  .meta-table dt {
    @apply text-muted font-semibold;
  }
  .meta-table dd {
    @apply text-secondary;
  }

  /* 절 제목 */
  .section-h {
    @apply text-h font-bold text-accent mt-5 mb-2 flex items-center gap-2 break-after-avoid;
  }
  .section-h::before {
    content: '';
    @apply inline-block w-1 h-3.5 bg-accent rounded-sm;
  }

  /* 본문 */
  .bullet {
    @apply relative pl-3.5 text-secondary;
  }
  .bullet::before {
    content: '';
    @apply absolute left-0 top-[8px] w-1 h-1 rounded-full bg-accent opacity-55;
  }
  .stack {
    @apply text-2xs text-accent bg-accent-soft inline-block px-2 py-0.5 rounded-[3px];
  }

  /* 그림 */
  .figure {
    @apply break-inside-avoid my-3;
  }
  .figure img,
  .figure svg {
    @apply block max-w-full mx-auto rounded border border-line;
  }
  .figure-row {
    @apply grid grid-cols-2 gap-3;
  }
  .figure-placeholder {
    @apply w-full bg-surface border border-dashed border-line rounded flex items-center justify-center text-xs text-muted;
  }
  .figure-caption {
    @apply text-2xs text-muted text-center mt-1.5;
  }

  /* 결과 숫자 */
  .kpi {
    @apply inline-flex items-baseline gap-1.5 bg-accent-soft px-2.5 py-1 rounded;
  }
  .kpi-from {
    @apply text-xs text-muted line-through;
  }
  .kpi-to {
    @apply text-h font-extrabold text-accent;
  }

  /* 왜 이걸 골랐나 */
  .callout {
    @apply border-l-2 border-accent bg-accent-soft px-3 py-2 my-2 text-secondary rounded-r break-inside-avoid;
  }

  /* 대안 비교 */
  .compare-table {
    @apply w-full text-xs mt-2 border-collapse break-inside-avoid;
  }
  .compare-table th {
    @apply text-left font-semibold text-muted border-b border-line pb-1 pr-3;
  }
  .compare-table td {
    @apply align-top border-b border-line py-1.5 pr-3 text-secondary;
  }

  /* 구조도 (인라인 SVG) */
  .dg-box {
    fill: var(--color-accent-soft);
    stroke: var(--color-accent);
    stroke-width: 1;
  }
  .dg-box-soft {
    fill: var(--color-surface);
    stroke: var(--color-line);
    stroke-width: 1;
  }
  .dg-text {
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 600;
    fill: var(--color-primary);
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .dg-label {
    font-family: var(--font-sans);
    font-size: 9.5px;
    fill: var(--color-tertiary);
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .dg-line {
    stroke: var(--color-accent);
    stroke-width: 1.2;
    fill: none;
    marker-end: url(#arrow);
  }
}

/* @media print 안에 넣으면 Chrome이 용지 크기를 무시하므로 최상위에 둔다 */
@page {
  size: A4;
  margin: 14mm 12mm;
}

@media print {
  body {
    background: #fff !important;
  }
}
```

- [ ] **Step 2: `cover.html`**

```html
<header class="min-h-[60vh] print:min-h-[220mm] flex flex-col justify-between">
  <div>
    <div class="text-xs font-extrabold tracking-[0.12em] text-accent uppercase">Portfolio</div>
    <h1 class="text-[40px] font-extrabold tracking-[-0.03em] leading-[1.1] mt-6">김윤재</h1>
    <div class="text-h text-accent font-semibold mt-2">Frontend / App Developer · 6년차</div>
    <p class="text-sm text-secondary leading-[1.7] mt-6 max-w-[520px]">
      백엔드·데이터 엔지니어링에서 출발해 지금은 React/Next.js 웹과 Flutter 앱을 중심으로 서비스를
      처음부터 끝까지 만들어 온 개발자입니다. 학원관리 플랫폼의 웹과 앱을 개발·출시·운영하며 성능과
      사용자 경험을 개선했고, 개인적으로 iOS/watchOS 앱을 App Store에 출시해 기획부터 배포·운영까지
      전체 사이클을 경험했습니다.
    </p>
    <p class="text-sm text-secondary leading-[1.7] mt-3 max-w-[520px]">
      이 문서는 그중 네 개 프로젝트를 "왜 그렇게 만들었는가"를 중심으로 정리한 것입니다.
    </p>
  </div>
  <div class="text-xs text-tertiary flex flex-wrap gap-x-5 gap-y-1 pt-6 border-t border-line">
    <span>qlrogo91lp@naver.com</span>
    <span>github.com/qlrogo91lp</span>
    <span>yjlogs.com</span>
  </div>
</header>
```

- [ ] **Step 3: `toc.html`**

```html
<section class="page">
  <div class="chapter-head">
    <div class="chapter-no">Contents</div>
    <div class="chapter-title">목차</div>
  </div>
  <ol class="mt-4 space-y-4">
    <li class="grid grid-cols-[32px_1fr_auto] gap-x-3 items-baseline">
      <span class="text-h font-extrabold text-accent">01</span>
      <div>
        <div class="font-bold">학원관리 시스템 웹</div>
        <div class="text-xs text-tertiary mt-0.5">
          PHP 레거시를 Next.js로 재구축하고 배포 파이프라인까지 다시 만든 회사 프로젝트
        </div>
      </div>
      <span class="text-xs text-muted whitespace-nowrap">2025.05 – 현재</span>
    </li>
    <li class="grid grid-cols-[32px_1fr_auto] gap-x-3 items-baseline">
      <span class="text-h font-extrabold text-accent">02</span>
      <div>
        <div class="font-bold">Xamfinity 하이브리드 앱</div>
        <div class="text-xs text-tertiary mt-0.5">
          네이티브 두 벌을 Flutter + WebView(React) 한 벌로 바꾼 학생·학부모용 앱
        </div>
      </div>
      <span class="text-xs text-muted whitespace-nowrap">2024.02 – 2024.12</span>
    </li>
    <li class="grid grid-cols-[32px_1fr_auto] gap-x-3 items-baseline">
      <span class="text-h font-extrabold text-accent">03</span>
      <div>
        <div class="font-bold">Ralli · GolfCounter</div>
        <div class="text-xs text-tertiary mt-0.5">
          워치가 메인 입력인 스포츠 기록 앱 2종. 공통 패키지 분리와 모노레포, App Store 출시
        </div>
      </div>
      <span class="text-xs text-muted whitespace-nowrap">2026.05 – 현재</span>
    </li>
    <li class="grid grid-cols-[32px_1fr_auto] gap-x-3 items-baseline">
      <span class="text-h font-extrabold text-accent">04</span>
      <div>
        <div class="font-bold">yjlogs</div>
        <div class="text-xs text-tertiary mt-0.5">
          DB·인증·스토리지·배포를 직접 고른 개인 블로그. 이 포트폴리오가 올라가 있는 곳
        </div>
      </div>
      <span class="text-xs text-muted whitespace-nowrap">2026.04 – 현재</span>
    </li>
  </ol>
</section>
```

- [ ] **Step 4: `closing.html`**

```html
<section class="page">
  <div class="chapter-head">
    <div class="chapter-no">Links</div>
    <div class="chapter-title">링크</div>
  </div>
  <dl class="meta-table mt-4" style="grid-template-columns: 88px 1fr">
    <dt>GitHub</dt>
    <dd><a href="https://github.com/qlrogo91lp" class="text-accent">github.com/qlrogo91lp</a></dd>
    <dt>Blog</dt>
    <dd><a href="https://yjlogs.com" class="text-accent">yjlogs.com</a></dd>
    <dt>Ralli</dt>
    <dd>
      <a href="https://apps.apple.com/kr/app/ralli/id6449350578" class="text-accent">
        apps.apple.com/kr/app/ralli/id6449350578
      </a>
    </dd>
    <dt>GolfCounter</dt>
    <dd>
      <a href="https://apps.apple.com/kr/app/id6448967372" class="text-accent">
        apps.apple.com/kr/app/id6448967372
      </a>
    </dd>
    <dt>Email</dt>
    <dd>qlrogo91lp@naver.com</dd>
  </dl>
</section>
```

- [ ] **Step 5: 빌드와 화면 확인**

```bash
pnpm --filter portfolio build 2>&1 | tail -3
grep -c 'chapter-title' apps/portfolio/dist/index.html
```

Expected: 빌드 성공, `chapter-title`이 2회 이상(목차·링크).

- [ ] **Step 6: 커밋**

```bash
git add apps/portfolio
git commit -m "💄 feat(portfolio): 문서 스타일 컴포넌트와 표지·목차·링크"
```

---

### Task 3: 1장 학원관리 시스템 웹

**Files:**
- Create: `apps/portfolio/src/diagrams/hakon-pipeline.svg`
- Modify: `apps/portfolio/src/components/projects/hakon.html`

**Interfaces:**
- Consumes: Task 2의 컴포넌트 클래스.
- 이미지: `public/hakon/dashboard.png`, `public/hakon/attendance-monitor.png` (사용자 제공). 없으면 `.figure-placeholder`.

- [ ] **Step 1: 구조도 `hakon-pipeline.svg`**

이전(서버 직접 빌드)과 이후(GitHub Actions → GHCR → 서버 pull)를 위아래로 둔다.

```svg
<svg viewBox="0 0 720 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="배포 파이프라인 전후 비교">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f4e79" />
    </marker>
  </defs>

  <!-- Before -->
  <text x="14" y="22" class="dg-label" text-anchor="start">Before — 서버가 직접 빌드</text>
  <rect x="14" y="34" width="120" height="40" rx="6" class="dg-box-soft" />
  <text x="74" y="54" class="dg-text">git push</text>
  <path d="M134,54 L214,54" class="dg-line" />
  <rect x="216" y="34" width="200" height="40" rx="6" class="dg-box-soft" />
  <text x="316" y="48" class="dg-text">운영 서버</text>
  <text x="316" y="63" class="dg-label">git pull → npm install → build → 재시작</text>
  <text x="316" y="88" class="dg-label">빌드 중 CPU·메모리 점유, 약 10분</text>

  <!-- After -->
  <text x="14" y="122" class="dg-label" text-anchor="start">After — 이미지 배포</text>
  <rect x="14" y="134" width="120" height="40" rx="6" class="dg-box" />
  <text x="74" y="154" class="dg-text">git push</text>
  <path d="M134,154 L194,154" class="dg-line" />
  <rect x="196" y="134" width="150" height="40" rx="6" class="dg-box" />
  <text x="271" y="148" class="dg-text">GitHub Actions</text>
  <text x="271" y="163" class="dg-label">Docker build · 실행 파일만</text>
  <path d="M346,154 L406,154" class="dg-line" />
  <rect x="408" y="134" width="110" height="40" rx="6" class="dg-box" />
  <text x="463" y="148" class="dg-text">GHCR</text>
  <text x="463" y="163" class="dg-label">이미지 500MB</text>
  <path d="M518,154 L578,154" class="dg-line" />
  <rect x="580" y="134" width="126" height="40" rx="6" class="dg-box" />
  <text x="643" y="148" class="dg-text">운영 서버</text>
  <text x="643" y="163" class="dg-label">pull → 재시작</text>
  <text x="360" y="192" class="dg-label">서버는 빌드하지 않는다. 약 7분, Slack에 배포 알림</text>
</svg>
```

- [ ] **Step 2: `hakon.html`**

```html
<section class="page">
  <div class="chapter-head">
    <div class="chapter-no">01 · 회사 프로젝트</div>
    <div class="chapter-title">학원관리 시스템 웹</div>
    <div class="chapter-summary">
      36개 학원, 약 7,000명이 쓰던 PHP 레거시를 Next.js로 다시 만들고 배포 파이프라인까지 재설계
    </div>
    <dl class="meta-table">
      <dt>기간</dt>
      <dd>2025.09 – 현재 (재구축) · 2025.05 – 2026.05 (배포 자동화)</dd>
      <dt>역할</dt>
      <dd>프론트엔드 설계·구현 전담, 배포 파이프라인 설계·주도</dd>
      <dt>인원</dt>
      <dd>프론트엔드 1 (본인) · 백엔드 협업</dd>
      <dt>스택</dt>
      <dd>
        <span class="stack">Next.js · TypeScript · TailwindCSS · TanStack Query · Zustand · Socket.io · Vitest · Storybook · Docker · GitHub Actions · GHCR</span>
      </dd>
    </dl>
  </div>

  <h3 class="section-h">개요</h3>
  <p class="text-secondary">
    학원 운영자가 출결, 수납, 상담, 공지를 한곳에서 처리하는 관리 시스템이다. 원래는 PHP로 만들어진
    레거시였고, 학원 36곳에서 약 7,000명이 쓰고 있었다. 이 시스템을 Next.js·TypeScript 기반으로 새로
    설계해 구축했고, 현재 약 500명 규모(일 약 160건 출결)로 베타 운영 중이다.
  </p>
  <div class="figure">
    <div class="figure-placeholder" style="aspect-ratio: 16 / 9">대시보드 화면 (학원명·학생 정보 가림)</div>
    <div class="figure-caption">재구축한 관리자 대시보드. 학원명과 학생 정보는 가렸다.</div>
  </div>

  <h3 class="section-h">문제</h3>
  <ul class="space-y-1">
    <li class="bullet">
      페이지 이동마다 전체 리로드가 일어나 화면이 깜박였고, 출결처럼 자주 오가는 화면에서 체감이 컸다.
    </li>
    <li class="bullet">
      출결은 QR 스캔으로 들어오는데, 관리자 화면은 새로고침해야 반영됐다. 실시간으로 봐야 할 정보가
      실시간이 아니었다.
    </li>
    <li class="bullet">
      배포는 운영 서버에서 직접 빌드했다. 빌드 동안 서버 리소스를 점유했고, 이미지가 약 2.4GB라 전체
      과정이 약 10분 걸렸다.
    </li>
    <li class="bullet">
      공통 컴포넌트에 문서가 없고 테스트도 없어, 화면을 고칠 때마다 다른 화면이 깨지는지 손으로 확인했다.
    </li>
  </ul>

  <h3 class="section-h">접근과 선택</h3>
  <p class="text-secondary">
    레거시를 고쳐 쓸지, 새로 만들지가 첫 결정이었다. PHP 코드는 화면과 로직이 섞여 있어 부분 개선으로는
    깜박임과 실시간성 문제를 풀 수 없다고 판단했고, 신규 구축을 제안해 주도했다.
  </p>
  <table class="compare-table">
    <thead>
      <tr><th>선택지</th><th>장점</th><th>탈락 이유</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>PHP 위에 부분 개선</td>
        <td>당장 비용이 작다</td>
        <td>화면 전환 구조 자체가 문제라 근본 해결이 안 된다</td>
      </tr>
      <tr>
        <td>React SPA</td>
        <td>전환은 매끄럽다</td>
        <td>초기 로딩이 길고, 관리 화면이 많아 라우팅·코드 분리를 직접 관리해야 한다</td>
      </tr>
      <tr>
        <td><b>Next.js (채택)</b></td>
        <td>파일 기반 라우팅, SSR·코드 스플리팅이 기본, prefetch로 전환 체감 개선</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
  <div class="callout">
    화면 수가 많은 관리 시스템에서는 "라우팅과 코드 분리를 프레임워크가 해주는가"가 유지보수 비용을
    결정한다. Next.js를 고른 이유는 성능보다 이쪽이 컸다.
  </div>

  <h3 class="section-h">구현</h3>
  <ul class="space-y-1">
    <li class="bullet">
      <b>화면 전환.</b> 파일 기반 라우팅 위에 SSR과 코드 스플리팅을 두고, 자주 오가는 경로는 prefetch로
      미리 받아 깜박임을 없앴다.
    </li>
    <li class="bullet">
      <b>실시간 출결 모니터링.</b> QR 스캔 이벤트를 Socket.io로 받아 관리자 화면에 즉시 반영한다.
      새로고침 없이 지금 누가 들어왔는지 보인다.
    </li>
    <li class="bullet">
      <b>배포 파이프라인.</b> 서버 직접 빌드를 GitHub Actions에서 Docker 이미지를 만들어 GHCR에 올리고
      서버는 pull만 하는 구조로 바꿨다. 실행에 필요한 파일만 이미지에 넣어 크기를 줄였다.
    </li>
    <li class="bullet">
      <b>협업 기반.</b> Storybook으로 공통 컴포넌트를 문서화하고 Vitest로 핵심 로직을 테스트한다.
      문의 확인이 늦어지는 문제는 Slack을 도입하고 Webhook·GitHub Actions를 연동해 실시간 알림으로 풀었다.
    </li>
  </ul>
  <div class="figure">
    <!-- include: src/diagrams/hakon-pipeline.svg -->
    <div class="figure-caption">배포 파이프라인 전후. 서버가 빌드하지 않는 구조로 바꿨다.</div>
  </div>

  <h3 class="section-h">결과</h3>
  <div class="flex flex-wrap gap-2 mb-2">
    <span class="kpi"><span class="text-xs text-muted">Docker 이미지</span><span class="kpi-from">2.4GB</span><span class="kpi-to">500MB</span></span>
    <span class="kpi"><span class="text-xs text-muted">빌드·배포</span><span class="kpi-from">10분</span><span class="kpi-to">7분</span></span>
    <span class="kpi"><span class="text-xs text-muted">서버 빌드 부하</span><span class="kpi-to">0</span></span>
  </div>
  <ul class="space-y-1">
    <li class="bullet">약 500명 규모, 일 약 160건 출결로 베타 운영 중. 전체 전환은 학원 단위로 진행한다.</li>
    <li class="bullet">페이지 전환 깜박임 제거, 초기 로딩 개선. 출결 모니터링은 새로고침 없이 실시간 반영.</li>
  </ul>
  <div class="figure">
    <div class="figure-placeholder" style="aspect-ratio: 16 / 9">실시간 출결 모니터링 화면 (정보 가림)</div>
    <div class="figure-caption">QR 스캔 출결이 WebSocket으로 즉시 반영되는 모니터링 페이지.</div>
  </div>

  <h3 class="section-h">회고</h3>
  <p class="text-secondary">
    신규 구축을 결정할 때 레거시의 데이터 구조까지 같이 바꾸지 않은 것은 옳았다. 화면을 먼저 바꾸고
    데이터는 그대로 두니 학원 단위로 점진 전환이 가능했다. 아쉬운 점은 테스트를 나중에 붙인 것이다.
    처음부터 핵심 로직에 Vitest를 두었다면 재구축 초반의 회귀를 더 빨리 잡았을 것이다.
  </p>
</section>
```

- [ ] **Step 3: 빌드 확인**

```bash
pnpm --filter portfolio build 2>&1 | tail -3
grep -c 'hakon-pipeline\|aria-label="배포 파이프라인' apps/portfolio/dist/index.html
```

Expected: 빌드 성공. SVG가 인라인으로 들어가 `aria-label` 문자열이 1회 검출된다.

- [ ] **Step 4: 커밋**

```bash
git add apps/portfolio
git commit -m "✨ feat(portfolio): 1장 학원관리 시스템 웹"
```

---

### Task 4: 2장 Xamfinity 하이브리드 앱

**Files:**
- Create: `apps/portfolio/src/diagrams/xamfinity-bridge.svg`
- Modify: `apps/portfolio/src/components/projects/xamfinity.html`

**Interfaces:**
- 이미지: `public/xamfinity/store-1.png`, `public/xamfinity/store-2.png` (사용자 제공 스토어 스크린샷, 세로). 없으면 placeholder 두 장을 `.figure-row`에.

- [ ] **Step 1: 구조도 `xamfinity-bridge.svg`**

```svg
<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Flutter와 WebView 사이의 브리지 구조">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f4e79" />
    </marker>
  </defs>

  <!-- Flutter shell -->
  <rect x="14" y="14" width="300" height="200" rx="8" class="dg-box-soft" />
  <text x="164" y="32" class="dg-label">Flutter (iOS · Android 단일 코드)</text>
  <rect x="30" y="48" width="130" height="34" rx="6" class="dg-box" />
  <text x="95" y="65" class="dg-text">인앱결제</text>
  <rect x="170" y="48" width="130" height="34" rx="6" class="dg-box" />
  <text x="235" y="65" class="dg-text">푸시 (FCM)</text>
  <rect x="30" y="92" width="130" height="34" rx="6" class="dg-box" />
  <text x="95" y="109" class="dg-text">Remote Config</text>
  <rect x="170" y="92" width="130" height="34" rx="6" class="dg-box" />
  <text x="235" y="109" class="dg-text">Crashlytics</text>
  <rect x="30" y="136" width="130" height="34" rx="6" class="dg-box" />
  <text x="95" y="153" class="dg-text">Kiosk · 자동 업데이트</text>
  <rect x="170" y="136" width="130" height="34" rx="6" class="dg-box" />
  <text x="235" y="153" class="dg-text">WebView 컨테이너</text>
  <text x="164" y="196" class="dg-label">네이티브 권한·결제·알림처럼 웹으로 안 되는 것만</text>

  <!-- bridge -->
  <path d="M316,96 L404,96" class="dg-line" />
  <text x="360" y="84" class="dg-label">MethodChannel</text>
  <text x="360" y="108" class="dg-label">네이티브 → 웹 호출</text>
  <path d="M404,140 L316,140" class="dg-line" />
  <text x="360" y="128" class="dg-label">EventChannel</text>
  <text x="360" y="152" class="dg-label">웹 → 네이티브 이벤트</text>

  <!-- Web -->
  <rect x="406" y="14" width="300" height="200" rx="8" class="dg-box-soft" />
  <text x="556" y="32" class="dg-label">React 모바일 웹 (WebView 안)</text>
  <rect x="422" y="48" width="268" height="34" rx="6" class="dg-box" />
  <text x="556" y="65" class="dg-text">출결 · 수납 · 공지 · 상담 화면</text>
  <rect x="422" y="92" width="268" height="34" rx="6" class="dg-box" />
  <text x="556" y="109" class="dg-text">TanStack Query · Recoil</text>
  <rect x="422" y="136" width="268" height="34" rx="6" class="dg-box" />
  <text x="556" y="153" class="dg-text">Vanilla Extract CSS</text>
  <text x="556" y="196" class="dg-label">화면과 비즈니스 로직. 배포는 웹만 다시 하면 된다</text>
</svg>
```

- [ ] **Step 2: `xamfinity.html`**

```html
<section class="page">
  <div class="chapter-head">
    <div class="chapter-no">02 · 회사 프로젝트</div>
    <div class="chapter-title">Xamfinity 하이브리드 앱</div>
    <div class="chapter-summary">
      iOS·Android 네이티브 두 벌을 Flutter + WebView(React) 한 벌로 바꾼 학생·학부모용 학원 앱
    </div>
    <dl class="meta-table">
      <dt>기간</dt>
      <dd>2024.02 – 2024.12 (개발·출시) · 이후 운영</dd>
      <dt>역할</dt>
      <dd>크로스플랫폼 구조 설계·주도, Flutter 앱과 React 웹 개발, 스토어 배포</dd>
      <dt>인원</dt>
      <dd>앱·웹 1 (본인) · 백엔드 협업</dd>
      <dt>스택</dt>
      <dd>
        <span class="stack">Flutter · Riverpod · Firebase (Messaging · Analytics · Remote Config · Crashlytics) · React · TypeScript · Vanilla Extract · TanStack Query · Recoil · Fastlane</span>
      </dd>
    </dl>
  </div>

  <h3 class="section-h">개요</h3>
  <p class="text-secondary">
    학생과 학부모가 출결 확인, 수납, 공지, 상담 신청을 하는 앱이다. iOS와 Android 양쪽 스토어에 출시해
    운영 중이며, 합산 누적 약 8,000 다운로드, 월 활성 사용자 약 3,000명이다.
  </p>
  <div class="figure">
    <div class="figure-row">
      <div class="figure-placeholder" style="aspect-ratio: 9 / 16">스토어 스크린샷 1</div>
      <div class="figure-placeholder" style="aspect-ratio: 9 / 16">스토어 스크린샷 2</div>
    </div>
    <div class="figure-caption">App Store · Google Play 스크린샷.</div>
  </div>

  <h3 class="section-h">문제</h3>
  <ul class="space-y-1">
    <li class="bullet">
      iOS와 Android를 각각의 네이티브 코드로 관리하고 있었다. 같은 기능을 두 번 만들고, 두 번 고치고,
      두 번 배포했다.
    </li>
    <li class="bullet">
      화면 변경이 잦은 앱인데 매번 스토어 심사를 거쳐야 했다. 작은 문구 수정도 며칠이 걸렸다.
    </li>
    <li class="bullet">
      스토어 업로드가 수동이라 빌드 번호, 서명, 스크린샷 관리에서 실수가 반복됐다.
    </li>
  </ul>

  <h3 class="section-h">접근과 선택</h3>
  <p class="text-secondary">
    핵심 질문은 "무엇을 네이티브로 두고 무엇을 웹으로 보낼 것인가"였다. 결제·푸시·기기 권한처럼 웹으로
    안 되는 것만 네이티브에 남기고, 화면과 비즈니스 로직은 WebView 안의 React 웹으로 옮겼다.
  </p>
  <table class="compare-table">
    <thead>
      <tr><th>선택지</th><th>장점</th><th>탈락 이유</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>네이티브 유지</td>
        <td>성능·플랫폼 기능 최대</td>
        <td>코드 두 벌, 배포 두 번. 팀 규모에 비해 비용이 크다</td>
      </tr>
      <tr>
        <td>Flutter 순수 앱</td>
        <td>한 벌 코드</td>
        <td>화면 변경마다 스토어 심사. 웹팀 자산(React)을 못 쓴다</td>
      </tr>
      <tr>
        <td><b>Flutter + WebView(React) (채택)</b></td>
        <td>한 벌 코드, 화면은 웹 배포로 즉시 반영, 네이티브 기능은 Flutter가 담당</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
  <div class="callout">
    하이브리드의 성패는 브리지 경계에서 갈린다. 네이티브가 해야 할 일의 목록을 먼저 확정하고, 그
    외에는 전부 웹으로 보냈다. 경계가 흐려지면 두 벌 관리로 되돌아간다.
  </div>

  <h3 class="section-h">구현</h3>
  <ul class="space-y-1">
    <li class="bullet">
      <b>양방향 브리지.</b> Flutter → 웹은 MethodChannel, 웹 → Flutter는 EventChannel로 연결했다.
      로그인 토큰 전달, 결제 결과 반환, 푸시 탭 시 화면 이동이 이 통로로 오간다.
    </li>
    <li class="bullet">
      <b>네이티브 기능.</b> 인앱결제, FCM 푸시, Remote Config로 기능 플래그, Crashlytics 에러 수집.
      Android는 학원 공용 태블릿용 Kiosk 모드와 자동 업데이트를 추가했다.
    </li>
    <li class="bullet">
      <b>배포 자동화.</b> Fastlane으로 빌드·서명·업로드를 묶어 iOS 빌드는 App Store Connect로,
      Android 빌드는 Google Play로 자동 올라간다. 수동 배포 절차를 없앴다.
    </li>
  </ul>
  <div class="figure">
    <!-- include: src/diagrams/xamfinity-bridge.svg -->
    <div class="figure-caption">네이티브가 맡는 것과 웹이 맡는 것, 그 사이의 두 채널.</div>
  </div>

  <h3 class="section-h">결과</h3>
  <div class="flex flex-wrap gap-2 mb-2">
    <span class="kpi"><span class="text-xs text-muted">누적 다운로드</span><span class="kpi-to">약 8,000</span></span>
    <span class="kpi"><span class="text-xs text-muted">월 활성 사용자</span><span class="kpi-to">약 3,000</span></span>
    <span class="kpi"><span class="text-xs text-muted">현재 버전 비정상 종료</span><span class="kpi-to">0건</span></span>
  </div>
  <ul class="space-y-1">
    <li class="bullet">단일 코드베이스로 양 플랫폼 운영. 화면 수정은 웹 배포로 즉시 반영, 스토어 심사는 네이티브 변경 때만.</li>
    <li class="bullet">Crashlytics 기준 현재 버전 안정성 100%. 두 스토어 업로드가 명령 한 번으로 끝난다.</li>
  </ul>

  <h3 class="section-h">회고</h3>
  <p class="text-secondary">
    브리지 API를 처음부터 문서로 고정해 둔 것이 가장 잘한 일이다. 웹과 앱이 따로 개발돼도 계약이
    흔들리지 않았다. 아쉬운 점은 WebView 초기 로딩이다. 첫 화면을 네이티브로 두고 그 뒤부터 웹을 띄우는
    구조였다면 첫 인상이 더 빨랐을 것이다.
  </p>
</section>
```

- [ ] **Step 3: 빌드 확인 및 커밋**

```bash
pnpm --filter portfolio build 2>&1 | tail -3
grep -c 'aria-label="Flutter와 WebView' apps/portfolio/dist/index.html
git add apps/portfolio
git commit -m "✨ feat(portfolio): 2장 Xamfinity 하이브리드 앱"
```

Expected: 빌드 성공, 검출 `1`.

---

### Task 5: 3장 Ralli · GolfCounter

**Files:**
- Create: `apps/portfolio/src/diagrams/watch-apps-yjkit.svg`
- Create: `apps/portfolio/public/watch-apps/` (블로그 public에서 복사)
- Modify: `apps/portfolio/src/components/projects/watch-apps.html`

- [ ] **Step 1: 캡처 복사**

```bash
mkdir -p apps/portfolio/public/watch-apps
cp apps/web/public/ralli/watch-match-global.png apps/portfolio/public/watch-apps/ralli-watch-match.png
cp apps/web/public/ralli/ios-live-global.png apps/portfolio/public/watch-apps/ralli-ios-live.png
cp apps/web/public/golf-counter/watch-score-en.png apps/portfolio/public/watch-apps/golf-watch-score.png
cp apps/web/public/golf-counter/ios-stat-en.png apps/portfolio/public/watch-apps/golf-ios-stat.png
ls -la apps/portfolio/public/watch-apps
```

Expected: 네 파일. 합계가 3MB를 넘으면 사용자에게 알리고 그대로 진행한다.

- [ ] **Step 2: 구조도 `watch-apps-yjkit.svg`**

```svg
<svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="YJKit 패키지와 두 앱의 의존 관계">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f4e79" />
    </marker>
  </defs>

  <!-- Apps -->
  <rect x="14" y="14" width="330" height="80" rx="8" class="dg-box-soft" />
  <text x="179" y="30" class="dg-label">Ralli (테니스)</text>
  <rect x="28" y="42" width="145" height="38" rx="6" class="dg-box" />
  <text x="100" y="56" class="dg-text">Watch App</text>
  <text x="100" y="70" class="dg-label">메인 입력 · 점수 · 워크아웃</text>
  <rect x="185" y="42" width="145" height="38" rx="6" class="dg-box" />
  <text x="257" y="56" class="dg-text">iOS App</text>
  <text x="257" y="70" class="dg-label">기록 · Live Activity</text>

  <rect x="376" y="14" width="330" height="80" rx="8" class="dg-box-soft" />
  <text x="541" y="30" class="dg-label">GolfCounter (골프)</text>
  <rect x="390" y="42" width="145" height="38" rx="6" class="dg-box" />
  <text x="462" y="56" class="dg-text">Watch App</text>
  <text x="462" y="70" class="dg-label">메인 입력 · 타수 · 퍼팅</text>
  <rect x="547" y="42" width="145" height="38" rx="6" class="dg-box" />
  <text x="619" y="56" class="dg-text">iOS App</text>
  <text x="619" y="70" class="dg-label">기록 · 통계 전용</text>

  <!-- arrows down to kit -->
  <path d="M179,96 L179,126" class="dg-line" />
  <path d="M541,96 L541,126" class="dg-line" />
  <text x="360" y="112" class="dg-label">종목 규칙·메시지·저장 정책은 앱이 소유</text>

  <!-- Kit -->
  <rect x="14" y="130" width="692" height="76" rx="8" class="dg-box-soft" />
  <text x="360" y="146" class="dg-label">Packages/YJKit — 로컬 Swift Package. 코어는 도메인을 모른다</text>
  <rect x="28" y="158" width="160" height="36" rx="6" class="dg-box" />
  <text x="108" y="171" class="dg-text">WorkoutCore</text>
  <text x="108" y="185" class="dg-label">HealthKit 세션 · 경과시간</text>
  <rect x="200" y="158" width="160" height="36" rx="6" class="dg-box" />
  <text x="280" y="171" class="dg-text">WorkoutUI</text>
  <text x="280" y="185" class="dg-label">워치 공통 화면</text>
  <rect x="372" y="158" width="160" height="36" rx="6" class="dg-box" />
  <text x="452" y="171" class="dg-text">ConnectivityCore</text>
  <text x="452" y="185" class="dg-label">WatchConnectivity 앵커</text>
  <rect x="544" y="158" width="148" height="36" rx="6" class="dg-box" />
  <text x="618" y="171" class="dg-text">PersistenceCore</text>
  <text x="618" y="185" class="dg-label">SwiftData · CloudKit</text>
</svg>
```

- [ ] **Step 3: `watch-apps.html`**

```html
<section class="page">
  <div class="chapter-head">
    <div class="chapter-no">03 · 개인 프로젝트</div>
    <div class="chapter-title">Ralli · GolfCounter</div>
    <div class="chapter-summary">
      워치가 메인 입력인 Apple Watch 스포츠 기록 앱 2종. 공통 패키지 분리, 모노레포, App Store 출시·운영
    </div>
    <dl class="meta-table">
      <dt>기간</dt>
      <dd>2026.05 – 현재</dd>
      <dt>역할</dt>
      <dd>기획 · 개발 · 디자인(아이콘·스크린샷) · 스토어 운영 단독</dd>
      <dt>스택</dt>
      <dd>
        <span class="stack">Swift · SwiftUI · SwiftData · CloudKit · WatchConnectivity · HealthKit · WidgetKit · ActivityKit · SPM · GitHub Actions</span>
      </dd>
    </dl>
  </div>

  <h3 class="section-h">개요</h3>
  <p class="text-secondary">
    Ralli는 테니스 점수를, GolfCounter는 골프 타수와 퍼팅을 기록한다. 둘 다 경기 중에는 워치만 조작하고,
    아이폰은 기록과 통계를 보는 용도다. 두 앱 모두 App Store에 출시해 유료로 판매 중이다.
  </p>
  <div class="figure">
    <div class="figure-row">
      <img src="./watch-apps/ralli-watch-match.png" alt="Ralli 워치 경기 화면" />
      <img src="./watch-apps/golf-watch-score.png" alt="GolfCounter 워치 스코어 화면" />
    </div>
    <div class="figure-caption">왼쪽 Ralli, 오른쪽 GolfCounter. 경기 중 조작은 워치에서 끝난다.</div>
  </div>

  <h3 class="section-h">문제</h3>
  <ul class="space-y-1">
    <li class="bullet">
      경기 중에 폰을 꺼내는 순간 흐름이 끊긴다. 기록은 손목에서 두 번 탭으로 끝나야 한다.
    </li>
    <li class="bullet">
      첫 앱(Ralli)을 만들고 나니 HealthKit 세션, 워치↔폰 동기화, 저장 계층이 종목과 무관한 코드였다.
      두 번째 앱을 같은 방식으로 만들면 그 코드를 복사하게 된다.
    </li>
    <li class="bullet">
      출시 후에는 만드는 것보다 알리는 게 문제였다. 검색에 안 잡히면 다운로드가 없다.
    </li>
  </ul>

  <h3 class="section-h">접근과 선택</h3>
  <ul class="space-y-1">
    <li class="bullet">
      <b>워치 중심 설계.</b> GolfCounter는 워치가 메인 입력, iOS는 기록·통계 전용으로 역할을 갈랐다.
      라운드 중 폰을 볼 일이 없다.
    </li>
    <li class="bullet">
      <b>코어 분리.</b> Ralli의 HealthKit·WatchConnectivity·SwiftData 계층을 공통 Swift Package(YJKit)로
      추출했다. 코어는 도메인을 모르고, 종목별 규칙과 저장 정책은 앱이 소유한다.
    </li>
    <li class="bullet">
      <b>모노레포.</b> 앱 2개와 패키지가 레포 3개로 흩어져 패키지를 고칠 때마다 푸시와 버전 갱신이
      필요했다. 커밋 히스토리를 보존한 채 단일 Xcode 워크스페이스로 통합했다.
    </li>
  </ul>
  <div class="callout">
    두 번째 앱을 "도메인 로직만 쓰면 되는" 상태로 만드는 것이 목표였다. GolfCounter는 그 검증이었고,
    워치 워크아웃·동기화·저장은 한 줄도 다시 쓰지 않았다.
  </div>

  <h3 class="section-h">구현</h3>
  <div class="figure">
    <!-- include: src/diagrams/watch-apps-yjkit.svg -->
    <div class="figure-caption">YJKit 네 프로덕트와 두 앱의 의존. 경과시간은 워치가 단일 소스다.</div>
  </div>
  <ul class="space-y-1">
    <li class="bullet">
      <b>동작 계약.</b> 경과시간은 워치가 단일 소스이고 폰은 앵커로 보간만 한다. pause는 폰→워치 명령이고
      상태는 워치 앵커로만 갱신한다. 두 앱이 같은 규칙을 지켜야 숫자 의미가 갈리지 않는다.
    </li>
    <li class="bullet">
      <b>Live Activity · Complication · CloudKit.</b> 진행 중인 경기를 잠금 화면과 다이나믹 아일랜드에
      실시간 표시하고, 워치 페이스에서 바로 진입하며, 기록은 기기 간 동기화된다.
    </li>
    <li class="bullet">
      <b>CI.</b> PR마다 변경된 앱만 빌드·테스트한다. YJKit이 바뀌면 전 앱을 돌린다. job 분리로 전체
      21분 → 6.4분, 문서만 바뀐 커밋은 6초.
    </li>
  </ul>

  <h3 class="section-h">결과</h3>
  <div class="flex flex-wrap gap-2 mb-2">
    <span class="kpi"><span class="text-xs text-muted">월간 유료 판매 (앱 2종)</span><span class="kpi-from">19건</span><span class="kpi-to">42건</span></span>
    <span class="kpi"><span class="text-xs text-muted">전월 대비</span><span class="kpi-to">+121%</span></span>
  </div>
  <ul class="space-y-1">
    <li class="bullet">
      스토어 검색 키워드를 검색량 대비 경쟁도가 낮은 조합으로 바꾸고 스크린샷을 리디자인했다.
      7월 19건이던 판매가 8월 42건이 됐다.
    </li>
    <li class="bullet">2026년 누적 판매 108건. 출시 후 매일 꾸준히 팔리는 기본 수요 위에 얹은 결과다.</li>
  </ul>
  <div class="figure">
    <div class="figure-row">
      <img src="./watch-apps/ralli-ios-live.png" alt="Ralli Live Activity" />
      <img src="./watch-apps/golf-ios-stat.png" alt="GolfCounter iOS 통계" />
    </div>
    <div class="figure-caption">왼쪽 Ralli의 Live Activity, 오른쪽 GolfCounter의 iOS 통계 화면.</div>
  </div>

  <h3 class="section-h">회고</h3>
  <p class="text-secondary">
    코어 분리를 첫 앱 출시 전에 하지 않은 것은 옳았다. 무엇이 공통인지는 두 번째 앱을 만들 때 보인다.
    아쉬운 점은 ASO를 출시 두 달 뒤에야 손댄 것이다. 키워드는 출시 전에 정해야 첫 노출을 놓치지 않는다.
  </p>
</section>
```

- [ ] **Step 4: 빌드 확인 및 커밋**

```bash
pnpm --filter portfolio build 2>&1 | tail -3
ls apps/portfolio/dist/watch-apps | wc -l
git add apps/portfolio
git commit -m "✨ feat(portfolio): 3장 Ralli · GolfCounter"
```

Expected: 빌드 성공, dist에 이미지 `4`.

---

### Task 6: 4장 yjlogs

**Files:**
- Create: `apps/portfolio/src/diagrams/yjlogs-stack.svg`
- Modify: `apps/portfolio/src/components/projects/yjlogs.html`

**Interfaces:**
- 이미지: `public/yjlogs/home.png`, `public/yjlogs/post.png` (사용자 제공 또는 yjlogs.com에서 캡처). 없으면 placeholder.

- [ ] **Step 1: 구조도 `yjlogs-stack.svg`**

```svg
<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="yjlogs 스택 배치와 모노레포 구조">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#1f4e79" />
    </marker>
  </defs>

  <!-- Repo -->
  <rect x="14" y="14" width="300" height="172" rx="8" class="dg-box-soft" />
  <text x="164" y="30" class="dg-label">GitHub 저장소 — pnpm workspace + Turborepo</text>
  <rect x="30" y="44" width="268" height="52" rx="6" class="dg-box" />
  <text x="164" y="60" class="dg-text">apps/web — Next.js 16</text>
  <text x="164" y="80" class="dg-label">App Router · Drizzle · Server Actions · SEO</text>
  <rect x="30" y="108" width="268" height="52" rx="6" class="dg-box" />
  <text x="164" y="124" class="dg-text">apps/portfolio — Vite</text>
  <text x="164" y="144" class="dg-label">이 문서. HTML 파티셜 + Tailwind, A4 인쇄</text>
  <text x="164" y="176" class="dg-label">turbo-ignore: 바뀐 앱만 배포</text>

  <!-- Vercel -->
  <path d="M316,70 L386,70" class="dg-line" />
  <path d="M316,134 L386,134" class="dg-line" />
  <rect x="388" y="44" width="120" height="52" rx="6" class="dg-box" />
  <text x="448" y="62" class="dg-text">Vercel</text>
  <text x="448" y="80" class="dg-label">yjlogs.com</text>
  <rect x="388" y="108" width="120" height="52" rx="6" class="dg-box" />
  <text x="448" y="126" class="dg-text">Vercel</text>
  <text x="448" y="144" class="dg-label">portfolio.yjlogs.com</text>

  <!-- Services -->
  <path d="M510,70 L560,70" class="dg-line" />
  <rect x="562" y="14" width="144" height="34" rx="6" class="dg-box-soft" />
  <text x="634" y="26" class="dg-text">Neon PostgreSQL</text>
  <text x="634" y="40" class="dg-label">Drizzle ORM</text>
  <rect x="562" y="56" width="144" height="34" rx="6" class="dg-box-soft" />
  <text x="634" y="68" class="dg-text">Clerk</text>
  <text x="634" y="82" class="dg-label">관리자 인증</text>
  <rect x="562" y="98" width="144" height="34" rx="6" class="dg-box-soft" />
  <text x="634" y="110" class="dg-text">Cloudflare R2</text>
  <text x="634" y="124" class="dg-label">이미지 · assets.yjlogs.com</text>
  <rect x="562" y="140" width="144" height="34" rx="6" class="dg-box-soft" />
  <text x="634" y="152" class="dg-text">Cloudflare DNS</text>
  <text x="634" y="166" class="dg-label">도메인 · 서브도메인</text>
</svg>
```

- [ ] **Step 2: `yjlogs.html`**

```html
<section class="page">
  <div class="chapter-head">
    <div class="chapter-no">04 · 개인 프로젝트</div>
    <div class="chapter-title">yjlogs</div>
    <div class="chapter-summary">
      DB·인증·이미지 스토리지·배포를 직접 고른 Next.js 개인 블로그. 출시 앱의 랜딩과 이 포트폴리오가 올라가 있다
    </div>
    <dl class="meta-table">
      <dt>기간</dt>
      <dd>2026.04 – 현재</dd>
      <dt>역할</dt>
      <dd>기획 · 설계 · 개발 · 운영 단독</dd>
      <dt>스택</dt>
      <dd>
        <span class="stack">Next.js 16 · TypeScript · TailwindCSS · Drizzle · Neon · Clerk · Cloudflare R2 · Vercel · pnpm · Turborepo</span>
      </dd>
    </dl>
  </div>

  <h3 class="section-h">개요</h3>
  <p class="text-secondary">
    글을 쓰고, 출시한 앱의 랜딩 페이지를 두고, 지원할 때 보여줄 이 포트폴리오를 올려두는 곳이다.
    프론트엔드부터 DB, 인증, 이미지 스토리지, 배포, SEO, 유입 분석까지 직접 구성했다.
  </p>
  <div class="figure">
    <div class="figure-placeholder" style="aspect-ratio: 16 / 9">yjlogs.com 홈</div>
    <div class="figure-caption">홈. 최신 글과 앱 랜딩으로 이어진다.</div>
  </div>

  <h3 class="section-h">문제</h3>
  <ul class="space-y-1">
    <li class="bullet">
      회사에서는 백엔드가 있었다. 혼자 만들 때 "어떤 DB, 어떤 인증, 어떤 스토리지"를 스스로 고르고 그
      선택을 책임지는 경험이 필요했다.
    </li>
    <li class="bullet">
      앱 랜딩 페이지가 없어서 스토어 밖에서 앱을 설명할 곳이 없었다.
    </li>
    <li class="bullet">
      나중에 포트폴리오를 같은 도메인에 두고 싶었다. 블로그와 포트폴리오는 스택이 달라 한 앱 안에 넣기
      어려웠다.
    </li>
  </ul>

  <h3 class="section-h">접근과 선택</h3>
  <table class="compare-table">
    <thead>
      <tr><th>영역</th><th>선택</th><th>이유</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>데이터</td>
        <td>Neon PostgreSQL + Drizzle ORM</td>
        <td>서버리스 Postgres라 유휴 비용이 없고, Drizzle은 스키마가 곧 타입이라 별도 코드 생성이 없다</td>
      </tr>
      <tr>
        <td>인증</td>
        <td>Clerk</td>
        <td>관리자 한 명뿐이다. 직접 만들 이유가 없고, 세션·미들웨어를 바로 얻는다</td>
      </tr>
      <tr>
        <td>이미지</td>
        <td>Cloudflare R2</td>
        <td>S3 호환에 egress 무료. 도메인이 이미 Cloudflare라 assets 서브도메인 연결이 한 줄</td>
      </tr>
      <tr>
        <td>배포</td>
        <td>Vercel</td>
        <td>Next.js 기본 경로. 저장소 하나에 프로젝트 여럿을 붙일 수 있어 포트폴리오를 서브도메인으로 분리</td>
      </tr>
      <tr>
        <td>저장소</td>
        <td>pnpm workspace + Turborepo</td>
        <td>블로그(Next.js)와 포트폴리오(Vite)를 한 저장소에 두되, 바뀐 앱만 빌드·배포하기 위해</td>
      </tr>
    </tbody>
  </table>
  <div class="callout">
    포트폴리오를 블로그 라우트로 넣지 않고 별도 앱으로 뺀 이유는 인쇄 품질이다. 블로그의 루트
    레이아웃(인증·분석·테마)이 PDF에 끼어들지 않아야 했다.
  </div>

  <h3 class="section-h">구현</h3>
  <div class="figure">
    <!-- include: src/diagrams/yjlogs-stack.svg -->
    <div class="figure-caption">저장소 하나, Vercel 프로젝트 둘, 외부 서비스 넷.</div>
  </div>
  <ul class="space-y-1">
    <li class="bullet">
      <b>SEO.</b> 사이트맵, JSON-LD, OG 이미지 자동 생성. GA4로 유입을 본다. 포트폴리오는 반대로
      noindex와 robots.txt로 검색에서 뺀다.
    </li>
    <li class="bullet">
      <b>모노레포 전환.</b> 기존 저장소를 `apps/web`으로 옮기고 pnpm과 Turborepo를 얹었다. Vercel은
      프로젝트별 Root Directory로 연결하고 `turbo-ignore`로 무관한 커밋의 빌드를 건너뛴다.
    </li>
    <li class="bullet">
      <b>포트폴리오 앱.</b> HTML 파티셜을 빌드 시 하나로 합치는 구조. 같은 HTML이 웹이자 PDF다.
    </li>
  </ul>

  <h3 class="section-h">결과</h3>
  <ul class="space-y-1">
    <li class="bullet">yjlogs.com 운영 중. 앱 랜딩 2개, 글, 시리즈, 관리자 화면.</li>
    <li class="bullet">portfolio.yjlogs.com에 이 문서. 블로그만 고친 커밋에는 포트폴리오가 배포되지 않는다.</li>
  </ul>
  <div class="figure">
    <div class="figure-placeholder" style="aspect-ratio: 16 / 9">글 상세 페이지</div>
    <div class="figure-caption">글 상세. 코드 하이라이트와 목차, 댓글.</div>
  </div>

  <h3 class="section-h">회고</h3>
  <p class="text-secondary">
    서비스를 고를 때 "직접 만들 수 있는가"보다 "혼자 운영할 수 있는가"를 기준으로 삼은 것이 맞았다.
    인증과 스토리지를 직접 만들었다면 지금 글을 쓰는 대신 그걸 고치고 있었을 것이다. 모노레포는 앱이
    둘뿐이라 Turborepo의 이득이 아직 작다. 공유 패키지가 생기면 그때 진가가 나온다.
  </p>
</section>
```

- [ ] **Step 3: 빌드 확인 및 커밋**

```bash
pnpm --filter portfolio build 2>&1 | tail -3
grep -c 'aria-label="yjlogs 스택' apps/portfolio/dist/index.html
git add apps/portfolio
git commit -m "✨ feat(portfolio): 4장 yjlogs"
```

Expected: 빌드 성공, 검출 `1`.

---

### Task 7: PDF 내보내기 스크립트와 페이지 나눔 검토

**Files:**
- Create: `apps/portfolio/scripts/export-pdf.mjs`
- Modify (필요 시): 장 파티셜의 `.figure` 위치·여백

**Interfaces:**
- Produces: `pnpm --filter portfolio pdf` → `apps/portfolio/dist/portfolio.pdf`, 표준 출력에 페이지 수.

- [ ] **Step 1: `export-pdf.mjs`**

```js
// vite preview를 띄우고 Chrome 헤드리스로 A4 PDF를 만든다.
// file:// 로 열면 crossorigin 속성 때문에 CSS가 막히므로 반드시 HTTP로 연다.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const port = 4173;
const out = resolve(root, 'dist/portfolio.pdf');
const chrome =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (!existsSync(chrome)) {
  console.error(`Chrome을 찾을 수 없습니다: ${chrome}\nCHROME_PATH 환경변수로 경로를 지정하세요.`);
  process.exit(1);
}

const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(port), '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
});

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`preview 서버가 ${url} 에서 응답하지 않습니다`);
}

try {
  await waitForServer(`http://localhost:${port}/`);
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=8000',
      `--print-to-pdf=${out}`,
      `http://localhost:${port}/`,
    ],
    { stdio: 'ignore' }
  );
  const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`${out}\n${pages} pages`);
} finally {
  preview.kill();
}
```

- [ ] **Step 2: 실행**

```bash
pnpm --filter portfolio pdf 2>&1 | tail -3
```

Expected: 마지막 두 줄이 PDF 경로와 `N pages`. N은 10~12.

- [ ] **Step 3: 페이지 나눔 육안 검토**

PDF를 열어 다음을 확인한다. 어긋난 곳은 파티셜에서 고치고 Step 2를 반복한다.

- 표지, 목차, 각 장, 링크가 각각 새 페이지에서 시작하는가
- `.figure`가 페이지에 걸쳐 쪼개지지 않는가 (쪼개지면 `.figure`를 앞 문단과 함께 `<div class="break-inside-avoid">`로 감싸거나 다음 절 앞으로 옮긴다)
- 절 제목(`.section-h`)이 페이지 끝에 홀로 남지 않는가 (`break-after-avoid`가 이미 있다. 남으면 그 절을 통째로 `break-inside-avoid`)
- 회사 프로젝트 장이 2~3페이지, 개인 프로젝트 장이 2페이지 안팎인가. 넘치면 문단을 줄인다

```bash
open apps/portfolio/dist/portfolio.pdf
```

- [ ] **Step 4: 커밋**

```bash
git add apps/portfolio
git commit -m "🔧 feat(portfolio): PDF 내보내기 스크립트와 페이지 나눔 조정"
```

---

### Task 8: Discord 워크플로, 루트 README, launch.json

**Files:**
- Modify: `.github/workflows/discord-notify.yml`, `README.md` (루트), `.claude/launch.json`

- [ ] **Step 1: Discord 메시지에 배포 URL 추가**

`fields` 배열에 항목 하나를 더한다. 수정 후 `run` 블록:

```yaml
        run: |
          curl -H "Content-Type: application/json" \
            -d "{
              \"embeds\": [{
                \"title\": \"✅ Vercel 배포 성공!\",
                \"description\": \"main branch 배포가 완료되었습니다.\",
                \"color\": 5763719,
                \"fields\": [
                  {\"name\": \"👤 배포자\", \"value\": \"${{ github.event.deployment.creator.login }}\", \"inline\": true},
                  {\"name\": \"🔗 URL\", \"value\": \"${{ github.event.deployment_status.environment_url }}\", \"inline\": true}
                ]
              }]
            }" \
            $DISCORD_WEBHOOK_URL
```

- [ ] **Step 2: 루트 README 표 수정**

앱 표와 Vercel 표에서 `(예정)`을 지운다.

```markdown
| 포트폴리오 | `apps/portfolio` | Vite, HTML 파티셜 | https://portfolio.yjlogs.com |
```

```markdown
| portfolio | `apps/portfolio` | portfolio.yjlogs.com |
```

명령 표에 두 줄을 추가한다.

```markdown
| `pnpm dev --filter portfolio` | 포트폴리오 개발 서버 (http://localhost:5173) |
| `pnpm --filter portfolio pdf` | 포트폴리오 PDF 생성 (`apps/portfolio/dist/portfolio.pdf`) |
```

- [ ] **Step 3: `.claude/launch.json`에 항목 추가**

`configurations` 배열 끝에:

```json
    {
      "name": "portfolio",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "portfolio", "dev"],
      "port": 5173
    }
```

- [ ] **Step 4: 포맷·빌드 최종 확인**

```bash
pnpm format:check 2>&1 | tail -3
pnpm build 2>&1 | tail -5
```

Expected: 둘 다 통과. `pnpm build`는 `web`과 `portfolio` 둘 다 성공.

- [ ] **Step 5: 커밋**

```bash
git add .github README.md .claude/launch.json apps/portfolio
git commit -m "📝 docs: 포트폴리오 배포 반영 — Discord 알림 URL, README, launch.json"
```

---

### Task 9: PR, Vercel 프로젝트 생성, 머지

사용자가 Vercel 대시보드와 Cloudflare에서 직접 하는 단계가 있다. 그 지점에서 멈추고 확인을 받는다.

- [ ] **Step 1: 푸시 및 PR**

```bash
git push -u origin feature/portfolio
gh pr create --base develop --title "✨ 포트폴리오 앱 (apps/portfolio)" --body "$(cat <<'EOF'
## 요약

- `apps/portfolio` — Vite + Tailwind v4 문서형 포트폴리오. 프로젝트 4장, 인라인 SVG 구조도 4개
- `pnpm --filter portfolio pdf`로 A4 PDF 생성
- noindex 메타 + robots.txt로 검색 제외
- Discord 알림에 배포 URL 필드 추가

스펙: `docs/superpowers/specs/2026-09-02-portfolio-app-design.md`

## 머지 전 확인

- [ ] Vercel에 `portfolio` 프로젝트 생성 (Root Directory `apps/portfolio`)
- [ ] `portfolio.yjlogs.com` 도메인 연결 (Cloudflare CNAME)
- [ ] PR preview에서 렌더 확인

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: 사용자 작업 — Vercel 프로젝트 생성**

여기서 멈추고 요청한다.

> Vercel 대시보드 → Add New Project → 같은 GitHub 저장소 선택 → Root Directory `apps/portfolio` → Framework Preset이 Vite인지 확인 → Deploy. 생성 후 Settings → Domains에 `portfolio.yjlogs.com` 추가하고, Vercel이 알려주는 CNAME을 Cloudflare DNS에 등록 (Proxy는 DNS only).

완료를 알리기 전에는 다음으로 가지 않는다.

- [ ] **Step 3: preview 확인**

```bash
gh pr checks feature/portfolio
```

Expected: 두 프로젝트의 Vercel 체크. `web`은 turbo-ignore로 건너뛰거나 통과, `portfolio`는 통과. preview URL에서 표지가 렌더되고 `/robots.txt`가 `Disallow: /`인지 사용자가 확인한다.

- [ ] **Step 4: develop → main 머지**

```bash
gh pr merge feature/portfolio --merge --delete-branch
git checkout develop && git pull --ff-only origin develop
git checkout main && git pull --ff-only origin main
git merge --no-ff develop -m "🔀 merge: develop → main (포트폴리오 앱)"
git push origin main
git checkout develop
```

- [ ] **Step 5: 프로덕션 확인**

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://portfolio.yjlogs.com/
curl -s https://portfolio.yjlogs.com/robots.txt
curl -s https://portfolio.yjlogs.com/ | grep -o 'noindex, nofollow'
```

Expected: `200`, `Disallow: /`, `noindex, nofollow`. Discord에 배포 알림이 URL과 함께 왔는지 사용자가 확인한다.

- [ ] **Step 6: 이력서 Links에 URL 추가 (yj-resume 저장소, 별도)**

이 저장소 밖의 일이다. 사용자에게 `yj-resume`의 `src/components/links.html`에 `portfolio.yjlogs.com` 한 줄을 추가하라고 안내만 한다.

- [ ] **Step 7: 플랜 문서 완료 표시**

이 문서 상단에 완료 일자와 결과(페이지 수, 배포 URL)를 한 단락 추가하고 `develop`에 커밋한다.

```bash
git add docs/superpowers/plans/2026-09-02-portfolio-app.md
git commit -m "📝 docs: 포트폴리오 앱 플랜 완료 기록"
git push origin develop
```

---

## 캡처 이미지가 도착했을 때

사용자가 이미지를 주면 다음 규칙으로 교체한다. 별도 태스크가 아니라 어느 시점에든 끼워 넣는다.

| 파일 | 자리 | 교체 |
|---|---|---|
| `public/hakon/dashboard.png` | 1장 개요 | `<div class="figure-placeholder" …>대시보드 화면…</div>` → `<img src="./hakon/dashboard.png" alt="관리자 대시보드" />` |
| `public/hakon/attendance-monitor.png` | 1장 결과 | 같은 방식 |
| `public/xamfinity/store-1.png`, `store-2.png` | 2장 개요 | `.figure-row` 안의 placeholder 둘 → `<img>` 둘 |
| `public/yjlogs/home.png`, `post.png` | 4장 개요·결과 | 같은 방식 |

교체 후 `pnpm --filter portfolio pdf`로 페이지 나눔을 다시 확인하고 `📸 feat(portfolio): <장> 캡처 추가`로 커밋한다.

---

## Self-Review 결과

**스펙 커버리지.** 구조(Task 1), include 플러그인과 SVG 재귀(Task 1 Step 2), 토큰·컴포넌트·인쇄(Task 2 Step 1), 표지·목차·마무리(Task 2), 네 장과 구조도(Task 3~6), PDF 스크립트와 페이지 검토(Task 7), 검색 제외(Task 1 Step 3·4, Task 9 Step 5), Vercel·도메인(Task 9 Step 2), Discord(Task 8 Step 1), README·launch.json(Task 8), 캡처 플레이스홀더 규칙(마지막 절). 검증 기준 일곱 항목 모두 대응하는 스텝이 있다.

**이름 일관성.** 컴포넌트 클래스는 Task 2 Step 1에서 정의한 것만 장 파티셜이 쓴다 (`.page`, `.chapter-*`, `.meta-table`, `.section-h`, `.figure*`, `.kpi*`, `.callout`, `.compare-table`, `.bullet`, `.stack`, `.dg-*`). SVG 마커 id `arrow`는 네 SVG가 각자 `<defs>`에 갖고, 한 문서에 같은 id가 네 번 들어가지만 마커 참조는 첫 정의로 해석되며 네 정의가 동일하므로 렌더에 문제없다. 이미지 파일명은 Task 5 Step 1의 복사 이름과 Step 3의 `src`가 같다.

**사용자 확인 필요.** 장 헤더의 "인원"과 "역할" 문구, Xamfinity 기능 설명(출결·수납·공지·상담) 정확성, 회고 문단은 초안이다. 실행 중 사용자가 고치면 그대로 반영한다.
