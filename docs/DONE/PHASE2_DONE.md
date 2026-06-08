# Infrastructure Under Pressure — Phase 2 Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 2 Covered

Phase 2 wired the full 6-turn game loop in the web scaffold (`index.html` + `js/` + `css/`). All turns run start to finish with correct variable consequences, telemetry events firing, and the summary screen displaying accurate final state. Both calm and pushy conditions are playable.

---

## Files Changed

### `css/98.css`
Replaced an unpkg redirect stub (41 bytes) with the full 98.css v0.1.21 stylesheet. The briefing screen, all panels, floating windows, and form controls now render with correct Win98 chrome (raised/sunken borders, title bars, silver background).

### `css/game.css`
Added `.title-bar-close` rule to enforce compact button sizing (`min-height:14px`, `min-width:16px`, `padding:0`) on close buttons inside floating window title bars. Without this, 98.css's default `min-width:75px` on `<button>` bloated the title bar.

### `js/main.js` — `showSummary()`
Fixed the session trajectory tag logic. The previous code always fell back to `'CONTROLLED RECOVERY'` and never produced `'STEADY MANAGEMENT'`. It also used the wrong condition for the recovery class (`stability >= 60 && resources >= 40` instead of all vars `>= 30`).

Replaced with the correct 4-step priority chain from the Phase 2 spec:

```
1. System Collapse   — Stability < 20 OR Resources < 10
2. AI Dependence     — aiFollowCount >= 4 (rate.bracket === 'high')
3. Controlled Recovery — all four variables >= 30
4. Steady Management — catch-all
```

### `js/turns.js` — `handleActionSelect()`
Fixed `wasAIFollow` detection for Turn 6. The previous code applied a T1–T5 heuristic ("first action in list = ARIA recommendation") to T6 as well. On T6 calm, the first action is `T6_A` (Commit Remaining Resources — the aggressive option), which is the opposite of what the calm ARIA recommends. This caused `T6_A` to be incorrectly counted as an AI follow in the calm condition.

Fix: T6 now uses only the explicit `T6_D_CALM` / `T6_D_PUSHY` actions as AI follows. T1–T5 continue to use the first-action heuristic.

```js
// Before
const ariaAction  = State.condition === 'calm' ? 'T6_D_CALM' : 'T6_D_PUSHY';
const wasAIFollow = action.id === ariaAction || action.id === _currentTurnData.actions[0].id;

// After
const wasAIFollow = State.turn === 6
  ? action.id === (State.condition === 'calm' ? 'T6_D_CALM' : 'T6_D_PUSHY')
  : action.id === _currentTurnData.actions[0].id;
```

### `js/turns.js` — `loadTurn()` — T6 action filtering
`data.js` defines both `T6_D_CALM` and `T6_D_PUSHY` in the Turn 6 actions array so each condition's AI recommendation carries its own effects. Without filtering, both buttons rendered on Turn 6 regardless of condition.

Fix: actions are filtered before being passed to `UI.renderActions`. `T6_D_CALM` is excluded in the pushy condition; `T6_D_PUSHY` is excluded in the calm condition. The three shared options (`T6_A`, `T6_B`, `T6_C`) always render.

```js
const actions = _currentTurnData.actions.filter(a => {
  if (a.id === 'T6_D_CALM')  return State.condition === 'calm';
  if (a.id === 'T6_D_PUSHY') return State.condition === 'pushy';
  return true;
});
UI.renderActions(actions, handleActionSelect);
```

---

## What Was Already Complete in the Scaffold

The following were verified as correct and required no changes:

- **`js/state.js`** — variable system, `applyEffects()`, `registerDelay()`, `processDelays()`, `advanceTurn()`, halve-workload modifier, FA requested tracking, AI follow count, confidence drift seed
- **`js/data.js`** — all 6 turns, all delayed effect chains, FA consequence data for T3/T5, ARIA text for both conditions, xAI text
- **`js/telemetry.js`** — all event types, `exportSession()` with all required fields
- **`js/turns.js`** — `loadTurn()`, `handleFARequest()` (1.5–2s delay, RETRIEVING label, telemetry), FA consequence chain, action rendering, ARIA update, turn counter, `Telemetry.startTurn()`
- **`js/ui.js`** — variable bars, report rendering, action rendering, FA window with taskbar minimise/re-open, xAI window, ARIA panel, status popup, draggable windows
- **`js/aria.js`** — pushy popup with dismiss telemetry and alert counter
- **`js/main.js`** — briefing screen with PID input + condition selector, `startSession()` calling `State.init()`, session clock, `showScreen()`, both-conditions `ARIAPopup.show()` for pushy

---

## Testing Done

### Path simulator — `iup_path_simulator_1.py --test`

```
T1: Monitor Situation
T2: Publish Limited Advisory
T3: Act Independently
T4: Reassure Public
T5: Prioritise Critical Assets
T6: Controlled Response
```

| Variable | Expected | Result |
|---|---|---|
| Stability  | 90 | PASS |
| Resources  | 50 | PASS |
| Workload   | 40 | PASS |
| Confidence | 80 | PASS |
| Tag | Controlled Recovery | PASS |

Exit code: 0

### Delayed consequence chains verified (via simulator)

| Trigger | Effect | Turn fires |
|---|---|---|
| T1_A Emergency Rerouting | Workload +10 | 5 |
| T2_A Restore Communications | Resources −5 | 4 |
| T2_B Prioritise Infrastructure | Confidence −10 | 4 |
| T2_D Await Further Assessment | Confidence −5 | 4 |
| T3_A Wait For Analysis | Stability −10 | 4 |
| T4_A Launch Visible Response | Resources −10 | 6 |
| T4_B Continue Monitoring | Confidence −15 | 6 |
| T5_A Immediate Maintenance | Resources −5 | 6 |

---

## Done Criteria Met

- [x] Full session playable in calm condition — Turn 1 through summary
- [x] Full session playable in pushy condition — popup appears, is dismissible
- [x] Test path produces Stability=90, Resources=50, Workload=40, Confidence=80
- [x] `iup_path_simulator_1.py --test` exits 0
- [x] FA button triggers 1.5–2s delay then floating window
- [x] FA consequence fires at T3 (if triggered) and T5 (if triggered)
- [x] Session JSON exports with all required fields
- [x] No direct variable mutations outside `State.applyEffects()`

---

*Phase 2 complete. Next: Phase 3 — ARIA confidence drift animation, pushy overlay tint, alert counter, notification stack, taskbar flashing.*
