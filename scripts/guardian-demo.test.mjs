import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildChunk, makeKit } from '../templates/layout.js';
import { generateGuardianDemo, syntheticScenario, OWNER, TOTAL, STEP } from './guardian-demo.mjs';

const read = file => JSON.parse(readFileSync(file, 'utf8'));

test('scenario uses a bounded fictional local route without real coordinates or actuation', () => {
  const { index, chunk, guardian } = syntheticScenario();
  assert.equal(index.total, TOTAL);
  assert.equal(index.chunk, TOTAL);
  assert.equal(index.count, 1);
  assert.equal(index.syntheticOnly, true);
  assert.equal(index.noRealWorldCoordinates, true);
  assert.equal(guardian.ownerAttribution, OWNER);
  assert.equal(guardian.physicalActuation, false);
  assert.equal(guardian.targeting, false);
  assert.equal(guardian.weapons, false);
  assert.equal(guardian.remoteConnections, false);
  assert.ok(guardian.fleet.length > 0 && guardian.fleet.length <= 10);
  assert.equal(chunk.xy.length, TOTAL / STEP + 1);
  assert.equal(chunk.samples.length, chunk.xy.length);
  assert.equal(chunk.xy[0][0], 0);
  assert.equal(chunk.xy.at(-1)[0], TOTAL);
  assert.ok(chunk.fronts.every(x => x[0] >= 0 && x[0] + x[1] <= TOTAL));
  for (const key of ['latitude', 'longitude', '"lat"', '"lon"', '"ip_address"', '"aimpoint"']) {
    assert.equal(JSON.stringify({ index, chunk, guardian }).includes(key), false, key);
  }
});

test('synthetic route loads in the original Pixel Path layout builder', () => {
  const { index, chunk } = syntheticScenario();
  const kit = { themes: [{ id: 'guardian', from: 0 }], pictures: {
    industrial: { role: 'industrial', theme: 'guardian', w: 64, h: 72, hm: 12, placeholder: true },
    civic: { role: 'civic', theme: 'guardian', w: 64, h: 72, hm: 12, placeholder: true },
    house: { role: 'house', theme: 'guardian', w: 64, h: 72, hm: 12, placeholder: true },
  } };
  const built = buildChunk(chunk, { idx: index, kit: makeKit(kit), landmarks: [] });
  assert.equal(built.segs.length, TOTAL / 2 + 1);
  assert.ok(built.planes.length > 0);
  assert.ok(built.segs.every(s => Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.hd)));
});

test('output is reproducible, self-contained and credits synthetic data correctly', () => {
  const a = mkdtempSync(join(tmpdir(), 'guardian-pixel-a-'));
  const b = mkdtempSync(join(tmpdir(), 'guardian-pixel-b-'));
  try {
    generateGuardianDemo(a);
    generateGuardianDemo(b);
    for (const name of ['data/index.json', 'data/c0000.json', 'data/guardian.json',
      'data/landmarks.json', 'art/kit.json']) {
      assert.equal(readFileSync(join(a, name), 'utf8'), readFileSync(join(b, name), 'utf8'));
    }
    for (const path of ['index.html', 'road.js', 'layout.js', 'guardian-overlay.css',
      'guardian-overlay.js', 'art/depot-1.svg', 'art/station.svg']) {
      assert.equal(existsSync(join(a, path)), true, path);
    }
    const doc = readFileSync(join(a, 'index.html'), 'utf8');
    assert.match(doc, /guardian-overlay.js/);
    assert.match(doc, /guardian-overlay.css/);
    assert.match(doc, /No real mapping, external imagery or robotics feeds/);
    assert.match(doc, /IDX.syntheticOnly === true/);
    assert.match(doc, /Map data ©/);  // real-route attribution remains in the original fallback
    assert.equal(read(join(a, 'data', 'index.json')).syntheticOnly, true);
    assert.equal(read(join(a, 'data', 'guardian.json')).fleet.length, 5);
    assert.equal(existsSync(join(a, '.cache')), false);
  } finally {
    rmSync(a, { recursive: true, force: true });
    rmSync(b, { recursive: true, force: true });
  }
});


test('full documented controls are included and original Pixel Path shortcuts survive', () => {
  const dir = mkdtempSync(join(tmpdir(), 'guardian-pixel-controls-'));
  try {
    generateGuardianDemo(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    const overlay = readFileSync(join(dir, 'guardian-overlay.js'), 'utf8');
    const viewer = readFileSync(join(dir, 'guardian-overlay.css'), 'utf8');
    for (const id of ['guardian-hold', 'guardian-resume', 'guardian-reset',
      'guardian-speed', 'guardian-seek', 'guardian-waypoint', 'guardian-jump',
      'guardian-view', 'guardian-map', 'guardian-info', 'guardian-units',
      'guardian-focus', 'guardian-event-select', 'guardian-inject',
      'guardian-clear-event', 'guardian-export', 'guardian-screenshot',
      'guardian-collapse']) {
      assert.ok(html.includes('id="' + id + '"'), id);
    }
    assert.match(html, /get paused\(\)/);
    assert.match(html, /setSpeedKmh\(value\)/);
    assert.match(html, /seekMetres\(value\)/);
    assert.match(html, /setMapVisible\(value\)/);
    assert.match(html, /setInfoVisible\(value\)/);
    assert.match(html, /'ArrowUp'/);
    assert.match(html, /'m' \|\| e.key === 'M'/);
    assert.match(html, /data-pixel-path-controls/);
    assert.match(overlay, /scenario\.physicalActuation !== false/);
    assert.match(overlay, /scenario\.weapons !== false/);
    assert.match(overlay, /URL\.createObjectURL/);
    assert.match(viewer, /#guardian-panel/);
    assert.match(viewer, /\[hidden\]/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
