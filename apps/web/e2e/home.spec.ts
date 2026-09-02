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

test('히어로 타일은 이미지 영역을 클릭해도 상세 페이지로 이동한다', async ({
  page,
}) => {
  await page.goto('/');
  const hero = page.locator('article').first();
  await hero.click({ position: { x: 40, y: 30 } });
  await expect(page).toHaveURL(/\/posts\/.+/);
});
