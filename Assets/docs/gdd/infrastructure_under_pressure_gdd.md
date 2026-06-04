# Infrastructure Under Pressure — Game Design Document (GDD)

## Project Overview

### Working Title

**Infrastructure Under Pressure**

### Genre

Narrative simulation / playable essay / decision-support experiment

### Platform

PC (Unity)

### Perspective

Single-screen interface simulation

### Core Concept

Infrastructure Under Pressure is a simulation-driven playable essay exploring how people make decisions under pressure while interacting with AI-assisted systems.

The player operates a fragile infrastructure management system through a Windows-98-inspired interface while responding to escalating operational problems, conflicting priorities, incomplete information, and AI-generated recommendations.

The project investigates:

- trust in AI systems  
- human decision-making under pressure  
- emergent narrative through system interaction  
- interface friction as a narrative mechanic  
- over-reliance on AI support systems

The game is intentionally designed as:

- a research artefact  
- an emergent narrative system  
- a system-driven interactive essay

---

# Core Pillars

## 1\. Productive Uncertainty

The player should never fully understand the system.

Players must:

- infer priorities  
- interpret ambiguous signals  
- learn through mistakes  
- construct understanding retrospectively

The experience should encourage:

“I think I understand what happened…”

rather than:

“I solved the puzzle optimally.”

---

## 2\. Narrative Through Systems

There is no authored plot.

Narrative emerges through:

- system trajectories  
- conflicting objectives  
- AI interruptions  
- delays and pressure  
- player decisions  
- remembered mistakes

The player constructs meaning from outcomes.

---

## 3\. Interface as Pressure

The interface is part of the gameplay.

The old infrastructure aesthetic creates:

- friction  
- clutter  
- interruptions  
- uncertainty  
- cognitive load

The player should feel:

trapped inside a brittle operational system

rather than:

comfortably managing a simulation from above.

---

## 4\. AI as Behavioural Force

The AI is not simply a helper.

It influences:

- attention  
- urgency  
- confidence  
- pacing  
- interpretation

The project examines how interaction style changes player behaviour and sense-making.

---

# Visual Direction

## Primary Aesthetic

Windows 98 / ageing infrastructure interface.

Visual qualities:

- grey panels  
- overlapping windows  
- cramped layouts  
- modal popups  
- outdated controls  
- bureaucratic control-room feel

The interface should feel:

- operational  
- old  
- slightly unreliable  
- still heavily depended upon

---

## Inspirations

### Primary

- Papers, Please  
- RimWorld

### Secondary

- Frostpunk  
- Mini Metro  
- Unpacking (meaning through interaction)

---

## Important Visual Rule

Do NOT aim for:

- beautiful UI  
- modern dashboards  
- high polish

Aim for:

- expressive friction  
- readability under pressure  
- believable infrastructure systems

---

# Player Experience Goals

The player should:

### Early Game

- feel uncertain  
- not know what matters most  
- struggle to prioritise

### Mid Game

- experience mounting pressure  
- begin relying on routines  
- start interpreting system patterns

### Late Session

- question whether the AI is helping  
- feel trapped between competing objectives  
- construct a narrative explanation for what happened

---

# Core Research Questions

## Primary

How does AI interaction style influence trust, workload, and decision-making behaviour in simulated high-pressure systems?

## Secondary

How do players construct emergent narratives about system behaviour and AI influence through interaction with conflicting objectives and incomplete information?

---

# Core Gameplay Loop

1. Current system state displayed  
2. New event/problem appears  
3. Evidence snippets appear  
4. AI recommendation may appear  
5. Player chooses response  
6. Variables update  
7. Telemetry logs actions  
8. System summary appears  
9. Next turn begins

A full play session lasts approximately:

- 6–8 turns  
- 10–20 minutes

---

# System Variables

## 1\. System Stability

Represents operational integrity.

Low stability increases risk of:

- outages  
- cascading failures  
- public backlash

---

## 2\. Resource Reserves

Represents:

- staffing  
- budget  
- spare capacity  
- emergency resources

Resources are limited and recover slowly.

---

## 3\. Attention Load

Represents cognitive overload.

Increased by:

- alerts  
- interruptions  
- lag  
- decision complexity  
- multiple simultaneous issues

High attention load may:

- increase errors  
- encourage AI reliance  
- reduce response speed

---

## 4\. Public Pressure

Represents external scrutiny and demand for visible action.

Increases when:

- problems persist  
- outages spread  
- player delays action

---

# Conflicting Objectives

Every major action should improve one variable while harming another.

Example:

| Action | Benefit | Cost |
| :---- | :---- | :---- |
| Emergency Intervention | Stability increases | Resources decrease |
| Conserve Resources | Resources preserved | Stability worsens |
| Wait for AI Analysis | Better information | Public pressure rises |
| Silence Alerts | Attention load decreases | Hidden risk increases |
| Public Communication | Public pressure decreases | Technical problems remain |

Conflicting objectives are central to emergent narrative.

---

# AI System Design

## Important Rule

Use ONE underlying logic system.

Differences between conditions should be created through:

- language  
- timing  
- confidence signalling  
- interruption frequency  
- interface behaviour

Do NOT use different AI models.

---

# Calm AI Condition

Characteristics:

- infrequent interruptions  
- softer recommendations  
- visible uncertainty  
- passive interface behaviour  
- slower escalation

Example language:

- “You may wish to monitor the situation.”  
- “There is some indication this could worsen.”  
- “Intervention may not yet be necessary.”

Visual behaviour:

- remains inside designated panel  
- minimal popups  
- limited focus stealing

---

# Pushy AI Condition

Characteristics:

- frequent interruptions  
- directive language  
- high certainty  
- attention-grabbing behaviour  
- aggressive recommendation timing

Example language:

- “Immediate intervention required.”  
- “Failure to act may destabilise the system.”  
- “This issue must be addressed now.”

Visual behaviour:

- popup windows  
- overlapping notifications  
- flashing alerts  
- focus stealing

---

# AI Lag Mechanic

## Purpose

The AI system runs on ageing infrastructure.

Occasional lag events create tension and expose:

- dependence on AI  
- hesitation  
- decision pressure

Example events:

- “AI analysis running…”  
- delayed recommendation generation  
- frozen interface moments

The player must decide:

- wait for AI guidance  
- or act independently

---

## Design Rule

Lag should:

- be occasional  
- feel dramatic  
- not dominate the experience

If included in evaluation conditions, lag frequency should remain consistent between AI conditions.

---

# Evidence Snippet System

## Purpose

Introduce institutional-style uncertainty.

Each event may include:

- fragmented reports  
- conflicting evidence  
- incomplete summaries  
- partial diagnostics

Example:

Report A: Similar incidents stabilised after emergency intervention.

Report B: Previous interventions caused secondary instability under high load.

The AI interprets these snippets.

This creates:

- uncertainty compression  
- interpretive tension  
- institutional decision-making feel

---

# Event Structure

Each event contains:

- title  
- description  
- variable impacts  
- evidence snippets  
- AI interpretation  
- possible actions  
- escalation potential

---

# Example Events

## Power Grid Fluctuation

Potential effects:

- stability decrease  
- public pressure increase

Possible responses:

- emergency rerouting  
- monitor system  
- request AI analysis  
- conserve resources

---

## Communications Delay

Potential effects:

- public pressure increase  
- attention load increase

Possible responses:

- reassure stakeholders  
- prioritise technical systems  
- suppress alerts

---

## Sensor Disagreement

Potential effects:

- uncertainty  
- conflicting evidence

AI may overconfidently simplify the situation.

---

# Turn Rhythm

## Turn 1 — Orientation

Small issue introduced. Player learns interface.

---

## Turn 2 — First Trade-Off

Player experiences conflicting objectives.

---

## Turn 3 — AI Delay Event

Pressure rises while AI lags.

---

## Turn 4 — Escalation

Multiple simultaneous problems.

---

## Turn 5 — Peak Tension

No clearly correct choice.

---

## Turn 6 — Resolution

System trajectory emerges.

---

# Emergent Narrative Design

Narrative should emerge from:

- event order  
- variable trajectories  
- AI interaction style  
- player habits  
- remembered mistakes

Possible narrative archetypes:

- stabilisation  
- oscillation  
- collapse  
- AI dependence  
- autonomy recovery  
- reactive management

---

# End-of-Session Narrative Summary

At the end of a session, the system generates a short reflective summary using telemetry.

Examples:

You repeatedly prioritised short-term stability, preserving operations at the cost of long-term resilience.

Increasing dependence on AI recommendations produced a reactive management pattern.

Delayed interventions allowed pressure to accumulate before stabilisation efforts began.

---

# Telemetry Design

## Telemetry Goals

Support:

- behavioural analysis  
- trust analysis  
- workload analysis  
- narrative reconstruction  
- clustering analysis

---

## Recommended Fields

Per turn:

- participant\_id  
- condition  
- turn\_number  
- timestamp  
- event\_type  
- stability  
- resources  
- attention\_load  
- public\_pressure  
- ai\_suggestion  
- ai\_confidence\_level  
- ai\_interruptions  
- ai\_delay\_event  
- player\_action  
- response\_time  
- resulting\_state

---

# Evaluation Design

## Quantitative

### Trust Measures

Likert-scale trust questions.

### Workload Measures

NASA-TLX-inspired workload questions.

### Behavioural Measures

- response time  
- AI reliance frequency  
- intervention patterns  
- resource expenditure  
- escalation handling

---

## Qualitative

Short reflective debrief.

Questions explore:

- perceived system trajectory  
- trust in AI  
- coherence vs chaos  
- interpretation of system behaviour  
- sense-making processes

---

# Technical Scope

## Recommended Constraints

Keep implementation intentionally small.

### Recommended

- one main scene  
- UI-based gameplay  
- turn-based system  
- simple finite-state logic  
- lightweight data logging

### Avoid

- 3D environments  
- large maps  
- complex economy systems  
- networking  
- multiple AI models  
- procedural world generation

**Stretch goal exception:** SG2 and SG3 introduce external API calls via `UnityWebRequest`. This is not networking in the gameplay sense, but requires internet access at runtime. Participant machines must have outbound HTTPS access to `api.anthropic.com`. The API key must be stored in a local config file excluded from version control.

---

# Unity Architecture

## Recommended Build Order

### Phase 1

Core variables \+ turn loop

### Phase 2

Event system

### Phase 3

Action system

### Phase 4

AI behaviour system

### Phase 5

Telemetry logging

### Phase 6

UI polish

### Phase 7

Narrative summary generation

### Phase 8 (SG1)

Dynamic event weighting

### Phase 9 (SG2)

Live LLM API integration — AI advisor

### Phase 10 (SG3)

AI-generated end-of-session narrative report

### Phase 11 (SG4)

In-artefact reflective debrief

### Phase 12 (SG5)

Counterfactual replay point

---

# UI Layout

## Left Panel

System metrics.

- stability  
- resources  
- attention  
- public pressure

---

## Centre Panel

Current event / evidence snippets.

---

## Right Panel

AI assistant / interruptions.

---

## Bottom Panel

Player actions.

---

## Optional Small Window

Abstract system map / network overview.

---

# Audio Direction

Minimal.

Use:

- notification sounds  
- alert tones  
- system beeps  
- subtle ambience

Avoid:

- cinematic soundtrack  
- voice acting

Silence should contribute to tension.

---

# Success Criteria

The project succeeds if players:

- feel pressured but engaged  
- interpret system behaviour narratively  
- notice differences in AI interaction style  
- experience meaningful trade-offs  
- produce usable telemetry patterns

The project does NOT require:

- visual polish  
- long playtime  
- large content volume

---

# Portfolio Framing

This project can later be framed as:

- a simulation-based research artefact  
- a playable essay about AI-mediated decision-making  
- an exploration of institutional pressure and uncertainty  
- a study of interface-driven emergent narrative

---

# Stretch Goals

Stretch goals are conditional extensions, pursued only if core implementation is complete and stable ahead of schedule. Each builds on the previous. Goals SG2 and SG3 are the primary targets; SG1 is a low-effort prerequisite that improves the simulation regardless. Guardrails 2–5 apply to core feature decisions; stretch goals are evaluated against guardrail 1 only.

---

## SG1 — Dynamic Event Weighting

**Trigger:** Core gameplay loop complete and stable.

**Description:** Replace the fixed event sequence with a state-weighted selection system. Event probability is adjusted by current system variables: high instability increases cascading failure events; low resources increase cost-pressure events. The simulation behaves as a responsive system rather than a scripted one.

**Research value:** Strengthens the emergent narrative argument; players encounter more varied trajectories, improving telemetry richness.

**Implementation scope:** Modify the event selection logic to apply weighted probability based on current variable thresholds. No new events required.

---

## SG2 — Adaptive AI Advisor via Live LLM

**Trigger:** SG1 complete; API integration tested.

**Description:** Replace pre-written AI advisor strings with live Anthropic API calls (Claude Haiku). The AI generates recommendations contextually, based on current system state and turn history. AI condition (Calm or Pushy) is enforced entirely through the system prompt; the same model serves both conditions.

**Implementation pattern:**

POST https://api.anthropic.com/v1/messages

Headers: x-api-key, anthropic-version: 2023-06-01

Model: claude-haiku-4-5-20251001

System prompt structure per condition:

- **Calm:** "You are an infrastructure monitoring system. Provide cautious, hedged observations. Express uncertainty. Do not urge action. Keep responses under 30 words."  
- **Pushy:** "You are an infrastructure monitoring system. Provide urgent, directive recommendations. Express high confidence. Emphasise consequences of inaction. Keep responses under 30 words."

Context passed per turn: current stability, resources, attention load, public pressure, event type, turn number.

**Research value:** Makes the AI condition genuinely generative rather than scripted. Directly strengthens the degree-title framing (MSc Human-Centred AI for Games Development). Adds live AI implementation as a demonstrable artefact feature.

**Security note:** API key must not be bundled in a public build. Store in a local config file excluded from version control (`.gitignore`). For participant sessions, key is loaded from a local machine config only.

**Cost estimate:** At Claude Haiku pricing (\~$0.00025/1K input tokens), 10 participants × 2 conditions × 8 turns \= negligible cost (\< $0.10 total).

---

## SG3 — AI-Generated End-of-Session Narrative Report

**Trigger:** SG2 complete and stable.

**Description:** At session end, the full telemetry record for that session is serialised and passed to the Anthropic API. The model generates a personalised narrative summary framing the player's behaviour as a trajectory type.

**Telemetry payload (passed as context):**

- decisions per turn  
- AI recommendation follow rate (by turn)  
- stability trajectory  
- resource depletion pattern  
- number of AI delay events encountered  
- condition (Calm / Pushy)

**Example output:**

You intervened rapidly in early turns, preserving stability at the cost of resources. As reserves depleted, reliance on AI recommendations rose from 25% to 80%. The system remained operational but increasingly reactive. **Trajectory: Reactive Stabilisation**

**Research value:** Directly operationalises the secondary research question on emergent narrative. The summary is player-specific, not templated — creating genuine variation in output that reflects actual behavioural differences between participants and conditions. Strengthens the playable essay framing of the artefact.

**Dissertation value:** Can be discussed in the evaluation chapter as a demonstration of AI-augmented narrative generation within a research context.

---

## SG4 — In-Artefact Reflective Debrief

**Trigger:** SG3 complete.

**Description:** After the AI-generated session summary, the player is shown 2–3 structured reflection prompts derived from their specific session data (e.g. "Your AI reliance increased significantly in the final three turns — was that a deliberate strategy?"). Responses are logged to telemetry.

**Research value:** Collapses the post-session debrief into the artefact itself, reducing debrief administration time and improving response quality (players respond in immediate context of the experience). Logged responses supplement the qualitative data set.

---

## SG5 — Counterfactual Replay Point

**Trigger:** SG4 complete; time permits.

**Description:** After debriefing, the player can replay one selected decision point under the opposite AI condition. The system reconstructs the game state at that turn and presents the same event with the alternative advisor. The player makes a second choice; the divergence is logged.

**Research value:** Creates a within-session direct comparison of AI conditions at a specific decision point. Supports trust calibration analysis. Produces a compelling demonstration for the video presentation.

**Implementation note:** Requires save-state serialisation at each turn. This is the highest-effort goal and should only be attempted if all prior stretch goals are stable and submission timeline permits.

---

## Stretch Goal Priority Summary

| Goal | Effort | Research Value | Recommended Priority |
| :---- | :---- | :---- | :---- |
| SG1 — Dynamic Event Weighting | Low | Medium | Pursue first |
| SG2 — Live LLM Advisor | Medium | High | Primary target |
| SG3 — AI Narrative Report | Low (given SG2) | High | Primary target |
| SG4 — In-Artefact Debrief | Medium | Medium | If time permits |
| SG5 — Counterfactual Replay | High | High | Only if well ahead |

---

# Final Design Guardrails

Before adding any feature, ask:

1. Does this support the research question?  
2. Does this create meaningful trade-offs?  
3. Does this increase interpretive tension?  
4. Does this improve telemetry usefulness?  
5. Is this simpler than the alternative?

If the answer is no, cut the feature.  
