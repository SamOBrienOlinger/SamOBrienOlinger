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

async function expectReadableLabels(page, minimumFontSize = 16) {
  const figure = page.locator('[data-credentials-venn]');
  await expect(figure.locator('.credential-statement')).toHaveText(statements);
  await expect(figure.locator('.credential-statement .credential-accent')).toHaveText(emphasis);
  await page.evaluate(async () => { await document.fonts.ready; });

  // Check rendered text, not only the figure's outer width: SVG scaling previously
  // left the longest statement at about 11px on a narrow phone.
  await expect.poll(() => figure.evaluate((diagram, minimum) => {
    const problems = [];
    const frame = diagram.getBoundingClientRect();
    const paragraphs = Array.from(diagram.querySelectorAll('.credential-statement'));
    const bounds = paragraphs.map(paragraph => paragraph.getBoundingClientRect());
    const inside = rect => rect.left >= frame.left - 1 && rect.right <= frame.right + 1
      && rect.top >= frame.top - 1 && rect.bottom <= frame.bottom + 1;

    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      problems.push('horizontal page overflow');
    }
    paragraphs.forEach((paragraph, index) => {
      const label = paragraph.closest('[data-credential-label]');
      const rect = bounds[index];
      if (!label || !inside(label.getBoundingClientRect()) || !inside(rect)) {
        problems.push(`label ${index + 1} leaves the figure`);
      }
      if (rect.width <= 0 || rect.height <= 0) problems.push(`label ${index + 1} has no rendered area`);
      if (paragraph.scrollWidth > paragraph.clientWidth + 1 || paragraph.scrollHeight > paragraph.clientHeight + 1) {
        problems.push(`label ${index + 1} clips or overflows its text box`);
      }
      for (const element of [paragraph, ...paragraph.querySelectorAll('*')]) {
        if (element.textContent.trim() && parseFloat(getComputedStyle(element).fontSize) < minimum - .01) {
          problems.push(`label ${index + 1} contains text smaller than ${minimum}px`);
        }
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
        if (Array.from(range.getClientRects()).some(line => !inside(line))) {
          problems.push(`label ${index + 1} has text outside the figure`);
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
    return problems;
  }, minimumFontSize), { message: 'Venn statements stay legible, visible, contained and separate' }).toEqual([]);
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

test('Venn labels enlarge with 200 percent text size without clipping or collisions', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173', viewport: { width: 320, height: 900 }, reducedMotion: 'reduce'
  });
  try {
    const page = await context.newPage();
    await page.goto('/#career-background');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expectReadableLabels(page, 32);
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
