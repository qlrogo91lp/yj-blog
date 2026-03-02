import { test, expect } from "@playwright/test"

test("홈페이지 글 목록 렌더링", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "최신 글" })).toBeVisible()
})

test("카드/리스트 뷰 전환", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /리스트/ }).click()
  await page.getByRole("button", { name: /카드/ }).click()
})
