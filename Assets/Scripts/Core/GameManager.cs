using System;
using System.Collections.Generic;
using UnityEngine;

public enum TurnState
{
    AwaitingAction,
    ResolvingAction,
    TurnComplete,
    GameOver
}

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public const int MaxTurns = 6;

    public int Stability  { get; private set; }
    public int Resources  { get; private set; }
    public int Workload   { get; private set; }
    public int Confidence { get; private set; }

    public int CurrentTurn { get; private set; }
    public TurnState State { get; private set; }

    public event Action OnVariablesChanged;
    public event Action OnGameOver;

    private readonly Dictionary<int, List<Dictionary<string, int>>> _pendingEffects
        = new Dictionary<int, List<Dictionary<string, int>>>();

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
        ResetSession();
    }

    public void ResetSession()
    {
        Stability   = 70;
        Resources   = 70;
        Workload    = 30;
        Confidence  = 70;
        CurrentTurn = 0;
        State       = TurnState.AwaitingAction;
        _pendingEffects.Clear();
    }

    // Increments turn, processes any delayed effects due this turn, then checks end condition.
    // Call once to begin each turn (before the player acts), then once more after turn 6's action.
    public void AdvanceTurn()
    {
        CurrentTurn++;
        State = TurnState.ResolvingAction;
        ProcessDelayedEffects(CurrentTurn);

        if (CurrentTurn > MaxTurns)
        {
            State = TurnState.GameOver;
            OnGameOver?.Invoke();
        }
        else
        {
            State = TurnState.AwaitingAction;
        }
    }

    // Applies variable deltas and clamps to [0, 100]. Only way to modify variables.
    public void ApplyEffect(Dictionary<string, int> effects)
    {
        foreach (var kv in effects)
        {
            switch (kv.Key)
            {
                case "stability":  Stability  = Mathf.Clamp(Stability  + kv.Value, 0, 100); break;
                case "resources":  Resources  = Mathf.Clamp(Resources  + kv.Value, 0, 100); break;
                case "workload":   Workload   = Mathf.Clamp(Workload   + kv.Value, 0, 100); break;
                case "confidence": Confidence = Mathf.Clamp(Confidence + kv.Value, 0, 100); break;
                default: Debug.LogWarning($"[GameManager] Unknown variable: {kv.Key}"); break;
            }
        }
        OnVariablesChanged?.Invoke();
    }

    public void RegisterDelayedEffect(int targetTurn, Dictionary<string, int> effects)
    {
        if (!_pendingEffects.TryGetValue(targetTurn, out var list))
        {
            list = new List<Dictionary<string, int>>();
            _pendingEffects[targetTurn] = list;
        }
        list.Add(effects);
    }

    public void ProcessDelayedEffects(int currentTurn)
    {
        if (!_pendingEffects.TryGetValue(currentTurn, out var effects)) return;
        foreach (var e in effects)
            ApplyEffect(e);
        _pendingEffects.Remove(currentTurn);
    }

    // System Collapse = Resources < 10 OR Stability < 20 at end of Turn 6 only.
    public bool IsSystemCollapsed() => Resources < 10 || Stability < 20;
}
