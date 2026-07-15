import { expect, test } from '@playwright/test';

test('헤더에서 시리즈 목록 페이지로 이동', async ({ page }) => {
  await page.goto('/');
  // 헤더 nav가 데스크톱/모바일로 두 번 렌더링되어 first()로 지정
  await page.getByRole('link', { name: '시리즈' }).first().click();
  await expect(page).toHaveURL('/series');
  await expect(page.getByRole('heading', { name: '시리즈' })).toBeVisible();
});

test('존재하지 않는 시리즈 slug는 404', async ({ page }) => {
  const response = await page.goto('/series/no-such-series');
  expect(response?.status()).toBe(404);
});
