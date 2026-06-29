# Infrastructure Under Pressure — Phase 4c Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 4c Covered

Between-turn environmental event system (AD-30/AD-31). Five tasks implemented in order, with path
simulator stress test confirmed before any JS work began.

---

## Task 1 — Path Simulator Stress Test (AD-31)

Added `run_between_turn_stress_test()` to `iup_path_simulator_1.py` with new `--stress` flag.

Applies worst-case between-turn drift (3 Phoebe events + 2 Cassandra events) to initial variable
state and verifies no consequence threshold is crossed by drift alone:

```
Worst-case Phoebe:    EVT-P01 resources -3, EVT-P02 stability -2, EVT-P04 stability -2
Worst-case Cassandra: EVT-C01 stability -4, EVT-C03 confidence -4

After maximum drift: stability=62, resources=67, workload=30, confidence=66
All 5 threshold checks: PASS
```

`python iup_path_simulator_1.py --stress` → exits 0  
`python iup_path_simulator_1.py --test` → exits 0 (existing test path unaffected)

---

## Task 2 — Event Pools in data.js

Added `BETWEEN_TURN_EVENTS` constant with two phase-specific pools:

- **Phoebe** (gaps 1–3): 5 events covering resources, stability (×2), workload, confidence
- **Cassandra** (gaps 4–5): 5 events covering stability, resources (×2), confidence, workload

All 10 event texts are causally ambiguous — no text references the variable affected or the effect
magnitude. This implements the productive uncertainty mechanism from the design addendum.

---

## Task 3 — Draw Logic in state.js

`drawBetweenTurnEvents(seed)` sits outside the State IIFE and uses a seeded LCG shuffle
(same algorithm as `seededRand` in State) to draw 3 Phoebe + 2 Cassandra events per session.

Seed is `Date.now()` at `State.init()` — session-level, not participant-level. Same participant
sees different events across two condition sessions.

Draw maps to gaps: `{ 1: phoebe[0], 2: phoebe[1], 3: phoebe[2], 4: cassandra[0], 5: cassandra[1] }`

New silent effect variant:

```javascript
function applyEffectsSilent(effects) {
  // Identical to applyEffects() but skips checkThresholds()
  // Used exclusively by applyBetweenTurnEffect()
}
```

New public API on State: `getBetweenTurnEvent(gap)`, `applyBetweenTurnEffect(event)`,
`logBetweenTurnEvent(gap, event, ts)`, `betweenTurnEventLog` getter, `checkThresholds` exposed.

---

## Task 4 — Between-turn Popup UI (turns.js + ui.js)

### Flow

```
Player selects action (Turn N)
  → applyEffects() — immediate effects + checkThresholds()
  → State.advanceTurn() — processDelays() + checkThresholds()
  → _drainConsequences() — consequence popups cleared
  → handleBetweenTurn(completedTurn, done)   ← NEW
      → UI.showBetweenTurnPopup(event, callback)
      → player clicks ACKNOWLEDGE or ×
      → State.applyBetweenTurnEffect(event)  [silent — no threshold check]
      → State.logBetweenTurnEvent(...)
      → Telemetry.logBetweenTurnEventAcknowledged(...)
  → checkCommsRequired() if applicable
  → loadTurn(State.turn - 1)
      → State.checkThresholds()              ← NEW: catches between-turn crossings
```

### Threshold suppression

`applyBetweenTurnEffect` calls `applyEffectsSilent` which does **not** call `checkThresholds()`.
`checkThresholds()` is called at the start of each `loadTurn()` to catch any crossings that
accumulated from between-turn effects. This guarantees: cascade failure requires a decision-turn
action to contribute; between-turn drift alone cannot trigger a consequence popup mid-gap.

### Popup appearance

- Title bar: `#804000` (amber, matching consequence popup family)
- Title bar text: `GRIDHUB — ENVIRONMENTAL EVENT`
- Body: event title (bold) + event text — **no variable name, no effect value**
- Both `×` and `[ ACKNOWLEDGE ]` apply effect and dismiss
- `varsChanged` dispatches from `applyEffectsSilent` → bars update on dismiss
- Created dynamically and appended to `#game-overlay` (consistent with existing popup pattern)

### Coverage

`handleBetweenTurn` is called only in the `turn < 6` branch of `handleActionSelect`, so:
- Fires at all 5 gaps (after T1, T2, T3, T4, T5)
- Never fires after T6

---

## Task 5 — Telemetry

New event type `between_turn_event_acknowledged` logged per gap (5 total per session):

```javascript
{
  event_id, event_title, gap_number, variable_affected,
  effect_value,                    // present in telemetry even though hidden from player UI
  acknowledgement_timestamp
}
```

`betweenTurnEvents` array added to session export — array of 5 objects from
`State.betweenTurnEventLog`, each including `acknowledged: true` and
`acknowledgement_timestamp`.

---

## Files Modified

| File | Changes |
|---|---|
| `Assets/docs/simulation/iup_path_simulator_1.py` | Added `PHOEBE_EVENTS`, `CASSANDRA_EVENTS`, `CONSEQUENCE_THRESHOLDS`, `run_between_turn_stress_test()`, `--stress` entry point |
| `js/data.js` | Added `BETWEEN_TURN_EVENTS` (10 events, 2 pools) |
| `js/state.js` | Added `drawBetweenTurnEvents()`, `applyEffectsSilent()`, `getBetweenTurnEvent()`, `applyBetweenTurnEffect()`, `logBetweenTurnEvent()`, private vars, init wiring, public API |
| `js/ui.js` | Added `showBetweenTurnPopup()` |
| `js/turns.js` | Added `handleBetweenTurn()`, wired into action flow, added `State.checkThresholds()` at `loadTurn()` start |
| `js/telemetry.js` | Added `logBetweenTurnEventAcknowledged()`, added `betweenTurnEvents` to session export |

---

## Done Criteria — All Confirmed

### Task 1
- [x] `--stress` flag added to path simulator
- [x] `python iup_path_simulator_1.py --stress` exits 0
- [x] Output confirms no threshold crossed by drift alone on any variable
- [x] `--test` flag still exits 0

### Task 2
- [x] `BETWEEN_TURN_EVENTS` in data.js — 5 Phoebe + 5 Cassandra events
- [x] All 10 event texts do not reference the variable affected
- [x] All 10 event texts are causally ambiguous

### Task 3
- [x] `drawBetweenTurnEvents()` produces 3 Phoebe + 2 Cassandra per session
- [x] Draw is without replacement within each pool
- [x] Same seed produces same draw
- [x] Different sessions produce different draws (seed = Date.now())
- [x] `_drawnEvents` maps gaps 1–5 to one event each

### Task 4
- [x] Between-turn popup fires after turn summary, before next incident loads
- [x] Popup shows event title and text — NOT the variable or effect value
- [x] Both × and ACKNOWLEDGE dismiss popup and apply effect
- [x] Variable effect applied via `applyEffectsSilent()` on dismiss
- [x] `checkThresholds()` NOT called during between-turn processing
- [x] Variable bars update after popup dismissed (varsChanged dispatched)
- [x] Popup fires at all 5 gaps (after T1–T5)
- [x] No popup fires after T6

### Task 5
- [x] `between_turn_event_acknowledged` event logged per gap (5 total)
- [x] Each log includes: event_id, gap_number, variable_affected, effect_value, acknowledgement_timestamp
- [x] `betweenTurnEvents` array in session export with 5 entries
- [x] Effect value present in telemetry even though hidden from player UI
