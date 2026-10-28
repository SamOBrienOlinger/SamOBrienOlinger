const { test, expect } = require('@playwright/test');

test('research accordions support pointer and keyboard without trapping focus', async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#research');
  for (const selector of ['.experience-accordion', '#research-experience', '#research-publications']) {
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
  const publications = page.locator('#research-publications');
  // WebKit follows Safari's default: Option-Tab includes links in keyboard navigation.
  // https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac
  const nextItem = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
  const previousItem = browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab';
  await publications.locator('summary').press('Enter');
  await page.keyboard.press(nextItem);
  await expect(publications.locator('a').first()).toBeFocused();
  await page.keyboard.press(previousItem);
  await expect(publications.locator('summary')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press(nextItem);
  await expect(page.getByRole('link', { name: 'Software: Full-stack digital products.', exact: true })).toBeFocused();
});

test('expanded research content fits phones, dark mode and enlarged text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/#research');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const selector of ['.experience-accordion', '#research-experience', '#research-publications']) {
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
