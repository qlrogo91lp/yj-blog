# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 명령어

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

### DB 스키마

스키마 변경 시 `drizzle-kit push`를 사용한다. 개인 프로젝트이므로 generate + migrate 대신 push로 직접 DB에 반영한다.

```bash
npx drizzle-kit push    # schema.ts 변경 후 DB에 바로 반영
npx drizzle-kit studio  # DB 데이터 GUI로 확인
```

> **주의**: 컬럼 삭제·타입 변경 등 데이터 손실 가능성이 있는 작업은 push 전에 반드시 확인한다.

### 테스트

```bash
npm run test        # Vitest 단위/통합 테스트 (watch 모드)
npm run test:run    # Vitest 1회 실행 (CI용)
npm run test:e2e    # Playwright E2E 테스트
```

자세한 사용법은 [## 테스트 가이드](#테스트-가이드) 참고.

## 아키텍처

Next.js 16 개인 블로그. **App Router** + React 19 + TypeScript strict 모드.

- `src/app/` — App Router 루트. `layout.tsx`는 루트 레이아웃, `page.tsx`는 홈페이지.
- `src/db/` — Drizzle ORM 설정. `schema.ts`에 모든 테이블 정의, `index.ts`에 db 인스턴스.
- `src/components/` — UI 컴포넌트. `ui/`는 shadcn/ui 자동 생성. 그 외 공통적으로 사용하는 컴포넌트.
- `src/db/queries/` — Server Component용 DB 쿼리 함수 모음.
- `public/` — 정적 파일.
- 스타일링: **Tailwind CSS v4** (PostCSS). 전역 스타일은 `app/globals.css`. 분리된 CSS는 `src/styles/`에 모아두고 `globals.css`에서 `@import`로 참조한다.
  - `src/styles/prose.css` — 글 상세 페이지 `.prose` 스타일
  - `src/styles/highlight.css` — highlight.js `.hljs-*` 토큰 색상 (github-dark 기반)
- 폰트: Geist Sans, Geist Mono (`next/font/google`). CSS 변수 `--font-geist-sans`, `--font-geist-mono`로 노출.
- 경로 별칭: `@/*` → `src/` (예: `@/components/...`, `@/db/...`).
- 각 라우트 경로에는 해당 페이지에서 사용하는 private 폴더를 사용한다. (_로 시작하는 폴더: _actions, _components, _hooks 등)
- 컴포넌트에는 최대한 순수 UI만 담당하게 한다. 비즈니스 로직은 _actions로 분리한다.
- _actions 폴더에는 최대한 작은 단위로 기능을 만든다. Server Action(`'use server'`)과 client action 모두 포함한다.
  - 예: `submit-post-action.ts`는 zustand에서 상태를 읽어와 Server Action을 호출하고, 결과에 따라 store를 업데이트한다.
- _hooks 폴더에는 페이지 전용 커스텀 hook을 둔다. (예: `use-auto-save.ts`)
- 각 페이지에서 사용하는 zustand 상태값은 _store.ts 파일을 사용한다. 타입은 `type State`와 `type Action`으로 분리하고 `create<State & Action>`로 선언한다.

새 라우트는 `src/app/` 하위에 폴더를 추가하는 App Router 컨벤션을 따른다 (예: `src/app/posts/[slug]/page.tsx`).

## 코딩 컨벤션

### 컴포넌트
- 파일명·컴포넌트명은 kebab-case (예: `post-card.tsx`)
- `'use client'`는 꼭 필요한 경우에만 붙인다 — 기본은 Server Component
- props 타입은 파일 상단에 `type Props` 로 선언한다
- 임의 px 값(`h-[400px]`) 대신 Tailwind 기본 spacing 토큰(`h-100`)을 사용한다.

### 함수 & 변수
- 함수·변수명은 camelCase
- 불리언 변수는 `is` / `has` 접두사 (예: `isPublished`, `hasError`)
- 상수(환경 변수 제외)는 camelCase로 작성한다

### 날짜 처리
- 날짜 포맷·연산은 **date-fns**를 사용한다 (`toLocaleDateString`, `toLocaleString` 등 네이티브 날짜 메서드 사용 금지)
- 한국어 로케일이 필요하면 `import { ko } from "date-fns/locale"` 후 옵션에 전달한다
- 예: `format(new Date(date), "yyyy년 M월 d일", { locale: ko })`

### 기타
- 타입 단언(`as`)은 가능하면 피하고, Zod 파싱 결과를 활용한다
- `console.log`는 커밋하지 않는다

---

## 테스트 가이드

### 역할 구분

| 도구 | 대상 | 실행 환경 |
|------|------|-----------|
| **Vitest** | 순수 함수, Zod 스키마, React 컴포넌트 렌더링/인터랙션 | Node.js (jsdom) |
| **Playwright** | 실제 페이지 흐름, 여러 컴포넌트 통합 시나리오 | 실제 Chromium 브라우저 |

> **판단 기준**: 실제 브라우저·서버가 필요한가? → Playwright. 아니면 → Vitest.

---

### Vitest (단위 · 통합)

**설정** (`vitest.config.ts`)
- `environment: "jsdom"` — DOM API 시뮬레이션 (window, document 등)
- `globals: true` — `describe`, `it`, `expect`를 import 없이 사용 가능
- `setupFiles` — 각 테스트 전 `@testing-library/jest-dom` 자동 로드 → `toBeInTheDocument()` 등 matcher 사용 가능

**파일 위치**: 테스트 대상 파일 옆에 `*.test.ts(x)` 로 생성 (예: `PostCard.tsx` → `PostCard.test.tsx`)

#### Next.js mock 패턴

`next/link`, `next/image`는 jsdom에서 동작하지 않으므로 `vi.mock`으로 교체한다.

```typescript
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, className }: { src: string; alt: string; width: number; height: number; className?: string }) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  ),
}))
```

#### Testing Library 주요 API

```typescript
import { render, screen, fireEvent } from "@testing-library/react"

render(<MyComponent prop="value" />)

// 요소 탐색 (우선순위: getByRole > getByText > getByTestId)
screen.getByRole("button", { name: "리스트 뷰" })   // aria-label 또는 버튼 텍스트
screen.getByRole("heading", { name: /최신 글/ })     // 정규식도 가능
screen.getByRole("link")
screen.getByText("텍스트")

// 있는 요소: getByXxx (없으면 에러)
// 없는 요소: queryByXxx (없으면 null)
expect(screen.getByText("제목")).toBeInTheDocument()
expect(screen.queryByText("없는텍스트")).not.toBeInTheDocument()
expect(screen.getByRole("link")).toHaveAttribute("href", "/posts/slug")

// 이벤트
fireEvent.click(screen.getByRole("button", { name: "리스트 뷰" }))
```

#### Zod 스키마 테스트 패턴

```typescript
it("유효한 데이터는 파싱 성공", () => {
  expect(postFormSchema.safeParse(validData).success).toBe(true)
})

it("slug에 한글이 있으면 실패", () => {
  const result = postFormSchema.safeParse({ ...validData, slug: "한글-slug" })
  expect(result.success).toBe(false)
})
```

#### 이 프로젝트 테스트 대상 예시

- `src/types/post.test.ts` — `postFormSchema` 유효성 검증
- `src/components/post/PostCard.test.tsx` — `PostCard` 렌더링
- `src/components/post/PostList.test.tsx` — `PostList` 렌더링 및 뷰 전환

---

### Playwright (E2E)

**설정** (`playwright.config.ts`)
- `baseURL: "http://localhost:3000"` — `page.goto("/")` 로 상대 경로 사용 가능
- `webServer` — 테스트 실행 시 `npm run dev` 자동 시작 (서버가 이미 실행 중이면 재사용)
- `testDir: "./e2e"` — E2E 테스트 파일 위치

**파일 위치**: `e2e/*.spec.ts`

#### 주요 API

```typescript
import { test, expect } from "@playwright/test"

test("설명", async ({ page }) => {
  // 페이지 이동
  await page.goto("/")

  // 요소 탐색 (Playwright는 요소가 나타날 때까지 자동 재시도 → waitFor 대부분 불필요)
  const heading = page.getByRole("heading", { name: "최신 글" })
  const listBtn = page.getByRole("button", { name: /리스트/ })  // 정규식 가능
  const link    = page.getByRole("link", { name: "글 제목" })
  const el      = page.locator(".my-class")

  // 단언
  await expect(heading).toBeVisible()
  await expect(page).toHaveURL("/posts/slug")

  // 클릭 / 입력
  await listBtn.click()
  await page.getByRole("textbox").fill("입력값")
})
```

> **Locator 우선순위**: `getByRole` > `getByText` > `getByLabel` > `locator("[data-testid]")`

#### 이 프로젝트 E2E 테스트 대상 예시

- 홈 글 목록 렌더링 확인 (`e2e/home.spec.ts` 참고)
- 카드 ↔ 리스트 뷰 전환
- 글 카드 클릭 → 상세 페이지 이동 확인
