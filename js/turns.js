// turns.js — turn loading and action selection handler

const Turns = (() => {

  let _currentTurnData   = null;
  let _currentConfidence = 0;

  // Queue of consequence popups to show before loading next turn
  let _pendingConsequences = [];

  // Whether the pushy popup was dismissed (so main-panel action logs correctly)
  let _pushyPopupDismissed = false;

  // ── Listen for consequence events from State ─────────────────────
  document.addEventListener('consequenceFired', e => {
    _pendingConsequences.push(e.detail);
  });

  // ── Listen for variable changes ──────────────────────────────────
  document.addEventListener('varsChanged', () => {
    UI.updateVarBars();
  });

  // ── Sleep helper ─────────────────────────────────────────────────
  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── T3 extended timeout — both conditions identically ────────────
  async function _t3ExtendedTimeout() {
    UI.showCentreSpinner('T3');
    const start = Date.now();
    await _sleep(12000 + Math.random() * 3000);
    Telemetry.logT3Timeout(Date.now() - start);
    UI.hideCentreSpinner();
  }

  // ── Turn load delay: spinner + wait ──────────────────────────────
  async function _turnLoadDelay(turnIndex) {
    const isPushy = State.condition === 'pushy';
    if (turnIndex === 2) {
      await _t3ExtendedTimeout();
    } else if (isPushy) {
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
  async function loadTurn(turnIndex) {  // 0-based (0–5)
    _pendingConsequences  = [];
    _pushyPopupDismissed  = false;

    // Clean up floating windows and taskbar items from previous turn
    UI.closeFAWindow();
    UI.closeXAIWindow();
    UI.clearTaskbarFAItem();
    UI.clearNotificationStack();

    // Turn load delay (shows spinner in centre panel)
    await _turnLoadDelay(turnIndex);

    const turnData = TURNS_DATA[turnIndex];
    _currentTurnData = turnData;

    const cond = State.condition;
    if (cond === 'calm') {
      _currentConfidence = State.getConfidenceDrift(turnIndex);
    } else {
      _currentConfidence = State.getPushyConfidence(turnIndex);
    }

    // Pushy overlay
    const overlay = document.getElementById('pushy-overlay');
    if (overlay) overlay.classList.toggle('active', cond === 'pushy');

    // Render all panels
    UI.renderIncident(turnData);
    UI.renderActions(turnData);
    UI.renderARIA(turnData, _currentConfidence);
    UI.updateVarBars();
    UI.updateTurnCounter(State.turn);
    UI.updateTurnLog(State.turnLog, State.turn);

    // Log turn start (after content renders so response_time is time-on-screen)
    Telemetry.logTurnStart(State.turn, State.getVars());
    Telemetry.logConfidenceDrift(State.turn, _currentConfidence);

    // Pushy: popup after 0.8s so player sees incident first
    if (cond === 'pushy') {
      setTimeout(() => {
        UI.showPushyPopup(turnData, actionId => {
          const action = turnData.actions.find(a => a.id === actionId);
          if (action) handleActionSelect(action, { fromPopup: true });
        }, () => {
          // dismiss callback
          _pushyPopupDismissed = true;
        });

        // Notification stack: if popup still showing after 12s
        setTimeout(() => {
          if (!document.getElementById('pushy-popup')) return;
          const brief = turnData.aria.pushy.popupBody.slice(0, 60) + '…';
          UI.addStackNotification(brief);
        }, 12000);
      }, 800);
    }
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
    // Log with source: popup or main panel
    const source = fromPopup ? 'popup' : 'main_panel';
    Telemetry.logAction(turn, action.id, action.name, isAriaRec, State.getVars(), source);

    UI.updateTurnLog(State.turnLog, State.turn);

    if (turn < 6) {
      State.advanceTurn();
      _drainConsequences(() => loadTurn(State.turn - 1));
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
  };
})();
