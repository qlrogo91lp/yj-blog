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

## 컴포넌트 분류

### Action 컴포넌트 (`*Action.tsx`)

다음이 필요할 때 Action 컴포넌트로 분리:

- API 호출
- zustand 등 상태값 사용

위 로직이 필요한 경우 `*Action.tsx`로 만들고 모듈화한다.

```tsx
// ✅ GOOD - _action/_filter/select-instrctor-action.tsx
'use client';

import CustomSelect from '@/(afterLogin)/payment/_component/CustomSelect';
import { useSettlementStore } from '../../state';
import { useShallow } from 'zustand/react/shallow';
import { useInstructorList } from '@/(afterLogin)/group/@modal/_state/useInstructorList';

export default function SelectInstructorAction() {
  const { filter, setFilterInstructor } = useSettlementStore(
    useShallow(state => ({ filter: state.filter, setFilterInstructor: state.setFilterInstructor }))
  );
  const { localData } = useInstructorList();

  return (
      data={localData}
    <CustomSelect
      selectData={filter.instructor}
      onChangeAction={setFilterInstructor}
    />
  );
}
```

### 순수 컴포넌트

- API, zustand 등 외부 의존성 없음
- Props만 받아 렌더링
