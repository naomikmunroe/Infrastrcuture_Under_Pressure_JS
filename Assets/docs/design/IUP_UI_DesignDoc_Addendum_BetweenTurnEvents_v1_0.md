**Infrastructure Under Pressure**

UI Design Document — Addendum: Between-Turn Environmental Events

Naomi Munroe — MSc Human-Centred AI for Games Development  |  Version 1.0 — June 2026

# **1\. Purpose**

This addendum specifies the between-turn environmental event system (AD-30) and its associated metric effects (AD-31). It supplements the IUP UI Design Document v1.4 and should be read alongside Section 6.2 (Turn Summary Screen).

Between-turn events introduce simulation-layer non-determinism without altering the six decision turns or invalidating the 5,120-path structure. They are drawn randomly from two phase-specific pools and displayed as dismissible Win98 popups between turns. Metric effects are hidden from the player.

# **2\. Design Rationale**

IUP's decision layer is deterministic; the simulation layer is not. Between-turn events are the primary mechanism by which the simulation layer introduces variability. This follows the RimWorld model: emergent narrative arises from the player’s interpretation of a variable event sequence drawn from a fixed pool, not from generative content.

Two players making identical decisions may end a session at meaningfully different variable states depending on which events fired. This is the simulation non-determinism that supports the emergent narrative claim (Charlie Hargood, Progress Meeting 1, June 2026).

Causal attribution is deliberately ambiguous throughout. Players should not be able to determine whether an event was caused by their prior decision or would have occurred regardless. This is the productive uncertainty principle applied to the simulation layer.

# **3\. Event Pool Structure**

Events are divided into two phase-specific pools aligned with the Phoebe/Cassandra model (RimWorld storyteller design precedent):

| Phase | Turns covered | Between-turn gaps | Pool size | Draw method |
| :---- | :---- | :---- | :---- | :---- |
| Phoebe (low stakes) | T1–T3 | Gaps 1, 2, 3 | 5 events | Random draw without replacement per session |
| Cassandra (escalating) | T4–T6 | Gaps 4, 5 | 5 events | Random draw without replacement per session |

One event fires per between-turn gap. Across two sessions (within-subject design) some event repetition is possible and is not a design flaw — recurring background problems are ecologically plausible in an infrastructure context.

# **4\. Metric Effect Rules**

Each event applies a hidden effect of ±2–4 points to one variable only. The following constraints apply:

| Rule | Detail |
| :---- | :---- |
| One variable per event | Effects are never split across multiple variables. |
| Range ±2–4 points | Effects are too small to cross a consequence threshold (AD-25) independently. A cascade failure requires a decision-turn action to contribute. |
| Hidden from player | Variable bars update visually only on decision turns. Between-turn event effects accumulate silently and are reflected in the state at the next decision turn. |
| Logged to telemetry | Event ID, gap number, variable affected, and effect value are logged per session. This allows post-hoc analysis of cumulative drift across conditions. |
| Condition-neutral | Effects do not vary between calm and pushy conditions. The independent variable is ARIA’s interaction style, not the simulation state. |

# **5\. Phoebe Phase Events (T1–T3)**

Low-stakes background noise. Monitoring and deferral register. No event implies immediate operational failure.

| ID | Title | Popup Text | Variable | Effect | Rationale |
| :---- | :---- | :---- | :---- | :---- | :---- |
| EVT-P01 | Transformer Inspection Deferred | A routine inspection has been rescheduled due to staffing constraints. No immediate operational impact expected. | Resources | \-2 | Staffing constraint implies reduced available capacity. Effect is minor — deferred maintenance, not active failure. |
| EVT-P02 | Sensor Calibration Variance | Diagnostic systems report minor inconsistencies in readings from several remote substations. Monitoring continues. | Stability | \-3 | Instrumentation uncertainty introduces low-level system ambiguity. Nudges Stability downward without triggering consequence thresholds. |
| EVT-P03 | Contractor Availability Reduced | A regional maintenance contractor has reported reduced availability over the coming week. No current work orders are affected. | Resources | \-2 | Reduces future operational buffer. Consistent with background organisational pressure in Phoebe phase. |
| EVT-P04 | Communications Latency Detected | Intermittent delays have been observed in telemetry updates from remote assets. Data integrity remains unaffected. | Workload | \+3 | Latency increases monitoring burden. Seeds productive uncertainty about whether ARIA’s readings are current — directly supports the xAI window as a player behaviour of interest. |
| EVT-P05 | Weather Forecast Updated | Higher-than-expected temperatures are forecast for the next operational period. Demand projections are under review. | Public Confidence | \-2 | External environmental pressure. Public Confidence is the most externally-facing metric — weather-driven demand risk is a plausible minor signal before the Cassandra phase escalates scrutiny. |

*Cumulative maximum effect across 3 drawn events: −11 points across Resources, Stability, Workload, and Public Confidence in any combination. This is below all consequence thresholds (Stability \<40, Resources \<25, Public Confidence \<35, Workload \>75).*

# **6\. Cassandra Phase Events (T4–T6)**

Escalating pressure. Institutional scrutiny and operational consequence register. Causal attribution remains ambiguous throughout.

| ID | Title | Popup Text | Variable | Effect | Rationale |
| :---- | :---- | :---- | :---- | :---- | :---- |
| EVT-C01 | Repeat Fault Reports Received | Multiple fault reports have been logged from infrastructure assessed as stable following recent operational interventions. Investigations remain ongoing. | Stability | \-4 | Strongest Stability effect in the pool. The phrase ‘following recent operational interventions’ seeds causal ambiguity — the player may read this as a consequence of their T2–T3 decisions. This is the productive uncertainty mechanism at its most direct. |
| EVT-C02 | Maintenance Queue Growth | Several non-critical maintenance actions have exceeded expected completion timelines. Operational impact currently unclear. | Resources | \-3 | Cumulative resource drain consistent with Cassandra escalation. ‘Operational impact currently unclear’ maintains ambiguity without resolving cause. |
| EVT-C03 | Media Monitoring Alert | Local reporting has begun referencing recent service reliability concerns. Coverage remains limited. | Public Confidence | \-4 | Public Confidence under external scrutiny is the sharpest narrative signal in the Cassandra phase. The media presence raises stakes without naming a cause, preserving causal ambiguity. |
| EVT-C04 | Reserve Capacity Revision | Updated forecasts suggest available reserve margins may be lower than previously estimated. Confidence in projections remains moderate. | Resources | \-3 | Compounds resource pressure in T4–T6 where decision-turn costs are already higher. ‘Confidence in projections remains moderate’ maintains information uncertainty. |
| EVT-C05 | Stakeholder Assurance Request | Regional authorities have requested additional assurance regarding infrastructure resilience. The request follows recent service interruptions elsewhere. | Workload | \+4 | Institutional pressure increases operator cognitive load without introducing a new decision point. ‘Elsewhere’ keeps causal attribution external while implying the player’s system may be next. |

*Cumulative maximum effect across 2 drawn events: −8 points. Combined with Phoebe drift, total between-turn effect across a session reaches a maximum of −19 points. Consequence threshold crossings still require a decision-turn action to contribute.*

# **7\. Intended Narrative Arc**

The five selected events produce the following implied arc when experienced in sequence across a session:

| Phase | Events (example draw) | Implied arc |
| :---- | :---- | :---- |
| Phoebe | Contractor Availability Reduced → Sensor Calibration Variance → Communications Latency Detected | Minor organisational strain → instrumentation uncertainty → information quality concern |
| Cassandra | Repeat Fault Reports Received → Media Monitoring Alert | Operational fragility surfaces → external scrutiny begins |

The arc is implied, not stated. No event explicitly tells the player the system is deteriorating. Players who construct a deterioration narrative are doing so from ambiguous signals — this is the sense-making process RQ2 investigates.

# **8\. Implementation Notes**

| Item | Specification |
| :---- | :---- |
| Popup pattern | Reuses AD-25 dismissible Win98 popup. No new UI components required. |
| Draw timing | Event drawn at turn-summary load, before the popup displays. Randomisation seeded per session, not per participant (unlike ARIA confidence drift — AD-23). |
| Telemetry | Log: event\_id, gap\_number, variable\_affected, effect\_value, acknowledged (Y/N), acknowledgement\_timestamp. |
| Path simulator | Revalidation required after implementation (AD-31). Confirm no combination of between-turn drift and decision-turn effects can cross a consequence threshold without a decision-turn action contributing. |
| Audio | No condition-specific audio for event popups. Standard Win98 alert sound applies to both conditions equally. |

IUP UI Design Document — Addendum v1.0  |  Between-Turn Environmental Events  |  June 2026