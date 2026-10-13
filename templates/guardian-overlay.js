// Offline visual annotation only. Never sends mission commands or fetches remote endpoints.
'use strict';
const get = id => document.getElementById(id);
const report = message => { const n = get('guardian-message'); if (n) n.textContent = message; };
let overlayMode = 'OFFLINE REPLAY';

async function startGuardianOverlay() {
  const response = await fetch('./data/guardian.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load synthetic Guardian manifest');
  const scenario = await response.json();
  if (scenario.syntheticOnly !== true || scenario.localCartesianOnly !== true ||
      scenario.physicalActuation !== false || scenario.targeting !== false ||
      scenario.weapons !== false || scenario.remoteConnections !== false) {
    throw new Error('Guardian manifest rejected: not an isolated synthetic replay');
  }
  const units = get('guardian-units');
  for (const unit of scenario.fleet) {
    const line = document.createElement('div'); line.className = 'unit';
    const id = document.createElement('code'); id.textContent = unit.id;
    const label = document.createElement('span');
    label.textContent = unit.role + ' · ' + unit.batteryPercent + '%';
    line.append(id, label); units.append(line);
  }
  const checkpoints = [['Training Bay Alpha',0], ['Sensor Yard',410],
    ['Relief Station',1180], ['Relay Annex',1900], ['Safety Relay Bravo',2400]];
  const update = () => {
    const trip = window.__trip;
    const pos = Math.max(0, Math.min(2400, Number(trip?.pos) || 0));
    let name = checkpoints[0][0];
    for (const [checkpoint, s] of checkpoints) if (pos >= s) name = checkpoint;
    get('guardian-progress').textContent = (pos / 1000).toFixed(2) + ' / 2.40 km';
    get('guardian-location').textContent = name;
    get('guardian-mode').textContent = overlayMode;
    requestAnimationFrame(update);
  };
  get('guardian-hold').addEventListener('click', async () => {
    if (!window.__trip) return report('Viewer not ready');
    try {
      await window.__trip.goto(window.__trip.pos / 1000);
      overlayMode = 'REPLAY HELD';
      report('Visual replay paused. No real fleet or actuator is affected.');
    } catch { report('Replay could not pause'); }
  });
  get('guardian-resume').addEventListener('click', () => {
    if (!window.__trip) return report('Viewer not ready');
    window.__trip.resume();
    overlayMode = 'OFFLINE REPLAY';
    report('Visual replay running. Scroll to adjust camera speed.');
  });
  get('guardian-reset').addEventListener('click', async () => {
    if (!window.__trip) return report('Viewer not ready');
    try {
      await window.__trip.goto(0);
      window.__trip.resume();
      overlayMode = 'OFFLINE REPLAY';
      report('Replay restarted at fictional Training Bay Alpha.');
    } catch { report('Replay could not restart'); }
  });
  report('Simulated units only · no military or robot network connections.');
  update();
}
startGuardianOverlay().catch(error => report('Blocked: ' + error.message));
