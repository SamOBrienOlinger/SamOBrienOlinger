const { test, expect } = require('@playwright/test');

test('theme follows the system until a saved choice overrides it', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('each mobile navigation link closes the menu and reaches its section', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  for (const [name, id] of [['Work', 'work'], ['Research', 'research'], ['Approach', 'about'], ['Contact', 'contact'], ['Home', 'top']]) {
    await menu.click();
    await nav.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  await expect(page.getByRole('link', { name: 'Send me an email', exact: true }))
    .toHaveAttribute('href', 'mailto:samobrienolinger@gmail.com');
  await page.locator('.back-to-top').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
});

test('reduced motion keeps the hero readable and stops automatic rotation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const words = page.locator('#hero-title > span');
  await expect(words).toHaveCount(3);
  const styles = await words.evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element);
    return { opacity: style.opacity, transform: style.transform, animation: style.animationName };
  }));
  expect(styles).toEqual(Array.from({ length: 3 }, () => ({ opacity: '1', transform: 'none', animation: 'none' })));
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-rotation', 'paused');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#hero-title')).toHaveClass(/is-revealing/);
  await expect(words.first()).toHaveCSS('animation-timing-function', 'ease-out');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#hero-title')).not.toHaveClass(/is-revealing/);
});

test('desktop navigation, focus links and carousel work without script errors', async ({ browser }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name), 'One desktop pass per browser engine.');
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('.menu-toggle')).toBeHidden();
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Approach', exact: true }).click();
  await expect(page).toHaveURL(/#about$/);
  const softwareSummary = page.locator('.approach #software-panel > summary');
  await softwareSummary.press('Enter');
  await expect(page.locator('#software-panel > .accordion-content')).toBeVisible();
  await expect(page).toHaveURL(/#about$/);
  await softwareSummary.press('Space');
  await expect(page.locator('#software-panel > .accordion-content')).toBeHidden();
  // The Research card expands in place and keeps focus in the About flow.
  const researchSummary = page.locator('.approach #research-panel > summary');
  await researchSummary.press('Enter');
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator('#research-panel > .accordion-content')).toBeVisible();
  await expect(researchSummary).toBeFocused();
  // Check full keyboard tab order in desktop mode, alongside mobile activation coverage.
  const publications = page.locator('#research-publications');
  const summary = publications.locator('summary');
  const content = publications.locator('.accordion-content');
  await summary.press('Enter');
  await expect(content).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(publications.locator('a').first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(content).toBeHidden();
  await page.keyboard.press('Tab');
  const peopleSummary = page.locator('#people-panel > summary');
  await expect(peopleSummary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#people-panel > .accordion-content')).toBeVisible();
  await page.keyboard.press('Tab');
  const experienceSummary = page.locator('#people-experience > summary');
  await expect(experienceSummary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#people-experience .research-experience')).toBeVisible();
  await expect(page.locator('#people-experience li')).toHaveCount(9);
  await nav.getByRole('link', { name: 'Work', exact: true }).click();
  await page.locator('#work-track').focus();
  await page.keyboard.press('End');
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-current-project', 'white-whale');
  await page.keyboard.press('Home');
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-current-project', 'sct');
  await expect(page.locator('[data-project="sct"] img')).toHaveCount(1);
  await expect.poll(() => page.locator('[data-project="sct"] .project-media img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('[data-carousel]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await context.close();
});
