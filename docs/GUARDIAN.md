# GPT-Doug Guardian × Pixel Path

**Status:** Offline, synthetic, non-weaponized visual training demo.
**Project owner attribution:** Douglas Montel Brown Jr.
**Road renderer:** Pixel Path by Jon Wheatley, MIT-licensed.

## Run at zero cost

Requirements: Node 18+; no npm dependencies, accounts, tokens, mapping services or art generation.

From the root of this repository:

    node scripts/guardian-demo.mjs --out demo/guardian --serve 8080

Open http://127.0.0.1:8080/ in your browser. Use the mouse wheel to change replay speed, Space to pause the Pixel Path camera, I for location information and M for the route mini-map. The overlay has **Hold replay**, **Resume**, and **Restart** controls, which affect **only** the visual animation. Press Ctrl+C in the terminal to stop the local web server.

For a generated folder without running the server:

    node scripts/guardian-demo.mjs --out demo/guardian

Host that folder on any local static web server; file:// cannot load module/JSON assets in most browsers.

Run deterministic validation:

    node --test scripts/guardian-demo.test.mjs

## What actually connects

Pixel Path's **existing** renderer and deterministic geometry engine are used directly:

- scripts/guardian-demo.mjs creates data/index.json, data/c0000.json, data/landmarks.json and the small fictional Guardian scenario manifest.
- The original scripts/viewer.mjs installer copies templates/road.js, templates/layout.js and templates/viewer.html.
- templates/guardian-overlay.js and .css supply a read-only fleet telemetry panel and playback controls.
- All artwork is generated locally as free SVG placeholders. No real sites, map data, sensor feeds or third-party imagery are included.

The route depicts Training Bay Alpha, Sensor Yard, Relief Station, Relay Annex and Safety Relay Bravo. These are **invented labels**, and all dimensions are in a local synthetic Cartesian frame.

## Explicit boundaries

This project is not a deployed robot, armed system, operational TAK plugin, military connection, navigation model or autonomous agent. It does not perform surveillance, person identification, targeting, control of weapons, movement of physical robots, or actuation. It has no external telemetry, socket connection or remote code execution path. The five agent entries are examples for simulation; battery readings are invented test data, not sensor observations.

The Guardian simulator in [sonoxo/gpt-doug-llm PR #381](https://github.com/sonoxo/gpt-doug-llm/pull/381) is a separate offline deterministic fleet engine. This demo **does not** yet import or run that Python engine; a future integration would need a separately reviewed static replay-data contract (no commands), versioned schema and provenance checks.

The overlay buttons are replay-only, not authenticated safety controls. Preserve operator authority and existing emergency stops if any physical prototypes are developed separately.

## Source and attribution

Pixel Path code and existing viewer © 2026 Jon Wheatley, MIT. See LICENSE. Synthetic demo assets and glue code are project contributions. Attribution is displayed in the viewer. The normal real-road build still displays OpenStreetMap and other relevant credits, unchanged.
