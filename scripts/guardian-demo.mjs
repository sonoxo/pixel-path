// GPT-Doug Guardian: synthesize an offline, fictional Pixel Path training fly-through.
// MIT renderer © Jon Wheatley. No OSM, paid art, hardware, location or network APIs.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { install, serve } from './viewer.mjs';

export const GUARDIAN_MODE = 'SYNTHETIC_GUARDIAN_REPLAY';
export const OWNER = 'Douglas Montel Brown Jr.';
export const TOTAL = 2400;
export const STEP = 10;

const here = dirname(fileURLToPath(import.meta.url));
const template = join(here, '..', 'templates');
const writeJSON = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');

function createSprite(col, role) {
  const roof = role === 'tree'
    ? '<rect x="29" y="51" width="6" height="20" fill="#705647"/><rect x="18" y="33" width="28" height="25" fill="#126658"/><rect x="22" y="20" width="20" height="20" fill="#1d9780"/><rect x="27" y="9" width="10" height="15" fill="#47c29b"/>'
    : '<rect x="8" y="24" width="48" height="47" fill="#14283b"/><rect x="5" y="18" width="54" height="9" fill="' + col + '"/><rect x="10" y="31" width="44" height="6" fill="' + col + '"/><rect x="15" y="46" width="13" height="14" fill="#2b83a2"/><rect x="35" y="46" width="13" height="14" fill="#365877"/><rect x="29" y="39" width="5" height="32" fill="#243e55"/><rect x="12" y="66" width="40" height="5" fill="#3f728c"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="72" viewBox="0 0 64 72" shape-rendering="crispEdges">' + roof + '</svg>\n';
}

export function syntheticScenario() {
  const xy = [], samples = [];
  const curve = s => 54 * Math.sin(s / 230) + 18 * Math.sin(s / 680);
  const P = s => [Math.round(s), Math.round(curve(s))];
  for (let s = 0; s <= TOTAL; s += STEP) {
    const a = Math.max(0, s - STEP), b = Math.min(TOTAL, s + STEP);
    const heading = Math.atan2(curve(b) - curve(a), b - a || 1);
    const height = 1.4 * Math.sin(s / 390);
    const land = s < 700 ? 'forest' : s < 1350 ? 'grass' : s < 1940 ? 'desert' : 'pave';
    xy.push(P(s));
    samples.push([Math.round(heading * 1000), Math.round(height * 10), 'pr', land, land, 0, 0]);
  }
  const names = ['Guardian Training Corridor', 'Service Junction'];
  const fronts = [
    [170, 55, -26, 'industrial', 12, -1, 8],
    [305, 30, 26, 'industrial', 15, -1, 8],
    [840, 55, -29, 'industrial', 13, -1, 10],
    [1260, 55, 28, 'industrial', 14, -1, 8],
    [1710, 50, -30, 'civic', 17, -1, 12],
    [2160, 50, 26, 'house', 11, -1, 7],
  ];
  const places = [[410, 'Sensor Yard', 2, 0], [1180, 'Relief Station', 2, 0], [1900, 'Relay Annex', 2, 0]];
  const summary = { c: 0, s0: 0, km: TOTAL / 1000, land: { forest: 30, grass: 27, desert: 24, pave: 19 },
    types: { industrial: 245, civic: 50, house: 50 }, built: 0.09, maxH: 17, cross: 1,
    places: places.map(x => x[1]), perKm: [] };
  const chunk = { c: 0, s0: 0, len: TOTAL, step: STEP, xy, samples, names, fronts,
    backs: [], skyline: [], cross: [[1500, 10, 1]], rails: [], places,
    map: { roads: [['pr', xy.filter((_, i) => i % 3 === 0)]], areas: [], lines: [] },
    lm: [], summary };
  const index = { schema: 'pixel-path-guardian-training.v1', title: 'GPT-Doug Guardian Pixel Path',
    from: 'Training Bay Alpha', to: 'Safety Relay Bravo', stops: [], total: TOTAL,
    chunk: TOTAL, count: 1, step: STEP, units: 'km', centre: 'white', country: null,
    drive: 'right', dry: false, syntheticOnly: true, localCartesianOnly: true,
    noRealWorldCoordinates: true, externalActuation: false,
    places: places.map(([s, name, rank]) => [s, name, rank]), chunks: [summary],
    credits: ['Pixel Path renderer © Jon Wheatley (MIT)', 'Synthetic training route, not OpenStreetMap data'] };
  const units = [
    { id: 'G-01', role: 'environmental survey', positionMetres: 220, batteryPercent: 87 },
    { id: 'G-02', role: 'communications resilience', positionMetres: 770, batteryPercent: 92 },
    { id: 'G-03', role: 'rescue support', positionMetres: 1280, batteryPercent: 78 },
    { id: 'G-04', role: 'infrastructure inspection', positionMetres: 1860, batteryPercent: 81 },
    { id: 'G-05', role: 'medical supply logistics', positionMetres: 2210, batteryPercent: 96 },
  ];
  const guardian = { schema: 'gpt-doug-guardian-pixel-path.v1', mode: GUARDIAN_MODE, ownerAttribution: OWNER,
    syntheticOnly: true, localCartesianOnly: true, remoteConnections: false,
    physicalActuation: false, targeting: false, weapons: false, identificationTracking: false,
    fleet: units, humanOperatorReviewRequired: true,
    safetyNotice: 'Offline visual training replay only. Not a military, TAK, or robotics control endpoint.' };
  return { index, chunk, guardian };
}

export function generateGuardianDemo(out) {
  if (typeof out !== 'string' || !out.trim()) throw new TypeError('output directory required');
  const root = resolve(out);
  mkdirSync(join(root, 'data'), { recursive: true });
  mkdirSync(join(root, 'art'), { recursive: true });
  const { index, chunk, guardian } = syntheticScenario();
  writeJSON(join(root, 'data', 'index.json'), index);
  writeJSON(join(root, 'data', 'c0000.json'), chunk);
  writeJSON(join(root, 'data', 'landmarks.json'), []);
  writeJSON(join(root, 'data', 'guardian.json'), guardian);
  const pictures = {};
  const spriteTypes = [
    ['depot-1', 'industrial', '#3ce0d3'],
    ['depot-2', 'industrial', '#67a6ed'],
    ['habitat', 'house', '#edb96f'],
    ['station', 'civic', '#b6a2f4'],
    ['waypoint', 'tree', '#228b72'],
    ['shop', 'shop', '#6ad9bf'],
  ];
  for (const [name, role, color] of spriteTypes) {
    const file = 'art/' + name + '.svg';
    writeFileSync(join(root, file), createSprite(color, role), 'utf8');
    pictures[name] = { file, theme: 'guardian', role, w: 64, h: 72, hm: 12,
      avg: [69, 111, 137], placeholder: true, drop: false };
  }
  writeJSON(join(root, 'art', 'kit.json'), { themes: [{ id: 'guardian', from: 0 }],
    pictures, landmarks: {} });
  install(root);  // copies the real Pixel Path road.js, layout.js and the upstream viewer template
  copyFileSync(join(template, 'guardian-overlay.js'), join(root, 'guardian-overlay.js'));
  copyFileSync(join(template, 'guardian-overlay.css'), join(root, 'guardian-overlay.css'));
  const file = join(root, 'index.html');
  let html = readFileSync(file, 'utf8');
  if (!html.includes('</head>') || !html.includes('</body>')) {
    throw new Error('unsupported upstream Pixel Path HTML template');
  }
  html = html.replace('</head>', '<link rel="stylesheet" href="./guardian-overlay.css">\n</head>');
  html = html.replace('</body>', [
    '<aside id="guardian-panel" data-pixel-path-controls="true" aria-label="Guardian interactive training controls">',
    '<header><span class="glyph" aria-hidden="true">G</span><div><strong>GPT-DOUG GUARDIAN</strong><small>PIXEL PATH / INTERACTIVE TRAINING</small></div><button type="button" id="guardian-collapse" aria-controls="guardian-panel-body" aria-expanded="true">Hide</button></header>',
    '<div id="guardian-panel-body">',
    '<div class="panel-row"><span>MODE</span><b id="guardian-mode">OFFLINE REPLAY</b></div>',
    '<div class="panel-row"><span>WAYPOINT</span><b id="guardian-location">Training Bay Alpha</b></div>',
    '<div class="panel-row"><span>PROGRESS</span><b id="guardian-progress">0.00 / 2.40 km</b></div>',
    '<section aria-label="Interactive playback controls" class="guardian-section">',
    '<div class="panel-title">PLAYBACK &amp; ROUTE</div>',
    '<div class="panel-actions"><button type="button" id="guardian-hold">Hold replay</button><button type="button" id="guardian-resume">Resume</button><button type="button" id="guardian-reset">Restart</button></div>',
    '<label for="guardian-speed">Target speed <output id="guardian-speed-value">60 km/h</output></label>',
    '<input type="range" id="guardian-speed" min="-120" max="120" step="5" value="60" aria-label="Playback speed in kilometers per hour">',
    '<label for="guardian-seek">Route position <output id="guardian-seek-value">0 m</output></label>',
    '<input type="range" id="guardian-seek" min="0" max="2399" step="1" value="0" aria-label="Seek through the fictional route in meters">',
    '<div class="panel-inline"><label for="guardian-waypoint">Jump to waypoint</label><select id="guardian-waypoint"><option value="0">Training Bay Alpha</option><option value="410">Sensor Yard</option><option value="1180">Relief Station</option><option value="1900">Relay Annex</option><option value="2399">Safety Relay Bravo</option></select><button type="button" id="guardian-jump">Go</button></div>',
    '<div class="panel-inline"><label for="guardian-view">Camera</label><select id="guardian-view"><option value="0">Forward</option><option value="-30">30° left</option><option value="30">30° right</option></select></div>',
    '<div class="panel-actions two"><button type="button" id="guardian-map" aria-pressed="false">Show map (M)</button><button type="button" id="guardian-info" aria-pressed="false">Show info (I)</button></div>',
    '</section>',
    '<section aria-label="Fictional fleet inspector" class="guardian-section">',
    '<div class="panel-title">SIMULATED AGENT ROSTER</div>',
    '<div class="panel-units" id="guardian-units" aria-label="Select a simulated fleet unit"></div>',
    '<div class="unit-detail" id="guardian-unit-detail" role="status">Select a unit to inspect its training data.</div>',
    '<button type="button" class="wide" id="guardian-focus">View selected agent location</button>',
    '</section>',
    '<section aria-label="Fictional scenario events" class="guardian-section">',
    '<div class="panel-title">SCENARIO LAB / NO REAL EFFECTS</div>',
    '<label for="guardian-event-select">Training event</label>',
    '<select id="guardian-event-select"><option value="comms">Simulated relay interruption</option><option value="power">Simulated station power fluctuation</option><option value="supplies">Simulated medical supply request</option></select>',
    '<div class="panel-actions two"><button type="button" id="guardian-inject">Inject scenario</button><button type="button" id="guardian-clear-event">Clear scenario</button></div>',
    '<output class="event-line" id="guardian-event">No active training events</output>',
    '</section>',
    '<div class="panel-actions two"><button type="button" id="guardian-export">Export local JSON</button><button type="button" id="guardian-screenshot">Save PNG view</button></div>',
    '<p id="guardian-message" role="status" aria-live="polite">Synthetic data only. No operational link.</p>',
    '<details id="guardian-shortcuts"><summary>Controls and official documentation</summary><p>Scroll or arrow keys: speed / reverse. Space: pause. M: map. I: location. Route seek and camera controls are available above.</p><p>Road renderer: Pixel Path by Jon Wheatley (MIT). No live maps or connected robots in this demo.</p></details>',
    '<footer>Owner attribution: Douglas Montel Brown Jr.<br>Not connected to hardware, TAK, or military networks.</footer>',
    '</div></aside><script src="./guardian-overlay.js" defer></script>',
    '</body>'
  ].join('\n'));
  writeFileSync(file, html, 'utf8');
  return { root, index, guardian };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const flag = k => { const i = a.indexOf(k); return i < 0 ? null : a[i + 1]; };
  const out = flag('--out');
  if (!out || a.includes('--help')) {
    console.log('Usage: node scripts/guardian-demo.mjs --out demo/guardian [--serve 8080]');
    if (!out) process.exitCode = 2;
  } else {
    const { root } = generateGuardianDemo(out);
    console.log('Created offline synthetic Guardian Pixel Path: ' + join(root, 'index.html'));
    if (a.includes('--serve')) {
      const raw = flag('--serve');
      const port = raw && /^\d+$/.test(raw) ? +raw : 8080;
      if (port < 0 || port > 65535) throw new RangeError('port must be 0..65535');
      const started = await serve(root, port);
      console.log('Open http://127.0.0.1:' + started.port + '/ (Ctrl+C to stop)');
    }
  }
}
