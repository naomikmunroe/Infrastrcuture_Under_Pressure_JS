using UnityEngine;
using UnityEngine.Events;

public class GameEventSystem : MonoBehaviour
{
    public static GameEventSystem Instance { get; private set; }

    public EventData[] eventPool;

    public UnityEvent<EventData> OnEventTriggered;
    public UnityEvent<EventChoice> OnChoiceMade;

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
    }

    public void TriggerEvent(EventData eventData)
    {
        OnEventTriggered?.Invoke(eventData);
    }

    public void ResolveChoice(EventChoice choice)
    {
        VariableState.Instance.ApplyDelta(
            choice.stabilityDelta,
            choice.resourcesDelta,
            choice.attentionDelta,
            choice.pressureDelta
        );

        TelemetryLogger.Instance.LogTurn(TurnManager.Instance.CurrentTurn, choice);
        OnChoiceMade?.Invoke(choice);
        TurnManager.Instance.AdvanceTurn();
    }
}
