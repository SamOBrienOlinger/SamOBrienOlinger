(() => {
  'use strict';

  if (!document.fonts) {
    window.portfolioFontReady = Promise.resolve();
    return;
  }

  // Resolve the page's used font faces before capturing their readiness promise.
  document.body.getBoundingClientRect();
  window.portfolioFontReady = new Promise(resolve => {
    let complete = false;
    const finish = useFallback => {
      if (complete) return;
      complete = true;
      window.clearTimeout(timeout);
      // A stalled request must not hide the content indefinitely or swap its
      // metrics after the reveal. Keep a stable fallback for this page visit.
      if (useFallback) document.documentElement.classList.add('font-fallback');
      resolve();
    };
    const timeout = window.setTimeout(() => finish(true), 8000);
    document.fonts.ready.then(() => finish(false), () => finish(true));
  });
})();
