const { test, expect } = require('@playwright/test');

async function expectNoOverflow(page) {
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width);
}

test('mobile navigation and project layouts remain usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Curiosity/ })).toBeVisible();
  await expectNoOverflow(page);
  const menu = page.locator('.menu-toggle');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const boxes = await page.locator('.menu-toggle, .theme-toggle, #site-nav a').evaluateAll(elements => elements
    .filter(element => element.getBoundingClientRect().width > 0)
    .map(element => ({ label: element.textContent.trim() || element.getAttribute('aria-label'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
  for (const box of boxes) {
    expect(box.width, box.label + ' width').toBeGreaterThanOrEqual(44);
    expect(box.height, box.label + ' height').toBeGreaterThanOrEqual(44);
  }
  const nav = page.getByRole('navigation', { name: 'Primary', exact: true });
  for (const name of ['Home', 'Software', 'Research', 'People', 'Contact']) {
    await expect(nav.getByRole('link', { name, exact: name !== 'Contact' })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Software', exact: true }).click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#work')).toBeFocused();
  await expect.poll(() => page.locator('.project[data-project][aria-hidden="false"]').evaluateAll(cards => cards.length === 1 && cards.every(card => {
    const rect = card.getBoundingClientRect();
    return rect.left >= -0.5 && rect.right <= window.innerWidth + 0.5;
  }))).toBe(true);
  await expectNoOverflow(page);
});

test('the theme control stays inside the mobile menu and Escape returns focus from it', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('.menu-toggle');
  const theme = page.locator('#site-nav .theme-toggle');
  await expect(page.locator('.theme-toggle')).toHaveCount(1);
  await expect(theme).toHaveCount(1);
  await expect(theme).toBeHidden();
  await expect(menu).toHaveAccessibleName('Menu');
  await menu.click();
  await expect(theme).toBeVisible();
  await theme.focus();
  await expect(theme).toBeFocused();
  await theme.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();
  await expect(theme).toBeHidden();
});

test('focus cards and contact actions are readable at normal and enlarged text sizes', async ({ page }) => {
  await page.goto('/#about');
  const diagram = page.getByRole('group', { name: 'Areas of focus' });
  await expect(diagram).toBeVisible();
  await expect(diagram.locator('#software-panel > summary')).toContainText('Software');
  await expect(diagram.locator('#software-panel > summary')).toContainText('Community resources, learning through play and applications built around real interests and positive outcomes.');
  await expect(diagram.locator('#research-panel > summary')).toContainText('Research');
  await expect(diagram.locator('#research-panel > summary')).toContainText('Evidence-based, social policy and critical thinking');
  await expect(diagram.locator('#people-panel > summary')).toContainText('People');
  await expect(diagram.locator('#people-panel > summary')).toContainText('Supporting communities');
  for (const size of ['100%', '200%']) {
    await page.evaluate(value => document.documentElement.style.fontSize = value, size);
    const labelsFit = await diagram.locator('.focus-overview > summary').evaluateAll(elements => elements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 && element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1;
    }));
    expect(labelsFit).toBe(true);
    const contactActionsFit = await page.locator('.contact-actions a').evaluateAll(elements => elements.every(element => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 44 && element.scrollWidth <= element.clientWidth + 1
        && rect.left >= 0 && rect.right <= document.documentElement.clientWidth + 1;
    }));
    expect(contactActionsFit).toBe(true);
    await expectNoOverflow(page);
  }
});

test('every project keeps one main image and a live link without mobile overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  const projects = ['sct', 'spoodle', 'beaver', 'new-life', 'both-sides', 'yellowknife', 'allyindex'];
  await expect(page.locator('#work .project-gallery')).toHaveCount(0);
  for (const [index, project] of projects.entries()) {
    const card = page.locator(`[data-project="${project}"]`);
    await expect(card).toHaveAttribute('aria-hidden', 'false');
    await expect(card.locator('img')).toHaveCount(1);
    const mainImage = card.locator('.project-media img');
    await mainImage.scrollIntoViewIfNeeded();
    await expect.poll(() => mainImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    const response = await page.request.get(await mainImage.getAttribute('src'));
    expect(response.ok(), `${project}: main image`).toBe(true);
    expect(response.headers()['content-type']).toMatch(/^image\//);
    const liveLink = card.locator('.project-links a');
    await expect(liveLink).toHaveCount(1);
    await expect(liveLink).toHaveAttribute('href', /^https:\/\//);
    const box = await liveLink.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
    await expectNoOverflow(page);
    if (index < projects.length - 1) await page.getByRole('button', { name: 'Next project', exact: true }).click();
  }
  await expect(page.locator('[data-project="allyindex"] .project-links a')).toHaveAttribute('href', 'https://declan444.github.io/24-7-hackathon-team9/index.html');
  await expect(page.locator('#work a[href*="github.com/"]')).toHaveCount(0);
});

test('theme and menu work when preference storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage blocked'); };
    Storage.prototype.setItem = () => { throw new Error('Storage blocked'); };
  });
  await page.goto('/');
  const root = page.locator('html');
  const initialTheme = await root.getAttribute('data-theme');
  const menu = page.locator('.menu-toggle');
  await menu.click();
  await page.getByRole('button', { name: /Switch to .* theme/ }).click();
  await expect(root).toHaveAttribute('data-theme', initialTheme === 'dark' ? 'light' : 'dark');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
});

test('navigation remains available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toBeVisible();
  await expect(page.locator('.menu-toggle')).toBeHidden();
  await expect(page.locator('#software-panel > .accordion-content')).toBeHidden();
  await page.locator('#software-panel > summary').click();
  await expect(page.locator('#work-track')).toBeVisible();
  await expect(page.locator('#software-panel [data-project]')).toHaveCount(7);
  await expect(page.locator('[data-project="sct"] .project-links a')).toBeVisible();
  await expect(page.locator('.publication-cover')).toHaveCount(7);
  await expect(page.locator('#research-publications')).toBeHidden();
  await page.locator('#research-panel > summary').click();
  await expect(page.locator('#research-publications')).toBeVisible();
  await expect(page.locator('#people-panel > .accordion-content')).toBeHidden();
  await page.locator('#people-panel > summary').click();
  await expect(page.locator('#people-panel > .accordion-content')).toBeVisible();
  await expect(page.locator('#people-panel .research-experience')).toBeVisible();
  await expect(page.locator('#research-publications .publication').first()).toBeVisible();
  await expect(page.locator('.publication').last()).toBeVisible();
  await expectNoOverflow(page);
  await context.close();
});

test('layout reflows from a small phone to desktop', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Check the desktop layout once per browser engine.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#work');
  for (const width of [320, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoOverflow(page);
    const layout = await page.evaluate(() => {
      const box = selector => document.querySelector(selector).getBoundingClientRect();
      const heading = box('#hero-title');
      const heroImage = box('.hero-image');
      const projectImage = box('[data-project="sct"] .project-media');
      const projectCopy = box('[data-project="sct"] .project-content');
      return {
        heroSideBySide: heading.right < heroImage.left && heading.top < heroImage.bottom,
        projectSideBySide: projectImage.right < projectCopy.left && projectCopy.top < projectImage.bottom,
        panelWidth: box('#software-panel').width,
        credentialsWidth: box('.credentials-venn').width
      };
    });
    if (width >= 1024) {
      await expect(page.locator('.menu-toggle')).toBeHidden();
      await expect(page.getByRole('navigation', { name: 'Primary', exact: true })).toBeVisible();
      expect(layout.heroSideBySide, `${width}px: keep the headline beside the image`).toBe(true);
      expect(layout.projectSideBySide, `${width}px: keep the project preview beside its description`).toBe(true);
      expect(layout.panelWidth, `${width}px: give the portfolio column more room than the credentials`)
        .toBeGreaterThan(layout.credentialsWidth * 1.5);
    } else {
      await expect(page.locator('.menu-toggle')).toBeVisible();
      expect(layout.heroSideBySide).toBe(false);
      expect(layout.projectSideBySide).toBe(false);
    }
  }
});

test('the tagline is exact and the brand uses the same darker blue gradient as the hero', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Check the rendered colours once per browser engine.');
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('.hero .lede')).toHaveText('Digital experiences to empower people and strengthen communities');
  await expect(page.locator('.brand-name > span')).toHaveText(['Sam', 'Tim', 'Solutions']);
  const luminance = colour => colour.match(/[\d.]+/g).slice(0, 3).map(Number)
    .map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    const colours = await page.evaluate(() => ({
      brand: Array.from(document.querySelectorAll('.brand-name > span')).map(word => getComputedStyle(word).color),
      hero: Array.from(document.querySelectorAll('#hero-title > span')).map(word => getComputedStyle(word).color)
    }));
    expect(colours.brand, `${scheme}: Sam, Tim and Solutions must match the corresponding hero words`).toEqual(colours.hero);
    expect(new Set(colours.hero).size, `${scheme}: keep three distinct gradient steps`).toBe(3);
    const oldPurpose = scheme === 'light' ? 'rgb(68, 107, 139)' : 'rgb(146, 184, 214)';
    expect(luminance(colours.hero[2]), `${scheme}: Purpose must be darker than its previous colour`).toBeLessThan(luminance(oldPurpose));
  }
});

test('the wordmark stays horizontally centred and clear of controls at every header size', async ({ page }, testInfo) => {
  test.skip(!['Android Chrome 360', 'iOS WebKit 375'].includes(testInfo.project.name),
    'Exercise the full header width and text-size matrix once per browser engine.');
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(async () => { await (window.portfolioFontReady || document.fonts.ready); });
  const menu = page.locator('.menu-toggle');
  const nav = page.locator('#site-nav');
  const theme = nav.locator('.theme-toggle');
  const checkCentre = async phase => {
    const metrics = await page.locator('.brand-name').evaluate(name => {
      const box = name.getBoundingClientRect();
      const logo = document.querySelector('.brand-logo').getBoundingClientRect();
      const menu = document.querySelector('.menu-toggle');
      const menuBox = menu.getBoundingClientRect();
      const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT);
      const textBoxes = [];
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        textBoxes.push(...range.getClientRects());
      }
      const textLeft = Math.min(...textBoxes.map(rect => rect.left));
      const textRight = Math.max(...textBoxes.map(rect => rect.right));
      const centre = document.documentElement.clientWidth / 2;
      return {
        boxError: Math.abs((box.left + box.right) / 2 - centre),
        textError: Math.abs((textLeft + textRight) / 2 - centre),
        fits: textLeft >= box.left - 1 && textRight <= box.right + 1
          && name.scrollWidth <= name.clientWidth + 1,
        logoClear: logo.right <= textLeft,
        menuClear: !menu.getClientRects().length || textRight <= menuBox.left
      };
    });
    expect(metrics.boxError, `${phase}: wordmark container is off-centre`).toBeLessThanOrEqual(1);
    expect(metrics.textError, `${phase}: visible wordmark text is off-centre`).toBeLessThanOrEqual(1);
    expect(metrics.fits, `${phase}: wordmark text is clipped`).toBe(true);
    expect(metrics.logoClear, `${phase}: wordmark overlaps the logo`).toBe(true);
    expect(metrics.menuClear, `${phase}: wordmark overlaps the menu button`).toBe(true);
    await expectNoOverflow(page);
  };
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const size of ['100%', '200%']) {
      await page.evaluate(value => { document.documentElement.style.fontSize = value; }, size);
      const phase = `${width}px / ${size} text`;
      await checkCentre(phase);
      if (width < 1024) {
        await expect(menu).toBeVisible();
        await expect(theme).toBeHidden();
        await menu.click();
        await expect(theme).toBeVisible();
        await checkCentre(`${phase}, menu open`);
        await menu.click();
        await expect(theme).toBeHidden();
      } else {
        await expect(menu).toBeHidden();
        await expect(nav).toBeVisible();
        await expect(theme).toBeVisible();
        const position = await nav.evaluate(element => {
          const box = element.getBoundingClientRect();
          const brand = document.querySelector('.brand-name').getBoundingClientRect();
          return { belowBrand: box.top >= brand.bottom, centreError: Math.abs((box.left + box.right) / 2 - document.documentElement.clientWidth / 2) };
        });
        expect(position.belowBrand, `${phase}: desktop navigation must sit below the wordmark`).toBe(true);
        expect(position.centreError, `${phase}: desktop navigation is off-centre`).toBeLessThanOrEqual(1);
      }
    }
  }
});
