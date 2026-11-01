const { test, expect } = require('@playwright/test');

const pages = ['/', '/work/saggart-citywest.html', '/work/journeys-to-ireland.html', '/work/stopped-both-sides.html'];

async function settleImages(page) {
  await page.locator('img').evaluateAll(images => Promise.all(images.map(async img => {
    img.loading = 'eager';
    await img.decode();
  })));
}


test('all pages load their assets and stay within the viewport', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && new URL(response.url()).hostname === '127.0.0.1') errors.push(response.url()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of pages) {
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    // Load every image, including optional projects, before checking asset integrity.
    if (route === '/') await page.locator('.more-work > summary').click();
    await settleImages(page);
    await expect.poll(() => page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const outside = await page.locator('main a, main button, main summary, h1, h2, h3').evaluateAll(elements => elements.filter(element => {
      if (!element.getClientRects().length) return false;
      const r = element.getBoundingClientRect();
      return r.left < -1 || r.right > innerWidth + 1;
    }).map(el => el.textContent.trim()));
    expect(outside).toEqual([]);
  }
  expect(errors).toEqual([]);
  await page.goto('/');
  await settleImages(page);
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('homepage.png'), fullPage: true });
  await page.goto('/work/stopped-both-sides.html');
  await settleImages(page);
  await page.screenshot({ path: testInfo.outputPath('case-study.png'), fullPage: true });
});

test('navigation, keyboard disclosures and case-study routes work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  for (const [name, id] of [['Services', 'services'], ['Research', 'research'], ['People', 'people'], ['Contact', 'contact'], ['Work', 'work']]) {
    if (await menu.isVisible()) await menu.click();
    await nav.getByRole('link', { name, exact: name !== 'Contact' }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  }
  const summary = page.locator('.more-work > summary');
  await summary.focus();
  await summary.press('Enter');
  await expect(page.locator('.more-work-grid')).toBeVisible();
  await expect(page.locator('.small-project')).toHaveCount(6);
  await summary.press('Space');
  await expect(page.locator('.more-work-grid')).toBeHidden();
  await page.getByRole('link', { name: /Read the case study.*Saggart & Citywest Together/ }).click();
  await expect(page).toHaveURL(/work\/saggart-citywest.html$/);
  await page.getByRole('navigation', { name: 'Case study', exact: true }).getByRole('link', { name: 'The experience', exact: true }).click();
  await expect(page.locator('#experience')).toBeFocused();
  await page.getByRole('link', { name: 'All work', exact: false }).click();
  await expect(page).toHaveURL(/index.html#work$/);
});

test('Escape, outside clicks and breakpoint changes close the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await menu.click();
  await page.locator('h1').click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(menu).toBeHidden();
  await expect(page.locator('#site-nav')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#site-nav')).toBeHidden();
});

test('theme persists, including across case studies', async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.goto('/work/journeys-to-ireland.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await settleImages(page);
  await page.screenshot({ path: testInfo.outputPath('dark-case-study.png'), fullPage: true });
});

test('reduced motion settles animations and keeps all main content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.case-preview')).toHaveCount(3);
  const states = await page.locator('[data-reveal], #hero-title > span, .project-interfaces, .credential-circle, .credential-detail, .credential-overlap').evaluateAll(elements => elements.map(el => {
    const css = getComputedStyle(el);
    return { opacity: css.opacity, animation: css.animationName };
  }));
  expect(states.every(state => state.opacity === '1' && state.animation === 'none')).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('#career-background').scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('#career-background')).not.toHaveClass(/is-revealing/);
});

test('content, navigation and case studies remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 740 } });
  const page = await context.newPage();
  await page.goto(baseURL + '/');
  await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toBeVisible();
  await expect(page.locator('.case-preview')).toHaveCount(3);
  await page.locator('.more-work > summary').click();
  await expect(page.locator('.more-work-grid')).toBeVisible();
  await page.getByRole('link', { name: /Read the case study.*Journeys to Ireland/ }).click();
  await expect(page.locator('h1')).toHaveText('Journeys to Ireland');
  await expect(page.getByRole('link', { name: 'Visit the website', exact: false })).toHaveAttribute('href', 'https://samobrienolinger.github.io/My-New-Life-in-Ireland/');
  await context.close();
});

test('blocked storage and unavailable observers do not prevent navigation or theme changes', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage blocked'); } });
    delete window.IntersectionObserver;
  });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.theme-toggle')).toBeVisible();
  const before = await page.locator('html').getAttribute('data-theme');
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', before);
  expect(await page.locator('[data-reveal]').evaluateAll(elements => elements.every(el => getComputedStyle(el).opacity === '1'))).toBe(true);
});

test('320px layout and enlarged text preserve readable content', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of pages) {
    await page.goto(route);
    if (route === '/') await page.locator('.more-work > summary').click();
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    const overflowing = await page.locator('body *').evaluateAll(elements => elements.filter(element => {
      if (!element.getClientRects().length || element.closest('svg, .sr-only, .skip-link')) return false;
      const r = element.getBoundingClientRect();
      return r.left < -1 || r.right > innerWidth + 1;
    }).map(element => ({ tag: element.tagName, class: element.className, text: element.textContent.trim().slice(0, 70) })));
    expect(overflowing, route).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath('enlarged-text.png'), fullPage: true });
});


test('interface images enlarge by keyboard, close with Escape and restore focus', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/work/journeys-to-ireland.html']) {
    await page.goto(route);
    const opener = page.locator('[data-screen]').first();
    await opener.focus();
    await opener.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Interface preview' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img')).toHaveAttribute('src', /interfaces\/.+\.webp$/);
    await expect.poll(() => dialog.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await dialog.evaluate(el => el.getBoundingClientRect().right <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole('button', { name: 'Close image preview' })).toBeFocused();
    if (route !== '/') await page.screenshot({ path: testInfo.outputPath('interface-viewer.png') });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('html')).not.toHaveClass(/is-viewing-image/);
    await opener.click();
    await page.getByRole('button', { name: 'Close image preview' }).click();
    await expect(opener).toBeFocused();
  }
});

test('offer and contact are available before the project list, and image links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(baseURL + '/');
  await expect(page.locator('h1')).toContainText('Websites &');
  await expect(page.locator('.hero-actions').getByRole('link', { name: 'Discuss a project' })).toHaveAttribute('href', '#contact');
  const link = page.locator('[data-screen]').first();
  const destination = await link.getAttribute('href');
  await link.click();
  expect(page.url()).toBe(baseURL + '/' + destination);
  await expect(page.locator('img')).toBeVisible();
  await context.close();
});
