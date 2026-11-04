const { test, expect } = require('@playwright/test');

test('the first completed Venn reveal stays fixed when delayed fonts arrive', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Check animation stability once per browser engine.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let releaseFonts;
  const fontGate = new Promise(resolve => { releaseFonts = resolve; });
  const intercepted = new Set();
  await page.route(/TogetherSans-(Medium|Bold)\.woff2(?:\?.*)?$/, async route => {
    intercepted.add(route.request().url().match(/TogetherSans-(Medium|Bold)/)[1]);
    await fontGate;
    await route.continue();
  });
  await page.exposeFunction('releaseVennTestFonts', releaseFonts);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // A fix may wait for fonts before revealing; the fallback lets it proceed.
  const fallback = setTimeout(releaseFonts, 6000);
  try {
    const figure = page.locator('[data-credentials-venn]');
    await figure.evaluate(diagram => diagram.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const result = await figure.evaluate(async diagram => {
      const frame = () => new Promise(requestAnimationFrame);
      const deadline = performance.now() + 20000;
      let animations = [];
      while (!animations.length) {
        if (performance.now() > deadline) throw new Error('The Venn never started its reveal');
        animations = diagram.getAnimations({ subtree: true });
        await frame();
      }
      // Wait for the actual circles, labels and overlap fades, not guessed CSS durations.
      await Promise.all(animations.map(animation => animation.finished));
      await frame();
      const labels = Array.from(diagram.querySelectorAll('[data-credential-label]'));
      const measure = () => {
        const figureBox = diagram.getBoundingClientRect();
        const relative = rect => [rect.left - figureBox.left, rect.top - figureBox.top, rect.width, rect.height];
        const boxes = { figure: [figureBox.left + scrollX, figureBox.top + scrollY, figureBox.width, figureBox.height] };
        labels.forEach((label, index) => {
          boxes[`label ${index + 1}`] = relative(label.getBoundingClientRect());
          // Text fragments catch changed wrapping/alignment inside an unchanged label box.
          const range = document.createRange();
          range.selectNodeContents(label);
          boxes[`label ${index + 1} text`] = Array.from(range.getClientRects())
            .filter(rect => rect.width > 0 && rect.height > 0).flatMap(relative);
        });
        return boxes;
      };
      const baseline = measure();
      const drift = {};
      let fontsReadyAt;
      document.fonts.ready.then(() => { fontsReadyAt = performance.now(); });
      // Preserve the first settled frame before allowing either delayed response through.
      await window.releaseVennTestFonts();
      let latest;
      do {
        await frame();
        latest = measure();
        for (const [name, before] of Object.entries(baseline)) {
          const after = latest[name];
          if (before.length !== after.length) drift[name] = 'text fragment count changed';
          else {
            const distance = Math.max(...before.map((value, index) => Math.abs(value - after[index])));
            if (distance > 1 && typeof drift[name] !== 'string') {
              drift[name] = Math.max(drift[name] || 0, distance);
            }
          }
        }
        if (performance.now() > deadline) throw new Error('Fonts did not settle during the stability check');
      } while (fontsReadyAt === undefined || performance.now() - fontsReadyAt < 1500);
      return {
        drift, baseline, latest, labelCount: labels.length,
        fontsLoaded: document.fonts.check('500 16px "Together Sans"')
          && document.fonts.check('700 16px "Together Sans"')
      };
    });
    expect([...intercepted].sort(), 'Both label font weights must exercise the delayed response').toEqual(['Bold', 'Medium']);
    expect(result.labelCount).toBe(4);
    expect(result.fontsLoaded).toBe(true);
    expect(result.drift, `Movement after the first completed reveal (CSS pixels): ${JSON.stringify(result)}`).toEqual({});
  } finally {
    clearTimeout(fallback);
    releaseFonts();
  }
});

test('stalled fonts cannot hide the diagram or shift it when they eventually arrive', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Check the stalled-font fallback once per browser engine.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  let releaseFonts;
  const gate = new Promise(resolve => { releaseFonts = resolve; });
  await page.route(/TogetherSans-(Medium|Bold)\.woff2(?:\?.*)?$/, async route => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const figure = page.locator('[data-credentials-venn]');
    await figure.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect.poll(() => figure.evaluate(element =>
      Array.from(element.querySelectorAll('[data-credential-label], [data-credential-circle]')).every(node =>
        Number(getComputedStyle(node).opacity) === 1)
    ), { timeout: 16000, message: 'The diagram must become readable even while the font requests are stalled' }).toBe(true);
    const measure = () => figure.evaluate(element => Array.from(element.querySelectorAll('[data-credential-label]')).map(label => {
      const rect = label.getBoundingClientRect();
      return [rect.left + scrollX, rect.top + scrollY, rect.width, rect.height];
    }));
    const baseline = await measure();
    const responses = Promise.all(['Medium', 'Bold'].map(weight => page.waitForResponse(response =>
      response.url().includes(`TogetherSans-${weight}.woff2`))));
    releaseFonts();
    await responses;
    await page.evaluate(() => document.fonts.ready.then(() => {}));
    const after = await measure();
    expect(after).toEqual(baseline);
  } finally {
    releaseFonts();
  }
});
