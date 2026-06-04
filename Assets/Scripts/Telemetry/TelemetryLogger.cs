using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

public class TelemetryLogger : MonoBehaviour
{
    private List<TurnRecord> _records = new List<TurnRecord>();
    private List<TelemetryEvent> _events = new List<TelemetryEvent>();
    private string _sessionId;

    // Per-turn transient state — reset each turn start
    private float _turnStartTime;
    private bool _furtherAnalysisRequested;
    private bool _xaiViewed;
    private bool _actionFromPopup;
    private bool _furtherAnalysisMatchRecorded;
    private bool _furtherAnalysisActionMatch;

    private void Awake()
    {
        _sessionId = DateTime.Now.ToString("yyyyMMdd_HHmmss");
    }

    // ── Turn lifecycle ───────────────────────────────────────────────────────

    public void LogTurnStart(int turn)
    {
        _turnStartTime              = Time.time;
        _furtherAnalysisRequested   = false;
        _xaiViewed                  = false;
        _actionFromPopup            = false;
        _furtherAnalysisMatchRecorded = false;
        _furtherAnalysisActionMatch = false;
    }

    // Call after the action is resolved and variables are updated.
    // aiFollowed: true if the chosen action matched EventChoice.isAriaRecommended
    public void LogTurn(int turn, string choiceText, bool aiFollowed)
    {
        var gm = GameManager.Instance;
        _records.Add(new TurnRecord
        {
            turn                        = turn,
            choiceText                  = choiceText,
            aiFollowed                  = aiFollowed,
            furtherAnalysisRequested    = _furtherAnalysisRequested,
            furtherAnalysisActionMatch  = _furtherAnalysisMatchRecorded ? _furtherAnalysisActionMatch : (bool?)null,
            xaiViewed                   = _xaiViewed,
            actionFromPopup             = _actionFromPopup,
            responseTimeSeconds         = Time.time - _turnStartTime,
            stabilityAfter              = gm.Stability,
            resourcesAfter              = gm.Resources,
            workloadAfter               = gm.Workload,
            confidenceAfter             = gm.Confidence,
        });
    }

    // ── Discrete event loggers ───────────────────────────────────────────────

    public void LogFurtherAnalysisRequested(int turn)
    {
        _furtherAnalysisRequested = true;
        AddEvent("further_analysis_requested", turn);
    }

    public void LogFurtherAnalysisWindowOpened(int turn)
    {
        AddEvent("fa_window_opened", turn);
    }

    public void LogFurtherAnalysisWindowClosed(int turn, float secondsOpen)
    {
        AddEvent("fa_window_closed", turn, value: secondsOpen);
    }

    // matched: true if the action chosen is consistent with the further analysis content
    public void LogFurtherAnalysisActionMatch(int turn, bool matched)
    {
        _furtherAnalysisMatchRecorded = true;
        _furtherAnalysisActionMatch   = matched;
        AddEvent("fa_action_match", turn, flag: matched);
    }

    // T3 and T5 only — variable consequence fired from further analysis content
    public void LogVariableConsequenceTriggered(int turn)
    {
        AddEvent("variable_consequence_triggered", turn);
    }

    public void LogXAIViewed(int turn)
    {
        _xaiViewed = true;
        AddEvent("xai_viewed", turn);
    }

    // secondsSincePopup: elapsed time between popup appearing and the × being clicked
    public void LogAIPopupDismissed(int turn, float secondsSincePopup)
    {
        AddEvent("ai_popup_dismissed", turn, value: secondsSincePopup);
    }

    // fromPopup: action was selected via the pushy popup shortcut button (not the main panel)
    public void LogActionSource(int turn, bool fromPopup)
    {
        _actionFromPopup = fromPopup;
        AddEvent(fromPopup ? "action_from_popup" : "action_from_main_panel", turn);
    }

    // ── Session output ───────────────────────────────────────────────────────

    public void FinalizeSession()
    {
        WriteJSON();
        WriteCSV();
    }

    private void WriteJSON()
    {
        var wrapper = new SessionWrapper { records = _records, events = _events };
        string path = Path.Combine(Application.persistentDataPath, $"session_{_sessionId}.json");
        File.WriteAllText(path, JsonUtility.ToJson(wrapper, prettyPrint: true));
        Debug.Log($"[TelemetryLogger] JSON saved: {path}");
    }

    private void WriteCSV()
    {
        string path = Path.Combine(Application.persistentDataPath, $"session_{_sessionId}.csv");
        var sb = new StringBuilder();
        sb.AppendLine("Turn,Choice,AIFollowed,FurtherAnalysis,FAActionMatch,XAIViewed,ActionFromPopup,ResponseTimeSec,Stability,Resources,Workload,Confidence");
        foreach (var r in _records)
        {
            string faMatch = r.furtherAnalysisActionMatch.HasValue
                ? (r.furtherAnalysisActionMatch.Value ? "yes" : "no")
                : "n/a";
            sb.AppendLine(
                $"{r.turn},{Escape(r.choiceText)},{B(r.aiFollowed)},{B(r.furtherAnalysisRequested)}," +
                $"{faMatch},{B(r.xaiViewed)},{B(r.actionFromPopup)},{r.responseTimeSeconds:F1}," +
                $"{r.stabilityAfter},{r.resourcesAfter},{r.workloadAfter},{r.confidenceAfter}");
        }
        File.WriteAllText(path, sb.ToString());
        Debug.Log($"[TelemetryLogger] CSV saved: {path}");
    }

    private void AddEvent(string type, int turn, float value = 0f, bool flag = false)
    {
        _events.Add(new TelemetryEvent
        {
            type      = type,
            turn      = turn,
            timestamp = Time.time,
            value     = value,
            flag      = flag,
        });
    }

    private static string B(bool b) => b ? "1" : "0";
    private static string Escape(string s) => s?.Replace(",", ";") ?? string.Empty;

    // ── Data types ───────────────────────────────────────────────────────────

    [Serializable]
    private class TurnRecord
    {
        public int    turn;
        public string choiceText;
        public bool   aiFollowed;
        public bool   furtherAnalysisRequested;
        // Serialized as string because JsonUtility can't serialize nullable bool
        public string furtherAnalysisActionMatchRaw;
        public bool   xaiViewed;
        public bool   actionFromPopup;
        public float  responseTimeSeconds;
        public int    stabilityAfter;
        public int    resourcesAfter;
        public int    workloadAfter;
        public int    confidenceAfter;

        // Convenience wrapper — not serialized directly
        [NonSerialized] public bool? furtherAnalysisActionMatch
        {
            set => furtherAnalysisActionMatchRaw = value.HasValue ? (value.Value ? "yes" : "no") : "n/a";
            get
            {
                if (furtherAnalysisActionMatchRaw == "yes") return true;
                if (furtherAnalysisActionMatchRaw == "no")  return false;
                return null;
            }
        }
    }

    [Serializable]
    private class TelemetryEvent
    {
        public string type;
        public int    turn;
        public float  timestamp;
        public float  value; // seconds open, seconds since popup, etc.
        public bool   flag;  // fa_action_match result
    }

    [Serializable]
    private class SessionWrapper
    {
        public List<TurnRecord>    records;
        public List<TelemetryEvent> events;
    }
}
