/**
 * turns.js — Turn orchestration.
 * Loads a turn, handles action selection, fires consequence logic.
 */

const Turns = (() => {

  let _currentTurnData  = null;
  let _faWindowOpen     = false;
  let _xaiViewed        = false;
  let _confidenceValue  = 0;

  function loadTurn(turnIndex) {
    _currentTurnData = TURNS_DATA[turnIndex];
    _faWindowOpen    = false;
    _xaiViewed       = false;

    // Process any delayed effects arriving this turn
    // (already called in State.advanceTurn for turns > 1)

    // Render incident
    document.getElementById('incident-title').textContent =
      `TURN ${_currentTurnData.id} — ${_currentTurnData.title}`;
    document.getElementById('incident-phase').textContent = _currentTurnData.phase;
    document.getElementById('incident-body').textContent  = _currentTurnData.incident;

    // Render reports
    UI.renderReports(_currentTurnData.reports);

    // Further analysis button
    const faBtn = document.getElementById('btn-further-analysis');
    if (faBtn) {
      faBtn.disabled    = false;
      faBtn.textContent = 'REQUEST FURTHER ANALYSIS';
      faBtn.onclick     = () => handleFARequest();
    }

    // Hide FA window and taskbar button from previous turn
    const faWin = document.getElementById('window-fa');
    if (faWin)  faWin.style.display = 'none';
    const tbBtn = document.getElementById('taskbar-fa-btn');
    if (tbBtn)  tbBtn.classList.remove('visible');

    // xAI button
    const xaiBtn = document.getElementById('btn-xai');
    if (xaiBtn) {
      xaiBtn.disabled = false;
      xaiBtn.onclick  = () => handleXAI();
    }
    const xaiWin = document.getElementById('window-xai');
    if (xaiWin) xaiWin.style.display = 'none';

    // ARIA
    _confidenceValue = State.condition === 'calm'
      ? State.getConfidenceDrift(turnIndex)
      : 82 + Math.floor(Math.random() * 10); // pushy: always 82–91%

    Telemetry.logConfidenceDrift(_confidenceValue);
    UI.updateARIA(
      State.condition,
      _currentTurnData.aria[State.condition],
      _confidenceValue
    );

    // Pushy overlay tint
    const overlay = document.getElementById('pushy-overlay');
    if (overlay) overlay.classList.toggle('visible', State.condition === 'pushy');

    // Render actions — on T6, show only the AI recommendation matching the active condition
    const actions = _currentTurnData.actions.filter(a => {
      if (a.id === 'T6_D_CALM')  return State.condition === 'calm';
      if (a.id === 'T6_D_PUSHY') return State.condition === 'pushy';
      return true;
    });
    UI.renderActions(actions, handleActionSelect);

    // Update turn counter
    const counter = document.getElementById('turn-counter');
    if (counter) counter.textContent = `Turn ${State.turn} / 6`;

    Telemetry.startTurn();
  }

  function handleFARequest() {
    const fa    = _currentTurnData.furtherAnalysis;
    const faBtn = document.getElementById('btn-further-analysis');

    // Apply cost immediately
    State.applyEffects({workload: +3});
    State.setFARequested(State.turn);
    Telemetry.logFARequested(fa.expandedReport);

    faBtn.disabled    = true;
    faBtn.textContent = 'FURTHER ANALYSIS RECEIVED';

    // Loading delay — 1.5–2 seconds
    const delay = 1500 + Math.random() * 500;
    faBtn.textContent = 'RETRIEVING ANALYSIS…';

    setTimeout(() => {
      faBtn.textContent = 'FURTHER ANALYSIS RECEIVED';
      UI.showFAWindow(fa);
    }, delay);
  }

  function handleXAI() {
    UI.showXAIWindow(State.condition, _confidenceValue);
    _xaiViewed = true;
  }

  function handleActionSelect(action) {
    // T6: explicit "Follow AI Recommendation" actions only.
    // T1–T5: first action in list is the ARIA-recommended option.
    const wasAIFollow = State.turn === 6
      ? action.id === (State.condition === 'calm' ? 'T6_D_CALM' : 'T6_D_PUSHY')
      : action.id === _currentTurnData.actions[0].id;

    // Apply modifier if present
    if (action.modifier === 'halve_workload_gain') State.setHalveWorkload();

    // Apply immediate effects
    State.applyEffects(action.immediateEffects);

    // Register delayed effects
    Object.entries(action.delayedEffects).forEach(([turn, effects]) => {
      State.registerDelay(Number(turn), effects);
    });

    // Further analysis consequence
    const fa = _currentTurnData.furtherAnalysis;
    if (fa.consequence && State.wasFARequested(State.turn) && action.id === fa.consequenceAction) {
      State.registerDelay(fa.consequenceTurn, fa.consequenceEffect);
      Telemetry.logFAConsequenceTriggered(fa.consequenceTurn, fa.consequenceEffect);
    }

    // Log
    State.logAction(action.id, action.name, wasAIFollow);
    Telemetry.logAction(action.id, action.name, wasAIFollow);

    // Advance or end
    if (State.turn >= 6) {
      Main.showSummary();
    } else {
      State.advanceTurn();
      loadTurn(State.turn - 1);
    }
  }

  return { loadTurn };
})();
