# 수정 계획: src/app/(main)/posts

> 작성일: 2026-03-20

## 현재 구조

```
src/app/(main)/posts/
├── page.tsx
├── _components/
│   └── category-filter.tsx        ← Client Component (useRouter, useSearchParams)
└── [slug]/
    ├── page.tsx
    └── _components/
        └── post-detail.tsx        ← 순수 컴포넌트
```

## 분석 요약

| 파일 | 문제점 |
|------|--------|
| `posts/page.tsx` | `interface Props` 사용, 중복 import |
| `_components/category-filter.tsx` | `interface Props` 사용, 폴더 분류 오류 (navigation 의존성 있어 순수 컴포넌트 아님) |
| `[slug]/page.tsx` | `interface Props` 사용 |
| `[slug]/_components/post-detail.tsx` | `interface Props` 사용 |

---

## 수정 계획

### 1. [High] Props 타입 형식 통일: `interface` → `type`

`component.md` 규칙: 컴포넌트 Props는 `type Props = {}` 형식으로 작성한다.

**현재 코드** (4개 파일 모두 동일한 패턴)
```tsx
interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}
```

**수정 후**
```tsx
type Props = {
  searchParams: Promise<{ category?: string; page?: string }>
}
```

대상 파일:
- `posts/page.tsx`
- `posts/_components/category-filter.tsx`
- `posts/[slug]/page.tsx`
- `posts/[slug]/_components/post-detail.tsx`

---

### 2. [Medium] CategoryFilter → `_actions`로 이동

`page-folder.md` 규칙:
- `_components`: **순수 컴포넌트** (API, zustand 등 외부 의존성 없음)
- `_actions`: **Action 컴포넌트**, 유형별 하위 폴더 가능 (`_filter` 등)

`category-filter.tsx`는 `useRouter`, `useSearchParams` (next/navigation)를 사용하는 Client Component로, 외부 의존성이 있어 순수 컴포넌트 기준에 부합하지 않는다.
`_actions/_filter/` 하위로 이동하고 파일명도 Action 컴포넌트 네이밍 규칙(`*Action.tsx`)에 맞게 변경한다.

**현재 구조**
```
posts/
└── _components/
    └── category-filter.tsx
```

**수정 후 구조**
```
posts/
└── _actions/
    └── _filter/
        └── category-filter-action.tsx
```

**posts/page.tsx import 수정**
```tsx
// 현재
import { CategoryFilter } from "./_components/category-filter"

// 수정 후
import { CategoryFilterAction } from "./_actions/_filter/category-filter-action"
```

**category-filter-action.tsx 컴포넌트명 변경**
```tsx
// 현재
export function CategoryFilter({ categories, currentSlug }: Props) { ... }

// 수정 후
export function CategoryFilterAction({ categories, currentSlug }: Props) { ... }
```

---

### 3. [Low] 중복 import 정리

**현재 코드** (`posts/page.tsx`)
```tsx
import { getCategories } from "@/db/queries/categories"
import { getCategoryBySlug } from "@/db/queries/categories"
```

**수정 후**
```tsx
import { getCategories, getCategoryBySlug } from "@/db/queries/categories"
```

---

## 변경 후 구조

```
src/app/(main)/posts/
├── page.tsx                        ← Props 타입 수정, import 정리
├── _actions/
│   └── _filter/
│       └── category-filter-action.tsx   ← _components에서 이동, 타입/네이밍 수정
└── [slug]/
    ├── page.tsx                    ← Props 타입 수정
    └── _components/
        └── post-detail.tsx         ← Props 타입 수정
```

## 체크리스트

- [ ] `posts/page.tsx` — `interface Props` → `type Props`
- [ ] `posts/page.tsx` — `@/db/queries/categories` 중복 import 합치기
- [ ] `posts/page.tsx` — `CategoryFilter` import 경로 및 이름 변경
- [ ] `posts/_components/category-filter.tsx` → `posts/_actions/_filter/category-filter-action.tsx` 로 이동
- [ ] `category-filter-action.tsx` — `interface Props` → `type Props`
- [ ] `category-filter-action.tsx` — 컴포넌트명 `CategoryFilter` → `CategoryFilterAction`
- [ ] `posts/[slug]/page.tsx` — `interface Props` → `type Props`
- [ ] `posts/[slug]/_components/post-detail.tsx` — `interface Props` → `type Props`
