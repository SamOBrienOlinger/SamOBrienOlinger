const { test, expect } = require('@playwright/test');

test('selected page text copies and pastes without HTML or file attachments', async ({ page }) => {
  await page.goto('/');
  const text = 'makes information clearer, connects communities';
  await page.evaluate(text => {
    const node = document.querySelector('.lede').firstChild;
    const start = node.textContent.indexOf(text);
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + text.length);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    window.addEventListener('copy', event => {
      window.copyResult = {
        trusted: event.isTrusted,
        prevented: event.defaultPrevented,
        types: Array.from(event.clipboardData.types),
        text: event.clipboardData.getData('text/plain')
      };
    }, { once: true });
  }, text);

  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+C`);
  expect(await page.evaluate(() => window.copyResult)).toEqual({
    trusted: true, prevented: true, types: ['text/plain'], text
  });

  await page.evaluate(() => {
    const input = document.createElement('textarea');
    input.id = 'paste-target';
    input.addEventListener('paste', event => {
      window.pasteResult = {
        types: Array.from(event.clipboardData.types),
        files: event.clipboardData.files.length
      };
    });
    document.body.appendChild(input);
    input.focus();
  });
  await page.keyboard.press(`${modifier}+V`);
  await expect(page.locator('#paste-target')).toHaveValue(text);
  expect(await page.evaluate(() => window.pasteResult)).toEqual({ types: ['text/plain'], files: 0 });
});

test('empty selections and editable fields retain their normal Copy behavior', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(() => {
    const selection = window.getSelection();
    const copy = target => {
      const event = new ClipboardEvent('copy', {
        bubbles: true, cancelable: true, clipboardData: new DataTransfer()
      });
      target.dispatchEvent(event);
      return { prevented: event.defaultPrevented, types: Array.from(event.clipboardData.types) };
    };
    selection.removeAllRanges();
    const results = [copy(document.body)];
    for (const tag of ['input', 'textarea', 'div']) {
      const field = document.createElement(tag);
      if (tag === 'div') field.contentEditable = 'true';
      document.body.appendChild(field);
      field.focus();
      // A stale page selection must not replace the contents being copied from a field.
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.lede'));
      selection.removeAllRanges();
      selection.addRange(range);
      results.push(copy(field));
      field.remove();
    }
    return results;
  });
  expect(results).toEqual(Array.from({ length: 4 }, () => ({ prevented: false, types: [] })));
});

test('Copy falls back to the browser when a clipboard write is unavailable', async ({ page }) => {
  await page.goto('/');
  const prevented = await page.evaluate(() => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('.lede'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    const events = [
      new ClipboardEvent('copy', { bubbles: true, cancelable: true }),
      new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() })
    ];
    events[1].clipboardData.setData = () => { throw new Error('Clipboard write unavailable'); };
    return events.map(event => {
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    });
  });
  expect(prevented).toEqual([false, false]);
});
