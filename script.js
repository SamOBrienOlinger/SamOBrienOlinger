(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let savedTheme;
  try { savedTheme = localStorage.getItem('portfolio-theme'); } catch { /* Storage may be blocked. */ }
  const hasThemePreference = () => savedTheme === 'light' || savedTheme === 'dark';
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton?.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111e2d' : '#f7f9fc');
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

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('site-nav');
  if (!header || !menuButton || !navigation) return;

  const menuLabel = menuButton.querySelector('[data-menu-label]');
  const desktop = window.matchMedia('(min-width: 64rem)');
  const navLinks = Array.from(navigation.querySelectorAll('a[href^="#"]'));

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

  function moveFocusToSection(hash) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
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

  // The last section above the reading line is stable even for very tall sections.
  const sections = navLinks.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
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
