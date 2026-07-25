/* Message submission for the standalone greeting page. */
(function greetForm() {
  const messageForm = document.getElementById('messageForm');
  if (!messageForm) return;

  const senderNameInput = document.getElementById('senderName');
  const messageTextInput = document.getElementById('messageText');
  const submitBtn = document.getElementById('submitBtn');
  const formMessage = document.getElementById('formMessage');
  const formWrap = document.getElementById('messageFormWrap');
  const successPanel = document.getElementById('greetSuccess');
  const charCount = document.getElementById('charCount');
  const sendAnotherBtn = document.getElementById('sendAnotherBtn');
  const maxLen = messageTextInput.maxLength > 0 ? messageTextInput.maxLength : 500;

  const submitBtnDefaultHtml = submitBtn.innerHTML;

  function showError(text) {
    formMessage.textContent = text;
    formMessage.className = 'form-message error';
    formMessage.style.display = 'block';
  }

  function clearError() {
    formMessage.style.display = 'none';
    formMessage.textContent = '';
  }

  function updateCharCount() {
    if (!charCount) return;
    const len = messageTextInput.value.length;
    charCount.textContent = `${len} / ${maxLen}`;
    charCount.classList.toggle('is-near-limit', len >= maxLen - 30);
  }

  messageTextInput.addEventListener('input', () => {
    clearError();
    updateCharCount();
  });
  updateCharCount();

  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      messageForm.reset();
      updateCharCount();
      clearError();
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtnDefaultHtml;
      successPanel.style.display = 'none';
      formWrap.style.display = '';
      messageTextInput.focus();
    });
  }

  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const senderName = senderNameInput.value.trim() || 'Anonymous';
    const messageText = messageTextInput.value.trim();

    if (messageText.length < 5) {
      showError('Please write a message with at least 5 characters.');
      messageTextInput.focus();
      return;
    }

    clearError();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span>';

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_name: senderName, message: messageText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      window.burstConfetti(window.innerWidth / 2, window.innerHeight / 2);
      formWrap.style.display = 'none';
      successPanel.style.display = 'block';
      successPanel.setAttribute('tabindex', '-1');
      successPanel.focus();
    } catch (error) {
      showError(error.message || 'Error sending message. Please check your connection.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtnDefaultHtml;
    }
  });
})();