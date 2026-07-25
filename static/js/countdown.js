/* Countdown timer anchored to the server clock. */
(function countdown() {
  const elDays = document.getElementById('cdDays');
  const elHours = document.getElementById('cdHours');
  const elMinutes = document.getElementById('cdMinutes');
  const elSeconds = document.getElementById('cdSeconds');
  const note = document.getElementById('countdownNote');
  const hint = document.getElementById('countdownHint');
  const grid = document.getElementById('countdownGrid');

  if (!elDays || !window.__TARGET_DATE_ISO__) return;

  const targetTime = new Date(window.__TARGET_DATE_ISO__).getTime();
  let serverOffset = 0;
  let finished = false;

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, '0');
  }

  function render(msLeft) {
    if (msLeft <= 0) {
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMinutes.textContent = '00';
      elSeconds.textContent = '00';
      return;
    }

    const totalSeconds = Math.floor(msLeft / 1000);
    elDays.textContent = pad(Math.floor(totalSeconds / 86400));
    elHours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    elMinutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    elSeconds.textContent = pad(totalSeconds % 60);
  }

  function nowEstimate() {
    return Date.now() + serverOffset;
  }

  function finish() {
    if (finished) return;
    finished = true;
    grid.style.opacity = '0.5';
    hint.textContent = "it's here";
    note.textContent = 'opening your page now';
    setTimeout(() => window.location.reload(), 900);
  }

  async function syncWithServer() {
    try {
      const res = await fetch('/api/time-check', { cache: 'no-store' });
      const data = await res.json();
      const serverNow = new Date(data.server_time).getTime();
      serverOffset = serverNow - Date.now();

      if (data.unlocked) finish();
    } catch (err) {
      // Keep ticking from the last known offset.
    }
  }

  function tick() {
    const msLeft = targetTime - nowEstimate();
    render(msLeft);
    if (msLeft <= 0) finish();
  }

  syncWithServer().then(tick);
  setInterval(tick, 1000);
  setInterval(syncWithServer, 60000);
})();