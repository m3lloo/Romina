/* App content that lives inside the story: the music player, the
   guestbook feed, and the confetti moment when the letter is reached. */

document.addEventListener('DOMContentLoaded', () => {
  initLetterCelebration();
  initMusicPlayer();
  initGuestbook();
});

/* ---------------- Letter: confetti the first time it's reached ---------------- */
function initLetterCelebration() {
  const letterSection = document.getElementById('letter');
  if (!letterSection) return;

  let celebrated = false;
  function celebrate() {
    if (celebrated || !window.burstConfetti) return;
    celebrated = true;
    const rect = letterSection.getBoundingClientRect();
    window.burstConfetti(rect.left + rect.width / 2, rect.top + 140);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          celebrate();
          observer.disconnect();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(letterSection);
  } else {
    celebrate();
  }
}

/* ---------------- Music player ---------------- */
function initMusicPlayer() {
  const audio = document.getElementById('audioPlayer');
  const playBtn = document.getElementById('playBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const progressBar = document.getElementById('progressBar');
  const timeElapsed = document.getElementById('timeElapsed');
  const timeDuration = document.getElementById('timeDuration');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const disc = document.getElementById('playerVinyl');
  const playlistEl = document.getElementById('playlistList');
  const volumeBar = document.getElementById('volumeBar');

  if (!audio || !playBtn) return;

  const items = playlistEl ? Array.from(playlistEl.querySelectorAll('li')) : [];
  let currentIndex = Math.max(0, items.findIndex((el) => el.classList.contains('active')));
  let isPlaying = !audio.paused && !!audio.src;

  function fmt(s) {
    if (!Number.isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function loadTrack(index, autoplay) {
    if (!items.length) return;
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];
    audio.src = item.dataset.src;
    audio.load();
    trackTitle.textContent = item.dataset.title;
    trackArtist.textContent = item.dataset.artist;
    items.forEach((el, i) => el.classList.toggle('active', i === currentIndex));
    progressBar.value = 0;
    timeElapsed.textContent = '0:00';
    timeDuration.textContent = '0:00';
    if (autoplay) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  function setPlaying(state) {
    isPlaying = state;
    const iconPlay = playBtn.querySelector('.icon-play');
    const iconPause = playBtn.querySelector('.icon-pause');
    if (iconPlay) iconPlay.style.display = isPlaying ? 'none' : '';
    if (iconPause) iconPause.style.display = isPlaying ? '' : 'none';
    if (disc) disc.classList.toggle('spinning', isPlaying);
  }

  if (volumeBar) {
    audio.volume = volumeBar.value / 100;
    volumeBar.addEventListener('input', () => { audio.volume = volumeBar.value / 100; });
  }

  playBtn.addEventListener('click', () => {
    if (!audio.src) { loadTrack(0, true); return; }
    if (isPlaying) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}); }
  });

  if (prevBtn) prevBtn.addEventListener('click', () => loadTrack(currentIndex - 1, isPlaying));
  if (nextBtn) nextBtn.addEventListener('click', () => loadTrack(currentIndex + 1, isPlaying));

  items.forEach((item, i) => {
    item.addEventListener('click', () => loadTrack(i, true));
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    timeElapsed.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => {
    timeDuration.textContent = fmt(audio.duration);
  });
  progressBar.addEventListener('input', () => {
    if (audio.duration) audio.currentTime = (progressBar.value / 100) * audio.duration;
  });
  audio.addEventListener('ended', () => loadTrack(currentIndex + 1, true));
  audio.addEventListener('play', () => setPlaying(true));
  audio.addEventListener('pause', () => setPlaying(false));

  if (audio.src) {
    const activeItem = items.find((el) => audio.src.endsWith(el.dataset.src.split('/').pop()));
    if (activeItem) {
      trackTitle.textContent = activeItem.dataset.title;
      trackArtist.textContent = activeItem.dataset.artist;
    }
    setPlaying(!audio.paused);
  } else if (!window.__PLAYLIST_HAS_SONGS__ && trackArtist) {
    trackArtist.textContent = 'add MP3s to static/music/';
  }
}

/* ---------------- Guestbook ---------------- */
function initGuestbook() {
  const messagesContainer = document.getElementById('messagesContainer');
  if (!messagesContainer) return;

  function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  function render(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    if (!messages.length) {
      container.innerHTML = '<div class="msg-card empty">messages will appear here as people share their wishes</div>';
      return;
    }
    const sorted = [...messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    container.innerHTML = sorted.map((msg, i) => `
      <div class="msg-card" style="animation-delay:${Math.min(i, 8) * 40}ms">
        <p class="msg-text">&ldquo;${escapeHtml(msg.message)}&rdquo;</p>
        <div class="msg-meta"><span>&mdash; ${escapeHtml(msg.sender_name || 'Anonymous')}</span><span>${formatTime(msg.created_at)}</span></div>
      </div>
    `).join('');
  }

  async function fetchMessages() {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (!Array.isArray(data.messages)) return;
      render(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  fetchMessages();
  setInterval(fetchMessages, 5000);
}
