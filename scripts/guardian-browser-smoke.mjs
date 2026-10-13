// Optional Chromium smoke test. Requires Playwright + Chromium on CI, not in normal user install.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { generateGuardianDemo } from './guardian-demo.mjs';
import { serve } from './viewer.mjs';

const root = mkdtempSync(join(tmpdir(), 'guardian-pixel-browser-'));
let server, browser;
try {
  generateGuardianDemo(root);
  const started = await serve(root, 0);
  server = started.srv;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', req => {
    const url = new URL(req.url());
    if (url.hostname !== '127.0.0.1') remote.push(url.hostname);
  });
  await page.goto('http://127.0.0.1:' + started.port + '/?map=1&info=1&speed=20');
  await page.waitForFunction(() => window.__trip?.road?.ready(0), null, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelectorAll('#guardian-units .unit').length === 5,
    null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const panelStyle = await page.locator('#guardian-panel').evaluate(el => ({
    position: getComputedStyle(el).position,
    zIndex: getComputedStyle(el).zIndex,
  }));
  assert.equal(panelStyle.position, 'fixed', 'CSS must load from local viewer');
  assert.equal(panelStyle.zIndex, '20', 'training controls must render above road');
  const pixels = await page.locator('#c').evaluate(c => {
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    const p = g.getImageData(Math.floor(w / 2), Math.floor(h / 3), 1, 1).data;
    return [...p];
  });
  assert.equal(pixels.length, 4);
  assert.ok(pixels.slice(0, 3).some(v => v > 10), 'rendered frame must not be blank');
  const screenshot = process.env.GUARDIAN_SCREENSHOT || join(root, 'guardian-screenshot.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.locator('#guardian-hold').click();
  await page.waitForFunction(() => document.querySelector('#guardian-mode')?.textContent === 'REPLAY HELD',
    null, { timeout: 120000 });
  await page.locator('#guardian-resume').click();
  await page.waitForFunction(() => document.querySelector('#guardian-mode')?.textContent === 'OFFLINE REPLAY');
  await page.locator('#guardian-reset').click();
  await page.waitForFunction(() => document.querySelector('#guardian-message')?.textContent.includes('restarted'),
    null, { timeout: 120000 });
  assert.deepEqual(remote, [], 'no external network connections are permitted');
  assert.deepEqual(errors, [], 'browser errors');
  console.log('Guardian Pixel Path Chromium smoke test passed; screenshot ' + screenshot);
} finally {
  await browser?.close();
  if (server) await new Promise(ok => server.close(ok));
  rmSync(root, { recursive: true, force: true });
}
