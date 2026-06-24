<<<<<<< HEAD
// telemetry.js — all telemetry logging
// All logging goes through Telemetry.*. Never log ad-hoc.

const Telemetry = (() => {
  let _events        = [];
  let _sessionStart  = null;
  let _turnStart     = null;

  // Phase 2b counters
  let _faCount           = 0;
  let _xaiCount          = 0;
  let _consequenceCount  = 0;
  let _consequenceEvents = []; // [{turn, description}]

  // Phase 3 counters
  let _pushyAlertCount  = 0;   // pushy popup appearances
  let _t3TimeoutMs      = null; // duration of T3 timeout

  function _ts() { return Date.now(); }

  function _log(type, data) {
    _events.push({ type, ts: _ts(), ...data });
  }

  function init(participantId, condition) {
    _events       = [];
    _sessionStart = _ts();
    _turnStart    = null;
    _faCount      = 0;
    _xaiCount     = 0;
    _consequenceCount  = 0;
    _consequenceEvents = [];
    _pushyAlertCount   = 0;
    _t3TimeoutMs       = null;
    _log('session_start', { participantId, condition });
  }

  function logTurnStart(turn, vars) {
    _turnStart = _ts();
    _log('turn_start', { turn, ...vars });
  }

  // source: 'popup' | 'main_panel'
  function logAction(turn, actionId, actionName, wasAriaRec, vars, source = 'main_panel') {
    const responseTime = _turnStart ? (_ts() - _turnStart) / 1000 : null;
    const eventType = source === 'popup'
      ? 'action_selected_from_popup'
      : 'action_selected_from_main_panel';
    _log(eventType, { turn, actionId, actionName, wasAriaRec, responseTime, source, ...vars });
  }

  function logFARequested(turn, expandedContent) {
    _faCount++;
    _log('further_analysis_requested', { turn, expandedContent });
  }

  function logFAWindowOpened(turn) {
    _log('further_analysis_window_opened', { turn });
  }

  function logFAWindowClosed(turn, timeOpen) {
    _log('further_analysis_window_closed', { turn, timeOpen });
  }

  function logFAConsequenceTriggered(turn, effect) {
    _log('further_analysis_consequence_triggered', { turn, effect });
  }

  function logXAIViewed(turn) {
    _xaiCount++;
    _log('xai_viewed', { turn });
  }

  function logXAIWindowClosed(turn, timeOpen) {
    _log('xai_window_closed', { turn, timeOpen });
  }

  function logPushyPopupShown(turn, actionId) {
    _pushyAlertCount++;
    _log('pushy_popup_shown', { turn, actionId, alertCount: _pushyAlertCount });
  }

  function logPushyPopupDismissed(turn) {
    _log('ai_popup_dismissed', { turn });
  }

  function logPushyPopupActionTaken(turn, actionId) {
    _log('pushy_popup_action_taken', { turn, actionId });
  }

  function logConsequencePopupAcknowledged(turn, effects, description) {
    _consequenceCount++;
    _consequenceEvents.push({ turn, description });
    _log('consequence_acknowledged', { turn, effects, description });
  }

  function logConfidenceDrift(turn, value) {
    _log('confidence_drift', { turn, value });
  }

  function logT3Timeout(durationMs) {
    _t3TimeoutMs = durationMs;
    _log('t3_aria_timeout', { durationMs });
  }

  function exportSession() {
    const vars        = State.getVars();
    const followCount = State.getAIFollowCount();
    const bracket     = followCount >= 4 ? 'high' : followCount >= 2 ? 'medium' : 'low';
    const collapse    = State.checkCollapse();

    const ids  = new Set(State.actionLog.map(e => e.actionId));
    const tags = [];

    if (ids.has('T1_A')) tags.push('Preventative Management');
    if (ids.has('T2_A') && (ids.has('T4_A') || ids.has('T4_D'))) tags.push('Public Confidence First');
    if (ids.has('T3_A') && (ids.has('T6_D_CALM') || ids.has('T6_D_PUSHY'))) tags.push('AI Dependence');
    if (ids.has('T3_A') && ids.has('T4_B')) tags.push('Deferred Escalation');

    const COST_PRESERVING = new Set(['T1_B','T1_D','T2_B','T2_D','T3_D','T4_B','T4_D','T5_B','T5_D','T6_C']);
    const cpCount = State.actionLog.filter(e => COST_PRESERVING.has(e.actionId)).length;
    if (cpCount >= 4) tags.push('Resource Preservation');

    if (ids.has('T1_B') && ids.has('T5_A')) tags.push('Reactive Stabilisation');
    if (Object.values(vars).every(v => v >= 30)) tags.push('Controlled Recovery');
    if (collapse) tags.push('System Collapse');
    if (tags.length === 0) tags.push('Steady Management');

    const archetypeLabel = collapse ? 'System Collapse'
      : followCount >= 4 ? 'AI Dependence'
      : Object.values(vars).every(v => v >= 30) ? 'Controlled Recovery'
      : 'Steady Management';

    const session = {
      participant_id:                    State.participantId,
      condition:                         State.condition,
      session_start:                     _sessionStart,
      session_end:                       _ts(),
      screeningData:                     State.screeningData,
      finalVars:                         vars,
      systemCollapse:                    collapse,
      tags,
      archetypeLabel,
      aiFollowCount:                     followCount,
      aiFollowRate:                      { count: followCount, bracket },
      faRequestedCount:                  _faCount,
      xaiViewedCount:                    _xaiCount,
      consequenceEvents:                 _consequenceEvents,
      consequence_alerts_dismissed_total: _consequenceCount,
      pushy_alert_count:                 _pushyAlertCount,
      t3_timeout_duration_ms:            _t3TimeoutMs,
      actionLog:                         State.actionLog,
      events:                            _events,
    };

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `iup_session_${State.participantId || 'unknown'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return session;
  }

  return {
    init,
    logTurnStart,
    logAction,
    logFARequested,
    logFAWindowOpened,
    logFAWindowClosed,
    logFAConsequenceTriggered,
    logXAIViewed,
    logXAIWindowClosed,
    logPushyPopupShown,
    logPushyPopupDismissed,
    logPushyPopupActionTaken,
    logConsequencePopupAcknowledged,
    logConfidenceDrift,
    logT3Timeout,
    exportSession,
    get consequenceCount()  { return _consequenceCount; },
    get pushyAlertCount()   { return _pushyAlertCount; },
=======
/**
 * telemetry.js — Session telemetry logger.
 * Collects all events and exports as JSON at session end.
 * No external calls in this scaffold — data is downloaded as a file.
 * Replace exportSession() with a POST to your endpoint in production.
 */

const Telemetry = (() => {
  let _events   = [];
  let _turnStart = null;

  function log(type, data = {}) {
    _events.push({
      type,
      timestamp:     Date.now(),
      turn:          State.turn,
      condition:     State.condition,
      participant:   State.participantId,
      vars:          State.vars,
      ...data,
    });
  }

  return {
    startTurn() {
      _turnStart = Date.now();
      log('turn_start');
    },

    logAction(actionId, actionName, wasAIFollow) {
      log('action_selected', {
        actionId,
        actionName,
        wasAIFollow,
        responseTime: Date.now() - _turnStart,
        aiFollowCumulative: State.aiFollowCount,
      });
    },

    logFARequested(expandedReport) {
      log('further_analysis_requested', { expandedReport });
    },

    logFAWindowOpened() {
      log('further_analysis_window_opened');
    },

    logFAWindowClosed(timeOpen) {
      log('further_analysis_window_closed', { timeOpenMs: timeOpen });
    },

    logFAConsequenceTriggered(turn, effect) {
      log('further_analysis_consequence_triggered', { consequenceTurn: turn, effect });
    },

    logXAIViewed() {
      log('xai_viewed');
    },

    logAIPopupDismissed() {
      log('ai_popup_dismissed');
    },

    logConfidenceDrift(value) {
      log('aria_confidence_shown', { confidenceValue: value });
    },

    exportSession() {
      const payload = {
        participantId:  State.participantId,
        condition:      State.condition,
        sessionStart:   _events[0]?.timestamp,
        sessionEnd:     Date.now(),
        aiFollowRate:   State.getAIFollowRate(),
        actionLog:      State.actionLog,
        events:         _events,
        finalVars:      State.vars,
        systemCollapse: State.checkCollapse(),
      };

      // Download as JSON file (replace with POST in production)
      const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `IUP_${State.participantId}_${State.condition}_${Date.now()}.json`;
      a.click();

      return payload;
    },
>>>>>>> 464c21bc7439d9e29667dac0b9839d3259148ac8
  };
})();
