using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

public class TelemetryLogger : MonoBehaviour
{
    public static TelemetryLogger Instance { get; private set; }

    private List<TurnRecord> records = new();
    private string sessionId;

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        sessionId = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
    }

    public void LogTurn(int turn, EventChoice choice)
    {
        records.Add(new TurnRecord
        {
            turn = turn,
            aiCondition = AIBehaviour.Instance.condition.ToString(),
            choiceText = choice.choiceText,
            stabilityAfter = VariableState.Instance.SystemStability,
            resourcesAfter = VariableState.Instance.ResourceReserves,
            attentionAfter = VariableState.Instance.AttentionLoad,
            pressureAfter = VariableState.Instance.PublicPressure
        });
    }

    public void FinalizeSession()
    {
        WriteJSON();
        WriteCSV();
    }

    private void WriteJSON()
    {
        string path = Path.Combine(Application.persistentDataPath, $"session_{sessionId}.json");
        string json = JsonUtility.ToJson(new SessionWrapper { records = records }, prettyPrint: true);
        File.WriteAllText(path, json);
        Debug.Log($"Telemetry JSON saved: {path}");
    }

    private void WriteCSV()
    {
        string path = Path.Combine(Application.persistentDataPath, $"session_{sessionId}.csv");
        var sb = new StringBuilder();
        sb.AppendLine("Turn,AICondition,Choice,Stability,Resources,Attention,Pressure");
        foreach (var r in records)
            sb.AppendLine($"{r.turn},{r.aiCondition},{r.choiceText},{r.stabilityAfter},{r.resourcesAfter},{r.attentionAfter},{r.pressureAfter}");
        File.WriteAllText(path, sb.ToString());
        Debug.Log($"Telemetry CSV saved: {path}");
    }

    [System.Serializable]
    private class TurnRecord
    {
        public int turn;
        public string aiCondition;
        public string choiceText;
        public float stabilityAfter;
        public float resourcesAfter;
        public float attentionAfter;
        public float pressureAfter;
    }

    [System.Serializable]
    private class SessionWrapper
    {
        public List<TurnRecord> records;
    }
}
