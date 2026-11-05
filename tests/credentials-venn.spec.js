const { test, expect } = require('@playwright/test');

const statements = [
  'PhD in Sociology',
  'Diploma in Full Stack Software Development',
  'Over a decade working in the Community & Voluntary sector',
  'Co-founder of Local Community Group'
];
const emphasis = [
  'Sociology',
  'Full Stack Software Development',
  'Community & Voluntary sector',
  'Local Community Group'
];

test.beforeEach(({}, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Exercise the complete width matrix once per browser engine.');
});

async function expectReadableLabels(page, { minimumFontSize = 14, allowDiagramScroll = false } = {}) {
  const figure = page.locator('[data-credentials-venn]');
  await expect(figure.locator('.credential-statement')).toHaveText(statements);
  await expect(figure.locator('.credential-statement .credential-accent')).toHaveText(emphasis);
  await expect(figure.locator('.credential-key, .credential-marker')).toHaveCount(0);
  await page.evaluate(async () => { await document.fonts.ready; });

  // Measure the actual wrapped lines against the circles. A whole label rectangle
  // includes empty corners, while a numbered key below the SVG would hide a
  // regression in the intended in-circle layout.
  await expect.poll(() => figure.evaluate((diagram, options) => {
    const problems = [];
    const frame = diagram.getBoundingClientRect();
    const canvas = diagram.querySelector('.credentials-venn-canvas').getBoundingClientRect();
    const paragraphs = Array.from(diagram.querySelectorAll('.credential-statement'));
    const bounds = paragraphs.map(paragraph => paragraph.getBoundingClientRect());
    const inside = (rect, container) => rect.left >= container.left - 1 && rect.right <= container.right + 1
      && rect.top >= container.top - 1 && rect.bottom <= container.bottom + 1;
    const circles = Array.from(diagram.querySelectorAll('[data-credential-circle] > circle')).map(circle => {
      const matrix = circle.getScreenCTM();
      const centre = new DOMPoint(circle.cx.baseVal.value, circle.cy.baseVal.value).matrixTransform(matrix);
      return { x: centre.x, y: centre.y, radius: circle.r.baseVal.value * Math.hypot(matrix.a, matrix.b) };
    });
    const tolerance = .75; // Allow only subpixel differences between browser font measurements.

    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      problems.push('horizontal page overflow');
    }
    if (circles.length !== 4) return ['the four-circle diagram is missing'];
    if (!(circles[0].x < circles[1].x && circles[0].y < circles[2].y
      && Math.abs(circles[0].x - circles[2].x) < 1 && Math.abs(circles[1].x - circles[3].x) < 1
      && Math.abs(circles[0].y - circles[1].y) < 1 && Math.abs(circles[2].y - circles[3].y) < 1)) {
      problems.push('circles no longer form the two-by-two Venn diagram');
    }
    const centreX = circles.reduce((sum, circle) => sum + circle.x, 0) / circles.length;
    const centreY = circles.reduce((sum, circle) => sum + circle.y, 0) / circles.length;
    if (circles.some(circle => Math.hypot(centreX - circle.x, centreY - circle.y) >= circle.radius)) {
      problems.push('the circles no longer share their central intersection');
    }
    if (diagram.scrollWidth > diagram.clientWidth + 1) {
      if (!options.allowDiagramScroll) problems.push('the diagram scrolls at normal text size');
      if (!['auto', 'scroll'].includes(getComputedStyle(diagram).overflowX)) {
        problems.push('enlarged diagram content is unreachable');
      }
      if (diagram.tabIndex < 0) problems.push('the scrollable diagram cannot receive keyboard focus');
    }
    paragraphs.forEach((paragraph, index) => {
      const label = paragraph.closest('[data-credential-label]');
      const rect = bounds[index];
      if (!label || !inside(label.getBoundingClientRect(), canvas) || !inside(rect, canvas)) {
        problems.push(`label ${index + 1} leaves the diagram canvas`);
      }
      if (!options.allowDiagramScroll && !inside(rect, frame)) {
        problems.push(`label ${index + 1} is outside the visible figure`);
      }
      if (rect.width <= 0 || rect.height <= 0) problems.push(`label ${index + 1} has no rendered area`);
      if (paragraph.scrollWidth > paragraph.clientWidth + 1 || paragraph.scrollHeight > paragraph.clientHeight + 1) {
        problems.push(`label ${index + 1} clips or overflows its text box`);
      }
      for (const element of [paragraph, ...paragraph.querySelectorAll('*')]) {
        if (element.textContent.trim() && parseFloat(getComputedStyle(element).fontSize) < options.minimumFontSize - .01) {
          problems.push(`label ${index + 1} contains text smaller than ${options.minimumFontSize}px`);
        }
      }
      const accent = getComputedStyle(paragraph.querySelector('.credential-accent'));
      if (accent.color !== 'rgb(255, 207, 132)' || Number(accent.fontWeight) < 700) {
        problems.push(`label ${index + 1} lost its bold gold highlight`);
      }
      for (let ancestor = paragraph; ancestor && ancestor !== diagram.parentElement; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) < .99) {
          problems.push(`label ${index + 1} is hidden or faded`);
          break;
        }
      }
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        for (const line of Array.from(range.getClientRects()).filter(line => line.width > 0 && line.height > 0)) {
          if (!inside(line, canvas)) problems.push(`label ${index + 1} has text outside the diagram canvas`);
          circles.forEach((circle, circleIndex) => {
            if (circleIndex === index) {
              const farthestCorner = Math.max(...[line.left, line.right].flatMap(x =>
                [line.top, line.bottom].map(y => Math.hypot(x - circle.x, y - circle.y))));
              if (farthestCorner > circle.radius + tolerance) {
                problems.push(`label ${index + 1} has a text line outside its own circle`);
              }
            } else {
              const nearestX = Math.max(line.left - circle.x, 0, circle.x - line.right);
              const nearestY = Math.max(line.top - circle.y, 0, circle.y - line.bottom);
              if (Math.hypot(nearestX, nearestY) < circle.radius - tolerance) {
                problems.push(`label ${index + 1} has text over the light overlap with circle ${circleIndex + 1}`);
              }
            }
          });
        }
      }
    });
    bounds.forEach((rect, index) => {
      bounds.slice(index + 1).forEach((other, offset) => {
        if (Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 1
          && Math.min(rect.bottom, other.bottom) - Math.max(rect.top, other.top) > 1) {
          problems.push(`labels ${index + 1} and ${index + offset + 2} overlap`);
        }
      });
    });
    if (problems.length) {
      const round = value => Math.round(value * 1000) / 1000;
      const relativeRect = rect => ({
        left: round(rect.left - canvas.left), top: round(rect.top - canvas.top),
        right: round(rect.right - canvas.left), bottom: round(rect.bottom - canvas.top),
        width: round(rect.width), height: round(rect.height)
      });
      const textStyle = element => {
        const style = getComputedStyle(element);
        return {
          fontSize: style.fontSize, fontFamily: style.fontFamily, fontWeight: style.fontWeight,
          lineHeight: style.lineHeight, textSizeAdjust: style.textSizeAdjust,
          webkitTextSizeAdjust: style.webkitTextSizeAdjust, width: style.width, maxWidth: style.maxWidth
        };
      };
      const diagnostics = {
        viewport: {
          width: window.innerWidth, height: window.innerHeight,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          visual: window.visualViewport && {
            width: window.visualViewport.width, height: window.visualViewport.height,
            scale: window.visualViewport.scale, offsetLeft: window.visualViewport.offsetLeft,
            offsetTop: window.visualViewport.offsetTop
          }
        },
        rootFont: getComputedStyle(document.documentElement).fontSize,
        frame: { ...relativeRect(frame), scrollLeft: diagram.scrollLeft, scrollWidth: diagram.scrollWidth },
        canvas: { left: round(canvas.left), top: round(canvas.top), width: round(canvas.width), height: round(canvas.height) },
        circles: Array.from(diagram.querySelectorAll('[data-credential-circle] > circle')).map((circle, index) => {
          const matrix = circle.getScreenCTM();
          const rect = circle.getBoundingClientRect();
          return {
            ctm: Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f'].map(key => [key, round(matrix[key])])),
            ctmCircle: { x: round(circles[index].x - canvas.left), y: round(circles[index].y - canvas.top), radius: round(circles[index].radius) },
            boundingRect: relativeRect(rect),
            boundingCircle: { x: round((rect.left + rect.right) / 2 - canvas.left), y: round((rect.top + rect.bottom) / 2 - canvas.top), radiusX: round(rect.width / 2), radiusY: round(rect.height / 2) }
          };
        }),
        statements: paragraphs.map(paragraph => {
          const lines = [];
          const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            lines.push({ text: walker.currentNode.textContent, rectangles: Array.from(range.getClientRects()).map(relativeRect) });
          }
          return {
            text: paragraph.textContent, box: relativeRect(paragraph.getBoundingClientRect()),
            label: textStyle(paragraph.closest('[data-credential-label]')),
            paragraph: textStyle(paragraph), prefix: textStyle(paragraph.querySelector('.credential-prefix')),
            accent: textStyle(paragraph.querySelector('.credential-accent')), lines
          };
        }),
        fonts: {
          status: document.fonts.status,
          faces: Array.from(document.fonts).filter(face => face.family.includes('Together Sans')).map(face => ({
            family: face.family, weight: face.weight, style: face.style, status: face.status
          }))
        }
      };
      problems.push(`rendering diagnostics: ${JSON.stringify(diagnostics)}`);
    }
    return problems;
  }, { minimumFontSize, allowDiagramScroll }), {
    message: 'Original statements remain readable inside their circles, clear of light intersections and any legend'
  }).toEqual([]);
}

test('Venn wording, emphasis and readable label layout survive phone, tablet and desktop widths', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 320, height: 900 }, reducedMotion: 'reduce'
  });
  try {
    const page = await context.newPage();
    await page.goto('/#career-background');
    for (const width of [320, 375, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectReadableLabels(page);
    }
  } finally {
    await context.close();
  }
});

test('Venn labels remain inside their circles at 200 percent text size with scrolling confined to the diagram', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 320, height: 900 }, reducedMotion: 'reduce'
  });
  try {
    const page = await context.newPage();
    await page.goto('/#career-background');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectReadableLabels(page, { minimumFontSize: 28, allowDiagramScroll: true });
    }
  } finally {
    await context.close();
  }
});

test('Venn statements remain readable without JavaScript on narrow and wide screens', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 320, height: 900 },
    javaScriptEnabled: false, reducedMotion: 'no-preference'
  });
  try {
    const page = await context.newPage();
    await page.goto('/#career-background');
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectReadableLabels(page);
    }
  } finally {
    await context.close();
  }
});

test('Venn links retain the complete wording and point to the requested destinations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#career-background');
  const figure = page.locator('[data-credentials-venn]');
  await expect(figure.locator('.credential-statement')).toHaveText(statements);
  await expect(figure.locator('a.credential-statement')).toHaveCount(4);
  const destinations = [
    [statements[0], 'assets/images/credentials/phd-sociology-certificate.jpg'],
    [statements[1], 'https://www.credential.net/profile/samobrienolinger167622/wallet'],
    [statements[2], '#people'],
    [statements[3], 'https://samobrienolinger.github.io/saggart-and-citywest-together/']
  ];
  for (const [name, href] of destinations) {
    const link = figure.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', href);
  }
});

test('the community Venn link opens People and reaches it by pointer and keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#career-background');
  const community = page.locator('[data-credentials-venn]').getByRole('link', { name: statements[2], exact: true });
  const panel = page.locator('#people-panel');
  const summary = panel.locator(':scope > summary');
  for (const activation of ['pointer', 'keyboard']) {
    await expect(panel).not.toHaveAttribute('open', '');
    await community.scrollIntoViewIfNeeded();
    if (activation === 'pointer') await community.click();
    else await community.press('Enter');
    await expect(page).toHaveURL(/#people$/);
    await expect(panel).toHaveAttribute('open', '');
    await expect(panel.locator(':scope > .accordion-content')).toBeVisible();
    await expect(page.locator('#people')).toBeFocused();
    await expect.poll(() => summary.evaluate(element => {
      const box = element.getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect();
      return box.top >= header.bottom - 1 && box.bottom <= innerHeight + 1;
    }), { message: `${activation}: People must be in view below the sticky header` }).toBe(true);
    await summary.press('Enter');
    // The second activation keeps #people as the current fragment. A click
    // handler must reopen it even when no new hashchange event is generated.
    await expect(panel).not.toHaveAttribute('open', '');
  }
});

test('keyboard focus makes pending Venn links immediately readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
  const figure = page.locator('[data-credentials-venn]');
  expect(await figure.locator('[data-credential-label]').evaluateAll(labels =>
    labels.some(label => Number(getComputedStyle(label).opacity) < 1)
  ), 'Begin while the offscreen label entrance is still pending').toBe(true);
  await page.locator('#people-panel > summary').focus();
  for (const name of statements) {
    await page.keyboard.press('Tab');
    const link = figure.getByRole('link', { name, exact: true });
    await expect(link).toBeFocused();
    const opaque = await link.evaluate(element => {
      const boundary = element.closest('[data-credentials-venn]').parentElement;
      for (let current = element; current && current !== boundary; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (Number(style.opacity) !== 1 || style.visibility !== 'visible' || style.display === 'none') return false;
      }
      return true;
    });
    expect(opaque, `${name}: focus must not wait for a delayed fade`).toBe(true);
    await expect(link).toBeInViewport();
  }
});
