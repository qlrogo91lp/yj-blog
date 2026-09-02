# 플랜 4 (C축) — DB 쿼리 동사 정리

> 브랜치: `feature/rules-conventions` (from `develop`) — 플랜 1·2·3·4 공통 브랜치
> 성격: `src/db/queries/*` 함수 리네임 + 참조 갱신. 동작 변화 없음.
> 가장 광범위(참조 21+파일)하므로 마지막에 진행.

## 규칙 근거

`.claude/rules/coding-conventions.md` (CRUD 동사 컨벤션):
- DB 쿼리(`src/db/queries`)는 **SQL 동사** `insert/select/update/delete`를 쓴다.

## 작업

### `get*` → `select*` (12개)

`src/db/queries/` 내 모든 `get`-prefix 읽기 함수.

| 현재 | 변경 |
|---|---|
| `getPosts` | `selectPosts` |
| `getPostBySlug` | `selectPostBySlug` |
| `getPostById` | `selectPostById` |
| `getCategoryBySlug` | `selectCategoryBySlug` |
| `getCommentsByPostId` | `selectCommentsByPostId` |
| `getCommentById` | `selectCommentById` |
| `getTagsByPostId` | `selectTagsByPostId` |
| `getTagsByPostIds` | `selectTagsByPostIds` |
| `getPopularPosts` | `selectPopularPosts` |
| `getStatsSummary` | `selectStatsSummary` |
| `getTopReferrers` | `selectTopReferrers` |
| `getReferrersByPost` | `selectReferrersByPost` |
| `getDailyStatsForRange` | `selectDailyStatsForRange` |
| `getPostDailyViews` | `selectPostDailyViews` |

> 위 목록은 `grep -rhoE "export (async )?function get[A-Za-z]+" src/db/queries` 로 최종 재확인 후 진행.

### `create*` → `insert*`

| 현재 | 변경 |
|---|---|
| `createCategory` | `insertCategory` |
| `createComment` | `insertComment` |

### 이미 규칙에 맞음 (유지)

- `deleteCategory`, `deletePostById`, `deleteTag` — 이미 `delete`
- `updateCategory` — 이미 `update`

### 유지 (예외)

- `softDeleteComment` — SQL은 update지만 soft-delete 관례 이름 유지.

## 주의: Server Action 함수명과의 혼동 금지

`get*`은 DB 레이어에만 적용한다. **`_services`의 함수(플랜 3에서 정리한 `add/get/edit/remove`)는 건드리지 않는다.** 치환 시 `src/db/queries/` 정의부와 그 호출부만 대상으로 한다.

## 절차

1. `src/db/queries/*.ts` 의 export 함수명 변경.
2. 참조부 갱신: Server Component(`page.tsx`)·`_services`·다른 쿼리 함수에서의 호출을 신 이름으로 치환.
   - 각 함수별 `grep -rl "\bgetPosts\b" src` 로 참조 파일 확인 후 치환.
3. import 문은 함수명만 바뀌고 경로(엔티티 파일명)는 그대로다.

## 검증

- `npm run build` 통과
- `npm run lint` 통과
- `npm run test:run` 통과
- `grep -rE "\bget[A-Z][A-Za-z]*\b" src/db/queries` 결과 0 (유지 예외 없음)
