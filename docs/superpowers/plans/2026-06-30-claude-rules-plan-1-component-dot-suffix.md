# 플랜 1 (A축) — 컴포넌트 dot-suffix 리네임

> 브랜치: `feature/rules-component-dot-suffix` (from `develop`)
> 성격: 순수 리네이밍. 동작 변화 없음.

## 규칙 근거

`.claude/rules/page-folder.md` — 역할 컴포넌트는 dot-suffix(`<이름>.<역할>.tsx`)로 표기한다.
- `_actions/*.action.tsx`, `_handlers/*.handler.tsx`, `_providers/*.provider.tsx`, `_suspenses/*.suspense.tsx`

## 작업: 파일 rename 매핑

> 이름 본체의 끝 `-action`/`-handler`/`-provider`를 제거하고 `.action`/`.handler`/`.provider`로 바꾼다.

### `_actions` → `.action.tsx`

| 현재 | 변경 |
|---|---|
| `src/app/(main)/_actions/view-toggle-action.tsx` | `view-toggle.action.tsx` |
| `src/app/(main)/posts/_actions/category-filter-action.tsx` | `category-filter.action.tsx` |
| `src/app/(main)/posts/_actions/infinite-post-list-action.tsx` | `infinite-post-list.action.tsx` |
| `src/app/(main)/posts/_actions/search-action.tsx` | `search.action.tsx` |
| `src/app/(main)/posts/_actions/tag-filter-action.tsx` | `tag-filter.action.tsx` |
| `src/app/(main)/posts/[slug]/_actions/delete-comment-dialog-action.tsx` | `delete-comment-dialog.action.tsx` |
| `src/app/admin/posts/new/_actions/category-selector-action.tsx` | `category-selector.action.tsx` |
| `src/app/admin/posts/new/_actions/draft-action.tsx` | `draft.action.tsx` |
| `src/app/admin/posts/new/_actions/editor-toolbar-action.tsx` | `editor-toolbar.action.tsx` |
| `src/app/admin/posts/new/_actions/markdown-editor-action.tsx` | `markdown-editor.action.tsx` |
| `src/app/admin/posts/new/_actions/publish-action.tsx` | `publish.action.tsx` |
| `src/app/admin/posts/new/_actions/save-status-action.tsx` | `save-status.action.tsx` |
| `src/app/admin/posts/new/_actions/tag-selector-action.tsx` | `tag-selector.action.tsx` |
| `src/app/admin/posts/new/_actions/thumbnail-upload-action.tsx` | `thumbnail-upload.action.tsx` |
| `src/app/admin/posts/new/_actions/title-input-action.tsx` | `title-input.action.tsx` |
| `src/app/admin/posts/new/_actions/wysiwyg-editor-action.tsx` | `wysiwyg-editor.action.tsx` |
| `src/app/admin/tags/_actions/delete-tag-action.tsx` | `delete-tag.action.tsx` |

> `src/app/admin/categories/_components/_actions/*` 2개 파일은 **플랜 2(D축)** 에서 이동과 함께 처리한다. 여기서 건드리지 않는다.

### `_handlers` → `.handler.tsx`

| 현재 | 변경 |
|---|---|
| `src/app/(main)/_handlers/post-list-view-handler.tsx` | `post-list-view.handler.tsx` |
| `src/app/(main)/_handlers/post-list-view-handler.test.tsx` | `post-list-view.handler.test.tsx` |
| `src/app/admin/posts/[id]/edit/_handlers/post-init-handler.tsx` | `post-init.handler.tsx` |
| `src/app/admin/posts/new/_handlers/editor-view-handler.tsx` | `editor-view.handler.tsx` |
| `src/app/admin/posts/new/_handlers/sidebar-collapse-handler.tsx` | `sidebar-collapse.handler.tsx` |

### `_providers` → `.provider.tsx`

| 현재 | 변경 |
|---|---|
| `src/app/admin/posts/new/_providers/auto-save-provider.tsx` | `auto-save.provider.tsx` |
| `src/app/admin/posts/new/_providers/editor-provider.tsx` | `editor.provider.tsx` |

## 절차

1. `git mv`로 각 파일 rename (테스트 파일 포함).
2. import 경로 갱신: `from '...-action'` → `from '...action'` 등. 전체 약 41줄.
   - 점검: `grep -rE "from ['\"].*-(action|handler|provider)['\"]" src` 결과가 0이 될 때까지 (D축 잔여 2개 제외).
3. 컴포넌트 식별자명(default export 함수명, 예 `ViewToggleAction`)은 **변경하지 않는다** — 파일명·역할 표기만 바꾼다.

## 검증

- `npm run build` 통과
- `npm run lint` 통과
- `npm run test:run` — 이동된 테스트(`post-list-view.handler.test.tsx`)가 정상 수집·통과
