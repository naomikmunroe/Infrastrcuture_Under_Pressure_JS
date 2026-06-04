using UnityEngine;

public enum FurtherAnalysisMode { Vague, Hallucination, Contradiction, Useful }

[CreateAssetMenu(fileName = "NewEvent", menuName = "IUP/Event Data")]
public class EventData : ScriptableObject
{
    [Header("Incident")]
    public string eventTitle;
    public string sectorSubtitle;
    [TextArea] public string eventDescription;
    public string priority; // "HIGH" or "CRITICAL"

    [Header("Evidence Reports")]
    public EvidenceReport technicalReport;
    public EvidenceReport operationsReport;
    public EvidenceReport riskAssessment;

    [Header("Further Analysis")]
    public FurtherAnalysis furtherAnalysis;

    [Header("AI Recommendations")]
    [TextArea] public string calmRecommendation;
    [TextArea] public string pushyRecommendation;
    // 0-based index into choices[] — which choice ARIA recommends
    public int ariaRecommendedChoiceIndex;

    [Header("Player Choices")]
    public EventChoice[] choices;

    [Header("Narrative")]
    public string narrativeTag;
}

[System.Serializable]
public class EvidenceReport
{
    public string label;      // e.g. "TECHNICAL REPORT — Systems Engineering"
    public string timestamp;  // e.g. "08:17"
    [TextArea] public string body;
}

[System.Serializable]
public class FurtherAnalysis
{
    // Which report this expands, e.g. "Risk Assessment"
    public string expandedReportLabel;
    public FurtherAnalysisMode mode;
    [TextArea] public string content;
}

[System.Serializable]
public class EventChoice
{
    public string choiceText;
    public string immediateEffectDisplay; // e.g. "Resources −10, Confidence +15"
    public string futureRiskDisplay;      // e.g. "reduced emergency capacity"

    [Header("Immediate Deltas")]
    public int stabilityDelta;
    public int resourcesDelta;
    public int workloadDelta;
    public int confidenceDelta;

    // Delayed effect — fires at delayedTurn (0 = none)
    [Header("Delayed Effect")]
    public int delayedTurn;
    public int delayedStabilityDelta;
    public int delayedResourcesDelta;
    public int delayedWorkloadDelta;
    public int delayedConfidenceDelta;

    // T6 "Follow AI Recommendation" only — pushy condition uses these instead of the main deltas
    [Header("Pushy Condition Override (Follow AI only)")]
    public bool isFollowAIAction;
    public int pushyStabilityDelta;
    public int pushyResourcesDelta;
    public int pushyWorkloadDelta;
    public int pushyConfidenceDelta;

    [Header("Flags")]
    public bool isAriaRecommended;
    // T3 "Escalate Infrastructure Support" — halves workload gain from AI interrupts for remainder of session
    public bool activatesEscalateModifier;
}
