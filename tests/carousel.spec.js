const { test, expect } = require('@playwright/test');

const projects = ['sct', 'spoodle', 'beaver', 'new-life', 'both-sides', 'beetlejuice', 'yellowknife', 'allyindex', 'white-whale'];
const photos = ['council-group', 'council-chamber', 'community-certificates'];
const slides = [...projects, ...photos];

async function openWork(page, reducedMotion = 'no-preference') {
  await page.emulateMedia({ reducedMotion });
  await page.goto('/#work');
  await page.locator('[data-carousel]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-current-project', 'sct');
}

test('rotation advances, then stays stopped after a real touch and a return to the section', async ({ page }) => {
  // A cold WebKit page can take ~21s to start on CI before this real-time
  // 7s rotation + 9s pause check begins. Keep the behaviour assertions intact.
  test.setTimeout(60000);
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
  await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  await expect(carousel).toHaveAttribute('data-current-project', 'beaver');
  await expect(carousel).toHaveAttribute('data-rotation', 'paused');
});

test('every project and community photo fits the carousel, including both loop boundaries', async ({ page }) => {
  await openWork(page, 'reduce');
  const carousel = page.locator('[data-carousel]');
  await expect(carousel).toHaveAttribute('data-rotation', 'paused');
  await expect(page.locator('.project[data-project]')).toHaveCount(projects.length);
  await expect(page.locator('.photo-slide[data-photo]')).toHaveCount(photos.length);
  await expect(carousel.locator('.carousel-total')).toHaveText('/ 12');
  const controls = await page.locator('.carousel-toolbar button').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  for (const control of controls) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
  }
  for (const [index, slide] of slides.entries()) {
    await expect(carousel).toHaveAttribute('data-current-project', slide);
    const card = page.locator(`[data-project="${slide}"], [data-photo="${slide}"]`);
    await expect(card).toHaveAttribute('aria-hidden', 'false');
    await expect(card).toHaveAttribute('aria-label', new RegExp(`^${index + 1} of ${slides.length}:`));
    await expect.poll(() => card.locator('img').evaluateAll(images => images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const fit = await card.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const media = element.querySelector('.project-media').getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1 && media.height > 100
        && element.scrollWidth <= element.clientWidth + 1
        && document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(fit, slide).toBe(true);
    if (photos.includes(slide)) {
      await expect.poll(() => card.evaluate(element => {
        const track = element.closest('.work-track').getBoundingClientRect();
        const media = element.querySelector('.project-media').getBoundingClientRect();
        return Math.abs(track.height - media.height);
      }), { message: `${slide}: the photo frame should fill the track without a blank lower half` }).toBeLessThanOrEqual(1);
      const image = card.locator('img');
      const link = card.locator('a.project-media');
      await expect(image).toHaveCount(1);
      await expect(link).toHaveAttribute('href', await image.getAttribute('src'));
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /(?:^|\s)noopener(?:\s|$)/);
      const alt = (await image.getAttribute('alt')) || '';
      expect(alt.trim().split(/\s+/).length, `${slide}: descriptive photo alternative`).toBeGreaterThanOrEqual(6);
      expect(alt).toMatch(slide === 'community-certificates' ? /certificates/i : /council chamber/i);
    }
    await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  }
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  await page.getByRole('button', { name: 'Previous slide', exact: true }).click();
  await expect(carousel).toHaveAttribute('data-current-project', 'community-certificates');
  expect(await page.locator('[data-carousel-clone]').evaluateAll(clones => clones.every(clone => clone.inert && !clone.hasAttribute('data-project') && !clone.hasAttribute('data-photo') && !clone.querySelector('[id]')))).toBe(true);
});

test('keyboard focus stops rotation and offscreen slides stay out of the tab order', async ({ page }) => {
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
  await expect(carousel).toHaveAttribute('data-current-project', 'community-certificates');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-photo="community-certificates"] .project-media')).toBeFocused();
  await track.focus();
  await page.keyboard.press('Home');
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  const tabState = await page.locator('.project[data-project], .project[data-photo]').evaluateAll(items => items.map(slide => slide.inert));
  expect(tabState).toEqual([false, ...Array(slides.length - 1).fill(true)]);
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
