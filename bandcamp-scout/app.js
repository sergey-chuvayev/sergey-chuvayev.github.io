'use strict';
const key = 'bandcamp-scout-votes-v1';
const releases = [...document.querySelectorAll('.release')];
let votes = {};
let storageAvailable = true;
try {
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    for (const card of releases) {
      const id = card.dataset.album;
      if (stored[id] === 'yes' || stored[id] === 'no') votes[id] = stored[id];
    }
  }
} catch { storageAvailable = false; }
const lineFor = card => `${votes[card.dataset.album] === 'yes' ? 'YES' : 'NO'}: ${card.querySelector('.artist').textContent} — ${card.querySelector('.title').textContent}`;
let statusTimer;
function announce(message) {
  const status = document.querySelector('#status');
  status.textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { status.textContent = ''; }, 3000);
}
function render() {
  const lines = [];
  for (const card of releases) {
    const vote = votes[card.dataset.album];
    for (const button of card.querySelectorAll('[data-vote]')) button.setAttribute('aria-pressed', String(button.dataset.vote === vote));
    card.querySelector('.vote-result').hidden = !vote;
    card.querySelector('.vote-line').value = vote ? lineFor(card) : '';
    if (vote) lines.push(lineFor(card));
  }
  document.querySelector('#vote-count').textContent = `${lines.length} / ${releases.length}`;
  document.querySelector('#empty-feedback').hidden = lines.length > 0;
  const feedback = document.querySelector('#feedback-text');
  feedback.hidden = !lines.length;
  feedback.value = lines.join('\n');
  feedback.rows = Math.max(4, lines.length * 2);
  document.querySelector('#copy-all').disabled = !lines.length;
  document.querySelector('#storage-note').textContent = storageAvailable ? 'Saved on this browser.' : 'Browser storage unavailable. Copy your feedback before leaving.';
}
async function copy(field) {
  try {
    await navigator.clipboard.writeText(field.value);
    announce('Copied to clipboard.');
  } catch {
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    announce('Text selected. Use your device’s Copy command.');
  }
}
for (const card of releases) {
  card.querySelector('.votes').setAttribute('aria-label', `Rate ${card.querySelector('.artist').textContent} — ${card.querySelector('.title').textContent}`);
  for (const button of card.querySelectorAll('[data-vote]')) {
    button.addEventListener('click', () => {
      const id = card.dataset.album;
      if (votes[id] === button.dataset.vote) delete votes[id];
      else votes[id] = button.dataset.vote;
      try { localStorage.setItem(key, JSON.stringify(votes)); storageAvailable = true; }
      catch { storageAvailable = false; }
      render();
    });
  }
  card.querySelector('.copy-vote').addEventListener('click', () => copy(card.querySelector('.vote-line')));
}
document.querySelector('#copy-all').addEventListener('click', () => copy(document.querySelector('#feedback-text')));
render();
