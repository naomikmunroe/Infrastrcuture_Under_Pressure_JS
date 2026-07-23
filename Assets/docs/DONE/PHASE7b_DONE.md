# Phase 7b — Implementation Complete

AD-45 (Voicemail Consequence Mechanic) implemented and verified, in strict
task order: Task 0 (recurring Murmur characters) completed and verified
before any voicemail work began; the voicemail Netlify function was
deployed and verified before the UI was built.

---

## Task 0 — Recurring Murmur Characters (implemented and verified first)

**Why first:** the voicemail uses session Murmur posts as context so it can
reference specific residents by name. Without named recurring characters in
Murmur, the voicemail has no session specificity to draw on.

**Files changed:**

- `netlify/functions/murmur.js` — generic "Username format" line replaced
  with the full RECURRING CHARACTERS block (`@julie_northgate`,
  `@keith_b_councillor`, `@sector7_steve`, `@northgrid_watch`), each with a
  personality, an arc, and turn-anchored example posts

**Bug found and fixed during verification:** direct API testing (4 repeated
calls) showed `@keith_b_councillor` never appeared in Turn 2 output — the
model consistently filled the 4-post budget with Julie/Steve/northgrid_watch
instead, since the function only received a `gap` value with no explicit
turn number or priority rule to act on. Fixed by:
- computing `turnNumber = gap + 1` server-side and passing it in the user
  prompt
- adding an explicit "Turn-based emphasis" rule: Turn 1 must include Julie +
  northgrid_watch, Turn 2 must include Keith + Steve, Turn 3+ must include
  at least two of the four, rotating

Re-verified after the fix: Turn 1 reliably surfaced Julie + northgrid_watch;
Turn 2 surfaced Keith + Steve across 3/3 repeated calls.

**Verification method:** direct POST calls to the deployed
`/.netlify/functions/murmur` simulating Turn 1 (`gap:0`) and Turn 2
(`gap:1`), inspecting raw output for the required usernames — not a manual
browser playthrough, per standing instruction against browser automation
on this static site.

---

## Task 1 — Voicemail Trigger Selection

**File:** `js/turns.js` — `selectVoicemailCase(commsOutcome, vars, aiFollowCount)`
defined at module scope (outside the `Turns` IIFE) so it is a pure,
standalone, globally callable function per the architecture rule ("no side
effects"). Six-case priority order, first match wins, case 6 is an
unconditional catch-all.

**Verification:** 14 Node-level assertions run directly against the
extracted function — all six cases individually, boundary values on each
threshold (e.g. workload 70 vs 71, resources 25 vs 24), and priority
ordering when multiple conditions match simultaneously (e.g. workload +
stability + resources + follow-count all triggering resolves to case 2,
the highest-priority match). All 14 passed.

---

## Task 2 — `netlify/functions/voicemail.js`

New function, deployed and verified independently **before** any UI work,
per instruction. Six case-specific system prompts (Cllr Bramley, Patricia
Okafor, Dev Mehta, Sandra Voss, anonymous internal, ward office forwarding
northgrid_watch). Builds resident context from `murmurPosts` supplied by
the client; self-contained fallback — returns `{text: null}` on prompt-map
miss or upstream failure rather than surfacing an error, so the client can
substitute its own `FALLBACK_TEXT[vmCase]`.

**Verification:** direct POST to the deployed function for all six cases —
all returned HTTP 200 with well-themed, case-appropriate text; Case 1
correctly referenced a named resident (Julie Northgate) supplied in the
test's `murmurPosts` payload, confirming the character-context wiring
works end-to-end.

---

## Task 3 — Voicemail Player UI

**File:** `js/ui.js` — `showVoicemailWindow()`, `showVoicemailLoading()`,
`revealVoicemailTypewriter()`, `hideVoicemailWindow()`.

Built as a dynamically-created `.window` div appended to `#game-overlay`
(FROM/TIME/RE table, PLAY MESSAGE button, typewriter text area, ACKNOWLEDGE
/ ESCALATE TO MANAGER buttons, × close), matching this codebase's existing
floating-window pattern (`showFAWindow`, `showNewspaper`,
`showDutyLogModal`) rather than PHASE7b.md's literal static-markup
template — this project has no precedent for permanent hidden DOM windows;
every other floating window here is created and torn down dynamically.
DOM-only: the API call, trigger selection, and telemetry stay in `js/turns.js`,
matching the split already established for the turn-summary narrative line.

Typewriter reveal at 25ms/char via `setInterval`, matching PHASE7b.md's spec.

---

## Task 4 — Calling Logic

**File:** `js/turns.js`

- `_showVoicemail(vmCase)` — computes sender metadata and a fictional time,
  logs `voicemail_shown`, returns a `Promise` that resolves only from the
  window's dismiss callback. The PLAY MESSAGE handler calls the Netlify
  function with `murmurPosts` (via `Telemetry.getMurmurPosts()`), `vars`,
  `aiFollowCount`, `commsMode`, and `turn`; logs `voicemail_played`
  **before** starting the typewriter reveal, per the architecture rule.
- `resumeAfterComms()` changed from a plain function to `async`; now
  guards on `State.voicemailFired`, selects the case, and `await`s
  `_showVoicemail()` before running the existing `_pendingTurnLoad` (T5).

**T5 gating — verified by code tracing** (no live browser session driven):
at turn 4, `handleActionSelect()` / `_handleTimerExpiry()` disable all
`.action-btn` elements and route to `Main.showCommsScreen()` without ever
calling `loadTurn()` for T5. `hideCommsScreen()` calls
`Turns.resumeAfterComms()`, which now blocks on the voicemail Promise
before reaching the `loadTurn()` call. Action buttons remain disabled the
entire time since no `loadTurn()` re-render has occurred, so nothing behind
the voicemail window is actionable regardless of `#game-overlay`'s
click-through-around-windows behaviour.

---

## Task 5 — Telemetry

**File:** `js/telemetry.js`

- `logVoicemailShown(vmCase, sender)`, `logVoicemailPlayed(vmCase, generatedText, commsMode)`,
  `logVoicemailDismissed(replyOption, timeOpenMs)` added
- `getMurmurPosts()` added — returns an array of per-turn post arrays from
  `murmur_posts_generated` events, consumed by `.flat()` in the voicemail
  function
- `exportSession()` gained a `voicemail` object (`case`, `sender`,
  `generatedText`, `commsMode`, `replyOption`, `timeOpenMs`, `messagePlayed`),
  `null` only if `voicemail_shown` never logged (should not happen — case 6
  is an unconditional catch-all)

---

## Task 6 — State Flag

**File:** `js/state.js` — `_voicemailFired` added, reset to `false` in
`State.init()`; `setVoicemailFired()` and `voicemailFired` getter exposed.

---

## Verification Results

| Check | Result |
|---|---|
| @julie_northgate + @northgrid_watch appear at Turn 1 | PASS — confirmed live via direct POST |
| @keith_b_councillor + @sector7_steve appear by Turn 2 | PASS after fix — FAILED on first test (Keith absent across 4 calls), fixed by passing turn number + explicit emphasis rule, re-verified 3/3 |
| Task 0 verified before Task 1 began | PASS — sequenced and confirmed per instruction |
| `netlify/functions/voicemail.js` deployed without errors | PASS — confirmed live, OPTIONS returns 204 |
| Voicemail function deployed before UI work began | PASS — sequenced per instruction |
| `selectVoicemailCase()` returns correct case for each of the 6 triggers | PASS — 14/14 Node assertions, including boundaries and priority ordering |
| All 6 voicemail cases generate case-appropriate text | PASS — confirmed live via direct POST to all 6 cases |
| Generated text references session-specific content | PASS — Case 1 test referenced the supplied Murmur resident by name |
| Fallback text available if API fails | PASS — client substitutes `FALLBACK_TEXT[vmCase]` when `data.text` is falsy |
| T5 does not load until voicemail is dismissed | PASS by code tracing — `resumeAfterComms()` awaits `_showVoicemail()`'s Promise, which only resolves in `onDismiss` |
| ACKNOWLEDGE, ESCALATE, and × all dismiss correctly | PASS by code review — all three wire to the same `dismiss(replyOption)` path with distinct reply strings |
| `State.voicemailFired` resets to `false` on `State.init()` | PASS — verified in diff |
| `iup_path_simulator_1.py --test` | PASS — exit 0, re-run after every deploy in this phase |

**Not verified via live browser session** (per standing instruction against
browser automation on this static site): the full in-game visual sequence
— comms screen → voicemail window appearing → typewriter reveal rendering
correctly → T5 loading only after dismissal. All of the above were verified
either by direct API testing or by tracing the exact code path; a real
playthrough is recommended before running live sessions.
