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

// Bandcamp exposes readiness, but no supported remote pause/play interface.
// Mount at most one iframe: removing it destroys its audio context, including
// playback that is still loading. Do not infer playback from hover or focus.
const players = [];
let activePlayer = null;

function deactivatePlayer(player) {
  clearTimeout(player.timer);
  player.frame?.remove();
  player.frame = null;
  player.card.classList.remove('is-active');
  player.panel.hidden = true;
  player.load.hidden = false;
  player.load.setAttribute('aria-expanded', 'false');
  if (activePlayer === player) activePlayer = null;
}

function activatePlayer(player, moveFocus = true) {
  if (activePlayer) deactivatePlayer(activePlayer);
  activePlayer = player;
  player.card.classList.add('is-active');
  player.load.hidden = true;
  player.load.setAttribute('aria-expanded', 'true');
  player.panel.hidden = false;
  player.label.textContent = 'Loading Bandcamp…';
  player.hint.textContent = 'Once loaded, press play in the player below.';
  player.retry.hidden = true;
  player.frame = player.template.content.querySelector('iframe').cloneNode(true);
  player.slot.replaceChildren(player.frame);
  if (moveFocus) player.close.focus({ preventScroll: true });
  player.timer = setTimeout(() => {
    if (activePlayer !== player) return;
    player.label.textContent = 'Taking longer than expected';
    player.hint.textContent = 'Try reloading, or use the Bandcamp link to listen.';
    player.retry.hidden = false;
  }, 15000);
}

for (const card of releases) {
  const embed = card.querySelector('.embed');
  const template = embed.querySelector('.player-template');
  if (!template) continue;
  const artist = card.querySelector('.artist').textContent;
  const title = card.querySelector('.title').textContent;
  const load = document.createElement('button');
  load.className = 'load-player';
  load.type = 'button';
  load.setAttribute('aria-label', `Load player for ${artist} — ${title}`);
  load.setAttribute('aria-expanded', 'false');
  load.innerHTML = '<span class="load-icon" aria-hidden="true">↗</span><span class="load-copy"><strong>Load player</strong><span>Listen on Bandcamp, right here.</span></span><span class="load-arrow" aria-hidden="true">→</span>';
  const panel = document.createElement('div');
  panel.className = 'player-panel';
  panel.id = `${card.id}-player`;
  panel.hidden = true;
  load.setAttribute('aria-controls', panel.id);
  panel.innerHTML = '<div class="player-toolbar"><span class="player-label" role="status"></span><button class="retry-player" type="button" hidden>Reload</button><button class="close-player" type="button">Stop / close <span aria-hidden="true">×</span></button></div><div class="player-slot"></div><p class="player-hint"></p>';
  embed.append(load, panel);
  const player = {
    card, template, load, panel,
    slot: panel.querySelector('.player-slot'),
    label: panel.querySelector('.player-label'),
    hint: panel.querySelector('.player-hint'),
    close: panel.querySelector('.close-player'),
    retry: panel.querySelector('.retry-player'),
    frame: null, timer: null,
  };
  player.close.setAttribute('aria-label', `Stop and close player for ${artist}`);
  load.addEventListener('click', () => activatePlayer(player));
  player.retry.addEventListener('click', () => activatePlayer(player));
  player.close.addEventListener('click', () => {
    deactivatePlayer(player);
    load.focus({ preventScroll: true });
  });
  players.push(player);
}

window.addEventListener('message', event => {
  const player = activePlayer;
  if (!player || event.origin !== 'https://bandcamp.com' ||
      event.source !== player.frame?.contentWindow || event.data !== 'playerinited') return;
  clearTimeout(player.timer);
  player.label.textContent = 'Ready to listen';
  player.hint.textContent = 'Press play above. Loading another release stops this one.';
  player.retry.hidden = true;
});
if (players.length) activatePlayer(players[0], false);
