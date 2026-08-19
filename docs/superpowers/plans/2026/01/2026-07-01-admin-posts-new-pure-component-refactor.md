# admin/posts/new(에디터) — 순수 컴포넌트/레이어 정리

> 브랜치: `refactor/admin-posts-new-pure-component` (from `develop`)
> 성격: 폴더 재배치(`_components` → `_actions`) + `_services`/`_hooks` 레이어 재분류. 렌더링/동작 변화 없음.
> 범위: `src/app/admin/posts/new` 전체.
> 근거: `.claude/rules/page-folder.md`(`_components` 순수성, `_services`는 `'use server'` 전용, `_hooks`는 API 무관), `coding-conventions.md`(CRUD 동사)

## 위반 목록 — `_components` 순수성 위반 (→ `_actions`로 이동)

- [x] `_components/preview-button.tsx` — `useState(isOpen)`. → `_actions/preview-button.action.tsx` (commit 4c8945f)
- [x] `_components/table-insert-popover.tsx` — `useState` × 3(`hoverRow`/`hoverCol`/`isOpen`). → `_actions/table-insert.action.tsx` (commit 55ff9a9)
- [x] `_components/_image-upload/index.tsx`(`ImageUploadDialog`) — `useState`(`url`/`isUploading`) + `useNewPostStore` 구독 + `uploadImage(...)` Server Action 호출 (3중 위반, 가장 심각). → `_actions/_image-upload/image-upload.action.tsx` (파일명도 `index.tsx`에서 역할이 드러나는 이름으로 변경) (commit 5a67dd7)
- [x] `_components/_image-uploading/image-uploading-node-view.tsx` — `useEffect`(object URL revoke). → `_actions/_image-uploading/image-uploading-node-view.action.tsx` (commit 5cc5920)
- [x] `_components/_link/index.tsx`(`LinkDialog`) — `useState(url)`. → `_actions/_link/link.action.tsx` (commit 236044d)
- [x] `_components/_preview/index.tsx`(`PreviewDialog`) — `useNewPostStore` 직접 구독. → `_actions/_preview/preview.action.tsx` (commit b33d373)
- [x] `_components/_youtube/index.tsx`(`YoutubeEmbedDialog`) — `useState(url)`. → `_actions/_youtube/youtube.action.tsx` (commit fc64006)

> 위 4개 `index.tsx` 파일은 이동 시 `image-upload.action.tsx`/`link.action.tsx`/`preview.action.tsx`/`youtube.action.tsx`처럼 본체명이 드러나는 파일명으로 함께 개명.

## 위반 목록 — 레이어 재분류

- [x] `_hooks/useEditorImageUpload.ts` — `_hooks`(API 무관 순수 상태 로직)인데 `_services/upload-image`의 `uploadImage` Server Action을 직접 호출. → **결정**: 단일 소비처인 `_actions/wysiwyg-editor.action.tsx`에 인라인화, 훅 파일 제거 (commit 7154289)
- [x] `_services/submit-post.ts` — 최상단에 `'use server'` 없음. 대신 `useNewPostStore.getState()`로 zustand 클라이언트 스토어를 직접 조작(`store.setSaveStatus('saving')` 등). 실제 Server Action이 아님. → **결정(2026-07-01, 사용자 확인)**: `_store.ts` 내부의 zustand store action(`submitPost`)으로 통합, `_services/submit-post.ts` 제거 (commit 4d5d246, lint fix 32e1e9e). 구현 중 `_store.ts`가 `'use server'` 파일(`save-post.ts`)을 정적 import하면 테스트 환경(Vitest)에서 `_store.ts`를 참조하는 모든 테스트가 DB 클라이언트 모듈 스코프 초기화(`neon(process.env.DATABASE_URL!)`)로 깨지는 문제 발견 → dynamic import(`await import('./_services/save-post')`)로 우회, 사유를 코드 주석으로 남김. **후속 참고**: 이 결합(순수 클라이언트 상태 store가 서버 전용 모듈을 참조)은 근본적으로는 `submitPost`를 store 밖 클라이언트 오케스트레이션 함수로 유지하는 편이 더 깔끔했을 수 있다는 리뷰 의견이 있었음 — 향후 재검토 여지.

## 참고 — 재검토가 필요하나 기존 결정과 상충 가능

- `_services/save-post.ts`(`savePost`), `_services/upload-image.ts`(`uploadImage`) — 함수명이 add/get/edit/remove 체계 밖(`save`, `upload`). **단, 2026-06-30 `2026-06-30-claude-rules-plan-3-server-action-verbs.md`에서 이미 "post upsert+태그 교체(다단계)", "R2 스토리지 작업(비CRUD)"라는 이유로 명시적으로 유지 결정**하고 실제로 실행됨. 이번 조사에서 다시 위반으로 잡혔지만 과거 결정을 뒤집는 것이므로, 재검토가 필요하면 사용자 확인 후 진행. 기본값은 "유지".
- `_services/generate-excerpt.ts`(`generateExcerpt`) — 마찬가지로 CRUD 동사 밖이지만 AI 호출이라는 비-CRUD 성격이 뚜렷함. plan-3에도 없던 신규 파일로 보임 — 유지할지 별도 동사 체계를 정할지 결정 필요.

## 참고 — 다른 라우트와의 경계 문제 (admin plan과 교차 검토)

- `admin/posts/[id]/edit/page.tsx`가 이 라우트의 `_actions`/`_providers`/`_handlers`/`_components/bottom-bar`/`_store`를 라우트 경계 넘어 import 중. `2026-07-01-admin-pure-component-refactor.md`에서도 동일 항목을 언급함 — 두 plan을 함께 볼 때 처리.

## 절차

1. `_image-block`류 하위 사적 폴더(`_image-upload`, `_image-uploading`, `_link`, `_preview`, `_youtube`)는 `_actions` 하위에 동일 구조로 이동(`page-folder.md`가 `_actions` 하위 폴더 생성을 허용).
2. `git mv` → 컴포넌트명에 `Action` 접미사 부여 → 파일명 개명(`index.tsx` 제거) → import 경로 갱신.
3. `useEditorImageUpload.ts`, `submit-post.ts`는 재분류 방향을 먼저 확정한 뒤 이동.
4. `save-post.ts`/`upload-image.ts`/`generate-excerpt.ts`는 기본적으로 손대지 않음(위 참고 항목 참조).

## 검증

- [x] `npm run lint`
- [x] `npm run test:run` (`character-counter.test.tsx`, `image-toolbar.test.tsx`, `image-uploading-node-view.action.test.tsx`, `seo-section.action.test.tsx`, `generate-excerpt.test.ts` 등 이동 후 108/108 전체 통과 확인)
- [x] `npm run build`
- [ ] 브라우저 회귀 확인: 글쓰기 에디터에서 이미지 업로드/삽입, 링크 삽입, 유튜브 임베드, 표 삽입, 미리보기, 임시저장/발행 (A·B·C 3개 plan 전체 코드 작업 완료 후 한 번에 확인 예정)
