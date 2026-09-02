import { type Locator, type Page, expect, test } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };

function boxesIntersect(a: Box, b: Box): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * `useReducedMotion()`은 hydration 직후 한 번 더 리렌더되며 애니메이션 구조 →
 * static 구조로 DOM이 바뀐다 (`ralli/README.md` 함정 2 참고). 그 교체 순간에
 * `boundingBox()`를 호출하면 일시적으로 null이 나올 수 있어, 안정될 때까지 재시도한다.
 */
async function stableBoundingBox(locator: Locator): Promise<Box> {
  let box: Box | null = null;
  await expect(async () => {
    box = await locator.boundingBox();
    expect(box).not.toBeNull();
  }).toPass();
  return box as unknown as Box;
}

/**
 * 히어로 칩 4개 중 어느 것도 본문 문단(`golf-hero-body`)과 겹치지 않는지 확인한다.
 * 애니메이션 모드에서 두 번, static(reduced-motion) 모드에서 한 번 발생했던
 * 모바일 칩-본문 겹침 버그의 회귀 가드다.
 */
async function expectHeroChipsDoNotOverlapBody(page: Page) {
  const body = page.getByTestId('golf-hero-body');
  await expect(body).toBeVisible();
  const bodyBox = await stableBoundingBox(body);

  const chips = page.getByTestId('golf-hero-chip');
  await expect(chips).toHaveCount(4);

  const count = await chips.count();
  for (let i = 0; i < count; i++) {
    const chipBox = await stableBoundingBox(chips.nth(i));
    expect(boxesIntersect(bodyBox, chipBox)).toBe(false);
  }
}

test.describe('GolfCounter 랜딩', () => {
  test('히어로가 렌더되고 App Store CTA가 동작한다', async ({ page }) => {
    await page.goto('/apps/golf-counter');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Play the round.'
    );
    await expect(page.getByText('Live on Apple Watch & iPhone')).toBeVisible();

    const cta = page
      .getByRole('link', { name: /Download on the App Store/i })
      .first();
    await expect(cta).toHaveAttribute(
      'href',
      'https://apps.apple.com/us/app/golfcounter-with-watch/id6448967372'
    );
  });

  test('스크롤하면 모든 섹션이 나타난다', async ({ page }) => {
    await page.goto('/apps/golf-counter');

    await expect(
      page.getByRole('heading', { name: 'Everything happens on your wrist.' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'A round is a workout — logged automatically.',
      })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Every round adds up.' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Nine or eighteen. Your call.' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ready for the first tee?' })
    ).toBeVisible();
  });

  test('privacy 링크로 이동한다', async ({ page }) => {
    await page.goto('/apps/golf-counter');
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL('/apps/golf-counter/privacy');
  });

  test('reduced-motion에서 pin 섹션이 접혀 페이지가 짧아진다', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/apps/golf-counter');

    const height = await page.evaluate(() => document.body.scrollHeight);
    // pin 껍데기(300vh + 280vh)가 접히면 전체 높이가 크게 줄어든다
    expect(height).toBeLessThan(8000);
  });

  test('모바일 히어로 칩이 본문과 겹치지 않는다 (애니메이션 모드)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/apps/golf-counter');

    await expectHeroChipsDoNotOverlapBody(page);
  });

  test('모바일 히어로 칩이 본문과 겹치지 않는다 (reduced-motion)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/apps/golf-counter');

    await expectHeroChipsDoNotOverlapBody(page);
  });
});
