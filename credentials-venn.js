(() => {
  'use strict';

  const diagram = document.querySelector('[data-credentials-venn]');
  if (!diagram) return;
  const circles = Array.from(diagram.querySelectorAll('[data-credential-circle]'));
  const details = Array.from(diagram.querySelectorAll('[data-credential-detail]'));
  const overlaps = Array.from(diagram.querySelectorAll('[data-overlap-circles]'));
  if (!circles.length || !window.matchMedia || !('IntersectionObserver' in window)) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let previousOrder = [];
  let active = false;

  function reveal() {
    const order = circles.map((_, index) => index);
    // Fisher-Yates changes the reveal order, never the layout or reading order.
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    // A return visit should visibly get a new sequence, even if the draw repeats.
    if (order.length > 1 && order.every((value, index) => value === previousOrder[index])) {
      [order[0], order[1]] = [order[1], order[0]];
    }
    previousOrder = order;
    const delays = [];
    order.forEach((index, position) => {
      delays[index] = 160 + position * 600;
      circles[index].style.setProperty('--reveal-delay', `${delays[index]}ms`);
      details[index]?.style.setProperty('--reveal-delay', `${delays[index]}ms`);
    });
    overlaps.forEach(overlap => {
      const members = overlap.dataset.overlapCircles.split(' ').map(Number);
      // Colour arrives only after every contributing circle has settled.
      // Deeper intersections follow the pairwise colours, with a slower fade.
      const delay = Math.max(...members.map(index => delays[index])) + 867 + 180 + (members.length - 2) * 220;
      overlap.style.setProperty('--overlap-delay', `${delay}ms`);
    });
    active = true;
    diagram.classList.add('is-revealing');
  }

  function reset() {
    active = false;
    // Removing the animation cancels delayed circles too; there are no timers to leak.
    diagram.classList.remove('is-revealing');
  }

  function syncMotion() {
    observer?.disconnect();
    reset();
    diagram.classList.remove('reveal-ready');
    if (reducedMotion.matches) return;

    observer = new IntersectionObserver(entries => {
      // Ignore queued notifications from a disconnected observer after a preference change.
      if (reducedMotion.matches) return;
      entries.forEach(entry => {
        // A small visible edge must not prevent replay on tall screens.
        if (!entry.isIntersecting || entry.intersectionRatio <= .15) reset();
        else if (!active && entry.intersectionRatio >= .25) reveal();
      });
    }, { threshold: [0, .15, .25] });
    observer.observe(diagram);
    // Progressive enhancement: without this script/observer, every circle stays visible.
    diagram.classList.add('reveal-ready');
  }

  syncMotion();
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncMotion);
  else reducedMotion.addListener(syncMotion);
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncMotion();
  });
})();
