const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

// A cross-origin player fixture keeps regression tests independent of Bandcamp.
// Real native audio verifies that switching destroys the previous playback context.
const wav = Buffer.alloc(44 + 16000 * 10);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
const fixture = `<button onclick="document.querySelector('audio').play()">Play preview</button><audio loop src="data:audio/wav;base64,${wav.toString('base64')}"></audio><script>parent.postMessage('playerinited', '*')</script>`;

(async () => {
  const server = createServer(async (req, res) => {
    const file = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!['index.html', 'app.js', 'style.css'].includes(file)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(await readFile(path.join(__dirname, '..', file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://bandcamp.com/**', route => route.fulfill({ contentType: 'text/html', body: fixture }));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    assert.equal(await page.locator('iframe').count(), 1, 'Only one playable embed may be mounted');
    const first = page.frameLocator('#release-1 iframe');
    await first.getByRole('button', { name: 'Play preview' }).click();
    await first.locator('audio').evaluate(a => a.play());
    assert.equal(await first.locator('audio').evaluate(a => a.paused), false);
    const oldFrame = page.frames().find(frame => frame.url().includes('EmbeddedPlayer'));
    await Promise.all([
      page.waitForEvent('framedetached', frame => frame === oldFrame),
      page.locator('#release-2 .load-player').click(),
    ]);
    await page.frameLocator('#release-2 iframe').getByRole('button', { name: 'Play preview' }).click();
    assert.equal(oldFrame.isDetached(), true, 'Switching destroys the previous audio context');
    assert.equal(await page.locator('iframe').count(), 1);
    await page.frameLocator('#release-2 iframe').locator('audio').evaluate(a => a.play());
    assert.equal(await page.frameLocator('#release-2 iframe').locator('audio').evaluate(a => a.paused), false);
    assert.equal(await page.locator('#release-1 iframe').count(), 0);
    console.log('PASS: switching releases stops previous audio and keeps one player');

    await page.locator('#release-3 .load-player').focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('#release-3 iframe');
    await page.locator('#release-3 .close-player').click();
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.locator('#release-3 .load-player').evaluate(el => el === document.activeElement), true);
    await page.locator('#release-1 .load-player').click();
    await page.locator('#release-6 .load-player').click();
    assert.equal(await page.locator('iframe').count(), 1);
    assert.equal(await page.locator('#release-6 iframe').count(), 1);
    console.log('PASS: keyboard activation, stopping, and rapid switching');

    await page.locator('#release-1 .like').click();
    await page.locator('#release-2 .dislike').click();
    assert.equal(await page.locator('#vote-count').textContent(), '2 / 6');
    assert.match(await page.locator('#feedback-text').inputValue(), /YES: UMT[\s\S]*NO: Aedis/);
    await page.reload();
    assert.equal(await page.locator('#release-1 .like').getAttribute('aria-pressed'), 'true');
    await page.locator('#release-1 .like').click();
    assert.equal(await page.locator('#vote-count').textContent(), '1 / 6');
    console.log('PASS: voting, persistence, and clearing a vote');

    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px`);
    }
    // A blocked/delayed provider must offer recovery and still allow switching.
    await page.route('https://bandcamp.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Unavailable</p>' }));
    await page.locator('#release-2 .load-player').click();
    await page.locator('#release-2 .retry-player').waitFor({ state: 'visible', timeout: 20000 });
    assert.equal(await page.locator('#release-2 .retry-player').isVisible(), true);
    assert.match(await page.locator('#release-2 .player-label').textContent(), /Taking longer/);
    await page.locator('#release-2 .retry-player').click();
    assert.equal(await page.locator('#release-2 .retry-player').isVisible(), false);
    await page.locator('#release-4 .load-player').scrollIntoViewIfNeeded();
    await page.screenshot(); // Flush compositor hit testing after viewport resizes.
    await page.locator('#release-4 .load-player').click();
    await page.waitForSelector('#release-4 iframe');
    assert.equal(await page.locator('iframe').count(), 1);
    console.log('PASS: delayed player recovery and switching away from unavailable media');
    assert.deepEqual(errors, []);
    console.log('PASS: desktop/mobile layout and no JavaScript errors');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
