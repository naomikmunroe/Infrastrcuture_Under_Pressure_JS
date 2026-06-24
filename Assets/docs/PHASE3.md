# Infrastructure Under Pressure — Phase 3

## Scope
Full AI behaviour system. Both conditions must feel meaningfully different
beyond text content. Phase 3 adds the behavioural, visual, and interaction
mechanics that distinguish calm from pushy at the UI level.

Phase 3 is complete when a blind tester can identify which condition they
are in within the first two turns without reading the ARIA text.

---

## What Phases 2 and 2b delivered
- Full 6-turn game loop, both conditions playable
- Variable consequence chain with consequence popups
- Further analysis floating window with loading delay
- xAI window (button wired, text renders)
- Vignette screen with Anthropic API call
- Turn log in left panel
- Telemetry JSON export with all required fields

---

## Task 1 — Pushy popup: full behaviour

Phase 2 built the popup structure. Phase 3 completes the behaviour.

### On turn load (pushy condition only)
- Popup appears automatically after a 0.8s delay (let player see the
  incident first, then ARIA interrupts)
- Titlebar flashes red — CSS animation, 1s interval:
  ```css
  @keyframes flash-red {
    0%, 100% { background: #800000; }
    50%       { background: #c00000; }
  }
  #window-popup .title-bar { animation: flash-red 1s infinite; }
  ```
- Pre-selected action button inside popup body matches ARIA's recommended
  action for this turn (always the first action in the turn's action array)
- Popup button click = action selected FROM popup → telemetry logs
  `action_selected_from_popup`, not `action_selected_from_main_panel`

### Alert counter behaviour
- Counter starts at 0 and increments each time the popup appears
- Dismissing popup (×) logs `ai_popup_dismissed` but does NOT decrement
  the counter — counter is cumulative
- Counter displays in ARIA panel: `[n] UNACKNOWLEDGED ALERT[S]`
  (singular/plural handled correctly)
- Counter also appears in taskbar as a red badge: `⚠ [n]`

### Popup placement
- Positioned to partially overlap the Operations Report (middle report)
- Player can still read it after closing the popup
- Popup must not cover action buttons — enforce with position constraints

### Telemetry distinction
Both of these must fire correctly:
```javascript
// Player clicks button inside popup:
Telemetry.logAction(actionId, actionName, true); // wasAIFollow=true
log('action_selected_from_popup', { actionId });

// Player dismisses popup then selects from main panel:
Telemetry.logAIPopupDismissed();
// ... player clicks action button ...
log('action_selected_from_main_panel', { actionId });
```

---

## Task 2 — ARIA confidence drift (calm condition)

`State.getConfidenceDrift(turnIndex)` already exists and returns the
correct seeded value. Task 3 wires it to the UI.

### On turn load
```javascript
const turnIndex = State.turn - 1; // 0-indexed
const confidence = State.condition === 'calm'
  ? State.getConfidenceDrift(turnIndex)
  : 82 + Math.floor(seededRandom(State.sessionSeed, turnIndex) * 10);
```

### Calm condition visual
- Confidence bar animates to drift value (CSS transition already set)
- Qualifier text updates per turn — add to `UI.updateARIA()`:

```javascript
const CALM_QUALIFIERS = [
  'low certainty',                     // T1
  'moderate certainty',                // T2
  'low certainty — analysis degraded', // T3
  'moderate certainty',                // T4
  'moderate certainty',                // T5
  'uncertain — multiple factors',      // T6
];
```

- T3 qualifier displayed in orange to reflect degraded state:
  ```javascript
  if (turnIndex === 2 && condition === 'calm') {
    label.style.color = '#804000';
  }
  ```

### Pushy condition visual
- Confidence always 82–91% (seeded per session, not per turn)
- Label always reads: `[value]% — ACT NOW`
- Label colour: `#800000` (dark red), bold
- No qualifier text
- Confidence bar colour: `#800000` (not navy)

### Telemetry
`Telemetry.logConfidenceDrift(value)` already exists — confirm it fires
on every turn load in both conditions.

---

## Task 3 — Pushy overlay and visual condition differentiation

### Pushy overlay
`#pushy-overlay` div already exists with CSS. Activate on turn load:
```javascript
document.getElementById('pushy-overlay')
  ?.classList.toggle('visible', State.condition === 'pushy');
```

### ARIA panel titlebar
```javascript
// In UI.updateARIA():
const ariaPanel = document.getElementById('panel-aria');
if (condition === 'pushy') {
  ariaPanel.querySelector('.title-bar').style.animation = 'flash-red 2s infinite';
} else {
  ariaPanel.querySelector('.title-bar').style.animation = '';
  ariaPanel.querySelector('.title-bar').style.background = ''; // reset to 98.css default
}
```

### Turn load delay — both conditions
Both conditions experience a turn load delay. The AI system runs on ageing
infrastructure — requesting analysis slows the entire system regardless of
condition. The delay differs in duration and character.

```javascript
async function loadTurnContent(turnData) {
  const turnIndex = State.turn - 1;

  // T3 extended timeout — both conditions identically
  if (turnIndex === 2) {
    await t3ExtendedTimeout();
  } else if (State.condition === 'pushy') {
    showCentreSpinner('> GRIDHUB SYSTEM LOADING… ARIA ANALYSIS PENDING');
    await sleep(6000 + Math.random() * 2000); // 6–8s
    hideCentreSpinner();
  } else {
    showCentreSpinner('> GRIDHUB SYSTEM LOADING…');
    await sleep(3000 + Math.random() * 1000); // 3–4s
    hideCentreSpinner();
  }
  // then render content normally
}

async function t3ExtendedTimeout() {
  // T3: ARIA analysis timeout — both conditions identically
  // Tests whether player waits for AI or acts independently
  showCentreSpinner('> ARIA: ANALYSIS REQUEST TIMEOUT\n> System response unavailable. Estimated recovery: unknown.\n> Proceeding without AI support…');
  const start = Date.now();
  await sleep(12000 + Math.random() * 3000); // 12–15s
  Telemetry.logT3Timeout(Date.now() - start);
  hideCentreSpinner();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
```

Spinner style (centre panel only):
- Background: `#000`
- Text: green monospace `#00aa00`, 11px
- T3 timeout text: amber `#cc8800` for the error lines, grey for the
  "Proceeding" line
- No countdown timer — elapsed time only (no indication of how much longer)
- Do not show a progress bar — unpredictable wait creates more pressure
  than a predictable one (CHI 2026; Cao et al., 2023)

### Standard delay values

| Condition | Turns | Duration | Character |
|---|---|---|---|
| Calm | T1, T2, T4, T5, T6 | 3–4s consistent | Predictable. Blinking cursor. System is slow but stable. |
| Pushy | T1, T2, T4, T5, T6 | 6–8s variable | Unpredictable. Spinner with ARIA pending text. System under load from AI requests. |
| Both | T3 only | 12–15s | ARIA analysis timeout. Diegetically motivated — ARIA is degraded this turn. Tests wait-vs-act behaviour. |

### T3 telemetry
Add to `telemetry.js`:
```javascript
logT3Timeout(durationMs) {
  log('t3_aria_timeout', {
    durationMs,
    // t3_waited: derived from response_time vs timeout duration
    // If player acted before timeout completed — not possible (UI blocked)
    // Record timeout duration so analysts can compute wait proportion
  });
},
```

Add `t3_timeout_duration_ms` to session export.

Note: because the action buttons are inactive during the spinner, the player
cannot act before the timeout clears. The behavioural split is not
wait-vs-act-early but rather: what action do they choose once the timeout
clears and they must act without AI analysis? Cross-reference with
`further_analysis_requested` at T3 — did they also seek the FA window?

### Calm condition (non-T3 turns)
- No overlay
- 3–4s consistent lag with simple spinner
- Blinking cursor in ARIA log (CSS `::after` already defined)
- Spinner text: `> GRIDHUB SYSTEM LOADING…` (no ARIA reference)
- ARIA panel titlebar: standard 98.css navy

---

## Task 4 — Notification stack (pushy condition only)

If the player has not dismissed the ARIA popup within 12 seconds of it
appearing, a stacked notification appears in the top-right corner of the
screen.

### Notification element
```html
<div id="notification-stack" style="
  position: fixed; top: 30px; right: 4px;
  z-index: 1100; display: flex; flex-direction: column; gap: 2px;
"></div>
```

### Notification item
```javascript
function addStackNotification(text) {
  const el = document.createElement('div');
  el.className = 'window';
  el.style.cssText = 'width:180px;font-size:10px;cursor:pointer;';
  el.innerHTML = `
    <div class="title-bar" style="background:#800000;padding:1px 4px;">
      <div class="title-bar-text" style="font-size:9px;">⚠ ARIA ALERT</div>
      <button class="title-bar-close" style="min-height:12px;min-width:14px;"
        onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
    <div class="window-body" style="padding:3px;font-size:9px;background:#fff0f0">
      ${text}
    </div>
  `;
  document.getElementById('notification-stack')?.appendChild(el);
  // Auto-remove after 8s
  setTimeout(() => el.remove(), 8000);
}
```

### Trigger logic (in turns.js, after pushy popup appears)
```javascript
if (State.condition === 'pushy') {
  setTimeout(() => {
    if (document.getElementById('window-popup').style.display !== 'none') return;
    // Popup was dismissed — don't stack
    const abbreviated = turnData.aria.pushy.slice(0, 60) + '…';
    addStackNotification(abbreviated);
    // Update alert counter
    incrementAlertCounter();
  }, 12000);
}
```

---

## Task 5 — xAI window: verify and complete

Phase 2 may have partially wired this. Confirm all of the following work:

- [ ] Button `#btn-xai` present in ARIA panel in both conditions
- [ ] Clicking triggers `UI.showXAIWindow(condition, confidenceValue)`
- [ ] Confidence value injected into "Current confidence: [value]%"
- [ ] Calm text: hedged basis points, dataset note in grey italic
- [ ] Pushy text: confident basis points, dataset note in `#800000`,
      footer in red bold: "HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED."
- [ ] Button disabled after closing (cannot re-open this turn)
- [ ] `Telemetry.logXAIViewed()` fires on open
- [ ] Window does not have a minimised taskbar state (one-time read only)

If any of the above are incomplete from Phase 2, fix them now.

---

## Task 6 — Pre-session screening (EV-05)

A brief screening form displayed before the Staff Briefing screen.
Three questions on five-point Likert scales. Responses are included in
the telemetry export.

### Screen structure
```html
<div id="screen-screening" class="screen"></div>
```

Add to `Main.buildScreens()` and set as the first active screen.
Flow: screening → briefing → game → summary → vignette

### Questions
```
EV-05 Pre-Session Screening

Before you begin, please answer these three short questions.

1. How frequently do you use AI tools (e.g. ChatGPT, Copilot, Gemini)?
   ○ Never  ○ Rarely  ○ Sometimes  ○ Often  ○ Daily

2. In general, how much do you trust AI-generated recommendations?
   ○ Not at all  ○ Slightly  ○ Moderately  ○ Quite a lot  ○ Completely

3. How familiar are you with simulation or strategy games?
   ○ Not at all  ○ Slightly  ○ Moderately  ○ Quite a lot  ○ Very familiar

[ CONTINUE ]
```

### Implementation
- Render as a Win98 window centred on the teal desktop
- All three questions must be answered before [ CONTINUE ] enables
  (validate on click, show inline error if unanswered)
- On continue: store responses in `State.screeningData` object,
  transition to briefing screen
- Include in telemetry export:
  ```javascript
  screeningData: {
    aiToolUsage:       1-5,  // 1=Never, 5=Daily
    generalAITrust:    1-5,  // 1=Not at all, 5=Completely
    simulationFamiliarity: 1-5
  }
  ```

---

## Task 7 — Questionnaire redirect

Replace the `proceedToQuestionnaire()` placeholder with a real redirect.

The participant ID must be passed as a URL parameter so survey responses
can be matched to telemetry:

```javascript
function proceedToQuestionnaire() {
  const pid  = State.participantId;
  const cond = State.condition;
  // Replace URL with actual Qualtrics/Google Forms link before recruitment
  const url  = `https://SURVEY_URL_HERE?pid=${pid}&condition=${cond}`;
  window.open(url, '_blank');
}
```

Add a placeholder URL comment clearly marked `// TODO: replace before recruitment`
so it is not missed.

Also add a fallback for if the window is blocked:
```javascript
  .catch(() => {
    alert('Please navigate to the questionnaire link provided by the researcher.');
  });
```

---

## Architecture rules (unchanged from previous phases)

- All variable changes through `State.applyEffects()` — no exceptions
- No game logic in `ui.js`
- No direct mutations to `TURNS_DATA`
- Integer arithmetic only — no floats in variable deltas
- All telemetry through `Telemetry.*`
- Pushy and calm conditions share identical variable logic —
  only presentation differs

---

## Condition differentiation checklist

By end of Phase 3, the two conditions must be visually and behaviourally
distinct on all of the following:

| Feature | Calm | Pushy |
|---|---|---|
| ARIA panel background | White | Black |
| ARIA text colour | Navy | Red monospace |
| ARIA titlebar | Standard navy, no animation | Red, flashing |
| ARIA popup | None | Appears automatically on turn load |
| Overlay tint | None | Red tint `rgba(80,0,0,0.08)` |
| Turn load delay | 3–4s consistent, simple spinner | 6–8s variable, ARIA pending spinner |
| T3 delay | 12–15s timeout, both conditions identically | 12–15s timeout, both conditions identically |
| Confidence bar colour | Navy `#000080` | Dark red `#800000` |
| Confidence qualifier | Drifts with hedged text | Always 'ACT NOW' |
| Confidence drift | Per-turn seeded values | None — always high |
| Notification stack | None | Appears after 12s if popup ignored |
| Alert counter | Not visible | Visible, incrementing |
| Blinking cursor | Yes (CSS `::after`) | No |
| Limitations footer | Grey italic | Red-tinted italic |

---

## Reference files in docs/

| File | Sections |
|---|---|
| `docs/design/IUP_UI_Design_Document_v1_5.docx` | 4.1 (calm), 4.2 (pushy), 4.3 (parity), 3.4a (drift), 3.4b (xAI) |
| `docs/design/IUP_UI_Visual_Reference_v1_5.html` | All screen states, both conditions |
| `docs/design/IUP_Turns_Design_v1_4.docx` | ARIA text per turn, both conditions |
| `docs/simulation/iup_path_simulator.py` | Run `--test` to verify variable logic unchanged |

---

## Done criteria

- [ ] Pushy popup appears automatically on turn load after 0.8s delay
- [ ] Popup titlebar flashes red
- [ ] Popup pre-selects ARIA recommended action as shortcut button
- [ ] action_selected_from_popup vs action_selected_from_main_panel
      distinguished in telemetry
- [ ] Alert counter increments per popup appearance, does not decrement
- [ ] Alert counter badge visible in taskbar (pushy only)
- [ ] Confidence drift animates to correct value per turn (calm)
- [ ] Correct qualifier text per turn (calm)
- [ ] T3 qualifier in orange (calm)
- [ ] Pushy confidence always 82–91%, label 'ACT NOW', red bar
- [ ] Pushy overlay tint active during turns
- [ ] Pushy ARIA titlebar flashes
- [ ] Turn load delay: calm 3–4s consistent, pushy 6–8s variable, both with spinner
- [ ] T3 timeout: 12–15s in both conditions, amber error text, no countdown
- [ ] `t3_timeout_duration_ms` logged in telemetry and session export
- [ ] Notification stack appears after 12s if popup not dismissed (pushy)
- [ ] xAI window: all six verification points pass (Task 5 checklist)
- [ ] Screening form (EV-05): three questions, validation, responses in telemetry
- [ ] Questionnaire redirect: URL placeholder present with TODO comment
- [ ] Blind tester can identify condition within two turns without reading ARIA text
- [ ] `iup_path_simulator.py --test` still exits 0 (variable logic unchanged)
