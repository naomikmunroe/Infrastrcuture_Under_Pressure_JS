# Infrastructure Under Pressure — Claude Code Brief

## Project
Unity 2D simulation game (PC). Turn-based, single-scene, UI-driven.
Research artefact for MSc dissertation. Windows 98 / ageing terminal aesthetic.

## Phase 1 Scope: Core variables + turn loop only
Build the main control loop. Nothing else.
See: docs/design/IUP_Turns_Design_v1_1.docx
See: docs/design/IUP_Path_Simulation_v1_1.csv

### Deliver:
- GameManager.cs — singleton, owns all state
- Four variables as ints with clamp(0,100): 
  Stability (start 70), Resources (start 70), Workload (start 30), Confidence (start 70)
- Turn counter (1–6)
- TurnState enum: AwaitingAction, ResolvingAction, TurnComplete, GameOver
- ApplyEffect(Dictionary<string, int> effects) method — applies deltas, clamps
- RegisterDelayedEffect(int targetTurn, Dictionary<string, int> effects) — stores for later
- ProcessDelayedEffects(int currentTurn) — applies any effects due this turn
- AdvanceTurn() — increments turn, processes delayed effects, checks end condition
- OnVariablesChanged event — fires after any variable update
- OnGameOver event — fires after Turn 6 resolves

### Do not build in Phase 1:
- UI
- Events/actions
- AI system
- Telemetry
- Narrative tags
- Scene management

## Architecture constraints
- Single scene
- No singletons beyond GameManager
- No coroutines for game logic (use events)
- Variables are ints, not floats
- All variable changes go through ApplyEffect — never set directly

## Collapse condition
System Collapse = Resources < 10 OR Stability < 20 at session end (Turn 6 only).
Do not end the game early — run all 6 turns regardless of variable state.

## Testing
Provide a test script (TestGameManager.cs) that:
- Simulates a known path from the path simulator output
- Logs variable state after each turn to console
- Verifies final state matches expected output

## Test path (use this to verify output)
T1: Emergency Rerouting, T2: Restore Communications, T3: Act Independently,
T4: Launch Visible Response, T5: Prioritise Critical Assets, T6: Controlled Response
Expected final: Stability=85, Resources=10, Workload=45, Confidence=80

## File locations
Assets/Scripts/Core/GameManager.cs
Assets/Scripts/Core/TestGameManager.cs