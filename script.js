(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Animate once on entry, without leaving unread content hidden if an observer fails.
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Match the live portfolio's gentle, staggered three-word reveal.
  // The caption stays readable without JavaScript, observers or motion.
  const signature = document.querySelector('.signature');
  let signatureObserver;
  function syncSignatureReveal() {
    signatureObserver?.disconnect();
    signature?.classList.remove('is-revealing');
    if (!signature || reducedMotion.matches || !('IntersectionObserver' in window)) return;
    signatureObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-revealing', entry.isIntersecting));
    }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });
    signatureObserver.observe(signature);
  }
  syncSignatureReveal();
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncSignatureReveal);
  else reducedMotion.addListener(syncSignatureReveal);

  let revealObserver;
  const revealed = new WeakSet();
  function syncReveals() {
    revealObserver?.disconnect();
    document.querySelectorAll('[data-reveal]').forEach(element => element.classList.remove('is-entering'));
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(entries => {
      if (reducedMotion.matches) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting || revealed.has(entry.target)) return;
        revealed.add(entry.target);
        if (!entry.target.contains(document.activeElement)) entry.target.classList.add('is-entering');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
  }
  syncReveals();
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', syncReveals);
  else reducedMotion.addListener(syncReveals);
  document.addEventListener('focusin', event => event.target.closest?.('[data-reveal]')?.classList.remove('is-entering'));

  // Keep copied page text free of rich webpage formats that iOS apps may attach as files.
  document.addEventListener('copy', event => {
    if (event.defaultPrevented || !event.clipboardData) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const isEditable = node => {
      const element = node instanceof Element ? node : node?.parentElement;
      return element?.isContentEditable || Boolean(element?.closest('input, textarea'));
    };
    if ([event.target, document.activeElement, selection.anchorNode, selection.focusNode].some(isEditable)) return;
    if (event.target instanceof Element && event.target.closest('img, svg')) return;
    const text = selection.toString();
    if (!text) return;
    try {
      event.clipboardData.clearData();
      event.clipboardData.setData('text/plain', text);
      event.preventDefault();
    } catch { /* Leave the browser's normal Copy action available if the write fails. */ }
  });


  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let savedTheme;
  try { savedTheme = localStorage.getItem('portfolio-theme'); } catch { /* Storage may be blocked. */ }
  const hasThemePreference = () => savedTheme === 'light' || savedTheme === 'dark';
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111e2d' : '#f4f6f6');
  }
  applyTheme(hasThemePreference() ? savedTheme : systemTheme.matches ? 'dark' : 'light');
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      savedTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(savedTheme);
      try { localStorage.setItem('portfolio-theme', savedTheme); } catch { /* Theme still works for this visit. */ }
    });
    themeButton.hidden = false;
  }
  const syncSystemTheme = () => {
    if (!hasThemePreference()) applyTheme(systemTheme.matches ? 'dark' : 'light');
  };
  if (systemTheme.addEventListener) systemTheme.addEventListener('change', syncSystemTheme);
  else systemTheme.addListener(syncSystemTheme);

  // Real interface captures open in a native dialog; normal links remain the fallback.
  const viewer = document.getElementById('screen-viewer');
  let imageOpener;
  if (viewer && typeof viewer.showModal === 'function') {
    const content = document.getElementById('viewer-content');
    const caption = document.getElementById('viewer-caption');
    document.querySelectorAll('[data-screen]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
        const source = link.querySelector('img');
        if (!source) return;
        const preview = new Image();
        preview.src = link.href;
        preview.alt = source.alt;
        preview.width = source.naturalWidth || source.width;
        preview.height = source.naturalHeight || source.height;
        content.replaceChildren(preview);
        caption.textContent = link.dataset.screenCaption || source.alt;
        imageOpener = link;
        viewer.showModal();
        root.classList.add('is-viewing-image');
        event.preventDefault();
      });
    });
    viewer.addEventListener('close', () => {
      root.classList.remove('is-viewing-image');
      content.replaceChildren();
      if (imageOpener?.isConnected) imageOpener.focus({ preventScroll: true });
    });
    viewer.addEventListener('click', event => {
      if (event.target !== viewer) return;
      const bounds = viewer.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
    });
  }

  // Close the nearest disclosure and return readers to its heading, including nested projects.
  document.querySelectorAll('[data-collapse-section]').forEach(button => {
    const disclosure = button.closest('details');
    const summary = disclosure?.querySelector(':scope > summary');
    if (!summary) return;
    button.addEventListener('click', () => {
      disclosure.open = false;
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    });
    button.hidden = false;
  });

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('site-nav');
  if (!header || !menuButton || !navigation) return;

  const menuLabel = menuButton.querySelector('[data-menu-label]');
  const desktop = window.matchMedia('(min-width: 64rem)');
  const navLinks = Array.from(navigation.querySelectorAll('a'));

  function setMenu(open, returnFocus = false) {
    const expanded = open && !desktop.matches;
    menuButton.setAttribute('aria-expanded', String(expanded));
    navigation.classList.toggle('is-open', expanded);
    if (menuLabel) menuLabel.textContent = expanded ? 'Close' : 'Menu';
    if (returnFocus) menuButton.focus();
  }

  function markActive(id) {
    navLinks.forEach(link => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function fragmentTarget(hash) {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return null; }
  }

  function openTargetSection(target) {
    if (!target) return;
    if (target.classList.contains('collapsible-section')) {
      const disclosure = target.querySelector('.section-disclosure');
      if (disclosure) disclosure.open = true;
    }
    // Also reveal deep links inside a closed section or nested project list.
    for (let ancestor = target; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
    }
  }

  function moveFocusToSection(hash) {
    const target = fragmentTarget(hash);
    if (!target) return;
    openTargetSection(target);
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    // Keep native links, URL fragments and scrolling intact while moving keyboard focus.
    target.focus({ preventScroll: true });
  }

  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
      const wasExpanded = menuButton.getAttribute('aria-expanded') === 'true';
      setMenu(false);
      markActive(link.hash.slice(1));
      if (wasExpanded) moveFocusToSection(link.hash);
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
      setMenu(false);
      moveFocusToSection(link.hash);
    });
  });

  header.querySelector('.brand')?.addEventListener('click', () => {
    setMenu(false);
    markActive('');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });

  document.addEventListener('click', event => {
    if (!header.contains(event.target) && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false, navigation.contains(document.activeElement));
    }
  });

  header.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (!header.contains(document.activeElement)) setMenu(false);
    });
  });

  const onBreakpointChange = () => {
    const focusWouldBeHidden = desktop.matches
      ? document.activeElement === menuButton
      : navigation.contains(document.activeElement);
    setMenu(false);
    if (focusWouldBeHidden) {
      if (desktop.matches) navLinks[0]?.focus();
      else menuButton.focus();
    }
    measureHeader();
  };
  if (desktop.addEventListener) desktop.addEventListener('change', onBreakpointChange);
  else desktop.addListener(onBreakpointChange);

  function measureHeader() {
    // Ignore the expanded menu when calculating sticky-header anchor clearance.
    if (menuButton.getAttribute('aria-expanded') !== 'true') {
      document.documentElement.style.setProperty('--header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    }
  }

  // Enhance only after keyboard, touch and breakpoint handlers are ready.
  menuButton.hidden = false;
  header.classList.add('nav-ready');
  measureHeader();
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(header);

  // Direct links, reloads and browser history reveal the destination before scrolling.
  function revealFragment() {
    const target = fragmentTarget(location.hash);
    if (!target) return;
    openTargetSection(target);
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  window.addEventListener('hashchange', revealFragment);
  window.addEventListener('pageshow', revealFragment);
  revealFragment();

  // The last section above the reading line is stable even for very tall sections.
  // Only observe targets on the current page; case-study navigation links return home.
  const sections = navLinks.filter(link => link.pathname === location.pathname).map(link => document.getElementById(link.hash.slice(1))).filter(Boolean)
    .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  let updateScheduled = false;
  function updateActiveSection() {
    updateScheduled = false;
    const readingLine = Math.min(window.innerHeight * .32, 260);
    let current = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= readingLine) current = section.id;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) {
      current = sections[sections.length - 1]?.id || current;
    }
    markActive(current);
  }
  function scheduleActiveUpdate() {
    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(updateActiveSection);
    }
  }
  window.addEventListener('scroll', scheduleActiveUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveUpdate, { passive: true });
  window.addEventListener('hashchange', scheduleActiveUpdate);
  window.addEventListener('pageshow', () => { setMenu(false); scheduleActiveUpdate(); });
  scheduleActiveUpdate();
})();

