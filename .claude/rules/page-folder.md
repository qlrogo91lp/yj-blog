# 페이지별 폴더 역할

## 폴더 생성 규칙

- `_` 접두사를 붙여 해당 페이지에서만 사용하는 **private 폴더**로 구분

## 파일 확장자 규칙

| 확장자 | 허용 폴더 |
|--------|-----------|
| `*.tsx` | `_areas`, `_components`, `_actions`, `_handlers`, `_providers`, `_suspenses` |
| `*.ts` | `_queries`, `_services`, `_hooks`, `_utils` |

> **핵심**: 컴포넌트가 아닌 로직(`.ts`)은 `_queries`·`_services`·`_hooks`·`_utils`에 둔다. `_areas`·`_actions`·`_handlers`·`_providers`·`_suspenses`에는 컴포넌트 파일(`.tsx`)만 존재한다.

## 네이밍 규칙

역할 컴포넌트는 **dot-suffix**(`<이름>.<역할>.tsx`)로 역할을 표기한다. 이 프로젝트가 이미 쓰는 `*.test.tsx`와 동일한 방식이며, 이름 본체와 역할이 시각적으로 분리되어 구분이 명확하다.

| 폴더 | 파일명 형식 | 예시 |
|------|-------------|------|
| `_areas` | `*.area.tsx` | `hero.area.tsx`, `footer.area.tsx` |
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
| `_areas` | 페이지의 **세로 영역** 하나. 여러 조각을 묶어 화면 한 구간을 완성하는 조립 단위 | 조각들 |
| `_components` | 순수 컴포넌트. props만 받아 렌더링 | 없음 |
| `_actions` | 클라이언트 인터랙션 컴포넌트. form 전송·zustand 상태·input/button 액션 등 클라이언트 로직이 필요한 컴포넌트. 최대한 모듈화 | 상태/Server Action |
| `_handlers` | 렌더링 결과 없이 사이드이펙트·조건부 렌더링만 담당하는 클라이언트 컴포넌트 | 상태 |
| `_providers` | Provider 컴포넌트. `children` 없이 `null`을 반환하는 사이드이펙트 전용 컴포넌트 포함 | 상태 |
| `_suspenses` | Prefetch용 Suspense 컴포넌트 | - |
| `_services` | **Server Action 전용** (`'use server'`). 서버 mutation/작업과 그에 딸린 비즈니스 로직(검증·해싱·DB 호출·revalidate) | 서버(DB) |
| `_queries` | 클라이언트 **서버 데이터 읽기**. 통신 계층(`fetch` + 모델/타입) + 소비·가공 계층(tanstack-query `useQuery`). 도입 시 사용 | API |
| `_hooks` | **순수 상태/UI 로직** + props로 받은 데이터의 동기 `useMemo` 가공. API에 의존하지 않음 | 없음 |
| `_utils` | 해당 페이지 전용 순수 함수 | 없음 |

### `_areas` — 페이지 세로 영역

`page.tsx`가 직접 조립하는 **세로 구간 하나**에 1:1 대응한다. 랜딩·소개 페이지처럼 세로로 길고 구간이 명확히 나뉘는 페이지에서, 조각을 늘어놓는 대신 구간 단위로 묶어 추적을 쉽게 만든다.

- 여러 조각(`_components`·`_actions`)을 묶어 화면 한 구간을 완성하는 **조립 단위**다. 다른 페이지에서 재사용하지 않는다.
- 서버·클라이언트 어느 쪽이든 될 수 있다. `'use client'` 필요 여부는 영역 내부 사정이며 분류 기준이 아니다.
- **조각 하나로 끝나면 area가 아니다.** 단일 위젯은 `_components`·`_actions`에 두고 `page.tsx`가 직접 렌더한다.
- 화면 전체를 덮는 **오버레이**(고정 내비, 모달, 하단 CTA 바)는 세로 구간이 아니므로 area가 아니다.
- 구간이 2~3개뿐인 평범한 페이지에는 만들지 않는다. 조각을 `page.tsx`에서 바로 조립하는 편이 낫다.

```
_areas/
  hero.area.tsx        # 여러 조각을 묶음 → area
  workout.area.tsx
  footer.area.tsx
_components/
  marquee.tsx          # 단일 위젯 → area 아님. page.tsx가 직접 렌더
_actions/
  section-nav.action.tsx   # 고정 오버레이 → area 아님
```

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

`page.tsx`는 서버 컴포넌트로 유지하고, 중간 `*PageAction` 래퍼 컴포넌트를 만들지 않는다. 대신 `page.tsx`에서 직접 Provider·Handler·Action 컴포넌트를 조합한다. 세로로 긴 페이지라면 `_areas`의 Area 컴포넌트를 순서대로 나열한다 — 이때 `page.tsx`를 읽는 것만으로 페이지의 세로 구성이 드러나야 한다.

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
