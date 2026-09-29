# Bandcamp Scout waveform player

Approved direction: retain the charcoal and lime listening-room identity, widen the desktop page to roughly 1,400px, and give every release a genuine, seekable waveform. Preserve release links, local feedback, and mobile usability.

## Implementation plan

1. Inspect public preview sources and choose a static-hosting-compatible media source. Keep audio on its original host; commit only metadata and waveform peaks derived from that audio.
2. Replace independent iframe players with one shared HTML audio element, accessible per-release controls, playback progress, and clear loading/error states. Starting a different selection replaces the current source immediately. Handle rapid switching and rejected playback without stale UI updates.
3. Use wider release rows, cover artwork, clear track metadata, and full-width waveform timelines. Keep the same restrained colors and responsive mobile stacking.
4. Verify real preview playback, seeking, switching, keyboard controls, feedback persistence, unavailable media, and desktop/mobile layout. Commit the reviewed implementation.

## Constraints

The site is static and currently embeds six album players. Cross-origin embeds do not expose their audio to this page. Real waveform rendering requires preview audio or pregenerated peaks; fabricated decorative bars are not a substitute. Preview availability must be verified before settling the media integration.
