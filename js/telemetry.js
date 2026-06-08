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
  };
})();
