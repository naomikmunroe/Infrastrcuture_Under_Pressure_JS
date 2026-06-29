// aria.DEPRECATED.js — DO NOT LOAD
// This file is superseded by turns.js and ui.js.
// The pushy popup system (showPushyPopup, handleBetweenTurn, showConsequencePopup)
// is fully implemented there. This file is retained for reference only and is NOT
// included in index.html script tags.
//
// Known issues that prevented use:
//   - References document.getElementById('window-popup') which does not exist in the DOM
//   - Calls Telemetry.logAIPopupDismissed() which does not exist (correct name: logPushyPopupDismissed)

/**
 * aria.js — Pushy condition popup behaviour.
 * Manages the dismissible ARIA recommendation popup for the pushy condition.
 */

const ARIAPopup = (() => {

  function show(turnData) {
    if (State.condition !== 'pushy') return;

    const win = document.getElementById('window-popup');
    if (!win) return;

    win.querySelector('.title-bar-text').textContent = '⚠ ARIA — ALERT';
    win.querySelector('.window-body').innerHTML = `
      <p style="color:#800000;font-weight:bold;font-size:12px;margin-bottom:8px">
        ${turnData.aria.pushy}
      </p>
      <button id="btn-popup-action" class="action-btn" style="background:#ffe0e0">
        ${turnData.actions[0].name} (ARIA recommended)
      </button>
    `;

    win.style.display = 'block';

    win.querySelector('.title-bar-close').onclick = () => {
      win.style.display = 'none';
      Telemetry.logAIPopupDismissed();
    };

    // Alert counter increment
    const counter = document.getElementById('aria-alert-counter');
    if (counter) {
      const current = parseInt(counter.textContent) || 0;
      counter.textContent = `${current + 1} UNACKNOWLEDGED ALERT${current + 1 > 1 ? 'S' : ''}`;
      counter.classList.add('visible');
    }
  }

  return { show };
})();
