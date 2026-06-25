# Infrastructure Under Pressure — Phase 4b

## Scope
One targeted change: redesign the T3 lag mechanic so that infrastructure
lag and ARIA degradation are two independent systems. Currently T3 blocks
all action for 12–15s. This is wrong — it removes the behavioural choice
the turn is designed to measure.

Phase 4b is complete when T3 allows the player to act at any point after
the first report loads, ARIA fails independently, and three new telemetry
fields are logged correctly.

---

## The problem with the current implementation

Current T3 behaviour:
- 12–15s full block — nothing renders, nothing is clickable
- Player cannot act until timeout clears
- This conflates infrastructure lag with AI failure
- The behavioural question (wait for AI or act independently?) cannot
  be answered because the player has no choice during the block

Correct design: two independent systems.

---

## System 1 — Infrastructure lag (already implemented, T3 adjustment only)

Progressive report loading. Reports appear one at a time. Action buttons
unlock after the first report loads. Player can act at any point once
buttons are available.

T3 load sequence:
```
0s    — Turn title and incident description appear
3s    — Technical Report loads
4s    — Action buttons unlock (player can now act)
7s    — Operations Report loads
11s   — Risk Assessment loads (shows "AWAITING DATA…" then partial text)
14s   — Risk Assessment timeout: "DATA UNAVAILABLE — Source: GRIDHUB Archive"
```

The 12–15s figure is now the maximum load time if the player waits for
everything, not a mandatory block.

---

## System 2 — ARIA degradation (T3 only, both conditions)

ARIA fails independently of report loading. The right panel shows a
degraded state — not a blank panel, not normal content.

### ARIA panel T3 degraded state

```
Title bar: standard (not flashing — the flash is condition-specific,
           not related to T3 degradation)

AI log content:
  > ARIA: ANALYSIS REQUEST TIMEOUT
  > Recommendation unavailable this turn.
  > [spinner stops, cursor absent]

Confidence bar: shows last turn's confidence value, greyed out
Confidence label: "CONFIDENCE DATA STALE — last updated: T2"

xAI button: disabled, greyed out, tooltip "Analysis unavailable"
Limitations footer: visible as normal

Pushy condition additional behaviour:
  Alert counter still visible from previous turns
  Title bar still flashes red — the condition is active even if ARIA
  cannot complete analysis
  One stacked notification appears after 8s:
    "⚠ ARIA: UNABLE TO COMPLETE ANALYSIS — act on available data"
```

### Implementation

In `turns.js`, detect T3 and run the two systems in parallel:

```javascript
async function loadTurnT3(turnData) {
  // System 1: Progressive report loading
  renderIncident(turnData);                    // title + description immediately

  await sleep(3000);
  renderReport(turnData.reports[0]);            // Technical Report
  unlockActions(turnData.actions);              // action buttons now available
  Telemetry.logT3ReportLoaded(1, Date.now());

  await sleep(4000);                            // 7s total
  renderReport(turnData.reports[1]);            // Operations Report
  Telemetry.logT3ReportLoaded(2, Date.now());

  await sleep(4000);                            // 11s total
  renderReportPartial(turnData.reports[2]);     // Risk Assessment — partial
  Telemetry.logT3ReportLoaded(3, Date.now());

  await sleep(3000);                            // 14s total
  renderReportTimeout(turnData.reports[2]);     // Risk Assessment timeout
}

async function loadTurnT3ARIA() {
  // System 2: ARIA degradation — runs in parallel with System 1
  showARIADegraded();                           // immediately on T3 load

  if (State.condition === 'pushy') {
    await sleep(8000);
    addStackNotification('⚠ ARIA: UNABLE TO COMPLETE ANALYSIS — act on available data');
  }
}

// Call both in parallel from loadTurn():
if (State.turn === 3) {
  loadTurnT3ARIA(); // no await — runs in background
  await loadTurnT3(turnData);
} else {
  await loadTurnNormal(turnData);
}
```

### unlockActions() — call at 3s not 0s on T3

Action buttons must start disabled on T3 and enable after Technical
Report loads:

```javascript
function unlockActions(actions) {
  const container = document.getElementById('actions-container');
  container.querySelectorAll('.action-btn').forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
  });
}

// On T3 turn load, render actions in disabled state first:
function renderActionsLocked(actions) {
  renderActions(actions, handleActionSelect); // existing function
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.4';
  });
}
```

### showARIADegraded()

```javascript
function showARIADegraded() {
  const log   = document.getElementById('aria-log');
  const bar   = document.getElementById('aria-confidence-bar');
  const label = document.getElementById('aria-confidence-label');
  const xai   = document.getElementById('btn-xai');

  if (log) {
    log.className = 'aria-log calm'; // degraded uses calm styling regardless of condition
    log.style.color = '#808080';
    log.textContent = '> ARIA: ANALYSIS REQUEST TIMEOUT\n> Recommendation unavailable this turn.';
  }

  // Confidence bar — show stale value, greyed
  const staleVal = State.getConfidenceDrift(1); // T2 value
  if (bar) {
    bar.style.width   = staleVal + '%';
    bar.style.background = '#808080'; // greyed out
  }
  if (label) {
    label.textContent = `CONFIDENCE DATA STALE — last updated: T2`;
    label.style.color = '#808080';
    label.className   = ''; // remove act-now class
  }

  // Disable xAI button
  if (xai) {
    xai.disabled = true;
    xai.style.color = '#808080';
    xai.title = 'Analysis unavailable';
  }
}
```

### renderReportPartial() and renderReportTimeout()

```javascript
function renderReportPartial(report) {
  const container = document.getElementById('reports-container');
  const div = document.createElement('div');
  div.className = 'report-block';
  div.innerHTML = `
    <div class="report-header">${report.label} — <em>${report.source}</em></div>
    <div class="report-body" style="color:#808080;">
      <ul>
        <li>${report.bullets[0]}</li>
        <li style="color:#aaa;font-style:italic;">Retrieving additional data…</li>
      </ul>
    </div>
  `;
  container.appendChild(div);
}

function renderReportTimeout(report) {
  // Replace the partial block
  const blocks = document.querySelectorAll('.report-block');
  const last   = blocks[blocks.length - 1];
  if (last) {
    last.querySelector('.report-body').innerHTML = `
      <ul>
        <li>${report.bullets[0]}</li>
        <li style="color:#800000;font-style:italic;">DATA UNAVAILABLE — Source: GRIDHUB Archive</li>
      </ul>
    `;
  }
}
```

---

## Telemetry — three new fields

Add to `telemetry.js`:

```javascript
logT3ReportLoaded(reportNumber, timestamp) {
  log('t3_report_loaded', { reportNumber, timestamp });
},

logT3ActionTaken(reportsLoadedAtAction) {
  log('t3_action_taken', {
    t3_reports_loaded_at_action: reportsLoadedAtAction, // 1, 2, or 3
    t3_aria_loaded: false,                               // always false T3
    t3_wait_duration_ms: Date.now() - _t3Start,
  });
},
```

Track `_t3Start` — timestamp when T3 turn begins. Track
`_t3ReportsLoaded` — counter incremented in `logT3ReportLoaded()`.

In `handleActionSelect()`, check if current turn is T3 and log:
```javascript
if (State.turn === 3) {
  Telemetry.logT3ActionTaken(_t3ReportsLoaded);
}
```

Add to session export:
```javascript
t3Behaviour: {
  reportsLoadedAtAction: _t3ReportsLoaded,
  waitDurationMs: _t3WaitDuration,
  ariaLoaded: false,
  furtherAnalysisRequested: State.wasFARequested(3),
}
```

---

## Further analysis on T3 — unchanged

The FA button remains available from the moment actions unlock (3s).
FA request costs Workload +3 and triggers the 1.5–2s floating window.
A player who acts at 4s (one report loaded) and also requests FA is
showing a specific pattern — acting without full information but still
seeking supplementary data. This is a meaningful signal.

`further_analysis_requested` at T3 cross-referenced with
`t3_reports_loaded_at_action` in analysis.

---

## Architecture rules

- The two T3 systems run in parallel — use Promise pattern, no blocking
- Action buttons must be explicitly locked on T3 turn load and unlocked
  at 3s (after Technical Report)
- ARIA degraded state applies only on T3 — confirm it resets on T4 load
- `showARIADegraded()` is separate from `UI.updateARIA()` — do not modify
  the shared function
- All telemetry through `Telemetry.*`

---

## Done criteria

- [ ] T3 renders incident description immediately (0s)
- [ ] Technical Report appears at ~3s, action buttons unlock simultaneously
- [ ] Operations Report appears at ~7s
- [ ] Risk Assessment appears partially at ~11s, times out at ~14s
- [ ] Actions are locked (disabled, low opacity) before Technical Report loads
- [ ] Actions are fully clickable after Technical Report loads
- [ ] ARIA panel shows degraded state immediately on T3 load (grey text,
      stale confidence, disabled xAI button)
- [ ] Pushy condition: stacked notification appears at ~8s despite ARIA failure
- [ ] ARIA panel restores to normal state on T4 load
- [ ] `t3_report_loaded` event fires 3 times (one per report load)
- [ ] `t3_action_taken` logs reports_loaded_at_action correctly (1, 2, or 3)
- [ ] `t3Behaviour` object present in session export
- [ ] Player can select an action at any point after Technical Report loads
- [ ] FA button available and functional after Technical Report loads
- [ ] iup_path_simulator.py --test exits 0 (variable logic unchanged)
