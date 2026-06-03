using UnityEngine;

[CreateAssetMenu(fileName = "NewEvent", menuName = "IUP/Event Data")]
public class EventData : ScriptableObject
{
    public string eventTitle;
    [TextArea] public string eventDescription;

    [Header("Variable Deltas")]
    public float stabilityDelta;
    public float resourcesDelta;
    public float attentionDelta;
    public float pressureDelta;

    [Header("Player Choices")]
    public EventChoice[] choices;
}

[System.Serializable]
public class EventChoice
{
    public string choiceText;
    public float stabilityDelta;
    public float resourcesDelta;
    public float attentionDelta;
    public float pressureDelta;
}
