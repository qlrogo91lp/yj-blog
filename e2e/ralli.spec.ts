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

  test('히어로 태그라인·CTA·스코어가 실제로 보인다', async ({ page }) => {
    // test.use()의 reducedMotion 컨텍스트 옵션이 첫 goto()에는 적용되지 않는
    // 환경 이슈가 확인되어, 최초 네비게이션 전에 명시적으로 emulateMedia를 호출한다.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/apps/ralli');

    // toBeVisible()은 opacity:0을 감지하지 못한다.
    // stale 스타일은 래퍼에 붙으므로 조상의 opacity까지 곱해 실효값을 구한다.
    const effectiveOpacity = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          let node: HTMLElement | null = el as HTMLElement;
          let acc = 1;
          while (node) {
            acc *= Number(getComputedStyle(node).opacity);
            node = node.parentElement;
          }
          return acc;
        });

    // isStatic은 hydration 직후 useEffect로 정착하므로 순간값이 아닌 polling으로 확인한다.
    await expect.poll(() => effectiveOpacity('h1')).toBeGreaterThan(0.9);
    await expect.poll(() => effectiveOpacity(`a[href="${APP_STORE_URL}"]`)).toBeGreaterThan(0.9);
    await expect
      .poll(() => effectiveOpacity('[data-testid="ralli-hero-score"]'))
      .toBeGreaterThan(0.9);
  });

  test('히어로 워치 이미지가 축소되지 않는다', async ({ page }) => {
    // 위 테스트와 동일한 이유로 최초 네비게이션 전에 명시적으로 emulateMedia를 호출한다.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/apps/ralli');

    const wrapperTransform = () =>
      page
        .locator('img[alt*="Apple Watch"]')
        .first()
        .evaluate((el) => {
          const wrapper = el.closest('div');
          return wrapper ? getComputedStyle(wrapper).transform : '';
        });

    // 결함이 있으면 scale(0.62) rotate(-4deg)가 남는다.
    // isStatic이 hydration 직후 정착하므로 polling으로 확인한다.
    await expect.poll(wrapperTransform).toMatch(/^(none)?$/);
  });
});
