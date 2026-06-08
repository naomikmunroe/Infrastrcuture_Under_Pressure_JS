/**
 * state.js — Game state. Single source of truth.
 * All variable changes go through applyEffects(). Never set directly.
 */

const INITIAL_VARS = {
  stability:  70,
  resources:  70,
  workload:   30,
  confidence: 70,
};

const FLOOR   = 0;
const CEILING = 100;

const State = (() => {
  let _vars            = {...INITIAL_VARS};
  let _turn            = 1;
  let _condition       = null; // 'calm' | 'pushy'
  let _participantId   = null;
  let _pendingDelays   = {}; // {turnNum: [{variable: delta}]}
  let _halveWorkload   = false;
  let _faRequested     = {}; // {turnNum: bool}
  let _actionLog       = []; // [{turn, actionId, actionName}]
  let _aiFollowCount   = 0;
  let _sessionSeed     = 0;

  function clamp(v) { return Math.max(FLOOR, Math.min(CEILING, Math.round(v))); }

  function applyEffects(effects) {
    for (const [key, delta] of Object.entries(effects)) {
      let d = delta;
      if (_halveWorkload && key === 'workload' && delta > 0) d = Math.floor(delta / 2);
      _vars[key] = clamp(_vars[key] + d);
    }
    document.dispatchEvent(new CustomEvent('varsChanged', { detail: {..._vars} }));
  }

  function registerDelay(targetTurn, effects) {
    if (!_pendingDelays[targetTurn]) _pendingDelays[targetTurn] = [];
    _pendingDelays[targetTurn].push(effects);
  }

  function processDelays(turn) {
    (_pendingDelays[turn] || []).forEach(e => applyEffects(e));
  }

  function checkCollapse() {
    return _vars.stability < 20 || _vars.resources < 10;
  }

  return {
    init(condition, participantId) {
      _vars           = {...INITIAL_VARS};
      _turn           = 1;
      _condition      = condition;
      _participantId  = participantId;
      _pendingDelays  = {};
      _halveWorkload  = false;
      _faRequested    = {};
      _actionLog      = [];
      _aiFollowCount  = 0;
      // Seed for confidence drift reproducibility
      _sessionSeed = participantId.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    },

    get vars()          { return {..._vars}; },
    get turn()          { return _turn; },
    get condition()     { return _condition; },
    get participantId() { return _participantId; },
    get actionLog()     { return [..._actionLog]; },
    get aiFollowCount() { return _aiFollowCount; },
    get halveWorkload() { return _halveWorkload; },

    applyEffects,
    registerDelay,

    advanceTurn() {
      _turn++;
      processDelays(_turn);
      document.dispatchEvent(new CustomEvent('turnAdvanced', { detail: { turn: _turn } }));
    },

    setHalveWorkload() { _halveWorkload = true; },

    setFARequested(turn) { _faRequested[turn] = true; },
    wasFARequested(turn) { return !!_faRequested[turn]; },

    logAction(actionId, actionName, wasAIFollow) {
      _actionLog.push({ turn: _turn, actionId, actionName, timestamp: Date.now() });
      if (wasAIFollow) _aiFollowCount++;
    },

    getConfidenceDrift(turnIndex) {
      const [base, noise] = ARIA_CONFIDENCE_DRIFT[turnIndex];
      // Seeded pseudo-random: same participant always sees same drift
      const rng = Math.sin(_sessionSeed * (turnIndex + 1) * 9301 + 49297) * 0.5 + 0.5;
      const offset = Math.round((rng * 2 - 1) * noise);
      return base + offset;
    },

    isGameOver()   { return _turn > 6; },
    checkCollapse,

    getAIFollowRate() {
      const pct = Math.round((_aiFollowCount / 6) * 100);
      if (_aiFollowCount <= 1) return { bracket:'low',    pct };
      if (_aiFollowCount <= 3) return { bracket:'medium', pct };
      return                          { bracket:'high',   pct };
    },
  };
})();
