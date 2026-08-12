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

## Tailwind CSS v4 문법

이 프로젝트는 Tailwind v4(최신 메이저)를 사용한다. v3 시절의 구문법은 **빌드·린트 어느 단계에서도 경고 없이 조용히 컴파일되므로**, 실수로 섞어 써도 아무도 알려주지 않는다. 신규 작성·수정 시 아래 v4 문법을 사용한다.

| 용도 | ❌ 구문법 (v3, 경고 없이 통과됨) | ✅ v4 문법 |
|------|------|------|
| CSS 변수 참조 | `max-w-[var(--content-width)]` | `max-w-(--content-width)` |
| 그라디언트 방향 | `bg-gradient-to-t` | `bg-linear-to-t` |
| 비율(고정 값) | `aspect-[980/362]` | `aspect-980/362` |

CSS 변수 shorthand(`(--x)`)는 순수 표기 차이지만, 그라디언트는 **실제 출력이 다르다** — `bg-gradient-to-t`는 `oklab` 색공간을 무조건 가정하는 반면 `bg-linear-to-t`는 `@supports`로 구형 브라우저 폴백을 포함한다. 직접 컴파일해 확인된 차이이므로 반드시 `bg-linear-*` 계열을 쓴다.

새 유틸리티를 쓸 때 v3 기억에 의존해 `[...]` 임의값부터 떠올렸다면, 먼저 [Tailwind v4 문서](https://tailwindcss.com/docs)에 네이티브 문법이 있는지 확인한다.

### 임의값(`[Npx]`) 대신 spacing 스케일 숫자 유틸리티

Tailwind v4는 `width`·`height`·`max-width`·`min-width`·`padding`·`margin`·`gap`·`inset`(`top`/`right`/`bottom`/`left`)·`translate`·`size` 등 **spacing 스케일 기반 속성**에서 `--spacing`(기본 `0.25rem` = `4px`) 배수를 바로 숫자로 받는다. 임의값 `px`가 4의 배수면 반드시 이 숫자 유틸리티로 쓴다.

```
max-w-[1180px]  →  max-w-295     (1180 ÷ 4 = 295)
top-[70px]      →  top-17.5      (70 ÷ 4 = 17.5, 소수도 유효)
gap-[14px]      →  gap-3.5       (14 ÷ 4 = 3.5)
```

4의 배수가 아니면(디자인 시안의 임의 px 값 등) 대체 수단이 없으므로 `[Npx]` 임의값을 그대로 쓴다. `font-size`(`text-*`)·`border-radius`(`rounded-*`)는 이름 기반 스케일이라 이 변환 대상이 아니다.

이 프로젝트는 `eslint-plugin-tailwindcss`를 쓰지 않아 CI에서 이 차이를 잡아내지 못한다 — VS Code의 Tailwind CSS IntelliSense 확장이 편집기에서만 "can be written as `max-w-295`" 힌트로 알려준다. 즉 **써보고 힌트가 뜨면 고치는 방식이 아니라, 처음부터 이 표로 판단해서 쓴다.**

## Lucid-Icon

- 사이즈는 `className`이 아닌 `size` 속성으로 지정한다

  ```tsx
  // ❌ BAD
  <Search className="w-4 h-4" />

  // ✅ GOOD
  <Search size={16} />
  ```