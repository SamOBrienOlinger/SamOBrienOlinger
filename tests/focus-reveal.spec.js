const { test, expect } = require('@playwright/test');

const stackSelector = '[data-focus-reveal]';
const panelSelector = `${stackSelector} > section > .focus-overview`;
const panelIds = ['software-panel', 'research-panel', 'people-panel'];

test.beforeEach(({}, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Exercise the complete layout matrix once per browser engine.');
});

async function expectClearCards(page, phase) {
  const layout = await page.locator(panelSelector).evaluateAll(cards => {
    const boxes = cards.map(card => card.getBoundingClientRect());
    return {
      count: cards.length,
      gaps: boxes.slice(1).map((box, index) => box.top - boxes[index].bottom),
      readable: cards.every(card => getComputedStyle(card).opacity === '1'
        && getComputedStyle(card).visibility === 'visible'),
      animations: cards.reduce((count, card) => count + card.getAnimations().length, 0),
      positiveArea: boxes.every(box => box.width > 0 && box.height > 0),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  expect(layout.count, phase).toBe(3);
  expect(layout.positiveArea, phase).toBe(true);
  expect(Math.min(...layout.gaps), `${phase}: cards cover one another: ${JSON.stringify(layout)}`).toBeGreaterThan(0);
  expect(layout.readable, `${phase}: a card is hidden`).toBe(true);
  expect(layout.animations, `${phase}: the fallback should be static`).toBe(0);
  expect(layout.overflow, `${phase}: horizontal page overflow`).toBeLessThanOrEqual(1);
}

async function checkStaticMatrix(page) {
  await page.goto('/#about');
  await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
  await expect(page.locator(`${panelSelector} > summary h3`)).toHaveText(['Software', 'Research', 'People']);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      const phase = `${width}px / ${size} text`;
      await expectClearCards(page, `${phase}, closed`);
      if (width === 1440 && size === '100%') {
        const columns = await page.locator('.about-layout').evaluate(element => {
          const left = element.querySelector('.about-intro').getBoundingClientRect();
          const right = element.querySelector('.about-copy').getBoundingClientRect();
          return { separated: right.left > left.right, aligned: Math.abs(left.top - right.top) < 1 };
        });
        expect(columns, 'The normal desktop About/Venn layout retains two columns').toEqual({ separated: true, aligned: true });
      }
      // Accumulate all three open panels, then close each with the keyboard.
      for (const id of panelIds) {
        await page.locator(`#${id} > summary .accordion-icon`).click();
        await expect(page.locator(`#${id}`)).toHaveAttribute('open', '');
        await expectClearCards(page, `${phase}, opened ${id}`);
      }
      for (const id of [...panelIds].reverse()) {
        await page.locator(`#${id} > summary`).press('Enter');
        await expect(page.locator(`#${id}`)).not.toHaveAttribute('open', '');
        await expectClearCards(page, `${phase}, closed ${id}`);
      }
    }
  }
}

test('reduced-motion cards stay separate when closed, expanded and enlarged at every layout width', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await checkStaticMatrix(page);
});

test('without JavaScript all cards remain readable, separate and natively expandable', async ({ browser }) => {
  test.setTimeout(60000);
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 320, height: 900 },
    javaScriptEnabled: false, reducedMotion: 'no-preference'
  });
  try {
    await checkStaticMatrix(await context.newPage());
  } finally {
    await context.close();
  }
});

for (const width of [320, 768, 1440]) {
  for (const textSize of ['100%', '200%']) {
    test(`the real card entrances never overlap at ${width}px with ${textSize} text`, async ({ page }) => {
      test.setTimeout(45000);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width, height: 480 });
      await page.goto('/');
      await page.evaluate(async size => {
        document.documentElement.style.fontSize = size;
        await (window.portfolioFontReady || document.fonts.ready);
      }, textSize);
      const stack = page.locator(stackSelector);
      expect(await stack.evaluate(element => element.getBoundingClientRect().top)).toBeGreaterThan(480);
      const result = await stack.evaluate(async element => {
        const sections = Array.from(element.querySelectorAll(':scope > section'));
        const cards = sections.map(section => section.querySelector('.focus-overview'));
        const frame = () => new Promise(requestAnimationFrame);
        const layout = () => sections.flatMap(section => {
          const box = section.getBoundingClientRect();
          return [box.top + scrollY, box.height];
        });
        const originalLayout = layout(), animated = new Set();
        const result = { minGap: Infinity, layoutDrift: 0, settledDrift: 0, frames: 0, movingFrames: 0 };
        let stopped = false, frameId;
        const sample = () => {
          const boxes = cards.map(card => card.getBoundingClientRect());
          result.minGap = Math.min(result.minGap, ...boxes.slice(1).map((box, index) => box.top - boxes[index].bottom));
          result.layoutDrift = Math.max(result.layoutDrift, ...layout().map((value, index) => Math.abs(value - originalLayout[index])));
          cards.forEach((card, index) => { if (card.getAnimations().length) animated.add(index); });
          if (cards.some(card => card.getAnimations().some(animation => animation.playState === 'running'))) result.movingFrames++;
          result.frames++;
          if (!stopped) frameId = requestAnimationFrame(sample);
        };
        sample();
        try {
          for (let index = 0; index < cards.length; index++) {
            sections[index].scrollIntoView({ block: 'center', behavior: 'instant' });
            const deadline = performance.now() + 6000;
            while (!cards[index].getAnimations().length) {
              if (performance.now() > deadline) throw new Error(`Card ${index + 1} never performed its entrance`);
              await frame();
            }
            await Promise.all(cards[index].getAnimations().map(animation => animation.finished));
          }
          const settled = cards.flatMap(card => {
            const box = card.getBoundingClientRect();
            return [box.top + scrollY, box.width, box.height];
          });
          const until = performance.now() + 1200;
          while (performance.now() < until) {
            await frame();
            const current = cards.flatMap(card => {
              const box = card.getBoundingClientRect();
              return [box.top + scrollY, box.width, box.height];
            });
            result.settledDrift = Math.max(result.settledDrift, ...current.map((value, index) => Math.abs(value - settled[index])));
          }
        } finally {
          stopped = true;
          cancelAnimationFrame(frameId);
        }
        return { ...result, animatedCards: animated.size,
          finalOpacity: cards.map(card => Number(getComputedStyle(card).opacity)) };
      });
      const diagnostics = JSON.stringify(result);
      expect(result.animatedCards, 'All three cards must exercise real entrance animations').toBe(3);
      expect(result.finalOpacity, 'Every completed card must remain readable').toEqual([1, 1, 1]);
      expect(result.movingFrames).toBeGreaterThan(1);
      expect(result.minGap, `Cards touched or overlapped during an entrance: ${diagnostics}`).toBeGreaterThan(0);
      expect(result.layoutDrift, `An entrance changed the reserved layout: ${diagnostics}`).toBeLessThanOrEqual(1);
      expect(result.settledDrift, `Cards moved after their entrances finished: ${diagnostics}`).toBeLessThanOrEqual(1);
    });
  }
}

test('completed cards and Venn stay fixed when scrolling away and returning', async ({ page }) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: page.viewportSize().width, height: 480 });
  await page.goto('/');
  await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
  const stack = page.locator(stackSelector), diagram = page.locator('[data-credentials-venn]');
  for (const section of await stack.locator(':scope > section').all()) {
    await section.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const card = section.locator('.focus-overview');
    await expect.poll(() => card.evaluate(element => element.getAnimations().length)).toBeGreaterThan(0);
    await card.evaluate(async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); });
  }
  await diagram.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect.poll(() => diagram.evaluate(element => element.getAnimations({ subtree: true }).length)).toBeGreaterThan(0);
  await diagram.evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)); });
  const result = await page.evaluate(async () => {
    const stack = document.querySelector('[data-focus-reveal]');
    const cards = Array.from(stack.querySelectorAll(':scope > section > .focus-overview'));
    const diagram = document.querySelector('[data-credentials-venn]');
    const geometry = () => [document.documentElement.scrollHeight, ...[...cards, diagram].flatMap(element => {
      const box = element.getBoundingClientRect();
      return [box.top + scrollY, box.left + scrollX, box.width, box.height];
    })];
    const baseline = geometry();
    const report = { drift: 0, minGap: Infinity, restarted: 0, faded: false, samples: 0 };
    const onStart = () => { report.restarted++; };
    stack.addEventListener('animationstart', onStart);
    diagram.addEventListener('animationstart', onStart);
    try {
      for (const destination of [null, stack, diagram]) {
        if (destination) destination.scrollIntoView({ block: 'center', behavior: 'instant' });
        else window.scrollTo({ top: 0, behavior: 'instant' });
        const until = performance.now() + 1500;
        while (performance.now() < until) {
          await new Promise(requestAnimationFrame);
          report.drift = Math.max(report.drift, ...geometry().map((value, index) => Math.abs(value - baseline[index])));
          const boxes = cards.map(card => card.getBoundingClientRect());
          report.minGap = Math.min(report.minGap, ...boxes.slice(1).map((box, index) => box.top - boxes[index].bottom));
          const visibleContent = [...cards, ...diagram.querySelectorAll('[data-credential-circle], [data-credential-label], [data-overlap-circles]')];
          report.faded ||= visibleContent.some(element => Number(getComputedStyle(element).opacity) !== 1);
          report.samples++;
        }
      }
    } finally {
      stack.removeEventListener('animationstart', onStart);
      diagram.removeEventListener('animationstart', onStart);
    }
    return report;
  });
  expect(result.samples).toBeGreaterThan(1);
  expect(result.minGap).toBeGreaterThan(0);
  expect(result.restarted, 'Returning must not restart a completed entrance').toBe(0);
  expect(result.faded, 'Settled cards and diagram must remain visible').toBe(false);
  expect(result.drift, `Completed card/Venn geometry changed: ${JSON.stringify(result)}`).toBeLessThanOrEqual(1);
});
