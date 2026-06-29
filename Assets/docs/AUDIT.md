# IUP Implementation Audit

## Task
Perform a systematic audit of the current codebase against the phase
implementation documents. For each phase, check every done criterion
and report what is implemented, what is missing, and what is partially
implemented.

Do not implement anything during this audit. Report findings only.

---

## How to audit

For each phase document listed below:
1. Read the phase .md file
2. Find the "Done criteria" checklist at the bottom
3. Check the relevant source files in the codebase
4. Report status per criterion: DONE / MISSING / PARTIAL

Be specific. For MISSING and PARTIAL items, name the exact file and
function where the implementation gap is.

---

## Files to check against

| Phase | Source files to inspect |
|---|---|
| Phase 2 | js/state.js, js/turns.js, js/telemetry.js, js/ui.js, js/main.js, js/data.js |
| Phase 2b | js/state.js, js/turns.js, js/telemetry.js, js/ui.js, js/main.js |
| Phase 3 | js/aria.js, js/turns.js, js/ui.js, js/main.js, css/game.css |
| Phase 4 | js/state.js, js/turns.js, js/telemetry.js, js/ui.js, js/main.js |
| Phase 4b | js/turns.js, js/ui.js, js/telemetry.js |
| Phase 4c | js/state.js, js/turns.js, js/ui.js, js/telemetry.js, js/data.js, docs/simulation/iup_path_simulator.py |

---

## Phase documents to read

Read each of these in order:

1. `PHASE2.md`
2. `PHASE2b.md`
3. `PHASE3.md`
4. `PHASE4.md`
5. `PHASE4b.md`
6. `PHASE4c.md`

---

## Report format

For each phase produce output in this exact format:

```
═══════════════════════════════════════
PHASE [N] — [name]
═══════════════════════════════════════

DONE:
  ✓ [criterion text]
  ✓ [criterion text]

PARTIAL:
  ⚠ [criterion text]
    → [what exists / what is missing]

MISSING:
  ✗ [criterion text]
    → [file and function where it should be]

SUMMARY: [n] done / [n] partial / [n] missing
```

---

## After all phases

Produce a final consolidated summary:

```
═══════════════════════════════════════
CONSOLIDATED AUDIT SUMMARY
═══════════════════════════════════════

FULLY IMPLEMENTED PHASES:
  [list phases where all criteria are DONE]

PHASES WITH GAPS:
  Phase [N]: [n] missing, [n] partial
    Priority gaps:
      - [most critical missing item]
      - [second most critical]

SPECIFIC ITEMS TO IMPLEMENT BEFORE PHASE 5:
  1. [item] — [file]
  2. [item] — [file]
  ...

ITEMS THAT APPEAR ABSENT FROM CODEBASE ENTIRELY:
  - [feature name] — expected in [file]
```

---

## Special checks

In addition to the done criteria checklists, explicitly check for these
items which are known risks based on design history:

### Comms turn (AD-26)
Check whether any of the following exist in the codebase:
- `screen-comms` div or `#screen-comms` in index.html or main.js
- `showCommsScreen()` function anywhere
- `comms_mode` or `commsOutcome` in telemetry.js or state.js
- `ARIA_FULL`, `ARIA_MODIFIED`, `INDEPENDENT` string constants
- `placeholder` or `[ESTIMATED_RESTORATION_TIME]` anywhere

Report: IMPLEMENTED / PARTIALLY IMPLEMENTED / ABSENT

### Between-turn events (Phase 4c)
Check whether:
- `BETWEEN_TURN_EVENTS` constant exists in data.js
- `drawBetweenTurnEvents()` function exists in state.js
- `applyEffectsSilent()` exists in state.js
- `showBetweenTurnPopup()` exists in ui.js
- `--stress` flag exists in iup_path_simulator.py

Report: IMPLEMENTED / PARTIALLY IMPLEMENTED / ABSENT

### T3 progressive loading (Phase 4b)
Check whether:
- `loadTurnT3()` or equivalent function exists in turns.js
- `loadTurnT3ARIA()` or `showARIADegraded()` exists
- Action buttons are locked and unlocked at different times on T3
- `t3_report_loaded` event is logged in telemetry.js
- `t3Behaviour` object is included in session export

Report: IMPLEMENTED / PARTIALLY IMPLEMENTED / ABSENT

### xAI window (Phase 3, Task 5)
Confirm all six verification points:
- [ ] Button `#btn-xai` present in ARIA panel in both conditions
- [ ] `UI.showXAIWindow(condition, confidenceValue)` exists and is called
- [ ] Confidence value injected into window text
- [ ] Calm text: hedged, dataset note in grey italic
- [ ] Pushy text: confident, dataset note in red, red bold footer
- [ ] Button disabled after closing this turn

### EV-05 screening form (Phase 3, Task 6)
Check whether:
- `screen-screening` screen exists
- Three Likert questions are rendered
- Validation prevents proceeding without answering all three
- `screeningData` is included in session export

---

## Do not implement anything

This is an audit only. If you identify gaps, list them clearly.
Do not attempt to fix them during this task.
A separate prompt will address implementation gaps after the audit
is complete.
