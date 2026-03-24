# 페이지별 폴더 역할

## 폴더 생성 규칙

- `_` 접두사를 붙여 해당 페이지에서만 사용하는 **private 폴더**로 구분

## 파일 확장자 규칙

| 확장자 | 허용 폴더 |
|--------|-----------|
| `*.tsx` | `_actions`, `_components`, `_providers`, `_handlers`, `_suspenses` |
| `*.ts` | `_queries`, `_services`, `_utils`, `_hooks` |

> **핵심**: `_actions`에는 컴포넌트 파일(`.tsx`)만 존재한다. 비즈니스 로직·쿼리 등 `.ts` 파일은 `_queries`, `_services`, `_utils`, `_hooks`에 위치한다.
> **Next.js Server Action** (`'use server'` 지시어가 있는 `.ts` 파일)은 `_services`에 위치한다. 네이밍은 동사+명사 형식으로 작성하며 `-action` 접미사를 붙이지 않는다 (예: `create-comment.ts`, `delete-comment.ts`).

## 폴더별 역할

| 폴더 | 역할 | 네이밍 예시 |
|------|------|-------------|
| `_actions` | Action 컴포넌트. 유형별 하위 폴더 가능 (`_table`, `_filter` 등) | `*Action.tsx` |
| `_components` | 순수 컴포넌트 (API, zustand 등 외부 의존성 없음) | - |
| `_queries` | API 요청. tanstack-query가 필요할 경우`api/.../routes.ts`로 요청 전송 | `getPaymentList.ts`, `postPayments.ts` (HTTP 메소드 + camelCase) |
| `_services` | 비즈니스 로직. 서버 데이터 가공. Next.js Server Action (`'use server'`) 포함 | `usePaymentList.ts`, `create-comment.ts`, `delete-comment.ts` |
| `_providers` | Provider 컴포넌트 모음. 무언가를 제공하는 컴포넌트로, `children` 없이 `null`을 반환하는 사이드이펙트 전용 컴포넌트도 포함 | `ResetProvider.tsx`, `LoadProvider.tsx`, `AutoSaveProvider.tsx` |
| `_handlers` | Handler 컴포넌트 모음 | `ViewHandler.tsx` |
| `_suspenses` | Prefetch용 Suspense 컴포넌트 | `*Suspense.tsx` |
| `_utils` | 해당 페이지 전용 순수 함수 | - |
| `_hooks` | 해당 페이지 전용 React hook | - |

## _action 하위 분류

비슷한 유형으로 분류 가능하면 하위 폴더 생성:

- `_action/_table`: 테이블 관련 action
- `_action/_filter`: 필터 관련 action

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

## _handlers 활용 패턴

렌더링 결과물 없이 **사이드이펙트·조건부 렌더링** 역할만 하는 클라이언트 로직은 Handler로 분리한다.

| 패턴 | 예시 |
|------|------|
| 상태에 따른 조건부 렌더링 | `EditorViewHandler` — mode에 따라 에디터 컴포넌트 전환 |
| `useEffect` 초기화/정리 | `PostInitHandler` — 글 데이터 로드 및 cleanup 시 reset |
| 사이드바·UI 상태 제어 | `SidebarCollapseHandler` — 진입 시 사이드바 닫기 |
