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

test('completed overlap stays still at the viewport exit boundary without more scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: page.viewportSize().width, height: 480 });
  await page.goto('/#about');
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  const stack = page.locator('[data-focus-overlap]');
  await expect(stack).toHaveClass(/is-overlapped/);
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);

  // Leave fully first: a genuine leave-and-return visit must still replay.
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(stack).not.toHaveClass(/is-overlapped/);
  await expect.poll(() => stack.evaluate(element => {
    const gap = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return Array.from(element.querySelectorAll(':scope > section')).slice(1).every(section =>
      Math.abs(parseFloat(getComputedStyle(section).marginBlockStart) - gap) < .5
      && !section.getAnimations().some(animation => animation.playState === 'running')
    );
  })).toBe(true);

  const boundary = await stack.evaluate(element => ({
    top: element.getBoundingClientRect().bottom + scrollY - 10,
    maxScroll: document.documentElement.scrollHeight - innerHeight
  }));
  expect(boundary.top).toBeGreaterThanOrEqual(0);
  expect(boundary.top, 'The 10 px tail must be reachable without scroll clamping').toBeLessThanOrEqual(boundary.maxScroll);

  const { samples, completedAt } = await stack.evaluate(async (element, top) => {
    const sections = Array.from(element.querySelectorAll(':scope > section'));
    let transitionStarted = false;
    let completedAt = null;
    const onTransitionRun = event => {
      if (sections.includes(event.target)) transitionStarted = true;
    };
    element.addEventListener('transitionrun', onTransitionRun);
    const snapshot = elapsed => {
      const rect = element.getBoundingClientRect();
      const overlapped = element.classList.contains('is-overlapped');
      const running = sections.some(section => section.getAnimations().some(animation => animation.playState === 'running'));
      if (running) transitionStarted = true;
      if (transitionStarted && overlapped && !running && completedAt === null) completedAt = elapsed;
      return {
        elapsed,
        overlapped,
        stackTop: rect.top + scrollY,
        stackBottom: rect.bottom + scrollY,
        stackHeight: rect.height,
        scrollY,
        sectionTops: sections.map(section => section.getBoundingClientRect().top + scrollY)
      };
    };
    const records = [snapshot(0)];
    window.scrollTo({ top, behavior: 'instant' });
    const started = performance.now();
    await new Promise(resolve => {
      const sample = now => {
        const elapsed = now - started;
        records.push(snapshot(elapsed));
        const observedAfterCompletion = completedAt !== null && elapsed - completedAt >= 2000;
        if (!observedAfterCompletion && elapsed < 6000) requestAnimationFrame(sample);
        else resolve();
      };
      requestAnimationFrame(sample);
    });
    element.removeEventListener('transitionrun', onTransitionRun);
    return { samples: records, completedAt };
  }, boundary.top);

  console.log('Overlap boundary samples', JSON.stringify({
    completedAt,
    samples: samples.filter((sample, index) => index === 0 || index === samples.length - 1
      || sample.overlapped !== samples[index - 1].overlapped
      || sample.scrollY !== samples[index - 1].scrollY
      || Math.abs(sample.elapsed - completedAt) < 50)
  }));
  const entries = samples.slice(1).filter((sample, index) => sample.overlapped && !samples[index].overlapped).length;
  expect(entries, 'The stack must not repeatedly re-enter itself while the visitor is still').toBeLessThanOrEqual(1);

  // Start the stability window at actual completion, not a fixed timing guess.
  // The six-second ceiling also catches loops that never reach a completed state.
  expect(completedAt, 'The first overlap transition never completed').not.toBeNull();
  expect(samples[samples.length - 1].elapsed - completedAt).toBeGreaterThanOrEqual(2000);
  const settled = samples.filter(sample => sample.elapsed >= completedAt);
  expect(settled.length).toBeGreaterThan(1);
  const drift = values => Math.max(...values) - Math.min(...values);
  for (const key of ['stackTop', 'stackBottom', 'stackHeight', 'scrollY']) {
    expect(drift(settled.map(sample => sample[key])), `${key} changed after the overlap completed`).toBeLessThanOrEqual(1);
  }
  for (let index = 0; index < settled[0].sectionTops.length; index++) {
    expect(drift(settled.map(sample => sample.sectionTops[index])), `Focus card ${index + 1} moved after the overlap completed`).toBeLessThanOrEqual(1);
  }
});
