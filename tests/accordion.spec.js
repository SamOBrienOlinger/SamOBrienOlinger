const { test, expect } = require('@playwright/test');

test('research accordions support pointer and keyboard activation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const outerSummary = page.locator('#research-panel > summary');
  const nestedPanels = page.locator('.research-accordions');
  await expect(nestedPanels).toBeHidden();
  await page.locator('.menu-toggle').click();
  await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Research', exact: true }).click();
  await expect(page).toHaveURL(/#research$/);
  await expect(nestedPanels).toBeVisible();
  await outerSummary.press('Enter');
  await expect(nestedPanels).toBeHidden();
  await outerSummary.press('Space');
  await expect(nestedPanels).toBeVisible();
  for (const selector of ['#research-experience', '#research-publications']) {
    const panel = page.locator(selector);
    const summary = panel.locator('summary');
    const content = panel.locator('.accordion-content');
    await expect(content).toBeHidden();
    await summary.click();
    await expect(content).toBeVisible();
    await summary.press('Enter');
    await expect(content).toBeHidden();
    await expect(summary).toBeFocused();
    await summary.press('Space');
    await expect(content).toBeVisible();
    await summary.press('Space');
    await expect(content).toBeHidden();
  }
});

test('expanded research content fits phones, dark mode and enlarged text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/#research');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const selector of ['#research-experience', '#research-publications']) {
    await page.locator(`${selector} > summary`).click();
  }
  await expect(page.locator('.research-experience li')).toHaveCount(10);
  await expect(page.locator('#research-publications .publication')).toHaveCount(8);
  await expect(page.locator('#research-publications .publication-cover')).toHaveCount(7);
  for (const size of ['100%', '200%']) {
    await page.evaluate(value => document.documentElement.style.fontSize = value, size);
    const summaries = await page.locator('.accordion > summary').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, fits: element.scrollWidth <= element.clientWidth + 1 };
    }));
    for (const summary of summaries) {
      expect(summary.width).toBeGreaterThanOrEqual(44);
      expect(summary.height).toBeGreaterThanOrEqual(44);
      expect(summary.fits).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.locator('.publication').last()).toBeVisible();
  }
});
