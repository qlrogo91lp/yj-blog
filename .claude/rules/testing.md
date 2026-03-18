# 테스트 가이드

## 역할 구분

| 도구 | 대상 | 실행 환경 |
|------|------|-----------|
| **Vitest** | 순수 함수, Zod 스키마, React 컴포넌트 렌더링/인터랙션 | Node.js (jsdom) |
| **Playwright** | 실제 페이지 흐름, 여러 컴포넌트 통합 시나리오 | 실제 Chromium 브라우저 |

> **판단 기준**: 실제 브라우저·서버가 필요한가? → Playwright. 아니면 → Vitest.

---

## Vitest (단위 · 통합)

**설정** (`vitest.config.ts`)
- `environment: "jsdom"` — DOM API 시뮬레이션 (window, document 등)
- `globals: true` — `describe`, `it`, `expect`를 import 없이 사용 가능
- `setupFiles` — 각 테스트 전 `@testing-library/jest-dom` 자동 로드 → `toBeInTheDocument()` 등 matcher 사용 가능

**파일 위치**: 테스트 대상 파일 옆에 `*.test.ts(x)` 로 생성 (예: `PostCard.tsx` → `PostCard.test.tsx`)

### Next.js mock 패턴

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

### Testing Library 주요 API

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

### Zod 스키마 테스트 패턴

```typescript
it("유효한 데이터는 파싱 성공", () => {
  expect(postFormSchema.safeParse(validData).success).toBe(true)
})

it("slug에 한글이 있으면 실패", () => {
  const result = postFormSchema.safeParse({ ...validData, slug: "한글-slug" })
  expect(result.success).toBe(false)
})
```

### 이 프로젝트 테스트 대상 예시

- `src/types/post.test.ts` — `postFormSchema` 유효성 검증
- `src/components/post/PostCard.test.tsx` — `PostCard` 렌더링
- `src/components/post/PostList.test.tsx` — `PostList` 렌더링 및 뷰 전환

---

## Playwright (E2E)

**설정** (`playwright.config.ts`)
- `baseURL: "http://localhost:3000"` — `page.goto("/")` 로 상대 경로 사용 가능
- `webServer` — 테스트 실행 시 `npm run dev` 자동 시작 (서버가 이미 실행 중이면 재사용)
- `testDir: "./e2e"` — E2E 테스트 파일 위치

**파일 위치**: `e2e/*.spec.ts`

### 주요 API

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

### 이 프로젝트 E2E 테스트 대상 예시

- 홈 글 목록 렌더링 확인 (`e2e/home.spec.ts` 참고)
- 카드 ↔ 리스트 뷰 전환
- 글 카드 클릭 → 상세 페이지 이동 확인
