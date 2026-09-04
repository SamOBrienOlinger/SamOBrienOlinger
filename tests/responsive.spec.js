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


test('Focus diagram remains readable and touch-ready on mobile', async ({ page }) => {
  await page.goto('/');
  const diagram = page.getByRole('group', { name: 'Areas of focus' });
  await expect(diagram).toBeVisible();
  await expect(diagram.locator('.focus-venn-graphic')).toBeVisible();

  const links = [
    ['Software: Full-stack digital products.', '#work'],
    ['Research: Evidence, policy and social science.', '#research'],
    ['People: Supporting communities.', '#about']
  ];
  for (const [name, href] of links) {
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }

  const hotspotsFit = await page.locator('.focus-hotspot').evaluateAll(elements => {
    const container = document.querySelector('.focus-venn').getBoundingClientRect();
    return elements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 &&
        rect.left >= container.left - 0.5 && rect.right <= container.right + 0.5 &&
        rect.top >= container.top - 0.5 && rect.bottom <= container.bottom + 0.5;
    });
  });
  expect(hotspotsFit).toBe(true);
});
