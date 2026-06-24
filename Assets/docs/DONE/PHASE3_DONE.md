# Infrastructure Under Pressure — Phase 3 Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 3 Covered

Phase 3 adds the full AI behaviour system. Both conditions are now visually and behaviourally distinct in a way that a blind tester can identify without reading ARIA text. Seven tasks: pushy popup full behaviour, ARIA confidence drift, pushy overlay and turn load delays, notification stack, xAI verification, pre-session screening (EV-05), and questionnaire redirect.

---

## Task 1 — Pushy popup: full behaviour

**0.8s delayed appearance** — popup fires after content is rendered so the player sees the incident first. `setTimeout(..., 800)` inside `loadTurn`, after all panels render.

**Alert counter** — `_pushyAlertCount` in `telemetry.js`. Incremented by `logPushyPopupShown()` each time the popup appears. Counter never decrements. Exposed as `Telemetry.pushyAlertCount` getter.
- ARIA panel: `#aria-alert-count` div — shows `UNACKNOWLEDGED: N ALERT[S]` in red bold
- Taskbar: `#tb-aria-alert` — shows `⚠ ARIA (N)` as red badge; hidden when count=0
- Both restored via `updatePushyAlertBadge(Telemetry.pushyAlertCount)` at end of `renderARIA()` (same pattern as consequence badge)

**Telemetry source distinction** — `Telemetry.logAction()` now accepts a `source` parameter (`'popup'` or `'main_panel'`). Event type is `action_selected_from_popup` or `action_selected_from_main_panel` accordingly. `handleActionSelect()` in turns.js takes `{fromPopup}` option; the popup action button calls it with `fromPopup: true`, main panel buttons with `fromPopup: false` (default). Dismiss logs `ai_popup_dismissed` (previously `pushy_popup_dismissed` — event type renamed).

**Popup position** — `top:110px; left:50%; transform:translateX(-20%)` — overlaps centre panel without covering action buttons.

---

## Task 2 — ARIA confidence drift

**Calm condition** — `CALM_QUALIFIERS` array in `ui.js` (top-level constant, replaces old `_confidenceLabel()` function):
```javascript
['low certainty', 'moderate certainty', 'low certainty — analysis degraded',
 'moderate certainty', 'moderate certainty', 'uncertain — multiple factors']
```
Qualifier indexed by `State.turn - 1`. T3 qualifier displayed in orange (`#804000`) to reflect ARIA degraded state this turn.

**Pushy condition** — confidence always `State.getPushyConfidence(turnIndex)` (82–91%, seeded). Qualifier always `'ACT NOW'`, colour `#800000` bold. Confidence bar `background:#800000`.

**Blinking cursor** — `<span class="cursor"></span>` appended inside `.aria-log-calm` div (calm only). CSS: `@keyframes blink`, `.cursor { display:inline-block; background:#000080; width:5px; height:9px; animation:blink 1s infinite; }`.

**Telemetry** — `Telemetry.logConfidenceDrift(turn, value)` fires in `loadTurn()` after content renders, both conditions.

---

## Task 3 — Pushy overlay and turn load delay

**Pushy overlay** — `#pushy-overlay` fixed div with `rgba(80,0,0,0.08)` background. Toggled via `classList.toggle('active', cond === 'pushy')` in `loadTurn()`. Cleared in `showSummary()`.

**Turn load delay** — `loadTurn()` is now `async`. Calls `await _turnLoadDelay(turnIndex)` before rendering any content. Centre panel replaced with spinner via `UI.showCentreSpinner(type)`.

`showCentreSpinner(type)` replaces `#panel-centre`'s innerHTML with a single black-background window. `hideCentreSpinner()` restores the standard `#incident-panel` + `#panel-actions` structure for subsequent rendering.

| Condition | Turns | Duration | Spinner text |
|---|---|---|---|
| Calm | T1,T2,T4,T5,T6 | 3–4s | `> GRIDHUB SYSTEM LOADING…` + blinking cursor |
| Pushy | T1,T2,T4,T5,T6 | 6–8s | `> GRIDHUB SYSTEM LOADING… ARIA ANALYSIS PENDING` |
| Both | T3 | 12–15s | Amber: `> ARIA: ANALYSIS REQUEST TIMEOUT` / `> System response unavailable.` + Grey: `> Proceeding without AI support…` |

`_t3ExtendedTimeout()` handles T3 — logs duration via `Telemetry.logT3Timeout(durationMs)`. `_t3TimeoutMs` stored in `telemetry.js`, exported as `t3_timeout_duration_ms` in session JSON.

---

## Task 4 — Notification stack (pushy only)

`#notification-stack` — fixed div, `top:30px; right:4px; z-index:1100`. Added to HTML inside `#screen-game`.

After pushy popup appears (within the 0.8s setTimeout), a second timeout fires at 12 000ms. If `#pushy-popup` still exists in the DOM (not dismissed), `UI.addStackNotification(brief)` is called with the first 60 chars of `turnData.aria.pushy.popupBody`.

Each notification: `.window` with red title bar (`⚠ ARIA ALERT`), pale-red body (`#fff0f0`), × close button, auto-removes after 8s.

`UI.clearNotificationStack()` called at the start of each `loadTurn()` to clear stale notifications from the previous turn.

---

## Task 5 — xAI window: verified

All six criteria confirmed:

1. `#btn-xai` rendered in ARIA panel for both conditions ✓
2. Click → `Turns.handleXAIRequest()` → `UI.showXAIWindow(turnData, confidenceValue)` ✓
3. `Current confidence: ${confidenceValue}%` injected into window body ✓
4. Calm: hedged basis points from `xai.calm.basis[]`, dataset note in grey italic (`#555`), hedged closing ✓
5. Pushy: confident basis points, dataset note in `#888`, closing in `#800000` bold (`HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.`) ✓
6. `btn-xai.disabled = true` set in `xai-close` onclick handler — one-time read per turn ✓
7. `Telemetry.logXAIViewed()` called in `Turns.handleXAIRequest()` before window opens ✓
8. No taskbar item — xAI window is one-time, not minimisable ✓

---

## Task 6 — Pre-session screening (EV-05)

New `#screen-screening` div added before `#screen-briefing` in `index.html`. Boot sequence now starts here (`Main.boot()` → `showScreen('screen-screening')`).

Three 5-point Likert questions rendered as radio groups:
1. AI tool usage frequency (Never=1 → Daily=5)
2. General AI trust (Not at all=1 → Completely=5)
3. Simulation/strategy game familiarity (Not at all=1 → Very familiar=5)

`[ CONTINUE ]` button starts disabled. Re-evaluates after each radio change — enables when all three are answered. On click: validates again (shows inline error if somehow unanswered), then calls `State.setScreeningData({ aiToolUsage, generalAITrust, simulationFamiliarity })` and transitions to briefing.

`State.setScreeningData()` / `State.screeningData` getter added to `state.js`. Reset to `null` on `State.init()`. Included in `Telemetry.exportSession()` as `screeningData`.

---

## Task 7 — Questionnaire redirect

`proceedToQuestionnaire()` in `main.js` now constructs a URL with `pid` and `condition` query params:

```javascript
// TODO: replace before recruitment — set to actual Qualtrics/Google Forms URL
const surveyBase = 'https://SURVEY_URL_HERE';
const url = `${surveyBase}?pid=${encodeURIComponent(pid)}&condition=${encodeURIComponent(cond)}`;
const w = window.open(url, '_blank');
if (!w) { alert('Please navigate to the questionnaire link provided by the researcher.'); }
```

Fallback `alert` shown if `window.open` is blocked by the browser. Both `pid` and `condition` are URI-encoded.

---

## Architecture changes summary

| File | Key changes |
|---|---|
| `state.js` | Added `_screeningData`, `setScreeningData()`, `get screeningData()` |
| `telemetry.js` | Added `_pushyAlertCount`, `_t3TimeoutMs`; new `logConfidenceDrift`, `logT3Timeout`; `logAction` now source-aware; `logPushyPopupDismissed` logs `ai_popup_dismissed`; `exportSession` includes `screeningData`, `pushy_alert_count`, `t3_timeout_duration_ms` |
| `turns.js` | `loadTurn` now `async`; `_turnLoadDelay`, `_t3ExtendedTimeout`, `_sleep` helpers; pushy popup on 0.8s delay; 12s notification trigger; `handleActionSelect` accepts `{fromPopup}` |
| `ui.js` | `CALM_QUALIFIERS` constant; removed `_confidenceLabel`; `showCentreSpinner/hideCentreSpinner`; `addStackNotification/clearNotificationStack`; `updatePushyAlertBadge`; blinking cursor in calm ARIA; xAI button disabled after close; pushy overlay toggled from turns.js |
| `index.html` | Added `#screen-screening` with EV-05 form; `#pushy-overlay`; `#notification-stack`; `#tb-aria-alert` taskbar badge; CSS for overlay, notification, cursor, screening form |
| `main.js` | Boot starts at screening; `initScreening()` wired; `proceedToQuestionnaire()` with URL placeholder and fallback |

---

## Path simulator result

```
py iup_path_simulator_1.py --test

Test path: T1_B → T2_C → T3_B → T4_D → T5_C → T6_B
stability: expected=90  actual=90  PASS
resources: expected=50  actual=50  PASS
workload:  expected=40  actual=40  PASS
confidence:expected=80  actual=80  PASS
Tag check: Controlled Recovery   PASS
Result: PASS
```

Variable logic unchanged from Phase 2.

---

## Setup note

Before recruitment, set two values in `js/main.js`:
1. `CONFIG.anthropicApiKey` — Anthropic API key for vignette screen
2. `const surveyBase = 'https://SURVEY_URL_HERE'` — replace with actual survey URL
