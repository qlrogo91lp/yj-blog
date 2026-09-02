# 레이아웃 폭 · 이미지 표시 체계 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## 완료 (2026-08-17)

Task 0~8 전체 완료, 서브에이전트 기반(subagent-driven-development)으로 실행. 태스크별 리뷰 전부 clean 통과(Task 1은 fix round 1회 — 코드 결함 아닌 보고서 정확성 문제).

- 본문 폭 653px → 720px, 목록 폭 컨테이너 실폭 948px → 980px로 통일. `ArticleContainer` 신규 추가.
- `max-w-3xl`·`max-w-2xl` 하드코딩 6곳 제거, 시리즈·태그·apps·playground를 `ContentContainer`로 흡수.
- 이미지 크기 3단계(`small`/`default`/`full`) 재정의, radius 16px 적용. 툴바 정렬 버튼은 `small`에서만 활성화하도록 변경.
- 에디터·미리보기 폭을 발행 폭(720px)에 맞춤.
- 프로덕션 DB `posts.id=1`(dell-s2725qc)의 `data-size="medium"` 6곳을 `default`로 치환, 잔여 0건 확인.
- 최종 검증: 단위 테스트 224/224, 린트 clean(사전 존재 이슈 2건 제외), 빌드 성공, E2E 10/11(`ralli.spec.ts:45` 모바일 가로 스크롤 실패는 `develop`에서도 재현되는 사전 존재 결함으로 확정, 이 브랜치와 무관).
- Task 6 진행 중 계획에 없던 `image-toolbar.test.tsx` 갱신 필요성을 발견해 범위에 포함(계획 누락, 컨트롤러 보완).

**Goal:** 블로그의 폭 기준을 `--content-width`(980px) / `--article-width`(720px) 두 개로 통일하고, 본문 이미지를 3단계(small/default/full) + radius 16px 체계로 재정의한다.

**Architecture:** CSS 변수의 의미를 "패딩 제외 콘텐츠 실폭"으로 못 박고, 두 개의 컨테이너 컴포넌트(`ContentContainer`·`ArticleContainer`)가 같은 `max-w-[calc(var(--X)+2rem)] px-4` 규칙을 공유한다. 페이지는 컨테이너를 고르기만 한다. 이미지 크기는 `data-size` 속성 하나로 결정되며, 그 정의는 `image-extension.ts`(타입·기본값)와 `prose.css`(폭·radius) 두 곳에만 존재한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, Tiptap, Vitest + Testing Library, Drizzle ORM (Neon Postgres)

**설계 문서:** [2026-08-17 레이아웃 폭 · 이미지 표시 체계](../specs/2026-08-17-layout-width-image-display-design.md)

## Global Constraints

- `--content-width: 980px`, `--article-width: 720px`, `--radius-image: 1rem`(16px) — 변수값은 **패딩을 제외한 콘텐츠 실폭**을 의미한다.
- 모든 폭 컨테이너는 `max-w-[calc(var(--X)+2rem)] px-4` 규칙을 따른다. 에디터처럼 `px-6`을 쓰는 곳은 `+3rem`.
- 이미지 `data-size` 값은 `small` | `default` | `full` 셋뿐이다. 기본값은 `default`.
- Tailwind v4 문법을 쓴다 — CSS 변수 shorthand는 `max-w-(--x)`, 그라디언트는 `bg-linear-*`, spacing 스케일은 숫자 유틸(`w-55`). 단 `calc()` 안에서는 `var(--x)` 형태를 그대로 쓴다.
- lucide 아이콘 크기는 `className`이 아닌 `size` 속성으로 지정한다.
- `console.log`를 커밋하지 않는다.
- 커밋 메시지는 gitmoji를 사용한다.
- 작업 브랜치: `refactor/layout-width-image-display` (develop에서 분기)

---

## Task 0: 작업 브랜치 생성

**Files:** 없음

- [x] **Step 1: develop 최신 상태 확인**

```bash
git checkout develop && git pull
```

- [x] **Step 2: 브랜치 생성**

```bash
git checkout -b refactor/layout-width-image-display
```

- [x] **Step 3: 테스트가 현재 전부 통과하는지 확인**

Run: `npm run test:run`
Expected: PASS (변경 전 기준선 확보)

---

## Task 1: 폭 토큰과 컨테이너 규칙 통일

**Files:**

- Modify: `src/app/globals.css:55` (`--radius-image` 추가), `src/app/globals.css:61` (`--article-width`)
- Modify: `src/components/layout/content-container.tsx:10`
- Modify: `src/components/layout/content-container.test.tsx:14`
- Create: `src/components/layout/article-container.tsx`
- Test: `src/components/layout/article-container.test.tsx`

**Interfaces:**

- Produces: `ArticleContainer({ className?: string; children: React.ReactNode })` — `@/components/layout/article-container`에서 named export. Task 2가 이 컴포넌트를 사용한다.
- Produces: CSS 변수 `--radius-image` — Task 5의 `prose.css`가 `var(--radius-image)`로 참조한다.

- [x] **Step 1: 기존 테스트의 기대값을 새 규칙으로 수정 (실패하는 상태로)**

`src/components/layout/content-container.test.tsx`의 두 번째 테스트를 이렇게 바꾼다.

```tsx
it('content-width max-width 클래스를 적용한다', () => {
  const { container } = render(<ContentContainer>x</ContentContainer>);
  expect(container.firstElementChild?.className).toContain(
    'max-w-[calc(var(--content-width)+2rem)]'
  );
});
```

- [x] **Step 2: 테스트를 돌려 실패를 확인**

Run: `npm run test:run -- src/components/layout/content-container.test.tsx`
Expected: FAIL — 현재 클래스는 `max-w-[var(--content-width)]`이므로 `toContain`이 어긋난다.

- [x] **Step 3: ContentContainer를 새 규칙으로 수정**

`src/components/layout/content-container.tsx`의 className을 교체한다.

```tsx
    <div className={cn('mx-auto w-full max-w-[calc(var(--content-width)+2rem)] px-4', className)}>
```

- [x] **Step 4: 테스트 통과 확인**

Run: `npm run test:run -- src/components/layout/content-container.test.tsx`
Expected: PASS

- [x] **Step 5: ArticleContainer 테스트를 먼저 작성**

`src/components/layout/article-container.test.tsx` 신규 생성.

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ArticleContainer } from './article-container';

describe('ArticleContainer', () => {
  it('children을 렌더링한다', () => {
    render(<ArticleContainer>내용</ArticleContainer>);
    expect(screen.getByText('내용')).toBeInTheDocument();
  });

  it('article-width max-width 클래스를 적용한다', () => {
    const { container } = render(<ArticleContainer>x</ArticleContainer>);
    expect(container.firstElementChild?.className).toContain(
      'max-w-[calc(var(--article-width)+2rem)]'
    );
  });

  it('전달한 className을 병합한다', () => {
    const { container } = render(
      <ArticleContainer className="py-8">x</ArticleContainer>
    );
    expect(container.firstElementChild?.className).toContain('py-8');
  });
});
```

- [x] **Step 6: 테스트를 돌려 실패를 확인**

Run: `npm run test:run -- src/components/layout/article-container.test.tsx`
Expected: FAIL — `./article-container` 모듈이 없어 import 에러

- [x] **Step 7: ArticleContainer 구현**

`src/components/layout/article-container.tsx` 신규 생성.

```tsx
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function ArticleContainer({ className, children }: Props) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[calc(var(--article-width)+2rem)] px-4',
        className
      )}
    >
      {children}
    </div>
  );
}
```

- [x] **Step 8: 테스트 통과 확인**

Run: `npm run test:run -- src/components/layout/article-container.test.tsx`
Expected: PASS

- [x] **Step 9: 토큰 값 변경**

`src/app/globals.css`의 `@theme` 블록에서 `--radius-card: 2rem;` 바로 아래 줄에 추가한다.

```css
--radius-image: 1rem;
```

같은 파일 `:root` 블록의 `--article-width`를 바꾼다.

```css
--article-width: 720px;
```

- [x] **Step 10: 전체 테스트와 린트 확인**

Run: `npm run test:run && npm run lint`
Expected: PASS

- [x] **Step 11: 커밋**

```bash
git add src/app/globals.css src/components/layout/
git commit -m "🎨 폭 토큰을 콘텐츠 실폭 기준으로 통일하고 ArticleContainer 추가"
```

---

## Task 2: 산문 페이지를 ArticleContainer로 전환

**Files:**

- Modify: `src/app/(main)/posts/[slug]/page.tsx:97`
- Modify: `src/app/(main)/posts/[slug]/_components/comment-section.tsx:13`
- Modify: `src/app/(main)/apps/ralli/privacy/page.tsx:14`

**Interfaces:**

- Consumes: `ArticleContainer` (Task 1)

- [x] **Step 1: 글 상세 본문 래퍼 교체**

`src/app/(main)/posts/[slug]/page.tsx`에 import를 추가한다.

```tsx
import { ArticleContainer } from '@/components/layout/article-container';
```

97행의 `<div className="relative mx-auto max-w-[calc(var(--article-width)+2rem)] px-4 py-8">`를 아래로 바꾼다. 닫는 `</div>`는 `</ArticleContainer>`가 된다.

```tsx
      <ArticleContainer className="relative py-8">
```

> `relative`는 TOC(`absolute`)의 기준이므로 반드시 유지한다. TOC의 `left-[calc(...)]` 계산식은 그대로 둔다 — 설계 문서 §6의 검산대로 `--article-width`가 소거되어 영향이 없다.

- [x] **Step 2: 댓글 섹션 교체**

`src/app/(main)/posts/[slug]/_components/comment-section.tsx`에 import를 추가하고,

```tsx
import { ArticleContainer } from '@/components/layout/article-container';
```

13행의 `<section className="mx-auto max-w-[var(--article-width)] border-t px-4 py-8">`를 아래 구조로 바꾼다. 닫는 태그는 `</ArticleContainer></section>` 순서다.

```tsx
    <section>
      <ArticleContainer className="border-t py-8">
```

> `section`을 유지해 semantic을 보존하고, 폭·구분선은 `ArticleContainer`가 갖는다. 구분선 폭이 621px → 752px로 넓어지며 본문과 정렬이 맞는다.

- [x] **Step 3: ralli privacy 교체**

`src/app/(main)/apps/ralli/privacy/page.tsx`에 import를 추가하고, 14행 `<div className="mx-auto max-w-2xl px-4 py-12">`를 바꾼다. 닫는 `</div>`는 `</ArticleContainer>`가 된다.

```tsx
      <ArticleContainer className="py-12">
```

- [x] **Step 4: 타입·린트 확인**

Run: `npm run lint`
Expected: PASS (닫는 태그 불일치가 있으면 여기서 파싱 에러로 잡힌다)

- [x] **Step 5: 개발 서버로 육안 확인**

`npm run dev` 실행 후 `/posts/<발행된 slug>`, `/apps/ralli/privacy`를 연다.
확인 항목: 본문 텍스트 컬럼이 720px, 댓글 영역이 본문과 같은 좌우 정렬, 1500px 이상 창에서 우측 TOC가 이전과 같은 위치.

- [x] **Step 6: 커밋**

```bash
git add "src/app/(main)/posts/[slug]/page.tsx" "src/app/(main)/posts/[slug]/_components/comment-section.tsx" "src/app/(main)/apps/ralli/privacy/page.tsx"
git commit -m "🎨 산문 페이지를 ArticleContainer(720px)로 전환"
```

---

## Task 3: 목록 페이지를 ContentContainer로 흡수

**Files:**

- Modify: `src/app/(main)/series/page.tsx:14`
- Modify: `src/app/(main)/series/[slug]/page.tsx:42`
- Modify: `src/app/(main)/tags/page.tsx:15`
- Modify: `src/app/(main)/apps/page.tsx:13`
- Modify: `src/app/(main)/apps/[slug]/page.tsx:36`
- Modify: `src/app/(main)/playground/page.tsx:11`

**Interfaces:**

- Consumes: `ContentContainer` (기존, Task 1에서 규칙 변경됨)

- [x] **Step 1: 여섯 파일의 래퍼를 교체**

각 파일에 import를 추가한다.

```tsx
import { ContentContainer } from '@/components/layout/content-container';
```

그리고 아래 표대로 여는 태그를 바꾼다. 닫는 `</div>`는 모두 `</ContentContainer>`가 된다.

| 파일                        | 현재                                             | 변경 후                                |
| --------------------------- | ------------------------------------------------ | -------------------------------------- |
| `series/page.tsx:14`        | `<div className="mx-auto max-w-3xl px-4 py-8">`  | `<ContentContainer className="py-8">`  |
| `series/[slug]/page.tsx:42` | `<div className="mx-auto max-w-3xl px-4 py-8">`  | `<ContentContainer className="py-8">`  |
| `tags/page.tsx:15`          | `<div className="mx-auto max-w-3xl px-4 py-8">`  | `<ContentContainer className="py-8">`  |
| `apps/page.tsx:13`          | `<div className="mx-auto max-w-3xl px-4 py-10">` | `<ContentContainer className="py-10">` |
| `apps/[slug]/page.tsx:36`   | `<div className="mx-auto max-w-3xl px-4 py-10">` | `<ContentContainer className="py-10">` |
| `playground/page.tsx:11`    | `<div className="mx-auto max-w-3xl px-4 py-10">` | `<ContentContainer className="py-10">` |

- [x] **Step 2: 하드코딩 잔여가 없는지 검증**

Run: `grep -rn "max-w-3xl\|max-w-2xl" "src/app/(main)"`
Expected: 출력 없음 (0건)

- [x] **Step 3: 린트 확인**

Run: `npm run lint`
Expected: PASS

- [x] **Step 4: 개발 서버로 육안 확인**

`/series`, `/tags`, `/apps`, `/apps/<slug>`, `/playground`를 열어 헤더·푸터와 좌우 정렬선이 일치하는지 본다.

- [x] **Step 5: 커밋**

```bash
git add "src/app/(main)"
git commit -m "🎨 목록 페이지 폭을 ContentContainer(980px)로 통일"
```

---

## Task 4: 이미지 크기 값을 medium에서 default로 재정의

**Files:**

- Modify: `src/app/admin/posts/new/_utils/image-extension.ts`
- Modify: `src/app/admin/posts/new/_utils/image-extension.test.ts:24-28`, `:39`
- Modify: `src/lib/markdown.test.ts:7`, `:23`
- Modify: `src/app/admin/posts/new/_components/_image-block/image-node-view.tsx:15`

**Interfaces:**

- Produces: `type ImageSize = 'small' | 'default' | 'full'` — Task 6의 툴바가 이 타입을 import한다.
- Produces: 직렬화 HTML의 `data-size="default"` — Task 5의 CSS 선택자, Task 8의 마이그레이션 SQL이 이 문자열에 의존한다.

- [x] **Step 1: 테스트 기대값을 새 값으로 수정 (실패하는 상태로)**

`src/app/admin/posts/new/_utils/image-extension.test.ts`에서 두 곳을 바꾼다.

```tsx
it('속성이 없는 기존 이미지는 기본값(default/center)으로 직렬화된다', () => {
  const editor = createEditor('<p><img src="a.png" /></p>');
  const html = editor.getHTML();
  expect(html).toContain('data-size="default"');
  expect(html).toContain('data-align="center"');
});
```

그리고 `data-caption` 테스트의 픽스처 문자열에서 `data-size="medium"`을 `data-size="default"`로 바꾼다.

```tsx
      '<p><img src="a.png" data-size="default" data-align="center" data-caption="강남역 저녁" /></p>',
```

- [x] **Step 2: 알 수 없는 값이 default로 폴백되는지 검증하는 테스트 추가**

같은 파일의 `describe` 블록 안에 새 테스트를 추가한다. 기존 글에 남아 있을 수 있는 `medium` 문자열이 안전하게 수렴하는지 확인하는 회귀 테스트다.

```tsx
it('알 수 없는 data-size 값은 default로 폴백된다', () => {
  const editor = createEditor('<p><img src="a.png" data-size="medium" /></p>');
  const html = editor.getHTML();
  expect(html).toContain('data-size="default"');
});
```

- [x] **Step 3: 테스트를 돌려 실패를 확인**

Run: `npm run test:run -- src/app/admin/posts/new/_utils/image-extension.test.ts`
Expected: FAIL — 현재 기본값·폴백이 `medium`이라 3개 테스트가 깨진다.

- [x] **Step 4: ImageBlock의 타입과 기본값을 수정**

`src/app/admin/posts/new/_utils/image-extension.ts`에서 타입, 가드, size 속성 세 곳을 바꾼다.

```ts
export type ImageSize = 'small' | 'default' | 'full';

function isImageSize(v: string | null): v is ImageSize {
  return v === 'small' || v === 'default' || v === 'full';
}
```

```ts
      size: {
        default: 'default' as ImageSize,
        parseHTML: (el) => {
          const v = el.getAttribute('data-size');
          return isImageSize(v) ? v : 'default';
        },
        renderHTML: (attrs) => ({ 'data-size': attrs.size ?? 'default' }),
      },
```

- [x] **Step 5: 테스트 통과 확인**

Run: `npm run test:run -- src/app/admin/posts/new/_utils/image-extension.test.ts`
Expected: PASS

- [x] **Step 6: markdown 테스트의 픽스처를 갱신**

`src/lib/markdown.test.ts`의 두 곳에서 `data-size="medium"`을 `data-size="default"`로 바꾼다 (7행 캡션 변환 테스트, 23행 캡션 없는 img 테스트). 단언문은 그대로 둔다.

- [x] **Step 7: markdown 테스트 통과 확인**

Run: `npm run test:run -- src/lib/markdown.test.ts`
Expected: PASS

- [x] **Step 8: 노드 뷰의 폴백 값 수정**

`src/app/admin/posts/new/_components/_image-block/image-node-view.tsx:15`를 바꾼다.

```tsx
const size = (node.attrs.size as ImageSize) ?? 'default';
```

- [x] **Step 9: 전체 테스트와 린트 확인**

Run: `npm run test:run && npm run lint`
Expected: PASS

- [x] **Step 10: 커밋**

```bash
git add src/app/admin/posts/new/_utils/ src/app/admin/posts/new/_components/_image-block/image-node-view.tsx src/lib/markdown.test.ts
git commit -m "♻️ 이미지 크기 기본값을 medium에서 default로 재정의"
```

---

## Task 5: 이미지 폭과 radius를 prose.css에 반영

**Files:**

- Modify: `src/styles/prose.css:122-145` (크기 규칙과 radius)

**Interfaces:**

- Consumes: `--radius-image` (Task 1), `data-size="default"` (Task 4)

- [x] **Step 1: 크기 선택자와 radius를 수정**

`src/styles/prose.css`의 `/* ── 이미지 블록 (data-size / data-align) ── */` 아래 블록을 아래로 교체한다. `medium`(70%) 규칙이 `default`(100%)로 바뀌고, 이미지에 radius가 붙는다.

```css
.prose figure[data-size],
.prose img[data-size] {
  display: block;
}
.prose img[data-size] {
  border-radius: var(--radius-image);
}
.prose figure[data-size='small'],
.prose img[data-size='small'] {
  width: 40%;
}
.prose figure[data-size='default'],
.prose img[data-size='default'] {
  width: 100%;
}
.prose figure[data-size='full'],
.prose img[data-size='full'] {
  width: var(--content-width);
  max-width: calc(100vw - 2rem);
  margin-left: 50%;
  transform: translateX(-50%);
}
.prose figure[data-size] img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-image);
}
```

> `data-align` 규칙, `[data-size="full"][data-align]` specificity 재정의, `@media (max-width: 640px)` 블록은 **건드리지 않는다.** 모바일 블록의 선택자는 `[data-size]`와 `[data-size="full"]`만 쓰므로 값 이름 변경의 영향을 받지 않는다.

- [x] **Step 2: medium 잔여가 없는지 확인**

Run: `grep -n "medium" src/styles/prose.css`
Expected: 출력 없음

- [x] **Step 3: 개발 서버로 세 단계를 육안 확인**

`npm run dev` 후 발행된 글 상세를 연다. 확인 항목:

- `default` 이미지의 좌우 끝이 본문 텍스트의 좌우 끝과 일치(720px)
- `full` 이미지가 본문 밖으로 좌우 각 130px 튀어나오고 목록 페이지의 좌우 정렬선(980px)과 일치
- 세 단계 모두 모서리가 16px 둥글게
- 브라우저 창을 640px 이하로 줄이면 전부 100% 폭이 되고 `full`의 bleed가 사라짐

- [x] **Step 4: 커밋**

```bash
git add src/styles/prose.css
git commit -m "💄 이미지 기본 폭을 본문 폭에 맞추고 radius 16px 적용"
```

---

## Task 6: 이미지 툴바를 3단계로 정리하고 정렬 활성 조건 변경

**Files:**

- Modify: `src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx:21-25` (sizeOptions), `:46` (alignDisabled)

**Interfaces:**

- Consumes: `ImageSize` (Task 4)

- [x] **Step 1: sizeOptions를 3단계로 교체**

`src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx`의 `sizeOptions`를 바꾼다.

```tsx
const sizeOptions: { value: ImageSize; label: string; icon?: LucideIcon }[] = [
  { value: 'small', label: '40%' },
  { value: 'default', label: '기본' },
  { value: 'full', label: '전체 폭', icon: ChevronsLeftRight },
];
```

> `full`의 라벨을 `100%`에서 `전체 폭`으로 바꾼다. 실제 폭은 본문의 136%(980/720)라 `100%`는 사실과 다르다. 라벨은 `aria-label`로만 쓰이고 화면에는 아이콘이 표시된다.

- [x] **Step 2: 정렬 버튼의 비활성 조건을 변경**

같은 파일 46행을 바꾼다.

```tsx
const alignDisabled = size !== 'small';
```

> `default`(100%)와 `full`은 폭이 컨테이너를 가득 채워 `margin: auto` 정렬이 아무 효과가 없다. 정렬은 `small`에서만 의미를 갖는다.

- [x] **Step 3: 린트 확인**

Run: `npm run lint`
Expected: PASS

- [x] **Step 4: 에디터에서 동작 확인**

`npm run dev` 후 `/admin/posts/new`에서 이미지를 하나 삽입하고 확인한다.

- 삽입 직후 기본값이 `기본`으로 선택되어 있고 폭이 본문을 채운다
- `40%` 선택 시에만 정렬 3버튼이 활성화된다
- `전체 폭` 선택 시 이미지가 편집 영역 밖으로 넓게 펼쳐진다

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_components/_image-block/image-toolbar.tsx
git commit -m "💄 이미지 툴바를 3단계로 정리하고 정렬은 small에서만 활성화"
```

---

## Task 7: 에디터와 미리보기 폭을 발행 폭에 맞춤

**Files:**

- Modify: `src/app/admin/posts/new/page.tsx:31`
- Modify: `src/app/admin/posts/[id]/edit/page.tsx:48`
- Modify: `src/app/admin/posts/new/_actions/_preview/preview.action.tsx:34-40`

**Interfaces:**

- Consumes: `ArticleContainer` (Task 1)

- [x] **Step 1: 새 글 작성 페이지의 폭 교체**

`src/app/admin/posts/new/page.tsx:31`을 바꾼다. `px-6`(좌우 24px씩)에 맞춰 `+3rem`을 더한다.

```tsx
        <div className="flex-1 mx-auto w-full max-w-[calc(var(--article-width)+3rem)] px-6 py-6">
```

- [x] **Step 2: 수정 페이지의 폭 교체**

`src/app/admin/posts/[id]/edit/page.tsx:48`을 같은 값으로 바꾼다.

```tsx
        <div className="flex-1 mx-auto w-full max-w-[calc(var(--article-width)+3rem)] px-6 py-6">
```

- [x] **Step 3: 미리보기 다이얼로그의 본문 컬럼을 720px로 제한**

`src/app/admin/posts/new/_actions/_preview/preview.action.tsx`에 import를 추가하고,

```tsx
import { ArticleContainer } from '@/components/layout/article-container';
```

`<article className="mt-4">` 블록을 아래로 바꾼다. 다이얼로그 크기(`min-w-4xl max-w-[80vw]`)는 그대로 둔다.

```tsx
<ArticleContainer className="mt-4">
  <article>
    <h1 className="text-3xl font-bold mb-6">{title || '제목 없음'}</h1>
    <div
      className="prose prose-neutral dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </article>
</ArticleContainer>
```

- [x] **Step 4: 린트 확인**

Run: `npm run lint`
Expected: PASS

- [x] **Step 5: 편집 화면과 발행 결과의 폭이 같은지 확인**

`npm run dev` 후 `/admin/posts/new`에서 이미지가 포함된 내용을 작성하고 미리보기를 연다.
확인 항목: 에디터 본문 · 미리보기 본문 · 발행된 글 상세 세 곳의 텍스트 컬럼 폭이 모두 720px로 같다.

> **알려진 제약**: `full` 이미지의 `max-width: calc(100vw - 2rem)`은 관리자 사이드바 폭을 계산에 넣지 못한다. 사이드바가 열린 상태에서 창이 좁으면 에디터 안에서만 이미지가 살짝 넘칠 수 있다. 발행 화면에는 영향이 없으며 이번 범위에서 대응하지 않는다.

- [x] **Step 6: 커밋**

```bash
git add src/app/admin/posts/
git commit -m "🎨 에디터·미리보기 폭을 발행 본문 폭(720px)에 맞춤"
```

---

## Task 8: 기존 글 데이터 마이그레이션과 최종 검증

**Files:** 없음 (DB 작업)

**Interfaces:**

- Consumes: `data-size="default"` 직렬화 규칙 (Task 4), CSS 선택자 (Task 5)

- [x] **Step 1: 마이그레이션 대상 건수를 먼저 확인**

Neon 프로젝트 `patient-snow-09565096`(yj-blog)에 아래 조회를 실행한다.

```sql
SELECT id, slug,
       (length(content) - length(replace(content, 'data-size="medium"', ''))) / length('data-size="medium"') AS medium_count
FROM posts
WHERE content LIKE '%data-size="medium"%';
```

Expected: 1행 (2026-08-17 기준). 결과가 0행이면 Step 2·3을 건너뛴다.

- [x] **Step 2: 사용자에게 실행 승인을 받는다**

프로덕션 DB의 글 본문을 수정하는 작업이다. Step 1의 조회 결과(대상 글 slug와 치환 건수)를 사용자에게 보여주고 승인을 받은 뒤에만 다음 단계로 넘어간다.

- [x] **Step 3: 치환 실행**

```sql
UPDATE posts SET content = replace(content, 'data-size="medium"', 'data-size="default"')
WHERE content LIKE '%data-size="medium"%';
```

- [x] **Step 4: 잔여 0건 확인**

```sql
SELECT count(*) AS remaining FROM posts WHERE content LIKE '%data-size="medium"%';
```

Expected: `remaining = 0`

- [x] **Step 5: 전체 테스트와 빌드 확인**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 모두 PASS

- [x] **Step 6: 발행 화면 최종 확인**

`npm run dev` 후 마이그레이션한 글의 상세 페이지를 연다.
확인 항목: 이전에 `medium`이던 이미지가 본문 폭(720px)으로 렌더되고, `full` 이미지는 980px bleed를 유지하며, 모든 이미지에 16px radius가 적용되어 있다.

- [x] **Step 7: E2E 회귀 확인**

Run: `npm run test:e2e`
Expected: PASS — 기존 E2E(홈 목록, 뷰 전환 등)가 폭 변경으로 깨지지 않는지 확인한다. 실패하면 셀렉터가 폭에 의존하고 있다는 뜻이므로 해당 테스트를 수정한다.

- [x] **Step 8: 계획 문서 체크박스 정리와 완료 표기**

이 문서의 모든 `- [ ]`가 `- [x]`인지 확인하고, 문서 상단에 완료 일자와 결과 요약을 추가한 뒤 커밋한다.

```bash
git add docs/superpowers/plans/2026-08-17-layout-width-image-display.md
git commit -m "📝 레이아웃 폭·이미지 표시 체계 구현 완료 기록"
```

- [ ] **Step 9: PR 생성**

```bash
git push -u origin refactor/layout-width-image-display
```

`develop`을 대상으로 PR을 올린다. 머지는 `--no-ff`(squash 금지)로 한다.

---

## 검증 요약

| 항목                    | 확인 방법                                                                      |
| ----------------------- | ------------------------------------------------------------------------------ |
| 폭 하드코딩 제거        | `grep -rn "max-w-3xl\|max-w-2xl" "src/app/(main)"` → 0건                       |
| medium 잔여 제거 (코드) | `grep -rn "medium" src/styles/prose.css src/app/admin/posts/new/_utils/` → 0건 |
| medium 잔여 제거 (DB)   | `SELECT count(*) FROM posts WHERE content LIKE '%data-size="medium"%'` → 0     |
| 단위 테스트             | `npm run test:run`                                                             |
| E2E                     | `npm run test:e2e`                                                             |
| 빌드                    | `npm run build`                                                                |

## 범위 밖 (이 계획에서 하지 않는 것)

- 이미지 갤러리(다중 이미지, 캐러셀) — 별도 스펙·계획
- ralli 랜딩 페이지의 자체 폭 스케일
- 1500px 폭에서 TOC 우측이 8px 넘치는 기존 이슈
- 관리자 사이드바를 고려한 `full` 이미지 폭 계산
