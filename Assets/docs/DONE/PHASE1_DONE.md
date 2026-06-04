# Infrastructure Under Pressure — Phase 1 Complete

*Naomi Munroe — MSc Human-Centred AI for Games Development*
*Completed: June 2026*

---

## What Phase 1 Covered

Phase 1 built the core control loop only — no UI, no scene, no authored content. The goal was a verified, testable foundation that all later phases attach to.

---

## Scripts Implemented

### `Assets/Scripts/Core/GameManager.cs`
Singleton. Owns all game state.

- Four variables as ints, clamped to [0, 100]: `Stability` (70), `Resources` (70), `Workload` (30), `Confidence` (70)
- `TurnState` enum: `AwaitingAction`, `ResolvingAction`, `TurnComplete`, `GameOver`
- `ApplyEffect(Dictionary<string, int>)` — only way to change variables; fires `OnVariablesChanged`
- `RegisterDelayedEffect(int targetTurn, Dictionary<string, int>)` — stores effects for a future turn
- `ProcessDelayedEffects(int currentTurn)` — applies any stored effects due this turn; called inside `AdvanceTurn()`
- `AdvanceTurn()` — increments turn counter, processes delayed effects, fires `OnGameOver` after Turn 6
- `IsSystemCollapsed()` — returns true if `Resources < 10 OR Stability < 20`; caller is responsible for only evaluating this at Turn 6 end
- `EscalateModifierActive` flag — set by the T3 "Escalate Infrastructure Support" action; read by AI interrupt logic in Phase 4
- `ResetSession()` — resets all variables and clears pending effects
- `DontDestroyOnLoad` — persists across scenes

### `Assets/Scripts/Core/TurnManager.cs`
Phase 2+ stub. Wires `OnGameOver` to a `UnityEvent`; will coordinate UI transitions and event presentation when the event system is built.

### `Assets/Scripts/Core/VariableState.cs`
Phase 2+ stub. Read-only passthrough to GameManager's variables; will serve as a clean data source for UI panels without coupling them directly to GameManager.

### `Assets/Scripts/Events/EventData.cs`
ScriptableObject. Holds all authored content for one turn.

- `EvidenceReport` class (label, timestamp, body) — three named report fields: `technicalReport`, `operationsReport`, `riskAssessment`
- `FurtherAnalysisMode` enum: `Vague`, `Hallucination`, `Contradiction`, `Useful`
- `FurtherAnalysis` class (expandedReportLabel, mode, content)
- `calmRecommendation` / `pushyRecommendation` strings
- `ariaRecommendedChoiceIndex` — which choice ARIA is recommending (0-based index into `choices[]`)
- `narrativeTag` — the tag this turn fires (e.g. "Preventative Intervention")
- `EventChoice` class: `choiceText`, `immediateEffectDisplay`, `futureRiskDisplay`; immediate deltas (stability/resources/workload/confidence); delayed effect fields (`delayedTurn` + four deltas); `isFollowAIAction` + pushy-condition overrides for T6; `isAriaRecommended`; `activatesEscalateModifier`

No ScriptableObject assets have been authored yet — that is content work for Phase 2.

### `Assets/Scripts/Events/GameEventSystem.cs`
- `TriggerEvent(EventData)` — fires `OnEventTriggered` for UI to consume
- `ResolveChoice(EventChoice)` — applies immediate deltas; registers delayed effects if `delayedTurn > 0` and at least one delta is non-zero; applies pushy-condition overrides for the T6 Follow AI action (reads `AIBehaviour.condition`); sets `EscalateModifierActive` if the choice requires it; advances the turn

### `Assets/Scripts/AI/AIBehaviour.cs`
- Per-turn `calmPrompts[]` and `pushyPrompts[]` arrays (Inspector-populated, indices 0–5 = T1–T6)
- `OnTurnStart(int turn)` — sends calm message immediately; delays pushy message by `pushyInterruptDelay` seconds
- Calm confidence drift data — base values, noise ranges, and qualifiers for all six turns, hardcoded from UI Design Document v1.4:

| Turn | Base | Noise | Qualifier |
|------|------|-------|-----------|
| T1   | 48%  | ±3    | low certainty |
| T2   | 55%  | ±4    | moderate certainty |
| T3   | 41%  | ±5    | low certainty — analysis degraded |
| T4   | 62%  | ±3    | moderate certainty |
| T5   | 58%  | ±4    | moderate certainty |
| T6   | 51%  | ±5    | uncertain — multiple factors |

- `GetCalmConfidence(int turn, int participantSeed)` — returns `(value, qualifier)` using `System.Random` seeded by `participantSeed + turn`
- `GetXAIExplanation(int turn, int participantSeed)` — returns formatted xAI explanation text with confidence value substituted; condition-specific text (including dataset provenance note) stored as Inspector-editable serialized strings with `{0}` placeholder
- Pushy confidence is fixed: always above 80%, always labelled "ACT NOW", no drift

### `Assets/Scripts/AI/AICondition.cs`
Enum: `Calm`, `Pushy`.

### `Assets/Scripts/Telemetry/TelemetryLogger.cs`
- Per-turn `TurnRecord`: `turn`, `choiceText`, `aiFollowed`, `furtherAnalysisRequested`, `furtherAnalysisActionMatchRaw` (serialised as "yes"/"no"/"n/a"), `xaiViewed`, `actionFromPopup`, `responseTimeSeconds`, variable states after action
- Discrete `TelemetryEvent` list for events that can fire multiple times per turn or need timestamps: `ai_popup_dismissed`, `action_from_popup`/`action_from_main_panel`, `xai_viewed`, `further_analysis_requested`, `fa_window_opened`, `fa_window_closed`, `fa_action_match`, `variable_consequence_triggered`
- Per-turn transient state reset by `LogTurnStart(int turn)`: further analysis flag, xAI viewed flag, action source, FA match, turn start time
- `LogTurn(int turn, string choiceText, bool aiFollowed)` — commits the turn record
- `FinalizeSession()` — writes JSON and CSV to `Application.persistentDataPath`
- JSON: `SessionWrapper` containing records list and events list
- CSV headers: `Turn, Choice, AIFollowed, FurtherAnalysis, FAActionMatch, XAIViewed, ActionFromPopup, ResponseTimeSec, Stability, Resources, Workload, Confidence`
- Session file named by `yyyyMMdd_HHmmss` timestamp

### `Assets/Scripts/Core/TestGameManager.cs`
Drives two known paths through GameManager and asserts final state. Not intended for production — attach to a test scene or remove before release.

---

## Testing Done

Testing was script-driven via `TestGameManager.cs`. No Unity Test Runner tests; all verification is via `Debug.Log` output in Play mode.

### Primary path — exercises immediate effects only

`T1_B Monitor → T2_C Publish Advisory → T3_B Act Independently → T4_D Reassure Public → T5_C Prioritise Critical Assets → T6_B Controlled Response`

| Variable | Expected | Test result |
|----------|----------|-------------|
| Stability  | 90  | PASS |
| Resources  | 50  | PASS |
| Workload   | 40  | PASS |
| Confidence | 80  | PASS |
| IsCollapsed | false | PASS |

Path and expected values verified against `iup_path_simulator_1.py` with `--test` flag.

### Delayed effects path — exercises `RegisterDelayedEffect` and `ProcessDelayedEffects`

`T1_A Emergency Rerouting → T2_A Restore Communications → T3_B Act Independently → T4_A Launch Visible Response → T5_C Prioritise Critical Assets → T6_B Controlled Response`

| Variable | Expected | Test result |
|----------|----------|-------------|
| Stability  | 100 | PASS |
| Resources  | 0   | PASS |
| Workload   | 50  | PASS |
| Confidence | 100 | PASS |
| IsCollapsed | true | PASS |

**Note:** PHASE1.md listed expected values of `Stability=85, Resources=10, Workload=45, Confidence=80` for this path. These did not match the path simulator output. The simulator was treated as authoritative; the TestGameManager comment documents the discrepancy.

### What was not tested
- GameEventSystem.ResolveChoice (no Unit tests; exercised by TestGameManager indirectly)
- AIBehaviour confidence drift (logic is correct by inspection; no simulation test)
- TelemetryLogger file output (no automated test; verified by reading output manually is Phase 5+ work)
- EscalateModifierActive flag (set correctly in ResolveChoice; no test for downstream AI behaviour — Phase 4 work)
- T6 Follow AI pushy override (logic is correct by inspection; needs UI wiring to trigger in practice)

---

## Decisions Made During Implementation

### Turn flow order
`AdvanceTurn()` increments the counter and processes delayed effects for the new turn number *before* the player acts. A final `AdvanceTurn()` call after Turn 6's action advances past `MaxTurns` and fires `OnGameOver`. This means delayed effects always fire at the start of the turn they target, before the player's choice for that turn. Documented in TestGameManager.

### System Collapse is a passive check, not an interrupt
`IsSystemCollapsed()` is a property the session-end screen calls. The session always runs all 6 turns. This is correct per the design doc ("do not end the game early") and keeps the state machine simple.

### Delayed effects guard
`RegisterDelayedEffect` is only called in `ResolveChoice` if `delayedTurn > 0` and at least one delayed delta is non-zero. This prevents registering no-op effects that add noise to processing.

### T6 Follow AI action — condition-specific effects resolved at choice time
The T6 "Follow AI Recommendation" action has different effects for Calm and Pushy. Rather than duplicating the action or building a lookup table, `EventChoice` carries both sets of deltas (`stabilityDelta` etc. for Calm as default; `pushyStabilityDelta` etc. as override). `GameEventSystem.ResolveChoice` reads `AIBehaviour.condition` at resolution time to select which set to apply. This keeps the data model flat and the logic local to one method.

### Nullable bool serialisation
`furtherAnalysisActionMatch` is nullable (not meaningful if further analysis was never requested). Unity's `JsonUtility` does not serialise `bool?`. Resolved by storing as string `"yes"` / `"no"` / `"n/a"` in `furtherAnalysisActionMatchRaw` and exposing a `[NonSerialized]` wrapper property.

### Confidence drift seeded by participant ID
`GetCalmConfidence` uses `System.Random(participantSeed + turn)`. This guarantees the same participant always sees the same drift sequence across sessions (reproducible), and different participants see different sequences (variance). The seed value is passed in from outside — TelemetryLogger or a session controller will hold the participant ID. Not yet wired.

### xAI text stored as Inspector strings
The xAI explanation templates are `[TextArea]` serialised fields in `AIBehaviour`, not constants. This allows the text to be edited in the Unity Inspector without recompiling, which is useful for a research artefact where the exact wording may need adjustment during piloting.

### EscalateModifierActive is a public settable flag on GameManager
The T3 choice sets it via `GameManager.Instance.EscalateModifierActive = true`. The AI behaviour that reads it (halving workload gain from interruptions) is Phase 4 work. The flag is on GameManager rather than AIBehaviour so it persists independently of whether AIBehaviour is active.

### CLAUDE.md corrected
The project context file had stale variable names (`AttentionLoad`, `PublicPressure`) and an incorrect turn count ("6–8 turns"). These were corrected to match the implementation (`Workload`, `Confidence`; fixed 6 turns). The GDD still uses the old names in some places — see open questions below.

---

## Decisions Needed Before Phase 2

### 1. Unity version
`CLAUDE.md` still has a placeholder. Confirm the Unity version before any UI work begins — this affects available UI components and Canvas workflows.

### 2. Participant ID assignment
`AIBehaviour.GetCalmConfidence` and `GetXAIExplanation` take a `participantSeed` (int). `TelemetryLogger` session files are currently named by timestamp only. Before Phase 2 or 5 work, decide:
- How is participant ID assigned? (Coordinator entry, auto-increment, randomised code?)
- Where is it stored at runtime? (Likely a `SessionConfig` ScriptableObject or a `StudyManager` singleton)
- Does the session JSON need a `participant_id` field? (GDD recommends it — currently absent)

### 3. EventData ScriptableObject assets — all six turns
The data model is complete but no assets have been authored. All six turns from Turns Design v1.3 need a ScriptableObject in `Assets/Data/` with full content: three evidence reports, further analysis (text + mode), calm/pushy recommendations, ariaRecommendedChoiceIndex, all four choices with immediate and delayed deltas. This is content work, not code — but it must exist before any gameplay testing can happen.

### 4. Condition assignment — how is Calm vs Pushy set?
`AIBehaviour.condition` is a public Inspector field, currently defaulting to `Calm`. For the study, the condition must be assigned per participant (counterbalanced). Decide: Inspector setting per build? Runtime toggle at session start from a config? This has implications for build distribution and study protocol.

### 5. Does the GDD need updating?
The GDD (v1.1) still refers to "6–8 turns", "Attention Load", and "Public Pressure" — the implemented names are `Workload` and `Confidence` (6 turns fixed). It also says the Further Analysis system fires variable consequences on T3/T5 only if the player *ignores* it, but the Turns Design v1.3 specifies T3/T5 use Hallucination mode (fabricated stats) and T4 uses Contradiction. These are consistent but the GDD is vague. Worth clarifying before Phase 2 if the GDD is being submitted as a design artefact.

### 6. ai_confidence_drift_value telemetry field
The GDD recommends logging `ai_confidence_drift_value` per turn. `TelemetryLogger` does not currently capture this. It could be added to `TurnRecord` easily, but requires `AIBehaviour` to be accessible from `TelemetryLogger` (or the value passed in as a `LogTurn` parameter). Decide whether this field is needed for analysis before Phase 5.

### 7. Turn summary screen between turns
UI Design Document v1.4 section 6.2 specifies a between-turn summary screen showing variable changes. This will affect how the turn transition is orchestrated in Phase 2. Clarify: separate screen object or an overlay panel? Does it use a separate Canvas layer? Does the player dismiss it or does it auto-advance?

### 8. Post-session questionnaire
UI Design Document v1.4 section 6.3 says the questionnaire can be in-engine or external (redirect with telemetry event). This decision affects Phase 6–7 scope. If external, the in-engine flow ends at the narrative summary screen with a redirect link. If in-engine, a questionnaire scene or panel must be built.

### 9. Test scene separation
`TestGameManager.cs` is in `Assets/Scripts/Core/`. For production it should either be in an `Editor/` folder (Editor-only) or removed from the build. Decide whether to keep it as a development scene or archive it before UI work begins.

---

## Design Documents Used

| Document | Version | Used for |
|----------|---------|----------|
| `Assets/docs/PHASE1.md` | — | Phase 1 scope brief; variable starting values; turn flow; test path specification |
| `Assets/docs/gdd/infrastructure_under_pressure_gdd.md` | v1.1 | Overall architecture; variable semantics; telemetry field names; turn rhythm; trajectory archetypes |
| `Assets/docs/design/IUP_Turns_Design_v1_3.docx` | v1.3 | Full per-turn content; three-report structure; Further Analysis system and modes; delayed consequences per action; AI recommendation text; narrative tags; AI Follow Rate thresholds; System Collapse condition |
| `Assets/docs/design/IUP_UI_Design_Document_v1_4.docx` | v1.4 | xAI explanation window spec and text; calm confidence drift per-turn values; metric popup bracket names and status text; telemetry event definitions (xai_viewed, fa_window events, action source); limitations footer text |
| `Assets/docs/design/IUP_UI_Visual_Reference_v1.4.html` | v1.4 | Visual reference for UI structure — used to confirm panel layout and confirm which reports appear in which condition |
| `Assets/docs/simulation/iup_path_simulator_1.py` | v1.1 | Verified expected test path output values; corrected the PHASE1.md test path expected values |
| `Assets/docs/simulation/IUP_Path_Simulation_v1_1.xlsx` | v1.1 | Path simulation reference (used by simulator) |

---

*Phase 1 complete. Next: Phase 2 — Event system and centre panel UI.*
