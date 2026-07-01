# 코딩 컨벤션

## 함수 & 변수

- 함수·변수명은 camelCase
- 불리언 변수는 `is` / `has` 접두사 (예: `isPublished`, `hasError`)
- 상수(환경 변수 제외)는 camelCase로 작성한다

## CRUD 동사 컨벤션 (레이어 분리)

Server Action(`_services`)과 DB 쿼리(`src/db/queries`)는 **서로 다른 동사 세트**를 사용한다. 같은 파일에서 두 레이어를 함께 import해도 이름이 겹치지 않고, 동사만 봐도 어느 레이어인지 즉시 구분된다.

| 작업 | **Server Action** (일반 동사) | **DB 쿼리** (SQL 동사) |
|------|:---:|:---:|
| Create | `add` | `insert` |
| Read | `get` | `select` |
| Update | `edit` | `update` |
| Delete | `remove` | `delete` |

- **Server Action** = 행위/유스케이스 관점 → `addComment`, `getPost`, `editCategory`, `removeComment`
- **DB 쿼리** = SQL 그대로 → `insertComment`, `selectPost`, `updateCategory`, `deleteComment`

```ts
// _services/add-comment.ts — Server Action 레이어
import { insertComment } from '@/db/queries/comments'; // DB 레이어 (SQL 동사)

export async function addComment(/* ... */) {
  // ...검증·가공...
  await insertComment(/* ... */);
}
```

> 클라이언트 fetch 계층(`_queries`)은 읽기 위주라 `get-*` prefix를 그대로 사용한다.

## 날짜 처리

- 날짜 포맷·연산은 **date-fns**를 사용한다 (`toLocaleDateString`, `toLocaleString` 등 네이티브 날짜 메서드 사용 금지)
- 한국어 로케일이 필요하면 `import { ko } from "date-fns/locale"` 후 옵션에 전달한다
- 예: `format(new Date(date), "yyyy년 M월 d일", { locale: ko })`

## Import

- React의 hook, 타입 등은 named import로 사용한다 (`import { useState, useEffect } from "react"`). `React.useState` 형태 사용 금지.
- `import * as React from 'react'` 네임스페이스 import 사용 금지.

## Zustand Store

- 파일명은 `_store.ts` 형식으로 작성한다
- 위치는 해당 라우트의 루트 폴더에 배치한다
- 예: `src/app/admin/posts/new/_store.ts`, `src/app/admin/posts/_store.ts`

## 기타

- 타입 단언(`as`)은 가능하면 피하고, Zod 파싱 결과를 활용한다
- `console.log`는 커밋하지 않는다
- 적절한 semantic tag는 적극적으로 활용한다

## Lucid-Icon

- 사이즈는 `className`이 아닌 `size` 속성으로 지정한다

  ```tsx
  // ❌ BAD
  <Search className="w-4 h-4" />

  // ✅ GOOD
  <Search size={16} />
  ```