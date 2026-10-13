// GPT-Doug Guardian: interactive but strictly local Pixel Path training controls.
// No targeting, network commands, sensors, agent dispatch or physical actuation.
'use strict';

const get = id => document.getElementById(id);
const report = message => { if (get('guardian-message')) get('guardian-message').textContent = message; };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const EVENT_MESSAGES = Object.freeze({
  comms: 'TRAINING ONLY · Fictional relay interruption. Inspect link redundancy.',
  power: 'TRAINING ONLY · Fictional station power fluctuation. Review energy reserves.',
  supplies: 'TRAINING ONLY · Fictional medical supply request. Review logistics readiness.',
});

async function startGuardianOverlay() {
  const response = await fetch('./data/guardian.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Cannot load the synthetic Guardian manifest');
  const scenario = await response.json();
  if (scenario.syntheticOnly !== true || scenario.localCartesianOnly !== true ||
      scenario.physicalActuation !== false || scenario.targeting !== false ||
      scenario.weapons !== false || scenario.remoteConnections !== false ||
      scenario.identificationTracking !== false ||
      !Array.isArray(scenario.fleet) || scenario.fleet.length < 1 ||
      scenario.fleet.length > 10) {
    throw new Error('Guardian policy rejects this non-synthetic or unsafe manifest');
  }
  for (const unit of scenario.fleet) {
    if (!/^[A-Za-z0-9_-]{1,24}$/.test(unit.id) || typeof unit.role !== 'string' ||
        unit.role.length > 64 || !Number.isFinite(unit.positionMetres) ||
        unit.positionMetres < 0 || unit.positionMetres > 2400 ||
        !Number.isFinite(unit.batteryPercent) || unit.batteryPercent < 0 ||
        unit.batteryPercent > 100) {
      throw new Error('Guardian manifest contains invalid simulated unit data');
    }
  }

  const units = get('guardian-units');
  let selected = scenario.fleet[0], activeEvent = null;
  let lastPaint = 0;
  const road = () => window.__trip;
  const ready = () => {
    if (!road()?.seekMetres || !road()?.setSpeedKmh || !road()?.play) {
      report('Pixel Path renderer is loading. Try again shortly.');
      return null;
    }
    return road();
  };
  const showUnit = unit => {
    selected = unit;
    for (const button of units.querySelectorAll('.unit')) {
      const active = button.dataset.unitId === unit.id;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    }
    get('guardian-unit-detail').textContent =
      unit.id + ' · ' + unit.role + ' · battery ' + unit.batteryPercent +
      '% · synthetic route marker ' + unit.positionMetres + ' m. No live telemetry.';
  };
  for (const unit of scenario.fleet) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'unit';
    button.dataset.unitId = unit.id;
    button.setAttribute('aria-label', 'Inspect fictional unit ' + unit.id);
    const id = document.createElement('code');
    id.textContent = unit.id;
    const label = document.createElement('span');
    label.textContent = unit.role + ' · ' + unit.batteryPercent + '%';
    button.append(id, label);
    button.addEventListener('click', () => { showUnit(unit); report('Selected synthetic unit ' + unit.id); });
    units.append(button);
  }
  showUnit(selected);

  const speed = get('guardian-speed'), seek = get('guardian-seek');
  const setSpeedDisplay = v => { get('guardian-speed-value').textContent = Math.round(v) + ' km/h'; };
  const setPositionDisplay = v => { get('guardian-seek-value').textContent = Math.round(v) + ' m'; };
  const syncToggle = (buttonId, active, onLabel, offLabel) => {
    const button = get(buttonId);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? onLabel : offLabel;
  };
  get('guardian-hold').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    trip.pause();
    report('Visual replay paused. No real unit is affected.');
  });
  get('guardian-resume').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    trip.play();
    report('Visual replay resumed. Scroll or adjust the speed slider.');
  });
  get('guardian-reset').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    trip.seekMetres(0);
    trip.setSpeedKmh(60);
    speed.value = '60'; setSpeedDisplay(60);
    get('guardian-view').value = '0'; trip.setLook(0);
    trip.play();
    report('Replay restarted at fictional Training Bay Alpha.');
  });
  speed.addEventListener('input', () => {
    const value = Number(speed.value);
    const trip = ready(); if (!trip) return;
    trip.setSpeedKmh(value);
    setSpeedDisplay(value);
    report(value < 0 ? 'Reverse training replay selected.' : 'Playback speed changed.');
  });
  seek.addEventListener('input', () => {
    const value = Number(seek.value);
    const trip = ready(); if (!trip) return;
    trip.seekMetres(value); setPositionDisplay(value);
  });
  get('guardian-jump').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    const metres = Number(get('guardian-waypoint').value);
    trip.seekMetres(metres);
    report('Camera jumped to the selected fictional waypoint.');
  });
  get('guardian-view').addEventListener('change', () => {
    const trip = ready(); if (!trip) return;
    trip.setLook(Number(get('guardian-view').value));
    report('Pixel Path camera angle updated.');
  });
  window.addEventListener('resize', () => {
    // The upstream renderer reconstructs the road after a resize.
    setTimeout(() => road()?.setLook?.(Number(get('guardian-view').value)), 400);
  });

  get('guardian-map').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    trip.setMapVisible(!trip.mapVisible);
  });
  get('guardian-info').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    trip.setInfoVisible(!trip.infoVisible);
  });
  get('guardian-focus').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    trip.seekMetres(selected.positionMetres);
    report('Camera moved near fictional ' + selected.id + '. No robot command sent.');
  });

  get('guardian-inject').addEventListener('click', () => {
    const kind = get('guardian-event-select').value;
    if (!Object.hasOwn(EVENT_MESSAGES, kind)) return report('Unknown scenario rejected.');
    activeEvent = kind;
    get('guardian-event').textContent = EVENT_MESSAGES[kind];
    get('guardian-event').classList.add('active');
    report('Training-only scenario activated locally.');
  });
  get('guardian-clear-event').addEventListener('click', () => {
    activeEvent = null;
    get('guardian-event').textContent = 'No active training events';
    get('guardian-event').classList.remove('active');
    report('Fictional event cleared.');
  });
  const download = (href, name) => {
    const link = document.createElement('a');
    link.href = href; link.download = name;
    document.body.append(link); link.click(); link.remove();
  };
  get('guardian-export').addEventListener('click', () => {
    const trip = ready(); if (!trip) return;
    const payload = {
      schema: 'guardian-offline-training-export.v1',
      source: 'Pixel Path by Jon Wheatley (MIT)',
      ownerAttribution: scenario.ownerAttribution,
      syntheticOnly: true, networkConnections: false, physicalActuation: false,
      weapons: false, targeting: false,
      positionMetres: Math.round(trip.pos), targetSpeedKmh: Math.round(trip.speedKmh),
      paused: trip.paused, cameraLookDegrees: Number(get('guardian-view').value),
      selectedUnit: selected.id, activeTrainingEvent: activeEvent,
      fleet: scenario.fleet.map(unit => ({ ...unit, syntheticOnly: true })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    download(url, 'guardian-training-snapshot.json');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    report('Downloaded local synthetic telemetry snapshot.');
  });
  get('guardian-screenshot').addEventListener('click', () => {
    try {
      download(get('c').toDataURL('image/png'), 'guardian-pixel-path-frame.png');
      report('Saved rendered Pixel Path frame as PNG.');
    } catch {
      report('PNG export was blocked by the browser. No external upload attempted.');
    }
  });
  get('guardian-collapse').addEventListener('click', () => {
    const body = get('guardian-panel-body'), collapsed = !body.hidden;
    body.hidden = collapsed;
    get('guardian-collapse').setAttribute('aria-expanded', String(!collapsed));
    get('guardian-collapse').textContent = collapsed ? 'Show' : 'Hide';
  });

  const checkpoints = [['Training Bay Alpha', 0], ['Sensor Yard', 410],
    ['Relief Station', 1180], ['Relay Annex', 1900], ['Safety Relay Bravo', 2399]];
  const renderHud = now => {
    if (now - lastPaint > 120) {
      lastPaint = now;
      const trip = road();
      if (trip && trip.seekMetres) {
        const pos = clamp(Number(trip.pos) || 0, 0, 2399);
        let name = checkpoints[0][0];
        for (const [label, s] of checkpoints) if (pos >= s) name = label;
        get('guardian-progress').textContent = (pos / 1000).toFixed(2) + ' / 2.40 km';
        get('guardian-location').textContent = name;
        get('guardian-mode').textContent = trip.paused ? 'REPLAY HELD' : 'OFFLINE REPLAY';
        if (document.activeElement !== seek) seek.value = String(Math.round(pos));
        setPositionDisplay(pos);
        if (document.activeElement !== speed) {
          speed.value = String(Math.round(clamp(trip.speedKmh, -120, 120) / 5) * 5);
          setSpeedDisplay(Number(speed.value));
        }
        syncToggle('guardian-map', trip.mapVisible, 'Hide map (M)', 'Show map (M)');
        syncToggle('guardian-info', trip.infoVisible, 'Hide info (I)', 'Show info (I)');
      }
    }
    requestAnimationFrame(renderHud);
  };
  report('Synthetic training only. No hardware, TAK, or military network connection.');
  requestAnimationFrame(renderHud);
}
startGuardianOverlay().catch(error => report('Blocked: ' + error.message));
