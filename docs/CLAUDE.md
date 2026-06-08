# Infrastructure Under Pressure — Claude Code Context

## Project
Unity turn-based simulation. Single scene, UI-driven. No 3D environments.

## Unity Version
[your version, e.g. 2022.3 LTS]

## Architecture
- Fixed 6-turn loop (no dynamic length)
- Core variables: Stability, Resources, Workload, Confidence (all start at 70/70/30/70)
  - Workload maps to AttentionLoad in telemetry; Confidence maps to Public Confidence in UI
- AI condition: Calm vs Pushy (same logic, different language/timing/interruption frequency)
- Further Analysis system: one expandable report per turn, costs Workload +3, one mode per turn (Vague/Hallucination/Contradiction/Useful), logged as telemetry event
- System Collapse: Stability < 20 OR Resources < 10 — evaluated at Turn 6 end only
- Telemetry: JSON + CSV written to Application.persistentDataPath at session end
- End-of-session narrative summary with trajectory classification

## Folder Structure
Assets/
  Scripts/
    Core/        # GameManager, TurnManager, VariableState
    Events/      # GameEventSystem, EventData (ScriptableObject)
    AI/          # AIBehaviour, AICondition enum
    UI/          # Panel controllers
    Telemetry/   # TelemetryLogger
  Data/          # ScriptableObject event assets (one per turn)
  UI/            # Canvas prefabs

## Key Data Model Notes
- EventData ScriptableObject: holds all per-turn content — three named evidence reports, further analysis, calm/pushy AI recommendation text, choices with delayed effects
- EventChoice: supports immediate deltas, delayed effects (targetTurn + deltas), isAriaRecommended flag, T6 pushy-condition override via isFollowAIAction + pushy* fields, activatesEscalateModifier flag
- TelemetryLogger: per-turn record (aiFollowed, furtherAnalysisRequested, xaiViewed, actionFromPopup, FAActionMatch, responseTime) + discrete event list

## Constraints
- No ML/AI models — rule-based AI only
- No networking
- Single scene
- UI-based gameplay only
