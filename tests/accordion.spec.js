const { test, expect } = require('@playwright/test');

test('Research and People accordions support pointer and keyboard activation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const outerSummary = page.locator('.approach #research-panel > summary');
  const publishedWork = page.locator('#research-publications');
  await expect(publishedWork).toBeHidden();
  await expect(outerSummary).toContainText('Evidence-based, social policy and critical thinking');
  await outerSummary.click();
  await expect(publishedWork).toBeVisible();
  await expect(publishedWork.getByRole('heading', { name: 'Published work', exact: true })).toBeVisible();
  await expect(publishedWork.locator('.publication').last()).toBeVisible();
  await outerSummary.click();
  await expect(publishedWork).toBeHidden();
  await page.locator('.menu-toggle').click();
  await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Research', exact: true }).click();
  await expect(page).toHaveURL(/#research$/);
  await expect(publishedWork).toBeVisible();
  await outerSummary.press('Enter');
  await expect(publishedWork).toBeHidden();
  await outerSummary.press('Space');
  await expect(publishedWork).toBeVisible();
  const peopleSummary = page.locator('#people-panel > summary');
  const peopleContent = page.locator('#people-panel > .accordion-content');
  await expect(peopleContent).toBeHidden();
  await peopleSummary.click();
  await expect(peopleContent).toBeVisible();
  await expect(page.locator('#research .research-experience')).toHaveCount(0);
  await expect(page.locator('#people .research-experience')).toBeVisible();
  await expect(page.locator('#people .research-experience li')).toHaveCount(9);
  await peopleSummary.press('Enter');
  await expect(peopleContent).toBeHidden();
  await peopleSummary.press('Space');
  await expect(peopleContent).toBeVisible();
});

test('expanded Research and People content fits phones, dark mode and enlarged text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/#people');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#people-panel > .accordion-content')).toBeVisible();
  await page.locator('#research-panel > summary').click();
  await expect(page.locator('#people .research-experience')).toBeVisible();
  await expect(page.locator('#research-publications .publication').first()).toBeVisible();
  await expect(page.locator('.research-experience li')).toHaveCount(9);
  await expect(page.locator('#research-publications .publication')).toHaveCount(8);
  await expect(page.locator('#research-publications .publication-cover')).toHaveCount(7);
  for (const size of ['100%', '200%']) {
    await page.evaluate(value => document.documentElement.style.fontSize = value, size);
    const summaries = await page.locator('.accordion > summary').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height, fits: element.scrollWidth <= element.clientWidth + 1 };
    }));
    for (const summary of summaries) {
      expect(summary.width).toBeGreaterThanOrEqual(44);
      expect(summary.height).toBeGreaterThanOrEqual(44);
      expect(summary.fits).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const layout = await page.evaluate(() => {
      const card = document.querySelector('#research-panel').getBoundingClientRect();
      const content = document.querySelector('#research-panel > .accordion-content').getBoundingClientRect();
      const people = document.querySelector('.approach-simplify').getBoundingClientRect();
      return { contained: content.left >= card.left && content.right <= card.right, peopleBelow: people.top >= content.bottom };
    });
    expect(layout).toEqual({ contained: true, peopleBelow: true });
    await expect(page.locator('.publication').last()).toBeVisible();
  }
});


test('Software opens in place, retains its project when reopened, and fits enlarged text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/');
  const summary = page.locator('.approach #software-panel > summary');
  const content = page.locator('#software-panel > .accordion-content');
  const carousel = content.locator('[data-carousel]');
  await expect(content).toBeHidden();
  await summary.click();
  await expect(content).toBeVisible();
  await expect(page).not.toHaveURL(/#/);
  await expect(carousel).toHaveAccessibleName('Software');
  await expect(page.locator('[data-carousel]')).toHaveCount(1);
  await expect(carousel).toHaveAttribute('data-current-project', 'sct');
  await page.getByRole('button', { name: 'Next project', exact: true }).click();
  await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  await summary.press('Enter');
  await expect(content).toBeHidden();
  await summary.press('Space');
  await expect(content).toBeVisible();
  await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  // Work navigation opens the same card, including when its fragment is unchanged.
  const workLink = page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Software', exact: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    await summary.click();
    await expect(content).toBeHidden();
    await page.locator('.menu-toggle').click();
    await workLink.click();
    await expect(page).toHaveURL(/#work$/);
    await expect(content).toBeVisible();
    await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  }
  for (const size of ['100%', '200%']) {
    await page.evaluate(value => document.documentElement.style.fontSize = value, size);
    await expect.poll(() => page.locator('[data-project="spoodle"]').evaluate(element => {
      const card = element.getBoundingClientRect();
      const media = element.querySelector('.project-media').getBoundingClientRect();
      const panel = element.closest('#software-panel').getBoundingClientRect();
      return card.left >= panel.left - 1 && card.right <= panel.right + 1 && media.width > 100
        && element.scrollWidth <= element.clientWidth + 1
        && document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    })).toBe(true);
    for (const button of await page.locator('.carousel-toolbar button').all()) {
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Next project', exact: true }).click();
    await expect(carousel).toHaveAttribute('data-current-project', 'beaver');
    await page.getByRole('button', { name: 'Previous project', exact: true }).click();
    await expect(carousel).toHaveAttribute('data-current-project', 'spoodle');
  }
});
