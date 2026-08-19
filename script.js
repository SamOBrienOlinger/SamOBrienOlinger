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