// turns.js — turn loading and action selection handler

const Turns = (() => {

  let _currentTurnData   = null;
  let _currentConfidence = 0;

  // Queue of consequence popups to show before loading next turn
  let _pendingConsequences = [];

  // Whether the pushy popup was dismissed (so main-panel action logs correctly)
  let _pushyPopupDismissed = false;

  // Stored callback to resume turn loading after comms screen
  let _pendingTurnLoad = null;

  // Token to cancel stale T3 progressive-load callbacks when a new turn starts
  let _loadToken = 0;

  // How many T3 reports have loaded so far this turn (for telemetry at action time)
  let _t3ReportsLoaded = 0;

  // ── Listen for consequence events from State ─────────────────────
  document.addEventListener('consequenceFired', e => {
    _pendingConsequences.push(e.detail);
  });

  // ── Listen for threshold events from State (AD-25) ────────────────
  document.addEventListener('thresholdEvent', e => {
    UI.showConsequencePopup(e.detail, () => {
      Telemetry.logThresholdEventAcknowledged(e.detail);
    });
  });

  // ── Listen for variable changes ──────────────────────────────────
  document.addEventListener('varsChanged', () => {
    UI.updateVarBars();
  });

  // ── Sleep helper ─────────────────────────────────────────────────
  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── Turn load delay: spinner + wait (not used for T3 — handled separately) ──
  async function _turnLoadDelay(turnIndex) {
    const isPushy = State.condition === 'pushy';
    if (isPushy) {
      UI.showCentreSpinner('pushy');
      await _sleep(6000 + Math.random() * 2000);
      UI.hideCentreSpinner();
    } else {
      UI.showCentreSpinner('calm');
      await _sleep(3000 + Math.random() * 1000);
      UI.hideCentreSpinner();
    }
  }

  // ── Load a turn ─────────────────────────────────────────────────
  // ── Comms turn check (AD-26) ─────────────────────────────────────
  function checkCommsRequired() {
    if (State.turn >= 3 && State.turn <= 4 &&
        State.confidence < 35 &&
        !State.commsCompleted) {
      State.setCommsRequired();
      Main.showCommsScreen();
      return true;
    }
    return false;
  }

  function resumeAfterComms() {
    if (_pendingTurnLoad) {
      const fn = _pendingTurnLoad;
      _pendingTurnLoad = null;
      fn();
    }
  }

  async function loadTurn(turnIndex) {  // 0-based (0–5)
    const token = ++_loadToken;
    _pendingConsequences  = [];
    _pushyPopupDismissed  = false;
    _pendingTurnLoad      = null;
    _t3ReportsLoaded      = 0;

    UI.closeFAWindow();
    UI.closeXAIWindow();
    UI.clearTaskbarFAItem();
    UI.clearNotificationStack();

    const turnData = TURNS_DATA[turnIndex];
    _currentTurnData = turnData;

    const cond = State.condition;
    if (cond === 'calm') {
      _currentConfidence = State.getConfidenceDrift(turnIndex);
    } else {
      _currentConfidence = State.getPushyConfidence(turnIndex);
    }

    const overlay = document.getElementById('pushy-overlay');
    if (overlay) overlay.classList.toggle('active', cond === 'pushy');

    if (turnIndex === 2) {
      // T3: two parallel systems — progressive reports + ARIA degradation
      Telemetry.markT3Start();

      const staleConf = cond === 'calm'
        ? State.getConfidenceDrift(1)
        : State.getPushyConfidence(1);

      UI.renderIncidentT3Start(turnData);
      UI.renderActionsLocked(turnData);
      UI.showARIADegraded(staleConf);
      UI.updateVarBars();
      UI.updateTurnCounter(State.turn);
      UI.updateTurnLog(State.turnLog, State.turn);

      Telemetry.logTurnStart(State.turn, State.getVars());
      Telemetry.logConfidenceDrift(State.turn, _currentConfidence);

      _loadTurnT3ARIA(token);                        // fire and forget
      await _loadTurnT3Reports(token, turnData);     // progressive reports

    } else {
      // All other turns: spinner delay then full render
      await _turnLoadDelay(turnIndex);

      UI.renderIncident(turnData);
      UI.renderActions(turnData);
      UI.renderARIA(turnData, _currentConfidence);
      UI.updateVarBars();
      UI.updateTurnCounter(State.turn);
      UI.updateTurnLog(State.turnLog, State.turn);

      Telemetry.logTurnStart(State.turn, State.getVars());
      Telemetry.logConfidenceDrift(State.turn, _currentConfidence);

      if (cond === 'pushy') {
        setTimeout(() => {
          if (_loadToken !== token) return;
          UI.showPushyPopup(turnData, actionId => {
            const action = turnData.actions.find(a => a.id === actionId);
            if (action) handleActionSelect(action, { fromPopup: true });
          }, () => {
            _pushyPopupDismissed = true;
          });

          setTimeout(() => {
            if (_loadToken !== token) return;
            if (!document.getElementById('pushy-popup')) return;
            const brief = turnData.aria.pushy.popupBody.slice(0, 60) + '…';
            UI.addStackNotification(brief);
          }, 12000);
        }, 800);
      }
    }
  }

  // T3 System 1: progressive report loading
  async function _loadTurnT3Reports(token, turnData) {
    await _sleep(3000);
    if (_loadToken !== token) return;
    UI.appendReport(turnData, 0);       // Technical Report
    UI.unlockActions();
    _t3ReportsLoaded = 1;
    Telemetry.logT3ReportLoaded(1, Date.now());

    await _sleep(4000);                 // 7s total
    if (_loadToken !== token) return;
    UI.appendReport(turnData, 1);       // Operations Report
    _t3ReportsLoaded = 2;
    Telemetry.logT3ReportLoaded(2, Date.now());

    await _sleep(4000);                 // 11s total
    if (_loadToken !== token) return;
    UI.appendReportPartial(turnData, 2); // Risk Assessment — partial
    _t3ReportsLoaded = 3;
    Telemetry.logT3ReportLoaded(3, Date.now());

    await _sleep(3000);                 // 14s total
    if (_loadToken !== token) return;
    UI.updateReportToTimeout();         // Risk Assessment timeout
  }

  // T3 System 2: ARIA degradation background behaviour (pushy only)
  async function _loadTurnT3ARIA(token) {
    if (State.condition !== 'pushy') return;
    await _sleep(8000);
    if (_loadToken !== token) return;
    UI.addStackNotification('⚠ ARIA: UNABLE TO COMPLETE ANALYSIS — act on available data');
  }

  // ── Action selection ─────────────────────────────────────────────
  // fromPopup: action came from the pushy popup button (not main panel)
  function handleActionSelect(action, { fromPopup = false } = {}) {
    UI.removePushyPopup();
    UI.closeFAWindow();
    UI.closeXAIWindow();

    document.querySelectorAll('.action-btn').forEach(b => b.disabled = true);

    const cond     = State.condition;
    const isAriaRec = action.isAriaRec[cond];
    const turnData  = _currentTurnData;
    const turn      = State.turn;

    State.applyEffects(action.immediateEffects);

    for (const [targetTurn, delayData] of Object.entries(action.delayed)) {
      State.registerDelay(Number(targetTurn), delayData.effects, delayData.description);
    }

    if (action.modifier === 'halve_workload_gain') {
      State.setHalveWorkload();
    }

    // FA consequence check
    const fa = turnData.fa;
    if (fa.consequence &&
        State.wasFARequested(turn) &&
        action.id === fa.consequence.consequenceAction) {
      State.registerDelay(
        fa.consequence.consequenceTurn,
        fa.consequence.consequenceEffect,
        fa.consequence.consequenceDescription
      );
      Telemetry.logFAConsequenceTriggered(turn, fa.consequence.consequenceEffect);
    }

    State.logAction(action.id, action.name, isAriaRec);
    const source = fromPopup ? 'popup' : 'main_panel';
    Telemetry.logAction(turn, action.id, action.name, isAriaRec, State.getVars(), source);

    if (turn === 3) {
      Telemetry.logT3ActionTaken(_t3ReportsLoaded);
    }

    UI.updateTurnLog(State.turnLog, State.turn);

    if (turn < 6) {
      State.advanceTurn();
      _drainConsequences(() => {
        if (checkCommsRequired()) {
          _pendingTurnLoad = () => loadTurn(State.turn - 1);
          return;
        }
        loadTurn(State.turn - 1);
      });
    } else {
      Main.showSummary();
    }
  }

  // Show queued consequences one at a time; call done() when cleared
  function _drainConsequences(done) {
    if (_pendingConsequences.length === 0) { done(); return; }
    const detail = _pendingConsequences.shift();
    UI.showConsequencePopup(detail, () => _drainConsequences(done));
  }

  // ── Further Analysis request ─────────────────────────────────────
  function handleFARequest() {
    const turnData = _currentTurnData;
    const turn     = State.turn;

    State.applyEffects({ workload: 3 });
    State.setFARequested(turn);
    Telemetry.logFARequested(turn, turnData.fa.content);

    const btn = document.getElementById('btn-fa');
    if (btn) {
      btn.disabled    = true;
      btn.textContent = turnData.fa.retrievingLabel;
    }

    const delay = 1500 + Math.random() * 500;
    setTimeout(() => UI.showFAWindow(turnData), delay);
  }

  // ── xAI request ──────────────────────────────────────────────────
  function handleXAIRequest() {
    Telemetry.logXAIViewed(State.turn);
    UI.showXAIWindow(_currentTurnData, _currentConfidence);
  }

  return {
    loadTurn,
    handleActionSelect,
    handleFARequest,
    handleXAIRequest,
    resumeAfterComms,
  };
})();
