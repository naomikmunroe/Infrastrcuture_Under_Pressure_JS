<<<<<<< HEAD
// state.js — variable logic, delay system, drift seed
// All variable changes must go through applyEffects(). Never set directly.

const State = (() => {
  const FLOOR   = 0;
  const CEILING = 100;

  // Session state
  let _condition     = null;  // 'calm' | 'pushy'
  let _participantId = null;
  let _turn          = 1;     // 1–6

  // Core variables
  let _stability  = 70;
  let _resources  = 70;
  let _workload   = 30;
  let _confidence = 70;

  // Pending delayed effects: { turnNumber: [{effects, description}, ...] }
  let _pendingDelays = {};

  // Modifier flags
  let _halveWorkloadGain = false;

  // Action log: [{turn, actionId, actionName, wasAriaRec}]
  let _actionLog = [];

  // Turn log for UI display: [{turn, action}]
  let _turnLog = [];

  // FA requested per turn: { turnNumber: bool }
  let _faRequested = {};

  // Pre-session screening responses (EV-05)
  let _screeningData = null;

  // Seeded drift for calm ARIA confidence
  let _driftSeed = 0;

  // ── Helpers ─────────────────────────────────────────────────────

  function clamp(v) {
    return Math.max(FLOOR, Math.min(CEILING, v));
  }

  function seededRand(seed) {
    // Simple LCG; returns float in [0,1)
    const a = 1664525, c = 1013904223, m = 2 ** 32;
    return ((a * seed + c) % m) / m;
  }

  // ── Public API ───────────────────────────────────────────────────

  function init(condition, participantId) {
    _condition     = condition;
    _participantId = participantId;
    _turn          = 1;
    _stability     = 70;
    _resources     = 70;
    _workload      = 30;
    _confidence    = 70;
    _pendingDelays = {};
    _halveWorkloadGain = false;
    _actionLog     = [];
    _turnLog       = [];
    _faRequested   = {};
    _screeningData = null;
    // Seed from participant id so drift is reproducible per participant
    _driftSeed = participantId
      ? Array.from(String(participantId)).reduce((acc, c) => acc + c.charCodeAt(0), 0)
      : Math.floor(Math.random() * 10000);
  }

  function applyEffects(effects) {
    if (!effects) return;
    for (const [key, delta] of Object.entries(effects)) {
      let d = Number(delta);
      if (_halveWorkloadGain && key === 'workload' && d > 0) {
        d = Math.floor(d / 2);
      }
      switch (key) {
        case 'stability':  _stability  = clamp(_stability  + d); break;
        case 'resources':  _resources  = clamp(_resources  + d); break;
        case 'workload':   _workload   = clamp(_workload   + d); break;
        case 'confidence': _confidence = clamp(_confidence + d); break;
      }
    }
    document.dispatchEvent(new CustomEvent('varsChanged'));
  }

  function registerDelay(turn, effects, description) {
    if (!_pendingDelays[turn]) _pendingDelays[turn] = [];
    _pendingDelays[turn].push({ effects, description: description || '' });
  }

  // processDelays is called by advanceTurn.
  // Dispatches 'consequenceFired' for each effect that fires.
  function processDelays(turn) {
    (_pendingDelays[turn] || []).forEach(({ effects, description }) => {
      applyEffects(effects);
      document.dispatchEvent(new CustomEvent('consequenceFired', {
        detail: { effects, turn, description },
      }));
    });
  }

  function advanceTurn() {
    _turn += 1;
    processDelays(_turn);
  }

  function setHalveWorkload() {
    _halveWorkloadGain = true;
  }

  function setFARequested(turn) {
    _faRequested[turn] = true;
  }

  function wasFARequested(turn) {
    return !!_faRequested[turn];
  }

  function setScreeningData(data) {
    _screeningData = data;
  }

  function logAction(actionId, actionName, wasAriaRec) {
    _actionLog.push({ turn: _turn, actionId, actionName, wasAriaRec });
    _turnLog.push({ turn: _turn, action: actionName });
  }

  // Calm ARIA confidence: base + seeded drift ±4
  function getConfidenceDrift(turnIndex) {
    const base = CALM_CONFIDENCE_BASE[turnIndex];
    const seed = _driftSeed + turnIndex * 31;
    const noise = Math.floor(seededRand(seed) * 9) - 4; // -4 to +4
    return clamp(base + noise);
  }

  // Pushy ARIA confidence: random 82–91
  function getPushyConfidence(turnIndex) {
    const seed = _driftSeed + turnIndex * 17;
    return PUSHY_CONFIDENCE_MIN + Math.floor(seededRand(seed) * (PUSHY_CONFIDENCE_MAX - PUSHY_CONFIDENCE_MIN + 1));
  }

  function checkCollapse() {
    return _stability < 20 || _resources < 10;
  }

  function getVars() {
    return { stability: _stability, resources: _resources, workload: _workload, confidence: _confidence };
  }

  function getAIFollowCount() {
    return _actionLog.filter(e => e.wasAriaRec).length;
  }

  return {
    init,
    applyEffects,
    registerDelay,
    advanceTurn,
    setHalveWorkload,
    setFARequested,
    wasFARequested,
    setScreeningData,
    logAction,
    getConfidenceDrift,
    getPushyConfidence,
    checkCollapse,
    getVars,
    getAIFollowCount,
    get condition()      { return _condition; },
    get participantId()  { return _participantId; },
    get turn()           { return _turn; },
    get stability()      { return _stability; },
    get resources()      { return _resources; },
    get workload()       { return _workload; },
    get confidence()     { return _confidence; },
    get actionLog()      { return [..._actionLog]; },
    get turnLog()        { return [..._turnLog]; },
    get screeningData()  { return _screeningData; },
=======
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
>>>>>>> 464c21bc7439d9e29667dac0b9839d3259148ac8
  };
})();
