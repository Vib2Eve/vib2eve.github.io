'use strict';
const copyButton = document.getElementById('copyPrompt');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const status = document.getElementById('copyStatus');
    const prompt = document.getElementById('representativePrompt');
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(prompt.textContent.trim());
      status.textContent = copyButton.dataset.copied;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(prompt);
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = copyButton.dataset.failed;
    }
  });
}
