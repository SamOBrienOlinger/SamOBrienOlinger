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

test('completed Venn circles stay settled through height changes while an edge remains visible', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Exercise viewport changes once per browser engine.');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.portfolioFontReady);
  const figure = page.locator('[data-credentials-venn]');
  await figure.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect.poll(() => figure.evaluate(element => element.getAnimations({ subtree: true }).length)).toBeGreaterThan(0);
  await figure.evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
  // Keep the completed graphic partly visible, then mimic browser chrome changing height.
  await figure.evaluate(element => {
    const rect = element.querySelector('svg').getBoundingClientRect();
    window.scrollBy({ top: rect.top - (innerHeight - rect.height * .3), behavior: 'instant' });
  });
  const observe = duration => figure.evaluate(async (element, duration) => {
    const samples = [];
    const started = performance.now();
    do {
      await new Promise(requestAnimationFrame);
      const graphic = element.querySelector('svg').getBoundingClientRect();
      samples.push({
        top: graphic.top, height: graphic.height,
        visible: Math.max(0, Math.min(graphic.bottom, innerHeight) - Math.max(graphic.top, 0)) / graphic.height,
        circles: Array.from(element.querySelectorAll('[data-credential-circle]')).map(circle => {
          const rect = circle.getBoundingClientRect();
          const style = getComputedStyle(circle);
          return {
            opacity: Number(style.opacity), transform: style.transform,
            box: [rect.left - graphic.left, rect.top - graphic.top, rect.width, rect.height]
          };
        })
      });
    } while (performance.now() - started < duration);
    return samples;
  }, duration);
  const baseline = (await observe(100)).at(-1);
  expect(baseline.visible).toBeGreaterThan(.25);
  expect(baseline.visible).toBeLessThan(.4);
  expect(baseline.circles).toHaveLength(4);
  expect(baseline.circles.map(circle => circle.opacity)).toEqual([1, 1, 1, 1]);
  const originalViewport = page.viewportSize();
  await page.setViewportSize({ ...originalViewport, height: Math.round(baseline.top + baseline.height * .1) });
  const smaller = await observe(250);
  expect(smaller.at(-1).visible, 'The graphic must remain visible below the former reset threshold').toBeGreaterThan(0);
  expect(smaller.at(-1).visible).toBeLessThan(.15);
  await page.setViewportSize(originalViewport);
  const restored = await observe(1200);
  for (const sample of [...smaller, ...restored]) {
    expect(sample.visible).toBeGreaterThan(0);
    sample.circles.forEach((circle, index) => {
      const settled = baseline.circles[index];
      expect(circle.opacity, `Circle ${index + 1} faded after completing its reveal`).toBe(settled.opacity);
      expect(circle.transform, `Circle ${index + 1} restarted its movement`).toBe(settled.transform);
      circle.box.forEach((value, coordinate) => {
        expect(Math.abs(value - settled.box[coordinate]), `Circle ${index + 1} moved after completion`).toBeLessThanOrEqual(.75);
      });
    });
  }
});

test('the settled Venn never replays on return, restored history or motion changes', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Check one-time reveal behaviour once per browser engine.');
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.portfolioFontReady);
  const figure = page.locator('[data-credentials-venn]');
  await figure.evaluate(element => {
    element.vennAnimationStarts = 0;
    element.addEventListener('animationstart', () => { element.vennAnimationStarts++; });
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await expect.poll(() => figure.evaluate(element => element.getAnimations({ subtree: true }).length)).toBeGreaterThan(0);
  await figure.evaluate(async element => {
    await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished));
  });
  const observe = duration => figure.evaluate(async (element, duration) => {
    const samples = [], started = performance.now();
    do {
      await new Promise(requestAnimationFrame);
      const graphic = element.querySelector('svg').getBoundingClientRect();
      samples.push({
        starts: element.vennAnimationStarts,
        opacity: Array.from(element.querySelectorAll('[data-credential-circle], [data-credential-label], [data-overlap-circles]'))
          .map(node => Number(getComputedStyle(node).opacity)),
        circles: Array.from(element.querySelectorAll('[data-credential-circle]')).map(circle => {
          const rect = circle.getBoundingClientRect();
          return [rect.left - graphic.left, rect.top - graphic.top, rect.width, rect.height];
        })
      });
    } while (performance.now() - started < duration);
    return samples;
  }, duration);
  const baseline = (await observe(50)).at(-1);
  expect(baseline.starts, 'The first visit must exercise real entrance animations').toBeGreaterThan(0);
  expect(baseline.opacity.every(opacity => opacity === 1)).toBe(true);
  const samples = [];
  const record = async (stage, duration) => {
    for (const sample of await observe(duration)) samples.push({ stage, ...sample });
  };
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(figure).not.toBeInViewport();
  await record('fully outside viewport', 150);
  await figure.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(figure).toBeInViewport({ ratio: .25 });
  await record('returned to viewport', 1200);
  // Exercise the real restoration handler without depending on CI bfcache eligibility.
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await record('persisted pageshow', 1200);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await record('reduced motion', 150);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await record('motion re-enabled', 1200);
  for (const sample of samples) {
    expect(sample.starts, `${sample.stage}: a completed animation restarted`).toBe(baseline.starts);
    expect(sample.opacity, `${sample.stage}: settled circles, labels or overlaps faded`).toEqual(baseline.opacity);
    sample.circles.forEach((circle, index) => circle.forEach((value, coordinate) => {
      expect(Math.abs(value - baseline.circles[index][coordinate]),
        `${sample.stage}: circle ${index + 1} moved after completion`).toBeLessThanOrEqual(.75);
    }));
  }
});
