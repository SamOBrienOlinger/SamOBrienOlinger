(() => {
  'use strict';

  const stack = document.querySelector('[data-focus-overlap]');
  if (!stack || !window.matchMedia) return;
  const sections = Array.from(stack.children);
  const panels = sections.map(section => section.querySelector('.focus-overview'));
  const summaries = panels.map(panel => panel?.querySelector('summary'));
  if (summaries.some(summary => !summary)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  let measurementPending = false;

  function measure() {
    measurementPending = false;
    // Reserve enough empty space at both edges that a 20% overlap cannot
    // cover a label or its expand control, including with enlarged text.
    summaries.forEach(summary => {
      const label = summary.querySelector('.focus-label');
      const icon = summary.querySelector('.accordion-icon');
      const contentHeight = label.getBoundingClientRect().height + icon.getBoundingClientRect().height
        + (parseFloat(getComputedStyle(summary).rowGap) || 0);
      summary.style.setProperty('--focus-edge-space', `${Math.ceil(contentHeight / 3 + 8)}px`);
    });
    const heights = summaries.map((summary, index) => {
      const style = getComputedStyle(panels[index]);
      return summary.getBoundingClientRect().height + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    });
    sections.slice(1).forEach((section, index) => {
      section.style.setProperty('--focus-overlap', `${Math.min(heights[index], heights[index + 1]) * .2}px`);
    });
  }

  function scheduleMeasure() {
    if (measurementPending) return;
    measurementPending = true;
    requestAnimationFrame(measure);
  }

  function syncPanels() {
    // Expanded content always gets a separate row; native details behaviour
    // and the existing navigation links continue to control which cards open.
    stack.classList.toggle('has-open-panel', panels.some(panel => panel.open));
    scheduleMeasure();
  }

  function syncMotion() {
    observer?.disconnect();
    if (motion.matches || !('IntersectionObserver' in window)) {
      stack.classList.add('is-overlapped');
      return;
    }
    stack.classList.remove('is-overlapped');
    observer = new IntersectionObserver(entries => {
      if (motion.matches) return;
      entries.forEach(entry => stack.classList.toggle('is-overlapped', entry.isIntersecting));
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    observer.observe(stack);
  }

  panels.forEach(panel => panel.addEventListener('toggle', syncPanels));
  stack.classList.add('overlap-ready');
  measure();
  syncPanels();
  syncMotion();
  if ('ResizeObserver' in window) {
    const resize = new ResizeObserver(scheduleMeasure);
    summaries.forEach(summary => {
      resize.observe(summary.querySelector('.focus-label'));
      resize.observe(summary.querySelector('.accordion-icon'));
    });
  }
  window.addEventListener('resize', scheduleMeasure);
  document.fonts?.ready.then(scheduleMeasure);
  if (motion.addEventListener) motion.addEventListener('change', syncMotion);
  else motion.addListener(syncMotion);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    measure();
    syncPanels();
    syncMotion();
  });
})();
