# 포트폴리오 앱 Astro 이전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/portfolio`의 커스텀 include 플러그인 구조를 Astro 7 컴포넌트 구조로 바꾸되, 렌더 결과를 픽셀 단위로 동일하게 유지한다.

**Architecture:** 파티셜 7개와 SVG 4개는 확장자만 `.astro`로 바꾸고 내용을 건드리지 않는다. `index.html`이 `src/pages/index.astro`가 되면서 include 주석 7줄이 컴포넌트 태그로 바뀐다. 인라인 `<script>` 두 개는 `is:inline`으로 그대로 살린다. 마크업을 바꾸지 않으므로 렌더 결과가 기준선과 픽셀 단위로 같아야 하고, 그것이 각 단계의 게이트다.

**Tech Stack:** Astro 7.3.1, Tailwind CSS v4 (`@tailwindcss/vite`), pnpm 11, Node 22.17.0, Chrome headless (PDF), `sips` (픽셀 비교)

**Spec:** `docs/superpowers/specs/2026-09-04-portfolio-astro-migration-design.md`

## Global Constraints

- **Astro 7.3.1** 고정. pnpm 11의 minimum release age가 `astro@latest`를 7.2.10으로 떨어뜨리므로 버전을 명시해 설치한다
- **Node `>=22.12.0`.** `apps/portfolio/package.json`에 `engines` 필드로 명시한다
- **마크업 무수정.** 파티셜·SVG의 내용은 한 글자도 바꾸지 않는다. 바뀌는 것은 파일 확장자, frontmatter import 추가, SVG include 주석 1줄뿐이다
- **`compressHTML: false`.** 앞으로 글을 고칠 때 인라인 요소 옆 공백이 조용히 사라지지 않도록 Astro 7의 공백 압축을 끈다
- **검증 게이트는 렌더 픽셀 비교.** PDF 바이트 비교가 아니다. `compressHTML: false`에서는 렌더가 같아도 PDF 콘텐츠 스트림이 31바이트 달라진다
- **브랜치:** `refactor/portfolio-astro` (동작 변경 없이 구조를 바꾸는 작업)
- 작업 디렉터리는 저장소 루트 `/Users/yj/Workspace/yjlogs`다. 명령은 모두 루트에서 실행한다

---

## File Structure

### 생성

| 파일 | 책임 |
|---|---|
| `apps/portfolio/astro.config.mjs` | Astro 설정. Tailwind Vite 플러그인 연결, 공백 압축 해제 |
| `apps/portfolio/src/pages/index.astro` | 문서 셸(`<head>`·`<body>`)과 섹션 조립. 인라인 스크립트 2개 보유 |

### 이동 (내용 무수정)

| 이전 | 이후 |
|---|---|
| `src/components/cover.html` | `src/components/cover.astro` |
| `src/components/toc.html` | `src/components/toc.astro` |
| `src/components/closing.html` | `src/components/closing.astro` |
| `src/diagrams/hakon-pipeline.svg` | `src/diagrams/hakon-pipeline.astro` |
| `src/diagrams/xamfinity-bridge.svg` | `src/diagrams/xamfinity-bridge.astro` |
| `src/diagrams/watch-apps-yjkit.svg` | `src/diagrams/watch-apps-yjkit.astro` |
| `src/diagrams/yjlogs-stack.svg` | `src/diagrams/yjlogs-stack.astro` |

### 이동 + 최소 수정 (frontmatter import 1블록 + SVG include 1줄)

| 이전 | 이후 |
|---|---|
| `src/components/projects/hakon.html` | `src/components/projects/hakon.astro` |
| `src/components/projects/xamfinity.html` | `src/components/projects/xamfinity.astro` |
| `src/components/projects/watch-apps.html` | `src/components/projects/watch-apps.astro` |
| `src/components/projects/yjlogs.html` | `src/components/projects/yjlogs.astro` |

### 수정

| 파일 | 변경 |
|---|---|
| `apps/portfolio/package.json` | `vite` → `astro`, `type: module`, `engines` 추가, 스크립트 이름 변경 |
| `apps/portfolio/src/globals.css` | `@source` 지시자 4줄 |
| `apps/portfolio/scripts/export-pdf.mjs` | 1줄 (`vite preview` → `astro preview`) |
| `.prettierrc` | `prettier-plugin-astro` 등록 |
| `package.json` (루트) | `prettier-plugin-astro` devDependency 추가 |

### 삭제

| 파일 | 이유 |
|---|---|
| `apps/portfolio/vite.config.js` | include 플러그인과 Vite 설정이 통째로 불필요해진다 |
| `apps/portfolio/index.html` | `src/pages/index.astro`로 이동 |

---

## Task 1: 검증 하네스 구축

이전을 시작하기 전에 "무엇과 비교할 것인가"를 먼저 고정한다. 기준 PDF와 비교 스크립트가 없으면 이후 모든
태스크의 게이트가 성립하지 않는다.

**Files:**
- Create: `~/.cache/portfolio-astro-verify/verify-pixels.sh` (저장소 밖)
- Create: `~/.cache/portfolio-astro-verify/baseline.pdf` (저장소 밖)

> 검증 산출물은 저장소 밖에 둔다. `dist/`에 두면 이후 빌드가 덮어쓰고, 저장소 안에 두면 커밋에 섞인다.
> 아래 모든 태스크는 첫 스텝에서 `VERIFY_DIR`를 다시 정의한다 — 태스크마다 셸이 새로 뜨기 때문이다.

**Interfaces:**
- Consumes: 없음
- Produces: `verify-pixels.sh <before.pdf> <after.pdf>` — 픽셀 데이터가 같으면 `PIXELS IDENTICAL`을 출력하고 exit 0, 다르면 다른 바이트 수를 출력하고 exit 1

- [ ] **Step 1: 브랜치 생성**

```bash
cd /Users/yj/Workspace/yjlogs
git switch develop
git switch -c refactor/portfolio-astro
```

- [ ] **Step 2: 기준 PDF 생성**

현재(Vite) 구조 그대로 PDF를 뽑는다.

```bash
cd /Users/yj/Workspace/yjlogs
pnpm --filter portfolio pdf
```

기대 출력: 마지막 두 줄이 `.../apps/portfolio/dist/portfolio.pdf`와 `1 pages`

- [ ] **Step 3: 기준 PDF를 dist 밖으로 복사**

`dist/`는 gitignore 대상이고 이후 빌드가 덮어쓴다. 반드시 밖으로 뺀다.

```bash
export VERIFY_DIR="$HOME/.cache/portfolio-astro-verify"
mkdir -p "$VERIFY_DIR"
cp /Users/yj/Workspace/yjlogs/apps/portfolio/dist/portfolio.pdf "$VERIFY_DIR/baseline.pdf"
ls -l "$VERIFY_DIR/baseline.pdf"
```

기대: 5,080,649바이트 내외의 파일이 존재한다

- [ ] **Step 4: 픽셀 비교 스크립트 작성**

PDF를 비압축 TIFF로 변환해 픽셀 데이터 영역만 비교한다. TIFF 꼬리에는 변환 시각 메타데이터가 들어가므로
전체를 비교하면 항상 5바이트가 다르게 나온다. `-n`으로 픽셀 영역까지만 자른다.

```bash
cat > "$VERIFY_DIR/verify-pixels.sh" <<'SH'
#!/bin/bash
# 두 PDF의 렌더 픽셀이 같은지 비교한다.
# 사용법: verify-pixels.sh <before.pdf> <after.pdf>
set -e
before="$1"; after="$2"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

sips -s format tiff -s formatOptions none --out "$tmp/a.tiff" "$before" >/dev/null 2>&1
sips -s format tiff -s formatOptions none --out "$tmp/b.tiff" "$after"  >/dev/null 2>&1

read -r w h < <(sips -g pixelWidth -g pixelHeight "$tmp/a.tiff" 2>/dev/null \
  | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w, h}')
read -r w2 h2 < <(sips -g pixelWidth -g pixelHeight "$tmp/b.tiff" 2>/dev/null \
  | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{print w, h}')

if [ "$w" != "$w2" ] || [ "$h" != "$h2" ]; then
  echo "SIZE MISMATCH: ${w}x${h} vs ${w2}x${h2}"
  exit 1
fi

bytes=$((w * h * 4))
diff_count=$(cmp -l -n "$bytes" "$tmp/a.tiff" "$tmp/b.tiff" 2>/dev/null | wc -l | tr -d ' ')

if [ "$diff_count" = "0" ]; then
  echo "PIXELS IDENTICAL (${w}x${h}, ${bytes} bytes)"
  exit 0
else
  echo "PIXELS DIFFER: $diff_count bytes (${w}x${h})"
  exit 1
fi
SH
chmod +x "$VERIFY_DIR/verify-pixels.sh"
```

- [ ] **Step 5: 스크립트가 동작하는지 확인 (자기 자신과 비교)**

같은 파일끼리 비교하면 반드시 통과해야 한다. 여기서 실패하면 스크립트가 잘못된 것이고, 이후 게이트를
신뢰할 수 없다.

```bash
export VERIFY_DIR="$HOME/.cache/portfolio-astro-verify"
"$VERIFY_DIR/verify-pixels.sh" "$VERIFY_DIR/baseline.pdf" "$VERIFY_DIR/baseline.pdf"
```

기대 출력: `PIXELS IDENTICAL (675x9544, 25768800 bytes)` — 정확한 크기는 문서 길이에 따라 다를 수 있다

- [ ] **Step 6: 스크립트가 차이를 실제로 잡는지 확인**

통과만 하는 스크립트는 게이트가 아니다. 다른 문서와 비교해 실패가 나오는지 확인한다.

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio
python3 - <<'PY'
import pathlib
p = pathlib.Path('src/components/cover.html')
s = p.read_text()
p.write_text(s.replace('<section', '<section data-probe="1"', 1))
PY
# 표지에 눈에 보이는 변화를 준다
python3 - <<'PY'
import pathlib
p = pathlib.Path('src/globals.css')
p.write_text(p.read_text() + "\n.doc { letter-spacing: 0.5px }\n")
PY
cd /Users/yj/Workspace/yjlogs
export VERIFY_DIR="$HOME/.cache/portfolio-astro-verify"
pnpm --filter portfolio pdf
"$VERIFY_DIR/verify-pixels.sh" "$VERIFY_DIR/baseline.pdf" apps/portfolio/dist/portfolio.pdf || echo "게이트 정상 동작 확인"
```

기대 출력: `PIXELS DIFFER: <큰 수> bytes` 다음에 `게이트 정상 동작 확인`

- [ ] **Step 7: 실험 변경 되돌리기**

```bash
cd /Users/yj/Workspace/yjlogs
git checkout apps/portfolio/src/components/cover.html apps/portfolio/src/globals.css
git status --short
```

기대: `git status --short` 출력이 비어 있다

- [ ] **Step 8: 되돌린 상태가 기준선과 같은지 재확인**

```bash
export VERIFY_DIR="$HOME/.cache/portfolio-astro-verify"
pnpm --filter portfolio pdf
"$VERIFY_DIR/verify-pixels.sh" "$VERIFY_DIR/baseline.pdf" apps/portfolio/dist/portfolio.pdf
```

기대 출력: `PIXELS IDENTICAL`

이 태스크는 저장소 파일을 바꾸지 않으므로 커밋할 것이 없다. 브랜치만 생성된 상태로 다음 태스크로 넘어간다.

---

## Task 2: Astro로 전환

전환은 원자적이다. 중간 상태(예: Astro만 설치하고 페이지는 아직 없는 상태)에서는 빌드가 성립하지 않으므로
커밋을 쪼개지 않고 하나로 만든다.

**Files:**
- Create: `apps/portfolio/astro.config.mjs`, `apps/portfolio/src/pages/index.astro`
- Modify: `apps/portfolio/package.json`, `apps/portfolio/src/globals.css`, `apps/portfolio/scripts/export-pdf.mjs`
- Move: 파티셜 7개, SVG 4개 (위 File Structure 표)
- Delete: `apps/portfolio/vite.config.js`, `apps/portfolio/index.html`

**Interfaces:**
- Consumes: Task 1의 `verify-pixels.sh`, `baseline.pdf`
- Produces: `pnpm --filter portfolio pdf`가 성공하고, 산출 PDF가 기준선과 픽셀 동일

- [ ] **Step 1: Astro 설치, Vite 제거**

```bash
cd /Users/yj/Workspace/yjlogs
pnpm --filter portfolio remove vite
pnpm --filter portfolio add -D astro@7.3.1
node -e "console.log(require('./apps/portfolio/node_modules/astro/package.json').version)"
```

기대 출력: `7.3.1`

pnpm이 `pnpm-workspace.yaml`에 `minimumReleaseAgeExclude: [astro@7.3.1]`을 자동으로 추가할 수 있다.
추가됐다면 그대로 둔다 — 이 커밋에 함께 들어간다.

- [ ] **Step 2: package.json 정리**

`apps/portfolio/package.json`을 아래 내용으로 만든다. `pnpm add`가 넣은 `astro` 버전 범위는 유지한다.

```json
{
  "name": "portfolio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=22.12.0"
  },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "pdf": "astro build && node scripts/export-pdf.mjs"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "astro": "^7.3.1",
    "tailwindcss": "^4.3.3"
  }
}
```

- [ ] **Step 3: astro.config.mjs 생성**

```bash
cat > /Users/yj/Workspace/yjlogs/apps/portfolio/astro.config.mjs <<'CFG'
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: false,
  vite: { plugins: [tailwindcss()] },
});
CFG
```

- [ ] **Step 4: 파티셜과 SVG 확장자 변경**

`git mv`를 써서 이름 변경 이력을 남긴다. 내용은 건드리지 않는다.

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio
for f in cover toc closing; do
  git mv "src/components/$f.html" "src/components/$f.astro"
done
for f in hakon xamfinity watch-apps yjlogs; do
  git mv "src/components/projects/$f.html" "src/components/projects/$f.astro"
done
for f in hakon-pipeline xamfinity-bridge watch-apps-yjkit yjlogs-stack; do
  git mv "src/diagrams/$f.svg" "src/diagrams/$f.astro"
done
git status --short
```

기대: 11개 파일이 `R`(rename)로 표시된다

- [ ] **Step 5: 프로젝트 파티셜에 SVG 컴포넌트 배선**

파티셜 4개에 frontmatter import를 붙이고, SVG include 주석 1줄을 컴포넌트 태그로 바꾼다. 그 외에는 아무것도
바뀌지 않는다.

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio/src/components/projects
python3 - <<'PY'
import re, pathlib

mapping = {
    'hakon':      ('hakon-pipeline',    'HakonPipeline'),
    'xamfinity':  ('xamfinity-bridge',  'XamfinityBridge'),
    'watch-apps': ('watch-apps-yjkit',  'WatchAppsYjkit'),
    'yjlogs':     ('yjlogs-stack',      'YjlogsStack'),
}

for name, (svg, comp) in mapping.items():
    p = pathlib.Path(f'{name}.astro')
    s = p.read_text()
    pattern = r'<!--\s*include:\s*src/diagrams/%s\.svg\s*-->' % re.escape(svg)
    s2, n = re.subn(pattern, f'<{comp} />', s)
    assert n == 1, f'{name}: include 주석을 찾지 못했거나 여러 개다 (n={n})'
    p.write_text(f"---\nimport {comp} from '../../diagrams/{svg}.astro';\n---\n\n" + s2)
    print(f'{name}.astro <- {comp}')
PY
```

기대 출력: 4줄 (`hakon.astro <- HakonPipeline` 등). assert가 걸리면 멈추고 원인을 확인한다

- [ ] **Step 6: index.astro 생성**

`index.html`의 내용을 옮긴다. 바뀌는 것은 넷이다 — frontmatter import 추가, `<link href="/src/globals.css">`
제거(frontmatter import가 대신한다), include 주석 7줄이 컴포넌트 태그로, `<script>`에 `is:inline` 부착.
`onclick="printDoc()"`은 그대로 둔다.

```bash
mkdir -p /Users/yj/Workspace/yjlogs/apps/portfolio/src/pages
cat > /Users/yj/Workspace/yjlogs/apps/portfolio/src/pages/index.astro <<'ASTRO'
---
import '../globals.css';
import Cover from '../components/cover.astro';
import Toc from '../components/toc.astro';
import Hakon from '../components/projects/hakon.astro';
import Xamfinity from '../components/projects/xamfinity.astro';
import WatchApps from '../components/projects/watch-apps.astro';
import Yjlogs from '../components/projects/yjlogs.astro';
import Closing from '../components/closing.astro';
---

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
  </head>
  <body class="bg-page text-primary print:bg-white">
    <button
      type="button"
      onclick="printDoc()"
      class="no-print fixed top-4 right-4 z-10 text-xs font-semibold text-white bg-accent px-3 py-1.5 rounded shadow hover:opacity-90"
    >
      인쇄 · PDF로 저장
    </button>

    <div class="doc">
      <Cover />
      <Toc />
      <Hakon />
      <Xamfinity />
      <WatchApps />
      <Yjlogs />
      <Closing />
    </div>

    <script is:inline>
      // 이 문서는 A4로 나누지 않고 한 장으로 이어 붙인다.
      // `?print=1` 로 열면 인쇄 레이아웃(.printing)을 적용하고, 이미지까지 다 실린
      // 뒤 실제 문서 높이를 재서 @page 크기로 넣는다. export-pdf.mjs가 이 경로를 쓴다.
      (function () {
        if (!/[?&]print=1\b/.test(location.search)) return;
        document.documentElement.classList.add('printing');
        window.addEventListener('load', function () {
          var width = Math.ceil(document.documentElement.clientWidth);
          var height = Math.ceil(document.documentElement.scrollHeight) + 2;
          var style = document.createElement('style');
          style.textContent =
            '@page { size: ' + width + 'px ' + height + 'px; margin: 0 }';
          document.head.appendChild(style);
        });
      })();

      // 화면에서 누르는 인쇄 버튼. 브라우저가 알아서 용지에 맞춰 나눈다.
      function printDoc() {
        document.documentElement.classList.add('printing');
        window.addEventListener('afterprint', function once() {
          document.documentElement.classList.remove('printing');
          window.removeEventListener('afterprint', once);
        });
        window.print();
      }
    </script>
  </body>
</html>
ASTRO
git -C /Users/yj/Workspace/yjlogs rm -q apps/portfolio/index.html
```

- [ ] **Step 7: globals.css의 @source 수정**

`../index.html`은 이전 후 없는 경로가 된다. 자동 감지를 끄고 스캔 대상을 명시한다.

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio
python3 - <<'PY'
import pathlib
p = pathlib.Path('src/globals.css')
s = p.read_text()
old = "@import 'tailwindcss';\n@source '../index.html';\n@source './components';"
new = ("@import 'tailwindcss' source(none);\n"
       "@source './pages';\n"
       "@source './components';\n"
       "@source './diagrams';")
assert old in s, '기대한 @source 블록을 찾지 못했다. 파일 앞부분을 확인할 것'
p.write_text(s.replace(old, new))
print(p.read_text().split('@theme')[0])
PY
```

기대 출력: 수정된 `@import` + `@source` 4줄

- [ ] **Step 8: export-pdf.mjs 수정**

`vite preview`를 `astro preview`로 바꾼다. 그 외 한 줄도 바꾸지 않는다.

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio
python3 - <<'PY'
import pathlib
p = pathlib.Path('scripts/export-pdf.mjs')
s = p.read_text()
old = "['exec', 'vite', 'preview', '--port', String(port), '--strictPort']"
new = "['exec', 'astro', 'preview', '--port', String(port), '--strictPort']"
assert old in s, '기대한 preview 호출을 찾지 못했다'
p.write_text(s.replace(old, new))
PY
grep -n "astro', 'preview'" scripts/export-pdf.mjs
```

기대 출력: 25번째 줄 근처에 `'exec', 'astro', 'preview', ...`

- [ ] **Step 9: vite.config.js 삭제**

```bash
git -C /Users/yj/Workspace/yjlogs rm -q apps/portfolio/vite.config.js
```

- [ ] **Step 10: 빌드**

```bash
cd /Users/yj/Workspace/yjlogs
pnpm --filter portfolio build
```

기대 출력: `[build] 1 page(s) built in ...` 다음에 `[build] Complete!`. 에러가 나면 멈추고 원인을 확인한다

- [ ] **Step 11: PDF 생성**

```bash
pnpm --filter portfolio pdf
```

기대 출력: 마지막 두 줄이 `.../dist/portfolio.pdf`와 `1 pages`. **페이지 수가 1이 아니면 인라인 스크립트의
`@page` 주입이 동작하지 않은 것이다** — 멈추고 `is:inline`이 붙어 있는지 확인한다

- [ ] **Step 12: 픽셀 비교 게이트**

```bash
export VERIFY_DIR="$HOME/.cache/portfolio-astro-verify"
"$VERIFY_DIR/verify-pixels.sh" "$VERIFY_DIR/baseline.pdf" apps/portfolio/dist/portfolio.pdf
```

기대 출력: `PIXELS IDENTICAL`. 실패하면 다음 태스크로 넘어가지 않는다

- [ ] **Step 13: 산출물 점검**

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio
find dist -type f | grep -v '\.png$' | sort
echo "PNG: $(find dist -name '*.png' | wc -l)"
grep -c 'function printDoc' dist/index.html
grep -c '\.filter{' dist/_astro/*.css || echo "죽은 .filter 규칙 없음 (정상)"
```

기대:
- `dist/_astro/*.css`, `dist/index.html`, `dist/portfolio.pdf`, `dist/robots.txt`
- `PNG: 15`
- `function printDoc` 1건
- `.filter{` 0건 (`@source` 수정이 먹었다는 뜻)

- [ ] **Step 14: 커밋**

```bash
cd /Users/yj/Workspace/yjlogs
git add -A
git status --short
git commit -F - <<'MSG'
♻️ refactor(portfolio): 커스텀 include 플러그인을 Astro 7로 교체

`<!-- include: -->`는 HTML 문법이 아니라 vite.config.js가 정규식으로
치환하던 주석이었다. 파티셜은 단독으로 유효한 문서가 아니었고, 파티셜
안에서 SVG를 다시 include하느라 재귀 가드까지 붙어 있었다.

파티셜 7개와 SVG 4개는 확장자만 바꿨고 내용은 건드리지 않았다. SVG는
.astro 컴포넌트가 되면서 재귀 include와 1:1 대응한다. 인라인 스크립트
2개는 is:inline으로 그대로 살렸다.

globals.css의 @source가 이전 후 없는 경로를 가리켜 Tailwind 자동 감지가
Astro 생성물까지 긁고 있었다. source(none)으로 끄고 대상을 명시했다.

렌더 결과는 이전과 픽셀 단위로 동일하다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NMJcxahZLEPccuWgjzvQdH
MSG
```

---

## Task 3: Prettier가 .astro를 다루게 하기

이전 태스크가 끝나면 저장소에 `.astro` 파일 12개가 생긴다. 루트 Prettier는 이 확장자의 파서를 모르기 때문에
`pnpm format`과 `pnpm format:check`가 **에러로 죽는다**(`No parser could be inferred`). 이것은 이전이
만들어낸 회귀이므로 같은 브랜치에서 해결한다.

포맷은 마크업 공백을 바꿀 수 있고, `compressHTML: false` 상태에서는 그 공백이 산출물에 그대로 남는다.
그래서 포맷 후에도 픽셀 게이트를 다시 통과해야 한다.

**Files:**
- Modify: `package.json` (루트), `.prettierrc`
- Modify (포맷 결과): `apps/portfolio/**/*.astro`

**Interfaces:**
- Consumes: Task 1의 `verify-pixels.sh`, `baseline.pdf` / Task 2가 만든 `.astro` 파일들
- Produces: `pnpm format:check`가 통과하는 상태

- [ ] **Step 1: 현재 상태가 실제로 깨지는지 확인**

고치기 전에 문제를 눈으로 본다.

```bash
cd /Users/yj/Workspace/yjlogs
pnpm format:check 2>&1 | tail -5
```

기대 출력: `[error] No parser could be inferred for file ".../cover.astro"` 류의 에러

- [ ] **Step 2: 플러그인 설치**

```bash
pnpm add -Dw prettier-plugin-astro@0.14.1
```

기대: 루트 `package.json`의 `devDependencies`에 `prettier-plugin-astro`가 추가된다

- [ ] **Step 3: .prettierrc에 플러그인 등록**

`plugins` 배열에 추가한다. 기존 sort-imports 플러그인은 유지한다.

```bash
cd /Users/yj/Workspace/yjlogs
python3 - <<'PY'
import json, pathlib
p = pathlib.Path('.prettierrc')
cfg = json.loads(p.read_text())
if 'prettier-plugin-astro' not in cfg['plugins']:
    cfg['plugins'].append('prettier-plugin-astro')
p.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + '\n')
print(cfg['plugins'])
PY
```

기대 출력: `['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-astro']`

- [ ] **Step 4: 파서가 붙었는지 확인**

```bash
pnpm exec prettier --check apps/portfolio/src/components/cover.astro 2>&1 | tail -3
```

기대: `No parser could be inferred` 에러가 사라진다. 포맷이 필요하다는 메시지(`Code style issues found`)는
정상이며 다음 단계에서 처리한다

- [ ] **Step 5: 포맷 적용**

```bash
cd /Users/yj/Workspace/yjlogs
pnpm format
git status --short
```

기대: `.astro` 파일 일부 또는 전부가 수정된 것으로 표시될 수 있다

- [ ] **Step 6: 포맷 후 픽셀 게이트 재통과**

포맷이 인라인 요소 주변 공백을 바꿨다면 여기서 잡힌다.

```bash
export VERIFY_DIR="$HOME/.cache/portfolio-astro-verify"
pnpm --filter portfolio pdf
"$VERIFY_DIR/verify-pixels.sh" "$VERIFY_DIR/baseline.pdf" apps/portfolio/dist/portfolio.pdf
```

기대 출력: `PIXELS IDENTICAL`

실패한다면 포맷이 의미 있는 공백을 건드린 것이다. `git diff`로 어느 파일의 어느 줄이 바뀌었는지 확인하고,
해당 파일만 `git checkout`으로 되돌린 뒤 `.prettierignore`에 그 파일을 추가한다. 그 경우 이유를 커밋
메시지에 적는다.

- [ ] **Step 7: format:check 통과 확인**

```bash
pnpm format:check 2>&1 | tail -3
```

기대 출력: `All matched files use Prettier code style!`

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -F - <<'MSG'
🎨 chore: Prettier가 .astro를 포맷하도록 플러그인 추가

포트폴리오가 Astro로 옮겨가면서 .astro 파일이 생겼는데, 루트 Prettier는
이 확장자의 파서를 몰라 format·format:check가 에러로 죽었다.

포맷 후에도 렌더가 기준선과 픽셀 단위로 동일함을 확인했다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NMJcxahZLEPccuWgjzvQdH
MSG
```

---

## Task 4: dev 서버와 인쇄 버튼 확인

빌드 산출물은 검증했지만 개발 경험과 브라우저 인터랙션은 아직 확인하지 않았다. 스펙의 **미확인** 절에 적힌
항목을 여기서 닫는다.

**Files:**
- 변경 없음 (확인만 한다). 문제가 발견되면 그때 수정 대상이 정해진다

**Interfaces:**
- Consumes: Task 2·3의 결과물
- Produces: 없음 (검증 태스크)

- [ ] **Step 1: 포트 3000·4173이 비어 있는지 확인**

다른 프로젝트의 개발 서버와 자주 충돌한다.

```bash
lsof -ti:4321 -ti:4173 || echo "포트 비어 있음"
```

Astro dev의 기본 포트는 4321이다. 점유돼 있으면 해당 프로세스를 확인하고 정리한 뒤 진행한다

- [ ] **Step 2: dev 서버 기동**

```bash
cd /Users/yj/Workspace/yjlogs
pnpm --filter portfolio dev
```

기대 출력: `astro  v7.3.1 ready in ... ms`와 `Local http://localhost:4321/`

- [ ] **Step 3: 페이지가 뜨는지 확인**

다른 터미널에서:

```bash
curl -s http://localhost:4321/ | grep -c 'chapter-title'
```

기대 출력: `4` (프로젝트 4개의 제목이 렌더된다)

- [ ] **Step 4: HMR 확인**

dev 서버를 띄운 채로 표지의 이름을 바꾸고, **브라우저를 새로고침하지 않고** 화면이 갱신되는지 본다.
현재 Vite 구조에서는 파티셜이 모듈 그래프 밖에 있어 이것이 동작하지 않는다.

```bash
cd /Users/yj/Workspace/yjlogs/apps/portfolio
python3 -c "
import pathlib
p = pathlib.Path('src/components/cover.astro')
p.write_text(p.read_text().replace('김윤재', 'HMR확인중', 1))
"
```

브라우저 화면의 큰 제목이 `HMR확인중`으로 자동으로 바뀌면 HMR이 동작하는 것이다. 결과를 기록한 뒤
되돌린다.

```bash
git -C /Users/yj/Workspace/yjlogs checkout apps/portfolio/src/components/cover.astro
```

되돌린 뒤 화면이 다시 `김윤재`로 돌아오는지도 확인한다. 스펙의 **미확인** 절이 예상한 대로 개선됐는지,
아니면 여전히 수동 새로고침이 필요한지 Task 5에서 문서에 남긴다

- [ ] **Step 5: 인쇄 버튼 동작 확인**

브라우저에서 `http://localhost:4321/`를 열고 우상단 "인쇄 · PDF로 저장" 버튼을 누른다. 인쇄 미리보기가
뜨면 `onclick="printDoc()"`이 정상 동작하는 것이다. 미리보기는 취소한다.

> 이 단계는 브라우저 인쇄 대화상자를 띄운다. 자동화로 실행하지 말고 사람이 직접 확인한다

- [ ] **Step 6: dev 서버 종료**

기동한 터미널에서 Ctrl+C

- [ ] **Step 7: 최종 상태 확인**

```bash
cd /Users/yj/Workspace/yjlogs
git status --short
git log --oneline develop..HEAD
```

기대: working tree가 깨끗하고, 커밋 2개(Task 2·3)가 보인다

---

## Task 5: 문서 갱신과 마무리

이전으로 선행 스펙의 기술 스택 서술이 사실과 달라졌다. 문서를 현재 상태에 맞춘다.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-02-portfolio-app-design.md`
- Modify: `docs/superpowers/plans/2026-09-04-portfolio-astro-migration.md` (이 문서)

**Interfaces:**
- Consumes: Task 2~4의 결과
- Produces: 없음 (문서 태스크)

- [ ] **Step 1: 선행 스펙에 이전 사실을 남긴다**

`2026-09-02-portfolio-app-design.md`는 히스토리 문서이므로 본문을 고쳐 쓰지 않는다. 대신 문서 상단
머리말 바로 아래에 후속 이전을 가리키는 한 줄을 추가한다.

```markdown
> **2026-09-04 갱신:** 이 문서의 Vite + HTML 파티셜 구조는 Astro 7로 이전했다.
> `2026-09-04-portfolio-astro-migration-design.md` 참조.
```

- [ ] **Step 2: 이 계획 문서에 완료 기록을 남긴다**

문서 최상단 제목 바로 아래에 추가한다. `<날짜>`와 결과는 실제 값으로 채운다.

```markdown
**완료:** 2026-09-XX · 전 태스크 완료. 렌더 결과 픽셀 동일 확인.
HMR 확인 결과: <Task 4 Step 4에서 관찰한 내용>
```

- [ ] **Step 3: 사용자에게 문서 검토 요청**

CLAUDE.md 규칙상 문서는 사용자 승인 없이 커밋하지 않는다. 두 문서의 변경 내용을 보여주고 승인을 받는다.

- [ ] **Step 4: 승인 후 커밋**

```bash
cd /Users/yj/Workspace/yjlogs
git add docs/
git commit -F - <<'MSG'
📝 docs(portfolio): Astro 이전 완료 기록

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01NMJcxahZLEPccuWgjzvQdH
MSG
```

- [ ] **Step 5: PR 생성**

```bash
git push -u origin refactor/portfolio-astro
gh pr create --base develop --title "♻️ 포트폴리오 앱 Astro 7 이전" --body "$(cat <<'BODY'
## 요약

`apps/portfolio`의 커스텀 include 플러그인 구조를 Astro 7 컴포넌트 구조로 교체했다.
렌더 결과는 이전과 픽셀 단위로 동일하다.

## 배경

`<!-- include: -->`는 HTML 문법이 아니라 `vite.config.js`가 정규식으로 치환하던 주석이었다.
파티셜은 단독으로 유효한 문서가 아니었고, 파티셜 안에서 SVG를 다시 include하느라 재귀 가드까지
붙어 있었다.

## 변경

- 파티셜 7개·SVG 4개: 확장자만 `.astro`로 변경, 내용 무수정
- `index.html` → `src/pages/index.astro`. include 주석 7줄이 컴포넌트 태그로
- 인라인 스크립트 2개는 `is:inline`으로 유지
- `compressHTML: false` — 앞으로 글을 고칠 때 인라인 요소 옆 공백이 사라지지 않도록
- `globals.css`의 `@source` 수정 — 자동 감지가 Astro 생성물을 긁어 죽은 규칙이 섞이던 문제 해결
- 루트에 `prettier-plugin-astro` 추가 — `.astro`에서 `pnpm format`이 죽던 회귀 해결
- `vite.config.js` 삭제

## 검증

PDF를 비압축 래스터로 변환해 픽셀 데이터 영역을 비교했다. 이전 전후 차이 0.

- 설계·검증 상세: `docs/superpowers/specs/2026-09-04-portfolio-astro-migration-design.md`
- 구현 계획: `docs/superpowers/plans/2026-09-04-portfolio-astro-migration.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NMJcxahZLEPccuWgjzvQdH
BODY
)"
```

- [ ] **Step 6: Vercel 프리뷰 배포 확인**

PR이 열리면 Vercel이 프리뷰를 빌드한다. `engines: node >=22.12.0`이 실제로 먹는지, 빌드가 통과하는지
확인한다. 스펙의 **미확인** 절에 남겨둔 Vercel Node 버전 불확실성이 여기서 닫힌다.

빌드가 Node 버전으로 실패하면 Vercel 프로젝트 설정에서 Node 22.x를 지정한다

---

## 롤백

어느 단계에서든 픽셀 게이트가 통과하지 않고 원인을 특정하지 못하면 브랜치를 버린다.

```bash
cd /Users/yj/Workspace/yjlogs
git switch develop
git branch -D refactor/portfolio-astro
pnpm install
```

`apps/portfolio`는 develop 상태로 완전히 돌아간다.
