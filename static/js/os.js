/* Site chrome: fixed nav + mobile menu, the top progress line, the
   thread that fills in as each chapter is reached, and the fade/rise
   reveal on each section body. */
(function () {
  const nav = document.getElementById('siteNav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const progressLine = document.getElementById('progressLine');
  const thread = document.getElementById('thread');
  const sections = Array.from(document.querySelectorAll('.story-section'));

  function closeMobileNav() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  document.querySelectorAll('[data-scroll-to]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.dataset.scrollTo;
      if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const dest = document.getElementById(target);
        if (dest) dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      closeMobileNav();
    });
  });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  let ticking = false;
  function updateOnScroll() {
    ticking = false;

    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);

    if (progressLine) {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
      progressLine.style.width = pct + '%';
    }

    if (thread) {
      const rect = thread.getBoundingClientRect();
      const threadTop = rect.top + window.scrollY;
      const threadHeight = thread.offsetHeight || 1;
      const readLine = window.scrollY + window.innerHeight * 0.4;
      const localPct = Math.min(Math.max((readLine - threadTop) / threadHeight, 0), 1);
      thread.style.setProperty('--fill', (localPct * threadHeight).toFixed(1) + 'px');
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', updateOnScroll);
  updateOnScroll();

  if ('IntersectionObserver' in window && sections.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.15 });

    const markerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          sections.forEach((s) => s.classList.remove('is-active'));
          entry.target.classList.add('is-active', 'is-visited');
        } else if (entry.boundingClientRect.top < 0) {
          entry.target.classList.add('is-visited');
          entry.target.classList.remove('is-active');
        }
      });
    }, { threshold: 0.5 });

    sections.forEach((s) => {
      revealObserver.observe(s);
      markerObserver.observe(s);
    });
  } else {
    sections.forEach((s) => s.classList.add('in-view', 'is-visited'));
  }

  document.dispatchEvent(new CustomEvent('story:ready'));
})();
