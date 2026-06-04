// Phase 4 stub. AI message logic is wired up here; condition assignment and
// prompt content are populated in the AI phase.

using UnityEngine;
using UnityEngine.Events;

public class AIBehaviour : MonoBehaviour
{
    public AICondition condition = AICondition.Calm;

    public UnityEvent<string> OnAIMessage;

    [Header("Calm Condition")]
    [TextArea] public string[] calmPrompts;

    [Header("Pushy Condition")]
    [TextArea] public string[] pushyPrompts;
    public float pushyInterruptDelay = 3f;

    public void OnTurnStart(int turn)
    {
        string message = condition == AICondition.Calm
            ? GetCalmMessage(turn)
            : GetPushyMessage(turn);

        if (condition == AICondition.Pushy)
            Invoke(nameof(BroadcastDelayed), pushyInterruptDelay);
        else
            OnAIMessage?.Invoke(message);
    }

    private string GetCalmMessage(int turn)
    {
        if (calmPrompts == null || calmPrompts.Length == 0) return string.Empty;
        return calmPrompts[(turn - 1) % calmPrompts.Length];
    }

    private string GetPushyMessage(int turn)
    {
        if (pushyPrompts == null || pushyPrompts.Length == 0) return string.Empty;
        return pushyPrompts[(turn - 1) % pushyPrompts.Length];
    }

    private void BroadcastDelayed()
    {
        OnAIMessage?.Invoke(GetPushyMessage(GameManager.Instance.CurrentTurn));
    }
}
