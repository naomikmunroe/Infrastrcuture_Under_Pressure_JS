using UnityEngine;

[CreateAssetMenu(fileName = "NewEvent", menuName = "IUP/Event Data")]
public class EventData : ScriptableObject
{
    public string eventTitle;
    [TextArea] public string eventDescription;

    [Header("Variable Deltas")]
    public int stabilityDelta;
    public int resourcesDelta;
    public int workloadDelta;
    public int confidenceDelta;

    [Header("Player Choices")]
    public EventChoice[] choices;
}

[System.Serializable]
public class EventChoice
{
    public string choiceText;
    public int stabilityDelta;
    public int resourcesDelta;
    public int workloadDelta;
    public int confidenceDelta;
}
