# Bandcamp Scout

A static listening page with live Bandcamp embeds and locally saved release feedback. Serve this directory with any static web server; no build or backend is required.

## Player behavior

The first release's player loads automatically. Choose **Load player** on another release, then press play inside Bandcamp. Switching immediately removes the previous iframe, stopping its audio. **Stop / close** unloads the active player. Returning to a release loads it from the beginning.

Bandcamp's embed sends a readiness message but does not expose a supported remote pause/play interface. Keeping at most one iframe mounted guarantees that this page cannot play overlapping releases, including during rapid switching or slow network loads. The page does not claim to know whether a loaded embed is playing or paused.

No audio files, expiring preview URLs, or waveform data are stored. The templates in `index.html` remain the source of truth for the live album embeds. To update selections, replace the release metadata, album ID, Bandcamp link, and iframe URL/title together; the player and voting code discovers the release cards automatically. Also update the header's release count and edition copy if the selection size changes.

With JavaScript disabled, the direct Bandcamp links remain available.

## Local preview and tests

```sh
python3 -m http.server 8765
```

Open http://localhost:8765. To run browser regression tests with installed Google Chrome:

```sh
npm install
npm test
```

Alternatively, run `npx playwright install chromium` and `BROWSER_CHANNEL=chromium npm test`.

The tests use cross-origin player fixtures with native audio, checking playback-context destruction, switching, keyboard controls, vote persistence, loading failures, and responsive widths without relying on Bandcamp availability.
