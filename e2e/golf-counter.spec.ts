import { test, expect } from '@playwright/test';

test.describe('GolfCounter 랜딩', () => {
  test('히어로가 렌더되고 App Store CTA가 동작한다', async ({ page }) => {
    await page.goto('/apps/golf-counter');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Play the round.');
    await expect(page.getByText('Live on Apple Watch & iPhone')).toBeVisible();

    const cta = page.getByRole('link', { name: /Download on the App Store/i }).first();
    await expect(cta).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372',
    );
  });

  test('스크롤하면 모든 섹션이 나타난다', async ({ page }) => {
    await page.goto('/apps/golf-counter');

    await expect(
      page.getByRole('heading', { name: 'Everything happens on your wrist.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'A round is a workout — logged automatically.' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Every round adds up.' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Nine or eighteen. Your call.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ready for the first tee?' }),
    ).toBeVisible();
  });

  test('privacy 링크로 이동한다', async ({ page }) => {
    await page.goto('/apps/golf-counter');
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL('/apps/golf-counter/privacy');
  });

  test('reduced-motion에서 pin 섹션이 접혀 페이지가 짧아진다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/apps/golf-counter');

    const height = await page.evaluate(() => document.body.scrollHeight);
    // pin 껍데기(300vh + 280vh)가 접히면 전체 높이가 크게 줄어든다
    expect(height).toBeLessThan(8000);
  });
});
