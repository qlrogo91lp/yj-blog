# 플랜 2 (D축) — 폴더 배치 정리

> 브랜치: `feature/rules-folder-relocation` (from `develop`)
> 성격: 폴더 이동 + dot-suffix 적용. 동작 변화 없음.
> 선행: 플랜 1(A축)이 `develop`에 머지된 뒤 진행 권장(충돌 최소화).

## 규칙 근거

`.claude/rules/page-folder.md` — `_actions`는 라우트 폴더 직속의 역할 폴더다. `_components` 하위에 `_actions`를 중첩하는 구조는 규칙에서 벗어난다. 인터랙션 컴포넌트는 라우트의 `_actions`에 두고 dot-suffix로 표기한다.

## 대상

`src/app/admin/categories/_components/_actions/` 에 잘못 중첩된 인터랙션 컴포넌트 2개.

| 현재 | 이동 후 |
|---|---|
| `categories/_components/_actions/edit-category-action.tsx` | `categories/_actions/edit-category.action.tsx` |
| `categories/_components/_actions/delete-category-action.tsx` | `categories/_actions/delete-category.action.tsx` |

> 이동과 동시에 A축 규칙(dot-suffix)도 적용한다.

## 호출부

- `src/app/admin/categories/_components/category-actions-cell.tsx` 가 두 컴포넌트를 import한다. import 경로를 새 위치(`../_actions/...action`)로 갱신한다.

## 절차

1. `categories/_actions/` 폴더 생성.
2. `git mv` 로 2개 파일 이동 + dot-suffix 리네임.
3. 빈 `categories/_components/_actions/` 폴더 제거.
4. `category-actions-cell.tsx` 의 import 경로 갱신.
5. 컴포넌트 식별자명은 변경하지 않는다.

## 검증

- `npm run build` 통과
- `npm run lint` 통과
- `grep -r "_components/_actions" src` 결과 0 확인
