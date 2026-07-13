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

  // Phase 4b — T3 progressive report tracking
  let _t3Start         = null;
  let _t3ReportsLoaded = 0;
  let _t3WaitDuration  = null;

  // Phase 5 — duty log capture (AD-33)
  let _dutyLog = null;

  // Phase 6 — newspaper dismissal log (AD-38)
  let _newspaperLog = [];

  function _ts() { return Date.now(); }

  // Full 9-tag narrative classifier (matches path simulator exactly)
  function evaluateTags(actionLog, finalVars) {
    const tags = [];
    const ids  = new Set(actionLog.map(a => a.actionId));

    if (ids.has('T1_A')) tags.push('Preventative Management');
    if (ids.has('T2_A') && (ids.has('T4_A') || ids.has('T4_D')))
      tags.push('Public Confidence First');
    if (ids.has('T3_A') && (ids.has('T6_D_CALM') || ids.has('T6_D_PUSHY')))
      tags.push('AI Dependence');
    if (ids.has('T3_A') && ids.has('T4_B'))
      tags.push('Deferred Escalation');
    const COST_PRESERVING = new Set(['T1_B','T1_D','T2_B','T2_D','T3_D','T4_B','T4_D','T5_B','T5_D','T6_C']);
    if (actionLog.filter(a => COST_PRESERVING.has(a.actionId)).length >= 4)
      tags.push('Resource Preservation');
    if (ids.has('T1_B') && ids.has('T5_A')) tags.push('Reactive Stabilisation');
    if (Object.values(finalVars).every(v => v >= 30)) tags.push('Controlled Recovery');
    if (finalVars.stability < 20 || finalVars.resources < 10) tags.push('System Collapse');
    if (tags.length === 0) tags.push('Steady Management');

    // System Collapse sorts to front (display priority)
    const collapseIdx = tags.indexOf('System Collapse');
    if (collapseIdx > 0) { tags.splice(collapseIdx, 1); tags.unshift('System Collapse'); }
    return tags;
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
    _pushyAlertCount   = 0;
    _t3TimeoutMs       = null;
    _t3Start           = null;
    _t3ReportsLoaded   = 0;
    _t3WaitDuration    = null;
    _dutyLog           = null;
    _newspaperLog      = [];
    _log('session_start', { participantId, condition });
  }

  function logTurnStart(turn, vars) {
    _turnStart = _ts();
    _log('turn_start', { turn, ...vars });
  }

  // source: 'popup' | 'main_panel'
  function logAction(turn, actionId, actionName, wasAriaRec, vars, source = 'main_panel', timeRemaining = null) {
    const responseTime = _turnStart ? (_ts() - _turnStart) / 1000 : null;
    const eventType = source === 'popup'
      ? 'action_selected_from_popup'
      : 'action_selected_from_main_panel';
    _log(eventType, {
      turn, actionId, actionName, wasAriaRec, responseTime, source,
      timeout_fired:              false,
      time_remaining_on_action:   timeRemaining,
      ...vars,
    });
  }

  function logTurnTimerFired(turn, vars) {
    _log('turn_timeout_fired', {
      turn,
      timeout_fired:            true,
      time_remaining_on_action: 0,
      stability_delta:          TIMEOUT_CONSEQUENCE.stability_delta,
      confidence_delta:         TIMEOUT_CONSEQUENCE.public_confidence_delta,
      ...vars,
    });
  }

  function logDutyLog(text, timestamp, wordCount) {
    _dutyLog = { text, timestamp, wordCount };
    _log('duty_log_submitted', { duty_log_text: text, duty_log_timestamp: timestamp, duty_log_word_count: wordCount });
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

  function logThresholdEventAcknowledged(event) {
    _log('threshold_event_acknowledged', {
      eventId:    event.id,
      eventLabel: event.label,
      turn:       event.turn,
      vars:       event.vars,
    });
  }

  function markT3Start() {
    _t3Start = _ts();
  }

  function logT3ReportLoaded(reportNumber, timestamp) {
    _t3ReportsLoaded = reportNumber;
    _log('t3_report_loaded', { reportNumber, timestamp });
  }

  function logT3ActionTaken(reportsLoadedAtAction) {
    _t3WaitDuration = _ts() - _t3Start;
    _log('t3_action_taken', {
      t3_reports_loaded_at_action: reportsLoadedAtAction,
      t3_aria_loaded:              false,
      t3_wait_duration_ms:         _t3WaitDuration,
    });
  }

  function logBetweenTurnEventAcknowledged(gap, event, timestamp) {
    _log('between_turn_event_acknowledged', {
      event_id:                  event.id,
      event_title:               event.title,
      gap_number:                gap,
      variable_affected:         event.variable,
      effect_value:              event.effect,
      acknowledgement_timestamp: timestamp,
    });
  }

  function logNewspaperDismissed(editionId, gapNumber, timeOpenMs) {
    _newspaperLog.push({ editionId, gap: gapNumber, ms: timeOpenMs });
    _log('newspaper_dismissed', { editionId, gapNumber, timeOpenMs });
  }

  function logCommsOutcome(outcome) {
    _log('comms_turn_completed', {
      comms_mode:                           outcome.mode,
      comms_placeholder_present:            outcome.placeholderPresent,
      comms_edit_extent:                    outcome.editExtent,
      comms_consequence_fired:              outcome.consequenceFired,
      comms_confidence_impact:              outcome.confidenceImpact,
      comms_response_time:                  outcome.responseTime,
      comms_placeholder_interrogated:       outcome.comms_placeholder_interrogated,
      consequence_acknowledged_warning:     outcome.consequence_acknowledged_warning,
    });
  }

  function exportSession() {
    const vars          = State.getVars();
    const followCount   = State.getAIFollowCount();
    const bracket       = followCount >= 4 ? 'high' : followCount >= 2 ? 'medium' : 'low';
    const collapse      = State.checkCollapse();
    const narrativeTags = evaluateTags(State.actionLog, vars);
    const archetypeLabel = narrativeTags[0]; // System Collapse sorts first if present

    const session = {
      participant_id:                    State.participantId,
      condition:                         State.condition,
      session_start:                     _sessionStart,
      session_end:                       _ts(),
      screeningData:                     State.screeningData,
      finalVars:                         vars,
      systemCollapse:                    collapse,
      narrativeTags,
      tags:                              narrativeTags, // backward compat alias
      archetypeLabel,
      aiFollowCount:                     followCount,
      aiFollowRate:                      { count: followCount, bracket },
      faRequestedCount:                  _faCount,
      xaiViewedCount:                    _xaiCount,
      consequenceEvents:                 _consequenceEvents,
      consequence_alerts_dismissed_total: _consequenceCount,
      thresholdEvents:                   State.thresholdEvents,
      commsOutcome:                      State.commsOutcome,
      commsTurnTriggered:                State.commsCompleted,
      pushy_alert_count:                 _pushyAlertCount,
      // t3_timeout_duration_ms removed — t3Behaviour.waitDurationMs is the replacement
      t3Behaviour: {
        reportsLoadedAtAction:    _t3ReportsLoaded,
        waitDurationMs:           _t3WaitDuration,
        ariaLoaded:               false,
        furtherAnalysisRequested: State.wasFARequested(3),
      },
      betweenTurnEvents:                 State.betweenTurnEventLog,
      timeout_count:                     State.timeouts,
      duty_log_text:                     _dutyLog ? _dutyLog.text      : null,
      duty_log_timestamp:                _dutyLog ? _dutyLog.timestamp  : null,
      duty_log_word_count:               _dutyLog ? _dutyLog.wordCount  : null,
      aria_memory_fired:                 State.ariaMemoryFired,
      newspaper_dismissed_ms:            _newspaperLog,
      actionLog:                         State.actionLog,
      events:                            _events,
    };

    const jsonString  = JSON.stringify(session, null, 2);
    const sessionEnd  = new Date(session.session_end).toISOString();

    const templateParams = {
      participant_id:  session.participant_id || 'unknown',
      condition:       session.condition      || 'unknown',
      session_end:     sessionEnd,
      system_collapse: String(session.systemCollapse),
      narrative_tags:  session.narrativeTags.join(', '),
      json_data:       jsonString,
    };

    emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, templateParams)
      .catch(() => {
        // EmailJS failed — fall back to local download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `iup_session_${session.participant_id || 'unknown'}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });

    return session;
  }

  return {
    init,
    logTurnStart,
    logAction,
    logTurnTimerFired,
    logDutyLog,
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
    logThresholdEventAcknowledged,
    logBetweenTurnEventAcknowledged,
    logNewspaperDismissed,
    logCommsOutcome,
    markT3Start,
    logT3ReportLoaded,
    logT3ActionTaken,
    exportSession,
    get consequenceCount()  { return _consequenceCount; },
    get pushyAlertCount()   { return _pushyAlertCount; },
    get t3ReportsLoaded()   { return _t3ReportsLoaded; },
  };
})();
