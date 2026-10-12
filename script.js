const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav');
const progressBar = document.querySelector('.scroll-progress span');

menuButton?.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

// Reveal content as it enters the viewport. Keep a no-JS fallback by only
// enabling the hidden starting state after this script has loaded.
const revealTargets = document.querySelectorAll(
  '.section-heading, .about-grid, .skill-card, .work-intro, .project-card, .quote-inner, .contact-grid, .hero-copy, .hero-art'
);
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealTargets.forEach((element, index) => {
    element.classList.add('reveal');
    if (element.classList.contains('skill-card') || element.classList.contains('project-card')) {
      element.style.setProperty('--reveal-delay', `${(index % 3) * 90}ms`);
    }
  });
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
}

// Lightweight scroll progress indicator.
let scrollTicking = false;
const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
  scrollTicking = false;
};
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(updateScrollProgress);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollProgress();

// Subtle pointer tilt for the abstract hero artwork on pointer devices only.
const heroArt = document.querySelector('.hero-art');
if (heroArt && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroArt.addEventListener('pointermove', (event) => {
    const rect = heroArt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroArt.style.setProperty('--pointer-x', `${x * 8}px`);
    heroArt.style.setProperty('--pointer-y', `${y * 8}px`);
  });
  heroArt.addEventListener('pointerleave', () => {
    heroArt.style.setProperty('--pointer-x', '0px');
    heroArt.style.setProperty('--pointer-y', '0px');
  });
}


// Blue cherry-blossom particles: lightweight canvas animation, no external libraries.
(() => {
  const canvas = document.getElementById('blossom-canvas');
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let width = 0, height = 0, raf = 0, last = 0;
  const smallScreen = () => window.innerWidth < 700;
  const petals = [];
  const count = () => smallScreen() ? 16 : 30;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    while (petals.length > count()) petals.pop();
    while (petals.length < count()) petals.push(makePetal(true));
  };
  const makePetal = (initial = false) => ({
    x: Math.random() * (width || innerWidth), y: initial ? Math.random() * (height || innerHeight) : -20,
    size: 3 + Math.random() * 5, speed: .25 + Math.random() * .65,
    drift: (Math.random() - .5) * .55, phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * .025, angle: Math.random() * Math.PI * 2,
    alpha: .22 + Math.random() * .45, hue: 195 + Math.random() * 28
  });
  const drawBlossom = (p) => {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.globalAlpha = p.alpha;
    ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, .9)`;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5); ctx.beginPath();
      ctx.ellipse(0, -p.size * .72, p.size * .36, p.size * .7, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, p.size * .22, 0, Math.PI * 2);
    ctx.fillStyle = '#d9efff'; ctx.fill();
    // Tiny tech-like glint on a few petals.
    if (p.size > 6) { ctx.strokeStyle = `hsla(${p.hue}, 100%, 82%, .5)`; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-p.size*1.5, 0); ctx.lineTo(p.size*1.5, 0); ctx.stroke(); }
    ctx.restore();
  };
  const frame = (time) => {
    raf = requestAnimationFrame(frame);
    if (time - last < 32) return; // cap around 30fps for battery-friendly motion
    last = time; ctx.clearRect(0, 0, width, height);
    for (const p of petals) {
      p.phase += .012; p.angle += p.spin; p.y += p.speed; p.x += p.drift + Math.sin(p.phase) * .35;
      drawBlossom(p);
      if (p.y > height + 24 || p.x < -24 || p.x > width + 24) Object.assign(p, makePetal(false));
    }
  };
  resize(); window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { last = 0; raf = requestAnimationFrame(frame); }
  });
  raf = requestAnimationFrame(frame);
})();
