# Phase 5 — DONE
**Infrastructure Under Pressure (IUP)**

Implementation complete. All acceptance criteria met.

---

## Tasks Completed

### 1. Countdown Timer (AD-33)

**Files modified:** `js/data.js`, `js/state.js`, `js/telemetry.js`, `js/ui.js`, `js/turns.js`, `js/main.js`

- 90-second countdown timer added to every decision turn (T1–T6).
- Displayed above action buttons in `#panel-actions` as a Win98-style panel:
  `DUTY OFFICER RESPONSE TIMER   [ 01:30 ]`
  `Protocol 7 — SLA response required within 90 seconds`
- Timer value turns red at ≤15 seconds; shows `EXPIRED` at 0.
- Timer clears immediately when player selects an action (including via pushy popup).
- Timer does not run during: spinner phase, between-turn events, comms turn, duty log modal, summary.
- `TIMEOUT_CONSEQUENCE` constant defined in `data.js` and consumed by `turns.js`.

**Timeout penalty:** `Stability −3, Public Confidence −3`
(Reduced from spec's −5/−3: simulator stress test showed −5 stability would reach 32 when combined with 6 timeouts + worst-case between-turn drift, crossing the Grid Sector Failure threshold of 40. −3 keeps worst-case at 44.)

**On expiry:**
1. Action buttons disabled
2. Timer display cleared
3. `State.applyEffects({ stability: -3, confidence: -3 })` applied
4. `State.incrementTimeouts()` called
5. `State.logTimeoutAction()` adds `AUTOMATED FAILSAFE ENGAGED` to turn log
6. `Telemetry.logTurnTimerFired(turn, vars)` logs the event
7. Consequence popup: title `AUTOMATED FAILSAFE ENGAGED`, body per spec
8. After popup acknowledged: turn advances via same `advanceTurn → drainConsequences → handleBetweenTurn → loadTurn` path as normal action selection

**Stale popup fix (pre-existing bug fixed):** `UI.removePushyPopup()` added at the top of `loadTurn()`, ensuring stale pushy popups from a previous turn are cleared before the next turn renders.

---

### 2. Telemetry Fields

**File modified:** `js/telemetry.js`, `js/state.js`

- `timeout_fired: false` / `true` added to action event logs
- `time_remaining_on_action` (seconds remaining when player acted, `0` if timeout) added to action events
- `Telemetry.logTurnTimerFired(turn, vars)` logs `turn_timeout_fired` event
- `State.timeouts` counter (incremented per timeout, reset on session start)
- `timeout_count: State.timeouts` added to `exportSession()`
- `duty_log_text`, `duty_log_timestamp`, `duty_log_word_count` added to `exportSession()`

---

### 3. Mid-Session Duty Log

**Files modified:** `js/turns.js`, `js/ui.js`, `js/telemetry.js`

- Win98 modal fires once per session between T3 and T4 (both conditions identically).
- Title: `DUTY LOG — SITUATION REPORT REQUIRED`
- Protocol 6 framing per spec; not dismissible without submitting.
- Submit button disabled until ≥1 character entered.
- ARIA panel hidden (`visibility: hidden`) during modal; restored on submit.
- Fires after the gap-3 between-turn event popup is acknowledged, before T4 incident loads.
- Also fires correctly when T3 ends via timeout (not just normal action selection).
- `_dutyLogCompleted` flag prevents double-fire; reset by `Turns.resetSession()` on session start.
- `Telemetry.logDutyLog(text, timestamp, wordCount)` stores submission.

---

### 4. Path Simulator Validation

**File modified:** `Assets/docs/simulation/iup_path_simulator_1.py`

Added `run_timeout_stress_test()` function (flag: `--timeout-stress`).

**Simulator results (all PASS):**

```
python iup_path_simulator_1.py --test           → PASS  (5,120 paths, logic unchanged)
python iup_path_simulator_1.py --stress         → PASS  (AD-31 between-turn drift)
python iup_path_simulator_1.py --timeout-stress → PASS  (AD-33 timeout + drift)
```

**Timeout stress test output:**
```
Variable states after 6 timeouts + maximum drift:
  stability     start=70  end=44  change=-26
  resources     start=70  end=67  change=-3
  workload      start=30  end=30  change=+0
  confidence    start=70  end=48  change=-22

Min stability reachable (timeout+drift only): 44  [threshold: 40 — SAFE]
Min confidence reachable (timeout+drift only): 48  [threshold: 35 — SAFE]
No consequence threshold crossed without player decision.
```

Path count remains **5,120**. Timeout penalty is outside the decision layer and does not generate new paths.

---

## Acceptance Criteria

- [x] Timer counts from 90 to 0 on every decision turn
- [x] Timer clears immediately when player selects an action
- [x] Timeout fires penalty, popup, and telemetry correctly
- [x] Timer does not run outside decision turns
- [x] `timeout_fired` and `time_remaining_on_action` appear in telemetry export
- [x] `State.timeouts` increments correctly and exports with session data
- [x] Red text fires at ≤15 seconds
- [x] `EXPIRED` displayed at 0:00 before popup fires
- [x] `TIMEOUT_CONSEQUENCE` constant defined in `data.js` and consumed by `turns.js`
- [x] Path simulator worst-case check passes: no consequence threshold breached by timeout + drift without player decision
- [x] Duty log modal fires once between T3 and T4 in both conditions
- [x] Submit button disabled until at least one character entered
- [x] `duty_log_text`, `duty_log_timestamp`, `duty_log_word_count` logged to telemetry
- [x] ARIA panel not visible during duty log window

---

## Ethics Note

The duty log collects free-text mid-session data not in the original ethics approval. Flag to Charlie before recruitment — anonymous, low-risk, within existing study purpose. Likely requires a one-line scope note only.
