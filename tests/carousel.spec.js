const { test, expect } = require('@playwright/test');

const projects = ['sct', 'spoodle', 'beaver', 'new-life', 'cockapoo', 'beetlejuice', 'yellowknife', 'allyindex', 'white-whale'];

async function openWork(page, reducedMotion = 'no-preference') {
  await page.emulateMedia({ reducedMotion });
  await page.goto('/#work');
  await page.locator('[data-carousel]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-current-project', 'sct');
}

test('rotation advances, then stays stopped after a real touch and a return to the section', async ({ page }) => {
  await openWork(page);
  const carousel = page.locator('[data-carousel]');
  await expect(page.locator('[data-autoplay], .carousel-play')).toHaveCount(0);
  const track = page.locator('.work-track');
  await expect(track).toHaveClass(/is-animating/, { timeout: 11000 });
  await page.waitForTimeout(300);
  await expect(track).toHaveClass(/is-animating/);
  await expect(carousel).toHaveAttribute('data-current-project', 'spoodle', { timeout: 5000 });
  await page.locator('.carousel-count').tap();
  await expect(carousel).toHaveAttribute('data-rotation', 'paused');
  await page.evaluate(() => window.scrollTo(0, 0));
  await carousel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(9000);
  await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  await page.getByRole('button', { name: 'Next project', exact: true }).click();
  await expect(carousel).toHaveAttribute('data-current-project', 'beaver');
  await expect(carousel).toHaveAttribute('data-rotation', 'paused');
});

test('every project and its images fit the carousel, including both loop boundaries', async ({ page }) => {
  await openWork(page, 'reduce');
  const carousel = page.locator('[data-carousel]');
  await expect(carousel).toHaveAttribute('data-rotation', 'paused');
  await expect(page.locator('.project[data-project]')).toHaveCount(projects.length);
  const controls = await page.locator('.carousel-toolbar button').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  for (const control of controls) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
  for (const project of projects) {
    await expect(carousel).toHaveAttribute('data-current-project', project);
    const card = page.locator(`[data-project="${project}"]`);
    await expect(card).toHaveAttribute('aria-hidden', 'false');
    await expect.poll(() => card.locator('img').evaluateAll(images => images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const fit = await card.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const media = element.querySelector('.project-media').getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1 && media.height > 100
        && element.scrollWidth <= element.clientWidth + 1
        && document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(fit, project).toBe(true);
    await page.getByRole('button', { name: 'Next project', exact: true }).click();
  }
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  await page.getByRole('button', { name: 'Previous project', exact: true }).click();
  await expect(carousel).toHaveAttribute('data-current-project', 'white-whale');
  expect(await page.locator('[data-carousel-clone]').evaluateAll(clones => clones.every(clone => clone.inert && !clone.querySelector('[id]')))).toBe(true);
});

test('keyboard focus stops rotation and offscreen projects stay out of the tab order', async ({ page }) => {
  await openWork(page);
  const carousel = page.locator('[data-carousel]');
  const track = page.locator('.work-track');
  await track.focus();
  await expect(carousel).toHaveAttribute('data-rotation', 'paused');
  await page.keyboard.press('ArrowRight');
  await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  await page.keyboard.press('ArrowLeft');
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  await page.keyboard.press('End');
  await expect(carousel).toHaveAttribute('data-current-project', 'white-whale');
  await page.keyboard.press('Home');
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  const tabState = await page.locator('.project[data-project]').evaluateAll(slides => slides.map(slide => slide.inert));
  expect(tabState).toEqual([false, ...Array(projects.length - 1).fill(true)]);
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-project="sct"] .project-media')).toBeFocused();
});

test('native touch swipes move left and right without navigating the project link', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'Android Chrome 360', 'Native touch gesture injection uses Chromium CDP.');
  await openWork(page, 'reduce');
  const carousel = page.locator('[data-carousel]');
  const session = await context.newCDPSession(page);
  const track = page.locator('.work-track');
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  const y = Math.min(page.viewportSize().height - 80, Math.max(150, box.y + 110));
  async function swipe(from, to) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from, y }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from + (to - from) * step / 8, y }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await swipe(box.x + box.width * .85, box.x + box.width * .15);
  await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  await swipe(box.x + box.width * .15, box.x + box.width * .85);
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  await expect(page).toHaveURL(/\/#work$/);
  await session.detach();
});
