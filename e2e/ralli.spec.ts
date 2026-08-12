import { test, expect } from '@playwright/test';

const APP_STORE_URL = 'https://apps.apple.com/us/app/ralli/id6449350578';

test('랜딩 페이지가 4개 섹션을 모두 렌더한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('right on your wrist.');
  await expect(page.getByRole('heading', { name: 'All on your wrist.' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'A match is a workout — logged automatically.' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Every match, back on your iPhone.' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Play by your own rules.' })).toBeVisible();
});

test('모든 App Store CTA가 동일한 URL을 가리킨다', async ({ page }) => {
  await page.goto('/apps/ralli');

  const ctas = page.locator(`a[href="${APP_STORE_URL}"]`);
  expect(await ctas.count()).toBeGreaterThanOrEqual(2);
});

test('개인정보 처리방침으로 이동한다', async ({ page }) => {
  await page.goto('/apps/ralli');

  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL('/apps/ralli/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible();
});

test('Apps 목록에서 Ralli 카드로 진입한다', async ({ page }) => {
  await page.goto('/apps');

  await page.getByRole('link', { name: /Ralli/ }).click();
  await expect(page).toHaveURL('/apps/ralli');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('right on your wrist.');
});

test.describe('모바일', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('가로 스크롤이 발생하지 않는다', async ({ page }) => {
    await page.goto('/apps/ralli');
    await page.waitForLoadState('networkidle');

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});

test.describe('reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('모션을 끈 상태에서도 모든 섹션이 보인다', async ({ page }) => {
    await page.goto('/apps/ralli');

    await expect(page.getByRole('heading', { name: 'All on your wrist.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Play by your own rules.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Go win the next one.' })).toBeVisible();
  });
});
