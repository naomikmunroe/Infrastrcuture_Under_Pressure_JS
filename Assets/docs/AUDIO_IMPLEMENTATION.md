# Audio Implementation Brief — Infrastructure Under Pressure

## Overview

Implement a condition-neutral audio layer using the Web Audio API. All sounds are synthesised in JS — no external asset files required. Audio does not vary between calm and pushy conditions. The pushy condition will feel louder as a natural consequence of more frequent popup events; this is not a deliberate manipulation.

---

## Files to create

- `audio.js` — all audio logic, imported by `index.html`

---

## Constraints

- **No audio assets.** All sounds generated via Web Audio API oscillators and gain envelopes.
- **Condition-neutral.** Do not branch audio behaviour on condition type.
- **Browser autoplay policy.** `AudioContext` must be initialised on first user gesture (start button click), not on page load.
- **No audio on questionnaire screens.** Audio is active only during the main game loop (Staff Briefing through session end).

---

## audio.js — full specification

### Initialisation

```js
let audioCtx = null;

function initAudioOnce() {
  audioCtx = new AudioContext();
  document.removeEventListener('click', initAudioOnce);
}

document.addEventListener('click', initAudioOnce);
```

Initialises on the first click anywhere in the document, then removes itself. No dependency on a specific element. Players may explore the interface before starting the simulation — this pattern accommodates that without requiring a defined entry point.

---

### Core synthesiser

```js
function playTone(frequency, duration, volume = 0.3, type = 'square') {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
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
```

`type = 'square'` gives the characteristic Win98 system sound timbre. Use `'sine'` for softer tones if square is too harsh in testing.

---

### Named sound functions

Export each function individually so callers import only what they need.

```js
// Turn advance — neutral chime
export function soundTurnAdvance() {
  playTone(523, 0.15, 0.25);
}

// ARIA recommendation delivered (both conditions)
export function soundARIAMessage() {
  playTone(880, 0.08, 0.2);
}

// Popup appears — consequence or between-turn event
export function soundPopup() {
  playTone(740, 0.12, 0.25);
}

// Popup dismissed
export function soundDismiss() {
  playTone(440, 0.08, 0.15);
}

// Action button confirmed
export function soundActionConfirm() {
  playTone(660, 0.06, 0.2);
}

// Further analysis panel opened
export function soundFurtherAnalysisOpen() {
  playTone(392, 0.1, 0.2);
}

// Metric bar enters red zone (Stability < 40, Resources < 25, Workload >= 75)
export function soundMetricWarning() {
  playTone(280, 0.25, 0.3);
}

// Comms turn fires — distinct from standard popup
export function soundCommsTurn() {
  playTone(660, 0.1, 0.3);
  setTimeout(() => playTone(523, 0.15, 0.3), 120);
}

// Session end
export function soundSessionEnd() {
  playTone(523, 0.15, 0.25);
  setTimeout(() => playTone(440, 0.15, 0.25), 180);
  setTimeout(() => playTone(349, 0.3, 0.25), 360);
}
```

---

## Trigger mapping

Wire each function to the appropriate event in the existing JS. Do not add audio logic inline — call the exported functions only.

| Event | Function to call | Where to wire |
|---|---|---|
| Turn loads | `soundTurnAdvance()` | Turn render function |
| ARIA panel updates | `soundARIAMessage()` | ARIA update function |
| Consequence popup appears | `soundPopup()` | Consequence popup render |
| Between-turn event popup appears | `soundPopup()` | Between-turn event render |
| Popup dismissed | `soundDismiss()` | Dismiss button handler |
| Action button clicked | `soundActionConfirm()` | Action selection handler |
| Further analysis button clicked | `soundFurtherAnalysisOpen()` | Further analysis trigger |
| Metric crosses threshold | `soundMetricWarning()` | Variable update function, after threshold check |
| Comms turn fires | `soundCommsTurn()` | Comms turn render |
| Session end screen loads | `soundSessionEnd()` | End screen render |

---

## Metric threshold check

The metric warning sound should fire once per threshold crossing, not on every variable update. Use a flag per metric per session:

```js
const metricWarningFired = {
  stability: false,
  resources: false,
  workload: false
};

export function checkMetricThresholds(stability, resources, workload) {
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
```

Reset `metricWarningFired` at the start of each session (not each turn).

---

## Testing checklist

- [ ] No sound fires on page load before user gesture
- [ ] `soundARIAMessage()` fires in both calm and pushy conditions
- [ ] `soundPopup()` fires for consequence popups AND between-turn events
- [ ] `soundMetricWarning()` fires once per threshold per session, not repeatedly
- [ ] `soundCommsTurn()` is audibly distinct from `soundPopup()`
- [ ] `soundSessionEnd()` plays the descending three-note sequence cleanly
- [ ] No errors in browser console on AudioContext creation

---

## Known browser behaviour

- Safari requires `audioCtx.resume()` after creation. Add inside `initAudioOnce()`: `if (audioCtx.state === 'suspended') audioCtx.resume();`
- Firefox and Chrome handle `exponentialRampToValueAtTime` to near-zero — ensure the ramp target is `0.001`, not `0`, to avoid a DOMException.
