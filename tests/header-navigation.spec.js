const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 1024, height: 480 }, isMobile: false, hasTouch: false, reducedMotion: 'no-preference' });

test('short desktop navigation keeps the selected section active after scrolling settles', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Exercise the short desktop viewport once per browser engine.');
  test.setTimeout(45000);
  await page.goto('/');
  await page.evaluate(async () => { await window.portfolioFontReady; });
  await expect(page.locator('.menu-toggle')).toBeHidden();
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });

  for (const [name, id] of [['Software', 'work'], ['Research', 'research']]) {
    const link = nav.getByRole('link', { name, exact: true });
    const section = page.locator(`#${id}`);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect.poll(() => section.evaluate(element => Math.abs(
      element.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
    )), { message: `${name} must settle below the sticky header at its anchor clearance` }).toBeLessThanOrEqual(1);

    // Let the final scroll event update selection; the click handler's immediate
    // selection alone must not make this assertion pass.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(link).toHaveAttribute('aria-current', 'location');
    await expect(nav.locator('[aria-current="location"]')).toHaveCount(1);
  }
});
