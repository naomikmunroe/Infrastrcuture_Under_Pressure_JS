# Infrastructure Under Pressure — Phase 2 & 2b Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 2 & 2b Covered

Phase 2 built the full playable web application — a Windows 98-styled HTML/JS sim running the complete 6-turn loop with both AI conditions, all authored content, and a session export. Phase 2b added the three research-layer additions on top of that: consequence popups, the turn log, and the AI-generated vignette screen.

The game runs entirely in the browser from `index.html`. No build step, no server required (except for the vignette API call, which needs an API key and ideally a localhost server to avoid CORS issues with `file://`).

---

## Files Created

### `index.html`
Shell page. Four `.screen` divs (briefing, game, summary, vignette) — only one shown at a time via `display:flex`. Contains all custom CSS inline, then loads scripts in dependency order.

- Win98 teal desktop background (`#008080`)
- Three-column game layout: 120px status panel | flex incident+actions | 150px ARIA panel
- `#game-overlay` fixed layer for floating windows (FA, xAI, pushy popup, consequence popup) — `pointer-events:none` on the overlay, `pointer-events:all` on child `.window` elements
- `@keyframes tb-flash` for pushy ARIA title bar and pushy popup flash (alternates `#800000` → `#cc0000`)
- Win98 button, bar, and panel styles matching the visual reference

### `css/98.css`
Downloaded from unpkg.com. Provides `.window`, `.title-bar`, `.title-bar-text`, `.title-bar-controls`, `.window-body`, and button chrome in authentic Win98 style. Not modified.

### `js/data.js`
All read-only turn content. Never mutated during a session.

- `TURNS_DATA` array (6 entries, 0-indexed): each turn has `incident`, `aria` (calm/pushy), `xai` (calm/pushy), `fa`, `confidenceDriftBase`, and `actions`
- Each action: `id`, `name`, `immediateText`, `delayedText`, `immediateEffects`, `delayed` (keyed by target turn number), `modifier`, `isAriaRec` (calm/pushy), `condition` ('both'|'calm'|'pushy')
- T3 FA consequence: fires `{stability: -5}` at T5 if FA was requested AND T3_A was chosen
- T5 FA consequence: fires `{stability: -5}` at T6 if FA was requested AND T5_B was chosen
- T6 actions: T6_D_CALM (`condition:'calm'`) and T6_D_PUSHY (`condition:'pushy'`) are separate entries — renderActions filters by condition so each run sees exactly 4 options
- `CALM_CONFIDENCE_BASE = [62, 55, 71, 58, 68, 52]` — one base per turn for seeded drift
- `PUSHY_CONFIDENCE_MIN = 82`, `PUSHY_CONFIDENCE_MAX = 91`

### `js/state.js`
All variable logic. Single source of truth. No variable is ever changed outside `applyEffects()`.

- Initial values: Stability 70, Resources 70, Workload 30, Confidence 70; floor 0, ceiling 100
- `applyEffects(effects)` — applies a delta dict, clamps, dispatches `varsChanged` custom event
- `registerDelay(turn, effects, description)` — queues a future effect
- `advanceTurn()` — increments `_turn`, then calls `processDelays(_turn)` synchronously
- `processDelays(turn)` — applies each queued effect and dispatches `consequenceFired` with `{effects, turn, description}` for each one
- `_halveWorkloadGain` flag — set by `setHalveWorkload()`; active for the rest of the session; all subsequent positive workload deltas use `Math.floor(delta/2)`
- `_faRequested` dict — `setFARequested(turn)` marks a turn; `wasFARequested(turn)` reads it (used for FA consequence check)
- Calm confidence: `getConfidenceDrift(turnIndex)` — seeded LCG (`a=1664525, c=1013904223, m=2^32`) using `_driftSeed + turnIndex*31`, noise ±4 applied to base value; seed derived from participant ID character codes (reproducible per participant)
- Pushy confidence: `getPushyConfidence(turnIndex)` — same LCG with `turnIndex*17`, output mapped to 82–91
- `logAction(actionId, actionName, wasAriaRec)` — appends to `_actionLog` and `_turnLog` at current turn
- `checkCollapse()` — `stability < 20 OR resources < 10`
- `getAIFollowCount()` — count of `wasAriaRec === true` entries in action log

### `js/telemetry.js`
All logging. Nothing is logged ad-hoc elsewhere.

Session-level counters (Phase 2b additions):
- `_faCount` — incremented by `logFARequested`
- `_xaiCount` — incremented by `logXAIViewed`
- `_consequenceCount` — incremented by `logConsequencePopupAcknowledged`
- `_consequenceEvents` array — `{turn, description}` pushed on each acknowledgement

`exportSession()` — called at summary screen:
- Evaluates all narrative tags (matches path simulator logic): Preventative Management, Public Confidence First, AI Dependence, Deferred Escalation, Resource Preservation, Reactive Stabilisation, Controlled Recovery, System Collapse, Steady Management
- Sets `archetypeLabel` by priority: System Collapse → AI Dependence (≥4 follows) → Controlled Recovery (all vars ≥30) → Steady Management
- Downloads a JSON blob named `iup_session_<pid>_<timestamp>.json`
- Returns the session object — stored as `window._lastSessionData` for the vignette button

Exported JSON fields include: `participant_id`, `condition`, `finalVars`, `systemCollapse`, `tags`, `archetypeLabel`, `aiFollowCount`, `aiFollowRate` (`{count, bracket}`), `faRequestedCount`, `xaiViewedCount`, `consequenceEvents`, `consequence_alerts_dismissed_total`, `actionLog`, `events`

AI follow rate bracket: `≥4 → 'high'`, `≥2 → 'medium'`, `<2 → 'low'`

### `js/ui.js`
All rendering. Reads state; never writes it.

**ARIA panel** (`renderARIA`):
- Calm: blue title bar (`#000080`), advisory text in white box, `btn-xai` in default style
- Pushy: title bar flashes red (`animation:tb-flash 0.7s infinite; background:#800000`), text in black box with red text, `btn-xai` with red border
- Restores the consequence badge count after each re-render (re-render wipes innerHTML)

**Turn log** (`updateTurnLog`):
- Renders in `#turn-log-body` inside the left System Status panel
- Completed turns: `T1 — <action name truncated to 20 chars>` in grey (`#444`)
- Current pending turn: `T${i} — pending` in red (`#800000`)
- Future turns: not shown

**Consequence badge** (`updateConsequenceBadge`):
- `#consequence-badge` inside the ARIA panel — shown when count > 0, orange background (`#804000`)
- `#tb-consequence` in the taskbar — shown when count > 0 as `display:'inline-flex'`

**Consequence popup** (`showConsequencePopup`):
- Orange title bar (`#804000`), monospace body, ACKNOWLEDGE button and × button
- Both buttons call the same `ack()` callback: logs to `Telemetry.logConsequencePopupAcknowledged`, updates badge, removes popup, calls `onAcknowledge()` to resume turn progression
- Badge is updated only on acknowledge (not on show)

**FA floating window** (`showFAWindow`):
- Appended to `#game-overlay`; positioned fixed, centred
- On × close: window is hidden (`display:none`), not removed — taskbar item then added so the player can restore it
- `clearTaskbarFAItem()` removes the taskbar button at the start of each new turn

**xAI window** (`showXAIWindow`): floating right side, pushy variant has red title bar

**Pushy popup** (`showPushyPopup`): flashing red title bar, action button bypasses action list and calls `handleActionSelect` directly

**Summary screen** (`renderSummary`): terminal-style dark panel, trajectory badge in uppercase, data grid with 4 metrics, variable trajectory mini-bars (start → end), action log, "▶ View narrative report" and "⎙ Print report" buttons

### `js/turns.js`
Turn loading and action flow.

**Consequence queue pattern:**
- `document.addEventListener('consequenceFired', ...)` — collects events into `_pendingConsequences`
- `processDelays` in `state.js` dispatches events synchronously, so `_pendingConsequences` is populated before `advanceTurn()` returns
- `_drainConsequences(done)` — shows one popup at a time; only calls `done()` (which loads the next turn) when the queue is empty

**`loadTurn(turnIndex)`** (0-based):
- Clears `_pendingConsequences`, closes any open FA/xAI windows, removes taskbar FA item
- Computes ARIA confidence for the turn (drift or pushy range)
- Renders incident, actions, ARIA, updates var bars, turn counter, turn log
- Logs `turn_start` to telemetry
- If pushy: shows pushy popup; its action button calls `handleActionSelect` directly

**`handleActionSelect(action)`**:
1. Removes pushy popup, closes floating windows, disables action buttons
2. Captures `turn = State.turn` before advancing
3. `State.applyEffects(immediateEffects)`
4. Registers all delayed effects via `State.registerDelay`
5. Sets `halveWorkloadGain` if `action.modifier === 'halve_workload_gain'`
6. FA consequence check: if `fa.consequence` AND `State.wasFARequested(turn)` AND `action.id === fa.consequence.consequenceAction` → registers the consequence delay and logs it
7. `State.logAction` + `Telemetry.logAction`
8. `UI.updateTurnLog` to show completed action immediately
9. If turn < 6: `State.advanceTurn()` then `_drainConsequences(() => loadTurn(State.turn - 1))`
10. If turn === 6: `Main.showSummary()`

**FA request** (`handleFARequest`):
- `State.applyEffects({workload: 3})`, disables FA button, relabels it
- 1500–2000ms random delay then `UI.showFAWindow(turnData)`

### `js/main.js`
Screen transitions and session flow.

- `CONFIG.anthropicApiKey` — must be set before vignette screen is used
- `startSession()` — reads participant ID and condition from briefing form, calls `State.init` + `Telemetry.init`, starts clock, loads Turn 1
- `showSummary()` — stops clock, closes any open windows, calls `Telemetry.exportSession()` (downloads JSON), renders and shows summary screen
- `showVignette(sessionData)` — makes direct Anthropic API call (`claude-sonnet-4-6`, max 600 tokens) with session data formatted as structured prompt; renders paragraphs; "GRIDHUB notes that" closing line rendered in italic grey; vignette title bar turns red (`#800000`) on System Collapse; buttons shown after API call completes
- Error fallback: catch block renders `GRIDHUB: Narrative generation unavailable` message — no broken screen

---

## Test Path Verification

Path: T1_B → T2_C → T3_B → T4_D → T5_C → T6_B

| Turn | Action | Immediate | Running totals |
|---|---|---|---|
| Start | — | — | S=70 R=70 W=30 C=70 |
| T1 | Monitor Situation | none | S=70 R=70 W=30 C=70 |
| T2 | Publish Limited Advisory | C+5 | S=70 R=70 W=30 C=75 |
| T3 | Act Independently | W+10 | S=70 R=70 W=40 C=75 |
| T4 | Reassure Public | C+5 | S=70 R=70 W=40 C=80 |
| T5 | Prioritise Critical Assets | S+10 R−10 | S=80 R=60 W=40 C=80 |
| T6 | Controlled Response | S+10 R−10 | **S=90 R=50 W=40 C=80** |

No delayed effects on this path, so no consequence popups. To test consequence popups, choose T1_A (fires W+10 at T5) or T2_A (fires R−5 at T4).

---

## Bugs Fixed During Implementation

- **Double-counting consequence badge** — local counter on popup show + telemetry counter on acknowledge. Fixed: only update badge inside `ack()` after `Telemetry.logConsequencePopupAcknowledged` has incremented.
- **Badge disappearing on ARIA re-render** — `renderARIA` replaces the full ARIA panel innerHTML, wiping the badge. Fixed: call `updateConsequenceBadge(Telemetry.consequenceCount)` at the end of `renderARIA`.
- **Pushy title bar not flashing** — `background:#800000` was set but no animation. Fixed: added `animation:tb-flash 0.7s infinite` to the inline style.
- **FA taskbar item accumulating across turns** — each turn could add another button. Fixed: `UI.clearTaskbarFAItem()` called in `loadTurn` cleanup block.
- **Taskbar consequence counter invisible** — `tb.style.display = ''` removed the inline style, deferring to the CSS `display:none`. Fixed: set to `'inline-flex'` explicitly.
- **FA window re-open broken** — close handler called `closeFAWindow()` which removes the element, making the taskbar toggle do nothing. Fixed: close handler now sets `display:none`; `closeFAWindow()` (called on turn transitions) still removes.

---

## Setup Note

The vignette screen requires an Anthropic API key. Set it in `js/main.js` before running sessions:

```javascript
const CONFIG = {
  anthropicApiKey: 'sk-ant-...',
};
```

Without a key the vignette gracefully shows a fallback message. Serving via `localhost` (e.g. `python -m http.server`) is recommended over `file://` for the API call to work without CORS issues.
