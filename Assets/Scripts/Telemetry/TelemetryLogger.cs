// Phase 5 stub. Attach to a GameObject and call LogTurn() after each player action.

using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

public class TelemetryLogger : MonoBehaviour
{
    private List<TurnRecord> _records = new List<TurnRecord>();
    private string _sessionId;

    private void Awake()
    {
        _sessionId = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
    }

    public void LogTurn(int turn, string choiceText)
    {
        var gm = GameManager.Instance;
        _records.Add(new TurnRecord
        {
            turn             = turn,
            choiceText       = choiceText,
            stabilityAfter   = gm.Stability,
            resourcesAfter   = gm.Resources,
            workloadAfter    = gm.Workload,
            confidenceAfter  = gm.Confidence,
        });
    }

    public void FinalizeSession()
    {
        WriteJSON();
        WriteCSV();
    }

    private void WriteJSON()
    {
        string path = Path.Combine(Application.persistentDataPath, $"session_{_sessionId}.json");
        string json = JsonUtility.ToJson(new SessionWrapper { records = _records }, prettyPrint: true);
        File.WriteAllText(path, json);
        Debug.Log($"[TelemetryLogger] JSON saved: {path}");
    }

    private void WriteCSV()
    {
        string path = Path.Combine(Application.persistentDataPath, $"session_{_sessionId}.csv");
        var sb = new StringBuilder();
        sb.AppendLine("Turn,Choice,Stability,Resources,Workload,Confidence");
        foreach (var r in _records)
            sb.AppendLine($"{r.turn},{r.choiceText},{r.stabilityAfter},{r.resourcesAfter},{r.workloadAfter},{r.confidenceAfter}");
        File.WriteAllText(path, sb.ToString());
        Debug.Log($"[TelemetryLogger] CSV saved: {path}");
    }

    [System.Serializable]
    private class TurnRecord
    {
        public int    turn;
        public string choiceText;
        public int    stabilityAfter;
        public int    resourcesAfter;
        public int    workloadAfter;
        public int    confidenceAfter;
    }

    [System.Serializable]
    private class SessionWrapper
    {
        public List<TurnRecord> records;
    }
}
