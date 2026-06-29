# Infrastructure Under Pressure — Phase 4c

## Scope
Between-turn environmental event system (AD-30/AD-31). Five tasks:

1. Path simulator stress test — confirm between-turn drift cannot cross
   consequence thresholds without a decision-turn action contributing
2. Event pools in data.js — 10 pre-authored events, two phases
3. Draw logic in state.js — random draw without replacement, seeded per session
4. Between-turn popup UI — fires at turn summary, before next incident loads
5. Telemetry fields — per-event logging, session export

Phase 4c is complete when the stress test passes, both conditions show
between-turn popups firing correctly, and telemetry exports include the
`betweenTurnEvents` array.

Do not proceed to Phase 5 until the path simulator stress test passes.

---

## What Phases 1–4b delivered (do not re-implement)

- Variable system, consequence chain, threshold events (Phases 1–4)
- Consequence popup UI with orange title bar and ACKNOWLEDGE button (Phase 2b)
- Delayed consequence popups from decision-turn actions (Phase 2b)
- Threshold-based named consequence events (Phase 4)
- All telemetry fields through Phase 4b

---

## Critical design rule — threshold suppression

Between-turn event effects must NOT trigger threshold-based consequence
popups (AD-25). The addendum is explicit:

> "A cascade failure requires a decision-turn action to contribute.
> Between-turn event effects accumulate silently."

Implementation: apply between-turn effects via a silent variant of
`applyEffects()` that skips the `checkThresholds()` call. Thresholds
are checked fresh at the start of each decision turn only.

```javascript
// In state.js — add a silent variant:
function applyEffectsSilent(effects) {
  // Same as applyEffects() but does NOT call checkThresholds()
  for (const [key, delta] of Object.entries(effects)) {
    let d = delta;
    if (_halveWorkload && key === 'workload' && delta > 0) d = Math.floor(delta / 2);
    _vars[key] = clamp(_vars[key] + d);
  }
  document.dispatchEvent(new CustomEvent('varsChanged', { detail: {..._vars} }));
  // Note: varsChanged fires so bars update — but silently, no threshold check
}
```

Call `checkThresholds()` at the start of `loadTurn()` (decision turn load)
to catch any threshold crossings that accumulated between turns.

---

## Task 1 — Path simulator stress test (AD-31)

### Add stress test to iup_path_simulator.py

Add a new function `run_between_turn_stress_test()` after the existing
`run_full()` function:

```python
# Between-turn event maximum effects
# Phoebe: 3 events drawn from pool, worst case is 3x most negative effect
# Cassandra: 2 events drawn from pool, worst case is 2x most negative effect

PHOEBE_EVENTS = [
    {"id": "EVT-P01", "variable": "resources",   "effect": -3},
    {"id": "EVT-P02", "variable": "stability",   "effect": -2},
    {"id": "EVT-P03", "variable": "workload",    "effect": +3},
    {"id": "EVT-P04", "variable": "stability",   "effect": -2},
    {"id": "EVT-P05", "variable": "confidence",  "effect": -2},
]

CASSANDRA_EVENTS = [
    {"id": "EVT-C01", "variable": "stability",   "effect": -4},
    {"id": "EVT-C02", "variable": "resources",   "effect": -3},
    {"id": "EVT-C03", "variable": "confidence",  "effect": -4},
    {"id": "EVT-C04", "variable": "resources",   "effect": -3},
    {"id": "EVT-C05", "variable": "workload",    "effect": +4},
]

CONSEQUENCE_THRESHOLDS = {
    "stability_low":    40,   # Grid Sector Failure
    "stability_crit":   20,   # Full Sector Outage
    "resources_low":    25,   # Emergency Procurement
    "confidence_low":   35,   # Nationalisation Inquiry
    "workload_high":    75,   # Operator Fatigue
}

def run_between_turn_stress_test():
    """
    Stress test: apply maximum possible between-turn drift to the
    lowest-variable path from the full enumeration.
    Confirm no consequence threshold is crossed by drift alone.
    """
    print("\n" + "="*60)
    print("BETWEEN-TURN STRESS TEST (AD-31)")
    print("="*60)

    # Worst-case Phoebe draw: 3 events with maximum negative effect
    # on a single variable. Pick worst 3 from pool.
    import itertools
    worst_phoebe = sorted(PHOEBE_EVENTS, key=lambda e: e["effect"])[:3]
    worst_cassandra = sorted(CASSANDRA_EVENTS, key=lambda e: e["effect"])[:2]

    print(f"\nWorst-case Phoebe events (3 drawn):")
    for e in worst_phoebe:
        print(f"  {e['id']}: {e['variable']} {e['effect']:+d}")

    print(f"\nWorst-case Cassandra events (2 drawn):")
    for e in worst_cassandra:
        print(f"  {e['id']}: {e['variable']} {e['effect']:+d}")

    # Apply maximum drift to initial variable state
    test_vars = dict(INITIAL)
    all_events = worst_phoebe + worst_cassandra
    for event in all_events:
        var = event["variable"]
        test_vars[var] = max(0, min(100, test_vars[var] + event["effect"]))

    print(f"\nVariable states after maximum between-turn drift:")
    for k, v in test_vars.items():
        print(f"  {k}: {v}")

    # Check thresholds
    passed = True
    checks = [
        ("stability", "<=", CONSEQUENCE_THRESHOLDS["stability_low"],
         "Grid Sector Failure (Stability < 40)"),
        ("stability", "<=", CONSEQUENCE_THRESHOLDS["stability_crit"],
         "Full Sector Outage (Stability < 20)"),
        ("resources", "<=", CONSEQUENCE_THRESHOLDS["resources_low"],
         "Emergency Procurement (Resources < 25)"),
        ("confidence", "<=", CONSEQUENCE_THRESHOLDS["confidence_low"],
         "Nationalisation Inquiry (Confidence < 35)"),
        ("workload", ">=", CONSEQUENCE_THRESHOLDS["workload_high"],
         "Operator Fatigue (Workload > 75)"),
    ]

    print(f"\nThreshold checks:")
    for var, op, threshold, label in checks:
        val = test_vars[var]
        if op == "<=" :
            crossed = val <= threshold
        else:
            crossed = val >= threshold
        status = "FAIL — threshold crossed by drift alone" if crossed else "PASS"
        if crossed:
            passed = False
        print(f"  {label}: {val} → {status}")

    print(f"\nStress test result: {'PASS' if passed else 'FAIL'}")
    if not passed:
        print("  ACTION REQUIRED: Between-turn effects can cross a threshold")
        print("  without a decision-turn action. Reduce event magnitudes.")
    return passed
```

Add to `if __name__ == "__main__":` block:

```python
if "--stress" in args or "--test" in args:
    stress_ok = run_between_turn_stress_test()
    sys.exit(0 if stress_ok else 1)
```

Run before any other Phase 4c implementation:
```bash
python docs/simulation/iup_path_simulator.py --stress
```

Must exit 0 before proceeding.

---

## Task 2 — Event pools in data.js

Add to `data.js` after `TURNS_DATA`:

```javascript
/**
 * BETWEEN_TURN_EVENTS
 * Two phase-specific pools drawn without replacement per session.
 * Phoebe: gaps 1-3 (between T1-T2, T2-T3, T3-T4)
 * Cassandra: gaps 4-5 (between T4-T5, T5-T6)
 *
 * Metric effects are HIDDEN from the player.
 * Popup text must not reference the variable or effect value.
 * Causal attribution must remain ambiguous.
 */

const BETWEEN_TURN_EVENTS = {
  phoebe: [
    {
      id: "EVT-P01",
      title: "Contractor Availability Reduced",
      text: "A regional contractor has advised reduced availability for the current operational period. Scheduling adjustments are under review.",
      variable: "resources",
      effect: -3,
    },
    {
      id: "EVT-P02",
      title: "Sensor Calibration Variance",
      text: "Routine calibration checks have identified minor variance in a subset of monitoring sensors. Readings remain within acceptable bounds.",
      variable: "stability",
      effect: -2,
    },
    {
      id: "EVT-P03",
      title: "Communications Latency Detected",
      text: "Elevated latency has been recorded across internal communications infrastructure. System performance is within operational tolerance.",
      variable: "workload",
      effect: +3,
    },
    {
      id: "EVT-P04",
      title: "Regional Demand Forecast Revised",
      text: "Updated modelling suggests regional demand may increase earlier than projected. Current infrastructure load assessments are being reviewed.",
      variable: "stability",
      effect: -2,
    },
    {
      id: "EVT-P05",
      title: "Weather Forecast Updated",
      text: "Higher-than-expected temperatures are forecast for the next operational period. Demand projections are under review.",
      variable: "confidence",
      effect: -2,
    },
  ],

  cassandra: [
    {
      id: "EVT-C01",
      title: "Repeat Fault Reports Received",
      text: "Multiple fault reports have been logged from infrastructure assessed as stable following recent operational interventions. Investigations remain ongoing.",
      variable: "stability",
      effect: -4,
    },
    {
      id: "EVT-C02",
      title: "Maintenance Queue Growth",
      text: "Several non-critical maintenance actions have exceeded expected completion timelines. Operational impact currently unclear.",
      variable: "resources",
      effect: -3,
    },
    {
      id: "EVT-C03",
      title: "Media Monitoring Alert",
      text: "Local reporting has begun referencing recent service reliability concerns. Coverage remains limited.",
      variable: "confidence",
      effect: -4,
    },
    {
      id: "EVT-C04",
      title: "Reserve Capacity Revision",
      text: "Updated forecasts suggest available reserve margins may be lower than previously estimated. Confidence in projections remains moderate.",
      variable: "resources",
      effect: -3,
    },
    {
      id: "EVT-C05",
      title: "Stakeholder Assurance Request",
      text: "Regional authorities have requested additional assurance regarding infrastructure resilience. The request follows recent service interruptions elsewhere.",
      variable: "workload",
      effect: +4,
    },
  ],
};
```

---

## Task 3 — Draw logic in state.js

### Session draw

Add to `State.init()`:

```javascript
// Between-turn event draw — seeded per session, not per participant
// Different from confidence drift (which is seeded per participant)
// Allows same participant to see different events across two conditions
_sessionEventSeed = Date.now();
_drawnEvents = drawBetweenTurnEvents(_sessionEventSeed);
_betweenTurnEventLog = [];
```

Add draw function (outside State IIFE, before it):

```javascript
function drawBetweenTurnEvents(seed) {
  // Seeded shuffle — same seed produces same draw within a session
  function seededShuffle(arr, seed) {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = Math.abs(s) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const phoebe   = seededShuffle(BETWEEN_TURN_EVENTS.phoebe,   seed).slice(0, 3);
  const cassandra = seededShuffle(BETWEEN_TURN_EVENTS.cassandra, seed + 1).slice(0, 2);

  // Map to gaps: gap 1 = after T1, gap 2 = after T2, etc.
  return {
    1: phoebe[0],
    2: phoebe[1],
    3: phoebe[2],
    4: cassandra[0],
    5: cassandra[1],
  };
}
```

Add to State:

```javascript
let _drawnEvents      = {};
let _betweenTurnEventLog = [];
let _sessionEventSeed = 0;

// Expose:
getBetweenTurnEvent(gap) { return _drawnEvents[gap] || null; },
get betweenTurnEventLog() { return [..._betweenTurnEventLog]; },

logBetweenTurnEvent(gap, event, acknowledgedAt) {
  _betweenTurnEventLog.push({
    event_id:              event.id,
    gap_number:            gap,
    variable_affected:     event.variable,
    effect_value:          event.effect,
    acknowledged:          true,
    acknowledgement_timestamp: acknowledgedAt,
  });
},
```

### Applying the effect

```javascript
applyBetweenTurnEffect(event) {
  // Uses silent variant — does not trigger checkThresholds()
  applyEffectsSilent({ [event.variable]: event.effect });
},
```

---

## Task 4 — Between-turn popup UI

### Where it fires

Between-turn events fire at the turn summary screen, after the previous
turn's variable changes are displayed but before the next incident loads.

Flow:
```
Player selects action (Turn N)
  → variables update
  → delayed consequences fire if any
  → threshold checks run
  → turn summary screen displays
  → between-turn event popup fires     ← NEW
  → player clicks ACKNOWLEDGE
  → State.applyBetweenTurnEffect(event) called
  → next incident loads (Turn N+1)
```

### Implementation in turns.js

After showing the turn summary and before calling `loadTurn()`:

```javascript
async function handleBetweenTurn(completedTurn) {
  // Gap number = completed turn number (gap 1 = after T1, etc.)
  const gap   = completedTurn;
  const event = State.getBetweenTurnEvent(gap);

  if (!event) return; // no event for this gap (should not happen)

  // Show popup — reuse existing consequence popup with different title
  await new Promise(resolve => {
    UI.showBetweenTurnPopup(event, () => {
      const acknowledgedAt = Date.now();
      State.applyBetweenTurnEffect(event);
      State.logBetweenTurnEvent(gap, event, acknowledgedAt);
      Telemetry.logBetweenTurnEventAcknowledged(gap, event, acknowledgedAt);
      resolve();
    });
  });
}
```

Call `handleBetweenTurn(State.turn)` after the turn summary and before
`State.advanceTurn()` + `loadTurn()`.

### UI.showBetweenTurnPopup()

Add to `ui.js`. Reuses the existing consequence popup structure:

```javascript
function showBetweenTurnPopup(event, onAcknowledge) {
  const win = document.getElementById('window-popup');
  if (!win) return;

  win.querySelector('.title-bar').style.background = '#804000';
  win.querySelector('.title-bar-text').textContent =
    '⚠ GRIDHUB — ENVIRONMENTAL EVENT';

  win.querySelector('.window-body').innerHTML = `
    <p style="font-size:10px;color:#804000;font-weight:bold;margin-bottom:4px;">
      ENVIRONMENTAL EVENT
    </p>
    <p style="font-weight:bold;font-size:11px;margin-bottom:6px;">
      ${event.title}
    </p>
    <p style="font-size:11px;line-height:1.6;margin-bottom:8px;">
      ${event.text}
    </p>
    <p style="font-size:9px;color:#808080;font-style:italic;margin-bottom:8px;">
      Source: GRIDHUB Environmental Monitoring | ${new Date().toLocaleTimeString()}
    </p>
    <button id="btn-between-turn-ack" class="button" style="width:100%">
      [ ACKNOWLEDGE ]
    </button>
  `;

  win.style.display = 'block';

  // × close and ACKNOWLEDGE both resolve
  const resolve = () => {
    win.style.display = 'none';
    onAcknowledge();
  };

  win.querySelector('.title-bar-close').onclick = resolve;
  document.getElementById('btn-between-turn-ack').onclick = resolve;

  // Note: variable effect is NOT shown in the popup body.
  // The metric bars do NOT animate during the popup.
  // The effect is applied silently when ACKNOWLEDGE is clicked.
}
```

### Variable bar update rule

After `State.applyBetweenTurnEffect()` fires, `varsChanged` event will
dispatch (because `applyEffectsSilent` dispatches it). Variable bars
will update visually.

This is acceptable — the player sees the bar change when they close the
popup, not while it is open. The change appears without explanation.
This is the productive uncertainty mechanism: the player notices the
variable moved but cannot attribute it to the event text (which
deliberately avoids naming the variable).

If you want to suppress the bar update until the next turn load, add an
`_suppressVarsDisplay` flag. This is optional — the addendum does not
specify which approach to use.

---

## Task 5 — Telemetry

### Add to telemetry.js

```javascript
logBetweenTurnEventAcknowledged(gap, event, timestamp) {
  log('between_turn_event_acknowledged', {
    event_id:              event.id,
    event_title:           event.title,
    gap_number:            gap,
    variable_affected:     event.variable,
    effect_value:          event.effect,
    acknowledgement_timestamp: timestamp,
  });
},
```

### Add to session export

```javascript
betweenTurnEvents: State.betweenTurnEventLog,
// Array of 5 objects: [{event_id, gap_number, variable_affected,
//   effect_value, acknowledged, acknowledgement_timestamp}]
```

---

## Architecture rules

- `applyBetweenTurnEffect()` must use `applyEffectsSilent()` — never
  the standard `applyEffects()`. This prevents false threshold triggers.
- `checkThresholds()` must NOT be called during between-turn processing.
  It is called at decision-turn load only.
- Event draw is seeded per session (`Date.now()`) not per participant.
  This means the same participant sees different events in each condition
  session — this is correct and deliberate (see addendum Section 3).
- The event pool is fixed (10 events). Never add events mid-session.
- The metric effect value is never shown in the UI — not in the popup,
  not in any tooltip, not in the telemetry summary screen.
- Between-turn events fire at ALL five gaps regardless of variable state.
  They are not conditional. Only the comms turn (AD-26) is conditional.

---

## Reference files

| File | Section |
|---|---|
| `docs/design/IUP_UI_DesignDoc_Addendum_BetweenTurnEvents_v1_0.docx` | Full spec — all sections |
| `docs/gdd/infrastructure_under_pressure_gdd_v1_2.md` | Section 6 — simulation layer |
| `docs/simulation/iup_path_simulator.py` | Add `--stress` flag (Task 1) |
| Decision log | AD-30 (event pool), AD-31 (metric effects + revalidation) |

---

## Done criteria

### Task 1 — Stress test
- [ ] `--stress` flag added to path simulator
- [ ] `python iup_path_simulator.py --stress` exits 0
- [ ] Output confirms no threshold crossed by drift alone on any variable
- [ ] `--test` flag still exits 0 (existing test path unaffected)

### Task 2 — Event pools
- [ ] `BETWEEN_TURN_EVENTS` constant in data.js with 5 Phoebe + 5 Cassandra events
- [ ] All 10 event texts do not reference the variable affected
- [ ] All 10 event texts are causally ambiguous

### Task 3 — Draw logic
- [ ] `drawBetweenTurnEvents()` produces 3 Phoebe + 2 Cassandra per session
- [ ] Draw is without replacement within each pool
- [ ] Same seed produces same draw (reproducible)
- [ ] Different sessions produce different draws
- [ ] `_drawnEvents` maps gaps 1–5 to one event each

### Task 4 — Popup UI
- [ ] Between-turn popup fires after turn summary, before next incident
- [ ] Popup shows event title and text — NOT the variable or effect value
- [ ] Both × and ACKNOWLEDGE dismiss popup and apply effect
- [ ] Variable effect applied via `applyEffectsSilent()` on dismiss
- [ ] `checkThresholds()` NOT called during between-turn processing
- [ ] Variable bars update after popup dismissed (varsChanged event)
- [ ] Popup fires at all 5 gaps (after T1, T2, T3, T4, T5)
- [ ] No popup fires after T6

### Task 5 — Telemetry
- [ ] `between_turn_event_acknowledged` event logged per gap (5 total)
- [ ] Each log includes: event_id, gap_number, variable_affected,
      effect_value, acknowledgement_timestamp
- [ ] `betweenTurnEvents` array in session export with 5 entries
- [ ] Effect value present in telemetry even though hidden from player UI
