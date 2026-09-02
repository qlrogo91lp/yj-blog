# 에디터 마크다운 모드 제거 구현 계획 (글쓰기 개선 PR 2/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글쓰기 에디터에서 마크다운 모드(기본모드 ↔ 마크다운 전환, 마크다운 textarea)를 제거해 편집기를 WYSIWYG 단일 모드로 단순화한다. 이미 저장된 마크다운 포맷 글은 편집기로 열 때 서버에서 HTML로 1회 변환한다.

**Architecture:** 스토어에서 `mode`·`contentFormat`을 제거하고 저장은 항상 `contentFormat: 'html'`로 고정한다. `EditorViewHandler`(모드 분기)와 `MarkdownEditorAction`은 삭제하고 `page.tsx`가 `WysiwygEditorAction`을 직접 배치한다. 공개 페이지의 마크다운 렌더 경로(`markdownToHtmlWithToc`)와 DB `content_format` 컬럼은 기존 마크다운 글을 위해 남긴다. 수정 페이지(`[id]/edit/page.tsx`, RSC)는 `contentFormat === 'markdown'`이면 `markdownToHtml`로 변환한 HTML을 스토어에 주입한다 — 사용자가 편집·저장하는 순간부터 그 글은 HTML 포맷으로 영구 전환된다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, zustand, TipTap 3, unified/remark(`src/lib/markdown.ts`), Vitest

**Spec:** 별도 스펙 없음. 2026-08-19 리뷰에서 사용자 결정 — "당분간 마크다운 모드는 쓰지 않는다. 관련 파일을 모두 제거하고 필요해지면 다시 논의한다."

**선행:** PR 1(`2026-08-19-editor-save-lifecycle.md`) 머지 후 진행. PR 1의 `_store.test.ts`가 `setMode`·`setContentFormat`을 참조하므로 이 PR에서 함께 정리한다.

## 완료 (2026-08-20)

Task 0~5 전체 완료, subagent-driven-development로 태스크별 fresh 서브에이전트 구현 + 리뷰(+ 필요 시 fix round) 방식으로 진행. 워크트리 `.worktrees/refactor-editor-remove-markdown-mode`, 브랜치 `refactor/editor-remove-markdown-mode`(base `develop` @ 5537489), 최종 커밋 범위 `5537489..9e29b6d`.

- Task 0: 브랜치 생성은 워크트리 생성으로 대체(동일 효과). Baseline 테스트 354/354 통과 확인.
- Task 1: 스토어에서 `mode`·`contentFormat`·`setMode`·`setContentFormat`·`EditorMode` 제거. 리뷰 clean.
- Task 2: `markdown-editor.action.tsx`·`editor-view.handler.tsx` 삭제, 툴바·WYSIWYG 에디터·미리보기 다이얼로그에서 모드 관련 코드 제거(`min-w-4xl`도 함께 제거), `page.tsx`가 `WysiwygEditorAction` 직접 배치. 리뷰 clean.
- Task 3: `savePost`가 항상 `contentFormat: 'html'`을 저장하도록 변경, 수정 페이지가 마크다운 글을 편집 진입 시 `markdownToHtml`로 변환해 스토어에 주입. 리뷰에서 Important 1건(변환 분기 테스트 부재) 발견 → fix round 1회로 `[id]/edit/page.test.tsx` 추가해 해결.
- Task 4: `turndown`·`@types/turndown` 의존성 제거(전이 의존 `@mixmark-io/domino` 포함). 리뷰 clean.
- Task 5: 전체 테스트 355/355, 린트(사전 존재 에러 2건 `docs/design/ralli/support.js` 레거시 파일, 이 브랜치와 무관), `tsc --noEmit`(사전 존재 에러 1건 `e2e/ralli.spec.ts`, 무관), `npm run build` 성공.

### 최종 전체 브랜치 리뷰(opus) 및 조치

공개 페이지 렌더링 경로(`markdownToHtml`·`markdownToHtmlWithToc`·`contentFormat` 분기·DB 컬럼)가 실측으로 무손상임을 확인했고, 일방향 변환 설계(raw 마크다운이 `contentFormat: 'html'` 행에 저장될 경로 없음)도 안전함을 확인했다. Important 3건 중:

- `savePost`가 호출자 입력과 무관하게 항상 `'html'`을 저장한다는 핵심 보장에 대한 테스트 부재 → **fix wave 1회로 해결** (`save-post.test.ts`에 UPDATE/INSERT/호출자-입력-무시 검증 3건 추가, 스테일 fixture 필드 정리). Re-review 결과 all addressed, 새 breakage 없음.
- plan 문서 완료 기록 미반영 → 이 섹션으로 해결.
- 코드블록 하이라이팅 소실(변환된 마크다운 글의 코드블록을 재저장하면 TipTap이 hljs 마크업을 평문화하고, `htmlToHtmlWithToc`에 `rehypeHighlight`가 없어 공개 페이지에서 하이라이팅 없이 렌더) → **Ruling:** PR2의 회귀가 아니라 PR4(`2026-08-19-editor-polish.md`) 계획이 이미 알고 있는 기존 gap("코드블록... 공개 페이지에서 하이라이트가 안 된다 — `htmlToHtmlWithToc`에 `rehypeHighlight`가 없다")이 마크다운 글에도 적용되는 것뿐이다. PR2 범위에서 고치지 않고 PR4로 넘긴다. 잘못된 판단이었을 경우의 비용: 코드블록이 있는 옛 마크다운 글을 편집·저장하면 PR4가 머지되기 전까지 공개 페이지에서 하이라이팅 없이 보인다(텍스트 유실 아님, 되돌릴 수 없는 서식 변경).

### 알려진 제약: Step 2 수동 브라우저 시나리오는 사용자 확인 필요

`/admin/*`이 Clerk 인증을 요구해 로그인 세션 없이는 서브에이전트가 확인할 수 없다(PR1과 동일한 제약). 실제 마크다운 포맷 글(가능하면 코드블록·표·이미지 포함)을 열어 서식이 WYSIWYG로 보이는지, 저장 전 자동 저장 문구가 뜨지 않는지(dirty 아님), 한 글자 수정 후 저장·공개 페이지 렌더가 정상인지(코드블록 하이라이팅은 위 ruling대로 소실될 수 있음을 감안)는 병합 전후로 사용자가 직접 확인해야 한다.

### 참고 (out of scope, 별도 처리 권장)

- `.claude/rules/page-folder.md`가 삭제된 `EditorViewHandler`를 예시로 참조한다(27·150·169번 줄). 규칙 문서 수정은 사용자 승인이 필요해 이 PR 범위 밖으로 남겨둔다.

### 병합 방법에 대한 결정 필요

공유 브랜치에 영향을 주는 작업이라 사용자 확인 없이 진행하지 않는다.

## 배경 — 리뷰에서 확인된 문제

- 마크다운 → 기본모드 전환 시 변환 로직이 없어(주석만 있음) 마크다운 원문이 일반 텍스트로 들어가고, 한 글자라도 치면 `contentFormat`이 `'html'`로 바뀌어 서식이 유실된다.
- 기본모드 → 마크다운은 turndown 변환이라 표·정렬·색·갤러리·이미지 크기 속성이 비가역적으로 사라지는데 경고가 없다.
- 마크다운 모드에서는 툴바 전체가 숨겨져 이미지 업로드도 불가, 미리보기는 렌더링이 아닌 `<pre>` 원문.
- 결론: 반쪽 기능이므로 유지 비용 대비 가치가 없다 → 제거.

## Global Constraints

- 브랜치: `develop`에서 `refactor/editor-remove-markdown-mode` 생성. squash 금지, gitmoji 커밋.
- **공개 페이지 렌더링은 건드리지 않는다** — `src/lib/markdown.ts`의 `markdownToHtml`·`markdownToHtmlWithToc`, `src/app/(main)/posts/[slug]/page.tsx`의 `contentFormat` 분기, DB `posts.content_format` 컬럼은 유지. 기존 마크다운 글이 그대로 보여야 한다.
- 스키마 변경 없음(`drizzle-kit push` 불필요).
- Server Action은 테스트에서 `vi.mock`으로 교체한다.
- 삭제 대상 파일은 `git rm`으로 제거하고, 참조가 남지 않는지 `tsc --noEmit`으로 확인한다.

---

## 파일 구조

| 파일                                                             | 변경                                                                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/app/admin/posts/new/_actions/markdown-editor.action.tsx`    | **삭제**                                                                                                                  |
| `src/app/admin/posts/new/_handlers/editor-view.handler.tsx`      | **삭제** (모드 분기 불필요)                                                                                               |
| `src/app/admin/posts/new/_store.ts`                              | `mode`·`setMode`·`EditorMode`·`contentFormat`·`setContentFormat` 제거, `initializePost` 시그니처에서 `contentFormat` 제거 |
| `src/app/admin/posts/new/_store.test.ts`                         | `setMode`·`setContentFormat` 케이스 제거, `initializePost` 호출부에서 `contentFormat` 제거                                |
| `src/app/admin/posts/new/_providers/auto-save.provider.test.tsx` | `initializePost` 호출부에서 `contentFormat` 제거                                                                          |
| `src/app/admin/posts/new/_actions/editor-toolbar.action.tsx`     | 모드 `Select`·`handleModeChange`·`TurndownService`·`mode==='markdown'` 분기 제거                                          |
| `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`     | `setContentFormat` 호출 제거                                                                                              |
| `src/app/admin/posts/new/_actions/_preview/preview.action.tsx`   | `contentFormat` 분기·`escapeHtml` 제거, 항상 HTML 렌더                                                                    |
| `src/app/admin/posts/new/_services/save-post.ts`                 | `SavePostInput.contentFormat` 제거, DB에는 `'html'` 고정 저장                                                             |
| `src/app/admin/posts/new/page.tsx`                               | `EditorViewHandler` → `WysiwygEditorAction` 직접 배치                                                                     |
| `src/app/admin/posts/[id]/edit/page.tsx`                         | 마크다운 글이면 `markdownToHtml`로 변환한 `content`를 `PostInitHandler`에 전달                                            |
| `src/app/admin/posts/[id]/edit/_handlers/post-init.handler.tsx`  | props에 `content: string` 추가(변환된 HTML), `contentFormat` 전달 제거                                                    |
| `package.json`                                                   | `turndown`·`@types/turndown` 제거                                                                                         |

---

### Task 0: 브랜치 생성

- [x] **Step 1: develop 최신화 후 브랜치 생성**

```bash
git checkout develop
git pull origin develop
git checkout -b refactor/editor-remove-markdown-mode
```

- [x] **Step 2: 기존 테스트 통과 확인**

Run: `npx vitest run --dir src src/app/admin/posts`
Expected: 전부 PASS

---

### Task 1: 스토어에서 `mode`·`contentFormat` 제거

**Files:**

- Modify: `src/app/admin/posts/new/_store.ts`
- Modify: `src/app/admin/posts/new/_store.test.ts`
- Modify: `src/app/admin/posts/new/_providers/auto-save.provider.test.tsx`

**Interfaces:**

- Produces:
  - `State`에서 `mode`, `contentFormat` 삭제. `Action`에서 `setMode`, `setContentFormat` 삭제. `EditorMode` 타입 삭제.
  - `initializePost(data)`의 `data`에서 `contentFormat` 삭제.
  - `submitPost`는 `savePost`에 `contentFormat`을 넘기지 않는다(Task 3에서 서버가 `'html'` 고정).

- [x] **Step 1: 테스트 먼저 수정 (실패 상태로 만들기)**

`src/app/admin/posts/new/_store.test.ts`:

- "changeCount를 1 올린다" `it.each` 목록에서 `setContentFormat` 행 삭제(있다면).
- "changeCount를 올리지 않는다" `it.each` 목록에서 `['setMode', ...]` 행 삭제.
- 모든 `initializePost({...})` 호출에서 `contentFormat: 'html',` 줄 삭제.
- 아래 테스트 추가:

```ts
it('스토어에 mode·contentFormat 필드가 없다', () => {
  const state = useNewPostStore.getState() as Record<string, unknown>;
  expect('mode' in state).toBe(false);
  expect('contentFormat' in state).toBe(false);
  expect('setMode' in state).toBe(false);
  expect('setContentFormat' in state).toBe(false);
});
```

`src/app/admin/posts/new/_providers/auto-save.provider.test.tsx`: 모든 `initializePost({...})` 호출에서 `contentFormat: 'html',` 줄 삭제.

- [x] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_store.test.ts`
Expected: FAIL — "mode·contentFormat 필드가 없다" 테스트 실패 (`'mode' in state`가 true)

- [x] **Step 3: 스토어 수정**

`src/app/admin/posts/new/_store.ts`에서:

- `type EditorMode = 'wysiwyg' | 'markdown';` 삭제
- `State`에서 `contentFormat: 'markdown' | 'html';`, `mode: EditorMode;` 삭제
- `Action`에서 `setContentFormat`, `setMode` 삭제; `initializePost`의 data 타입에서 `contentFormat: 'markdown' | 'html';` 삭제
- 초기값·`reset()`에서 `contentFormat: 'html',`, `mode: 'wysiwyg',` 삭제
- `setContentFormat: ...`, `setMode: ...` 구현 삭제
- `initializePost`의 set에서 `mode: data.contentFormat === 'markdown' ? 'markdown' : 'wysiwyg',` 삭제
- `submitPost`의 `savePost({...})` 인자에서 `contentFormat: state.contentFormat,` 삭제

- [x] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_store.test.ts src/app/admin/posts/new/_providers/auto-save.provider.test.tsx`
Expected: PASS. (`tsc`는 아직 다른 파일에서 실패해도 됨 — Task 2~4에서 정리)

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_store.ts src/app/admin/posts/new/_store.test.ts src/app/admin/posts/new/_providers/auto-save.provider.test.tsx
git commit -m "♻️ refactor: 에디터 스토어에서 mode·contentFormat 제거"
```

---

### Task 2: 마크다운 에디터·모드 분기 컴포넌트 삭제, 툴바 정리

**Files:**

- Delete: `src/app/admin/posts/new/_actions/markdown-editor.action.tsx`
- Delete: `src/app/admin/posts/new/_handlers/editor-view.handler.tsx`
- Modify: `src/app/admin/posts/new/_actions/editor-toolbar.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/_preview/preview.action.tsx`
- Modify: `src/app/admin/posts/new/page.tsx`

- [x] **Step 1: 파일 삭제**

```bash
git rm src/app/admin/posts/new/_actions/markdown-editor.action.tsx src/app/admin/posts/new/_handlers/editor-view.handler.tsx
```

- [x] **Step 2: `editor-toolbar.action.tsx` 정리**

다음을 제거한다:

- `import TurndownService from 'turndown';`
- `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';` — **주의**: 제목 스타일(본문/제목1~3) Select는 남으므로 이 import는 유지한다. 모드 Select만 제거.
- `const mode = useNewPostStore((s) => s.mode);`
- `const setMode = ...`, `const content = ...`, `const setContent = ...`, `const setContentFormat = ...` (툴바에서 스토어 content를 읽는 이유가 모드 전환뿐이었음)
- `handleModeChange` `useCallback` 전체
- `if (mode === 'markdown') { return (...); }` 블록 전체
- 메인 return 최상단의 모드 `Select` 블록(`{/* 모드 선택 */}` 주석부터 첫 `<Separator ... />`까지)

결과적으로 툴바는 제목 스타일 Select로 시작한다. `useNewPostStore` import는 더 이상 쓰이지 않으면 제거한다.

- [x] **Step 3: `wysiwyg-editor.action.tsx` 정리**

- `const setContentFormat = useNewPostStore((s) => s.setContentFormat);` 삭제
- `onUpdate` 안의 `setContentFormat('html');` 삭제

- [x] **Step 4: `preview.action.tsx` 정리**

```tsx
'use client';

import { ArticleContainer } from '@/components/layout/article-container';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNewPostStore } from '../../_store';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PreviewDialogAction({ open, onOpenChange }: Props) {
  const title = useNewPostStore((s) => s.title);
  const content = useNewPostStore((s) => s.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>미리보기</DialogTitle>
          <DialogDescription className="sr-only">
            작성 중인 글의 미리보기입니다
          </DialogDescription>
        </DialogHeader>
        <ArticleContainer className="mt-4">
          <article>
            <h1 className="text-3xl font-bold mb-6">{title || '제목 없음'}</h1>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </article>
        </ArticleContainer>
      </DialogContent>
    </Dialog>
  );
}
```

(`min-w-4xl`도 함께 제거 — 뷰포트 < 1120px에서 `min-w`가 `max-w`를 이겨 다이얼로그가 화면 밖으로 넘치던 문제. PR 3에서 하려던 항목이지만 이 파일을 손대는 김에 여기서 처리한다.)

- [x] **Step 5: `new/page.tsx` 수정**

- `import { EditorViewHandler } from './_handlers/editor-view.handler';` → `import { WysiwygEditorAction } from './_actions/wysiwyg-editor.action';`
- JSX의 `<EditorViewHandler />` → `<WysiwygEditorAction />`

- [x] **Step 6: 타입 확인 (수정 페이지는 Task 3에서 고치므로 그 파일 오류만 남아야 함)**

Run: `npx tsc --noEmit`
Expected: `src/app/admin/posts/[id]/edit/**`와 `save-post.ts` 관련 오류만 남음 (`contentFormat`)

- [x] **Step 7: 커밋**

```bash
git add -A src/app/admin/posts/new
git commit -m "🔥 remove: 마크다운 에디터·모드 전환 UI 제거, 미리보기 min-w 제거"
```

---

### Task 3: 저장은 HTML 고정, 수정 페이지는 마크다운 글을 HTML로 변환해 주입

**Files:**

- Modify: `src/app/admin/posts/new/_services/save-post.ts`
- Modify: `src/app/admin/posts/[id]/edit/page.tsx`
- Modify: `src/app/admin/posts/[id]/edit/_handlers/post-init.handler.tsx`

**Interfaces:**

- Consumes: `markdownToHtml(markdown: string): Promise<string>` (`src/lib/markdown.ts`, 기존)
- Produces:
  - `SavePostInput`에서 `contentFormat` 제거. DB `contentFormat`은 항상 `'html'`.
  - `PostInitHandler` props: `{ post: Post; content: string; initialTagIds: number[] }` — `content`는 편집기에 넣을 HTML(마크다운 글이면 변환된 값)

- [x] **Step 1: `save-post.ts` 수정**

- `SavePostInput`에서 `contentFormat: 'markdown' | 'html';` 삭제
- `postFormSchema.safeParse(input)` 호출 전에 입력을 보강한다(스키마의 `contentFormat`은 필수 enum이므로):

```ts
const parsed = postFormSchema.safeParse({ ...input, contentFormat: 'html' });
```

- destructuring의 `contentFormat`은 그대로 두고 UPDATE/INSERT 양쪽에서 `contentFormat`(항상 `'html'`)을 계속 사용한다. → 마크다운 글도 한 번 저장하면 `'html'`로 전환된다.

- [x] **Step 2: `post-init.handler.tsx` 수정**

```tsx
'use client';

import { useEffect } from 'react';
import type { Post } from '@/types';
import { useNewPostStore } from '../../../new/_store';

type Props = {
  post: Post;
  /** 편집기에 넣을 HTML. 마크다운 글이면 서버에서 변환된 값이 들어온다. */
  content: string;
  initialTagIds: number[];
};

export function PostInitHandler({ post, content, initialTagIds }: Props) {
  useEffect(() => {
    useNewPostStore.getState().initializePost({
      postId: post.id,
      title: post.title,
      content,
      categoryId: post.categoryId,
      seriesId: post.seriesId,
      tagIds: initialTagIds,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      metaTitle: post.metaTitle ?? '',
      thumbnailUrl: post.thumbnailUrl ?? null,
      status: post.status,
      publishedAt: post.publishedAt,
    });

    return () => {
      useNewPostStore.getState().reset();
    };
  }, [post, content, initialTagIds]);

  return null;
}
```

- [x] **Step 3: `[id]/edit/page.tsx` 수정**

- import 추가: `import { markdownToHtml } from '@/lib/markdown';` / `import { WysiwygEditorAction } from '../../new/_actions/wysiwyg-editor.action';`
- `import { EditorViewHandler } ...` 삭제
- `if (!post) notFound();` 다음에 추가:

```tsx
// 마크다운 포맷 글은 편집기(WYSIWYG 전용)에 넣기 위해 HTML로 변환한다.
// 사용자가 편집·저장하면 그 시점부터 contentFormat이 'html'로 전환된다.
const editorContent =
  post.contentFormat === 'markdown'
    ? await markdownToHtml(post.content)
    : post.content;
```

- `<PostInitHandler post={post} initialTagIds={...} />` → `<PostInitHandler post={post} content={editorContent} initialTagIds={postTagList.map((t) => t.id)} />`
- `<EditorViewHandler />` → `<WysiwygEditorAction />`

- [x] **Step 4: 타입·린트·테스트**

Run: `npx tsc --noEmit && npx eslint src/app/admin && npx vitest run --dir src src/app/admin/posts`
Expected: 오류 없음, 테스트 전부 PASS

- [x] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_services/save-post.ts src/app/admin/posts/[id]/edit
git commit -m "♻️ refactor: 저장 포맷을 html로 고정하고 마크다운 글은 편집 진입 시 HTML로 변환"
```

---

### Task 4: `turndown` 의존성 제거

**Files:**

- Modify: `package.json`, `package-lock.json`

- [x] **Step 1: 참조가 남아 있지 않은지 확인**

Run: `grep -rn "turndown" src`
Expected: 출력 없음

- [x] **Step 2: 제거**

```bash
npm uninstall turndown @types/turndown
```

- [x] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공

- [x] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "➖ chore: turndown 의존성 제거"
```

---

### Task 5: 최종 검증 및 문서 갱신

- [x] **Step 1: 전체 테스트·린트**

Run: `npm run test:run && npm run lint`
Expected: 전부 PASS

- [x] **Step 2: 수동 시나리오 (로그인 가능한 브라우저)**

1. 새 글 페이지 툴바에 "기본모드/마크다운" Select가 없고, 제목 스타일 Select부터 시작한다.
2. 관리 목록에서 `contentFormat === 'markdown'`인 글(있다면)을 열면 서식(제목·목록·코드블록·링크)이 WYSIWYG로 보이고, 저장 상태 문구가 자동으로 뜨지 않는다(dirty 아님).
3. 그 글을 한 글자 수정 → 저장 → 공개 페이지에서 정상 렌더(이제 html 포맷).
4. 미리보기 다이얼로그가 좁은 창(≈1000px)에서 화면 밖으로 넘치지 않는다.

- [x] **Step 3: plan 문서 상단에 완료 기록 후 커밋, `develop`으로 PR (`--no-ff`)**

```bash
git add docs/superpowers/plans/2026-08-19-editor-remove-markdown-mode.md
git commit -m "📝 docs: 마크다운 모드 제거 plan 완료 기록"
```
