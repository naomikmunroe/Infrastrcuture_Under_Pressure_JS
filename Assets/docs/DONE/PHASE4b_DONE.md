# Infrastructure Under Pressure — Phase 4b Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 4b Covered

Targeted rework of T3 only. The original 12–15s full block (`_t3ExtendedTimeout`) was replaced
with two independent parallel systems: progressive report loading and ARIA degradation. The
behavioural choice the turn is designed to measure (wait for more data vs. act on what's
available) is now possible.

---

## System 1 — Progressive report loading

T3 load sequence:
```
0s    — Incident title and description appear; action buttons locked (opacity 0.4, disabled)
3s    — Technical Report loads; action buttons unlock simultaneously
7s    — Operations Report loads
11s   — Risk Assessment loads (partial — first sentence + "Retrieving additional data…")
14s   — Risk Assessment timeout: "DATA UNAVAILABLE — Source: GRIDHUB Archive"
```

Implemented via `_loadTurnT3Reports(token, turnData)` in `turns.js`. Each step is
guarded by a `_loadToken !== token` check — if the player acts early, the coroutine
detects the stale token and aborts without touching the next turn's DOM.

`_loadToken` increments at the start of every `loadTurn()` call, so any suspended T3
callbacks automatically become no-ops when T4 loads.

---

## System 2 — ARIA degradation

`showARIADegraded(staleConfidenceValue)` in `ui.js` renders the ARIA panel immediately
on T3 load in a degraded state:
- Mode label: `● ANALYSIS UNAVAILABLE`
- Log content: `> ARIA: ANALYSIS REQUEST TIMEOUT / > Recommendation unavailable this turn.`
- Confidence bar: T2 stale value, greyed out (#808080)
- Confidence label: `CONFIDENCE DATA STALE — last updated: T2`
- xAI button: disabled, tooltip "Analysis unavailable"
- Pushy condition: title bar still flashes red; stacked notification fires at 8s:
  `⚠ ARIA: UNABLE TO COMPLETE ANALYSIS — act on available data`

Stale confidence passed from `turns.js` as T2 value (`State.getConfidenceDrift(1)` or
`State.getPushyConfidence(1)` depending on condition).

Implemented via `_loadTurnT3ARIA(token)` — fire-and-forget, runs in parallel with System 1.
Calm condition: immediate no-op return. Pushy: 8s sleep then stack notification, guarded
by token check.

---

## ARIA resets on T4

`loadTurn(3)` (turnIndex 3 = T4) is in the `else` branch and calls `UI.renderARIA(turnData,
_currentConfidence)` after the standard spinner delay. ARIA is fully reset to normal state.

---

## Telemetry

Three new fields added to `telemetry.js`:

| Event / Field | Details |
|---|---|
| `t3_report_loaded` | Fires 3 times (reportNumber 1/2/3, timestamp) |
| `t3_action_taken` | Fires once on T3 action: `t3_reports_loaded_at_action` (1–3), `t3_aria_loaded` (always false), `t3_wait_duration_ms` |
| `t3Behaviour` (session export) | `reportsLoadedAtAction`, `waitDurationMs`, `ariaLoaded`, `furtherAnalysisRequested` |

`markT3Start()` called at T3 load. `logT3ReportLoaded(n, ts)` called by `_loadTurnT3Reports`
after each report renders. `logT3ActionTaken(_t3ReportsLoaded)` called in `handleActionSelect`
when `State.turn === 3` — `_t3ReportsLoaded` is a module-level counter in `turns.js`, reset
to 0 on each `loadTurn()` and incremented synchronously after each report renders and before
`unlockActions()`, so it is always accurate at action time.

---

## Architecture changes summary

| File | Changes |
|---|---|
| `js/turns.js` | Removed `_t3ExtendedTimeout`. Removed T3 branch from `_turnLoadDelay`. Added `_loadToken`, `_t3ReportsLoaded` module vars. Restructured `loadTurn` to branch at `turnIndex === 2`. Added `_loadTurnT3Reports(token, turnData)`, `_loadTurnT3ARIA(token)`. Added `Telemetry.logT3ActionTaken(_t3ReportsLoaded)` in `handleActionSelect` when `turn === 3`. Pushy popup `setTimeout` now guarded by token check. |
| `js/ui.js` | Added `renderIncidentT3Start(turnData)`, `appendReport(turnData, index)`, `appendReportPartial(turnData, index)`, `updateReportToTimeout()`, `renderActionsLocked(turnData)`, `unlockActions()`, `showARIADegraded(staleConfidenceValue)`. All exported. |
| `js/telemetry.js` | Added `_t3Start`, `_t3ReportsLoaded`, `_t3WaitDuration` vars (reset on `init`). Added `markT3Start()`, `logT3ReportLoaded(n, ts)`, `logT3ActionTaken(n)`. Added `t3Behaviour` object to `exportSession`. Added `t3ReportsLoaded` getter. All exported. |

---

## Path simulator result

```
py iup_path_simulator_1.py --test

Test path: T1_B → T2_C → T3_B → T4_D → T5_C → T6_B
stability:  expected=90  actual=90  PASS
resources:  expected=50  actual=50  PASS
workload:   expected=40  actual=40  PASS
confidence: expected=80  actual=80  PASS
Tag check:  Controlled Recovery     PASS

Result: PASS
```

Variable logic unchanged — Phase 4b adds no new state mutations, only UI/telemetry.

---

## Done criteria

- [x] T3 renders incident description immediately (0s)
- [x] Technical Report appears at ~3s, action buttons unlock simultaneously
- [x] Operations Report appears at ~7s
- [x] Risk Assessment appears partially at ~11s, times out at ~14s
- [x] Actions are locked (disabled, opacity 0.4) before Technical Report loads
- [x] Actions are fully clickable after Technical Report loads
- [x] ARIA panel shows degraded state immediately on T3 load (grey text, stale confidence, disabled xAI)
- [x] Pushy condition: stacked notification appears at ~8s despite ARIA failure
- [x] ARIA panel restores to normal state on T4 load (standard `renderARIA` called)
- [x] `t3_report_loaded` fires 3 times (one per report)
- [x] `t3_action_taken` logs `t3_reports_loaded_at_action` correctly (1, 2, or 3)
- [x] `t3Behaviour` object present in session export
- [x] Player can select an action at any point after Technical Report loads
- [x] FA button available and functional after Technical Report loads
- [x] `iup_path_simulator_1.py --test` exits 0 — variable logic unchanged
