import { test, expect } from '@playwright/test';

test('랜딩 페이지가 핵심 요소를 렌더한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await expect(page.getByRole('heading', { name: 'Ralli', level: 1 })).toBeVisible();
  await expect(page.getByText('Tennis scores, right on your wrist.')).toBeVisible();
  await expect(page.getByRole('link', { name: /App Store/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /qlrogo91lp@gmail.com/i })).toBeVisible();
});

test('개인정보 처리방침으로 이동한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL('/apps/ralli/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
});

test('Apps 목록에서 Ralli 카드로 진입하면 커스텀 페이지가 열린다', async ({ page }) => {
  await page.goto('/apps');

  await page.getByRole('link', { name: /Ralli/ }).click();
  await expect(page).toHaveURL('/apps/ralli');
  await expect(page.getByRole('heading', { name: 'Ralli', level: 1 })).toBeVisible();
});
