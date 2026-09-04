const { test, expect } = require('@playwright/test');

test('mobile navigation and layout remain usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Curiosity/ })).toBeVisible();

  const pageMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(pageMetrics.scrollWidth).toBeLessThanOrEqual(pageMetrics.clientWidth);

  const menu = page.getByRole('button', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');

  const headerTargets = page.locator('.nav-toggle, .theme-toggle, .contact-pill, #primary-nav a');
  const boxes = await headerTargets.evaluateAll(elements => elements
    .filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    })
    .map(element => {
      const rect = element.getBoundingClientRect();
      return {
        label: (element.textContent || element.getAttribute('aria-label') || '').trim(),
        width: rect.width,
        height: rect.height
      };
    }));
  for (const box of boxes) {
    expect(box.width, box.label + ' width').toBeGreaterThanOrEqual(44);
    expect(box.height, box.label + ' height').toBeGreaterThanOrEqual(44);
  }

  for (const name of ['Home', 'Work', 'Experience', 'Research', 'Approach', 'Contact']) {
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name, exact: true })).toBeVisible();
  }

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Work', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');

  const cardsFit = await page.locator('.project-card').evaluateAll(cards =>
    cards.every(card => {
      const rect = card.getBoundingClientRect();
      return rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5;
    }));
  expect(cardsFit).toBe(true);

  const finalMetrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(finalMetrics.scrollWidth).toBeLessThanOrEqual(finalMetrics.clientWidth);
});

test('Escape closes the mobile menu and returns focus', async ({ page }) => {
  await page.goto('/');
  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.click();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
});

test('Focus content remains readable and navigable on mobile', async ({ page }) => {
  await page.goto('/');

  const focusPanel = page.locator('.hero-panel-venn');
  await expect(focusPanel).toBeVisible();
  await expect(focusPanel.getByText('Public', { exact: false })).toBeVisible();

  const focusLinks = focusPanel.getByRole('navigation', { name: 'Areas of focus' }).getByRole('link');
  await expect(focusLinks).toHaveCount(3);

  for (const label of ['Software', 'Research', 'People']) {
    const link = focusPanel.getByRole('link', { name: new RegExp('^' + label) });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box.width, label + ' width').toBeGreaterThanOrEqual(44);
    expect(box.height, label + ' height').toBeGreaterThanOrEqual(44);
  }

  const metrics = await focusPanel.evaluate(panel => {
    const rect = panel.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewport: window.innerWidth,
      overflow: panel.scrollWidth - panel.clientWidth
    };
  });
  expect(metrics.left).toBeGreaterThanOrEqual(-0.5);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewport + 0.5);
  expect(metrics.overflow).toBeLessThanOrEqual(1);
});
