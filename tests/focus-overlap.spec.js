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

test('overlap keeps its completed state on return and respects a changed motion preference', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#about');
  const stack = page.locator('[data-focus-overlap]');
  const research = stack.locator('#research');
  await expect(stack).toHaveClass(/is-overlapped/);
  expect(await research.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('1s');
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);
  // Home can still show the first card at the bottom of a tall viewport.
  // Move fully past the group: leaving must retain the completed layout.
  await page.setViewportSize({ width: page.viewportSize().width, height: 480 });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(stack).toHaveClass(/is-overlapped/);
  await stack.locator('#software-panel > summary').scrollIntoViewIfNeeded();
  await expect(stack).toHaveClass(/is-overlapped/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await research.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);
});

test('completed overlap stays still at the viewport exit boundary without more scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: page.viewportSize().width, height: 480 });
  // Start below the cards without revealing them, so the first entrance still
  // exercises the original 10 px boundary rather than replaying a finished reveal.
  await page.goto('/#contact');
  await page.evaluate(() => (window.portfolioFontReady || document.fonts.ready).then(() => {}));
  const stack = page.locator('[data-focus-overlap]');
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

  const diagnostics = JSON.stringify({
    completedAt,
    samples: samples.filter((sample, index) => index === 0 || index === samples.length - 1
      || sample.overlapped !== samples[index - 1].overlapped
      || sample.scrollY !== samples[index - 1].scrollY
      || Math.abs(sample.elapsed - completedAt) < 50)
  });
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
    expect(drift(settled.map(sample => sample[key])), `${key} changed after the overlap completed: ${diagnostics}`).toBeLessThanOrEqual(1);
  }
  for (let index = 0; index < settled[0].sectionTops.length; index++) {
    expect(drift(settled.map(sample => sample.sectionTops[index])), `Focus card ${index + 1} moved after the overlap completed`).toBeLessThanOrEqual(1);
  }
});

test('leaving completed cards does not move the finished Venn diagram or replay the overlap on return', async ({ page }) => {
  // Include the real Venn reveal and two stability windows, including cold WebKit startup.
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: page.viewportSize().width, height: 480 });
  await page.goto('/#about');
  await page.evaluate(() => (window.portfolioFontReady || document.fonts.ready).then(() => {}));
  const stack = page.locator('[data-focus-overlap]');
  const diagram = page.locator('[data-credentials-venn]');
  await expect(stack).toHaveClass(/is-overlapped/);
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);

  const boundary = await page.locator('.focus-overlap-observer').evaluate(element => ({
    bottom: element.getBoundingClientRect().bottom + scrollY,
    maxScroll: document.documentElement.scrollHeight - innerHeight
  }));
  expect(boundary.bottom - 10).toBeGreaterThanOrEqual(0);
  expect(boundary.bottom + 10, 'The observer exit must be reachable without scroll clamping').toBeLessThanOrEqual(boundary.maxScroll);
  // Keep the observer's last 10 px in view while the visible Venn finishes.
  await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), boundary.bottom - 10);
  await expect(diagram).toHaveClass(/is-revealing/);
  await expect.poll(() => diagram.evaluate(element => {
    const animations = element.getAnimations({ subtree: true });
    return animations.length > 0 && animations.every(animation => animation.playState === 'finished');
  }), { timeout: 10000 }).toBe(true);

  const baseline = await page.evaluate(() => {
    const stack = document.querySelector('[data-focus-overlap]').getBoundingClientRect();
    const diagram = document.querySelector('[data-credentials-venn]').getBoundingClientRect();
    return {
      stackHeight: stack.height,
      vennTop: diagram.top + scrollY,
      pageHeight: document.documentElement.scrollHeight,
      returnTop: Math.max(0, stack.top + scrollY - document.querySelector('.site-header').getBoundingClientRect().height - 20)
    };
  });

  for (const [phase, top] of [['exit', boundary.bottom + 10], ['return', baseline.returnTop]]) {
    const samples = await page.evaluate(async top => {
      const stack = document.querySelector('[data-focus-overlap]');
      const observer = stack.querySelector('.focus-overlap-observer');
      const sections = Array.from(stack.querySelectorAll(':scope > section'));
      const diagram = document.querySelector('[data-credentials-venn]');
      const records = [];
      window.scrollTo({ top, behavior: 'instant' });
      const started = performance.now();
      await new Promise(resolve => {
        const sample = now => {
          records.push({
            elapsed: now - started,
            overlapped: stack.classList.contains('is-overlapped'),
            stackHeight: stack.getBoundingClientRect().height,
            vennTop: diagram.getBoundingClientRect().top + scrollY,
            pageHeight: document.documentElement.scrollHeight,
            scrollY,
            observerBottom: observer.getBoundingClientRect().bottom,
            runningTransitions: sections.flatMap(section => section.getAnimations()).filter(animation => animation.playState === 'running').length
          });
          if (now - started < 2100) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      return records;
    }, top);
    const diagnostics = JSON.stringify({ phase, top, baseline, first: samples[0], last: samples[samples.length - 1] });
    expect(samples[samples.length - 1].elapsed).toBeGreaterThanOrEqual(2100);
    if (phase === 'exit') expect(samples[0].observerBottom, 'The observer must actually leave the viewport').toBeLessThan(-1);
    for (const key of ['vennTop', 'pageHeight', 'stackHeight']) {
      const displacement = Math.max(...samples.map(sample => Math.abs(sample[key] - baseline[key])));
      expect(displacement, `${key} changed on ${phase} after both reveals completed: ${diagnostics}`).toBeLessThanOrEqual(1);
    }
    expect(Math.max(...samples.map(sample => Math.abs(sample.scrollY - top))), `Unexpected scroll correction on ${phase}: ${diagnostics}`).toBeLessThanOrEqual(1);
    expect(samples.every(sample => sample.overlapped), `Completed overlap was reset on ${phase}: ${diagnostics}`).toBe(true);
    expect(samples.every(sample => sample.runningTransitions === 0), `Completed overlap restarted on ${phase}: ${diagnostics}`).toBe(true);
  }
  await expect.poll(async () => (await overlapMetrics(page)).every(pair => Math.abs(pair.ratio - .2) < .005)).toBe(true);
});
