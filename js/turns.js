// turns.js — turn loading and action selection handler

const Turns = (() => {

  let _currentTurnData = null;
  let _currentConfidence = 0;
  let _faWindowOpen    = false;
  let _xaiWindowOpen   = false;

  // Queue of consequence popups to show sequentially before loading next turn
  let _pendingConsequences = [];
  let _pendingNextTurn     = null;

  // ── Listen for consequence events from State ─────────────────────
  document.addEventListener('consequenceFired', e => {
    _pendingConsequences.push(e.detail);
  });

  // ── Listen for variable changes ──────────────────────────────────
  document.addEventListener('varsChanged', () => {
    UI.updateVarBars();
  });

  // ── Load a turn ─────────────────────────────────────────────────
  function loadTurn(turnIndex) {  // turnIndex = 0-based (0–5)
    _pendingConsequences = [];
    _faWindowOpen    = false;
    _xaiWindowOpen   = false;

    // Clean up floating windows and taskbar items from previous turn
    UI.closeFAWindow();
    UI.closeXAIWindow();
    UI.clearTaskbarFAItem();

    const turnData = TURNS_DATA[turnIndex];
    _currentTurnData = turnData;

    // Reset FA button state
    const fa = turnData.fa;
    _resetFAButton(fa);

    // Compute ARIA confidence
    const cond = State.condition;
    if (cond === 'calm') {
      _currentConfidence = State.getConfidenceDrift(turnIndex);
    } else {
      _currentConfidence = State.getPushyConfidence(turnIndex);
    }

    // Render all panels
    UI.renderIncident(turnData);
    UI.renderActions(turnData);
    UI.renderARIA(turnData, _currentConfidence);
    UI.updateVarBars();
    UI.updateTurnCounter(State.turn);
    UI.updateTurnLog(State.turnLog, State.turn);

    // Telemetry
    Telemetry.logTurnStart(State.turn, State.getVars());

    // Pushy popup on every turn
    if (cond === 'pushy') {
      UI.showPushyPopup(turnData, actionId => {
        const action = turnData.actions.find(a => a.id === actionId);
        if (action) handleActionSelect(action);
      });
    }
  }

  function _resetFAButton(fa) {
    // Button state reset happens inside renderIncident; this handles re-render
    // Nothing needed here — renderIncident always recreates the button fresh
  }

  // ── Action selection ─────────────────────────────────────────────
  function handleActionSelect(action) {
    UI.removePushyPopup();
    UI.closeFAWindow();
    UI.closeXAIWindow();

    // Disable all action buttons to prevent double-click
    document.querySelectorAll('.action-btn').forEach(b => b.disabled = true);

    const cond     = State.condition;
    const isAriaRec = action.isAriaRec[cond];
    const turnData  = _currentTurnData;
    const turn      = State.turn;

    // Apply immediate effects
    State.applyEffects(action.immediateEffects);

    // Register delayed effects
    for (const [targetTurn, delayData] of Object.entries(action.delayed)) {
      State.registerDelay(Number(targetTurn), delayData.effects, delayData.description);
    }

    // Apply modifier
    if (action.modifier === 'halve_workload_gain') {
      State.setHalveWorkload();
    }

    // FA consequence check (T3 and T5 only)
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

    // Log action
    State.logAction(action.id, action.name, isAriaRec);
    Telemetry.logAction(turn, action.id, action.name, isAriaRec, State.getVars());

    // Update turn log immediately to show completed action
    UI.updateTurnLog(State.turnLog, State.turn);

    if (turn < 6) {
      // Advance turn — this internally calls processDelays which fires consequenceFired events
      State.advanceTurn();

      // Show any queued consequence popups, then load next turn
      _drainConsequences(() => loadTurn(State.turn - 1));
    } else {
      // Turn 6 done — show summary
      Main.showSummary();
    }
  }

  // Show queued consequences one at a time; call done() when all cleared
  function _drainConsequences(done) {
    if (_pendingConsequences.length === 0) {
      done();
      return;
    }
    const detail = _pendingConsequences.shift();
    UI.showConsequencePopup(detail, () => {
      _drainConsequences(done);
    });
  }

  // ── Further Analysis request ─────────────────────────────────────
  function handleFARequest() {
    const turnData = _currentTurnData;
    const turn     = State.turn;

    // Cost applied immediately
    State.applyEffects({ workload: 3 });
    State.setFARequested(turn);
    Telemetry.logFARequested(turn, turnData.fa.content);

    // Disable and relabel FA button
    const btn = document.getElementById('btn-fa');
    if (btn) {
      btn.disabled    = true;
      btn.textContent = turnData.fa.retrievingLabel;
    }

    // 1500–2000ms delay before window appears
    const delay = 1500 + Math.random() * 500;
    setTimeout(() => {
      UI.showFAWindow(turnData);
    }, delay);
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
