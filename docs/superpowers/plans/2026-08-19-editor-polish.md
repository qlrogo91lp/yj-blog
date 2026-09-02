# 에디터 기능 보강·잔손질 구현 계획 (글쓰기 개선 PR 4/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글쓰기 에디터에 slug 편집과 코드블록 하이라이트를 추가하고, 카테고리 해제·태그 입력 폭·저장 오류 안내·아이콘 규칙 등 UX 잔손질과 미사용 `metaDescription` 제거, 레이아웃 중복 정리를 한 번에 마무리한다.

**Architecture:** 각 항목이 독립적이라 Task 단위로 분리해 하나씩 머지 가능한 상태를 유지한다. slug는 스토어의 기존 `slug` 필드에 SEO 섹션 입력을 연결하고 서버의 unique 검사 결과를 toast로 노출한다. 코드블록은 `@tiptap/extension-code-block-lowlight`로 편집기 안에서 하이라이트하고, 공개 페이지는 `htmlToHtmlWithToc`에 `rehypeHighlight`를 추가해 같은 `.hljs-*` 클래스(`src/styles/highlight.css`)로 렌더한다. `metaDescription`은 excerpt가 이미 같은 역할을 하므로 스키마·타입·UI에서 제거한다.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, TipTap 3.20 + lowlight, unified/rehype, Drizzle(`drizzle-kit push`), Vitest + Testing Library

**Spec:** 별도 스펙 없음. 2026-08-19 리뷰 결과 및 사용자 결정(`publishedAt` 수동 지정 제외, `metaDescription` 제거, 나머지 진행).

**선행:** PR 1~3 머지 후 진행. (PR 2에서 `mode`가 사라진 툴바, PR 3에서 BubbleMenu로 옮겨진 이미지 툴바를 전제로 한다.)

## 완료 (2026-08-20)

Task 0~6 전체 완료, subagent-driven-development로 태스크별 fresh 서브에이전트 구현 + 리뷰 방식으로 진행(fix round 없이 전 태스크 리뷰 clean). 워크트리 `.worktrees/feature-editor-polish`, 브랜치 `feature/editor-polish`(base `develop` @ 61e4a9b, PR1~3 머지 이후), 최종 커밋 범위 `61e4a9b..d374c85`.

- Task 0: 브랜치 생성은 워크트리 생성으로 대체. Baseline 테스트 384/384 통과 확인. 스토어의 `slug`/`setSlug`/`submitPost` 반환값은 이미 구현돼 있어(선행 PR에서 이미 존재) 이번 태스크는 UI 배선만 담당.
- Task 1: SEO 섹션에 slug 입력 필드 추가, 저장 실패 시 `draft.action.tsx`·`publish.action.tsx`에 `toast.error` 추가. 리뷰 clean.
- Task 2: TipTap `CodeBlockLowlight`(lowlight `common` 37개 언어)로 편집기 내 코드블록 하이라이트, 툴바 코드/코드블록 버튼 추가. `htmlToHtmlWithToc`에 `rehypeHighlight` 추가 — HTML 포맷 글도 공개 페이지에서 하이라이트되도록 기존 gap 해소. 리뷰 clean.
- Task 3: 카테고리 "카테고리 없음" 해제 옵션(series-selector와 동일한 'none' 센티널 패턴), 태그 입력 폭 `w-full max-w-md`로 확장, 아이콘 8곳 `size={16}` 규칙 정리(`toolbar-button.tsx`의 `icon` prop 타입을 `LucideIcon`으로 확장해 Task 2가 추가한 코드 버튼도 자동으로 규칙을 따르게 됨 — 최종 리뷰에서 diff 0줄로 재확인). 리뷰 clean.
- Task 4: 미사용 `metaDescription` 컬럼·스키마·참조 제거(코드 16개 파일, plan의 "8개" 추정은 stale — 실제 grep 기준). **사용자 확인 후 `drizzle-kit push --force` 실행**(사전에 실제 DB 조회로 값이 있는 행 0개 확인, push 시 뜨는 "2 items" 경고는 컬럼 값이 아니라 테이블 전체 행 수를 가리키는 일반 경고임을 재확인 후 진행). `information_schema` 조회로 컬럼 삭제 확정. 리뷰 clean.
- Task 5: `[id]/edit/layout.tsx`를 `new/layout.tsx`와 동일한 `SidebarCollapseHandler` 패턴으로 통일. 리뷰 clean.
- Task 6: 전체 테스트 394/394, 린트(사전 존재 에러 2건, 무관), `tsc --noEmit`(사전 존재 에러 1건, 무관), `npm run build` 성공.

### 최종 전체 브랜치 리뷰(opus) — Important 1건 (코드 결함 아님, 위험 인지 항목)

Task 2에서 `npm install @tiptap/extension-code-block-lowlight@^3.20 lowlight`(brief 지시 그대로)를 실행한 결과 `@tiptap/extension-code-block-lowlight@3.30.2`로 해석돼, `@tiptap/pm`이 3.20.4→3.30.x로 함께 올라가고 12개 이상의 전이 의존성이 `package-lock.json`에서 교체됐다. 각 태스크의 좁은 diff에서는 lock 파일 churn으로만 보였으나, 최종 리뷰에서 "에디터 코어 마이너 업그레이드"임이 드러났다. `src`에 `@tiptap/pm` 직접 import는 없고 빌드·테스트는 통과하지만, **TipTap 편집 표면 전반(BubbleMenu·표 삽입·색상 피커·붙여넣기 등)이 이 프로젝트의 jsdom 테스트로 커버되지 않는다.** Ruling: plan이 명시한 `^3.20` 설치 지시를 그대로 따른 결과라 "되돌리는" 것은 브리프 위반이 되므로 코드 수정 대상이 아니다 — 대신 **아래 수동 시나리오 범위를 코드블록뿐 아니라 편집기 전반으로 넓혀야 한다.**

`metaDescription` 완전 제거(재확인 grep 결과 무관한 `defaultMetaDescription`만 잔존), Task2↔Task3 합성 무결성(Task 2가 추가한 코드 버튼 2곳이 Task 3 커밋에서 diff 0줄), Task 5의 `SidebarCollapseHandler`가 코드베이스 전체에서 유일한 `useSidebar()` 소비자임(세 번째 재구현 없음), `rehypeHighlight` 추가가 실제 파이프라인에서 `pre>code`에 hljs 클래스·토큰 span만 추가하고 다른 HTML 구조(heading id·TOC·이미지 캡션·인용/목록/표)는 무변경임을 실측으로 각각 재확인했다. 라이브 DB 컬럼에 의존하는 테스트도 없음을 확인(`save-post.test.ts`가 `@/db`를 완전히 mock).

Minor 8건은 보류(코드 결함 아니거나 낮은 영향, 상세는 SDD ledger 참고): `detect: true`가 비코드 `<pre>`에 `hljs` 클래스만 붙일 수 있음(토큰 없음, `nohighlight`로 개별 제외 가능), 자동감지 테스트가 `hljs-` 토큰이 아닌 `hljs` 문자열만 단언해 실질 검증력이 약함(brief 샘플 그대로), `generateSlug()` 중복 호출·폴백 문구 불일치(Task 1에서 이미 보류), `category-selector`의 도달 불가 placeholder, `package.json` 버전 범위 표기 불일치, 카테고리/태그 셀렉터 폭 시각적 불일치(plan대로), **발행 글에서 slug를 비우면 URL이 조용히 재생성됨**(선행 PR의 스토어 동작을 이번에 처음 UI로 노출 — 발행 글 slug 불변성은 별도 논의 필요, 향후 PR 후보), plan 문서 체크박스(이 섹션으로 해결).

### 알려진 제약: Step 2 수동 브라우저 시나리오는 사용자 확인 필요 — 특히 이번 PR은 편집기 전반 확인 권장

`/admin/*`이 Clerk 인증을 요구해 로그인 세션 없이는 서브에이전트가 확인할 수 없다(PR1~3과 동일한 제약). **TipTap 코어 마이너 업그레이드(3.20→3.30) 때문에, plan에 명시된 5개 항목 외에 이미지 BubbleMenu·표 삽입·색상 피커·붙여넣기 등 편집기 전반을 함께 훑는 것을 권장한다:**

1. SEO 섹션에서 slug를 `hello-world`로 입력 → 발행 → `/posts/hello-world`로 이동. 같은 slug로 다른 글 발행 → "이미 사용 중인 slug입니다" toast.
2. 툴바 "코드 블록" → 코드 입력 → 편집기 안에서 색이 입혀진다. 발행 후 공개 페이지에서도 하이라이트.
3. 카테고리를 골랐다가 "카테고리 없음"으로 되돌릴 수 있다.
4. 긴 태그명(20자 이상)이 잘리지 않는다.
5. 편집 페이지 진입 시 사이드바가 접히고, 나가면 다시 펼쳐진다.
6. (추가 권장) 이미지 선택 시 BubbleMenu 툴바, 표 삽입, 색상 피커, 붙여넣기 등 PR3 이전 기능들이 여전히 정상 동작하는지 스모크 테스트.

### 병합 방법에 대한 결정 필요

공유 브랜치에 영향을 주는 작업이라 사용자 확인 없이 진행하지 않는다.

## 배경 — 리뷰에서 확인된 문제

| #   | 문제                                                                                                                                                         | 위치                                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | slug를 편집할 UI가 없다. 한글 제목은 `generateSlug`가 한글을 제거해 `post-<timestamp>`가 된다                                                                | `_store.ts submitPost`, `src/lib/slugify.ts`                                                                                       |
| 2   | 저장 실패(예: slug 중복) 시 `DraftAction`·`PublishAction`이 결과를 무시해 하단의 "저장 실패" 문구 외 안내가 없다                                             | `draft.action.tsx`, `publish.action.tsx`                                                                                           |
| 3   | 코드블록 버튼이 없고(단축키 ```만 가능), 기본모드(HTML) 글의 코드블록은 공개 페이지에서 하이라이트가 안 된다 —`htmlToHtmlWithToc`에 `rehypeHighlight`가 없다 | `editor-toolbar.action.tsx`, `src/lib/markdown.ts`                                                                                 |
| 4   | 카테고리는 한 번 고르면 해제할 수 없다(시리즈는 "시리즈 없음"이 있음)                                                                                        | `category-selector.action.tsx`                                                                                                     |
| 5   | 태그 입력·드롭다운 폭이 `w-48`(192px)로 고정돼 긴 태그명이 잘린다                                                                                            | `tag-selector.action.tsx`                                                                                                          |
| 6   | 아이콘 크기를 `className="h-4 w-4"`로 지정한 곳이 남아 있다(프로젝트 규칙: `size={16}`)                                                                      | `editor-toolbar.action.tsx`(4곳), `preview-button.action.tsx`, `table-insert.action.tsx`, `color-picker.tsx`, `toolbar-button.tsx` |
| 7   | `metaDescription`은 스키마·DB 컬럼·Zod에는 있으나 UI·스토어에 없어 사실상 미사용                                                                             | `schema.ts`, `types/post.ts`, `posts/[slug]/page.tsx`, `build-article-json-ld.ts`                                                  |
| 8   | `[id]/edit/layout.tsx`는 `'use client'` 레이아웃으로 사이드바를 접고, `new/layout.tsx`는 `SidebarCollapseHandler`를 쓴다 — 같은 일을 두 방식으로             | 두 layout 파일                                                                                                                     |

## Global Constraints

- 브랜치: `develop`에서 `feature/editor-polish` 생성. squash 금지, gitmoji 커밋.
- slug 허용 문자는 기존 Zod 규칙 그대로: `/^[a-z0-9가-힣-]+$/` (영소문자·숫자·한글·하이픈). `generateSlug`의 동작은 바꾸지 않는다.
- 코드 하이라이트 언어 세트는 lowlight `common`(약 37개). 테마는 기존 `src/styles/highlight.css`(github-dark) 재사용, 새 CSS 테마 추가 금지.
- **`drizzle-kit push`는 컬럼 삭제(데이터 손실 가능)를 포함하므로 실행 전 사용자 확인을 받는다.** (CLAUDE.md 규칙)
- 아이콘은 `size={16}`.
- Server Action은 테스트에서 `vi.mock`.

---

## 파일 구조

| 파일                                                                                                                      | 역할                                                     | 변경 |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---- |
| `src/app/admin/posts/new/_actions/seo-section.action.tsx`                                                                 | slug 입력 필드 추가                                      | 수정 |
| `src/app/admin/posts/new/_actions/seo-section.action.test.tsx`                                                            | slug 입력 테스트                                         | 수정 |
| `src/app/admin/posts/new/_actions/draft.action.tsx`, `publish.action.tsx`                                                 | 실패 시 `toast.error(result.error)`                      | 수정 |
| `src/app/admin/posts/new/_actions/draft.action.test.tsx`                                                                  | 실패 toast 테스트                                        | 수정 |
| `src/app/admin/posts/new/_actions/publish.action.test.tsx`                                                                | 실패 toast·성공 이동 테스트                              | 신규 |
| `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`                                                              | `CodeBlockLowlight` 확장                                 | 수정 |
| `src/app/admin/posts/new/_actions/editor-toolbar.action.tsx`                                                              | 코드·코드블록 버튼, 아이콘 규칙                          | 수정 |
| `src/lib/markdown.ts`                                                                                                     | `htmlToHtmlWithToc`에 `rehypeHighlight`                  | 수정 |
| `src/lib/markdown.test.ts`                                                                                                | 하이라이트 테스트                                        | 수정 |
| `src/app/admin/posts/new/_actions/category-selector.action.tsx`                                                           | "카테고리 없음" 옵션                                     | 수정 |
| `src/app/admin/posts/new/_actions/tag-selector.action.tsx`                                                                | 폭 `w-full max-w-md`                                     | 수정 |
| `src/app/admin/posts/new/_components/toolbar-button.tsx`                                                                  | `icon` 타입 `LucideIcon`, `size={16}`                    | 수정 |
| `preview-button.action.tsx`, `table-insert.action.tsx`, `color-picker.tsx`                                                | `size={16}`                                              | 수정 |
| `src/db/schema.ts`                                                                                                        | `metaDescription` 컬럼 제거                              | 수정 |
| `src/types/post.ts` + `post.test.ts`                                                                                      | Zod `metaDescription` 제거                               | 수정 |
| `src/app/(main)/posts/[slug]/page.tsx`, `_utils/build-article-json-ld.ts` + `.test.ts`, `_components/article-json-ld.tsx` | `metaDescription` 참조 제거                              | 수정 |
| `Post` 타입 픽스처를 쓰는 테스트 8개(`grep -rl metaDescription src`)                                                      | 픽스처에서 `metaDescription: null` 줄 제거               | 수정 |
| `src/app/admin/posts/[id]/edit/layout.tsx`                                                                                | `SidebarCollapseHandler` 사용 서버 레이아웃으로 통일     | 수정 |
| `package.json`                                                                                                            | `@tiptap/extension-code-block-lowlight`, `lowlight` 추가 | 수정 |

---

### Task 0: 브랜치 생성

- [x] **Step 1**

```bash
git checkout develop && git pull origin develop && git checkout -b feature/editor-polish
```

- [x] **Step 2: 기존 테스트 통과 확인**

Run: `npx vitest run --dir src src/app/admin/posts src/lib`
Expected: 전부 PASS

---

### Task 1: slug 편집 UI + 저장 실패 toast

**Files:**

- Modify: `src/app/admin/posts/new/_actions/seo-section.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/seo-section.action.test.tsx`
- Modify: `src/app/admin/posts/new/_actions/draft.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/draft.action.test.tsx`
- Modify: `src/app/admin/posts/new/_actions/publish.action.tsx`
- Create: `src/app/admin/posts/new/_actions/publish.action.test.tsx`

**Interfaces:**

- Consumes: 스토어 `slug`, `setSlug`, `title`; `generateSlug(title)` (`@/lib/slugify`); `submitPost` 결과 `{ success: false; error: string }`
- Produces: SEO 섹션에 `<Input id="seo-slug">` (label "URL slug"). 비어 있으면 placeholder로 `generateSlug(title)` 미리보기. 허용 문자 외 입력 시 아래에 빨간 안내문 "영소문자, 숫자, 한글, 하이픈만 사용할 수 있습니다".

- [x] **Step 1: 실패하는 테스트 작성**

`seo-section.action.test.tsx`에 추가:

```tsx
it('slug 입력 필드가 있고 입력 시 store가 업데이트된다', () => {
  render(<SeoSectionAction />);
  fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
  const input = screen.getByLabelText('URL slug');
  fireEvent.change(input, { target: { value: 'my-post' } });
  expect(useNewPostStore.getState().slug).toBe('my-post');
});

it('slug가 비어 있으면 제목 기반 자동 slug를 placeholder로 보여준다', () => {
  useNewPostStore.getState().setTitle('Hello World');
  render(<SeoSectionAction />);
  fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
  expect(screen.getByLabelText('URL slug')).toHaveAttribute(
    'placeholder',
    'hello-world'
  );
});

it('허용되지 않는 문자가 있으면 안내문을 보여준다', () => {
  render(<SeoSectionAction />);
  fireEvent.click(screen.getByRole('button', { name: /SEO 설정/ }));
  fireEvent.change(screen.getByLabelText('URL slug'), {
    target: { value: 'Hello World!' },
  });
  expect(
    screen.getByText('영소문자, 숫자, 한글, 하이픈만 사용할 수 있습니다')
  ).toBeInTheDocument();
});
```

`draft.action.test.tsx`에 추가 (파일 상단에 `vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));` 와 `import { toast } from 'sonner';` 추가):

```tsx
it('저장 실패 시 toast.error로 사유를 보여준다', async () => {
  vi.mocked(savePost).mockResolvedValue({
    success: false,
    error: '이미 사용 중인 slug입니다',
  });
  render(<DraftAction />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });
  expect(toast.error).toHaveBeenCalledWith('이미 사용 중인 slug입니다');
});
```

`publish.action.test.tsx` 신규:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { savePost } from '../_services/save-post';
import { useNewPostStore } from '../_store';
import { PublishAction } from './publish.action';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../_services/save-post', () => ({ savePost: vi.fn() }));

describe('PublishAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
    useNewPostStore.getState().setTitle('제목');
    useNewPostStore.getState().setContent('<p>본문</p>');
    vi.mocked(savePost).mockReset();
    push.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('성공하면 상세 페이지로 이동한다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'published',
      publishedAt: new Date(),
    });
    useNewPostStore.getState().setSlug('my-post');
    render(<PublishAction />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '완료' }));
    });
    expect(push).toHaveBeenCalledWith('/posts/my-post');
  });

  it('실패하면 toast.error로 사유를 보여주고 이동하지 않는다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: false,
      error: '이미 사용 중인 slug입니다',
    });
    render(<PublishAction />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '완료' }));
    });
    expect(toast.error).toHaveBeenCalledWith('이미 사용 중인 slug입니다');
    expect(push).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/seo-section.action.test.tsx src/app/admin/posts/new/_actions/draft.action.test.tsx src/app/admin/posts/new/_actions/publish.action.test.tsx`
Expected: 새 테스트 FAIL

- [x] **Step 3: `seo-section.action.tsx` 수정**

import 추가:

```tsx
import { generateSlug } from '@/lib/slugify';
```

스토어 구독 추가:

```tsx
const title = useNewPostStore((s) => s.title);
const slug = useNewPostStore((s) => s.slug);
const setSlug = useNewPostStore((s) => s.setSlug);
const slugPattern = /^[a-z0-9가-힣-]*$/;
const isSlugValid = slugPattern.test(slug);
```

펼침 영역(`{open && (<div className="space-y-4 px-4 pb-4">`) 맨 앞에 블록 추가:

```tsx
<div>
  <Label htmlFor="seo-slug" className="mb-1 block">
    URL slug
  </Label>
  <Input
    id="seo-slug"
    value={slug}
    onChange={(e) => setSlug(e.target.value.trim())}
    placeholder={title ? generateSlug(title) : 'my-post'}
    aria-invalid={!isSlugValid}
  />
  <p className="mt-1 text-xs text-muted-foreground">
    /posts/{slug || (title ? generateSlug(title) : '…')} — 비우면 제목으로 자동
    생성됩니다.
  </p>
  {!isSlugValid && (
    <p className="mt-1 text-xs text-destructive">
      영소문자, 숫자, 한글, 하이픈만 사용할 수 있습니다
    </p>
  )}
</div>
```

- [x] **Step 4: `draft.action.tsx`·`publish.action.tsx`에 toast**

`draft.action.tsx`: `import { toast } from 'sonner';` 추가, `handleClick`:

```tsx
const handleClick = async () => {
  const result = await submitPost(status);
  if (!result.success) toast.error(result.error);
};
```

`publish.action.tsx`: `import { toast } from 'sonner';` 추가, `handleClick`:

```tsx
const handleClick = async () => {
  const result = await submitPost('published');
  if (result.success) {
    router.push(`/posts/${result.slug}`);
  } else {
    toast.error(result.error);
  }
};
```

- [x] **Step 5: 통과 확인**

Run: 위 Step 2 명령
Expected: PASS

- [x] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_actions
git commit -m "✨ feat: SEO 섹션에 slug 편집 필드 추가, 저장 실패 사유를 toast로 안내"
```

---

### Task 2: 코드블록 — 편집기 lowlight 하이라이트 + 툴바 버튼 + 공개 페이지 하이라이트

**Files:**

- Modify: `package.json`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/editor-toolbar.action.tsx`
- Modify: `src/lib/markdown.ts`
- Modify: `src/lib/markdown.test.ts`

**Interfaces:**

- Consumes: `ToolbarButton` (기존)
- Produces: 툴바에 "코드"(인라인, `toggleCode`)·"코드 블록"(`toggleCodeBlock`) 버튼. 공개 페이지 `htmlToHtmlWithToc` 출력의 `<pre><code class="language-xx">`가 `hljs` 클래스로 하이라이트됨

- [x] **Step 1: 의존성 설치**

```bash
npm install @tiptap/extension-code-block-lowlight@^3.20 lowlight
```

- [x] **Step 2: 실패하는 테스트 작성** — `src/lib/markdown.test.ts`에 추가

```ts
describe('htmlToHtmlWithToc — 코드 하이라이트', () => {
  it('language 클래스가 있는 code를 hljs 토큰으로 하이라이트한다', async () => {
    const html =
      '<pre><code class="language-javascript">const a = 1;</code></pre>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).toContain('hljs');
    expect(result).toContain('hljs-keyword');
  });

  it('language 클래스가 없는 code도 자동 감지로 하이라이트한다', async () => {
    const html = '<pre><code>function f() { return 1; }</code></pre>';
    const { html: result } = await htmlToHtmlWithToc(html);
    expect(result).toContain('hljs');
  });
});
```

- [x] **Step 3: 실패 확인**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: 새 테스트 FAIL (`hljs` 없음)

- [x] **Step 4: `src/lib/markdown.ts` 수정** — `htmlToHtmlWithToc`의 processor에서 `.use(rehypeSlug)` 다음에 `.use(rehypeHighlight)` 추가:

```ts
const processor = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeSlug)
  // detect: true — 편집기 코드블록은 언어를 안 고르면 class 없이 저장되므로 자동 감지가 필요하다
  .use(rehypeHighlight, { detect: true })
  .use(rehypeImageCaption);
// ...이하 동일
```

- [x] **Step 5: 통과 확인**

Run: `npx vitest run src/lib/markdown.test.ts`
Expected: PASS

- [x] **Step 6: 편집기에 `CodeBlockLowlight` 적용** — `wysiwyg-editor.action.tsx`

import 추가:

```tsx
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
```

컴포넌트 밖(모듈 스코프)에:

```tsx
const lowlight = createLowlight(common);
```

`StarterKit.configure({...})`에 `codeBlock: false,` 추가하고, extensions 배열의 `Underline,` 앞에:

```tsx
      CodeBlockLowlight.configure({ lowlight }),
```

- [x] **Step 7: 툴바 버튼 추가** — `editor-toolbar.action.tsx`

lucide import에 `Code, SquareCode` 추가. `{/* 블록 */}` 섹션의 순서 있는 목록 버튼 뒤에:

```tsx
      <ToolbarButton
        icon={Code}
        tooltip="코드"
        isActive={editor?.isActive('code')}
        onClick={() => editor?.chain().focus().toggleCode().run()}
      />
      <ToolbarButton
        icon={SquareCode}
        tooltip="코드 블록"
        isActive={editor?.isActive('codeBlock')}
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
      />
```

- [x] **Step 8: 타입·테스트·빌드**

Run: `npx tsc --noEmit && npx vitest run --dir src src/app/admin/posts src/lib && npm run build`
Expected: 오류 없음

- [x] **Step 9: 커밋**

```bash
git add package.json package-lock.json src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx src/app/admin/posts/new/_actions/editor-toolbar.action.tsx src/lib/markdown.ts src/lib/markdown.test.ts
git commit -m "✨ feat: 코드블록 툴바 버튼과 lowlight 하이라이트 추가, HTML 글도 공개 페이지에서 하이라이트"
```

---

### Task 3: 카테고리 해제·태그 폭·아이콘 규칙

**Files:**

- Modify: `src/app/admin/posts/new/_actions/category-selector.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/tag-selector.action.tsx`
- Modify: `src/app/admin/posts/new/_components/toolbar-button.tsx`
- Modify: `src/app/admin/posts/new/_actions/editor-toolbar.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/preview-button.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/table-insert.action.tsx`
- Modify: `src/app/admin/posts/new/_components/color-picker.tsx`
- Create: `src/app/admin/posts/new/_actions/category-selector.action.test.tsx`

- [x] **Step 1: 실패하는 테스트 작성** — `category-selector.action.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewPostStore } from '../_store';
import { CategorySelectorAction } from './category-selector.action';

vi.mock('../_services/save-post', () => ({ savePost: vi.fn() }));

const categories = [
  {
    id: 1,
    name: '개발',
    slug: 'dev',
    description: null,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: '일상',
    slug: 'life',
    description: null,
    createdAt: new Date(),
  },
];

describe('CategorySelectorAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('선택된 카테고리가 없으면 "카테고리 없음"을 표시한다', () => {
    render(<CategorySelectorAction categories={categories} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('카테고리 없음');
  });

  it('선택된 카테고리 이름을 표시한다', () => {
    useNewPostStore.getState().setCategoryId(2);
    render(<CategorySelectorAction categories={categories} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('일상');
  });
});
```

- [x] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/category-selector.action.test.tsx`
Expected: 첫 테스트 FAIL (placeholder "카테고리 선택")

- [x] **Step 3: `category-selector.action.tsx` 수정** — 시리즈 셀렉터와 같은 `'none'` 센티널 방식

```tsx
<Select
  value={categoryId?.toString() ?? 'none'}
  onValueChange={(value) =>
    setCategoryId(value === 'none' ? null : Number(value))
  }
>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="카테고리 선택" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">카테고리 없음</SelectItem>
    {categories.map((cat) => (
      <SelectItem key={cat.id} value={cat.id.toString()}>
        {cat.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

- [x] **Step 4: 태그 입력 폭** — `tag-selector.action.tsx`
  - 루트 `<div className="mb-4 w-48">` → `<div className="mb-4 w-full max-w-md">`
  - 드롭다운 `<div className="absolute left-0 top-full z-50 w-48 ...">` → `w-full`

- [x] **Step 5: 아이콘 규칙**
  - `toolbar-button.tsx`: `icon: React.ComponentType<{ className?: string }>` → `icon: LucideIcon` (`import type { LucideIcon } from 'lucide-react';`), `<Icon className="h-4 w-4" />` → `<Icon size={16} />`
  - `editor-toolbar.action.tsx`: 제목 스타일 Select 아이템의 `<Type className="h-4 w-4" />`·`<Heading1 className="h-4 w-4" />`·`<Heading2 ...>`·`<Heading3 ...>` → `size={16}`
  - `preview-button.action.tsx`: `<Eye className="h-4 w-4 mr-1" />` → `<Eye size={16} />`
  - `table-insert.action.tsx`: `<TableIcon className="h-4 w-4" />` → `<TableIcon size={16} />`
  - `color-picker.tsx`: `<Palette className="h-4 w-4" />` → `<Palette size={16} />`

- [x] **Step 6: 확인**

Run: `grep -rn 'className="h-4 w-4' src/app/admin/posts/new` → 출력 없음
Run: `npx tsc --noEmit && npx vitest run --dir src src/app/admin/posts`
Expected: PASS

- [x] **Step 7: 커밋**

```bash
git add src/app/admin/posts/new
git commit -m "💄 style: 카테고리 해제 옵션·태그 입력 폭 확장·아이콘 size 규칙 정리"
```

---

### Task 4: `metaDescription` 제거

**Files:**

- Modify: `src/db/schema.ts`
- Modify: `src/types/post.ts`, `src/types/post.test.ts`
- Modify: `src/app/(main)/posts/[slug]/page.tsx`
- Modify: `src/app/(main)/posts/[slug]/_utils/build-article-json-ld.ts`, `.test.ts`
- Modify: `src/app/(main)/posts/[slug]/_components/article-json-ld.tsx`
- Modify: `Post` 픽스처를 가진 테스트들 — `grep -rl "metaDescription" src` 결과 전체

- [x] **Step 1: 사용 데이터 확인 (사용자 확인 단계)**

`npx drizzle-kit studio`에서 `posts.meta_description`이 non-null인 행이 있는지 확인한다. 있으면 사용자에게 값을 보고하고 삭제 진행 여부를 확인받는다(필요하면 `excerpt`가 비어 있는 행에 한해 값을 옮긴 뒤 진행).

- [x] **Step 2: 코드에서 제거**

- `src/db/schema.ts`: `metaDescription: text('meta_description'),` 삭제
- `src/types/post.ts`: `postFormSchema`의 `metaDescription` 항목 삭제
- `src/types/post.test.ts:153`: `metaDescription: 'SEO 설명',` 삭제
- `src/app/(main)/posts/[slug]/page.tsx:38`: `const description = post.metaDescription ?? post.excerpt ?? undefined;` → `const description = post.excerpt ?? undefined;`
- `build-article-json-ld.ts`: `PostInput`에서 `metaDescription` 삭제, `const description = post.excerpt ?? '';`
- `build-article-json-ld.test.ts`: `basePost`의 `metaDescription: null` 삭제, 테스트 "metaTitle/metaDescription이 있으면 우선 사용한다"를 아래로 교체:

```ts
it('metaTitle이 있으면 headline로 우선 사용하고 description은 excerpt를 쓴다', () => {
  const json = buildArticleJsonLd({
    post: { ...basePost, metaTitle: 'SEO 제목', excerpt: '요약' },
    blogName: 'YJlogs',
    baseUrl: 'https://yjlogs.com',
  });
  expect(json.headline).toBe('SEO 제목');
  expect(json.description).toBe('요약');
});
```

- `article-json-ld.tsx`: props 타입에서 `metaDescription: string | null;` 삭제
- 나머지 픽스처 테스트 파일들: `metaDescription: null,` 줄 삭제

- [x] **Step 3: 확인**

Run: `grep -rn "metaDescription\|meta_description" src` → 출력 없음
Run: `npx tsc --noEmit && npm run test:run`
Expected: PASS

- [x] **Step 4: DB 반영 (사용자 확인 후)**

```bash
npx drizzle-kit push
```

컬럼 DROP 확인 프롬프트가 뜨면 Step 1의 확인 결과에 따라 진행한다.

- [x] **Step 5: 커밋**

```bash
git add src/db/schema.ts src/types src/app/\(main\)/posts src/components src/app/\(main\)/_handlers src/app/\(main\)/_components
git commit -m "🔥 remove: 미사용 metaDescription 컬럼·스키마·참조 제거 (excerpt가 대체)"
```

---

### Task 5: 편집 페이지 레이아웃을 `SidebarCollapseHandler`로 통일

**Files:**

- Modify: `src/app/admin/posts/[id]/edit/layout.tsx`

- [x] **Step 1: 교체**

```tsx
import { SidebarCollapseHandler } from '../../new/_handlers/sidebar-collapse.handler';

export default function EditPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SidebarCollapseHandler />
      {children}
    </div>
  );
}
```

- [x] **Step 2: 확인·커밋**

Run: `npx tsc --noEmit`

```bash
git add src/app/admin/posts/[id]/edit/layout.tsx
git commit -m "♻️ refactor: 편집 페이지 레이아웃을 SidebarCollapseHandler 방식으로 통일"
```

---

### Task 6: 최종 검증 및 문서 갱신

- [x] **Step 1: 전체 테스트·린트·빌드**

Run: `npm run test:run && npm run lint && npm run build`
Expected: 전부 PASS / 성공

- [x] **Step 2: 수동 시나리오 (로그인 가능한 브라우저)**

1. SEO 섹션에서 slug를 `hello-world`로 입력 → 발행 → `/posts/hello-world`로 이동. 같은 slug로 다른 글 발행 → "이미 사용 중인 slug입니다" toast.
2. 툴바 "코드 블록" → 코드 입력 → 편집기 안에서 색이 입혀진다. 발행 후 공개 페이지에서도 하이라이트.
3. 카테고리를 골랐다가 "카테고리 없음"으로 되돌릴 수 있다.
4. 긴 태그명(20자 이상)이 잘리지 않는다.
5. 편집 페이지 진입 시 사이드바가 접히고, 나가면 다시 펼쳐진다.

- [x] **Step 3: plan 문서 상단에 완료 기록 후 커밋, `develop`으로 PR (`--no-ff`)**

```bash
git add docs/superpowers/plans/2026-08-19-editor-polish.md
git commit -m "📝 docs: 에디터 잔손질 plan 완료 기록"
```
