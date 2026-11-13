(() => {
  'use strict';

  const trigger = document.querySelector('[data-certificate-open]');
  const dialog = document.getElementById('phd-certificate-dialog');
  const closeButton = dialog?.querySelector('.certificate-close');
  const card = dialog?.querySelector('.certificate-card');
  if (!trigger || !closeButton || typeof dialog.showModal !== 'function') return;

  const root = document.documentElement;
  let returnPosition;
  let pressedBackdrop = false;

  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', dialog.id);
  trigger.addEventListener('click', event => {
    // Keep open-in-new-tab, downloads and the no-script image link available.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
    if (dialog.open) { event.preventDefault(); return; }
    returnPosition = { left: window.scrollX, top: window.scrollY };
    dialog.querySelector('img').loading = 'eager';
    dialog.showModal();
    event.preventDefault();
    root.classList.add('certificate-open');
    closeButton.focus({ preventScroll: true });
  });

  card?.addEventListener('mouseenter', () => card.classList.add('is-lifted'));

  closeButton.addEventListener('click', () => dialog.close());

  // Keep Tab cycling through the viewer's controls at either boundary.
  // Native modal inertness alone can still send Tab into the browser chrome.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) return;
    const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]'))
      .filter(element => element.tabIndex >= 0 && element.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  // Dismiss only a gesture that starts and finishes outside the frame.
  // Clicking the certificate or dragging from it must not close the viewer.
  const isBackdrop = event => {
    if (event.target !== dialog) return false;
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right
      || event.clientY < box.top || event.clientY > box.bottom;
  };
  dialog.addEventListener('pointerdown', event => { pressedBackdrop = isBackdrop(event); });
  dialog.addEventListener('pointercancel', () => { pressedBackdrop = false; });
  dialog.addEventListener('click', event => {
    if (pressedBackdrop && isBackdrop(event)) dialog.close();
    pressedBackdrop = false;
  });

  // Native dialog handles Escape and makes the rest of the page inert.
  dialog.addEventListener('close', () => {
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    root.classList.remove('certificate-open');
    if (returnPosition) window.scrollTo(returnPosition);
    root.style.scrollBehavior = previousScrollBehavior;
    returnPosition = undefined;
    pressedBackdrop = false;
    card?.classList.remove('is-lifted');
    trigger.focus({ preventScroll: true });
  });
})();
