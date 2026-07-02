# Phase 6 — Implementation Complete

AD-37 (ARIA memory of being ignored) and AD-38 (The Sector Gazette) implemented and verified.

---

## AD-37 — ARIA Memory of Being Ignored

**Condition:** pushy condition only; player ignored ARIA on the two most recent consecutive turns; turn >= 3; fires at most once per session.

**Files changed:**

- `js/state.js` — added `_ariaMemoryFired`, `_currentGap` to session state; reset in `init()`; `setAriaMemoryFired()` and `incrementGap()` functions; `ariaMemoryFired` and `currentGap` getters on return object
- `js/turns.js` — added `_getAriaMemoryPrefix(turn)` helper; wired into both `UI.showARIADegraded(staleConf, prefix)` (T3 branch) and `UI.renderARIA(turnData, confidence, prefix)` (all other turns)
- `js/ui.js` — updated `renderARIA(turnData, confidenceValue, memoryPrefix = null)` and `showARIADegraded(staleConfidenceValue, memoryPrefix = null)` signatures; memory prefix rendered as `<span style="color:#ff8080">` above the standard recommendation; in `showARIADegraded`, the degraded grey italic text is wrapped in a `<span>` so the prefix overrides its colour correctly
- `js/telemetry.js` — `aria_memory_fired: State.ariaMemoryFired` added to `exportSession()`

**Guard logic (in `_getAriaMemoryPrefix`):**
```
if (State.condition !== 'pushy') return null   // calm guard
if (State.ariaMemoryFired)       return null   // one-time guard
if (turn < 3)                    return null   // earliest eligible turn
const log = State.actionLog
if (log.length < 2)              return null
if (!log.slice(-2).every(e => !e.wasAriaRec)) return null
State.setAriaMemoryFired()                     // flagged before string returned
```

**Conditional strings:** T3 (note logged), T4 (non-compliance registered), T5 (escalation flag with dynamic n/total), T6 (final period advisory). T5 computes `ignored = (turn - 1) - State.getAIFollowCount()`.

---

## AD-38 — The Sector Gazette

**Files changed:**

- `js/data.js` — added `NEWSPAPER_EDITIONS` array (3 editions, `appearsAfterGap` 2 / 4 / 5)
- `js/turns.js` — added `_maybeShowNewspaper(gap, done)` helper; modified `handleBetweenTurn()` to call `State.incrementGap()` then `_maybeShowNewspaper(gap, done)` after between-turn event resolves (and in the `!event` early-exit path)
- `js/ui.js` — added `showNewspaper(edition, onDismiss)`: Win98 window at `z-index: 350`, centre-screen transform, navy title bar, bold masthead, standing secondary story (italic, 9px, border-bottom), headline (bold 12px navy uppercase `white-space:pre-line` via `\n→<br>`), body (10px Courier New #333); × close calls `onDismiss()`; exposed on return object
- `js/telemetry.js` — `_newspaperLog = []` added and reset in `init()`; `logNewspaperDismissed(editionId, gapNumber, timeOpenMs)` appends to log and fires a `newspaper_dismissed` event; `newspaper_dismissed_ms: _newspaperLog` added to `exportSession()`; `logNewspaperDismissed` added to return object

**Timing:** newspaper appears AFTER the between-turn event ACKNOWLEDGE, BEFORE the next turn loads. Dismissal is × only — no ACKNOWLEDGE button. Time-open is recorded from `Date.now()` before `UI.showNewspaper()` to dismissal callback.

---

## Verification Results

| Check | Result |
|---|---|
| AD-37 fires at T3 in pushy when T1+T2 both ignored | PASS — `_getAriaMemoryPrefix(3)` returns T3 string; `ariaMemoryFired` set before return |
| AD-37 does NOT fire in calm condition | PASS — first guard `State.condition !== 'pushy'` returns null |
| AD-38 newspapers at gaps 2, 4, 5 | PASS — `NEWSPAPER_EDITIONS` `appearsAfterGap` values match; `_maybeShowNewspaper` uses `.find()` |
| AD-37 fires maximum once per session | PASS — `_ariaMemoryFired` flag checked before string returned, set immediately on first fire |
| `iup_path_simulator_1.py --test` | PASS — all variable checks and Controlled Recovery tag confirmed |
