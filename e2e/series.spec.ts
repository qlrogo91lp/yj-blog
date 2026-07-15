import { expect, test } from '@playwright/test';

test('헤더에서 시리즈 목록 페이지로 이동', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '시리즈' }).first().click();
  await expect(page).toHaveURL('/series');
  await expect(page.getByRole('heading', { name: '시리즈' })).toBeVisible();
});

test('존재하지 않는 시리즈 slug는 404', async ({ page }) => {
  const response = await page.goto('/series/no-such-series');
  expect(response?.status()).toBe(404);
});
