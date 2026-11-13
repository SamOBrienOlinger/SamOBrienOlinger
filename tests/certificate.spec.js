const { test, expect } = require('@playwright/test');

const certificatePath = 'assets/images/credentials/phd-sociology-certificate.jpg';

test.beforeEach(({}, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Check the certificate viewer once per browser engine.');
});

async function expectCompleteCertificate(dialog) {
  const image = dialog.locator('.certificate-image img');
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute('src', certificatePath);
  // The element deliberately letterboxes the portrait within the available stage.
  await expect(image).toHaveCSS('object-fit', 'contain');
  const fit = await image.evaluate(element => {
    const image = element.getBoundingClientRect();
    const stage = element.closest('.certificate-image').getBoundingClientRect();
    const modal = element.closest('dialog').getBoundingClientRect();
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const inside = (box, parent) => box.left >= parent.left - 1 && box.top >= parent.top - 1
      && box.right <= parent.right + 1 && box.bottom <= parent.bottom + 1;
    return {
      portrait: element.naturalHeight > element.naturalWidth,
      positiveArea: image.width > 0 && image.height > 0,
      imageInStage: inside(image, stage), imageInDialog: inside(image, modal),
      imageInViewport: inside(image, viewport), dialogInViewport: inside(modal, viewport)
    };
  });
  expect(fit, 'The full original portrait must fit without being clipped by the stage or viewport').toEqual({
    portrait: true, positiveArea: true, imageInStage: true, imageInDialog: true,
    imageInViewport: true, dialogInViewport: true
  });
}

test('the certificate fits small and desktop screens, restores focus, and keeps the background still', async ({ page, browserName }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#career-background');
  await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
  const opener = page.getByRole('link', { name: 'PhD in Sociology', exact: true });
  const dialog = page.getByRole('dialog', { name: 'PhD in Sociology', exact: true });
  const close = dialog.getByRole('button', { name: 'Close certificate', exact: true });
  await expect(opener).toHaveAttribute('href', certificatePath);
  await expect(opener).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(opener).toHaveAttribute('aria-controls', 'phd-certificate-dialog');
  for (const viewport of [{ width: 320, height: 568 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    for (const textSize of ['100%', '200%']) {
      await page.evaluate(size => { document.documentElement.style.fontSize = size; }, textSize);
      await opener.scrollIntoViewIfNeeded();
      const before = await opener.evaluate(element => ({ top: element.getBoundingClientRect().top, scrollY }));
      const url = page.url();
      if (textSize === '100%') await opener.click();
      else await opener.press('Enter');
      await expect(dialog).toBeVisible();
      await expect(page).toHaveURL(url);
      await expectCompleteCertificate(dialog);
      await expect(close).toBeInViewport({ ratio: 1 });
      // The modal displays the original JPEG directly; no separate full-size link is needed.
      await expect(dialog.locator('.certificate-image img')).toHaveAttribute('src', certificatePath);
      // Mobile WebKit has no mouse-wheel API. Keep its keyboard scrolling
      // coverage here and exercise real wheel input in a desktop context below.
      if (browserName !== 'webkit') {
        await page.mouse.move(1, 1);
        await page.mouse.wheel(0, 400);
      }
      await page.keyboard.press('PageDown');
      const drift = await opener.evaluate(async (element, top) => {
        let maximum = 0;
        const until = performance.now() + 250;
        do {
          await new Promise(requestAnimationFrame);
          maximum = Math.max(maximum, Math.abs(element.getBoundingClientRect().top - top));
        } while (performance.now() < until);
        return maximum;
      }, before.top);
      expect(drift, `${viewport.width}px / ${textSize}: the background moved behind the dialog`).toBeLessThanOrEqual(1);
      if (textSize === '100%') await close.click();
      else await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
      await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - before.scrollY), {
        message: 'Closing the certificate restores the original page position'
      }).toBeLessThanOrEqual(1);
    }
  }
});

test('desktop wheel input cannot scroll the page behind the certificate', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 900 },
    isMobile: false, hasTouch: false, reducedMotion: 'reduce'
  });
  try {
    const page = await context.newPage();
    await page.goto('/#career-background');
    await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
    const opener = page.getByRole('link', { name: 'PhD in Sociology', exact: true });
    await opener.scrollIntoViewIfNeeded();
    const before = await opener.evaluate(element => ({ top: element.getBoundingClientRect().top, scrollY }));
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'PhD in Sociology', exact: true });
    await expect(dialog).toBeVisible();
    await expectCompleteCertificate(dialog);
    await page.mouse.move(1, 1);
    await page.mouse.wheel(0, 600);
    const drift = await opener.evaluate(async (element, top) => {
      let maximum = 0;
      const until = performance.now() + 250;
      do {
        await new Promise(requestAnimationFrame);
        maximum = Math.max(maximum, Math.abs(element.getBoundingClientRect().top - top));
      } while (performance.now() < until);
      return maximum;
    }, before.top);
    expect(drift, 'Wheel input moved the page behind the modal').toBeLessThanOrEqual(1);
    await dialog.getByRole('button', { name: 'Close certificate', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect.poll(async () => Math.abs(await page.evaluate(() => scrollY) - before.scrollY)).toBeLessThanOrEqual(1);
  } finally {
    await context.close();
  }
});

test('the modal contains keyboard focus and only a backdrop click dismisses the image', async ({ page }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#career-background');
  await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
  const opener = page.getByRole('link', { name: 'PhD in Sociology', exact: true });
  const dialog = page.getByRole('dialog', { name: 'PhD in Sociology', exact: true });
  await opener.press('Enter');
  await expect(dialog).toBeVisible();
  const focusableCount = await dialog.locator('button, a[href], input, select, textarea, [tabindex]').evaluateAll(elements =>
    elements.filter(element => element.tabIndex >= 0 && element.getClientRects().length).length);
  expect(focusableCount).toBeGreaterThan(0);
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let step = 0; step < focusableCount + 2; step++) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate(element => element.contains(document.activeElement)),
        `${key}: keyboard focus escaped the open modal`).toBe(true);
    }
  }
  await dialog.locator('.certificate-image img').click();
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.x, 'Leave visible backdrop space for the dismissal gesture').toBeGreaterThan(2);
  await page.mouse.click(box.x / 2, box.y + Math.min(40, box.height / 2));
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('pointer dismissal keeps focus without a lingering outline, while Escape retains keyboard focus', async ({ page }) => {
  await page.goto('/#career-background');
  const opener = page.getByRole('link', { name: 'PhD in Sociology', exact: true });
  const dialog = page.getByRole('dialog', { name: 'PhD in Sociology', exact: true });
  await opener.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Close certificate', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(opener).toHaveClass(/certificate-pointer-dismissed/);
  await expect(opener).toHaveCSS('outline-style', 'none');

  await opener.press('Enter');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(opener).not.toHaveClass(/certificate-pointer-dismissed/);
});

test('without JavaScript the PhD link opens the original JPEG directly', async ({ browser }) => {
  test.setTimeout(45000);
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 320, height: 568 }, javaScriptEnabled: false
  });
  try {
    const page = await context.newPage();
    await page.goto('/#career-background');
    const opener = page.getByRole('link', { name: 'PhD in Sociology', exact: true });
    await expect(opener).toHaveAttribute('href', certificatePath);
    const [response] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith(certificatePath) && response.request().isNavigationRequest()),
      opener.click()
    ]);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toMatch(/^image\/jpeg/);
    await expect(page).toHaveURL(/\/assets\/images\/credentials\/phd-sociology-certificate\.jpg$/);
    await expect.poll(() => page.locator('img').evaluateAll(images => images.some(image =>
      image.complete && image.naturalWidth > 0 && image.naturalHeight > image.naturalWidth
    ))).toBe(true);
  } finally {
    await context.close();
  }
});
