'use strict';
const key = 'bandcamp-scout-votes-v1';
const releases = [...document.querySelectorAll('.release')];
// Same key, richer flat map: { [albumId]: { vote: 'yes'|'no', artist, title, url } }.
// Legacy string votes are accepted; absent-volume entries are never discarded.
let votes = Object.create(null);
let storageAvailable = true;
function metadata(card) {
  return { artist: card.querySelector('.artist').textContent.trim(),
    title: card.querySelector('.title').textContent.trim(),
    url: card.querySelector('.actions a').href };
}
function saveVotes() {
  try { localStorage.setItem(key, JSON.stringify(votes)); storageAvailable = true; }
  catch { storageAvailable = false; }
}
try {
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    for (const [id, value] of Object.entries(stored)) {
      const entry = typeof value === 'string' ? { vote: value } : value;
      if (entry && (entry.vote === 'yes' || entry.vote === 'no')) votes[id] = entry;
    }
    for (const card of releases) {
      const entry = votes[card.dataset.album];
      if (entry) Object.assign(entry, metadata(card));
    }
    saveVotes();
  }
} catch { storageAvailable = false; }
const lineFor = card => `${votes[card.dataset.album]?.vote === 'yes' ? 'YES' : 'NO'}: ${card.querySelector('.artist').textContent} — ${card.querySelector('.title').textContent}`;
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
    const vote = votes[card.dataset.album]?.vote;
    for (const button of card.querySelectorAll('[data-vote]')) button.setAttribute('aria-pressed', String(button.dataset.vote === vote));
    card.querySelector('.vote-result').hidden = !vote;
    card.querySelector('.vote-line').value = vote ? lineFor(card) : '';
    if (vote) lines.push(lineFor(card));
  }
  renderLiked();
  document.querySelector('#vote-count').textContent = `${lines.length} / ${releases.length}`;
  document.querySelector('#empty-feedback').hidden = lines.length > 0;
  const feedback = document.querySelector('#feedback-text');
  feedback.hidden = !lines.length;
  feedback.value = lines.join('\n');
  feedback.rows = Math.max(4, lines.length * 2);
  document.querySelector('#copy-all').disabled = !lines.length;
  document.querySelector('#storage-note').textContent = storageAvailable ? 'Saved on this browser.' : 'Browser storage unavailable. Copy your feedback before leaving.';
}
function safeURL(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
function listRow(title, detail, url) {
  const row = document.createElement('li');
  row.className = 'library-row';
  const copy = document.createElement('div');
  copy.className = 'library-copy';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const note = document.createElement('span');
  note.textContent = detail;
  copy.append(heading, note);
  row.append(copy);
  if (safeURL(url)) {
    const open = document.createElement('a');
    open.href = safeURL(url);
    open.target = '_blank';
    open.rel = 'noopener';
    open.textContent = 'Open ↗';
    open.setAttribute('aria-label', `Open ${title} (new tab)`);
    row.append(open);
  }
  return row;
}
function renderLiked() {
  const list = document.querySelector('#liked-list');
  list.replaceChildren();
  const likes = Object.entries(votes).filter(([, entry]) => entry.vote === 'yes');
  document.querySelector('#liked-count').textContent = likes.length;
  document.querySelector('#empty-liked').hidden = likes.length > 0;
  for (const [id, entry] of likes) {
    const title = entry.title || `Saved release ${id}`;
    const row = listRow(title, entry.artist || 'Older like · details unavailable', entry.url);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${title} from liked`);
    remove.addEventListener('click', () => {
      const index = [...list.children].indexOf(row);
      delete votes[id];
      saveVotes();
      render();
      const next = list.children[Math.min(index, list.children.length - 1)];
      (next?.querySelector('button') || document.querySelector('#liked-title')).focus({ preventScroll: true });
      announce('Like removed.');
    });
    row.append(remove);
    list.append(row);
  }
}
const humanize = value => String(value || '').replace(/[-_]+/g, ' ').trim();
async function loadStash() {
  const status = document.querySelector('#stash-status');
  const retry = document.querySelector('#stash-retry');
  retry.hidden = true;
  status.textContent = 'Loading your stash…';
  try {
    const response = await fetch('./custom-stash.json');
    if (!response.ok) throw new Error('Stash unavailable');
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid stash');
    const rows = data.items.map((item, index) => {
      if (!safeURL(item.url)) throw new Error('Invalid stash link');
      const path = (item.path || '').split('/');
      const title = item.title || item.label || humanize(item.slug) ||
        humanize(path.slice(1).join('/')) || `YouTube · ${item.id || new URL(item.url).searchParams.get('v') || index + 1}`;
      const detail = [String(index + 1).padStart(2, '0'), item.source,
        humanize(item.artist || path[0]), item.kind].filter(Boolean).join(' / ');
      return listRow(title, detail, item.url);
    });
    document.querySelector('#stash-list').replaceChildren(...rows);
    document.querySelector('#stash-count').textContent = rows.length;
    status.textContent = rows.length ? 'Your shared finds, in original order. Open a link to listen.' : 'No finds in the stash yet.';
  } catch {
    status.textContent = 'Couldn’t load the stash. Check your connection and try again.';
    retry.hidden = false;
  }
}
document.querySelector('#stash-retry').addEventListener('click', loadStash);
loadStash();

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
      if (votes[id]?.vote === button.dataset.vote) delete votes[id];
      else votes[id] = { vote: button.dataset.vote, ...metadata(card) };
      saveVotes();
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
