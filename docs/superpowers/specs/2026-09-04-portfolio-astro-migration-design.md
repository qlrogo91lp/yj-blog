# 포트폴리오 앱 Astro 이전 설계

**작성일:** 2026-09-04
**상태:** 검토 대기
**선행 스펙:** `2026-09-02-portfolio-app-design.md` — 이 문서가 정한 Vite + HTML 파티셜 구조를 교체한다

---

## 배경

`apps/portfolio`는 Vite + Tailwind v4 위에 커스텀 include 플러그인을 얹어 HTML 조각을 이어 붙인다. 이
구조에는 문법이 없다.

- `<!-- include: src/components/cover.html -->`는 HTML이 아니다. `vite.config.js`가 정규식으로 치환하는
  주석이고, 에디터도 Prettier도 브라우저도 이것을 모른다.
- `src/components/*.html`은 `.html` 확장자를 달았지만 `<html>`·`<body>`가 없다. 단독으로 열면 아무것도
  나오지 않는다.
- include가 재귀한다. 파티셜 안에서 다시 SVG 네 개를 include하며, 무한 루프를 막으려고 `depth > 5` 가드까지
  붙어 있다. 해킹 위에 해킹이 얹혔다.

파티셜 일곱 개 1,093줄 중 프로젝트 넷이 155~182줄로 구조가 거의 같다. 항목이 늘 때마다 마크업을 통째로
복사하는 구조다.

Astro는 이 문제를 정확히 겨냥한다. 컴포넌트가 1급 시민이므로 가짜 문법과 커스텀 플러그인이 통째로 사라진다.
간판 기능(파일 기반 라우팅, 콘텐츠 컬렉션, 아일랜드 하이드레이션, 이미지 최적화)은 이 프로젝트에서 하나도 쓰지
않지만, 그것들이 이유가 아니다.

`yj-resume`에서 같은 이전을 먼저 검증했고, 이 저장소에서도 scratchpad 복사본으로 재검증했다. 결과는 아래
**검증** 절에 있다.

## 결정 사항

### 채택

- **Astro 7.3.1 + Tailwind v4.** `@astrojs/tailwind` 인테그레이션(v3용)이 아니라 지금 쓰는
  `@tailwindcss/vite`를 `astro.config.mjs`의 `vite.plugins`에 그대로 꽂는다
- **구조만 1:1 이전.** 파티셜과 SVG는 확장자만 바꾸고 내용은 건드리지 않는다
- SVG 네 개도 `.astro` 컴포넌트로 만든다. 재귀 include와 1:1 대응이고, `?raw` + `set:html`보다 단순하다
- 인라인 `<script>`(IIFE와 `printDoc` 두 함수를 담은 블록 하나)는 `is:inline`으로 그대로 둔다
- **`compressHTML: false`.** 글을 고칠 때 공백을 신경 쓰지 않아도 되도록 Astro 7의 공백 압축을 끈다
  (아래 **공백 정책**). `yj-resume`도 같은 선택을 했다
- `globals.css`의 `@source` 지시자를 Astro 구조에 맞게 고친다 (아래 **함께 고치는 것**)
- `apps/portfolio/package.json`에 `"engines": { "node": ">=22.12.0" }`를 넣는다 (아래 **Node 요구사항**)
- 검증 기준은 **렌더 픽셀 비교**다. PDF 바이트 비교가 아니다 (아래 **검증 기준**)

### 제외

- **콘텐츠 데이터화** — 프로젝트 넷을 `projects.json` 같은 데이터로 빼는 일. 본문이 자유 서술 + 다이어그램 +
  figure 조합이라 스키마가 오히려 복잡해진다. 선행 스펙에서도 같은 이유로 제외했다
- **반복 마크업 컴포넌트화** — `chapter-head`·`meta-table`·`figure > strip`을 props 받는 컴포넌트로 추출하는
  일. 이득은 있으나 이번 범위를 넘는다. 이전이 끝난 뒤 별도 작업으로 다시 판단한다
- **`build.inlineStylesheets: 'always'`** — `yj-resume`에서는 `file://`로 열어야 해서 필수였다. 여기서는
  `astro preview` HTTP를 경유하므로 불필요하고, `public/` 이미지 15장이 따로 있어 어차피 단일 파일이 안 된다
- **스크립트를 Astro 관용구로 재작성** — `onclick` 속성을 `addEventListener`로 바꾸는 등. 1:1 범위를 벗어난다
- **`base: './'`** — Astro는 자산을 `/_astro/...` 절대 경로로 낸다. Vercel 루트 배포와 `astro preview` HTTP
  경로 모두 절대 경로로 동작하므로 그대로 둔다

## 구조

```
apps/portfolio/
├─ astro.config.mjs         신규 (vite.config.js 대체)
├─ package.json             scripts: astro dev/build/preview, pdf · engines 추가
├─ public/                  변경 없음
├─ scripts/
│  └─ export-pdf.mjs        1줄 변경 (vite preview → astro preview)
└─ src/
   ├─ globals.css           @source 지시자만 수정
   ├─ pages/
   │  └─ index.astro        index.html → 이동. include 주석 7줄이 컴포넌트 태그로
   ├─ components/
   │  ├─ cover.astro        내용 무수정
   │  ├─ toc.astro          내용 무수정
   │  ├─ closing.astro      내용 무수정
   │  └─ projects/
   │     ├─ hakon.astro         frontmatter import 추가 + SVG include 1줄 → <HakonPipeline />
   │     ├─ xamfinity.astro     동일
   │     ├─ watch-apps.astro    동일
   │     └─ yjlogs.astro        동일
   └─ diagrams/
      ├─ hakon-pipeline.astro    내용 무수정
      ├─ xamfinity-bridge.astro  내용 무수정
      ├─ watch-apps-yjkit.astro  내용 무수정
      └─ yjlogs-stack.astro      내용 무수정
```

삭제: `vite.config.js`, `index.html`(이동), `src/components/*.html`, `src/diagrams/*.svg`

### astro.config.mjs

```js
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  compressHTML: false,
  vite: { plugins: [tailwindcss()] },
});
```

### package.json

`vite` 의존성을 `astro`로 교체하고 `"type": "module"`과 `engines`를 추가한다. 스크립트는 `vite` → `astro`로
이름만 바뀐다. `pdf`는 `astro build && node scripts/export-pdf.mjs` 그대로다.

### 설치 시 주의

pnpm 11은 갓 릴리스된 패키지를 기본으로 막는다(minimum release age). 7.3.1은 2026-09-03 릴리스라
`pnpm add -D astro@latest`가 한 단계 낮은 7.2.10을 설치한다. 버전을 명시해 설치하면 pnpm이
`pnpm-workspace.yaml`에 다음을 자동으로 추가한다.

```yaml
minimumReleaseAgeExclude:
  - astro@7.3.1
```

이전 시점에 7.3.1이 충분히 묵었다면 이 항목은 생기지 않는다. 생겼다면 그대로 커밋한다.

## 공백 정책 — Astro 7의 변경점

Astro 7은 텍스트 노드의 앞뒤 공백을 v5보다 공격적으로 제거한다. `yj-resume`에서는 이것이 눈에 보이는 차이를
만들었다 — 인라인 텍스트 사이에 있던 include 주석의 줄바꿈이 공백 역할을 하고 있었는데, 그 공백이 사라져
`Developer · 6년차`가 `Developer ·6년차`가 됐다.

**이 프로젝트는 압축을 켜도 영향받지 않는다.** 줄바꿈으로 분리된 인라인 요소를 전수 검색한 결과 0건이었다.
Prettier가 이미 인라인 경계를 `>` 매달기 형태로 포맷해 두었고(`</span\n>`), `yj-resume`과 달리 이 프로젝트의
include 주석이 전부 블록 레벨에 있기 때문이다.

**그럼에도 `compressHTML: false`로 압축을 끈다.** 지금 안전한 것과 앞으로 안전한 것은 다르다. 이 문서는 계속
글을 고치고 문단을 더하는 문서이고, 압축이 켜져 있으면 인라인 요소 옆에 줄바꿈을 넣는 순간 공백이 조용히
사라진다. 빌드도 린트도 이것을 알려주지 않는다. 글 쓰는 사람이 마크업 줄바꿈 규칙을 기억해야 하는 상태를
만들지 않는다.

대가는 HTML이 38,730 → 43,503바이트로 4.8KB 커지는 것뿐이다. 로컬에서 PDF를 뽑고 Vercel에 정적 배포하는
문서에서 이 크기는 의미가 없다.

## 검증 기준 — 픽셀 비교

`compressHTML: false`를 켜면 **PDF 바이트 비교를 게이트로 쓸 수 없다.** 압축을 끄면 HTML의 공백 배치가
달라지고, 렌더 결과가 같아도 PDF 안의 텍스트 조각 분할이 달라져 콘텐츠 스트림 바이트가 바뀐다. 실측하면
생성 시각 10바이트 + 콘텐츠 스트림 21바이트, 총 31바이트가 다르다. 이 차이는 무해하지만 "차이 0"이라는
기준을 세울 수 없게 만든다.

그래서 게이트를 **렌더 픽셀 비교**로 둔다. PDF를 비압축 래스터로 변환해 픽셀 데이터 영역만 비교한다.

```bash
sips -s format tiff -s formatOptions none --out before.tiff before.pdf
sips -s format tiff -s formatOptions none --out after.tiff  after.pdf

# 픽셀 데이터 크기 = width * height * 4 (RGBA)
sips -g pixelWidth -g pixelHeight before.tiff

cmp -n $((WIDTH * HEIGHT * 4)) before.tiff after.tiff && echo "픽셀 동일"
```

`-n`으로 앞부분만 비교하는 이유는 TIFF 꼬리에 변환 시각 메타데이터가 들어가기 때문이다. 그 영역까지 비교하면
항상 5바이트가 다르게 나온다.

## Node 요구사항

Astro 7의 `engines`는 `node >=22.12.0`이다. 로컬은 22.17.0이라 통과한다.

이 저장소에는 `.nvmrc`도 `engines` 필드도 없어 Vercel이 기본 Node 버전으로 빌드한다. 그 버전이 22.12 미만이면
배포가 깨진다. 대시보드 설정에 의존하지 않도록 `apps/portfolio/package.json`에 `engines`를 넣어 명시한다.
Vercel은 이 필드를 읽어 Node 버전을 정한다.

GitHub Actions에는 `discord-notify.yml` 하나뿐이고 Node를 쓰지 않아 영향이 없다.

## 함께 고치는 것

`src/globals.css`의 `@source '../index.html'`은 이전 후 존재하지 않는 경로가 된다. 그대로 두면 Tailwind v4의
자동 감지가 Astro 생성물(`.astro/content.d.ts`)까지 긁어 쓰지 않는 `.filter` 규칙이 CSS에 섞인다.

```css
@import 'tailwindcss' source(none);
@source './pages';
@source './components';
@source './diagrams';
```

`source(none)`으로 자동 감지를 끄고 스캔 대상을 명시한다. 이 수정을 포함해 빌드하면 CSS가 17,586 →
17,513바이트로 오히려 줄고, 렌더 결과는 그대로다.

## 검증

scratchpad에 현재 구조와 Astro 구조를 각각 만들어 `pnpm pdf`로 PDF를 뽑고, 비압축 래스터로 변환해 픽셀을
비교했다. `apps/portfolio`는 건드리지 않았다.

```
픽셀 데이터 675 × 9544 × 4 = 25,768,800 bytes
  Astro 7 + compressHTML:false → 현재와 완전 동일 (차이 0)
  Astro 7 기본(압축 ON)        → 현재와 완전 동일 (차이 0)
PDF 크기는 세 경우 모두 5,080,649 bytes, 1 page
```

개별 확인 항목:

| 항목 | 방법 | 결과 |
|---|---|---|
| `printDoc()` 전역 등록 | headless Chrome에서 `typeof printDoc` 평가 | 양쪽 `function` — `onclick` 정상 |
| `?print=1`의 `@page` 동적 주입 | PDF 페이지 수 | 양쪽 1페이지 |
| Astro 7 공백 압축 영향 | 픽셀 비교 + 위험 패턴 전수 검색 | 영향 없음. 위험 패턴 0건 |
| `compressHTML: false` 적용 후 | 픽셀 비교 | 완전 동일. PDF 바이트만 31개 차이 |
| SVG → `.astro` 파서 통과 | `astro build` | 성공. `viewBox`·`xmlns`·`text-anchor`·`marker` 모두 통과 |
| 파티셜 내용 무수정 가능 | `{`·`}` 문자 검색 | 파티셜·SVG 전부 0개. Astro 표현식과 충돌 없음 |
| `@source` 수정 후 동등성 | 픽셀 비교 | 완전 동일 |

`@page` 동적 주입이 가장 강한 증거다. 이 문서는 `scrollHeight`를 재서 `@page size`를 통째로 주입해 한 장으로
이어 붙이는데, 렌더가 픽셀 단위로 같다는 것은 그 계산까지 동일하게 돌았다는 뜻이다.

Astro 5.18.2로도 같은 결과였다. v7을 택한 이유는 최신 메이저를 쓰면 가까운 시일에 메이저 업그레이드를 다시 할
필요가 없기 때문이고, 결과물에는 차이가 없다.

## 이전 절차

이전 자체가 되돌리기 쉬운 규모이므로 브랜치 하나에서 순서대로 진행한다.

1. 이전 전 기준 PDF 확보 (`pnpm pdf` 후 `apps/portfolio/dist/` 밖으로 복사)
2. Astro 설치, `astro.config.mjs`·`package.json` 교체
3. 파티셜·SVG 확장자 변경, `index.html` → `src/pages/index.astro`
4. `globals.css`의 `@source` 수정
5. `export-pdf.mjs` 1줄 수정
6. `vite.config.js` 삭제
7. `pnpm pdf`로 PDF를 뽑아 1번의 기준 PDF와 **픽셀 비교** (위 **검증 기준**의 명령. 차이 0이어야 한다)
8. `pnpm dev`로 화면 확인, 인쇄 버튼 동작 확인

1번의 기준 PDF는 `dist/`가 gitignore 대상이라 저장소에 남지 않고 이전 도중 빌드로 덮어써진다. 반드시 밖으로
복사해 둔다.

## 비용과 리스크

- `node_modules` 45MB → 167MB. 유일한 실질 비용이다
- Node 22.12 미만 환경에서는 빌드가 안 된다. `engines` 필드로 명시한다
- pnpm `allowBuilds`(`esbuild`·`sharp`)는 루트 `pnpm-workspace.yaml`에 이미 있다
- Turborepo `outputs`가 `dist/**`라 그대로 맞는다. Vercel Root Directory(`apps/portfolio`)도 그대로다
- 되돌리기는 브랜치 폐기로 끝난다

## 미확인

`pnpm dev`의 HMR은 실측하지 않았다. 현재 `vite.config.js`에는 파티셜 변경을 감지하는 훅이 없어 갱신이 안 될
가능성이 높고 Astro에서는 정상 동작할 것으로 보이나, 확인하지 않았으므로 이전의 근거로 삼지 않는다. 이전 절차
8번에서 확인한다.

Vercel의 현재 기본 Node 버전은 대시보드 설정이라 확인하지 못했다. `engines` 필드가 이 불확실성을 덮는다.
