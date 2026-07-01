// audio.js — all audio logic for Infrastructure Under Pressure
// Loaded as <script type="module"> in index.html.
// Exposes window.GameAudio so classic (non-module) scripts can call these functions.
// No audio fires before the first user gesture (browser autoplay policy).

let audioCtx = null;

function initAudioOnce() {
  audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume(); // Safari requires explicit resume
  document.removeEventListener('click', initAudioOnce);
}

document.addEventListener('click', initAudioOnce);

function playTone(frequency, duration, volume = 0.3, type = 'square') {
  if (!audioCtx) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// ── Named sound functions ──────────────────────────────────────────────────

function soundTurnAdvance() {
  playTone(523, 0.15, 0.25);
}

function soundARIAMessage() {
  playTone(880, 0.08, 0.2);
}

function soundPopup() {
  playTone(740, 0.12, 0.25);
}

function soundDismiss() {
  playTone(440, 0.08, 0.15);
}

function soundActionConfirm() {
  playTone(660, 0.06, 0.2);
}

function soundFurtherAnalysisOpen() {
  playTone(392, 0.1, 0.2);
}

function soundMetricWarning() {
  playTone(280, 0.25, 0.3);
}

function soundCommsTurn() {
  playTone(660, 0.1, 0.3);
  setTimeout(() => playTone(523, 0.15, 0.3), 120);
}

function soundSessionEnd() {
  playTone(523, 0.15, 0.25);
  setTimeout(() => playTone(440, 0.15, 0.25), 180);
  setTimeout(() => playTone(349, 0.3,  0.25), 360);
}

// ── Metric threshold check ─────────────────────────────────────────────────
// Fires soundMetricWarning() once per threshold per session only.
// Reset by calling resetMetricWarnings() at session start.

const metricWarningFired = { stability: false, resources: false, workload: false };

function checkMetricThresholds(stability, resources, workload) {
  if (stability < 40 && !metricWarningFired.stability) {
    soundMetricWarning();
    metricWarningFired.stability = true;
  }
  if (resources < 25 && !metricWarningFired.resources) {
    soundMetricWarning();
    metricWarningFired.resources = true;
  }
  if (workload >= 75 && !metricWarningFired.workload) {
    soundMetricWarning();
    metricWarningFired.workload = true;
  }
}

function resetMetricWarnings() {
  metricWarningFired.stability = false;
  metricWarningFired.resources = false;
  metricWarningFired.workload  = false;
}

// ── Global namespace for classic (non-module) script callers ───────────────
// All wiring in ui.js, turns.js, main.js uses window.GameAudio?.soundXxx().
window.GameAudio = {
  soundTurnAdvance,
  soundARIAMessage,
  soundPopup,
  soundDismiss,
  soundActionConfirm,
  soundFurtherAnalysisOpen,
  soundMetricWarning,
  soundCommsTurn,
  soundSessionEnd,
  checkMetricThresholds,
  resetMetricWarnings,
};
