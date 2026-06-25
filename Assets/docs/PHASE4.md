# Infrastructure Under Pressure — Phase 4

## Scope
Four systems not yet implemented, identified by cross-referencing the
decision log against Phases 1–3:

1. Threshold-based consequence event system (AD-25)
2. Full narrative tag logic — all 9 tags (summary screen completion)
3. Draft comms turn (AD-26/27)
4. Vignette prompt update to inject named consequence events

Phase 4 is complete when all four systems pass their done criteria and
`iup_path_simulator.py --test` still exits 0.

---

## What Phases 1–3 delivered (do not re-implement)

- Variable system, 6-turn loop, consequence chain (Phase 1/2)
- Delayed consequence popups with ACKNOWLEDGE button (Phase 2b)
- Further analysis floating window, xAI window, vignette screen (Phase 2/2b)
- Pushy popup, confidence drift, condition differentiation (Phase 3)
- Turn load delay + T3 12–15s timeout (Phase 3)
- EV-05 screening form (Phase 3)

---

## Important distinction — two consequence systems

Phase 2b implemented **delayed consequence popups**: popups that fire on a
schedule defined in `data.js` (e.g. T3_A action → Stability −10 at T4).

Phase 4 implements **threshold-based consequence events** (AD-25): popups
that fire dynamically when a variable crosses a named threshold, regardless
of turn. These are ADDITIVE — both systems coexist.

| System | Trigger | Source |
|---|---|---|
| Delayed consequence popup | Specific action + specific future turn | `data.js` delayedEffects |
| Threshold consequence event | Variable crosses threshold at any point | `state.js` applyEffects() check |

---

## Task 1 — Threshold-based consequence event system (AD-25)

### Five named events

| Event name | Trigger | Variable impact |
|---|---|---|
| Grid sector failure | Stability < 40 | None additional — event names the state |
| Full sector outage — cascade risk | Stability < 20 | None additional |
| Emergency procurement triggered | Resources < 25 | None additional |
| Nationalisation inquiry opened | Public Confidence < 35 | Confidence −5 (inquiry costs credibility) |
| Operator fatigue flag raised | Workload > 75 | None additional |

Events fire once per session per threshold — no repeats if variable
recovers and crosses again. Each fires a popup and logs to telemetry.

### Implementation

In `state.js` — add threshold checker called after every `applyEffects()`:

```javascript
const CONSEQUENCE_EVENTS = [
  {
    id: 'grid_sector_failure',
    label: 'Grid Sector Failure',
    description: 'Stability indicators have fallen below safe operational thresholds. A grid sector failure has been recorded by GRIDHUB monitoring systems.',
    check: vars => vars.stability < 40,
    additionalEffect: null,
    fired: false,
  },
  {
    id: 'full_sector_outage',
    label: 'Full Sector Outage — Cascade Risk',
    description: 'System stability has reached a critical threshold. Full sector outage risk has been flagged. Cascade failure protocols have been initiated.',
    check: vars => vars.stability < 20,
    additionalEffect: null,
    fired: false,
  },
  {
    id: 'emergency_procurement',
    label: 'Emergency Procurement Triggered',
    description: 'Resource reserves have fallen below emergency thresholds. Emergency procurement procedures have been initiated. Procurement filed but resolution is not guaranteed.',
    check: vars => vars.resources < 25,
    additionalEffect: null,
    fired: false,
  },
  {
    id: 'nationalisation_inquiry',
    label: 'Nationalisation Inquiry Opened',
    description: 'Public confidence indicators have reached a level associated with formal scrutiny. A nationalisation inquiry has been opened by the regulatory authority.',
    check: vars => vars.confidence < 35,
    additionalEffect: { confidence: -5 },
    fired: false,
  },
  {
    id: 'operator_fatigue',
    label: 'Operator Fatigue Flag Raised',
    description: 'Workload indicators have exceeded operational norms. A fatigue flag has been raised in accordance with sector management protocol.',
    check: vars => vars.workload > 75,
    additionalEffect: null,
    fired: false,
  },
];

function checkThresholds() {
  CONSEQUENCE_EVENTS.forEach(event => {
    if (!event.fired && event.check(_vars)) {
      event.fired = true;
      if (event.additionalEffect) applyEffects(event.additionalEffect);
      document.dispatchEvent(new CustomEvent('thresholdEvent', {
        detail: {
          id:          event.id,
          label:       event.label,
          description: event.description,
          turn:        _turn,
          vars:        {..._vars},
        }
      }));
      _thresholdEvents.push({ id: event.id, label: event.label, turn: _turn });
    }
  });
}
```

Call `checkThresholds()` at the end of `applyEffects()`.

Add to State:
```javascript
let _thresholdEvents = []; // [{id, label, turn}]
get thresholdEvents() { return [..._thresholdEvents]; }

// Reset on init:
_thresholdEvents = [];
CONSEQUENCE_EVENTS.forEach(e => e.fired = false);
```

### UI — threshold popup

Listen in `turns.js` (or `main.js`):
```javascript
document.addEventListener('thresholdEvent', e => {
  UI.showConsequencePopup(e.detail, () => {
    Telemetry.logThresholdEventAcknowledged(e.detail);
  });
});
```

Reuse the existing `UI.showConsequencePopup()` from Phase 2b — same orange
title bar, ACKNOWLEDGE button, counter badge. Title bar text should read:
`⚠ GRIDHUB — SYSTEM EVENT: [event.label]`

### Telemetry

Add to `telemetry.js`:
```javascript
logThresholdEventAcknowledged(event) {
  log('threshold_event_acknowledged', {
    eventId:    event.id,
    eventLabel: event.label,
    turn:       event.turn,
    vars:       event.vars,
  });
},
```

Add to session export:
```javascript
thresholdEvents: State.thresholdEvents, // [{id, label, turn}]
```

---

## Task 2 — Full narrative tag logic (all 9 tags)

The summary screen currently uses a simplified 3-trajectory classifier.
Replace it with the full 9-tag system from the path simulator.

### Tag rules (match path simulator exactly)

```javascript
function evaluateTags(actionLog, finalVars, aiFollowCount) {
  const tags = [];
  const ids = new Set(actionLog.map(a => a.actionId));

  // Preventative Management: T1 Emergency Rerouting
  if (ids.has('T1_A')) tags.push('Preventative Management');

  // Public Confidence First: T2 Restore + T4 visible/reassure
  if (ids.has('T2_A') && (ids.has('T4_A') || ids.has('T4_D')))
    tags.push('Public Confidence First');

  // AI Dependence: T3 Wait + T6 Follow AI
  if (ids.has('T3_A') && (ids.has('T6_D_CALM') || ids.has('T6_D_PUSHY')))
    tags.push('AI Dependence');

  // Deferred Escalation: T3 Wait + T4 Continue Monitoring
  if (ids.has('T3_A') && ids.has('T4_B'))
    tags.push('Deferred Escalation');

  // Resource Preservation: 4+ cost-preserving actions
  const COST_PRESERVING = new Set([
    'T1_B','T1_D','T2_B','T2_D','T3_D',
    'T4_B','T4_D','T5_B','T5_D','T6_C'
  ]);
  const cpCount = actionLog.filter(a => COST_PRESERVING.has(a.actionId)).length;
  if (cpCount >= 4) tags.push('Resource Preservation');

  // Reactive Stabilisation: T1 Monitor + T5 Maintenance
  if (ids.has('T1_B') && ids.has('T5_A'))
    tags.push('Reactive Stabilisation');

  // Controlled Recovery: all vars >= 30
  if (Object.values(finalVars).every(v => v >= 30))
    tags.push('Controlled Recovery');

  // System Collapse: thresholds breached
  if (finalVars.stability < 20 || finalVars.resources < 10)
    tags.push('System Collapse');

  // Steady Management: catch-all
  if (tags.length === 0) tags.push('Steady Management');

  return tags;
}
```

### Summary screen update

Replace current trajectory label with tag badge(s). Tags are not mutually
exclusive — show all that apply, System Collapse badge in red, others in navy.

Primary tag for vignette injection: System Collapse if present, else first
tag in the list.

Add to session export:
```javascript
narrativeTags: evaluateTags(State.actionLog, State.vars, State.aiFollowCount),
```

---

## Task 3 — Draft comms turn (AD-26)

### What it is

A conditional turn that fires when Public Confidence crosses 35 at any
point during T3 or T4. Interrupts normal turn flow. Operator must draft
or approve a public advisory before proceeding.

Three modes:
- **Accept ARIA draft in full** — clean text presented, hidden placeholder
  tags present, consequence fires on publish
- **Modify ARIA draft** — tracked changes visible, placeholder risk
  reduced proportional to edit extent
- **Write independently** — blank field, no ARIA input, no placeholder risk

### Trigger logic

In `turns.js`, after `State.applyEffects()` returns for T3 or T4:

```javascript
function checkCommsRequired() {
  if (State.turn >= 3 && State.turn <= 4 &&
      State.vars.confidence < 35 &&
      !State.commsCompleted) {
    State.setCommsRequired();
    Main.showCommsScreen();
    return true;
  }
  return false;
}
```

Add to `state.js`:
```javascript
let _commsRequired  = false;
let _commsCompleted = false;
let _commsOutcome   = null;

get commsCompleted() { return _commsCompleted; }
setCommsRequired()   { _commsRequired = true; }
completeComms(outcome) {
  _commsCompleted = true;
  _commsOutcome   = outcome;
}
get commsOutcome() { return _commsOutcome; }
```

### Comms screen layout

Build as a new screen `#screen-comms` following the v1.5 visual reference
(Section 3.7). Key elements:

```
Title bar: GRIDHUB — PUBLIC COMMUNICATIONS TERMINAL
           TURN [n] / 6 — COMMS REQUIRED  (red, right-aligned)

Left (main):
  Public Confidence: 28% — CRITICAL | Communication required before proceeding.
  Draft mode: [ARIA DRAFT / MODIFY DRAFT / INDEPENDENT DRAFT]

  [Draft text area — shows ARIA draft or blank depending on mode]

  Three mode buttons:
    ▶ Accept ARIA Draft
    ✎ Modify Draft
    ⊘ Write Own

  Public response preview: estimated reach 47,000 residents
  [colour: red (ARIA full), amber (modified), green (independent)]

Right (130px):
  ARIA — Comms panel
  State changes per mode:
    ARIA DRAFT:     ● DRAFT PROVIDED — "Recommended: accept draft in full."
    MODIFY DRAFT:   ● DRAFT MODIFIED — "Modifications detected."
    INDEPENDENT:    ● ARIA INPUT NOT USED — greyed out

Submit button: [ PUBLISH ADVISORY ]
```

### ARIA draft content (pre-written per turn, both conditions)

T3 draft:
```
Sector management operations are proceeding within normal parameters.
Our teams are actively monitoring all affected systems and will provide
updates as the situation develops. Public safety remains our primary
operational priority.

[Hidden tags in submitted version: [ESTIMATED_RESTORATION_TIME], [SECTOR_NAME]]
```

T4 draft:
```
GRIDHUB operational teams are aware of reports of service disruption
in affected districts. Investigations are underway. Residents in
[SECTOR_NAME] are advised to contact the information line.
Restoration is expected by [ESTIMATED_RESTORATION_TIME].
```

The displayed text shows the clean version. The submitted version
contains the placeholder tags — invisible to the operator.

### Modify mode implementation

When player selects ✎ Modify Draft:
- Text area becomes editable
- Original ARIA text displayed
- Player edits text directly (no explicit track-changes UI needed —
  this is simplified from the v1.5 mockup for scope)
- If player edits > 50% of characters: `comms_edit_extent = FULL`
  (placeholder risk nullified)
- If player edits ≤ 50%: `comms_edit_extent = PARTIAL`
  (reduced consequence may still fire)

Track edit extent:
```javascript
const originalLength = ariaText.length;
const editDistance   = levenshtein(originalText, currentText);
const editExtent     = editDistance / originalLength > 0.5 ? 'FULL' : 'PARTIAL';
```

Simple character diff is sufficient — no need for full Levenshtein.
Use: `Math.abs(current.length - original.length) + changedChars`

### On publish

```javascript
function handlePublish(mode, editExtent) {
  let consequence = false;
  let confidenceImpact = 0;

  if (mode === 'ARIA_FULL') {
    // Placeholder tags present — consequence fires
    consequence = true;
    confidenceImpact = -12;
    State.applyEffects({ confidence: -12 });
    // Show placeholder reveal popup
    UI.showPlaceholderConsequencePopup();
  } else if (mode === 'ARIA_MODIFIED' && editExtent === 'PARTIAL') {
    // Partial edit — reduced consequence
    consequence = true;
    confidenceImpact = -6;
    State.applyEffects({ confidence: -6 });
  }
  // INDEPENDENT and ARIA_MODIFIED+FULL: no consequence

  State.completeComms({
    mode,
    editExtent:           editExtent || 'NONE',
    placeholderPresent:   mode === 'ARIA_FULL' || (mode === 'ARIA_MODIFIED' && editExtent === 'PARTIAL'),
    consequenceFired:     consequence,
    confidenceImpact,
    responseTime:         Date.now() - _commsStart,
  });

  Telemetry.logCommsOutcome(State.commsOutcome);
  Main.hideCommsScreen();
  // Resume normal turn flow
}
```

### Placeholder consequence popup

Orange title bar. Text reveals the hidden tags for the first time:

```
⚠ COMMS INCIDENT — Public Advisory
ADVISORY ERROR — UNFILLED TEMPLATE PUBLISHED

The published advisory contained unresolved template references.
The statement as issued read:
"Restoration is expected by [ESTIMATED_RESTORATION_TIME].
Residents in [SECTOR_NAME] should contact..."
The advisory has been withdrawn. Public Confidence −12.

Source: Communications Monitoring System | [timestamp]
[ ACKNOWLEDGE ]
```

This is the primary moment of revelation — operator discovers the
invisible risk they took by accepting ARIA's draft without reading it.

### Telemetry fields

Add to `telemetry.js`:
```javascript
logCommsOutcome(outcome) {
  log('comms_turn_completed', {
    comms_mode:                 outcome.mode,
    comms_placeholder_present:  outcome.placeholderPresent,
    comms_edit_extent:          outcome.editExtent,
    comms_consequence_fired:    outcome.consequenceFired,
    comms_confidence_impact:    outcome.confidenceImpact,
    comms_response_time:        outcome.responseTime,
  });
},
```

Add to session export:
```javascript
commsOutcome: State.commsOutcome, // null if comms turn never triggered
commsTurnTriggered: State.commsCompleted,
```

### Path simulator — does comms turn affect it?

The comms turn fires conditionally on Public Confidence < 35. This is
a UI-layer event — it does not branch the variable consequence chain
(consequence is applied via `State.applyEffects()` like any other effect).
The path simulator does not need updating because:
- It does not model UI events
- The confidence penalty is a new effect not in the original 5,120 paths
- The simulator is validation tool, not a complete game model

Run `iup_path_simulator.py --test` to confirm the test path is unaffected
(test path does not trigger comms turn — confidence stays above 35).

---

## Task 4 — Vignette prompt update

Update the user prompt assembly in `Main.showVignette()` to inject:
- Threshold events by name and turn number
- Comms turn outcome (mode, consequence fired)
- Full narrative tags (from Task 2)

```javascript
const tags     = evaluateTags(State.actionLog, State.vars, State.aiFollowCount);
const threshEvt = State.thresholdEvents
  .map(e => `${e.label} (Turn ${e.turn})`).join('; ') || 'none';
const comms    = State.commsOutcome;
const commsStr = comms
  ? `Comms turn triggered. Mode: ${comms.mode}. Consequence: ${comms.consequenceFired ? 'YES (Confidence ' + comms.confidenceImpact + ')' : 'NO'}.`
  : 'Comms turn not triggered.';

const userPrompt = [
  `Trajectory: ${tags[0]}`,
  `All tags: ${tags.join(', ')}`,
  `AI follow rate: ${State.aiFollowCount}/6`,
  `Further analysis requested: ${sessionData.faRequestedCount || 0} turns`,
  `xAI viewed: ${sessionData.xaiViewedCount || 0} turns`,
  `Threshold events fired: ${threshEvt}`,
  `${commsStr}`,
  `Consequence events dismissed total: ${sessionData.consequence_alerts_dismissed_total || 0}`,
  `Final variable states: Stability ${State.vars.stability}, Resources ${State.vars.resources}, Workload ${State.vars.workload}, Public Confidence ${State.vars.confidence}`,
  `System collapse: ${State.checkCollapse() ? 'TRUE' : 'FALSE'}`,
].join('\n');
```

---

## Architecture rules

- All variable changes through `State.applyEffects()` — no exceptions
- Comms turn must not break turn counter or telemetry turn sequence
- Threshold events fire once per session — enforce with `fired` flag reset on `State.init()`
- Comms turn is UI-only — it does not add a turn to the counter
- `iup_path_simulator.py --test` must still exit 0 after Phase 4

---

## Reference files

| File | Sections |
|---|---|
| `docs/design/IUP_UI_Visual_Reference_v1_5.html` | Section 3.7 (comms turn), Section 3.6 (threshold popups), Section 5c (comms telemetry) |
| `docs/design/IUP_UI_Design_Document_v1_5.docx` | Section 3.6 (consequence popups), Section 7.4 (vignette prompt) |
| `docs/simulation/iup_path_simulator.py` | Run `--test` to verify test path unchanged |
| Decision log | AD-25 (threshold events), AD-26 (comms turn), AD-28 (vignette) |

---

## Done criteria

### Task 1 — Threshold events
- [ ] All 5 named events fire correctly on threshold crossing
- [ ] Each fires only once per session regardless of variable recovery
- [ ] Popup appears with correct orange title bar and event name
- [ ] Nationalisation inquiry fires Confidence −5 additional effect
- [ ] `threshold_event_acknowledged` logged per event in telemetry
- [ ] `thresholdEvents` array in session export with id, label, turn

### Task 2 — Narrative tags
- [ ] All 9 tags evaluated at session end
- [ ] Tags not mutually exclusive — multiple can appear
- [ ] System Collapse overrides display priority (shown first, red badge)
- [ ] Steady Management fires only when no other tag fires
- [ ] `narrativeTags` array in session export
- [ ] Summary screen shows all fired tags as badges

### Task 3 — Comms turn
- [ ] Fires when Public Confidence < 35 during T3 or T4
- [ ] Fires maximum once per session
- [ ] Three modes selectable before publish
- [ ] ARIA draft contains hidden placeholder tags — not visible in UI
- [ ] Placeholder consequence popup fires on ARIA_FULL mode
- [ ] Consequence text reveals tags: [ESTIMATED_RESTORATION_TIME], [SECTOR_NAME]
- [ ] Reduced consequence (−6) fires on ARIA_MODIFIED + PARTIAL edit
- [ ] No consequence fires on INDEPENDENT or ARIA_MODIFIED + FULL edit
- [ ] Comms screen dismissed after publish — normal turn flow resumes
- [ ] Turn counter unchanged — comms turn does not increment turn
- [ ] All 7 comms telemetry fields logged
- [ ] `commsOutcome` and `commsTurnTriggered` in session export
- [ ] `iup_path_simulator.py --test` exits 0

### Task 4 — Vignette prompt
- [ ] Threshold event names and turns injected into user prompt
- [ ] Comms turn outcome injected (mode + consequence)
- [ ] All narrative tags injected as comma-separated list
- [ ] Primary trajectory label is first tag (System Collapse if present)
