# Phase 7 — Implementation Complete

AD-39, AD-40, AD-41, AD-43, AD-44 implemented and verified, plus a follow-up
telemetry pass and a turn-summary prompt/styling revision requested after
initial delivery.

---

## Task 1 (AD-39, AD-44) — Murmur Civilian Social Feed

**What it is:** fictional civilian social platform in the right panel, below
the ARIA limitations footer. 4 posts generated per turn via Anthropic API,
non-blocking. Posts accumulate across turns, newest at top.

**Files changed:**

- `netlify/functions/murmur.js` — new function, proxies Anthropic API with a
  civilian-register system prompt; optionally reacts to the active Gazette
  headline for the current gap
- `js/murmur.js` — new module; holds accumulated `_posts` array in memory
  (survives the ARIA panel's full `innerHTML` rebuild every turn); exposes
  `mount()` (repopulates `#murmur-posts` after a panel re-render) and
  `loadTurn(turnIndex)` (fetches new batch, prepends, re-mounts)
- `js/ui.js` — `_murmurPanelHTML()` appended to both `renderARIA()` and
  `showARIADegraded()` templates; `Murmur.mount()` called after each panel
  re-render
- `js/turns.js` — `Murmur.loadTurn(turnIndex)` fired (not awaited) after
  `Telemetry.logTurnStart()` in both the T3 branch and the normal branch
- `js/telemetry.js` — `logMurmurPosts(turn, posts, vars)` logs
  `murmur_posts_generated`; `murmurLog` array added to `exportSession()`
- `index.html` — `<script src="js/murmur.js">` added before `ui.js`

**Error handling:** on fetch/parse failure, shows "Murmur feed unavailable."
only if no posts have accumulated yet; otherwise silently keeps the existing
feed rather than wiping it.

---

## Task 2 (AD-40) — Turn Summary Narrative Line

**What it is:** one LLM-generated sentence describing what changed
systemically after each completed turn, shown in the left (System Status)
panel below the variable bars. This codebase has no separate per-turn
"summary screen" — between-turn flow is popup-based — so the line was
attached to the persistent left panel instead of a dedicated screen.

**Files changed:**

- `netlify/functions/turnsummary.js` — new function; takes
  `{turn, varsBefore, varsAfter, consequencesFired}`, returns the full
  Anthropic response containing the generated sentence
- `js/turns.js` — `_turnVarsBefore` snapshot captured at the top of
  `loadTurn()`; `_updateTurnSummary()` helper calls the function and updates
  the DOM; awaited alongside the post-action pause in `handleActionSelect`
  (`Promise.all` with `_sleep`), fire-and-forget in `_handleTimerExpiry`;
  `consequencesFired` built from `State.thresholdEvents` filtered to the
  current turn (plus `TIMEOUT_CONSEQUENCE.title` on the timeout path)
- `js/ui.js` — `showTurnSummaryLoading()`, `setTurnSummaryText()`,
  `clearTurnSummary()` added
- `index.html` — `#turn-summary-narrative` container added between the
  variable bars and TURN LOG, `display:none` by default

**Follow-up revision (requested after initial delivery):**
- System prompt rewritten from an institutional/quantitative register
  ("System stability declined by 10 points...") to a plain-English,
  consequence-focused register ("Stability held, but at the cost of
  resources that may not be recoverable later."), max 20 words, may not
  open with "System"/"The system"
- Display restructured: outer `#turn-summary-narrative` now wraps a static
  `TURN OBSERVATION` label (8px grey uppercase) and an inner
  `#turn-summary-text` node that the JS writes to, so the label survives
  per-turn text updates; border-left changed `#ccc` → `#cc8800` (amber);
  sentence font-size `10px` → `11px`, still italic grey
- `js/ui.js`'s three functions updated to target `#turn-summary-text` for
  content and toggle only the outer container's visibility

---

## Task 3 (AD-41) — Duty Log Prompt Reframe

**Files changed:**

- `js/ui.js` — single string in `showDutyLogModal()` changed from
  "Summarise the current system status in your own words." to "Summarise
  the situation as it stands and any patterns you have observed." No other
  changes to the modal; GRIDHUB Protocol 7 line and 80-character minimum
  untouched.

---

## Task 4 (AD-43) — Vignette Template and Hosting

**Files changed:**

- `vignette-template.html` — new, standalone GRIDHUB-styled page (black
  terminal background, green/grey monospace), participant/condition/date
  placeholders, no JS dependencies
- `vignettes/holding.html` — new, "Session report: PENDING" holding page in
  the same visual register
- `scripts/create-vignette-slots.js` — new; copies `holding.html` to all 30
  `P01-calm.html` … `P15-pushy.html` slots; run once, output verified
- Files placed at the repo root / `vignettes/` rather than under `public/`
  as PHASE7.md literally specified — this site's `netlify.toml` publishes
  from the repo root (where `index.html`, `js/`, `css/` already live), and
  the Done criteria's URL (`/vignettes/P01-calm.html`) only resolves
  correctly from that location

**Skipped, out of repo scope (by request):**
- Q7 questionnaire addition — `questionnaire_spec.md` does not exist in
  this repo; owner will add it to the external form directly
- Tracking spreadsheet URL updates — not represented in this repo

---

## Follow-up — AI-Generated Content in Telemetry Export

Requested after the four tasks shipped: capture the actual generated text
for all three AI content surfaces, not just metadata about them.

**Files changed:**

- `js/telemetry.js` — `logTurnSummaryLine(turn, text)` logs
  `turn_summary_line`; `logVignetteText(text)` logs `vignette_generated`;
  `logNewspaperDismissed()` gained a `headlineText` parameter, logged and
  pushed into `_newspaperLog`; `exportSession()` gained `turnSummaryLines`
  (array of `{turn, text}`), `vignetteText` (string or `null`), and
  `newspaper_dismissed_ms` entries now carry `headlineText`
- `js/turns.js` — `Telemetry.logTurnSummaryLine(State.turn, text.trim())`
  called after `UI.setTurnSummaryText()` succeeds; `edition.headline` passed
  to `Telemetry.logNewspaperDismissed()`
- `js/main.js` — `Telemetry.logVignetteText(text)` called in
  `Main.showVignette()` after the generated text is rendered into
  `#vignette-body`

---

## Verification Results

| Check | Result |
|---|---|
| Murmur posts generate on Turn 1 load, 4 posts, civilian register | PASS — confirmed live via direct POST to `/.netlify/functions/murmur` |
| Murmur posts accumulate across turns, survive ARIA panel re-render | PASS — via `Murmur.mount()` re-population from in-memory `_posts` |
| Turn summary sentence generates and displays after each turn | PASS — confirmed live via direct POST to `/.netlify/functions/turnsummary` |
| Turn summary awaited at the post-action pause point | PASS — `Promise.all([_sleep, _updateTurnSummary])` in `handleActionSelect` |
| Duty log prompt updated, protocol line and minimum length unchanged | PASS — single string diff, no other modal changes |
| Vignette template and holding page render standalone, no JS deps | PASS |
| All 30 vignette slots created | PASS — `scripts/create-vignette-slots.js` run, `vignettes/P01-calm.html` … `P15-pushy.html` confirmed present and live |
| All three Netlify functions (`vignette`, `murmur`, `turnsummary`) deploy without errors | PASS — confirmed live after push |
| `iup_path_simulator_1.py --test` | PASS — all variable checks and Controlled Recovery tag confirmed, re-run after every change in this phase |
