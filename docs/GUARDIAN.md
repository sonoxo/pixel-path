# GPT-Doug Guardian × Pixel Path — Full Operator and Developer Guide

**Status:** Offline, non-weaponized, synthetic interactive training simulator.
**Owner attribution:** Douglas Montel Brown Jr.
**Renderer:** [Pixel Path](https://github.com/jonwheatley/pixel-path) by Jon Wheatley (MIT).

## Start locally at no cost

Requires Node 18+ (no paid products or npm installation). From the Pixel Path repository root:

    node scripts/guardian-demo.mjs --out demo/guardian --serve 8080

Open **http://127.0.0.1:8080/** in Chrome (no trailing stars). Keep Terminal open; Ctrl+C stops the server.

To generate the demo without running the server:

    node scripts/guardian-demo.mjs --out demo/guardian

To upgrade an existing old clone **after these enhancements reach main**:

    cd ~/Downloads/pixel-path-guardian
    git fetch origin
    git switch main
    git pull --ff-only
    node scripts/guardian-demo.mjs --out demo/guardian --serve 8080

Stop the previous server first, or choose another port, such as --serve 8081. A browser static server is required; opening a file:// URL will not load the ES modules/JSON.

## Interactive controls — visible upper-left panel

On small screens, the panel scrolls. Use Hide / Show in its header to collapse or expand it.

| GUI control | Effect (synthetic replay only) |
| --- | --- |
| Hold replay / Resume / Restart | Pauses, resumes, or resets the fictional camera |
| Target speed slider | Sets camera speed; negative values reverse direction |
| Route position slider | Seeks within the 2.4 km synthetic route |
| Jump to waypoint | Goes to a chosen invented facility |
| Camera dropdown | Looks 30° left, forward, or 30° right |
| Show map / Show info | Toggles the original Pixel Path mini-map or readout |
| Simulated agent roster | Selects a fictional unit to inspect static role/battery data |
| View selected agent location | Moves the **camera**, not the agent |
| Inject / Clear scenario | Adds/removes an on-screen training alert |
| Export local JSON | Downloads clearly marked synthetic training data |
| Save PNG view | Downloads the current rendered road canvas |
| Hide / Show | Collapses or expands the console |

Upstream keyboard and mouse controls still work outside input fields:

| Control | Effect |
| --- | --- |
| Wheel or touch drag outside console | Change speed, including reversing |
| Up / Right arrows | Accelerate |
| Down / Left arrows | Slow down and reverse |
| Space | Pause/resume |
| M | Show/hide minimap |
| I | Show/hide location readout |

The original URL options work: for example, http://127.0.0.1:8080/?km=0.4&speed=25&map=1&info=1. Do not add Markdown formatting to the URL.

## Upstream architecture implemented here

This integration **runs** the original Pixel Path code: the renderer (templates/road.js), deterministic segment generator (templates/layout.js), canvas animation loop (templates/viewer.html), and zero-dependency static server (scripts/viewer.mjs). The additive window.__trip controls expose playback speed, pause/play, seek, look direction, mini-map and info visibility to an accessible GUI. Wheel/touch events from the panel are excluded so the controls remain usable.

The synthetic generator produces:

- data/index.json: fictional 2.4 km local Cartesian training route
- data/c0000.json: road samples, gradient, terrain, fictional buildings and labels
- data/landmarks.json: empty, no real-world landmarks
- data/guardian.json: five synthetic agent records, without network access
- art/kit.json and art/*.svg: locally generated free placeholder art
- index.html, road.js and layout.js: the original Pixel Path viewer with the optional Guardian panel
- guardian-overlay.js and guardian-overlay.css: controls, read-only synthetic events and local exports

The invented waypoints are Training Bay Alpha, Sensor Yard, Relief Station, Relay Annex, and Safety Relay Bravo. No real locations, people, coordinates, patrol routes or sensors are used.

## Full official Pixel Path documentation

The upstream [README](https://github.com/jonwheatley/pixel-path/blob/main/README.md) and [SKILL guide](https://github.com/jonwheatley/pixel-path/blob/main/SKILL.md) define this eight-stage workflow:

1. scripts/route.mjs — geocode and route **real roads**; quote the art budget.
2. scripts/bake.mjs — create 10 km road chunks from mapping and terrain services.
3. scripts/plan-art.mjs and scripts/placeholder-art.mjs — choose regional kits or zero-cost stand-ins.
4. scripts/rd.mjs — optional **paid** RetroDiffusion art, budget-confirmed first (upstream affiliate link).
5. scripts/clean.mjs — clean and inspect generated art.
6. scripts/check.mjs — audit geometry and optionally sweep frames using Chromium.
7. Review generated images and repair errors until clean.
8. scripts/viewer.mjs — install the viewer and host it locally.

For the **fictional** Guardian demo, stage 1–5 real-map and paid-art steps are replaced by deterministic synthetic data and SVGs. It still uses the same official geometry and viewer. The generic upstream check script reinstalls the base viewer page and could replace the Guardian overlay, so use the Guardian-specific smoke test below for this enhanced UI.

Real-road deployments must preserve OpenStreetMap, OSRM, Nominatim, Terrain Tiles, Wikidata and any relevant artwork attribution. This synthetic demo uses none of their data and visibly credits Jon Wheatley's renderer.

## Test and preview

Free Node regression suite:

    node --test scripts/guardian-demo.test.mjs

The GitHub CI browser test uses optional Playwright:

    npm install --no-save playwright@1.56.1
    npx playwright install chromium
    node scripts/guardian-browser-smoke.mjs

It renders the real Pixel Path road and validates all visible controls, waypoint seeking, map toggles, agent inspection, scenario annotations, local PNG/JSON downloads, mobile layout, and zero external network requests. GitHub Actions publishes a screenshot preview. Normal demo execution does not require Playwright.

## Explicit safety and operational limits

- Visual training **only**, no operational TAK/ATAK, military, spacecraft or robotic integration.
- Roster data and battery numbers are invented; focusing an agent moves only the camera.
- Scenario buttons generate local fictional annotations, not actual detections or physical response.
- No targeting, person identification, autonomous engagement, weapon payloads, operational route navigation, physical actuation, network telemetry, remote dispatch or unbounded replication.
- Exported JSON identifies itself as synthetic and non-operational.
- Ownership is credited as project metadata; it is not identity authentication or upstream copyright ownership.
- The deterministic Python Guardian engine in [sonoxo/gpt-doug-llm](https://github.com/sonoxo/gpt-doug-llm) is separate; the browser does not issue commands to it.

## Troubleshooting

- Browser says not found: remove trailing '**'; use http://127.0.0.1:8080/ exactly.
- Cannot find module scripts/guardian-demo.mjs: change into the pixel-path-guardian folder, not GPT-Doug-PeaceLab.
- No upper-left controls: pull updated code, regenerate demo/guardian, restart the server and hard refresh the browser.
- Port in use: stop old Terminal server (Ctrl+C) or use --serve 8081.
- Blank scene: verify data/index.json and art/kit.json on your local server; run the Node tests.

Pixel Path © 2026 Jon Wheatley, MIT License. Preserve required source attribution.
