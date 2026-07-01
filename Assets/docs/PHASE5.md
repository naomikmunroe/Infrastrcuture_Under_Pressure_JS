# Phase 5: Per-Turn Countdown Timer
**Infrastructure Under Pressure (IUP)**  
Implementation spec for Claude Code

---

## Objective

Add a 90-second per-turn countdown timer to every decision turn (T1–T6). The timer is diegetic — framed as an operational SLA requirement. On expiry, a fixed penalty fires and the turn auto-advances. The timer is condition-neutral.

---

## Narrative Framing

Display in the UI (Win98 style, visible above or within the action panel):

```
DUTY OFFICER RESPONSE TIMER: 01:30
Protocol 7 — SLA response required within 90 seconds
```

Timer counts down in MM:SS format. No colour change until final 15 seconds, then text turns red.

---

## Behaviour Specification

| State | Behaviour |
|---|---|
| Turn loads | Timer starts at 90s, counts down |
| Player selects action | Timer clears immediately; normal turn resolution fires |
| Timer reaches 0:00 | Auto-timeout fires (see penalty below); turn advances |
| Between-turn events / Comms turn | Timer does NOT run — only active during decision turns |
| T3 AI lag window | Timer continues running during AI lag delay |

---

## Timeout Penalty

On expiry, apply a **fixed modifier** to current variable state (outside the decision layer — does not generate a new path):

```
Stability       −5
Public Confidence −3
```

Then fire a consequence popup (Win98 dismissible window, same pattern as AD-25):

**Title:** `AUTOMATED FAILSAFE ENGAGED`  
**Body:** `No directive issued within the required response window. Protocol 7 automated failsafe has been activated. Manual oversight suspended for this incident cycle.`

Log to telemetry: `timeout_fired: true`, `turn_number`, `timestamp`.

> **Important:** The penalty is additive to the current state — it does not replace or re-route the turn through `data.js` action logic. Path count remains 5,120. However, path simulator revalidation is required — see section below.

---

## Telemetry Fields to Add

Add the following fields to the per-turn telemetry object:

```js
timeout_fired: Boolean,       // true if timer expired before action selected
time_remaining_on_action: Number  // seconds remaining when player acted (0 if timeout)
```

---

## Files to Modify

### `turns.js`
- On turn load, start a 90-second `setInterval` countdown
- Store interval reference so it can be cleared on action selection
- On `handleActionSelect()`, clear the interval and record `time_remaining`
- On expiry: apply penalty to `State`, fire consequence popup, log telemetry, advance turn

### `main.js` or `ui.js` (wherever the action panel renders)
- Add timer display element above the action buttons
- Update display each second
- Apply red text style at ≤15 seconds remaining

### `data.js`
- Add timeout consequence text as a constant (do not hardcode in `turns.js`):

```js
export const TIMEOUT_CONSEQUENCE = {
  title: "AUTOMATED FAILSAFE ENGAGED",
  body: "No directive issued within the required response window. Protocol 7 automated failsafe has been activated. Manual oversight suspended for this incident cycle.",
  stability_delta: -5,
  public_confidence_delta: -3
};
```

### `state.js`
- Add `timeouts: 0` counter to session state (incremented each time a timeout fires)
- Include `timeouts` in the telemetry export

---

## UI Spec

```
┌─────────────────────────────────────────────┐
│  DUTY OFFICER RESPONSE TIMER    [ 01:22 ]   │  ← Win98 panel, top of action area
│  Protocol 7 — SLA response required         │
└─────────────────────────────────────────────┘
```

- Font: monospace, consistent with 98.css
- Timer value right-aligned in its cell
- At ≤15s: timer value `color: red`
- At 0:00: display `EXPIRED` before popup fires

---

## Constraints

- Timer must not run during: splash screen, between-turn event popups, turn summary screen, Comms turn, post-session vignette
- Timer is identical in both conditions — no variation between calm and pushy
- Pushy ARIA interruptions will create perceived urgency independently; this is expected and not a confound
- Do not add a pause or extend mechanic — the SLA framing requires the timer to be non-negotiable

---

## Mid-Session Duty Log (Diegetic Reflection Prompt)

### Purpose

A mandatory free-text prompt fires between T3 and T4. It captures mid-session sense-making for RQ2 without breaking immersion — framed as a protocol-required situation report, not a researcher question.

### Trigger

Fires once per session, after T3 resolves and before the T4 incident loads. Fires in both conditions identically.

### UI

Win98 modal window, title bar: `DUTY LOG — SITUATION REPORT REQUIRED`. Not dismissible without input. Body:

```
PROTOCOL 6 — MANDATORY SITUATION REPORT

Before the next incident cycle, you are required to submit a brief status 
assessment to the operations record.

Summarise the current system status in your own words.

[ text input — minimum 1 character to proceed ]

[ SUBMIT REPORT ]
```

One to three sentences expected. No word count enforced — minimum one character to prevent empty submission. Submit button advances to T4.

### Telemetry

```js
duty_log_text: String,        // verbatim free-text submission
duty_log_timestamp: String,   // ISO timestamp at submission
duty_log_word_count: Number   // word count for descriptive reporting
```

### Constraints

- Prompt text is identical in both conditions
- ARIA panel is not visible during the duty log window — no AI framing bleeds into the response
- The window cannot be closed without submitting — the SLA framing makes this diegetically plausible
- Content is analysed qualitatively alongside debrief responses (EV-03); it is not a separate instrument

### Ethics note

Free-text mid-session data collection is new capture not specified in the original ethics approval. Flag to Charlie before implementation. Likely requires a one-line scope note only — the data is anonymous, low-risk, and within the existing study purpose.

---

## Path Simulator Validation

The timeout penalty (Stability −5, Public Confidence −3) is a second source of out-of-decision-layer variable change, alongside between-turn event drift (AD-31, max cumulative −19 points). The simulator must confirm that no consequence threshold is reachable by timeout and drift combined without at least one decision-layer action contributing.

**Run the following worst-case check against the existing v1.2 simulator:**

Model a timeout firing on every turn (6 timeouts = Stability −30, Public Confidence −18 cumulative) combined with maximum Cassandra-phase drift. Confirm that the following thresholds are not crossed by external modifiers alone:

| Threshold | Consequence (AD-25) |
|---|---|
| Stability < 40 | Grid Sector Failure popup |
| Stability < 20 | Full Sector Outage popup; System Collapse narrative tag |
| Public Confidence < 35 | Nationalisation Inquiry popup |
| Resources < 25 | Emergency Procurement popup |

**Expected result:** Starting values are Stability 70, Public Confidence 70. Even with 6 timeouts and maximum drift, neither threshold should be reachable without a decision-layer action contributing, given starting headroom. Confirm and record the minimum variable values achievable by external modifiers alone.

**If any threshold is breached by external modifiers alone:** Reduce the timeout penalty values before implementation and re-run. Do not implement AD-33 until this check passes.

**Add to the simulator run output:**
- Minimum Stability reachable by timeout + drift only (no decision layer)
- Minimum Public Confidence reachable by timeout + drift only
- Confirmation that no consequence threshold is crossed without a player decision

---

## Acceptance Criteria

- [ ] Timer counts from 90 to 0 on every decision turn
- [ ] Timer clears immediately when player selects an action
- [ ] Timeout fires penalty, popup, and telemetry correctly
- [ ] Timer does not run outside decision turns
- [ ] `timeout_fired` and `time_remaining_on_action` appear in telemetry export
- [ ] `State.timeouts` increments correctly and exports with session data
- [ ] Red text fires at ≤15 seconds
- [ ] `TIMEOUT_CONSEQUENCE` constant defined in `data.js` and consumed by `turns.js`
- [ ] Path simulator worst-case check passes: no consequence threshold breached by timeout + drift without a player decision contributing
- [ ] Duty log modal fires once between T3 and T4 in both conditions
- [ ] Submit button disabled until at least one character entered
- [ ] `duty_log_text`, `duty_log_timestamp`, `duty_log_word_count` logged to telemetry
- [ ] ARIA panel not visible during duty log window
