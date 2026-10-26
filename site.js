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

const projectVideo = document.querySelector('.project-film video');
if (projectVideo) {
  const showVideoError = () => { document.getElementById('videoError').hidden = false; };
  projectVideo.addEventListener('error', showVideoError);
  projectVideo.querySelector('source').addEventListener('error', showVideoError);
  projectVideo.addEventListener('loadeddata', () => { document.getElementById('videoError').hidden = true; });
}
