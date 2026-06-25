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

  // Phase 4: threshold consequence events (AD-25)
  const CONSEQUENCE_EVENTS = [
    { id: 'grid_sector_failure',     label: 'Grid Sector Failure',
      description: 'Stability indicators have fallen below safe operational thresholds. A grid sector failure has been recorded by GRIDHUB monitoring systems.',
      check: v => v.stability  <  40, additionalEffect: null,              fired: false },
    { id: 'full_sector_outage',      label: 'Full Sector Outage — Cascade Risk',
      description: 'System stability has reached a critical threshold. Full sector outage risk has been flagged. Cascade failure protocols have been initiated.',
      check: v => v.stability  <  20, additionalEffect: null,              fired: false },
    { id: 'emergency_procurement',   label: 'Emergency Procurement Triggered',
      description: 'Resource reserves have fallen below emergency thresholds. Emergency procurement procedures have been initiated. Procurement filed but resolution is not guaranteed.',
      check: v => v.resources  <  25, additionalEffect: null,              fired: false },
    { id: 'nationalisation_inquiry', label: 'Nationalisation Inquiry Opened',
      description: 'Public confidence indicators have reached a level associated with formal scrutiny. A nationalisation inquiry has been opened by the regulatory authority.',
      check: v => v.confidence <  35, additionalEffect: { confidence: -5 }, fired: false },
    { id: 'operator_fatigue',        label: 'Operator Fatigue Flag Raised',
      description: 'Workload indicators have exceeded operational norms. A fatigue flag has been raised in accordance with sector management protocol.',
      check: v => v.workload   > 75,  additionalEffect: null,              fired: false },
  ];
  let _thresholdEvents = [];

  // Phase 4: comms turn state (AD-26)
  let _commsRequired  = false;
  let _commsCompleted = false;
  let _commsOutcome   = null;

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
    _thresholdEvents = [];
    _commsRequired   = false;
    _commsCompleted  = false;
    _commsOutcome    = null;
    CONSEQUENCE_EVENTS.forEach(e => { e.fired = false; });
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
    checkThresholds();
  }

  function checkThresholds() {
    const v = { stability: _stability, resources: _resources, workload: _workload, confidence: _confidence };
    CONSEQUENCE_EVENTS.forEach(event => {
      if (!event.fired && event.check(v)) {
        event.fired = true;
        if (event.additionalEffect) applyEffects(event.additionalEffect);
        document.dispatchEvent(new CustomEvent('thresholdEvent', {
          detail: { id: event.id, label: event.label, description: event.description, turn: _turn, vars: {...v} },
        }));
        _thresholdEvents.push({ id: event.id, label: event.label, turn: _turn });
      }
    });
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

  function setScreeningData(data) { _screeningData = data; }
  function setCommsRequired()      { _commsRequired  = true; }
  function completeComms(outcome)  { _commsCompleted = true; _commsOutcome = outcome; }

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
    setCommsRequired,
    completeComms,
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
    get screeningData()    { return _screeningData; },
    get thresholdEvents()  { return [..._thresholdEvents]; },
    get commsCompleted()   { return _commsCompleted; },
    get commsOutcome()     { return _commsOutcome; },
    get vars()             { return getVars(); },
    get aiFollowCount()    { return getAIFollowCount(); },
  };
})();
