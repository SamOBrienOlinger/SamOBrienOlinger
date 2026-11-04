(() => {
  'use strict';

  const diagram = document.querySelector('[data-credentials-venn]');
  if (!diagram) return;
  const graphic = diagram.querySelector('svg') || diagram;

  // Enlarged text keeps its size; a larger diagram can be panned within its frame.
  // Add a keyboard stop only when that frame actually needs horizontal scrolling.
  if ('ResizeObserver' in window) {
    const syncScrollFocus = () => {
      if (diagram.scrollWidth > diagram.clientWidth + 1) diagram.setAttribute('tabindex', '0');
      else diagram.removeAttribute('tabindex');
    };
    const sizeObserver = new ResizeObserver(syncScrollFocus);
    sizeObserver.observe(diagram);
    sizeObserver.observe(graphic);
    syncScrollFocus();
  }
  const circles = Array.from(diagram.querySelectorAll('[data-credential-circle]'));
  const details = Array.from(diagram.querySelectorAll('[data-credential-detail]'));
  const labels = Array.from(diagram.querySelectorAll('[data-credential-label]'));
  const overlaps = Array.from(diagram.querySelectorAll('[data-overlap-circles]'));
  if (!circles.length || !window.matchMedia || !('IntersectionObserver' in window)) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let hasRevealed = false;
  let inView = false;
  const fontReadiness = window.portfolioFontReady || document.fonts?.ready;
  let fontsReady = !fontReadiness;

  function reveal() {
    if (hasRevealed || reducedMotion.matches) return;
    const order = circles.map((_, index) => index);
    // Fisher-Yates changes the reveal order, never the layout or reading order.
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    const delays = [];
    order.forEach((index, position) => {
      delays[index] = 160 + position * 600;
      circles[index].style.setProperty('--reveal-delay', `${delays[index]}ms`);
      details[index]?.style.setProperty('--reveal-delay', `${delays[index]}ms`);
      labels[index]?.style.setProperty('--reveal-delay', `${delays[index]}ms`);
    });
    overlaps.forEach(overlap => {
      const members = overlap.dataset.overlapCircles.split(' ').map(Number);
      // Colour arrives only after every contributing circle has settled.
      // Deeper intersections follow the pairwise colours, with a slower fade.
      const delay = Math.max(...members.map(index => delays[index])) + 867 + 180 + (members.length - 2) * 220;
      overlap.style.setProperty('--overlap-delay', `${delay}ms`);
    });
    // Run the entrance once per page visit. Leaving the viewport must not
    // reset a finished diagram or restart a sequence already in progress.
    hasRevealed = true;
    observer?.disconnect();
    diagram.classList.add('is-revealing');
  }

  function syncMotion() {
    observer?.disconnect();
    if (reducedMotion.matches) {
      // A static, readable diagram is also a completed reveal. Do not hide it
      // again if the visitor later changes their motion preference.
      hasRevealed = true;
      diagram.classList.remove('reveal-ready');
      diagram.classList.remove('is-revealing');
      return;
    }
    if (hasRevealed) return;
    inView = false;
    diagram.classList.remove('reveal-ready');

    observer = new IntersectionObserver(entries => {
      // Ignore queued notifications from a disconnected observer after a preference change.
      if (reducedMotion.matches || hasRevealed) return;
      entries.forEach(entry => {
        inView = entry.isIntersecting && entry.intersectionRatio >= .25;
        if (inView && fontsReady) reveal();
      });
    }, { threshold: [0, .25] });
    // Observe the graphic so the reveal follows the visible diagram.
    observer.observe(graphic);
    // Progressive enhancement: without this script/observer, every circle stays visible.
    diagram.classList.add('reveal-ready');
  }

  syncMotion();
  // A late font swap can rewrap a centred label after its reveal has finished.
  // Keep the entrance pending until the rendered text has its final metrics.
  const finishFontSetup = () => {
    fontsReady = true;
    if (inView && !hasRevealed && !reducedMotion.matches) reveal();
  };
  fontReadiness?.then(finishFontSetup, finishFontSetup);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMotion);
  else reducedMotion.addListener(syncMotion);
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncMotion();
  });
})();
