(() => {
  'use strict';

  const carousel = document.querySelector('[data-carousel]');
  if (!carousel) return;
  const section = carousel.closest('section');
  const track = carousel.querySelector('.work-track');
  const slides = Array.from(track.children);
  const toolbar = carousel.querySelector('.carousel-toolbar');
  const count = carousel.querySelector('[data-project-number]');
  const status = carousel.querySelector('[data-carousel-status]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (slides.length < 2) return;

  const delay = 7000;
  let current = 0;
  let target = 0;
  let paused = motion.matches;
  let visible = false;
  let hovered = false;
  let automaticMove = false;
  let animationFrame = null;
  let timer;
  let scrollTimer;
  let lastWidth = track.clientWidth;

  // Inert end copies make the wrap seamless without duplicating accessible content.
  function makeClone(slide) {
    const clone = slide.cloneNode(true);
    clone.removeAttribute('data-project');
    clone.setAttribute('data-carousel-clone', '');
    clone.setAttribute('aria-hidden', 'true');
    clone.inert = true;
    [clone, ...clone.querySelectorAll('[id]')].forEach(element => element.removeAttribute('id'));
    clone.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach(element => {
      element.removeAttribute('aria-labelledby');
      element.removeAttribute('aria-describedby');
    });
    return clone;
  }
  track.prepend(makeClone(slides[slides.length - 1]));
  track.append(makeClone(slides[0]));
  const positions = Array.from(track.children);

  function updateControls() {
    carousel.dataset.rotation = paused ? 'paused' : 'playing';
  }

  function cancelAnimation() {
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    track.classList.remove('is-animating');
  }

  function schedule() {
    clearTimeout(timer);
    updateControls();
    if (paused || hovered || !visible || document.hidden) return;
    timer = setTimeout(() => move(1, true), delay);
  }

  function pause() {
    paused = true;
    clearTimeout(timer);
    if (automaticMove || animationFrame !== null) {
      automaticMove = false;
      cancelAnimation();
    }
    updateControls();
  }

  function updateCurrent(index, announce = true) {
    const changed = current !== index;
    current = target = index;
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    count.textContent = String(index + 1).padStart(2, '0');
    carousel.dataset.currentProject = slides[index].dataset.project;
    carousel.style.setProperty('--project-progress', (index + 1) / slides.length);
    // Load the nearby artwork before it scrolls into view.
    for (const offset of [-1, 0, 1]) {
      slides[(index + offset + slides.length) % slides.length].querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
    }
    if (changed && paused && announce) status.textContent = slides[index].getAttribute('aria-label');
  }

  function goTo(physicalIndex, smooth = true) {
    cancelAnimation();
    target = (physicalIndex - 1 + slides.length) % slides.length;
    const destination = positions[physicalIndex].offsetLeft;
    if (!smooth || motion.matches) {
      track.scrollTo({ left: destination, behavior: 'instant' });
      schedule();
      return;
    }
    const origin = track.scrollLeft;
    const duration = automaticMove ? 1800 : 750;
    const started = performance.now();
    track.classList.add('is-animating');
    function frame(now) {
      const progress = Math.min((now - started) / duration, 1);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      track.scrollLeft = origin + (destination - origin) * eased;
      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else {
        animationFrame = null;
        track.classList.remove('is-animating');
        settle();
        schedule();
      }
    }
    animationFrame = requestAnimationFrame(frame);
  }

  function move(direction, automatic = false) {
    automaticMove = automatic;
    goTo(target + 1 + direction);
  }

  function settle() {
    if (animationFrame !== null) return;
    clearTimeout(scrollTimer);
    let nearest = 0;
    positions.forEach((slide, i) => {
      if (Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(positions[nearest].offsetLeft - track.scrollLeft)) nearest = i;
    });
    const index = (nearest - 1 + slides.length) % slides.length;
    automaticMove = false;
    updateCurrent(index);
    if (nearest === 0 || nearest === positions.length - 1) goTo(index + 1, false);
  }

  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(settle, 140);
  }, { passive: true });
  track.addEventListener('scrollend', settle);

  // Any interaction permanently hands this visit's carousel over to the visitor.
  section.addEventListener('pointerdown', pause, { passive: true });
  section.addEventListener('touchstart', pause, { passive: true });
  section.addEventListener('wheel', pause, { passive: true });
  section.addEventListener('focusin', pause);
  section.addEventListener('keydown', event => {
    pause();
    if (event.target !== track) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.preventDefault();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'Home') goTo(1);
    if (event.key === 'End') goTo(slides.length);
  });
  section.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    schedule();
  });
  section.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = false;
    schedule();
  });
  carousel.querySelector('[data-previous]').addEventListener('click', () => { pause(); move(-1); });
  carousel.querySelector('[data-next]').addEventListener('click', () => { pause(); move(1); });

  const onMotionChange = () => {
    if (motion.matches) pause();
    schedule();
  };
  if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
  else motion.addListener(onMotionChange);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && automaticMove) {
      cancelAnimation();
      automaticMove = false;
    }
    schedule();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
      schedule();
    }, { threshold: .15 }).observe(carousel);
  } else {
    visible = true;
  }
  function resize() {
    if (Math.abs(track.clientWidth - lastWidth) < 1) return;
    lastWidth = track.clientWidth;
    goTo(current + 1, false);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(track);
  else window.addEventListener('resize', resize);

  updateCurrent(0, false);
  goTo(1, false);
  toolbar.hidden = false;
  carousel.classList.add('carousel-ready');
  schedule();
})();
