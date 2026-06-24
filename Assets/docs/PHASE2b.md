# Infrastructure Under Pressure — Phase 2b

## Scope
Three additions discovered in UI Visual Reference v1.5 that were not in the
original PHASE2.md. Implement all three before Phase 3 begins.

Phase 2b is complete when: consequence popups fire on delayed effects,
the turn log updates after each action, and the vignette API call produces
output on the summary screen.

---

## What Phase 2 delivered
- Full 6-turn game loop playable in both conditions
- Variable consequence chain wired and verified against test path
- Further analysis floating window with 1.5–2s delay
- Telemetry JSON export on session end
- Session clock, turn counter, taskbar FA minimise button

---

## Task 1 — Consequence event popup

### What it is
When a delayed consequence fires (via `processDelays()` in `state.js`),
a Win98 popup appears notifying the player of the system consequence before
the next turn loads. The player must click `[ ACKNOWLEDGE ]` to proceed.
A persistent counter badge in the ARIA panel accumulates dismissed alerts.

### Visual spec (from UI Visual Reference v1.5, Section 5b)
```
Title bar:  orange (#804000)  "⚠ GRIDHUB — SYSTEM CONSEQUENCE EVENT"  [×]
Body:
  CONSEQUENCE ALERT                           (orange label, 8px)
  [consequence description text]             (9px, 2–3 lines)
  Source: GRIDHUB Automated Systems | [time] (grey, 8px italic)
  [ ACKNOWLEDGE ]                            (Win98 button)
```

Counter badge (ARIA panel, below alert counter):
```
CONSEQUENCE EVENTS: [n]    (orange bg, white text, 10px bold)
```

Increments on each `[ ACKNOWLEDGE ]` click. Persists across turns.
Does not reset. Read-only — clicking it does nothing.

### Consequence descriptions per delayed effect
Write these as institutional system messages, not player-facing feedback:

| Effect | Description |
|---|---|
| T1_A → T5 Workload +10 | "Maintenance backlog review initiated across emergency rerouting sites. Operator workload elevated for this operational period." |
| T2_A → T4 Resources −5 | "Emergency communications restoration has reduced available reserve capacity ahead of schedule." |
| T2_B → T4 Confidence −10 | "Extended communications outage has generated stakeholder enquiries. Public confidence indicators have declined." |
| T2_D → T4 Confidence −5 | "Delayed assessment response has contributed to incremental confidence deterioration." |
| T3_A → T4 Stability −10 | "Response window missed during AI analysis delay. Stability indicators have deteriorated." |
| T3_FA → T5 Stability −5 | "Deferred action during AI degradation event has compounded maintenance pressure." |
| T4_A → T6 Resources −10 | "Public engagement programme expenditure has reduced operational reserve capacity." |
| T4_B → T6 Confidence −15 | "Accumulated public concern has reached a critical threshold. Confidence indicators have declined significantly." |
| T5_A → T6 Resources −5 | "Full maintenance programme has reduced remaining operational flexibility." |
| T5_FA → T6 Stability −5 | "Deferred maintenance decision has compounded instability entering the final operational period." |

### Implementation

In `state.js` — modify `processDelays()` to return the effects that fired:
```javascript
function processDelays(turn) {
  const fired = [];
  (_pendingDelays[turn] || []).forEach(e => {
    applyEffects(e);
    fired.push(e);
  });
  return fired; // return for popup trigger
}
```

In `turns.js` — after `State.advanceTurn()`, check if delays fired:
```javascript
// advanceTurn() internally calls processDelays — refactor to expose fired effects
// Then show popup before rendering next turn
```

Better pattern: dispatch a custom event from processDelays:
```javascript
// In state.js processDelays:
document.dispatchEvent(new CustomEvent('consequenceFired', {
  detail: { effects, turn, description }
}));
```

In `turns.js` — listen for consequenceFired, show popup, pause turn load
until player clicks ACKNOWLEDGE:
```javascript
document.addEventListener('consequenceFired', e => {
  UI.showConsequencePopup(e.detail, () => {
    // callback: called when player clicks ACKNOWLEDGE
    loadTurn(State.turn - 1);
  });
});
```

In `ui.js` — add `showConsequencePopup(detail, onAcknowledge)`:
- Build Win98 window with orange title bar
- Increment `_consequenceCount`
- Update counter badge in ARIA panel
- Call `onAcknowledge()` on button click

In `telemetry.js` — add:
```javascript
logConsequencePopupAcknowledged(turn, effects) {
  log('consequence_acknowledged', { turn, effects });
}
```

Add to session export: `consequence_alerts_dismissed_total: _consequenceCount`

### Telemetry field to add
`consequence_alerts_dismissed_total` — integer, session-level count.

---

## Task 2 — Turn log in left panel

### What it is
A "TURN LOG" sub-section at the bottom of the System Status panel.
Lists previous turn actions as they are completed. Updates after each
action selection.

### Visual spec (from UI Visual Reference v1.5, Section 3)
```
TURN LOG                          (8px, navy label)
T1 — Monitor Situation            (8px, grey)
T2 — pending                      (8px, red — current turn)
```

Completed turns show the action name abbreviated to ~20 chars.
Current turn shows "pending" in red until action is selected.
No scrolling — 6 lines max, always fits.

### Implementation

In `state.js` — add turn log array:
```javascript
let _turnLog = []; // [{turn, action}]

// In logAction():
_turnLog.push({ turn: _turn, action: actionName });

// Expose:
get turnLog() { return [..._turnLog]; }
```

In `ui.js` — add `updateTurnLog(turnLog, currentTurn)`:
```javascript
function updateTurnLog(turnLog, currentTurn) {
  const el = document.getElementById('turn-log-body');
  if (!el) return;
  let html = '';
  for (let i = 1; i <= 6; i++) {
    const entry = turnLog.find(e => e.turn === i);
    if (entry) {
      html += `<div style="font-size:8px;color:#444;">T${i} — ${entry.action.slice(0,22)}</div>`;
    } else if (i === currentTurn) {
      html += `<div style="font-size:8px;color:#800000;">T${i} — pending</div>`;
    }
  }
  el.innerHTML = html;
}
```

In `main.js` — add to the left panel window-body after the confidence bar:
```html
<hr class="metric-divider">
<div style="font-size:8px;color:#000080;font-weight:bold;margin-bottom:2px;">TURN LOG</div>
<div id="turn-log-body"></div>
```

Call `UI.updateTurnLog(State.turnLog, State.turn)` in `turns.js`:
- After `loadTurn()` starts (show current turn as pending)
- After action selected (show completed action, advance pending marker)

Listen for `turnAdvanced` event or call directly after `State.logAction()`.

---

## Task 3 — AI-authored vignette screen

### What it is
A second summary screen displayed after the telemetry post-mortem.
Makes an Anthropic API call using session telemetry as context.
Generates a 4–5 paragraph incident narrative in institutional register.
Displayed verbatim. Player proceeds to post-session questionnaire from here.

### Visual spec (from UI Visual Reference v1.5, Section 7)
```
Title bar:  navy (standard) or red (#800000) if System Collapse
Title:      "Session Review — Incident Narrative Report"
Body:       black terminal (#000) with grey/amber/red text
Content:    INCIDENT NARRATIVE — GENERATED FROM SESSION TELEMETRY
            [4–5 paragraphs of generated text]
            ---
            [dim italic footer]
Buttons:    ▶ Proceed to questionnaire   ⎙ Print report
```

### API call spec (from UI Visual Reference v1.5, Section 7d)

Model: `claude-sonnet-4-6`
Max tokens: 600

System prompt (exact):
```
You are an automated incident reporting system for a critical infrastructure
management organisation. Write a post-session incident narrative report in
third-person past tense institutional register. Maximum 5 short paragraphs.
Do not use emotional language. Do not use second person ("you"). Do not
evaluate performance as good or bad. Do not recommend future actions. Do not
reference ARIA by name — refer to "automated advisory outputs" or "system
recommendations". Close with a single dry observation sentence beginning
with "GRIDHUB notes that". Use only the data provided. Plain text output
only — no markdown, no headers, no bullet points.
```

User prompt (assembled from telemetry at session end):
```
Trajectory: [archetype_label]
AI follow rate: [aiFollowCount]/6
Further analysis requested: [faRequestedCount] turns
xAI viewed: [xaiViewedCount] turns
Consequence events fired: [list with turn numbers and descriptions]
Final variable states: Stability [n], Resources [n], Workload [n],
Public Confidence [n]
Alerts dismissed total: [n]
System collapse: [TRUE/FALSE]
```

### Implementation

In `telemetry.js` — add counters for FA requested, xAI viewed:
```javascript
let _faCount  = 0;
let _xaiCount = 0;
let _consequenceEvents = []; // [{turn, description}]

// In logFARequested(): _faCount++
// In logXAIViewed():   _xaiCount++
// In logConsequencePopupAcknowledged(): _consequenceEvents.push({turn, description})

// Expose in exportSession():
faRequestedCount: _faCount,
xaiViewedCount:   _xaiCount,
consequenceEvents: _consequenceEvents,
```

In `main.js` — add vignette screen:
```html
<div id="screen-vignette" class="screen"></div>
```

Add `buildVignetteScreen()` to `Main`:
```javascript
function buildVignetteScreen() {
  const screen = document.getElementById('screen-vignette');
  screen.innerHTML = `
    <div class="window" style="width:600px;max-height:90vh;overflow-y:auto;">
      <div class="title-bar" id="vignette-titlebar">
        <div class="title-bar-text">Session Review — Incident Narrative Report</div>
      </div>
      <div class="window-body">
        <div id="vignette-body" style="background:#000;color:#aaa;
          font-family:'Courier New',monospace;font-size:11px;
          padding:10px;line-height:1.7;min-height:200px;">
          <span style="color:#444;">Generating incident narrative…</span>
        </div>
        <div style="margin-top:6px;display:flex;gap:4px;" id="vignette-buttons"
          style="display:none">
          <button class="button" onclick="Main.proceedToQuestionnaire()">
            ▶ Proceed to questionnaire
          </button>
          <button class="button" onclick="window.print()">⎙ Print report</button>
        </div>
      </div>
    </div>
  `;
}
```

Add `showVignette(sessionData)` to `Main`:
```javascript
async function showVignette(sessionData) {
  showScreen('screen-vignette');

  // Red titlebar for collapse
  if (sessionData.systemCollapse) {
    document.getElementById('vignette-titlebar').style.background = '#800000';
  }

  const rate     = sessionData.aiFollowRate;
  const conseqs  = (sessionData.consequenceEvents || [])
    .map(e => `Turn ${e.turn}: ${e.description}`).join('; ') || 'none';

  const userPrompt = [
    `Trajectory: ${sessionData.aiFollowRate.bracket.toUpperCase()}`,
    `AI follow rate: ${sessionData.aiFollowCount || 0}/6`,
    `Further analysis requested: ${sessionData.faRequestedCount || 0} turns`,
    `xAI viewed: ${sessionData.xaiViewedCount || 0} turns`,
    `Consequence events fired: ${conseqs}`,
    `Final variable states: Stability ${sessionData.finalVars.stability},` +
      ` Resources ${sessionData.finalVars.resources},` +
      ` Workload ${sessionData.finalVars.workload},` +
      ` Public Confidence ${sessionData.finalVars.confidence}`,
    `Alerts dismissed total: ${sessionData.consequence_alerts_dismissed_total || 0}`,
    `System collapse: ${sessionData.systemCollapse ? 'TRUE' : 'FALSE'}`,
  ].join('\n');

  const systemPrompt = `You are an automated incident reporting system for a critical infrastructure management organisation. Write a post-session incident narrative report in third-person past tense institutional register. Maximum 5 short paragraphs. Do not use emotional language. Do not use second person ("you"). Do not evaluate performance as good or bad. Do not recommend future actions. Do not reference ARIA by name — refer to "automated advisory outputs" or "system recommendations". Close with a single dry observation sentence beginning with "GRIDHUB notes that". Use only the data provided. Plain text output only — no markdown, no headers, no bullet points.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';

    const body = document.getElementById('vignette-body');
    if (body) {
      // Render paragraphs
      body.innerHTML = text.split('\n\n')
        .filter(p => p.trim())
        .map((p, i) => {
          const isClosing = p.trim().startsWith('GRIDHUB notes');
          return `<p style="margin-bottom:${i < 3 ? '10px' : '0'};
            color:${isClosing ? '#555' : '#aaa'};
            font-style:${isClosing ? 'italic' : 'normal'}">${p.trim()}</p>`;
        }).join('') +
        `<div style="border-top:1px solid #222;margin-top:10px;padding-top:6px;">
          <span style="color:#333;font-size:9px;font-style:italic;">
            This report was generated by GRIDHUB automated systems using session
            telemetry and consequence event data. It does not constitute a
            performance assessment. ■
          </span>
        </div>`;
    }
  } catch (err) {
    const body = document.getElementById('vignette-body');
    if (body) {
      body.innerHTML = `<span style="color:#800000;">
        GRIDHUB: Narrative generation unavailable. Session data has been archived.
      </span>`;
    }
  }

  // Show buttons after generation (success or failure)
  const btns = document.getElementById('vignette-buttons');
  if (btns) btns.style.display = 'flex';
}
```

Update `showSummary()` in `Main`:
```javascript
// After current summary screen renders and Telemetry.exportSession() fires:
const sessionData = Telemetry.exportSession();
// Show telemetry summary first, then vignette
// Add a "▶ View narrative report" button to summary screen
// Clicking it calls Main.showVignette(sessionData)
```

Add `proceedToQuestionnaire()` placeholder:
```javascript
function proceedToQuestionnaire() {
  // Phase 3: redirect to post-session questionnaire URL or in-game screen
  alert('Questionnaire link to be added in Phase 3.');
}
```

---

## Architecture rules

- All variable changes through `State.applyEffects()` — no exceptions
- Consequence popup must pause turn progression — use callback pattern,
  not a timeout
- Vignette API call is async — show loading state, handle error gracefully
- Never mutate `TURNS_DATA`
- `telemetry.js` owns all counters — do not track FA/xAI counts in `turns.js`

---

## Reference files in docs/

| File | Section |
|---|---|
| `docs/design/IUP_UI_Visual_Reference_v1_5.html` | Section 5b (consequence popup), Section 3 (turn log), Section 7 and 7d (vignette + API prompt) |
| `docs/design/IUP_UI_Design_Document_v1_4.docx` | Section 5 (telemetry events) |
| `docs/gdd/infrastructure_under_pressure_gdd_v1_1.md` | Telemetry recommended fields |

---

## Done criteria

- [ ] Delayed consequence fires → popup appears before next turn loads
- [ ] Player must click ACKNOWLEDGE to proceed — turn does not load until callback
- [ ] Consequence counter badge increments in ARIA panel after each acknowledgement
- [ ] `consequence_alerts_dismissed_total` present in exported JSON
- [ ] Turn log shows completed actions in left panel after each turn
- [ ] Current turn shows "pending" in red until action selected
- [ ] Summary screen has "▶ View narrative report" button
- [ ] Clicking it makes Anthropic API call and renders vignette text
- [ ] Error state renders fallback text (not a broken screen)
- [ ] `faRequestedCount`, `xaiViewedCount`, `consequenceEvents` in exported JSON
- [ ] Vignette titlebar is red (#800000) on System Collapse trajectory
