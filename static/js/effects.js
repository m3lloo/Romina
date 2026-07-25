/* Retro pixel confetti burst — used when the letter opens and when a
   guestbook message is sent. */
window.burstConfetti = (() => {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return () => { };

  const ctx = canvas.getContext('2d');
  const colors = ['#c65b6c', '#d9a441', '#e8c483', '#a43f52', '#83997e', '#faf3ea'];
  let particles = [];
  let running = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn(originX, originY) {
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 14,
        life: 0,
        maxLife: 60 + Math.random() * 35,
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.vy += 0.12;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life++;

      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y));
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    particles = particles.filter((p) => p.life < p.maxLife);
    if (particles.length > 0) {
      requestAnimationFrame(step);
    } else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  window.addEventListener('resize', resize);
  resize();

  return function burst(x, y) {
    spawn(x ?? canvas.width / 2, y ?? canvas.height / 3);
    if (!running) {
      running = true;
      requestAnimationFrame(step);
    }
  };
})();
