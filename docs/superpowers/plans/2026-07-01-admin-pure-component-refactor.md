# admin(posts/new 제외) — 순수 컴포넌트/구조 정리

> 브랜치: `refactor/admin-pure-component` (from `develop`)
> 성격: 폴더 재배치(`_components` → `_actions`) + dot-suffix 네이밍 + 사적 폴더 평탄화. 렌더링/동작 변화 없음.
> 범위: `src/app/admin` 전체에서 `admin/posts/new`(별도 plan)를 제외한 나머지.
> 근거: `.claude/rules/page-folder.md`(`_components` 순수성, 사적 폴더 네이밍), `coding-conventions.md`(CRUD 동사)

## 위반 목록 — `_components` 순수성 위반 (→ `_actions`로 이동)

- [x] `admin/_components/admin-header.tsx` — `usePathname()`으로 현재 경로 직접 읽어 `isEditing` 분기. → `_actions/admin-header.action.tsx` (commit f74e4d6)
- [x] `admin/_components/admin-sidebar.tsx` — `usePathname()`으로 `isActive` 계산. → `_actions/admin-sidebar.action.tsx` (commit f74e4d6)
- [x] `admin/categories/_components/_category-form/index.tsx`(`CategoryFormDialog`) — `useState`/`useEffect`/`useForm` + `addCategory`/`editCategory` Server Action 호출. 사적 폴더명(`_category-form`)도 표준 아님. → `_actions/category-form-dialog.action.tsx`로 평탄화 이동 (commit 436e919)
- [x] `admin/categories/_components/_delete-category/index.tsx`(`DeleteCategoryDialog`) — `useState` + `removeCategory` 호출. 사적 폴더명(`_delete-category`) 표준 아님. → `_actions/delete-category-dialog.action.tsx` (commit 436e919)
- [x] `admin/categories/_components/category-table.tsx` — `useState(formOpen)`. → `_actions/category-table.action.tsx` (commit 436e919)
- [x] `admin/comments/_components/_delete-comment/index.tsx`(`DeleteCommentDialog`) — `useState` + `removeComment` 호출. 사적 폴더명(`_delete-comment`) 표준 아님. → `_actions/delete-comment-dialog.action.tsx` (commit 742974a)
- [x] `admin/comments/_components/comment-table.tsx` — `useState(deletingId)`. → `_actions/comment-table.action.tsx` (commit 742974a)
- [x] `admin/posts/_components/delete-post-dialog.tsx` — `useTransition` + `removePost` 호출. → `_actions/delete-post-dialog.action.tsx` (commit 6ead21b)
- [x] `admin/posts/_components/post-actions-cell.tsx` — `useState(isDeleteOpen)`. → `_actions/post-actions-cell.action.tsx` (commit 6ead21b)
- [x] `admin/settings/_components/settings-form.tsx` — `useForm`/`useTransition` + `editSettings` 호출. → `_actions/settings-form.action.tsx` (`settings-form.test.tsx`도 함께 이동) (commit 15844cd)
- [x] `admin/statistics/referrers/_components/referrer-period-filter.tsx` — `useRouter().push` 사이드이펙트. → `_actions/referrer-period-filter.action.tsx` (commit 9f07636)
- [x] `admin/tags/_delete-tag/index.tsx`(`DeleteTagDialog`) — `useState` + `removeTag` 호출. `tags/_actions/delete-tag.action.tsx`(`DeleteTagAction`, 트리거 버튼)가 이 파일을 `../_delete-tag`에서 import하는 구조. 사적 폴더명(`_delete-tag`) 표준 아님. → **결정**: `_actions/delete-tag-dialog.action.tsx`로 평탄화 이동(같은 배치의 categories/comments와 동일 패턴 채택, `_actions/_delete-tag/` 서브폴더 대안은 미채택) (commit dc30b99)

## 위반 목록 — 구조/레이어 문제

- [x] `admin/comments/_components/_delete-comment/_services/remove-comment.ts` — `_services`가 `_components/_delete-comment` 내부에 중첩됨. 다른 라우트(categories/posts/tags)는 전부 라우트 루트의 형제 `_services` 폴더 형태. → `admin/comments/_services/remove-comment.ts`로 최상위 이동 (위 `DeleteCommentDialog` 이동과 함께 처리) (commit 742974a)
- [x] `admin/settings/_services/edit-settings.ts` — Server Action(`editSettings`)이 `db.insert(...).onConflictDoUpdate(...)`를 직접 호출. 같은 배치의 다른 서비스(add/edit/remove-category, remove-tag, remove-post)는 전부 `db/queries/*`의 insert/update/delete 함수에 위임하는데 이 파일만 레이어를 건너뜀. → `src/db/queries/settings.ts`에 `updateBlogSettings`(또는 upsert 계열) 함수를 만들어 위임 (commit 15844cd)

## 참고 — 별도 검토 필요(이번 plan 범위 밖일 수 있음)

- `admin/posts/[id]/edit/page.tsx`가 `../../new/_actions/*`, `../../new/_providers/*`, `../../new/_handlers/*`, `../../new/_components/bottom-bar`, `../../new/_store`를 라우트 경계 넘어 그대로 import. `page-folder.md`는 `_` 사적 폴더를 "해당 페이지에서만 사용"으로 정의하는데 이는 그 계약과 어긋남. `admin/posts/new` plan과 함께 교차 검토 후, 공유가 필요하면 두 라우트의 공통 상위(`admin/posts/_actions` 등)로 끌어올리는 리팩터링 검토.

## 절차

1. `_category-form`, `_delete-category`, `_delete-comment`, `_delete-tag` 같은 사적 폴더는 이동 후 빈 폴더 제거.
2. 각 파일 `git mv` → 컴포넌트명에 `Action` 접미사 부여(기존 `_actions` 관례와 통일) → import 경로 갱신.
3. `remove-comment.ts` 이동 시 호출부(`DeleteCommentDialog` 이동본) import 경로 갱신.
4. `edit-settings.ts`는 `db/queries/settings.ts`에 함수 추가 후 위임하도록 리팩터링.

## 검증

- [x] `npm run lint`
- [x] `npm run test:run` (`settings-form.action.test.tsx`로 이동 후에도 14개 테스트 정상 수집·통과 확인)
- [x] `npm run build`
- [ ] 브라우저 회귀 확인: 관리자 사이드바/헤더 활성 상태, 카테고리·댓글·태그 삭제 다이얼로그, 설정 폼 저장, 통계 기간 필터 (A·B·C 3개 plan 전체 코드 작업 완료 후 한 번에 확인 예정)
