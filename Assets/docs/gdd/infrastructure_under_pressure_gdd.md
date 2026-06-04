# Infrastructure Under Pressure — Game Design Document (GDD)

*Version 1.1 — June 2026* *Naomi Munroe — MSc Human-Centred AI for Games Development*

**Changes from v1.0:**

- Evidence Snippet System: updated to three-report structure (Technical, Operations, Risk Assessment). Further Analysis System added.  
- Core Pillar 4 (AI as Behavioural Force): confidence drift, xAI explanation window, and persistent limitations footer added as named AI behaviour properties.  
- Telemetry Recommended Fields: added `further_analysis_requested`, `further_analysis_window_opened`, `further_analysis_window_closed`, `further_analysis_time_open`, `further_analysis_consequence_triggered`, `xai_viewed`, `ai_confidence_drift_value`, `ai_follow_rate_cumulative`.

---

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

### AI Behaviour Properties

**Confidence display**

- Calm condition: confidence percentage drifts per turn (T1–T6 base values specified in UI Design Document v1.4). Drift is noise — not tied to variable states. Purpose: create interpretive uncertainty.  
- Pushy condition: confidence is always above 80%, always labelled 'ACT NOW'. Does not drift.

**xAI explanation** Both conditions include a '? WHY THIS CONFIDENCE' button on the ARIA panel. Triggers a floating window with condition-specific reasoning text including a dataset provenance note (training corpus excludes post-2023 incidents). Calm: hedged explanation. Pushy: confident explanation overwriting the dataset note with a directive.

Telemetry: `xai_viewed` Y/N per turn. Cross-referenced with AI Follow Rate in analysis.

**Limitations footer** Persistent footer in both conditions: "ARIA analysis may be incomplete or based on inaccurate inputs. All decisions remain the responsibility of the duty operator." Identical text; styling differs by condition. Not dismissible.

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

Each event contains three reports:

- **Technical Report** — operational or diagnostic data  
- **Operations Report** — field or historical precedent  
- **Risk Assessment** — consequence framing, often conflicting with the Technical Report

Reports are labelled with source and timestamp. Content is deliberately conflicting or ambiguous. All three remain visible simultaneously.

This creates:

- uncertainty compression  
- interpretive tension  
- institutional decision-making feel  
- synthesis demand (player must reconcile three perspectives, not choose between two)

## Further Analysis System

Each turn contains one expandable report. The player may request further analysis before acting.

Properties:

- Cost: Workload \+3 (applied immediately on request)  
- Delivered as a floating Win98 window with a 1.5–2 second loading delay  
- Content is predetermined — always contradicts or is vague relative to the source report  
- High-confidence turns (T3, T5): further analysis contains specific contradictory data; variable consequence fires if player ignores it  
- Low-confidence turns (T1, T2, T6): further analysis is vague; no variable consequence  
- T4: high-confidence contradiction; no variable consequence — decision pressure is the mechanism

Telemetry: `further_analysis_requested`, `further_analysis_window_opened`, `further_analysis_window_closed`, `further_analysis_consequence_triggered`

See Turn Design Document v1.4 for full per-turn content.

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
- ai\_confidence\_drift\_value  
- ai\_interruptions  
- ai\_delay\_event  
- player\_action  
- response\_time  
- resulting\_state  
- further\_analysis\_requested  
- further\_analysis\_window\_opened  
- further\_analysis\_window\_closed  
- further\_analysis\_time\_open  
- further\_analysis\_consequence\_triggered  
- xai\_viewed  
- ai\_follow\_rate\_cumulative

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

# Final Design Guardrails

Before adding any feature, ask:

1. Does this support the research question?  
2. Does this create meaningful trade-offs?  
3. Does this increase interpretive tension?  
4. Does this improve telemetry usefulness?  
5. Is this simpler than the alternative?

If the answer is no, cut the feature.  
