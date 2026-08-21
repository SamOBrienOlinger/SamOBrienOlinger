document.getElementById('year').textContent = new Date().getFullYear();

const navLinks = [...document.querySelectorAll('nav a')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.removeAttribute('aria-current'));
      const active = navLinks.find(link => link.getAttribute('href') === `#${entry.target.id}`);
      if (active) active.setAttribute('aria-current', 'location');
    });
  }, { rootMargin: '-35% 0px -55%' });
  sections.forEach(section => observer.observe(section));
}

const heroVideo = document.getElementById('heroVideo');
const heroReplay = document.getElementById('heroReplay');
const heroMedia = document.getElementById('heroMedia');

if (heroVideo && heroReplay && heroMedia) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visitKey = 'soo-hero-video-played';
  let hasPlayed = false;

  try {
    hasPlayed = sessionStorage.getItem(visitKey) === 'true';
  } catch (_) {
    hasPlayed = false;
  }

  const showReplay = () => {
    heroReplay.classList.add('is-visible');
    heroMedia.classList.add('has-ended');
  };

  const playVideo = () => {
    heroReplay.classList.remove('is-visible');
    heroMedia.classList.remove('has-ended');
    heroVideo.currentTime = 0;
    const playPromise = heroVideo.play();
    if (playPromise) playPromise.catch(showReplay);
  };

  heroVideo.addEventListener('ended', () => {
    try { sessionStorage.setItem(visitKey, 'true'); } catch (_) {}
    showReplay();
  });

  heroReplay.addEventListener('click', playVideo);
  heroVideo.addEventListener('click', () => {
    if (heroVideo.ended || heroVideo.paused) playVideo();
  });

  if (!hasPlayed && !reducedMotion) {
    const startOnReady = () => {
      const playPromise = heroVideo.play();
      if (playPromise) playPromise.catch(showReplay);
    };
    if (heroVideo.readyState >= 2) startOnReady();
    else heroVideo.addEventListener('canplay', startOnReady, { once: true });
  } else {
    showReplay();
  }
}