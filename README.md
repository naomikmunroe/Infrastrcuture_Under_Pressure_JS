# Infrastructure Under Pressure — HTML/JS Scaffold

## Setup

1. Download [98.css](https://unpkg.com/98.css) and save to `css/98.css`
   Or: `npm install 98.css` then copy from node_modules.

2. Open `index.html` in a browser. No build step required.

## File structure

```
index.html          — Shell. Loads all scripts and screens.
css/98.css          — Win98 aesthetic (external dependency)
css/game.css        — Game-specific styles
js/data.js          — All turn content, ARIA text, xAI text, briefing
js/state.js         — Game state. All variable changes via applyEffects()
js/telemetry.js     — Event logger. Exports JSON on session end.
js/ui.js            — DOM helpers. No logic.
js/turns.js         — Turn orchestration and action handling
js/aria.js          — Pushy condition popup behaviour
js/main.js          — Entry point. Builds screens, starts session.
```

## Phase build order

| Phase | Scope |
|---|---|
| Phase 1 ✓ | Variable system + turn loop (Unity — logic ported to state.js) |
| Phase 2 ✓| Action system — wire all 6 turns in data.js, test consequence chain |
| Phase 3 ✓| ARIA conditions — calm/pushy rendering, confidence drift, xAI window |
| Phase 4 | Further analysis windows — floating window, loading delay, telemetry |
| Phase 5 | Summary screen — narrative tags, behavioural data block |
| Phase 6 | Polish — animations, pushy overlay, Win98 details |
| SG1–3  | Stretch goals if time allows |

## Testing

Run `python docs/simulation/iup_path_simulator.py --test` to verify
expected variable values before each phase.

## Telemetry

Sessions export as JSON on summary screen load.
File: `IUP_{participantId}_{condition}_{timestamp}.json`
Replace Telemetry.exportSession() with a POST call for live data collection.

## Decision log reference

AD-24: Switch from Unity to HTML/JS — see decision log for rationale.
