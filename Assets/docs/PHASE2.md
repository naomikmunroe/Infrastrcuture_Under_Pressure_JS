# Infrastructure Under Pressure — Phase 2

## Scope
Wire the full 6-turn game loop. All turns must run start to finish with
correct variable consequences, telemetry events firing, and the summary
screen displaying accurate final state.

Phase 2 is complete when a full session can be played in both conditions
without errors, and the exported JSON telemetry file matches expected
variable states for the test path.

---

## What Phase 1 delivered (Unity — now ported)
- Variable system: stability, resources, workload, confidence
- Turn counter 1–6
- applyEffects(), registerDelay(), advanceTurn()
- Halve-workload modifier flag
- Path simulator validating all 5,120 deterministic paths

The ported logic lives in `js/state.js`. Do not rewrite it — extend it only
if a specific Phase 2 requirement is unmet.

---

## What the scaffold already provides
See `js/` for the full file list. Key files for Phase 2:

| File | Status |
|---|---|
| `js/data.js` | Complete — all 6 turns, FA content, ARIA text |
| `js/state.js` | Complete — variable logic, delay system, drift seed |
| `js/telemetry.js` | Complete — all events defined |
| `js/ui.js` | Partial — bars and windows built; action rendering needs wiring |
| `js/turns.js` | Partial — turn load and action select handler scaffolded |
| `js/aria.js` | Partial — pushy popup structure exists; not fully wired |
| `js/main.js` | Partial — screens built; session flow needs completion |

---

## Phase 2 tasks (in order)

### Task 1 — Get 98.css working
Download 98.css and place at `css/98.css`.
Source: https://unpkg.com/98.css
Verify: open `index.html` — briefing screen should render with Win98 chrome.

### Task 2 — Briefing screen → session start
In `js/main.js`:
- Participant ID input and condition selector work on briefing screen
- Clicking `[ ACKNOWLEDGE AND PROCEED ]` calls `State.init(condition, pid)`
  and transitions to the game screen
- Verify `State.condition` and `State.participantId` are set before Turn 1 loads

### Task 3 — Turn 1 renders correctly
In `js/turns.js` → `loadTurn(0)`:
- Incident title, phase, and body text display from `TURNS_DATA[0]`
- All three reports render with correct label, source, and bullets
- Four action buttons render with name, immediate, and delayed text
- ARIA log shows correct text for the active condition
- Confidence value set via `State.getConfidenceDrift(0)` (calm) or 82–91 (pushy)
- Turn counter shows "Turn 1 / 6"
- Telemetry: `turn_start` event fires

### Task 4 — Action selection and consequence chain
In `js/turns.js` → `handleActionSelect(action)`:
- `State.applyEffects(action.immediateEffects)` fires on click
- Variable bars update immediately (varsChanged event → UI.updateVarBars)
- `State.registerDelay(turn, effects)` registers all delayed effects
- T3_C modifier: `State.setHalveWorkload()` called when action.modifier is set
- `State.logAction()` and `Telemetry.logAction()` both called
- After action: if turn < 6, call `State.advanceTurn()` then `loadTurn(turn-1)`
- After action on Turn 6: call `Main.showSummary()`

### Task 5 — Delayed consequences fire correctly
`State.advanceTurn()` calls `processDelays(turn)` internally.
Verify these specific consequence chains:

| Trigger | Delayed effect | Turn fires |
|---|---|---|
| T1_A Emergency Rerouting | Workload +10 | Turn 5 |
| T2_A Restore Communications | Resources −5 | Turn 4 |
| T2_B Prioritise Infrastructure | Confidence −10 | Turn 4 |
| T2_D Await Further Assessment | Confidence −5 | Turn 4 |
| T3_A Wait For Analysis | Stability −10 | Turn 4 |
| T4_A Launch Visible Response | Resources −10 | Turn 6 |
| T4_B Continue Monitoring | Confidence −15 | Turn 6 |
| T5_A Immediate Maintenance Programme | Resources −5 | Turn 6 |

Test method: play the test path (Task 8) and verify final variable state.

### Task 6 — Further analysis button
In `js/turns.js` → `handleFARequest()`:
- `State.applyEffects({workload: +3})` fires immediately on click
- `State.setFARequested(State.turn)` called
- `Telemetry.logFARequested(fa.expandedReport)` fires
- Button disabled and label changes to 'RETRIEVING ANALYSIS…'
- After 1500–2000ms delay: `UI.showFAWindow(fa)` called
- `Telemetry.logFAWindowOpened()` fires when window appears
- Window × close: `Telemetry.logFAWindowClosed(timeOpen)` fires
- Taskbar minimise button appears; re-open works

FA consequence logic (in `handleActionSelect`):
```
if (fa.consequence &&
    State.wasFARequested(State.turn) &&
    action.id === fa.consequenceAction) {
  State.registerDelay(fa.consequenceTurn, fa.consequenceEffect);
  Telemetry.logFAConsequenceTriggered(...);
}
```
Applies at T3 (Wait For Analysis) and T5 (Accept Elevated Risk) only.

### Task 7 — Summary screen
In `js/main.js` → `showSummary()`:
- `Telemetry.exportSession()` called — downloads JSON file
- Final variable values displayed as progress bars
- AI Follow Rate bracket (low/medium/high) displayed
- Action log displayed (T1: action name · T2: action name …)
- System Collapse flag shown if `State.checkCollapse()` is true
- Trajectory tag displayed (see logic below)

Trajectory tag priority:
1. System Collapse → overrides all (Stability < 20 OR Resources < 10)
2. AI Dependence → aiFollowCount >= 4
3. Controlled Recovery → all vars >= 30
4. Catch-all → Steady Management

### Task 8 — Test path verification
Run this path and verify final variable state matches expected output:

```
T1: Monitor Situation      (T1_B)
T2: Publish Limited Advisory (T2_C)
T3: Act Independently      (T3_B)
T4: Reassure Public        (T4_D)
T5: Prioritise Critical Assets (T5_C)
T6: Controlled Response    (T6_B)

Expected final state:
  stability:  90
  resources:  50
  workload:   40
  confidence: 80
  tag: Controlled Recovery
```

Also verify using the path simulator:
```
python docs/simulation/iup_path_simulator.py --test
```
Exit code 0 = pass.

### Task 9 — Both conditions playable
Play one full session as calm and one as pushy.
Verify:
- Calm: ARIA log shows hedged text, confidence drifts, no popup
- Pushy: ARIA log shows directive text, popup appears on Turn 1,
  popup is dismissible (× button works), telemetry logs dismissal
- Both conditions complete Turn 6 and reach summary screen

### Task 10 — Telemetry export
Complete one session and verify the downloaded JSON includes:
- participant_id, condition
- One `turn_start` event per turn (6 total)
- One `action_selected` event per turn (6 total) with responseTime
- Correct `wasAIFollow` value per action
- `further_analysis_requested` if FA button was clicked
- `xai_viewed` if xAI button was clicked
- `ai_follow_rate` bracket in the session summary object

---

## What Phase 2 does NOT include
Do not build these — they belong to later phases:

- Phase 3: ARIA confidence drift animation, pushy overlay tint,
  alert counter incrementing, notification stack, taskbar flashing
- Phase 4: xAI window content rendering (button can exist, wiring in Phase 3)
- Phase 5: Narrative tag full logic (all 9 tags), variable trajectory bars
  in summary with start→end display
- Phase 6: Polish — CSS animations, screen transitions, sound

---

## Architecture rules (carry forward from Phase 1)

- All variable changes go through `State.applyEffects()`. Never set directly.
- All telemetry goes through `Telemetry.*`. Never log ad-hoc.
- No game logic in `ui.js`. UI reads state; it does not write it.
- `data.js` is read-only during a session. Never mutate TURNS_DATA.
- Integer arithmetic only for variables. Use `Math.round()` or integer ops.
  The halve-workload modifier uses `Math.floor(delta / 2)` — not 0.5.

---

## Reference files in docs/

| File | Use |
|---|---|
| `docs/design/IUP_Turns_Design_v1_4.docx` | Turn content, FA text, consequence logic |
| `docs/design/IUP_UI_Design_Document_v1_5.docx` | Panel layout, window specs, telemetry events |
| `docs/gdd/infrastructure_under_pressure_gdd_v1_1.md` | Guardrails, architecture constraints |
| `docs/gdd/GDD_v1_2_patch.md` | Design Updates |
| `docs/simulation/iup_path_simulator.py` | Test expected values |
| `docs/simulation/IUP_Path_Simulation_v1_1.csv` | Full path enumeration for reference |

---

## Done criteria

Phase 2 is complete when all of the following are true:

- [ ] Full session playable in calm condition — Turn 1 through summary
- [ ] Full session playable in pushy condition — popup appears, is dismissible
- [ ] Test path produces Stability=90, Resources=50, Workload=40, Confidence=80
- [ ] `iup_path_simulator.py --test` exits 0
- [ ] FA button triggers 1.5–2s delay then floating window
- [ ] FA consequence fires at T3 (if triggered) and T5 (if triggered)
- [ ] Session JSON exports with all required fields
- [ ] No direct variable mutations outside `State.applyEffects()`
