---
paths:
  - "**/*.tsx"
---

# 컴포넌트 생성 규칙

## 네이밍

- 파일명은 **kebab case** 사용
- 컴포넌트 function 명은 **PascalCase**
- 최대한 **모듈화**하는 방향으로 컴포넌트 생성

## Props 타입

컴포넌트 Prop 타입 정의 시 `type Props = {}` 형식으로 작성한다.

```tsx
// ✅ GOOD
type Props = {
  settlementData: Settlement[];
  columns: ColumnDef<Settlement>[];
};

export default function SettlementListTable({ settlementData, columns }: Props) {
  // ...
}
```

## 스타일

조건부 클래스명은 템플릿 리터럴 대신 `cn()` 함수로 처리한다.

```tsx
// ❌ BAD - 템플릿 리터럴로 조건부 처리
className={`rounded p-2 ${isActive ? 'bg-primary text-white' : ''}`}

// ✅ GOOD - cn()으로 깔끔하게 정리
className={cn('rounded p-2', isActive && 'bg-primary text-white')}
```

## 컴포넌트 분류

상태값(zustand)·Server Action 호출 등 **클라이언트 로직이 필요한 컴포넌트**와 **순수 컴포넌트**를 구분한다.

- **순수 컴포넌트** — API, zustand 등 외부 의존성 없이 props만 받아 렌더링. `_components`에 둔다.
- **인터랙션 컴포넌트** — 클라이언트 로직이 필요한 경우 역할에 맞는 폴더로 분리하고 dot-suffix로 표기한다 (`_actions/*.action.tsx`, `_handlers/*.handler.tsx`, `_providers/*.provider.tsx`).

> 폴더 분류·역할·네이밍의 상세 정의는 `page-folder.md`를 참조한다.
