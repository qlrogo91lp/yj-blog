# 페이지별 폴더 역할

## 폴더 생성 규칙

- `_` 접두사를 붙여 해당 페이지에서만 사용하는 **private 폴더**로 구분

## 폴더별 역할

| 폴더 | 역할 | 네이밍 예시 |
|------|------|-------------|
| `_action` | Action 컴포넌트. 유형별 하위 폴더 가능 (`_table`, `_filter` 등) | `*Action.tsx` |
| `_component` | 순수 컴포넌트 (API, zustand 등 외부 의존성 없음) | - |
| `_lib` | API 요청. `api/.../routes.ts`로 요청 전송 | `getPaymentList.ts`, `postPayments.ts` (HTTP 메소드 + camelCase) |
| `_state` | 비즈니스 로직. tanstack-query로 _lib 데이터 가공 | `usePaymentList.ts`, `useUpdatePayments.ts` |
| `_provider` | Provider 컴포넌트 모음 | `ResetProvider.tsx`, `LoadProvider.tsx` |
| `_handler` | Handler 컴포넌트 모음 | `ViewHandler.tsx` |
| `_suspense` | Prefetch용 Suspense 컴포넌트 | `*Suspense.tsx` |
| `_util` | 해당 페이지 전용 순수 함수 | - |
| `_hook` | 해당 페이지 전용 React hook | - |

## _action 하위 분류

비슷한 유형으로 분류 가능하면 하위 폴더 생성:

- `_action/_table`: 테이블 관련 action
- `_action/_filter`: 필터 관련 action
