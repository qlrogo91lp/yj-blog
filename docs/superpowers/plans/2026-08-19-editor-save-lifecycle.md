# 에디터 저장 수명주기 정리 구현 계획 (글쓰기 개선 PR 1/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글쓰기 에디터에서 발행 글이 의도치 않게 임시저장으로 되돌아가거나 덮어써지는 저장 수명주기 버그를 없애고, 사용자가 실제로 수정했을 때만 자동저장이 돌도록 한다.

**Architecture:** zustand 스토어(`new/_store.ts`)에 변경 카운터 기반 `isDirty` 개념을 추가하고, 서버 액션 `savePost`가 저장 결과의 `status`·`publishedAt`을 돌려주어 스토어가 항상 DB와 같은 상태를 유지하게 한다. 자동저장·수동저장·페이지 이탈 처리는 이 dirty 상태 하나를 기준으로 동작한다. `publishedAt`은 클라이언트 입력을 신뢰하지 않고 서버가 DB 현재값을 읽어 결정한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, zustand, Drizzle ORM(neon-http), Vitest + Testing Library

**Spec:** 별도 스펙 문서 없음. 2026-08-19 글쓰기 기능 리뷰 세션의 결론을 아래 「배경」에 요약한다.

## 로드맵 — 글쓰기 개선 4개 PR

2026-08-19 글쓰기 기능 리뷰 결과를 4개 PR로 나눈다. 순서대로 진행하며, 각 PR은 별도 plan 문서를 갖는다.

| 순서 | 브랜치 | plan 문서 | 요지 |
|---|---|---|---|
| 1 | `fix/editor-save-lifecycle` | 이 문서 | 발행 글 덮어쓰기·draft 회귀·자동저장 오동작 등 데이터 손실 방지 |
| 2 | `refactor/editor-remove-markdown-mode` | [2026-08-19-editor-remove-markdown-mode.md](./2026-08-19-editor-remove-markdown-mode.md) | 마크다운 모드 제거(사용자 결정), 기존 마크다운 글은 편집 진입 시 HTML 변환 |
| 3 | `fix/editor-image-handling` | [2026-08-19-editor-image-handling.md](./2026-08-19-editor-image-handling.md) | 이미지 드래그 이동, 툴바 BubbleMenu 이전, R2 정리 저장 시점으로 이전, 클라이언트 압축, 빈 draft 표시 |
| 4 | `feature/editor-polish` | [2026-08-19-editor-polish.md](./2026-08-19-editor-polish.md) | slug 편집, 코드블록 하이라이트, 카테고리 해제·태그 폭·아이콘 규칙, `metaDescription` 제거, 레이아웃 통일 |

> 원래 순서는 "이미지 → 마크다운 제거"였으나, 마크다운 제거가 툴바·스토어를 단순화해 이미지 PR의 수정 범위를 줄이므로 2·3을 바꿨다.

## 배경 — 리뷰에서 확인된 문제 (이 PR 범위)

| # | 문제 | 원인 파일 |
|---|---|---|
| 1 | 발행 후 `/admin/posts/new`로 가면 방금 발행한 글의 `postId`·내용이 스토어에 그대로 남아 있고, 스토어 `status`는 여전히 `'draft'`라 30초 뒤 자동저장이 `submitPost('draft')`를 호출 → **발행 글이 임시저장으로 회귀** | `new/page.tsx`(reset 없음), `publish.action.tsx`, `_store.ts`(`submitPost`가 status를 갱신하지 않음) |
| 2 | 발행 글에서 "임시저장" 클릭 = 발행 취소(`publishedAt = null`). 이후 재발행 시 스토어의 옛 `publishedAt`이 서버로 전달돼 `if (status==='published' && !input.publishedAt)` 조건이 거짓 → **`publishedAt`이 null인 채 published** | `draft.action.tsx`, `save-post.ts` |
| 3 | 수정 페이지 진입만 해도 `PostInitHandler`의 `initializePost` → `title/content` 변경 → 30초 뒤 저장. 발행 글의 `updatedAt`이 매번 갱신되고 `revalidateTag`도 불필요하게 돔 | `auto-save.provider.tsx` |
| 4 | 제목만 입력한 상태에서 자동저장 → Zod `content.min(1)` 실패 → "저장 실패" 표시 | `auto-save.provider.tsx` |
| 5 | 카테고리·시리즈·태그·썸네일·SEO 변경은 자동저장을 트리거하지 않음 | `auto-save.provider.tsx` |
| 6 | 미저장 상태로 탭을 닫아도 경고가 없음 | — |
| 7 | `save-post.ts`의 `updateData: Record<string, unknown>` — 타입 안전성 없음 | `save-post.ts` |

**이 PR에서 제외(다른 PR):** 마크다운 모드 제거(PR 2), 이미지 드래그·툴바 UI·R2 삭제 지연·압축(PR 3), slug 편집·코드블록·잔손질(PR 4).

**의도적으로 하지 않는 것:** `db.transaction`으로 글+태그 동기화 묶기 — 현재 드라이버가 `drizzle-orm/neon-http`라 인터랙티브 트랜잭션을 지원하지 않는다. 드라이버 교체는 이 PR 범위 밖.

## Global Constraints

- 브랜치: `develop`에서 `fix/editor-save-lifecycle` 생성. squash 금지, 커밋 메시지는 gitmoji.
- 폴더·파일명은 `.claude/rules/page-folder.md`를 따른다 — 신규 handler는 `_handlers/*.handler.tsx`.
- 테스트는 대상 파일 옆 `*.test.ts(x)`. Server Action(`_services/*`)은 테스트에서 반드시 `vi.mock`으로 교체한다 (`db/index.ts`가 `DATABASE_URL` 없이 import되면 크래시).
- 스토어 `submitPost`는 `save-post.ts`를 **동적 import**한다(기존 주석 참조). `vi.mock`은 동적 import에도 적용되므로 테스트에서 그대로 mock 가능.
- 아이콘은 `size={16}`으로 지정한다(`className="h-4 w-4"` 금지) — 이 PR에서 손대는 파일에 한해 규칙에 맞춘다.
- `console.log` 커밋 금지.
- 자동저장 간격 30초(`intervalMs = 30000`)는 유지한다.

---

## 파일 구조

| 파일 | 역할 | 변경 |
|---|---|---|
| `src/app/admin/posts/new/_store.ts` | 에디터 전역 상태. `changeCount`/`savedChangeCount` 추가, 사용자 편집 setter가 카운터 증가, `submitPost` 성공 시 서버 응답으로 `status`·`publishedAt` 동기화 | 수정 |
| `src/app/admin/posts/new/_store.test.ts` | 스토어 dirty 추적·submitPost 동기화 테스트 | 신규 |
| `src/app/admin/posts/new/_services/save-post.ts` | `publishedAt`을 서버가 결정, 결과에 `status`·`publishedAt` 포함, `updateData` 타입 안전화 | 수정 |
| `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx` | 외부 content 동기화 시 `emitUpdate: false` → 초기화가 dirty를 오염시키지 않도록 | 수정 |
| `src/app/admin/posts/new/_providers/auto-save.provider.tsx` | dirty + 필수값 충족 시에만 자동저장, `beforeunload` 경고 | 수정 |
| `src/app/admin/posts/new/_providers/auto-save.provider.test.tsx` | 자동저장 조건·beforeunload 테스트 | 신규 |
| `src/app/admin/posts/new/_actions/draft.action.tsx` | 발행 글이면 "저장"(status 유지), 아니면 "임시저장" | 수정 |
| `src/app/admin/posts/new/_actions/draft.action.test.tsx` | 라벨·호출 status 테스트 | 신규 |
| `src/app/admin/posts/new/_actions/save-status.action.tsx` | "자동 저장 완료" → "저장됨" (수동/자동 공통) | 수정 |
| `src/app/admin/posts/new/_handlers/new-post-reset.handler.tsx` | `/new` 페이지 언마운트 시 스토어 reset | 신규 |
| `src/app/admin/posts/new/_handlers/new-post-reset.handler.test.tsx` | 언마운트 reset 테스트 | 신규 |
| `src/app/admin/posts/new/page.tsx` | `NewPostResetHandler` 배치 | 수정 |

---

### Task 0: 브랜치 생성

- [ ] **Step 1: develop 최신화 후 브랜치 생성**

```bash
git checkout develop
git pull origin develop
git checkout -b fix/editor-save-lifecycle
```

- [ ] **Step 2: 기존 테스트가 통과하는지 확인**

Run: `npx vitest run --dir src src/app/admin/posts`
Expected: 모두 PASS (2026-08-19 기준 12 files / 59 tests)

---

### Task 1: 스토어 dirty 추적 (`changeCount` / `savedChangeCount`)

**Files:**
- Modify: `src/app/admin/posts/new/_store.ts`
- Test: `src/app/admin/posts/new/_store.test.ts` (신규)

**Interfaces:**
- Produces:
  - `State.changeCount: number` — 사용자 편집 setter가 호출될 때마다 +1
  - `State.savedChangeCount: number` — 마지막 저장 성공 시점의 `changeCount`
  - `export const selectIsDirty = (s: { changeCount: number; savedChangeCount: number }) => s.changeCount !== s.savedChangeCount`
  - dirty를 올리는 setter: `setTitle`, `setContent`, `setContentFormat`, `setCategoryId`, `setSeriesId`, `setTagIds`, `setSlug`, `setExcerpt`, `setMetaTitle`, `setThumbnailUrl`
  - dirty를 올리지 **않는** setter: `setPostId`, `setStatus`, `setPublishedAt`, `setMode`, `setSaveStatus`, `setLastSavedAt`, `setIsGeneratingExcerpt`
  - `reset()`·`initializePost()`는 두 카운터를 모두 0으로 초기화

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_store.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./_services/save-post', () => ({
  savePost: vi.fn(),
}));

import { selectIsDirty, useNewPostStore } from './_store';

describe('useNewPostStore dirty 추적', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('초기 상태는 dirty가 아니다', () => {
    expect(selectIsDirty(useNewPostStore.getState())).toBe(false);
  });

  it('사용자 편집 setter는 dirty로 만든다', () => {
    const s = useNewPostStore.getState();
    s.setTitle('제목');
    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);
  });

  it.each([
    ['setContent', (s: ReturnType<typeof useNewPostStore.getState>) => s.setContent('<p>a</p>')],
    ['setCategoryId', (s: ReturnType<typeof useNewPostStore.getState>) => s.setCategoryId(1)],
    ['setSeriesId', (s: ReturnType<typeof useNewPostStore.getState>) => s.setSeriesId(1)],
    ['setTagIds', (s: ReturnType<typeof useNewPostStore.getState>) => s.setTagIds([1])],
    ['setSlug', (s: ReturnType<typeof useNewPostStore.getState>) => s.setSlug('x')],
    ['setExcerpt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setExcerpt('x')],
    ['setMetaTitle', (s: ReturnType<typeof useNewPostStore.getState>) => s.setMetaTitle('x')],
    ['setThumbnailUrl', (s: ReturnType<typeof useNewPostStore.getState>) => s.setThumbnailUrl('u')],
  ])('%s 호출은 changeCount를 1 올린다', (_name, call) => {
    const before = useNewPostStore.getState().changeCount;
    call(useNewPostStore.getState());
    expect(useNewPostStore.getState().changeCount).toBe(before + 1);
  });

  it.each([
    ['setPostId', (s: ReturnType<typeof useNewPostStore.getState>) => s.setPostId(1)],
    ['setStatus', (s: ReturnType<typeof useNewPostStore.getState>) => s.setStatus('published')],
    ['setMode', (s: ReturnType<typeof useNewPostStore.getState>) => s.setMode('markdown')],
    ['setSaveStatus', (s: ReturnType<typeof useNewPostStore.getState>) => s.setSaveStatus('saving')],
    ['setLastSavedAt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setLastSavedAt(new Date())],
    ['setIsGeneratingExcerpt', (s: ReturnType<typeof useNewPostStore.getState>) => s.setIsGeneratingExcerpt(true)],
  ])('%s 호출은 changeCount를 올리지 않는다', (_name, call) => {
    const before = useNewPostStore.getState().changeCount;
    call(useNewPostStore.getState());
    expect(useNewPostStore.getState().changeCount).toBe(before);
  });

  it('initializePost 직후는 dirty가 아니다', () => {
    useNewPostStore.getState().setTitle('편집 중');
    useNewPostStore.getState().initializePost({
      postId: 1,
      title: '글',
      content: '<p>본문</p>',
      contentFormat: 'html',
      categoryId: null,
      seriesId: null,
      tagIds: [],
      slug: 'post',
      excerpt: '',
      metaTitle: '',
      thumbnailUrl: null,
      status: 'published',
      publishedAt: new Date('2026-01-01'),
    });
    expect(selectIsDirty(useNewPostStore.getState())).toBe(false);
  });

  it('reset 이후는 dirty가 아니다', () => {
    useNewPostStore.getState().setTitle('편집 중');
    useNewPostStore.getState().reset();
    expect(selectIsDirty(useNewPostStore.getState())).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_store.test.ts`
Expected: FAIL — `selectIsDirty`가 export되지 않음 / `changeCount`가 undefined

- [ ] **Step 3: 스토어 구현**

`src/app/admin/posts/new/_store.ts`에서 다음을 반영한다.

`State` 타입에 추가:

```ts
  changeCount: number;
  savedChangeCount: number;
```

`export const useNewPostStore` 위에 selector 추가:

```ts
export const selectIsDirty = (s: { changeCount: number; savedChangeCount: number }) =>
  s.changeCount !== s.savedChangeCount;
```

초기값(`create` 첫 부분)과 `reset()`의 set 객체 양쪽에 `changeCount: 0, savedChangeCount: 0` 추가. `initializePost`의 set 객체에도 `changeCount: 0, savedChangeCount: 0` 추가.

사용자 편집 setter는 함수형 set으로 카운터를 올린다(각 한 줄씩 교체):

```ts
  setTitle: (title) => set((s) => ({ title, changeCount: s.changeCount + 1 })),
  setContent: (content) => set((s) => ({ content, changeCount: s.changeCount + 1 })),
  setContentFormat: (contentFormat) =>
    set((s) => ({ contentFormat, changeCount: s.changeCount + 1 })),
  setCategoryId: (categoryId) => set((s) => ({ categoryId, changeCount: s.changeCount + 1 })),
  setSeriesId: (seriesId) => set((s) => ({ seriesId, changeCount: s.changeCount + 1 })),
  setTagIds: (tagIds) => set((s) => ({ tagIds, changeCount: s.changeCount + 1 })),
  setSlug: (slug) => set((s) => ({ slug, changeCount: s.changeCount + 1 })),
  setExcerpt: (excerpt) => set((s) => ({ excerpt, changeCount: s.changeCount + 1 })),
  setMetaTitle: (metaTitle) => set((s) => ({ metaTitle, changeCount: s.changeCount + 1 })),
  setThumbnailUrl: (thumbnailUrl) =>
    set((s) => ({ thumbnailUrl, changeCount: s.changeCount + 1 })),
```

`setPostId`·`setStatus`·`setPublishedAt`·`setMode`·`setSaveStatus`·`setLastSavedAt`·`setIsGeneratingExcerpt`는 그대로 둔다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_store.test.ts`
Expected: PASS (dirty 추적 describe 전부)

- [ ] **Step 5: 기존 테스트 회귀 확인**

Run: `npx vitest run --dir src src/app/admin/posts`
Expected: 전부 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_store.ts src/app/admin/posts/new/_store.test.ts
git commit -m "✨ feat: 에디터 스토어에 changeCount 기반 dirty 추적 추가"
```

---

### Task 2: `savePost`가 `publishedAt`을 서버에서 결정하고 결과에 `status`·`publishedAt`을 반환

**Files:**
- Modify: `src/app/admin/posts/new/_services/save-post.ts`
- Modify: `src/app/admin/posts/new/_store.ts` (`submitPost`)
- Test: `src/app/admin/posts/new/_store.test.ts` (describe 추가)

**Interfaces:**
- Consumes: Task 1의 `changeCount`/`savedChangeCount`
- Produces:
  - `SavePostInput`에서 `publishedAt` 제거
  - `SavePostResult` 성공형: `{ success: true; postId: number; status: 'draft' | 'published'; publishedAt: Date | null }`
  - `submitPost` 성공 시 스토어에 `status`, `publishedAt`, `savedChangeCount`(호출 시점의 `changeCount`) 반영

- [ ] **Step 1: 실패하는 테스트 작성** — `_store.test.ts`에 describe 추가

```ts
import { savePost } from './_services/save-post';

describe('useNewPostStore.submitPost', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
    vi.mocked(savePost).mockReset();
  });

  it('성공 시 서버가 돌려준 status·publishedAt·postId를 스토어에 반영하고 dirty를 해제한다', async () => {
    const publishedAt = new Date('2026-08-19T10:00:00Z');
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 42,
      status: 'published',
      publishedAt,
    });
    const s = useNewPostStore.getState();
    s.setTitle('제목');
    s.setContent('<p>본문</p>');
    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);

    const result = await useNewPostStore.getState().submitPost('published');

    expect(result.success).toBe(true);
    const after = useNewPostStore.getState();
    expect(after.postId).toBe(42);
    expect(after.status).toBe('published');
    expect(after.publishedAt).toEqual(publishedAt);
    expect(after.saveStatus).toBe('saved');
    expect(selectIsDirty(after)).toBe(false);
  });

  it('저장 중에 추가 편집이 있었으면 저장 성공 후에도 dirty가 유지된다', async () => {
    let resolveSave: (v: Awaited<ReturnType<typeof savePost>>) => void = () => {};
    vi.mocked(savePost).mockImplementation(
      () => new Promise((resolve) => { resolveSave = resolve; }),
    );
    const s = useNewPostStore.getState();
    s.setTitle('제목');
    s.setContent('<p>본문</p>');

    const pending = useNewPostStore.getState().submitPost('draft');
    useNewPostStore.getState().setTitle('저장 중 수정');
    resolveSave({ success: true, postId: 1, status: 'draft', publishedAt: null });
    await pending;

    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);
  });

  it('publishedAt을 서버로 보내지 않는다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: true, postId: 1, status: 'draft', publishedAt: null,
    });
    useNewPostStore.getState().setTitle('제목');
    useNewPostStore.getState().setContent('<p>본문</p>');
    await useNewPostStore.getState().submitPost('draft');
    const arg = vi.mocked(savePost).mock.calls[0][0];
    expect('publishedAt' in arg).toBe(false);
  });

  it('실패 시 saveStatus가 error가 되고 dirty는 유지된다', async () => {
    vi.mocked(savePost).mockResolvedValue({ success: false, error: '저장에 실패했습니다' });
    useNewPostStore.getState().setTitle('제목');
    useNewPostStore.getState().setContent('<p>본문</p>');
    const result = await useNewPostStore.getState().submitPost('draft');
    expect(result.success).toBe(false);
    expect(useNewPostStore.getState().saveStatus).toBe('error');
    expect(selectIsDirty(useNewPostStore.getState())).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_store.test.ts`
Expected: FAIL — `status`가 `'draft'`로 남음 / `selectIsDirty`가 true / `publishedAt` 키 존재

- [ ] **Step 3: `save-post.ts` 수정**

타입 변경:

```ts
type SavePostInput = {
  postId?: number | null;
  title: string;
  slug: string;
  content: string;
  contentFormat: 'markdown' | 'html';
  excerpt?: string;
  metaTitle?: string;
  thumbnailUrl?: string | null;
  categoryId: number | null;
  seriesId: number | null;
  tagIds?: number[];
  status: 'draft' | 'published';
};

type SavePostResult =
  | {
      success: true;
      postId: number;
      status: 'draft' | 'published';
      publishedAt: Date | null;
    }
  | { success: false; error: string };
```

`try` 블록의 UPDATE 분기를 아래로 교체한다(기존 `updateData: Record<string, unknown>` 및 `if (status === 'published' && !input.publishedAt)` 블록 제거):

```ts
    if (input.postId) {
      // publishedAt은 클라이언트 입력을 신뢰하지 않고 DB 현재값 기준으로 결정한다.
      // - published: 이미 있으면 유지, 없으면(첫 발행) 지금
      // - draft: null
      const [current] = await db
        .select({ publishedAt: posts.publishedAt })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);
      if (!current) {
        return { success: false, error: '글을 찾을 수 없습니다' };
      }
      const publishedAt =
        status === 'published' ? (current.publishedAt ?? new Date()) : null;

      const updateData: Partial<typeof posts.$inferInsert> = {
        title,
        slug,
        content,
        contentFormat,
        excerpt: excerpt && excerpt.length > 0 ? excerpt : null,
        metaTitle: metaTitle && metaTitle.length > 0 ? metaTitle : null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        categoryId,
        seriesId,
        status,
        publishedAt,
        updatedAt: new Date(),
      };

      await db.update(posts).set(updateData).where(eq(posts.id, input.postId));
      await syncPostTags(input.postId, tagIds);

      revalidateTag(CACHE_TAGS.posts, 'max');
      revalidateTag(CACHE_TAGS.series, 'max');
      revalidatePath('/admin/posts');
      return { success: true, postId: input.postId, status, publishedAt };
    }
```

INSERT 분기의 마지막 return을 아래로 교체:

```ts
      return { success: true, postId: newPost.id, status, publishedAt };
```

(INSERT 분기의 `const publishedAt = status === 'published' ? new Date() : null;`은 그대로 사용한다.)

- [ ] **Step 4: `_store.ts`의 `submitPost` 수정**

```ts
  submitPost: async (status) => {
    // 동적 import: save-post.ts는 'use server' 파일로 db/index.ts(neon 호출)를 정적 참조하면
    // DATABASE_URL 없는 Vitest 환경에서 스토어 import만으로도 크래시난다.
    const { savePost } = await import('./_services/save-post');
    const state = get();
    const changeCountAtStart = state.changeCount;
    const slug = state.slug || generateSlug(state.title);

    set({ saveStatus: 'saving' });

    const result = await savePost({
      postId: state.postId,
      title: state.title,
      slug,
      content: state.content,
      contentFormat: state.contentFormat,
      excerpt: state.excerpt,
      metaTitle: state.metaTitle,
      categoryId: state.categoryId,
      seriesId: state.seriesId,
      tagIds: state.tagIds,
      thumbnailUrl: state.thumbnailUrl,
      status,
    });

    if (result.success) {
      set({
        postId: result.postId,
        slug,
        status: result.status,
        publishedAt: result.publishedAt,
        savedChangeCount: changeCountAtStart,
        saveStatus: 'saved',
        lastSavedAt: new Date(),
      });
      return { success: true, slug };
    } else {
      set({ saveStatus: 'error' });
      return { success: false, error: result.error };
    }
  },
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_store.test.ts`
Expected: PASS

- [ ] **Step 6: 타입 확인**

Run: `npx tsc --noEmit`
Expected: 오류 없음 (특히 `save-post.ts`의 `Partial<typeof posts.$inferInsert>`)

- [ ] **Step 7: 커밋**

```bash
git add src/app/admin/posts/new/_services/save-post.ts src/app/admin/posts/new/_store.ts src/app/admin/posts/new/_store.test.ts
git commit -m "🐛 fix: savePost가 publishedAt을 서버에서 결정하고 status·publishedAt을 스토어에 동기화"
```

---

### Task 3: WYSIWYG 에디터 외부 동기화가 dirty를 오염시키지 않도록

**Files:**
- Modify: `src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx:245-254` (content 동기화 `useEffect`)

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (동작 변경만)

배경: TipTap 3의 `editor.commands.setContent(content)`는 기본값 `emitUpdate: true`라 `onUpdate`가 실행되고, `onUpdate`는 `setContent(editor.getHTML())`을 호출한다. 수정 페이지에서 `initializePost` → 동기화 effect → `onUpdate` → 스토어 `setContent` → `changeCount` +1 로 이어져 **열자마자 dirty**가 된다. 동기화 시에는 update 이벤트를 내지 않게 하고, 이미지 src 추적 세트만 직접 갱신한다.

- [ ] **Step 1: 동기화 effect 수정**

기존:

```tsx
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);
```

변경:

```tsx
  // content가 외부에서 변경되었을 때 (수정 페이지 초기화, 모드 전환 등) 에디터 내용 동기화.
  // emitUpdate: false — onUpdate를 타지 않게 해서 초기화가 dirty(changeCount)를 올리지 않도록 한다.
  // onUpdate가 하던 이미지 src 추적 초기화는 여기서 직접 수행한다.
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', { emitUpdate: false });
      prevImageSrcs.current = collectImageSrcs(editor.state.doc);
    }
  }, [content, editor]);
```

- [ ] **Step 2: 타입·린트 확인**

Run: `npx tsc --noEmit && npx eslint src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx`
Expected: 오류 없음

- [ ] **Step 3: 기존 테스트 회귀 확인**

Run: `npx vitest run --dir src src/app/admin/posts`
Expected: 전부 PASS

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/posts/new/_actions/wysiwyg-editor.action.tsx
git commit -m "🐛 fix: 에디터 외부 동기화 시 update 이벤트를 내지 않아 초기화가 dirty를 오염시키지 않도록"
```

---

### Task 4: 자동저장 — dirty·필수값 조건 + `beforeunload` 경고

**Files:**
- Modify: `src/app/admin/posts/new/_providers/auto-save.provider.tsx`
- Test: `src/app/admin/posts/new/_providers/auto-save.provider.test.tsx` (신규)

**Interfaces:**
- Consumes: Task 1의 `selectIsDirty`, `changeCount`; Task 2의 `submitPost`
- Produces: 없음

동작 규칙:
1. dirty가 아니면 아무것도 하지 않는다 (수정 페이지 진입만으로 저장되지 않음).
2. `title.trim()`이 비었거나 `content`가 비면 타이머를 걸지 않는다 (Zod 실패로 "저장 실패"가 뜨는 것 방지).
3. 조건을 만족하면 마지막 변경(`changeCount`)으로부터 30초 뒤 `submitPost(현재 status)`.
4. dirty인 동안 `beforeunload`에서 `preventDefault()`로 브라우저 이탈 경고를 띄운다. (Next.js 클라이언트 라우팅은 잡지 못한다 — 알려진 한계, PR 4에서 필요 시 별도 처리.)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_providers/auto-save.provider.test.tsx`:

```tsx
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_services/save-post', () => ({
  savePost: vi.fn(),
}));

import { savePost } from '../_services/save-post';
import { useNewPostStore } from '../_store';
import { AutoSaveProvider } from './auto-save.provider';

const intervalMs = 30000;

describe('AutoSaveProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNewPostStore.getState().reset();
    vi.mocked(savePost).mockReset();
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'draft',
      publishedAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('제목·본문을 입력하고 30초가 지나면 현재 status로 저장한다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
      useNewPostStore.getState().setContent('<p>본문</p>');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs);
    });
    expect(savePost).toHaveBeenCalledTimes(1);
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('draft');
  });

  it('dirty가 아니면(initializePost 직후) 저장하지 않는다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().initializePost({
        postId: 7,
        title: '기존 글',
        content: '<p>본문</p>',
        contentFormat: 'html',
        categoryId: null,
        seriesId: null,
        tagIds: [],
        slug: 'existing',
        excerpt: '',
        metaTitle: '',
        thumbnailUrl: null,
        status: 'published',
        publishedAt: new Date('2026-01-01'),
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs * 2);
    });
    expect(savePost).not.toHaveBeenCalled();
  });

  it('제목만 있고 본문이 비어 있으면 저장하지 않는다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목만');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs * 2);
    });
    expect(savePost).not.toHaveBeenCalled();
  });

  it('카테고리만 바꿔도(제목·본문이 있으면) 자동저장된다', async () => {
    act(() => {
      useNewPostStore.getState().initializePost({
        postId: 7,
        title: '기존 글',
        content: '<p>본문</p>',
        contentFormat: 'html',
        categoryId: null,
        seriesId: null,
        tagIds: [],
        slug: 'existing',
        excerpt: '',
        metaTitle: '',
        thumbnailUrl: null,
        status: 'published',
        publishedAt: new Date('2026-01-01'),
      });
    });
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setCategoryId(3);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs);
    });
    expect(savePost).toHaveBeenCalledTimes(1);
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('published');
    expect(vi.mocked(savePost).mock.calls[0][0].categoryId).toBe(3);
  });

  it('연속 편집 중에는 마지막 편집 기준으로 30초를 다시 센다', async () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
      useNewPostStore.getState().setContent('<p>a</p>');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs - 1000);
    });
    act(() => {
      useNewPostStore.getState().setContent('<p>ab</p>');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(intervalMs - 1000);
    });
    expect(savePost).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(savePost).toHaveBeenCalledTimes(1);
  });

  it('dirty일 때 beforeunload를 preventDefault한다', () => {
    render(<AutoSaveProvider />);
    act(() => {
      useNewPostStore.getState().setTitle('제목');
    });
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('dirty가 아니면 beforeunload를 막지 않는다', () => {
    render(<AutoSaveProvider />);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_providers/auto-save.provider.test.tsx`
Expected: FAIL — "dirty가 아니면 저장하지 않는다", "제목만 있고…", "카테고리만 바꿔도…", beforeunload 테스트가 실패

- [ ] **Step 3: 구현**

`src/app/admin/posts/new/_providers/auto-save.provider.tsx` 전체 교체:

```tsx
'use client';

import { useEffect } from 'react';
import { selectIsDirty, useNewPostStore } from '../_store';

const intervalMs = 30000;

export function AutoSaveProvider() {
  const isDirty = useNewPostStore(selectIsDirty);
  const changeCount = useNewPostStore((s) => s.changeCount);
  const hasRequiredFields = useNewPostStore(
    (s) => s.title.trim().length > 0 && s.content.length > 0,
  );
  const status = useNewPostStore((s) => s.status);
  const submitPost = useNewPostStore((s) => s.submitPost);

  // 마지막 편집(changeCount) 기준 30초 뒤 저장. dirty가 아니거나 필수값이 없으면 걸지 않는다.
  useEffect(() => {
    if (!isDirty || !hasRequiredFields) return;

    const timer = setTimeout(() => {
      submitPost(status);
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [changeCount, isDirty, hasRequiredFields, status, submitPost]);

  // 미저장 상태로 탭을 닫거나 새로고침하면 브라우저 경고를 띄운다.
  // (Next.js 클라이언트 라우팅 이동은 잡지 못한다.)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return null;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_providers/auto-save.provider.test.tsx`
Expected: PASS (7개)

- [ ] **Step 5: 커밋**

```bash
git add src/app/admin/posts/new/_providers/auto-save.provider.tsx src/app/admin/posts/new/_providers/auto-save.provider.test.tsx
git commit -m "🐛 fix: 자동저장을 dirty·필수값 충족 시에만 실행하고 미저장 이탈 경고 추가"
```

---

### Task 5: 발행 글의 "임시저장" 버튼을 status 유지 "저장"으로, 저장 상태 문구 정리

**Files:**
- Modify: `src/app/admin/posts/new/_actions/draft.action.tsx`
- Modify: `src/app/admin/posts/new/_actions/save-status.action.tsx`
- Test: `src/app/admin/posts/new/_actions/draft.action.test.tsx` (신규)

**Interfaces:**
- Consumes: Task 2의 `submitPost`
- Produces: 없음

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_actions/draft.action.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_services/save-post', () => ({
  savePost: vi.fn(),
}));

import { savePost } from '../_services/save-post';
import { useNewPostStore } from '../_store';
import { DraftAction } from './draft.action';

describe('DraftAction', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
    vi.mocked(savePost).mockReset();
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'draft',
      publishedAt: null,
    });
  });

  it('draft 글에서는 "임시저장" 라벨이고 draft로 저장한다', async () => {
    render(<DraftAction />);
    const button = screen.getByRole('button', { name: /임시저장/ });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('draft');
  });

  it('published 글에서는 "저장" 라벨이고 published를 유지한 채 저장한다', async () => {
    vi.mocked(savePost).mockResolvedValue({
      success: true,
      postId: 1,
      status: 'published',
      publishedAt: new Date('2026-01-01'),
    });
    useNewPostStore.getState().setStatus('published');
    render(<DraftAction />);
    expect(screen.queryByRole('button', { name: /임시저장/ })).not.toBeInTheDocument();
    const button = screen.getByRole('button', { name: /^저장$/ });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(vi.mocked(savePost).mock.calls[0][0].status).toBe('published');
  });

  it('저장 중에는 비활성화된다', () => {
    useNewPostStore.getState().setSaveStatus('saving');
    render(<DraftAction />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/draft.action.test.tsx`
Expected: FAIL — published 케이스에서 라벨이 "임시저장"이고 status가 `'draft'`로 전달됨

- [ ] **Step 3: `draft.action.tsx` 구현**

```tsx
'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNewPostStore } from '../_store';

export function DraftAction() {
  const status = useNewPostStore((s) => s.status);
  const saveStatus = useNewPostStore((s) => s.saveStatus);
  const submitPost = useNewPostStore((s) => s.submitPost);
  const isPublished = status === 'published';

  // 발행 글은 status를 유지한 채 저장한다 — "임시저장"이 발행 취소로 동작하지 않도록.
  const handleClick = async () => {
    await submitPost(status);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={saveStatus === 'saving'}
    >
      <Save size={16} />
      {isPublished ? '저장' : '임시저장'}
    </Button>
  );
}
```

- [ ] **Step 4: `save-status.action.tsx` 문구 수정**

`{saveStatus === 'saved' && lastSavedAt && (<>자동 저장 완료 {format(...)}</>)}` 를 아래로 교체:

```tsx
      {saveStatus === 'saved' && lastSavedAt && (
        <>저장됨 {format(lastSavedAt, 'HH:mm:ss', { locale: ko })}</>
      )}
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_actions/draft.action.test.tsx`
Expected: PASS (3개)

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_actions/draft.action.tsx src/app/admin/posts/new/_actions/draft.action.test.tsx src/app/admin/posts/new/_actions/save-status.action.tsx
git commit -m "🐛 fix: 발행 글의 임시저장 버튼이 발행을 취소하지 않도록 status 유지 저장으로 변경"
```

---

### Task 6: `/admin/posts/new` 이탈 시 스토어 reset (발행 글 덮어쓰기 방지)

**Files:**
- Create: `src/app/admin/posts/new/_handlers/new-post-reset.handler.tsx`
- Test: `src/app/admin/posts/new/_handlers/new-post-reset.handler.test.tsx` (신규)
- Modify: `src/app/admin/posts/new/page.tsx`

**Interfaces:**
- Consumes: 스토어 `reset()`
- Produces: `export function NewPostResetHandler(): null`

배경: 수정 페이지는 `PostInitHandler`가 언마운트 시 `reset()`을 호출하지만 신규 페이지에는 대응 로직이 없다. 발행 성공 → `/posts/[slug]` 이동 → 다시 "글쓰기"로 들어오면 이전 글의 `postId`·내용이 남아 있다. 신규 페이지도 언마운트 시 reset한다. (마운트 시 reset은 하지 않는다 — `WysiwygEditorAction`의 `useEditor` 초기 content가 렌더 시점에 결정되므로 마운트 effect에서 reset하면 스토어와 에디터가 어긋난다.)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/app/admin/posts/new/_handlers/new-post-reset.handler.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_services/save-post', () => ({
  savePost: vi.fn(),
}));

import { useNewPostStore } from '../_store';
import { NewPostResetHandler } from './new-post-reset.handler';

describe('NewPostResetHandler', () => {
  beforeEach(() => {
    useNewPostStore.getState().reset();
  });

  it('마운트 시에는 스토어를 건드리지 않는다', () => {
    useNewPostStore.getState().setTitle('업로드 중 생긴 초안');
    useNewPostStore.getState().setPostId(5);
    render(<NewPostResetHandler />);
    expect(useNewPostStore.getState().title).toBe('업로드 중 생긴 초안');
    expect(useNewPostStore.getState().postId).toBe(5);
  });

  it('언마운트 시 스토어를 reset한다', () => {
    const { unmount } = render(<NewPostResetHandler />);
    useNewPostStore.getState().setTitle('발행한 글');
    useNewPostStore.getState().setPostId(42);
    unmount();
    expect(useNewPostStore.getState().title).toBe('');
    expect(useNewPostStore.getState().postId).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/app/admin/posts/new/_handlers/new-post-reset.handler.test.tsx`
Expected: FAIL — 모듈을 찾을 수 없음

- [ ] **Step 3: 핸들러 구현**

`src/app/admin/posts/new/_handlers/new-post-reset.handler.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useNewPostStore } from '../_store';

/**
 * 신규 글 페이지를 떠날 때 스토어를 비운다.
 * 발행 후 다시 "글쓰기"로 들어왔을 때 이전 글의 postId·내용이 남아
 * 발행 글을 덮어쓰거나 자동저장이 draft로 되돌리는 문제를 막는다.
 * 마운트 시에는 reset하지 않는다(에디터 초기 content와 어긋남).
 */
export function NewPostResetHandler() {
  useEffect(() => {
    return () => {
      useNewPostStore.getState().reset();
    };
  }, []);

  return null;
}
```

- [ ] **Step 4: `page.tsx`에 배치**

`src/app/admin/posts/new/page.tsx` import 추가:

```tsx
import { NewPostResetHandler } from './_handlers/new-post-reset.handler';
```

JSX에서 `<EditorProvider>` 바로 아래 첫 자식으로 추가:

```tsx
    <EditorProvider>
      <NewPostResetHandler />
      <div className="flex flex-1 flex-col">
```

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run src/app/admin/posts/new/_handlers/new-post-reset.handler.test.tsx`
Expected: PASS (2개)

- [ ] **Step 6: 커밋**

```bash
git add src/app/admin/posts/new/_handlers/new-post-reset.handler.tsx src/app/admin/posts/new/_handlers/new-post-reset.handler.test.tsx src/app/admin/posts/new/page.tsx
git commit -m "🐛 fix: 신규 글 페이지 이탈 시 스토어를 reset해 발행 글 덮어쓰기 방지"
```

---

### Task 7: 최종 검증 및 문서 갱신

**Files:**
- Modify: `docs/superpowers/plans/2026-08-19-editor-save-lifecycle.md` (완료 기록)

- [ ] **Step 1: 전체 단위 테스트**

Run: `npm run test:run`
Expected: 전부 PASS

- [ ] **Step 2: 린트·타입·빌드**

Run: `npm run lint && npx tsc --noEmit && npm run build`
Expected: 오류 없음 (사전 존재 린트 이슈는 별도 기록)

- [ ] **Step 3: 수동 시나리오 확인 (사용자 또는 로그인 가능한 브라우저 필요)**

체크리스트 — 각 항목을 실제 화면에서 확인하고 결과를 완료 기록에 남긴다:

1. 수정 페이지를 열고 아무 것도 안 한 채 40초 대기 → 저장 상태 문구가 나타나지 **않는다**, 목록의 수정일이 바뀌지 않는다.
2. 수정 페이지에서 카테고리만 변경 → 30초 뒤 "저장됨 HH:mm:ss".
3. 발행 글 수정 페이지의 하단 버튼이 "저장"으로 표시되고, 클릭 후 목록에서 상태가 "발행"으로 유지된다.
4. 새 글 작성 → 완료(발행) → 상세 페이지 이동 → 사이드바 "글쓰기" 클릭 → 빈 에디터가 뜬다. 40초 대기 후 목록에서 방금 발행한 글이 여전히 "발행".
5. 새 글에서 제목만 입력하고 40초 대기 → "저장 실패"가 뜨지 **않는다**.
6. 제목·본문 입력 후 즉시 탭 닫기 → 브라우저 이탈 확인 경고.

- [ ] **Step 4: plan 문서 상단에 완료 일자·결과 요약 추가 후 커밋**

```bash
git add docs/superpowers/plans/2026-08-19-editor-save-lifecycle.md
git commit -m "📝 docs: 에디터 저장 수명주기 plan 완료 기록"
```

- [ ] **Step 5: `develop`으로 PR 생성** (`--no-ff` 머지, 머지 후 브랜치·워크트리 제거)
