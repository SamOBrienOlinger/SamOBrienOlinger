const { test, expect } = require('@playwright/test');

async function expectNoOverflow(page) {
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
}

test('mobile navigation and project layouts remain usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Curiosity/ })).toBeVisible();
  await expectNoOverflow(page);
  const menu = page.locator('.menu-toggle');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const boxes = await page.locator('.menu-toggle, .theme-toggle, #site-nav a').evaluateAll(elements => elements
    .filter(element => element.getBoundingClientRect().width > 0)
    .map(element => ({ label: element.textContent.trim() || element.getAttribute('aria-label'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
  for (const box of boxes) {
    expect(box.width, box.label + ' width').toBeGreaterThanOrEqual(44);
    expect(box.height, box.label + ' height').toBeGreaterThanOrEqual(44);
  }
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  for (const name of ['Home', 'Work', 'Experience', 'Research', 'Approach', 'Contact']) {
    await expect(nav.getByRole('link', { name, exact: name !== 'Contact' })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#work')).toBeFocused();
  const cardsFit = await page.locator('.project[data-project][aria-hidden="false"]').evaluateAll(cards => cards.length === 1 && cards.every(card => {
    const rect = card.getBoundingClientRect();
    return rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5;
  }));
  expect(cardsFit).toBe(true);
  await expectNoOverflow(page);
});

test('Escape closes the mobile menu and returns focus', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('focus labels are readable HTML links at normal and enlarged text sizes', async ({ page }) => {
  await page.goto('/#about');
  const diagram = page.getByRole('group', { name: 'Areas of focus' });
  await expect(diagram).toBeVisible();
  for (const [name, href, text] of [
    ['Software: Full-stack digital products.', '#work', 'Full-stack digital products'],
    ['Research: Evidence, policy and social science.', '#research', 'Evidence, policy and social science'],
    ['People: Supporting communities.', '#about', 'Supporting communities']
  ]) {
    const link = diagram.getByRole('link', { name, exact: true });
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toContainText(text);
  }
  for (const size of ['100%', '200%']) {
    await page.evaluate(value => document.documentElement.style.fontSize = value, size);
    const labelsFit = await diagram.locator('a').evaluateAll(elements => elements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 && element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1;
    }));
    expect(labelsFit).toBe(true);
    await expectNoOverflow(page);
  }
});

test('AllyIndex retains all supplied screens and destinations', async ({ page }) => {
  await page.goto('/#work');
  const card = page.locator('[data-project="allyindex"]');
  await expect(card).toHaveCount(1);
  await page.locator('.work-track').focus();
  await card.evaluate(element => element.parentElement.scrollTo({ left: element.offsetLeft, behavior: 'instant' }));
  await expect(card).toHaveAttribute('aria-hidden', 'false');
  const screens = card.locator('.allyindex-gallery img');
  await expect(screens).toHaveCount(3);
  await screens.evaluateAll(images => images.forEach(image => image.scrollIntoView({ block: 'center' })));
  await expect.poll(() => screens.evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await expect(card.getByRole('link', { name: 'Live site for AllyIndex', exact: true })).toHaveAttribute('href', 'https://declan444.github.io/24-7-hackathon-team9/index.html');
  await expect(card.getByRole('link', { name: 'Repository for AllyIndex', exact: true })).toHaveAttribute('href', 'https://github.com/declan444/24-7-hackathon-team9');
  await expectNoOverflow(page);
});

test('theme and menu work when preference storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage blocked'); };
    Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  });
  await page.goto('/');
  const root = page.locator('html');
  const initialTheme = await root.getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to .* theme/ }).click();
  await expect(root).toHaveAttribute('data-theme', initialTheme === 'dark' ? 'light' : 'dark');
  const menu = page.locator('.menu-toggle');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
});

test('navigation remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toBeVisible();
  await expect(page.locator('.menu-toggle')).toBeHidden();
  await expect(page.locator('.publication-cover')).toHaveCount(7);
  await expectNoOverflow(page);
  await context.close();
});

test('layout reflows from a small phone to desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Android Chrome 360', 'One Chromium pass covers the wider viewport transitions.');
  await page.goto('/');
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoOverflow(page);
    if (width >= 1024) {
      await expect(page.locator('.menu-toggle')).toBeHidden();
      await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toBeVisible();
    } else {
      await expect(page.locator('.menu-toggle')).toBeVisible();
    }
  }
});
