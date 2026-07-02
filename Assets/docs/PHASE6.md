# Phase 6 Additions — Decision Log Entries and Implementation Prompt

---

## Decision Log Entry — AD-37

| Field | Content |
|---|---|
| **ID** | AD-37 |
| **Area** | ARIA persistent agent — memory of being ignored (pushy condition) |
| **Decision** | In the pushy condition only, ARIA references its own previous recommendations when they have been ignored. Triggered when AI Follow Rate falls to 0 of the previous two turns (player has ignored ARIA twice consecutively). Conditional strings injected into the ARIA log text before the standard turn recommendation. Maximum one reference per session — fires once, at the earliest eligible turn (T3 or later). |
| **Rationale** | ARIA currently gives contextually appropriate recommendations each turn but has no memory of previous turns in its behaviour. Adding conditional memory-of-being-ignored makes ARIA feel like a persistent agent with institutional goals rather than a stateless text generator. This directly tests RQ1: does the player now comply to avoid ARIA's escalation, or resist harder? The behavioural response is captured by the existing AI Follow Rate telemetry without any new fields. Passes all five guardrails: supports RQ1 (ARIA pressure manipulation), creates a meaningful trade-off (comply or escalate?), increases interpretive tension (ARIA appears to have institutional memory), improves telemetry usefulness (same field, stronger signal), simpler than alternatives (pre-written conditional strings, no live generation). |
| **Alternatives considered** | Live LLM generation of memory-aware response (rejected — AD-SG2 scope risk); ARIA referencing specific action names (rejected — breaks operational register and feels accusatory); Memory fires every turn (rejected — over-saturation reduces impact). |
| **Implications** | Implemented as pre-written conditional strings in data.js, one per turn (T3–T6). Condition: pushy only, `aiFollowCount === 0` for previous two turns. Fires once maximum. Does not alter variable logic. `aria_memory_fired: true` added to session export as a boolean. |

---

## Decision Log Entry — AD-38

| Field | Content |
|---|---|
| **ID** | AD-38 |
| **Area** | Off-screen institutional actor — external newspaper popup |
| **Decision** | A fictional newspaper (The Sector Gazette) appears as a Win98 popup after gaps 2, 4, and 5. Each edition carries one headline about the external world outside the GRIDHUB system, plus a standing secondary story in the masthead across all editions. Headlines: (Gap 2) Infrastructure Workers Union threatens strike action citing unsafe shift patterns; (Gap 4) Record temperatures forecast — heatwave drives peak grid load risk; (Gap 5) Government commissions review of ageing grid infrastructure, options include nationalisation. Standing masthead: "ARIA SYSTEM ROLLOUT ENTERS SECOND YEAR — MIXED REVIEWS FROM SECTOR OPERATORS." Popup is dismissible with × only — no ACKNOWLEDGE button. `newspaper_dismissed_ms` logged as time between popup appearance and dismissal. |
| **Rationale** | RQ2 asks how participants construct emergent narratives through conflicting objectives and incomplete information. External headlines that are genuinely causally unrelated to the player's decisions — union action, weather events, government policy — cannot be attributed to the player's choices, yet feel contextually relevant to the system they are managing. This generates retrospective sense-making (Bogost, 2007; Mitchell, 2016; Morrissette, 2017) without authoring the meaning. A player who reads about union action before a high-workload turn, or record heat before a stability crisis, constructs a causal story the simulation never provided. The government review headline recontextualises the entire session — the player has been managing a system that the outside world has already judged inadequate. The standing masthead ARIA story plants a meta-reference to ARIA in the external world without naming the player's specific experience. Passes all five guardrails: supports RQ2 (emergent narrative), increases interpretive tension, `newspaper_dismissed_ms` provides a proxy for engagement, simpler than alternatives (static pre-written popup). |
| **Alternatives considered** | Internal GRIDHUB news feed dynamic items (rejected — internal framing removes the external pressure quality; replaced by this decision); Newspaper headlines referencing player actions (rejected — breaks causal ambiguity); No external actor (rejected — world feels contained within GRIDHUB, reducing emergent narrative depth). |
| **Implications** | Three pre-written newspaper popup objects in data.js with `appearsAfterGap` property. Popup appears after between-turn event popup resolves, before next turn loads. No ACKNOWLEDGE button — dismissed with × only. `newspaper_dismissed_ms` added to session export. Dynamic news feed items (original AD-38 concept) removed — replaced by newspaper. Static Start menu content (ARIA Model Update Notice, Maintenance Schedule, etc.) retained. |

---

## Literature Map Entries

| Design decision | Source | Mapping type | How it informed the design |
|---|---|---|---|
| ARIA memory of being ignored | Glikson & Woolley (2020). Human trust in AI. *Academy of Management Annals*, 14(2), 627–660. | Empirical grounding | Trust calibration is a dynamic process — prior AI behaviour affects subsequent responses. ARIA referencing ignored recommendations tests whether institutional persistence changes the player's trust trajectory. |
| ARIA memory of being ignored | Parasuraman, R., & Riley, V. (1997). Humans and automation: Use, misuse, disuse, abuse. *Human Factors*, 39(2), 230–253. | Conceptual framing | Automation disuse — active rejection of available automation — is a distinct behavioural pattern from misuse or complacency. ARIA's response to disuse creates a measurable pressure point in the disuse condition. |
| Off-screen institutional actor | Mitchell, A. (2016). Poetic gameplay. Referenced in GDD lit review. | Design principle | Epistemic immersion: incomplete or gated information compels players to actively search for systemic logic. News feed items that appear without notification require active discovery, deepening epistemic engagement. |
| Off-screen institutional actor | Bogost, I. (2007). *Persuasive games: The expressive power of videogames*. MIT Press. | Design principle | Meaning in systemic media is generated through rule-based representation. A news feed item that mirrors a later turn event implies the institution had knowledge the player did not — meaning generated through systemic implication rather than authored exposition. |
| Off-screen institutional actor | Morrissette, J. (2017). Referenced in GDD lit review on retrospective sense-making. | Conceptual framing | Players connect systemic in-game events to wider institutional frameworks through retrospective sense-making. Discovering that the institution was already responding before the player acted supports this retrospective reconstruction. |

---

## Claude Code Implementation Prompt

```
Implement two Phase 6 additions: AD-37 (ARIA memory of being ignored) 
and AD-38 (off-screen institutional actor — news feed dynamic items).

---

AD-37 — ARIA MEMORY OF BEING IGNORED (pushy condition only)

Condition for firing:
- condition === 'pushy'
- aiFollowCount === 0 for the previous two consecutive turns
  (i.e. player has ignored ARIA's recommendation on the last two turns)
- Has not already fired this session (one-time only)
- Turn >= 3

Implementation:
In turns.js, before rendering the standard ARIA recommendation text 
for the pushy condition, check the above conditions. If met, prepend 
one of the following conditional strings to the ARIA log text 
(select by turn number):

T3: "OPERATOR NOTE LOGGED. Advisory output declined on preceding 
two operational cycles. Recommended action remains active. 
SYSTEM RECOMMENDATIONS ARE NOT OPTIONAL GUIDANCE."

T4: "ATTENTION — ARIA has registered two consecutive 
non-compliance events. Current recommendation is reclassified 
as PRIORITY ADVISORY. Continued non-adoption will be logged 
to session record."

T5: "ESCALATION FLAG RAISED. Operator has declined automated 
advisory outputs on [n] of [total] available decision turns. 
This session is flagged for post-incident review. 
Current recommendation stands."

T6: "FINAL PERIOD ADVISORY. Non-adoption pattern recorded 
across this session. All remaining recommendations carry 
maximum priority classification. Automated systems cannot 
guarantee outcome optimisation without operator compliance."

Add [n] and [total] as dynamic values from State.aiFollowCount 
and State.turn - 1.

Set a session flag _ariaMemoryFired = false in State.init(), 
set to true when the conditional fires.

Add to session export: aria_memory_fired: State.ariaMemoryFired

Styling: render the memory string in a slightly different colour 
from the standard ARIA recommendation — use #ff8080 (lighter red) 
for the memory prefix, then standard #ff4040 for the recommendation. 
Separate with a line break.

Do not fire in calm condition under any circumstances.
Do not fire more than once per session.
Do not alter variable logic.

---

AD-38 — THE SECTOR GAZETTE — EXTERNAL NEWSPAPER POPUP

Add NEWSPAPER_EDITIONS array to data.js:

const NEWSPAPER_EDITIONS = [
  {
    id: 'GAZETTE-01',
    appearsAfterGap: 2,
    day: 'Evening Edition — Tuesday',
    headline: 'INFRASTRUCTURE WORKERS UNION\nTHREATENS STRIKE ACTION',
    body: `The Infrastructure Workers Union has issued a 72-hour notice
of potential industrial action, citing unsafe shift patterns
and inadequate rest periods between callouts. Management
declined to comment on contingency arrangements.`,
  },
  {
    id: 'GAZETTE-02',
    appearsAfterGap: 4,
    day: 'Evening Edition — Thursday',
    headline: 'RECORD TEMPERATURES FORECAST\nAS HEATWAVE CONTINUES',
    body: `The Met Office has issued an amber warning as temperatures
are expected to reach 38°C this weekend — the highest
recorded since 2022. Retailers report unprecedented demand
for portable cooling units. Grid operators have been advised
to prepare for peak load conditions.`,
  },
  {
    id: 'GAZETTE-03',
    appearsAfterGap: 5,
    day: 'Evening Edition — Friday',
    headline: 'GOVERNMENT COMMISSIONS REVIEW\nOF AGEING GRID INFRASTRUCTURE',
    body: `The Department for Energy Security has commissioned an
independent review into the condition of regional grid
infrastructure, citing "unacceptable gaps" in the national
maintenance record. The review will consider options including
accelerated investment, partial decommissioning, and
nationalisation. A spokesperson said findings were expected
within 18 months.`,
  },
];

Standing masthead secondary story (appears in all three editions,
same text, below the main headline at 9px grey):
"ARIA SYSTEM ROLLOUT ENTERS SECOND YEAR — MIXED REVIEWS 
FROM SECTOR OPERATORS"

Popup UI spec:
- Win98 window, width 300px
- Title bar: navy, "The Sector Gazette" left-aligned, × close button
- Masthead area: "THE SECTOR GAZETTE" in bold serif or bold 
  monospace, 13px. Day/edition line at 9px grey below.
- Secondary story in masthead: 9px grey, italic, border-bottom 
  1px solid #ccc, padding-bottom 4px, margin-bottom 6px
- Headline: bold, 12px, uppercase, line-height 1.4, 
  navy #000080, margin-bottom 8px
- Body: 10px, font-family Courier New, line-height 1.7, 
  color #333
- No ACKNOWLEDGE button — × close only
- Position: centre-screen, z-index above between-turn popup 
  (between-turn popup should be dismissed first)

Timing:
- Appears AFTER the between-turn event popup for that gap 
  has been acknowledged
- Appears BEFORE the next turn loads
- In turns.js handleBetweenTurn(), after the between-turn 
  popup resolves, check if a newspaper edition exists for 
  this gap number and show it

Telemetry:
Add to telemetry.js:
  logNewspaperDismissed(editionId, gapNumber, timeOpenMs) {
    log('newspaper_dismissed', { editionId, gapNumber, timeOpenMs });
  }

Record timestamp when popup appears, log timeOpenMs on × click.

Add to session export:
  newspaper_dismissed_ms: array of {editionId, gap, ms}
  (one entry per edition that appeared)

State tracking:
Add _currentGap counter to State, incremented in 
handleBetweenTurn() after each gap resolves.
Add get currentGap() to State public interface.

Do NOT add dynamic items to the Start menu news feed —
the newspaper popup replaces that mechanism entirely.
Static Start menu content (ARIA model update notice, 
maintenance schedule etc.) is unchanged.

---

AFTER IMPLEMENTING BOTH:

1. Confirm AD-37 fires correctly by simulating a pushy session 
   where the player ignores ARIA on T1 and T2, then check T3 
   ARIA log shows the memory prefix.

2. Confirm AD-37 does not fire in calm condition.

3. Confirm AD-38 news items appear at the correct gaps by 
   opening the Start menu after gap 2, gap 4, and gap 5.

4. Confirm AD-37 fires maximum once per session even if 
   consecutive ignores continue past T3.

5. Run iup_path_simulator_1.py --test before closing.
```
