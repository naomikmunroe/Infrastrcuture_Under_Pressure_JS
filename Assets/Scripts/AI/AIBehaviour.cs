using UnityEngine;
using UnityEngine.Events;

public class AIBehaviour : MonoBehaviour
{
    public AICondition condition = AICondition.Calm;

    public UnityEvent<string> OnAIMessage;

    [Header("Calm Condition — Per-Turn Prompts (indices 0–5)")]
    [TextArea] public string[] calmPrompts;

    [Header("Pushy Condition — Per-Turn Prompts (indices 0–5)")]
    [TextArea] public string[] pushyPrompts;
    public float pushyInterruptDelay = 3f;

    // xAI explanation templates — {0} is replaced with the confidence percentage
    [Header("xAI Explanation Text")]
    [TextArea] public string calmXAITemplate =
        "ARIA CONFIDENCE ASSESSMENT\n" +
        "Current confidence: {0}%\n\n" +
        "Basis for assessment:\n" +
        "· Pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).\n" +
        "· Current variable state weighted against comparable incident profiles.\n" +
        "· Weighting applied to recent incident outcomes (last 24 months).\n\n" +
        "Dataset note: training corpus excludes incidents occurring after December 2023. " +
        "Novel failure modes introduced post-2023 are not represented in this assessment.\n\n" +
        "Confidence reflects pattern similarity, not causal certainty. " +
        "Operator judgement should supplement this assessment.";

    [TextArea] public string pushyXAITemplate =
        "ARIA CONFIDENCE ASSESSMENT\n" +
        "Current confidence: {0}%\n\n" +
        "Basis for assessment:\n" +
        "· Strong pattern match against 847 historical infrastructure incidents (GRIDHUB archive, 2009–2023).\n" +
        "· Current variable state exceeds risk threshold in 91% of comparable incidents.\n" +
        "· Recent incident weighting confirms elevated risk classification.\n\n" +
        "Dataset note: training corpus excludes incidents occurring after December 2023. " +
        "Novel failure modes introduced post-2023 are not represented in this assessment.\n\n" +
        "HIGH CONFIDENCE. IMMEDIATE ACTION IS ADVISED.";

    // Calm confidence drift — base values and noise ranges per turn (indices 0–5 = T1–T6)
    private static readonly int[] CalmConfidenceBases  = { 48, 55, 41, 62, 58, 51 };
    private static readonly int[] CalmConfidenceNoise  = {  3,  4,  5,  3,  4,  5 };
    private static readonly string[] CalmConfidenceQualifiers =
    {
        "low certainty",
        "moderate certainty",
        "low certainty — analysis degraded",
        "moderate certainty",
        "moderate certainty",
        "uncertain — multiple factors"
    };

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

    // Returns the xAI explanation with the confidence value substituted in.
    public string GetXAIExplanation(int turn, int participantSeed)
    {
        if (condition == AICondition.Calm)
        {
            int confidence = GetCalmConfidenceValue(turn, participantSeed);
            return string.Format(calmXAITemplate, confidence);
        }
        return string.Format(pushyXAITemplate, 88); // pushy confidence is always fixed above 80
    }

    // Returns (value, qualifier) for the calm confidence bar this turn.
    // Seeded by participant ID so the same session always produces the same drift sequence.
    public (int value, string qualifier) GetCalmConfidence(int turn, int participantSeed)
    {
        int value = GetCalmConfidenceValue(turn, participantSeed);
        int idx = TurnIndex(turn);
        return (value, CalmConfidenceQualifiers[idx]);
    }

    private int GetCalmConfidenceValue(int turn, int participantSeed)
    {
        int idx = TurnIndex(turn);
        var rng = new System.Random(participantSeed + turn);
        int noise = rng.Next(-CalmConfidenceNoise[idx], CalmConfidenceNoise[idx] + 1);
        return Mathf.Clamp(CalmConfidenceBases[idx] + noise, 0, 100);
    }

    private static int TurnIndex(int turn) => Mathf.Clamp(turn - 1, 0, 5);

    private string GetCalmMessage(int turn)
    {
        if (calmPrompts == null || calmPrompts.Length == 0) return string.Empty;
        return calmPrompts[TurnIndex(turn)];
    }

    private string GetPushyMessage(int turn)
    {
        if (pushyPrompts == null || pushyPrompts.Length == 0) return string.Empty;
        return pushyPrompts[TurnIndex(turn)];
    }

    private void BroadcastDelayed()
    {
        OnAIMessage?.Invoke(GetPushyMessage(GameManager.Instance.CurrentTurn));
    }
}
