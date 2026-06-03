using UnityEngine;
using UnityEngine.Events;

public class TurnManager : MonoBehaviour
{
    public static TurnManager Instance { get; private set; }

    public int CurrentTurn { get; private set; }
    public bool SessionActive { get; private set; }

    public UnityEvent<int> OnTurnStarted;
    public UnityEvent OnSessionEnded;

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
    }

    public void StartSession()
    {
        CurrentTurn = 0;
        SessionActive = true;
        AdvanceTurn();
    }

    public void AdvanceTurn()
    {
        if (CurrentTurn >= GameManager.Instance.maxTurns)
        {
            EndSession();
            return;
        }

        CurrentTurn++;
        OnTurnStarted?.Invoke(CurrentTurn);
        AIBehaviour.Instance.OnTurnStart(CurrentTurn);
    }

    private void EndSession()
    {
        SessionActive = false;
        OnSessionEnded?.Invoke();
        TelemetryLogger.Instance.FinalizeSession();
    }
}
