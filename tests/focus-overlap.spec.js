const { test, expect } = require('@playwright/test');

async function overlapMetrics(page) {
  return page.locator('[data-focus-overlap] > section').evaluateAll(sections => sections.slice(1).map((section, index) => {
    const previous = sections[index].getBoundingClientRect();
    const current = section.getBoundingClientRect();
    const previousIcon = sections[index].querySelector('.accordion-icon').getBoundingClientRect();
    const currentLabel = section.querySelector('.focus-label').getBoundingClientRect();
    return {
      ratio: (previous.bottom - current.top) / Math.min(previous.height, current.height),
      previousControlClear: previousIcon.bottom < current.top,
      currentLabelClear: currentLabel.top > previous.bottom
    };
  }));
}

test('closed focus cards overlap by 20% without covering their text or controls', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#about');
  const stack = page.locator('[data-focus-overlap]');
  await expect(stack).toHaveClass(/is-overlapped/);
  const widths = [page.viewportSize().width];
  if (testInfo.project.name === 'Android Chrome 360') widths.push(768, 1440);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => document.documentElement.style.fontSize = value, size);
      await expect.poll(async () => (await overlapMetrics(page)).every(pair =>
        Math.abs(pair.ratio - .2) < .005 && pair.previousControlClear && pair.currentLabelClear
      )).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  }
});

test('opening any focus card separates the stack and closing restores the overlap', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#about');
  const stack = page.locator('[data-focus-overlap]');
  for (const id of ['software-panel', 'research-panel', 'people-panel']) {
    const summary = page.locator(`#${id} > summary`);
    const icon = summary.locator('.accordion-icon');
    await icon.scrollIntoViewIfNeeded();
    // The visible control itself must receive pointer input, even in the stack.
    await icon.click();
    await expect(page.locator(`#${id}`)).toHaveAttribute('open', '');
    await expect(stack).toHaveClass(/has-open-panel/);
    expect((await overlapMetrics(page)).every(pair => pair.ratio < 0)).toBe(true);
    await summary.press('Enter');
    await expect(stack).not.toHaveClass(/has-open-panel/);
    await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);
  }
});

test('overlap animates on scroll and respects a changed motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#about');
  const stack = page.locator('[data-focus-overlap]');
  const research = stack.locator('#research');
  await expect(stack).toHaveClass(/is-overlapped/);
  expect(await research.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('1s');
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);
  // Home can still show the first card at the bottom of a tall viewport.
  // Move fully past the group to exercise an actual leave-and-return visit.
  await page.setViewportSize({ width: page.viewportSize().width, height: 480 });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(stack).not.toHaveClass(/is-overlapped/);
  await stack.locator('#software-panel > summary').scrollIntoViewIfNeeded();
  await expect(stack).toHaveClass(/is-overlapped/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await research.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);
});
