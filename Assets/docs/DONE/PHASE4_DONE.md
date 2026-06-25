# Infrastructure Under Pressure — Phase 4 Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 4 Covered

Four systems identified by cross-referencing the decision log against Phases 1–3:
threshold-based consequence events (AD-25), full 9-tag narrative classifier,
draft comms turn (AD-26/27), and vignette prompt update to inject all Phase 4 data.

---

## Task 1 — Threshold-based consequence event system (AD-25)

Five named threshold events defined in `CONSEQUENCE_EVENTS` array inside `state.js` IIFE:

| Event | Trigger | Additional effect |
|---|---|---|
| Grid Sector Failure | Stability < 40 | None |
| Full Sector Outage — Cascade Risk | Stability < 20 | None |
| Emergency Procurement Triggered | Resources < 25 | None |
| Nationalisation Inquiry Opened | Confidence < 35 | Confidence −5 |
| Operator Fatigue Flag Raised | Workload > 75 | None |

**Firing logic** — `checkThresholds()` called at end of every `applyEffects()`. Sets `event.fired = true` before calling `applyEffects(additionalEffect)` — prevents self-triggering. Then dispatches `thresholdEvent` custom DOM event. Then pushes to `_thresholdEvents`. Reset on `State.init()`: `CONSEQUENCE_EVENTS.forEach(e => { e.fired = false; })`.

**Listener in turns.js** — `thresholdEvent` listener calls `UI.showConsequencePopup(e.detail, callback)`. Callback calls `Telemetry.logThresholdEventAcknowledged`.

**Popup title** — `showConsequencePopup` updated to distinguish threshold vs delayed consequence events by checking `detail.label`. Threshold: `⚠ GRIDHUB — SYSTEM EVENT: [label]` and sublabel `[LABEL] — T[n]`. Delayed: `⚠ GRIDHUB — SYSTEM CONSEQUENCE EVENT`.

**Duplicate IDs fixed** — consequence popup now uses `id = 'conseq-' + Date.now()` for button IDs, preventing stale-reference bugs when multiple popups appear in the same session.

**Telemetry** — `logThresholdEventAcknowledged({ id, label, turn, vars })` logs `threshold_event_acknowledged`. `thresholdEvents: State.thresholdEvents` added to session export.

---

## Task 2 — Full narrative tag logic (9 tags)

`evaluateTags(actionLog, finalVars)` extracted as a private module function in `telemetry.js`. Replaces the inline logic that was embedded in `exportSession`.

| Tag | Condition |
|---|---|
| Preventative Management | T1_A selected |
| Public Confidence First | T2_A + (T4_A or T4_D) |
| AI Dependence | T3_A + (T6_D_CALM or T6_D_PUSHY) |
| Deferred Escalation | T3_A + T4_B |
| Resource Preservation | ≥4 cost-preserving actions |
| Reactive Stabilisation | T1_B + T5_A |
| Controlled Recovery | All vars ≥ 30 |
| System Collapse | Stability < 20 OR Resources < 10 |
| Steady Management | No other tag fires (catch-all) |

Tags are not mutually exclusive — multiple can fire. System Collapse sorts to front of array if present. `archetypeLabel` is `narrativeTags[0]` — System Collapse if present, else first tag.

**Summary screen** — `renderSummary` replaced single `.traj-badge` with loop over all fired tags. System Collapse badge: `border-color:#ff4444;background:#1a0000`. Others: `border-color:#4488ff`. All displayed inline.

**`_trajectoryBlurb`** extended for all 9 tags (prev: 3 cases + default). New cases: Preventative Management, Public Confidence First, Deferred Escalation, Resource Preservation, Reactive Stabilisation.

**Session export** — `narrativeTags` array added. `tags` alias preserved for backward compat.

---

## Task 3 — Draft comms turn (AD-26)

**State — state.js** additions:
- `let _commsRequired = false`, `_commsCompleted = false`, `_commsOutcome = null`
- `setCommsRequired()`, `completeComms(outcome)` functions
- Getters: `commsCompleted`, `commsOutcome`
- All reset on `State.init()`

**Trigger logic — turns.js** — `checkCommsRequired()` fires in `_drainConsequences` callback (after consequences shown but before loading next turn). Condition: `State.turn >= 3 && State.turn <= 4 && State.confidence < 35 && !State.commsCompleted`. If true: calls `State.setCommsRequired()`, `Main.showCommsScreen()`, stores `_pendingTurnLoad = () => loadTurn(State.turn - 1)`. `resumeAfterComms()` exported and called by `Main.hideCommsScreen()` after publish.

**ARIA draft texts — main.js** `COMMS_DRAFTS` constant:
- T3: clean advisory text (hidden tags would be in submitted version)
- T4: clean advisory text (hidden tags would be in submitted version)

**Comms screen** — built dynamically in `Main.showCommsScreen()`. Layout: 98.css menu bar + two-column grid. Left: draft window (textarea + mode buttons + preview). Right: ARIA comms panel (status updates per mode).

Three modes:
| Mode | Textarea | ARIA panel | Preview colour |
|---|---|---|---|
| ARIA DRAFT | Readonly, ARIA text | `● DRAFT PROVIDED` | Amber |
| MODIFY DRAFT | Editable, ARIA text | `● DRAFT MODIFIED` | Amber |
| INDEPENDENT | Editable, blank | `● ARIA INPUT NOT USED` | Green |

**Edit extent** — measured by simple character diff (not Levenshtein): `changed = |len_diff| + position_mismatches`. `editExtent = changed/originalLength > 0.5 ? 'FULL' : 'PARTIAL'`.

**Publish consequences:**
- ARIA_FULL → confidence −12, `UI.showPlaceholderConsequencePopup(hideCommsScreen)` as callback
- ARIA_MODIFIED + PARTIAL → confidence −6, then `hideCommsScreen`
- ARIA_MODIFIED + FULL or INDEPENDENT → no consequence, `hideCommsScreen`

**Placeholder consequence popup** — `showPlaceholderConsequencePopup(onAcknowledge)` in `ui.js`. Appended to `document.body` (not `#game-overlay` which is in the hidden game screen). `position:fixed;z-index:500`. Reveals hidden tag text verbatim. ACKNOWLEDGE increments consequence counter and calls callback.

**`#screen-comms`** — blank div added to `index.html` between `#screen-game` and `#screen-summary`. CSS: `align-items:flex-start;justify-content:flex-start;padding:0` (same as game screen). `.comms-mode-btn`, `.comms-mode-btn.active`, `.comms-textarea` CSS added.

**Turn counter** — comms turn does NOT call `advanceTurn()`. Turn counter unchanged throughout.

**Telemetry** — `logCommsOutcome(outcome)` logs `comms_turn_completed` with all 7 fields:
`comms_mode`, `comms_placeholder_present`, `comms_edit_extent`, `comms_consequence_fired`, `comms_confidence_impact`, `comms_response_time`. Session export: `commsOutcome`, `commsTurnTriggered`.

---

## Task 4 — Vignette prompt update

`showVignette()` in `main.js` updated. User prompt now injects:

```
Trajectory: [primary tag]
All tags: [tag1, tag2, ...]
AI follow rate: N/6
Further analysis requested: N turns
xAI viewed: N turns
Threshold events fired: [Label (Turn N); ...]
Comms turn triggered/not triggered. Mode: ... Consequence: YES/NO.
Consequence events dismissed total: N
Final variable states: Stability N, Resources N, Workload N, Public Confidence N
System collapse: TRUE/FALSE
```

Primary trajectory = `tags[0]` (System Collapse if present). Threshold events from `sessionData.thresholdEvents`. Comms outcome from `sessionData.commsOutcome` (null if never triggered).

---

## Architecture changes summary

| File | Key changes |
|---|---|
| `state.js` | `CONSEQUENCE_EVENTS` array, `checkThresholds()`, `_thresholdEvents`, comms state (`_commsRequired/_commsCompleted/_commsOutcome`), `setCommsRequired()`, `completeComms()`, getters: `thresholdEvents`, `commsCompleted`, `commsOutcome`, `vars`, `aiFollowCount` |
| `telemetry.js` | `evaluateTags()` private function (extracted from exportSession), `logThresholdEventAcknowledged()`, `logCommsOutcome()`, updated `exportSession` with `narrativeTags`, `thresholdEvents`, `commsOutcome`, `commsTurnTriggered` |
| `turns.js` | `thresholdEvent` listener, `checkCommsRequired()`, `resumeAfterComms()`, `_pendingTurnLoad`, drain callback checks comms before loading next turn |
| `ui.js` | `showConsequencePopup` updated with dynamic title (threshold vs delayed), `showPlaceholderConsequencePopup()`, `renderSummary` multi-tag badges, `_trajectoryBlurb` all 9 cases |
| `main.js` | `showCommsScreen()`, `hideCommsScreen()`, `COMMS_DRAFTS`, updated vignette prompt |
| `index.html` | `#screen-comms` div, `.comms-mode-btn`, `.comms-textarea` CSS, `#screen-comms` layout CSS |

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

Test path does not trigger comms turn (confidence stays above 35 throughout). Threshold events not triggered on this path (all vars stay well above thresholds). Variable logic unchanged from Phase 3.

---

## Done criteria

### Task 1 — Threshold events ✓
- [x] All 5 named events fire correctly on threshold crossing
- [x] Each fires only once per session (`fired` flag reset on init)
- [x] Popup with correct orange title bar and event name
- [x] Nationalisation inquiry fires Confidence −5 additional effect
- [x] `threshold_event_acknowledged` logged per event
- [x] `thresholdEvents` array in session export

### Task 2 — Narrative tags ✓
- [x] All 9 tags evaluated at session end
- [x] Tags not mutually exclusive — multiple can appear
- [x] System Collapse sorts first (red badge)
- [x] Steady Management only fires when no other tag fires
- [x] `narrativeTags` in session export
- [x] Summary screen shows all fired tags as badges

### Task 3 — Comms turn ✓
- [x] Fires when Public Confidence < 35 during T3 or T4
- [x] Fires maximum once (`commsCompleted` guard)
- [x] Three modes selectable
- [x] ARIA draft clean text displayed; consequence fires on accept
- [x] Placeholder popup on ARIA_FULL
- [x] Reveals [ESTIMATED_RESTORATION_TIME], [SECTOR_NAME] tags
- [x] Reduced consequence (−6) on ARIA_MODIFIED + PARTIAL
- [x] No consequence on INDEPENDENT or FULL edit
- [x] Screen dismissed after publish, turn flow resumes
- [x] Turn counter unchanged
- [x] All 7 comms telemetry fields logged
- [x] `commsOutcome` and `commsTurnTriggered` in export
- [x] `iup_path_simulator.py --test` exits 0

### Task 4 — Vignette prompt ✓
- [x] Threshold event names and turns injected
- [x] Comms turn outcome injected
- [x] All narrative tags injected as comma-separated list
- [x] Primary trajectory = first tag (System Collapse if present)
