# 플랜 3 (B축) — Server Action 동사·접미사 정리

> 브랜치: `feature/rules-conventions` (from `develop`) — 플랜 1·2·3·4 공통 브랜치
> 성격: `_services` 파일·함수 리네임 + 호출부 갱신. 동작 변화 없음.

## 규칙 근거

`.claude/rules/coding-conventions.md` (CRUD 동사 컨벤션) + `page-folder.md`:
- Server Action(`_services`)은 **일반 동사** `add/get/edit/remove`를 쓴다.
- `-Action` 접미사를 붙이지 않는다 (파일명·함수명 모두 동사+명사).

## 작업: 순수 CRUD Server Action 리네임

| 파일 (현재) | 함수 (현재) | 파일 (변경) | 함수 (변경) |
|---|---|---|---|
| `(main)/posts/[slug]/_services/create-comment.ts` | `createCommentAction` | `add-comment.ts` | `addComment` |
| `(main)/posts/[slug]/_services/delete-comment.ts` | `deleteCommentAction` | `remove-comment.ts` | `removeComment` |
| `admin/comments/_components/_delete-comment/_services/delete-comment.ts` | `adminDeleteCommentAction` | `remove-comment.ts` | `removeComment` |
| `admin/categories/_services/create-category.ts` | `createCategoryAction` | `add-category.ts` | `addCategory` |
| `admin/categories/_services/delete-category.ts` | `deleteCategoryAction` | `remove-category.ts` | `removeCategory` |
| `admin/categories/_services/update-category.ts` | `updateCategoryAction` | `edit-category.ts` | `editCategory` |
| `admin/posts/_services/delete-post.ts` | `deletePost` | `remove-post.ts` | `removePost` |
| `admin/posts/new/_services/delete-image.ts` | `deleteImage` | `remove-image.ts` | `removeImage` |
| `admin/posts/new/_services/manage-tags.ts` | `createTag` | `add-tag.ts` | `addTag` |
| `admin/settings/_services/update-settings.ts` | `updateSettings` | `edit-settings.ts` | `editSettings` |
| `admin/tags/_services/delete-tag.ts` | `deleteTag` | `remove-tag.ts` | `removeTag` |

### 유지 (의도 동사 — 다단계/비CRUD)

| 파일 | 함수 | 사유 |
|---|---|---|
| `admin/posts/new/_services/save-post.ts` | `savePost` | post upsert + 태그 교체 (다단계) |
| `admin/posts/new/_services/submit-post.ts` | `submitPost` | savePost 래핑 |
| `admin/posts/new/_services/upload-image.ts` | `uploadImage` | R2 스토리지 작업 (비CRUD) |

> 결정 포인트: `createTag → addTag`. find-or-create 다단계 함수지만 "태그를 추가한다"는 Create 유스케이스로 보고 `addTag`로 정리한다. 유지가 더 낫다고 판단되면 리뷰에서 제외 가능.

## 호출부

각 함수는 클라이언트 컴포넌트(주로 `_actions/*.action.tsx`)에서 import해 호출한다. 총 13파일.
- 절차: 함수명 변경 후 `grep -r "createCommentAction" src` 식으로 각 구 함수명을 찾아 신 함수명으로 치환. import 경로(파일명 변경분)도 함께 갱신.
- 중복 주의: `removeComment`가 public/admin 두 모듈에 생기지만 서로 다른 파일 경로라 충돌 없음. 각 호출부가 올바른 경로를 import하는지 확인.

## 절차

1. `git mv` 로 파일 rename.
2. 각 파일 내 `export async function` 이름 변경.
3. 호출부 import 경로 + 호출 식별자 일괄 갱신.
4. `grep -rE "(create|update|delete)[A-Za-z]*Action\b" src` 결과 0 확인 (의도 동사 유지분 제외).

## 검증

- `npm run build` 통과
- `npm run lint` 통과
- `npm run test:run` 통과
