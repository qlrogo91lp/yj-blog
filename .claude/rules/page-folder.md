# 페이지별 폴더 역할

## 폴더 생성 규칙

- `_` 접두사를 붙여 해당 페이지에서만 사용하는 **private 폴더**로 구분

## 파일 확장자 규칙

| 확장자 | 허용 폴더 |
|--------|-----------|
| `*.tsx` | `_components`, `_actions`, `_handlers`, `_providers`, `_suspenses` |
| `*.ts` | `_queries`, `_services`, `_hooks`, `_utils` |

> **핵심**: 컴포넌트가 아닌 로직(`.ts`)은 `_queries`·`_services`·`_hooks`·`_utils`에 둔다. `_actions`·`_handlers`·`_providers`·`_suspenses`에는 컴포넌트 파일(`.tsx`)만 존재한다.

## 네이밍 규칙

역할 컴포넌트는 **dot-suffix**(`<이름>.<역할>.tsx`)로 역할을 표기한다. 이 프로젝트가 이미 쓰는 `*.test.tsx`와 동일한 방식이며, 이름 본체와 역할이 시각적으로 분리되어 구분이 명확하다.

| 폴더 | 파일명 형식 | 예시 |
|------|-------------|------|
| `_components` | kebab-case (본체명만) | `comment-form.tsx` |
| `_actions` | `*.action.tsx` | `view-toggle.action.tsx` |
| `_handlers` | `*.handler.tsx` | `editor-view.handler.tsx` |
| `_providers` | `*.provider.tsx` | `auto-save.provider.tsx` |
| `_suspenses` | `*.suspense.tsx` | `post-list.suspense.tsx` |
| `_services` | 동사+명사 kebab (접미사 없음) | `add-comment.ts` |
| `_queries` | `get-*.ts`(통신, kebab-case) / `use*.ts`(소비, camelCase) | `get-posts.ts`, `usePosts.ts` |
| `_hooks` | `use*.ts` (camelCase, 함수명과 동일) | `useToggle.ts` |
| `_utils` | kebab-case | `replace-uploading-node.ts` |

> 폴더명(분류)과 dot-suffix(역할)는 짝을 이룬다 — `_actions/*.action.tsx`, `_handlers/*.handler.tsx`처럼 위치와 표기가 일관된다.

## 폴더별 역할

| 폴더 | 역할 | 외부 의존 |
|------|------|-----------|
| `_components` | 순수 컴포넌트. props만 받아 렌더링 | 없음 |
| `_actions` | 클라이언트 인터랙션 컴포넌트. form 전송·zustand 상태·input/button 액션 등 클라이언트 로직이 필요한 컴포넌트. 최대한 모듈화 | 상태/Server Action |
| `_handlers` | 렌더링 결과 없이 사이드이펙트·조건부 렌더링만 담당하는 클라이언트 컴포넌트 | 상태 |
| `_providers` | Provider 컴포넌트. `children` 없이 `null`을 반환하는 사이드이펙트 전용 컴포넌트 포함 | 상태 |
| `_suspenses` | Prefetch용 Suspense 컴포넌트 | - |
| `_services` | **Server Action 전용** (`'use server'`). 서버 mutation/작업과 그에 딸린 비즈니스 로직(검증·해싱·DB 호출·revalidate) | 서버(DB) |
| `_queries` | 클라이언트 **서버 데이터 읽기**. 통신 계층(`fetch` + 모델/타입) + 소비·가공 계층(tanstack-query `useQuery`). 도입 시 사용 | API |
| `_hooks` | **순수 상태/UI 로직** + props로 받은 데이터의 동기 `useMemo` 가공. API에 의존하지 않음 | 없음 |
| `_utils` | 해당 페이지 전용 순수 함수 | 없음 |

### `_services` — Server Action

- `'use server'` 지시어가 있는 `.ts` 파일. 클라이언트 컴포넌트에서 import해 호출한다.
- 파일명·함수명은 **동사+명사** 형식이며 `-action` 접미사를 붙이지 않는다 (예: `add-comment.ts` → `addComment`).
- Server Action의 동사는 일반 동사(`add`/`get`/`edit`/`remove`)를 쓰고, DB 쿼리 동사(`insert`/`select`/`update`/`delete`)와 구분한다. → 상세는 `coding-conventions.md`의 **CRUD 동사 컨벤션** 참조.
- 초기 읽기는 Server Component가 `src/db/queries/`를 직접 호출한다. `_services`는 주로 쓰기(mutation)를 담당한다.

### `_queries` — 클라이언트 서버 데이터 읽기 (도입 시)

App Router에서 초기 읽기는 RSC, 쓰기는 Server Action이 담당하므로 현재는 사용하지 않는다. 무한 스크롤처럼 **클라이언트에서 추가로 데이터를 읽는** 경우가 늘어나면 도입한다.

- **통신 계층** (`get-*.ts`): `fetch()` 호출 함수 + 응답 모델/타입 정의. tanstack-query를 직접 쓰지 않는 순수 함수.
- **소비·가공 계층** (`use*.ts`, camelCase): 위 통신 함수를 `useQuery({ queryFn })`로 감싸고 `select`로 가공하는 hook. tanstack-query는 이 계층에서 사용한다.

### `_actions` 하위 분류

비슷한 유형으로 묶을 수 있으면 하위 폴더를 생성한다 (예: `_actions/_table`, `_actions/_filter`).

## page.tsx 구성 원칙

`page.tsx`는 서버 컴포넌트로 유지하고, 중간 `*PageAction` 래퍼 컴포넌트를 만들지 않는다. 대신 `page.tsx`에서 직접 Provider·Handler·Action 컴포넌트를 조합한다.

```tsx
// ✅ GOOD — page.tsx가 직접 구성
export default async function NewPostPage() {
  const categories = await getCategories();

  return (
    <EditorProvider>
      <EditorToolbarAction />
      <CategorySelectorAction categories={categories} />
      <EditorViewHandler />
      <AutoSaveProvider />
    </EditorProvider>
  );
}

// ❌ BAD — 불필요한 중간 레이어
export default async function NewPostPage() {
  const categories = await getCategories();
  return <NewPostPageAction categories={categories} />;
}
```

## `_handlers` 활용 패턴

렌더링 결과물 없이 **사이드이펙트·조건부 렌더링** 역할만 하는 클라이언트 로직은 Handler로 분리한다.

| 패턴 | 예시 |
|------|------|
| 상태에 따른 조건부 렌더링 | `EditorViewHandler` — mode에 따라 에디터 컴포넌트 전환 |
| `useEffect` 초기화/정리 | `PostInitHandler` — 글 데이터 로드 및 cleanup 시 reset |
| 사이드바·UI 상태 제어 | `SidebarCollapseHandler` — 진입 시 사이드바 닫기 |

> **예외**: `post-list-view.handler.tsx`는 현재 클라이언트 훅·사이드이펙트 없이 props만으로 렌더링하는 순수 컴포넌트 형태다. 향후 조건부 렌더링/사이드이펙트 확장이 예정되어 있어 `_handlers` 위치를 유지한다. 확장 계획이 사라지면 `_components`로 재이동을 검토한다.
