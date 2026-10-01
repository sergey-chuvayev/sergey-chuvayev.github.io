# Bandcamp Scout player redesign

## Final approved scope

The initial waveform proposal was superseded by the user's instruction to keep the live Bandcamp embeds, omit waveforms, fix overlapping playback, and widen/redesign the page. Daily selections must not depend on committed audio files or expiring preview URLs.

Retain the charcoal and lime listening-room identity. Widen the desktop page to 1,440px, use more generous horizontal player rows, highlight the active release, and preserve mobile stacking, release links, voting, and local feedback storage.

## Playback architecture

Bandcamp's embed reports readiness via `playerinited` but does not expose a supported remote pause/play interface. Keep iframe markup in inert templates and mount at most one live iframe. The first player loads automatically. Loading another release removes the previous iframe synchronously, which destroys its playback context. The user then presses play in Bandcamp's native controls. A Stop / close control also unloads the iframe.

Validate readiness messages against both the Bandcamp origin and the active iframe window. Cancel stale loading timers on switches. Show reload and direct-link guidance when the player takes too long. Label the state as ready, never infer whether the inaccessible native player is playing.

## Validation

Reproduce the original multiple-player failure with a browser regression test. Check real Bandcamp playback and switching, fixture-based native audio context destruction, rapid switching, keyboard controls, feedback persistence, slow loading, and widths from 320px to 1,440px. Review desktop/mobile screenshots before committing.

## Future waveforms

Waveform calculation can run entirely in the browser using the Web Audio API. Obtaining readable current audio bytes is a separate integration problem: direct browser fetches of the tested Bandcamp album and preview URLs failed. This change does not add a proxy, scrape audio, or implement waveforms.
