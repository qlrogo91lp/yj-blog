# admin/posts/new(에디터) — 순수 컴포넌트/레이어 정리

> 브랜치: `refactor/admin-posts-new-pure-component` (from `develop`)
> 성격: 폴더 재배치(`_components` → `_actions`) + `_services`/`_hooks` 레이어 재분류. 렌더링/동작 변화 없음.
> 범위: `src/app/admin/posts/new` 전체.
> 근거: `.claude/rules/page-folder.md`(`_components` 순수성, `_services`는 `'use server'` 전용, `_hooks`는 API 무관), `coding-conventions.md`(CRUD 동사)

## 위반 목록 — `_components` 순수성 위반 (→ `_actions`로 이동)

- [ ] `_components/preview-button.tsx` — `useState(isOpen)`. → `_actions/preview-button.action.tsx`
- [ ] `_components/table-insert-popover.tsx` — `useState` × 3(`hoverRow`/`hoverCol`/`isOpen`). → `_actions/table-insert.action.tsx`
- [ ] `_components/_image-upload/index.tsx`(`ImageUploadDialog`) — `useState`(`url`/`isUploading`) + `useNewPostStore` 구독 + `uploadImage(...)` Server Action 호출 (3중 위반, 가장 심각). → `_actions/_image-upload/image-upload.action.tsx` (파일명도 `index.tsx`에서 역할이 드러나는 이름으로 변경)
- [ ] `_components/_image-uploading/image-uploading-node-view.tsx` — `useEffect`(object URL revoke). → `_actions/_image-uploading/image-uploading-node-view.action.tsx`
- [ ] `_components/_link/index.tsx`(`LinkDialog`) — `useState(url)`. → `_actions/_link/link.action.tsx`
- [ ] `_components/_preview/index.tsx`(`PreviewDialog`) — `useNewPostStore` 직접 구독. → `_actions/_preview/preview.action.tsx`
- [ ] `_components/_youtube/index.tsx`(`YoutubeEmbedDialog`) — `useState(url)`. → `_actions/_youtube/youtube.action.tsx`

> 위 4개 `index.tsx` 파일은 이동 시 `image-upload.action.tsx`/`link.action.tsx`/`preview.action.tsx`/`youtube.action.tsx`처럼 본체명이 드러나는 파일명으로 함께 개명.

## 위반 목록 — 레이어 재분류

- [ ] `_hooks/use-editor-image-upload.ts` — `_hooks`(API 무관 순수 상태 로직)인데 `_services/upload-image`의 `uploadImage` Server Action을 직접 호출. → 이 훅을 사용하는 `_actions/wysiwyg-editor.action.tsx` 쪽으로 오케스트레이션 로직을 옮기거나, `_hooks`가 아닌 별도 클라이언트 오케스트레이션 파일로 재분류할지 결정 필요.
- [ ] `_services/submit-post.ts` — 최상단에 `'use server'` 없음. 대신 `useNewPostStore.getState()`로 zustand 클라이언트 스토어를 직접 조작(`store.setSaveStatus('saving')` 등). 실제 Server Action이 아님. → `_services`에서 제외하고 클라이언트 오케스트레이션 레이어로 재배치(예: `_actions` 보조 유틸 또는 각 액션 컴포넌트에 인라인화).

## 참고 — 재검토가 필요하나 기존 결정과 상충 가능

- `_services/save-post.ts`(`savePost`), `_services/upload-image.ts`(`uploadImage`) — 함수명이 add/get/edit/remove 체계 밖(`save`, `upload`). **단, 2026-06-30 `2026-06-30-claude-rules-plan-3-server-action-verbs.md`에서 이미 "post upsert+태그 교체(다단계)", "R2 스토리지 작업(비CRUD)"라는 이유로 명시적으로 유지 결정**하고 실제로 실행됨. 이번 조사에서 다시 위반으로 잡혔지만 과거 결정을 뒤집는 것이므로, 재검토가 필요하면 사용자 확인 후 진행. 기본값은 "유지".
- `_services/generate-excerpt.ts`(`generateExcerpt`) — 마찬가지로 CRUD 동사 밖이지만 AI 호출이라는 비-CRUD 성격이 뚜렷함. plan-3에도 없던 신규 파일로 보임 — 유지할지 별도 동사 체계를 정할지 결정 필요.

## 참고 — 다른 라우트와의 경계 문제 (admin plan과 교차 검토)

- `admin/posts/[id]/edit/page.tsx`가 이 라우트의 `_actions`/`_providers`/`_handlers`/`_components/bottom-bar`/`_store`를 라우트 경계 넘어 import 중. `2026-07-01-admin-pure-component-refactor.md`에서도 동일 항목을 언급함 — 두 plan을 함께 볼 때 처리.

## 절차

1. `_image-block`류 하위 사적 폴더(`_image-upload`, `_image-uploading`, `_link`, `_preview`, `_youtube`)는 `_actions` 하위에 동일 구조로 이동(`page-folder.md`가 `_actions` 하위 폴더 생성을 허용).
2. `git mv` → 컴포넌트명에 `Action` 접미사 부여 → 파일명 개명(`index.tsx` 제거) → import 경로 갱신.
3. `use-editor-image-upload.ts`, `submit-post.ts`는 재분류 방향을 먼저 확정한 뒤 이동.
4. `save-post.ts`/`upload-image.ts`/`generate-excerpt.ts`는 기본적으로 손대지 않음(위 참고 항목 참조).

## 검증

- [ ] `npm run lint`
- [ ] `npm run test:run` (`character-counter.test.tsx`, `image-toolbar.test.tsx`, `image-uploading-node-view.test.tsx`, `seo-section.action.test.tsx`, `generate-excerpt.test.ts` 등 이동 영향 없는지 확인)
- [ ] `npm run build`
- [ ] 브라우저 회귀 확인: 글쓰기 에디터에서 이미지 업로드/삽입, 링크 삽입, 유튜브 임베드, 표 삽입, 미리보기, 임시저장/발행
