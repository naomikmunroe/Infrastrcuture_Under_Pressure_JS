// telemetry.js — all telemetry logging
// All logging goes through Telemetry.*. Never log ad-hoc.

const Telemetry = (() => {
  let _events        = [];
  let _sessionStart  = null;
  let _turnStart     = null;

  // Session-level counters (Phase 2b)
  let _faCount           = 0;
  let _xaiCount          = 0;
  let _consequenceCount  = 0;
  let _consequenceEvents = []; // [{turn, description}]

  function _ts() {
    return Date.now();
  }

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
    _log('session_start', { participantId, condition });
  }

  function logTurnStart(turn, vars) {
    _turnStart = _ts();
    _log('turn_start', { turn, ...vars });
  }

  function logAction(turn, actionId, actionName, wasAriaRec, vars) {
    const responseTime = _turnStart ? (_ts() - _turnStart) / 1000 : null;
    _log('action_selected', { turn, actionId, actionName, wasAriaRec, responseTime, ...vars });
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
    _log('pushy_popup_shown', { turn, actionId });
  }

  function logPushyPopupDismissed(turn) {
    _log('pushy_popup_dismissed', { turn });
  }

  function logPushyPopupActionTaken(turn, actionId) {
    _log('pushy_popup_action_taken', { turn, actionId });
  }

  function logConsequencePopupAcknowledged(turn, effects, description) {
    _consequenceCount++;
    _consequenceEvents.push({ turn, description });
    _log('consequence_acknowledged', { turn, effects, description });
  }

  function exportSession() {
    const vars       = State.getVars();
    const followCount = State.getAIFollowCount();
    const bracket = followCount >= 4 ? 'high' : followCount >= 2 ? 'medium' : 'low';
    const collapse   = State.checkCollapse();

    // Evaluate trajectory tag (matches path simulator logic)
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
      finalVars:                         vars,
      systemCollapse:                    collapse,
      tags,
      archetypeLabel,
      aiFollowCount:                     followCount,
      aiFollowRate: { count: followCount, bracket },
      faRequestedCount:                  _faCount,
      xaiViewedCount:                    _xaiCount,
      consequenceEvents:                 _consequenceEvents,
      consequence_alerts_dismissed_total: _consequenceCount,
      actionLog:                         State.actionLog,
      events:                            _events,
    };

    // Download JSON file
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
    exportSession,
    get consequenceCount() { return _consequenceCount; },
  };
})();
