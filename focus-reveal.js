(() => {
  'use strict';

  const stack = document.querySelector('[data-focus-reveal]');
  if (!stack || !window.matchMedia || !('IntersectionObserver' in window)) return;
  const cards = Array.from(stack.children).map(section => ({
    section,
    panel: section.querySelector('.focus-overview'),
    inView: false,
    hasRevealed: false
  })).filter(card => card.panel);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fontReadiness = window.portfolioFontReady || document.fonts?.ready;
  let fontsReady = !fontReadiness;
  let observer;

  function settle(card) {
    card.hasRevealed = true;
    observer?.unobserve(card.section);
    card.panel.classList.remove('focus-card-reveal', 'is-revealing');
  }

  function reveal(card) {
    if (card.hasRevealed || !card.inView || !fontsReady || motion.matches) return;
    card.hasRevealed = true;
    card.panel.classList.add('is-revealing');
    // Observe the stationary section, animate only the card inside it, and
    // retain the completed state for the rest of the page visit.
    observer?.unobserve(card.section);
  }

  function syncMotion() {
    observer?.disconnect();
    if (motion.matches) {
      cards.forEach(settle);
      return;
    }
    const pending = cards.filter(card => !card.hasRevealed);
    if (!pending.length) return;
    observer = new IntersectionObserver(entries => {
      if (motion.matches) return;
      entries.forEach(entry => {
        const card = cards.find(candidate => candidate.section === entry.target);
        if (!card || card.hasRevealed) return;
        card.inView = entry.isIntersecting;
        reveal(card);
      });
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    pending.forEach(card => {
      card.inView = false;
      card.panel.classList.add('focus-card-reveal');
      observer.observe(card.section);
    });
  }

  cards.forEach(card => {
    // Navigation and keyboard interaction should expose the requested card
    // immediately, including while its entrance is waiting for fonts.
    if (card.panel.open) settle(card);
    card.panel.addEventListener('focusin', () => settle(card));
    card.panel.addEventListener('toggle', () => {
      if (card.panel.open) settle(card);
    });
  });
  syncMotion();
  const finishFontSetup = () => {
    fontsReady = true;
    cards.forEach(reveal);
  };
  fontReadiness?.then(finishFontSetup, finishFontSetup);
  if (motion.addEventListener) motion.addEventListener('change', syncMotion);
  else motion.addListener(syncMotion);
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncMotion();
  });
})();
