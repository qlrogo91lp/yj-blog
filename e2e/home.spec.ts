import { expect, test } from '@playwright/test';

test('홈페이지 글 목록 렌더링', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '최근 글' })).toBeVisible();
});

test('글 목록 페이지 카드/리스트 뷰 전환', async ({ page }) => {
  await page.goto('/posts');

  await page.getByRole('button', { name: '리스트 뷰' }).click();
  await expect(page).toHaveURL(/[?&]view=list/);

  await page.getByRole('button', { name: '카드 뷰' }).click();
  await expect(page).not.toHaveURL(/[?&]view=list/);
});
