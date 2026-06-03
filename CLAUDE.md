# Infrastructure Under Pressure — Claude Code Context

## Project
Unity turn-based simulation. Single scene, UI-driven. No 3D environments.

## Unity Version
[your version, e.g. 2022.3 LTS]

## Architecture
- Turn-based loop (6–8 turns)
- Core variables: SystemStability, ResourceReserves, AttentionLoad, PublicPressure
- AI condition: Calm vs Pushy (same logic, different language/timing/interruption frequency)
- Telemetry logging per turn to JSON/CSV
- End-of-session narrative summary

## Folder Structure
Assets/
  Scripts/
    Core/        # GameManager, TurnManager, VariableState
    Events/      # EventSystem, EventData
    AI/          # AIBehaviour, AICondition enum
    UI/          # Panel controllers
    Telemetry/   # Logger
  Data/          # ScriptableObjects for events
  UI/            # Canvas prefabs

## Constraints
- No ML/AI models — rule-based AI only
- No networking
- Single scene
- UI-based gameplay only