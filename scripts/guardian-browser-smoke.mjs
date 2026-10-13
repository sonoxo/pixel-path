// Optional Chromium smoke test. Requires Playwright + Chromium on CI, not in normal user install.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
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
  // Full upstream renderer controls must also work through visible GUI controls.
  await page.locator('#guardian-speed').evaluate(el => {
    el.value = '45';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => Math.abs(window.__trip.speedKmh - 45) < 2);
  assert.match(await page.locator('#guardian-speed-value').textContent(), /45 km\/h/);
  await page.locator('#guardian-waypoint').selectOption('1180');
  await page.locator('#guardian-jump').click();
  await page.waitForFunction(() => Math.abs(window.__trip.pos - 1180) < 80);
  await page.locator('#guardian-seek').evaluate(el => {
    el.value = '650';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => Math.abs(window.__trip.pos - 650) < 80);
  const beforeMap = await page.evaluate(() => window.__trip.mapVisible);
  await page.locator('#guardian-map').click();
  assert.equal(await page.evaluate(() => window.__trip.mapVisible), !beforeMap);
  const beforeInfo = await page.evaluate(() => window.__trip.infoVisible);
  await page.locator('#guardian-info').click();
  assert.equal(await page.evaluate(() => window.__trip.infoVisible), !beforeInfo);
  await page.locator('#guardian-view').selectOption('30');
  await page.locator('#guardian-units button[data-unit-id="G-03"]').click();
  assert.match(await page.locator('#guardian-unit-detail').textContent(), /G-03/);
  await page.locator('#guardian-focus').click();
  await page.waitForFunction(() => Math.abs(window.__trip.pos - 1280) < 90);
  await page.locator('#guardian-event-select').selectOption('comms');
  await page.locator('#guardian-inject').click();
  assert.match(await page.locator('#guardian-event').textContent(), /relay interruption/);
  await page.locator('#guardian-clear-event').click();
  assert.match(await page.locator('#guardian-event').textContent(), /No active/);

  const jsonPromise = page.waitForEvent('download');
  await page.locator('#guardian-export').click();
  const jsonDownload = await jsonPromise;
  assert.equal(jsonDownload.suggestedFilename(), 'guardian-training-snapshot.json');
  const exported = JSON.parse(readFileSync(await jsonDownload.path(), 'utf8'));
  assert.equal(exported.syntheticOnly, true);
  assert.equal(exported.physicalActuation, false);
  assert.equal(exported.weapons, false);
  assert.equal(exported.selectedUnit, 'G-03');
  assert.equal(exported.activeTrainingEvent, null);

  const imagePromise = page.waitForEvent('download');
  await page.locator('#guardian-screenshot').click();
  const imageDownload = await imagePromise;
  assert.equal(imageDownload.suggestedFilename(), 'guardian-pixel-path-frame.png');
  assert.ok(readFileSync(await imageDownload.path()).length > 1000);

  await page.locator('#guardian-collapse').click();
  assert.equal(await page.locator('#guardian-panel-body').evaluate(el => el.hidden), true);
  await page.locator('#guardian-collapse').click();
  assert.equal(await page.locator('#guardian-panel-body').evaluate(el => el.hidden), false);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.locator('#guardian-panel').boundingBox();
  assert.ok(mobile && mobile.x >= 0 && mobile.x + mobile.width <= 390, 'mobile panel fits viewport');
  await page.locator('#guardian-hold').click();
  await page.waitForFunction(() => window.__trip.paused === true);
  await page.locator('#guardian-resume').click();
  await page.waitForFunction(() => window.__trip.paused === false);
  assert.deepEqual(remote, [], 'no external network connections are permitted');
  assert.deepEqual(errors, [], 'browser errors');
  console.log('Guardian Pixel Path Chromium smoke test passed; screenshot ' + screenshot);
} finally {
  await browser?.close();
  if (server) await new Promise(ok => server.close(ok));
  rmSync(root, { recursive: true, force: true });
}
