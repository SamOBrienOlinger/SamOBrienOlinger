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
  for (const name of ['Home', 'Work', 'Research', 'Approach', 'Contact']) {
    await expect(nav.getByRole('link', { name, exact: name !== 'Contact' })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#work')).toBeFocused();
  await expect.poll(() => page.locator('.project[data-project][aria-hidden="false"]').evaluateAll(cards => cards.length === 1 && cards.every(card => {
    const rect = card.getBoundingClientRect();
    return rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5;
  }))).toBe(true);
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

test('focus cards and contact actions are readable at normal and enlarged text sizes', async ({ page }) => {
  await page.goto('/#about');
  const diagram = page.getByRole('group', { name: 'Areas of focus' });
  await expect(diagram).toBeVisible();
  await expect(diagram.locator('#software-panel > summary')).toContainText('Software');
  await expect(diagram.locator('#software-panel > summary')).toContainText('Community resources, learning through play and applications built around real interests and positive outcomes.');
  await expect(diagram.locator('#research-panel > summary')).toContainText('Research');
  await expect(diagram.locator('#research-panel > summary')).toContainText('Evidence-based, social policy and critical thinking');
  await expect(diagram.locator('#people-panel > summary')).toContainText('People');
  await expect(diagram.locator('#people-panel > summary')).toContainText('Supporting communities');
  for (const size of ['100%', '200%']) {
    await page.evaluate(value => document.documentElement.style.fontSize = value, size);
    const labelsFit = await diagram.locator('.focus-overview > summary').evaluateAll(elements => elements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 && element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1;
    }));
    expect(labelsFit).toBe(true);
    const contactActionsFit = await page.locator('.contact-actions a').evaluateAll(elements => elements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 && element.scrollWidth <= element.clientWidth + 1
        && rect.left >= 0 && rect.right <= document.documentElement.clientWidth + 1;
    }));
    expect(contactActionsFit).toBe(true);
    await expectNoOverflow(page);
  }
});

test('every project keeps one main image and a live link without mobile overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  const projects = ['sct', 'spoodle', 'beaver', 'new-life', 'both-sides', 'beetlejuice', 'yellowknife', 'allyindex', 'white-whale'];
  await expect(page.locator('#work .project-gallery')).toHaveCount(0);
  for (const [index, project] of projects.entries()) {
    const card = page.locator(`[data-project="${project}"]`);
    await expect(card).toHaveAttribute('aria-hidden', 'false');
    await expect(card.locator('img')).toHaveCount(1);
    const mainImage = card.locator('.project-media img');
    await mainImage.scrollIntoViewIfNeeded();
    await expect.poll(() => mainImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const response = await page.request.get(await mainImage.getAttribute('src'));
    expect(response.ok(), `${project}: main image`).toBe(true);
    expect(response.headers()['content-type']).toMatch(/^image\//);
    const liveLink = card.locator('.project-links a');
    await expect(liveLink).toHaveCount(1);
    await expect(liveLink).toHaveAttribute('href', /^https:\/\//);
    const box = await liveLink.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
    await expectNoOverflow(page);
    if (index < projects.length - 1) await page.getByRole('button', { name: 'Next project', exact: true }).click();
  }
  await expect(page.locator('[data-project="allyindex"] .project-links a')).toHaveAttribute('href', 'https://declan444.github.io/24-7-hackathon-team9/index.html');
  await expect(page.locator('#work a[href*="github.com/"]')).toHaveCount(0);
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
  await expect(page.locator('#software-panel > .accordion-content')).toBeHidden();
  await page.locator('#software-panel > summary').click();
  await expect(page.locator('#work-track')).toBeVisible();
  await expect(page.locator('#software-panel [data-project]')).toHaveCount(9);
  await expect(page.locator('[data-project="sct"] .project-links a')).toBeVisible();
  await expect(page.locator('.publication-cover')).toHaveCount(7);
  await expect(page.locator('#research-publications')).toBeHidden();
  await page.locator('#research-panel > summary').click();
  await expect(page.locator('#research-publications')).toBeVisible();
  await expect(page.locator('#people-panel > .accordion-content')).toBeHidden();
  await page.locator('#people-panel > summary').click();
  await expect(page.locator('#people-panel > .accordion-content')).toBeVisible();
  await expect(page.locator('#people-panel .research-experience')).toBeVisible();
  await expect(page.locator('#research-publications .publication').first()).toBeVisible();
  await expect(page.locator('.publication').last()).toBeVisible();
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
