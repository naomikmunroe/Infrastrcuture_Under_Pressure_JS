// ui.js — all rendering. Reads state; does not write it.
// No game logic here.

const UI = (() => {

  // ── Per-turn confidence qualifiers (calm only) ────────────────────
  const CALM_QUALIFIERS = [
    'low certainty',                     // T1
    'moderate certainty',                // T2
    'low certainty — analysis degraded', // T3
    'moderate certainty',                // T4
    'moderate certainty',                // T5
    'uncertain — multiple factors',      // T6
  ];

  // ── Bar colour thresholds ─────────────────────────────────────────
  function _barColour(v) {
    if (v >= 60) return '#008000';
    if (v >= 30) return '#808000';
    return '#800000';
  }

  // ── Variable bars ─────────────────────────────────────────────────
  function updateVarBars() {
    const v = State.getVars();
    _setBar('bar-stability',  v.stability);
    _setBar('bar-resources',  v.resources);
    _setBar('bar-workload',   v.workload);
    _setBar('bar-confidence', v.confidence);
    _setText('val-stability',  v.stability + '%');
    _setText('val-resources',  v.resources + '%');
    _setText('val-workload',   v.workload  + '%');
    _setText('val-confidence', v.confidence + '%');
    window.GameAudio?.checkMetricThresholds(v.stability, v.resources, v.workload);
  }

  function _setBar(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width      = value + '%';
    el.style.background = _barColour(value);
  }

  function _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ── Turn counter ──────────────────────────────────────────────────
  function updateTurnCounter(turn) {
    const el = document.getElementById('turn-counter');
    if (el) el.textContent = `TURN ${turn} / 6`;
    const crit = document.getElementById('critical-indicator');
    if (crit) crit.style.display = State.condition === 'pushy' ? '' : 'none';
  }

  // ── Session clock ─────────────────────────────────────────────────
  let _clockInterval = null;

  function startClock() {
    const el = document.getElementById('session-clock');
    if (!el) return;
    const start = Date.now();
    _clockInterval = setInterval(() => {
      const s   = Math.floor((Date.now() - start) / 1000);
      const m   = String(Math.floor(s / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      el.textContent = `${m}:${sec}`;
    }, 1000);
  }

  function stopClock() {
    if (_clockInterval) { clearInterval(_clockInterval); _clockInterval = null; }
  }

  // ── Centre panel spinner ──────────────────────────────────────────
  // type: 'calm' | 'pushy' | 'T3'
  function showCentreSpinner(type) {
    const centre = document.getElementById('panel-centre');
    if (!centre) return;

    let inner = '';
    if (type === 'T3') {
      inner = `
        <div style="margin-bottom:4px;"><span style="color:#cc8800;">&gt; ARIA: ANALYSIS REQUEST TIMEOUT</span></div>
        <div style="margin-bottom:4px;"><span style="color:#cc8800;">&gt; System response unavailable. Estimated recovery: unknown.</span></div>
        <div><span style="color:#666;">&gt; Proceeding without AI support…</span></div>`;
    } else if (type === 'pushy') {
      inner = `<span style="color:#00aa00;">&gt; GRIDHUB SYSTEM LOADING… ARIA ANALYSIS PENDING</span>`;
    } else {
      inner = `<span style="color:#00aa00;">&gt; GRIDHUB SYSTEM LOADING…</span><span class="cursor"></span>`;
    }

    centre.innerHTML = `
      <div class="window" style="flex:1;min-height:200px;">
        <div class="title-bar">
          <div class="title-bar-text">GRIDHUB — Initialising</div>
          <div class="title-bar-controls"><button aria-label="Close"></button></div>
        </div>
        <div class="window-body" style="background:#000;min-height:180px;padding:8px;font-family:'Courier New',monospace;font-size:11px;line-height:1.8;">
          ${inner}
        </div>
      </div>`;
  }

  function hideCentreSpinner() {
    const centre = document.getElementById('panel-centre');
    if (!centre) return;
    centre.innerHTML = `
      <div id="incident-panel" class="window"></div>
      <div id="panel-actions" class="window">
        <div class="title-bar">
          <div class="title-bar-text">Response Options</div>
          <div class="title-bar-controls"><button aria-label="Close"></button></div>
        </div>
        <div class="window-body" style="padding:4px;"><div id="action-list"></div></div>
      </div>`;
  }

  // ── Notification stack (pushy only) ──────────────────────────────
  function addStackNotification(text) {
    const stack = document.getElementById('notification-stack');
    if (!stack) return;

    const el = document.createElement('div');
    el.className = 'window';
    el.style.cssText = 'width:180px;font-size:10px;box-shadow:2px 2px 0 #000;';
    el.innerHTML = `
      <div class="title-bar" style="background:#800000;padding:1px 4px;">
        <div class="title-bar-text" style="font-size:9px;">⚠ ARIA ALERT</div>
        <div class="title-bar-controls">
          <button aria-label="Close" onclick="this.closest('.window').remove()" style="min-height:12px;"></button>
        </div>
      </div>
      <div class="window-body" style="padding:3px;font-size:9px;background:#fff0f0;font-family:'Courier New',monospace;">
        ${_escHtml(text)}
      </div>`;
    stack.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 8000);
  }

  function clearNotificationStack() {
    const stack = document.getElementById('notification-stack');
    if (stack) stack.innerHTML = '';
  }

  // ── Duty officer response timer (Phase 5, AD-33) ──────────────────
  function showTimerDisplay() {
    const existing = document.getElementById('timer-panel');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'timer-panel';
    el.style.cssText = 'font-family:"Courier New",monospace;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:3px 6px;margin-bottom:4px;font-size:9px;';
    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span>DUTY OFFICER RESPONSE TIMER</span>' +
        '<span id="timer-value" style="font-weight:bold;letter-spacing:1px;">01:30</span>' +
      '</div>' +
      '<div style="font-size:8px;color:#444;">Protocol 7 &#8212; SLA response required within 90 seconds</div>';

    const wb = document.querySelector('#panel-actions .window-body');
    if (wb) wb.prepend(el);
  }

  function updateTimerDisplay(seconds) {
    const el = document.getElementById('timer-value');
    if (!el) return;
    if (seconds <= 0) {
      el.textContent = 'EXPIRED';
      el.style.color = 'red';
      return;
    }
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    el.textContent = `${m}:${s}`;
    el.style.color = seconds <= 15 ? 'red' : '';
  }

  function clearTimerDisplay() {
    const el = document.getElementById('timer-panel');
    if (el) el.remove();
  }

  // ── Duty log modal (Phase 5, AD-33) ───────────────────────────────
  // Not dismissible without submitting. Hides ARIA panel while open.
  function showDutyLogModal(onSubmit) {
    const ariaPanel = document.getElementById('aria-panel');
    if (ariaPanel) ariaPanel.style.visibility = 'hidden';

    const modal = document.createElement('div');
    modal.id = 'duty-log-modal';
    modal.className = 'window';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:380px;z-index:500;box-shadow:3px 3px 0 #000;';
    modal.innerHTML =
      '<div class="title-bar" style="background:#000080;">' +
        '<div class="title-bar-text">DUTY LOG &#8212; SITUATION REPORT REQUIRED</div>' +
      '</div>' +
      '<div class="window-body" style="font-size:9px;font-family:\'Courier New\',monospace;">' +
        '<div style="font-weight:bold;letter-spacing:1px;margin-bottom:6px;">PROTOCOL 6 &#8212; MANDATORY SITUATION REPORT</div>' +
        '<div style="line-height:1.6;margin-bottom:8px;">' +
          'Before the next incident cycle, you are required to submit a brief status assessment to the operations record.<br><br>' +
          'Summarise the situation as it stands and any patterns you have observed.' +
        '</div>' +
        '<div style="font-size:9px;color:#808080;font-style:italic;margin-bottom:5px;">GRIDHUB PROTOCOL 7 &#8212; Situation reports must contain a complete operational summary. Minimum length requirement applies.</div>' +
        '<textarea id="duty-log-text" rows="4" style="width:100%;font-family:\'Courier New\',monospace;font-size:9px;background:#f5f0e8;border:1px solid;border-color:#808080 #fff #fff #808080;padding:4px;resize:vertical;box-sizing:border-box;" placeholder="Enter situation report…"></textarea>' +
        '<div id="duty-log-counter" style="font-size:9px;color:#808080;margin-top:3px;">0 / 80 characters minimum</div>' +
        '<div style="margin-top:6px;">' +
          '<button id="duty-log-submit" disabled style="font-family:\'Courier New\';font-size:9px;padding:2px 10px;font-weight:bold;cursor:default;color:#808080;">[ SUBMIT SITUATION REPORT ]</button>' +
        '</div>' +
      '</div>';

    document.getElementById('game-overlay').appendChild(modal);

    const textarea  = document.getElementById('duty-log-text');
    const submitBtn = document.getElementById('duty-log-submit');
    const counter   = document.getElementById('duty-log-counter');

    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      const met   = count >= 80;
      counter.textContent  = `${count} / 80 characters minimum`;
      counter.style.color  = met ? '#008000' : '#808080';
      submitBtn.disabled             = !met;
      submitBtn.style.background     = met ? '#000080' : '';
      submitBtn.style.color          = met ? '#fff'    : '#808080';
      submitBtn.style.cursor         = met ? 'pointer' : 'default';
    });

    submitBtn.onclick = () => {
      const text      = textarea.value.trim();
      const timestamp = new Date().toISOString();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      modal.remove();
      if (ariaPanel) ariaPanel.style.visibility = '';
      if (onSubmit) onSubmit({ text, timestamp, wordCount });
    };
  }

  // ── Pushy alert badge (taskbar + ARIA panel) ──────────────────────
  function updatePushyAlertBadge(count) {
    const el = document.getElementById('aria-alert-count');
    if (el) {
      el.textContent = count === 1
        ? 'UNACKNOWLEDGED: 1 ALERT'
        : `UNACKNOWLEDGED: ${count} ALERTS`;
      el.style.display = count > 0 ? '' : 'none';
    }
    const tb = document.getElementById('tb-aria-alert');
    if (tb) {
      tb.textContent   = `⚠ ARIA (${count})`;
      tb.style.display = count > 0 ? '' : 'none';
    }
  }

  // ── ARIA panel ────────────────────────────────────────────────────
  function renderARIA(turnData, confidenceValue, memoryPrefix = null) {
    const cond     = State.condition;
    const aria     = turnData.aria[cond];
    const panel    = document.getElementById('aria-panel');
    const turnIdx  = State.turn - 1; // 0-based
    if (!panel) return;
    window.GameAudio?.soundARIAMessage();

    const isPushy    = cond === 'pushy';
    const confBarBg  = isPushy ? '#800000' : '#2d6a9f';
    const flashStyle = isPushy
      ? 'animation:tb-flash 0.7s infinite;background:#800000;'
      : 'background:#000080;';

    // Calm: per-turn qualifier, T3 in orange
    const qualifier = isPushy
      ? 'ACT NOW'
      : (CALM_QUALIFIERS[turnIdx] || 'uncertain');
    const qualColour = isPushy
      ? '#800000'
      : (turnIdx === 2 ? '#804000' : '#808080');
    const qualWeight = isPushy ? 'bold' : 'normal';

    // Blinking cursor only in calm ARIA text
    const cursor = (!isPushy) ? '<span class="cursor"></span>' : '';

    // AD-37: memory prefix injected before recommendation in pushy condition
    const memoryHtml = (isPushy && memoryPrefix)
      ? `<span style="color:#ff8080;display:block;margin-bottom:6px;">${_escHtml(memoryPrefix)}</span>`
      : '';

    panel.innerHTML = `
      <div class="title-bar" id="aria-titlebar" style="${flashStyle}">
        <div class="title-bar-text">${isPushy ? '⚠ ARIA — DIRECTIVE' : 'AI Advisory — ARIA'}</div>
        <div class="title-bar-controls"><button aria-label="Close"></button></div>
      </div>
      <div class="window-body" style="padding:4px;font-size:9px;overflow-y:auto;">
        <div style="color:${aria.modeColor};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:3px;font-size:8px;">${aria.modeLabel}</div>
        <div class="${isPushy ? 'aria-log-pushy' : 'aria-log-calm'}">${memoryHtml}${_escHtml(aria.text)}${cursor}</div>
        <button id="btn-xai" style="font-size:8px;margin-bottom:3px;${isPushy ? 'border-color:#800000;color:#800000;' : ''}">? WHY THIS CONFIDENCE</button>
        <hr class="metric-divider">
        <div style="font-size:8px;color:${isPushy ? '#800000' : '#444'};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:2px;">Confidence${isPushy ? '' : ` — T${turnData.id}`}</div>
        <div class="bar-outer" style="margin-bottom:2px;">
          <div class="bar-inner" style="width:${confidenceValue}%;background:${confBarBg};"></div>
        </div>
        <div style="font-size:8px;color:${qualColour};font-weight:${qualWeight};margin-bottom:3px;">${confidenceValue}% — ${qualifier}</div>
        <hr class="metric-divider">
        ${_renderPreviousARIA()}
        <div id="aria-alert-count" style="font-size:8px;color:#800000;font-weight:bold;margin-bottom:2px;display:none;">UNACKNOWLEDGED: 0</div>
        <div id="consequence-badge" style="margin-bottom:3px;display:none;">
          <span style="background:#804000;color:#fff;font-size:9px;padding:0 5px;border:2px solid;border-color:#808080 #fff #fff #808080;font-weight:bold;">⚠ ALERTS DISMISSED: <span id="consequence-count">0</span></span>
        </div>
        <div class="${isPushy ? 'aria-limitations-pushy' : 'aria-limitations-calm'}">
          ARIA analysis may be incomplete or based on inaccurate inputs. All decisions remain the responsibility of the duty operator.
        </div>
        ${_murmurPanelHTML()}
      </div>`;

    document.getElementById('btn-xai').onclick = () => Turns.handleXAIRequest();

    // Restore badges after re-render
    updateConsequenceBadge(Telemetry.consequenceCount);
    updatePushyAlertBadge(Telemetry.pushyAlertCount);
    Murmur.mount();
  }

  // ── Murmur panel markup (Phase 7, AD-39) ────────────────────────────
  // Appended below the ARIA limitations footer in both renderARIA() and
  // showARIADegraded() — deliberately off-register from the Win98 chrome.
  function _murmurPanelHTML() {
    return `
      <hr style="margin:8px 2px;border-color:#ddd;">
      <div class="title-bar" style="margin-top:2px;">
        <div class="title-bar-text" style="font-size:9px;">Murmur — Public Feed ⚡</div>
      </div>
      <div id="murmur-posts" style="
        max-height:160px;
        overflow-y:auto;
        font-size:10px;
        background:#fafafa;
        border:1px solid #e0e0e0;
        padding:4px;
      ">
        <div style="font-size:9px;color:#aaa;font-style:italic;">Connecting to Murmur…</div>
      </div>`;
  }

  // ── Turn summary narrative (Phase 7, AD-40) ─────────────────────────
  function showTurnSummaryLoading() {
    const el   = document.getElementById('turn-summary-narrative');
    const text = document.getElementById('turn-summary-text');
    if (!el || !text) return;
    el.style.display = '';
    text.textContent = 'Generating summary…';
  }

  function setTurnSummaryText(str) {
    if (!str) { clearTurnSummary(); return; }
    const el   = document.getElementById('turn-summary-narrative');
    const text = document.getElementById('turn-summary-text');
    if (!el || !text) return;
    el.style.display = '';
    text.textContent = str;
  }

  function clearTurnSummary() {
    const el   = document.getElementById('turn-summary-narrative');
    const text = document.getElementById('turn-summary-text');
    if (!el) return;
    el.style.display = 'none';
    if (text) text.textContent = '';
  }

  function _renderPreviousARIA() {
    const log = State.turnLog;
    if (log.length === 0) return '';
    const last = log[log.length - 1];
    return `<div style="font-size:8px;color:#444;margin-bottom:1px;">Previous</div>
            <div style="font-size:8px;color:#808080;line-height:1.4;margin-bottom:3px;">T${last.turn} — ${_escHtml(last.action.slice(0, 22))} suggested</div>`;
  }

  // ── Turn log ──────────────────────────────────────────────────────
  function updateTurnLog(turnLog, currentTurn) {
    const el = document.getElementById('turn-log-body');
    if (!el) return;
    let html = '';
    for (let i = 1; i <= 6; i++) {
      const entry = turnLog.find(e => e.turn === i);
      if (entry) {
        html += `<div style="font-size:8px;color:#444;line-height:1.5;">T${i} — ${_escHtml(entry.action.slice(0, 20))}</div>`;
      } else if (i === currentTurn) {
        html += `<div style="font-size:8px;color:#800000;line-height:1.5;">T${i} — pending</div>`;
      }
    }
    el.innerHTML = html;
  }

  // ── Consequence counter badge ──────────────────────────────────────
  function updateConsequenceBadge(count) {
    const badge = document.getElementById('consequence-badge');
    const num   = document.getElementById('consequence-count');
    if (badge) badge.style.display = count > 0 ? '' : 'none';
    if (num)   num.textContent = count;
    const tb = document.getElementById('tb-consequence');
    if (tb) {
      tb.textContent   = `⚠ ALERTS DISMISSED: ${count}`;
      tb.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  // ── FA floating window ────────────────────────────────────────────
  let _faOpenTime = null;

  function showFAWindow(turnData) {
    closeFAWindow();
    _faOpenTime = Date.now();
    Telemetry.logFAWindowOpened(State.turn);

    const fa  = turnData.fa;
    const win = document.createElement('div');
    win.id        = 'fa-window';
    win.className = 'window';
    win.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);width:340px;z-index:100;box-shadow:3px 3px 0 #000;';
    win.innerHTML = `
      <div class="title-bar">
        <div class="title-bar-text">${_escHtml(fa.windowTitle)}</div>
        <div class="title-bar-controls"><button aria-label="Close" id="fa-close"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="color:#555;margin-bottom:3px;font-size:8px;">Source: ${_escHtml(fa.source)} | ${_gameTime()}</div>
        <div style="line-height:1.5;margin-bottom:4px;">${_escHtml(fa.content)}</div>
        <div style="font-size:8px;color:#808080;font-style:italic;">${_escHtml(fa.note || '')}</div>
      </div>`;

    document.getElementById('game-overlay').appendChild(win);

    document.getElementById('fa-close').onclick = () => {
      const timeOpen = (Date.now() - _faOpenTime) / 1000;
      Telemetry.logFAWindowClosed(State.turn, timeOpen);
      const w = document.getElementById('fa-window');
      if (w) w.style.display = 'none';
      _showFATaskbarItem(turnData.id);
    };
  }

  function closeFAWindow() {
    const w = document.getElementById('fa-window');
    if (w) w.remove();
  }

  function _showFATaskbarItem(turnId) {
    const tb = document.getElementById('taskbar-items');
    if (!tb || document.getElementById('tb-fa')) return;
    const btn = document.createElement('button');
    btn.id          = 'tb-fa';
    btn.textContent = `FA REPORT — T${turnId}`;
    btn.style.fontSize = '9px';
    btn.onclick = () => {
      const w = document.getElementById('fa-window');
      if (!w) return;
      w.style.display = w.style.display === 'none' ? '' : 'none';
    };
    tb.appendChild(btn);
  }

  function clearTaskbarFAItem() {
    const btn = document.getElementById('tb-fa');
    if (btn) btn.remove();
  }

  // ── xAI window ────────────────────────────────────────────────────
  let _xaiOpenTime = null;

  function showXAIWindow(turnData, confidenceValue) {
    closeXAIWindow();
    _xaiOpenTime = Date.now();

    const cond    = State.condition;
    const xai     = turnData.xai[cond];
    const isPushy = cond === 'pushy';

    const win = document.createElement('div');
    win.id        = 'xai-window';
    win.className = 'window';
    win.style.cssText = 'position:fixed;top:60px;right:20px;width:300px;z-index:101;box-shadow:3px 3px 0 #000;';
    win.innerHTML = `
      <div class="title-bar" style="${isPushy ? 'background:#800000;' : ''}">
        <div class="title-bar-text">ARIA — Confidence Explanation</div>
        <div class="title-bar-controls"><button aria-label="Close" id="xai-close"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="font-weight:bold;font-size:10px;margin-bottom:4px;">ARIA CONFIDENCE ASSESSMENT</div>
        <div style="color:${isPushy ? '#800000' : '#444'};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:2px;font-size:9px;">Current confidence: ${confidenceValue}%</div>
        <div style="font-weight:bold;font-size:9px;margin-bottom:3px;">Basis for assessment:</div>
        <div style="font-size:9px;line-height:1.5;margin-bottom:4px;">${xai.basis.map(b => '· ' + _escHtml(b)).join('<br>')}</div>
        <div style="font-size:8px;color:${isPushy ? '#888' : '#555'};font-style:italic;line-height:1.4;margin-bottom:4px;">${_escHtml(xai.datasetNote)}</div>
        <div style="font-size:${isPushy ? '9' : '8'}px;color:${xai.closingStyle};font-weight:${isPushy ? 'bold' : 'normal'};">${_escHtml(xai.closing)}</div>
      </div>`;

    document.getElementById('game-overlay').appendChild(win);

    document.getElementById('xai-close').onclick = () => {
      const timeOpen = (Date.now() - _xaiOpenTime) / 1000;
      Telemetry.logXAIWindowClosed(State.turn, timeOpen);
      closeXAIWindow();
      // Disable btn-xai for this turn — one-time read
      const btn = document.getElementById('btn-xai');
      if (btn) {
        btn.disabled = true;
        btn.title    = 'Already viewed this turn';
      }
    };
  }

  function closeXAIWindow() {
    const w = document.getElementById('xai-window');
    if (w) w.remove();
  }

  // ── Pushy popup ───────────────────────────────────────────────────
  // onActionTaken(actionId): player clicked the popup action button
  // onDismiss(): player clicked ×
  function showPushyPopup(turnData, onActionTaken, onDismiss) {
    removePushyPopup();
    const p = turnData.aria.pushy;
    Telemetry.logPushyPopupShown(State.turn, p.popupActionId);
    // Update alert badge immediately after telemetry increments
    updatePushyAlertBadge(Telemetry.pushyAlertCount);

    const popup = document.createElement('div');
    popup.id        = 'pushy-popup';
    popup.className = 'window';
    // Position to partially overlap the operations report (middle report)
    popup.style.cssText = 'position:fixed;top:110px;left:50%;transform:translateX(-20%);width:220px;z-index:200;box-shadow:3px 3px 0 #000;';
    popup.innerHTML = `
      <div class="title-bar" style="background:#800000;animation:tb-flash 0.7s infinite;">
        <div class="title-bar-text">${_escHtml(p.popupTitle)}</div>
        <div class="title-bar-controls"><button aria-label="Close" id="popup-close"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="font-weight:bold;color:#800000;margin-bottom:4px;">${_escHtml(p.popupBody)}</div>
        <button id="popup-action-btn" style="background:#000080;color:#fff;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:2px 6px;width:100%;font-weight:bold;cursor:pointer;">${_escHtml(p.popupActionLabel)}</button>
      </div>`;

    document.getElementById('game-overlay').appendChild(popup);

    document.getElementById('popup-close').onclick = () => {
      Telemetry.logPushyPopupDismissed(State.turn);
      removePushyPopup();
      if (onDismiss) onDismiss();
    };

    document.getElementById('popup-action-btn').onclick = () => {
      Telemetry.logPushyPopupActionTaken(State.turn, p.popupActionId);
      removePushyPopup();
      if (onActionTaken) onActionTaken(p.popupActionId);
    };
  }

  function removePushyPopup() {
    const p = document.getElementById('pushy-popup');
    if (p) p.remove();
  }

  // ── Consequence popup (delayed consequences + threshold events) ───
  // detail.label distinguishes threshold events from delayed consequences
  function showConsequencePopup(detail, onAcknowledge) {
    const { description, turn, effects } = detail;
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const isThreshold = !!detail.label;
    const titleText   = isThreshold
      ? `⚠ GRIDHUB — SYSTEM EVENT: ${detail.label}`
      : '⚠ GRIDHUB — SYSTEM CONSEQUENCE EVENT';
    const sublabel    = isThreshold
      ? `${detail.label.toUpperCase()} — T${turn}`
      : 'CONSEQUENCE ALERT';

    const id = 'conseq-' + Date.now();
    const popup = document.createElement('div');
    popup.className   = 'window consequence-popup';
    popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;z-index:300;box-shadow:3px 3px 0 #000;';
    popup.innerHTML = `
      <div class="title-bar" style="background:#804000;">
        <div class="title-bar-text">${_escHtml(titleText)}</div>
        <div class="title-bar-controls"><button aria-label="Close" id="${id}-x"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="font-size:8px;color:#804000;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">${_escHtml(sublabel)}</div>
        <div style="font-size:9px;line-height:1.5;margin-bottom:4px;">${_escHtml(description)}</div>
        <div style="font-size:8px;color:#808080;font-style:italic;margin-bottom:6px;">Source: GRIDHUB Automated Incident Monitor | ${time}</div>
        <button id="${id}-ack" style="background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:2px 8px;cursor:pointer;">[ ACKNOWLEDGE ]</button>
      </div>`;

    document.getElementById('game-overlay').appendChild(popup);
    window.GameAudio?.soundPopup();

    const ack = () => {
      if (!isThreshold) {
        Telemetry.logConsequencePopupAcknowledged(turn, effects, description);
        updateConsequenceBadge(Telemetry.consequenceCount);
      }
      window.GameAudio?.soundDismiss();
      popup.remove();
      if (onAcknowledge) onAcknowledge();
    };

    document.getElementById(`${id}-ack`).onclick = ack;
    document.getElementById(`${id}-x`).onclick   = ack;
  }

  // ── Between-turn environmental event popup (Phase 4c, AD-30) ─────
  // Fires at turn summary, before next incident loads.
  // Variable effect is NOT shown; applied silently on acknowledge.
  function showBetweenTurnPopup(event, onAcknowledge) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const id   = 'bte-' + Date.now();

    const popup = document.createElement('div');
    popup.className   = 'window';
    popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;z-index:300;box-shadow:3px 3px 0 #000;';
    popup.innerHTML = `
      <div class="title-bar" style="background:#804000;">
        <div class="title-bar-text">&#9888; GRIDHUB &#8212; ENVIRONMENTAL EVENT</div>
        <div class="title-bar-controls"><button aria-label="Close" id="${id}-x"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="font-size:8px;color:#804000;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">ENVIRONMENTAL EVENT</div>
        <div style="font-weight:bold;font-size:11px;margin-bottom:6px;">${_escHtml(event.title)}</div>
        <div style="font-size:11px;line-height:1.6;margin-bottom:8px;">${_escHtml(event.text)}</div>
        <div style="font-size:8px;color:#808080;font-style:italic;margin-bottom:8px;">Source: GRIDHUB Environmental Monitoring | ${time}</div>
        <button id="${id}-ack" style="background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:2px 8px;cursor:pointer;width:100%;">[ ACKNOWLEDGE ]</button>
      </div>`;

    document.getElementById('game-overlay').appendChild(popup);
    window.GameAudio?.soundPopup();

    const resolve = () => {
      window.GameAudio?.soundDismiss();
      popup.remove();
      if (onAcknowledge) onAcknowledge();
    };

    document.getElementById(`${id}-ack`).onclick = resolve;
    document.getElementById(`${id}-x`).onclick   = resolve;
  }

  // ── Sector Gazette newspaper popup (AD-38) ───────────────────────
  function showNewspaper(edition, onDismiss) {
    const id       = 'gazette-' + Date.now();
    const headline = _escHtml(edition.headline).replace(/\n/g, '<br>');
    // Body \n are source-code wraps only — let the browser reflow naturally
    const body     = _escHtml(edition.body).replace(/\n/g, ' ');

    const popup = document.createElement('div');
    popup.className   = 'window';
    popup.style.cssText =
      'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:420px;z-index:350;box-shadow:4px 4px 0 #000;';

    popup.innerHTML = `
      <div class="title-bar" style="background:#000080;">
        <div class="title-bar-text">Sector Bulletin &#8212; GRIDHUB Browser</div>
        <div class="title-bar-controls"><button aria-label="Close" id="${id}-x"></button></div>
      </div>

      <div style="background:#c0c0c0;padding:4px 5px;border-bottom:1px solid #808080;display:flex;align-items:center;gap:4px;">
        <button tabindex="-1" style="font-size:10px;padding:0 5px;line-height:16px;color:#808080;background:#c0c0c0;border:1px solid;border-color:#fff #808080 #808080 #fff;cursor:default;font-family:monospace;">&#9664;</button>
        <button tabindex="-1" style="font-size:10px;padding:0 5px;line-height:16px;color:#808080;background:#c0c0c0;border:1px solid;border-color:#fff #808080 #808080 #fff;cursor:default;font-family:monospace;">&#9654;</button>
        <input type="text" readonly value="http://news.gridhub.internal/sector-bulletin"
          style="flex:1;font-family:'Courier New',monospace;font-size:9px;padding:1px 4px;
                 border:1px solid;border-color:#808080 #fff #fff #808080;background:#fff;color:#000;outline:none;">
      </div>

      <div style="background:#f5f5f0;padding:12px;overflow-y:auto;max-height:400px;">

        <div style="font-family:Arial,sans-serif;font-weight:bold;font-size:16px;color:#1a1a3e;letter-spacing:2px;margin-bottom:2px;">SECTOR BULLETIN</div>
        <div style="font-size:9px;color:#808080;font-style:italic;margin-bottom:6px;">${_escHtml(edition.day)}</div>
        <div style="border-top:2px solid #1a1a3e;margin-bottom:6px;"></div>
        <div style="font-size:10px;color:#808080;font-style:italic;margin-bottom:12px;">ARIA SYSTEM ROLLOUT ENTERS SECOND YEAR &#8212; MIXED REVIEWS FROM SECTOR OPERATORS</div>

        <div style="font-family:'Arial Black',Arial,sans-serif;font-weight:bold;font-size:15px;color:#1a1a3e;text-transform:uppercase;line-height:1.3;margin-bottom:10px;">${headline}</div>

        <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;color:#222;line-height:1.8;max-width:360px;">${body}</div>

        <div style="border-top:1px solid #b0b0a0;margin:12px 0 8px;"></div>

        <div style="font-size:10px;color:#000080;">
          Related: Contractor availability reduced across southern sectors &nbsp;|&nbsp; Sector maintenance backlog review &#8212; Q2 report
        </div>

      </div>`;

    document.getElementById('game-overlay').appendChild(popup);

    document.getElementById(`${id}-x`).onclick = () => {
      popup.remove();
      if (onDismiss) onDismiss();
    };
  }

  // ── Placeholder consequence popup (comms turn ARIA_FULL mode) ────
  function showPlaceholderConsequencePopup(submittedText, onAcknowledge) {
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    // Extract clauses from the actual submitted draft that contain unfilled template tags
    const parts   = submittedText.split(/\. */).filter(s => /\[/.test(s));
    const excerpt = parts.length ? parts.join('. ') + '.' : submittedText;
    const popup = document.createElement('div');
    popup.className   = 'window';
    popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:340px;z-index:500;box-shadow:3px 3px 0 #000;';
    popup.innerHTML = `
      <div class="title-bar" style="background:#804000;">
        <div class="title-bar-text">⚠ COMMS INCIDENT — Public Advisory</div>
        <div class="title-bar-controls"><button aria-label="Close" id="ph-x"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="font-size:8px;color:#804000;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">ADVISORY ERROR — UNFILLED TEMPLATE PUBLISHED</div>
        <div style="font-size:9px;line-height:1.5;margin-bottom:4px;">The published advisory contained unresolved template references. The statement as issued read: <em>"...${_escHtml(excerpt)}..."</em> The advisory has been withdrawn. Public Confidence −12.</div>
        <div style="font-size:8px;color:#808080;font-style:italic;margin-bottom:6px;">Source: Communications Monitoring System | ${time}</div>
        <button id="ph-ack" style="background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:2px 8px;cursor:pointer;">[ ACKNOWLEDGE ]</button>
      </div>`;
    document.body.appendChild(popup);
    window.GameAudio?.soundPopup();
    const ack = () => {
      Telemetry.logConsequencePopupAcknowledged(State.turn, { confidence: -12 }, 'Advisory error — unfilled template published');
      updateConsequenceBadge(Telemetry.consequenceCount);
      window.GameAudio?.soundDismiss();
      popup.remove();
      if (onAcknowledge) onAcknowledge();
    };
    document.getElementById('ph-ack').onclick = ack;
    document.getElementById('ph-x').onclick   = ack;
  }

  // ── Voicemail window (Phase 7b, AD-45) ───────────────────────────
  // DOM only — trigger selection, the API call, and telemetry live in turns.js.
  function showVoicemailWindow(meta, timeStr, { onPlay, onDismiss }) {
    hideVoicemailWindow();

    const win = document.createElement('div');
    win.id        = 'voicemail-window';
    win.className = 'window';
    win.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:360px;z-index:1200;box-shadow:3px 3px 0 #000;';
    win.innerHTML = `
      <div class="title-bar" style="background:#1a1a4a;">
        <div class="title-bar-text">⚠ GRIDHUB — INCOMING MESSAGE</div>
        <div class="title-bar-controls"><button aria-label="Close" id="btn-voicemail-close"></button></div>
      </div>
      <div class="window-body" style="font-size:10px;padding:8px;">
        <table style="width:100%;font-size:10px;margin-bottom:8px;border-collapse:collapse;">
          <tr><td style="color:#555;width:80px;padding:1px 0;">FROM:</td><td style="font-weight:bold;color:#000080;">${_escHtml(meta.from)}</td></tr>
          <tr><td style="color:#555;padding:1px 0;">TIME:</td><td style="color:#333;">${_escHtml(timeStr)}</td></tr>
          <tr><td style="color:#555;padding:1px 0;">RE:</td><td style="color:#333;">${_escHtml(meta.subject)}</td></tr>
        </table>
        <hr style="border-color:#ccc;margin:6px 0;">
        <div id="voicemail-play-area" style="text-align:center;padding:6px 0;">
          <button id="btn-play-voicemail" style="font-size:11px;padding:4px 16px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;cursor:pointer;">▶ PLAY MESSAGE</button>
        </div>
        <div id="voicemail-text" style="display:none;background:#f8f8f0;border:1px inset #808080;padding:8px;font-size:10px;line-height:1.7;margin-top:6px;font-family:Arial,sans-serif;color:#222;font-style:italic;min-height:60px;"></div>
        <hr style="border-color:#ccc;margin:8px 0;">
        <div style="display:flex;gap:6px;justify-content:flex-end;">
          <button id="btn-voicemail-acknowledge" style="font-size:10px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:2px 8px;cursor:pointer;">[ ACKNOWLEDGE ]</button>
          <button id="btn-voicemail-escalate" style="font-size:10px;background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;padding:2px 8px;cursor:pointer;">[ ESCALATE TO MANAGER ]</button>
        </div>
        <div style="font-size:8px;color:#888;margin-top:4px;text-align:right;">Both options log receipt. No further action required.</div>
      </div>`;

    document.getElementById('game-overlay').appendChild(win);
    window.GameAudio?.soundPopup();

    document.getElementById('btn-play-voicemail').onclick = () => { if (onPlay) onPlay(); };

    const dismiss = replyOption => { if (onDismiss) onDismiss(replyOption); };
    document.getElementById('btn-voicemail-acknowledge').onclick = () => dismiss('ACKNOWLEDGE');
    document.getElementById('btn-voicemail-escalate').onclick    = () => dismiss('ESCALATE');
    document.getElementById('btn-voicemail-close').onclick       = () => dismiss('CLOSE');
  }

  function showVoicemailLoading() {
    const btnArea = document.getElementById('voicemail-play-area');
    const textEl  = document.getElementById('voicemail-text');
    if (btnArea) btnArea.style.display = 'none';
    if (textEl) {
      textEl.style.display = 'block';
      textEl.textContent   = 'Loading message…';
    }
  }

  function revealVoicemailTypewriter(text) {
    const textEl = document.getElementById('voicemail-text');
    if (!textEl) return;
    textEl.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[i];
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 25);
  }

  function hideVoicemailWindow() {
    const w = document.getElementById('voicemail-window');
    if (w) w.remove();
  }

  // ── Action buttons ────────────────────────────────────────────────
  function renderActions(turnData) {
    const container = document.getElementById('action-list');
    if (!container) return;
    container.innerHTML = '';

    const cond    = State.condition;
    const actions = turnData.actions.filter(a => a.condition === 'both' || a.condition === cond);

    actions.forEach(action => {
      const isRec = action.isAriaRec[cond];
      const btn   = document.createElement('button');
      btn.className      = 'action-btn' + (isRec && cond === 'pushy' ? ' action-btn-aria' : '');
      btn.dataset.actionId = action.id;
      btn.innerHTML = `<span class="act-name">▶ ${_escHtml(action.name)}</span>` +
        `<span class="act-imm">Imm: ${_escHtml(action.immediateText)}</span>` +
        `<span class="act-del">Risk: ${_escHtml(action.delayedText)}</span>` +
        (isRec && cond === 'pushy' ? '<span class="aria-tag"> ← ARIA</span>' : '');
      btn.onclick = () => Turns.handleActionSelect(action);
      container.appendChild(btn);
    });
  }

  // ── Incident panel ────────────────────────────────────────────────
  function renderIncident(turnData) {
    const inc = turnData.incident;
    const el  = document.getElementById('incident-panel');
    if (!el) return;

    const priorityBg = { high: '#000080', critical: '#800000', moderate: '#444' };
    const bg = priorityBg[inc.priorityStyle] || '#000080';

    el.innerHTML = `
      <div class="title-bar">
        <div class="title-bar-text">Incident — ${_escHtml(inc.title)}</div>
        <div class="title-bar-controls"><button aria-label="Close"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;overflow-y:auto;max-height:55vh;">
        <div style="background:${bg};color:#fff;font-size:8px;padding:1px 3px;display:inline-block;margin-bottom:2px;">PRIORITY: ${_escHtml(inc.priority)}</div>
        <div style="font-size:10px;font-weight:bold;margin-bottom:3px;">${_escHtml(inc.title)}</div>
        <div style="font-size:9px;line-height:1.4;margin-bottom:4px;">${_escHtml(inc.body)}</div>
        ${inc.reports.map(r => `<div class="report-box"><span class="rpt-label">${_escHtml(r.label)}</span>${_escHtml(r.text)}</div>`).join('')}
        <button id="btn-fa" class="fa-btn">${_escHtml(turnData.fa.buttonLabel)}</button>
      </div>`;

    document.getElementById('btn-fa').onclick = () => Turns.handleFARequest();
  }

  // ── T3 progressive incident rendering ─────────────────────────────
  function renderIncidentT3Start(turnData) {
    const inc = turnData.incident;
    const el  = document.getElementById('incident-panel');
    if (!el) return;
    const priorityBg = { high: '#000080', critical: '#800000', moderate: '#444' };
    const bg = priorityBg[inc.priorityStyle] || '#000080';
    el.innerHTML = `
      <div class="title-bar">
        <div class="title-bar-text">Incident — ${_escHtml(inc.title)}</div>
        <div class="title-bar-controls"><button aria-label="Close"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;overflow-y:auto;max-height:55vh;">
        <div style="background:${bg};color:#fff;font-size:8px;padding:1px 3px;display:inline-block;margin-bottom:2px;">PRIORITY: ${_escHtml(inc.priority)}</div>
        <div style="font-size:10px;font-weight:bold;margin-bottom:3px;">${_escHtml(inc.title)}</div>
        <div style="font-size:9px;line-height:1.4;margin-bottom:4px;">${_escHtml(inc.body)}</div>
        <div id="t3-reports-container"></div>
        <button id="btn-fa" class="fa-btn">${_escHtml(turnData.fa.buttonLabel)}</button>
      </div>`;
    document.getElementById('btn-fa').onclick = () => Turns.handleFARequest();
  }

  function appendReport(turnData, index) {
    const container = document.getElementById('t3-reports-container');
    if (!container) return;
    const r = turnData.incident.reports[index];
    const div = document.createElement('div');
    div.className = 'report-box';
    div.innerHTML = `<span class="rpt-label">${_escHtml(r.label)}</span>${_escHtml(r.text)}`;
    container.appendChild(div);
  }

  function appendReportPartial(turnData, index) {
    const container = document.getElementById('t3-reports-container');
    if (!container) return;
    const r = turnData.incident.reports[index];
    const shortText = r.text.split('.')[0] + '.';
    const div = document.createElement('div');
    div.className = 'report-box';
    div.id = 't3-report-partial';
    div.innerHTML = `<span class="rpt-label">${_escHtml(r.label)}</span><span style="color:#444;">${_escHtml(shortText)}</span> <span class="t3-partial-status" style="color:#808080;font-style:italic;">Retrieving additional data…</span>`;
    container.appendChild(div);
  }

  function updateReportToTimeout() {
    const statusEl = document.querySelector('#t3-report-partial .t3-partial-status');
    if (statusEl) {
      statusEl.style.color     = '#800000';
      statusEl.style.fontStyle = 'italic';
      statusEl.textContent     = 'DATA UNAVAILABLE — Source: GRIDHUB Archive';
    }
  }

  function renderActionsLocked(turnData) {
    renderActions(turnData);
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.disabled      = true;
      btn.style.opacity = '0.4';
    });
  }

  function unlockActions() {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.disabled      = false;
      btn.style.opacity = '1';
    });
  }

  function showARIADegraded(staleConfidenceValue, memoryPrefix = null) {
    const panel = document.getElementById('aria-panel');
    if (!panel) return;
    const cond    = State.condition;
    const isPushy = cond === 'pushy';
    const flashStyle = isPushy
      ? 'animation:tb-flash 0.7s infinite;background:#800000;'
      : 'background:#000080;';

    // AD-37: memory prefix appears above degraded ARIA text in pushy condition
    const memoryHtml = (isPushy && memoryPrefix)
      ? `<span style="color:#ff8080;display:block;margin-bottom:6px;">${_escHtml(memoryPrefix)}</span>`
      : '';

    panel.innerHTML = `
      <div class="title-bar" id="aria-titlebar" style="${flashStyle}">
        <div class="title-bar-text">${isPushy ? '⚠ ARIA — DIRECTIVE' : 'AI Advisory — ARIA'}</div>
        <div class="title-bar-controls"><button aria-label="Close"></button></div>
      </div>
      <div class="window-body" style="padding:4px;font-size:9px;overflow-y:auto;">
        <div style="color:#808080;font-size:8px;margin-bottom:3px;">● ANALYSIS UNAVAILABLE</div>
        <div class="${isPushy ? 'aria-log-pushy' : 'aria-log-calm'}">${memoryHtml}<span style="color:#808080;font-style:italic;">&gt; ARIA: ANALYSIS REQUEST TIMEOUT<br>&gt; Recommendation unavailable this turn.</span></div>
        <button id="btn-xai" disabled title="Analysis unavailable" style="font-size:8px;margin-bottom:3px;color:#808080;opacity:0.5;">? WHY THIS CONFIDENCE</button>
        <hr class="metric-divider">
        <div style="font-size:8px;color:#808080;margin-bottom:2px;">Confidence — T3 (stale)</div>
        <div class="bar-outer" style="margin-bottom:2px;">
          <div class="bar-inner" style="width:${staleConfidenceValue}%;background:#808080;"></div>
        </div>
        <div style="font-size:8px;color:#808080;margin-bottom:3px;">${staleConfidenceValue}% — CONFIDENCE DATA STALE — last updated: T2</div>
        <hr class="metric-divider">
        ${_renderPreviousARIA()}
        <div id="aria-alert-count" style="font-size:8px;color:#800000;font-weight:bold;margin-bottom:2px;display:none;">UNACKNOWLEDGED: 0</div>
        <div id="consequence-badge" style="margin-bottom:3px;display:none;">
          <span style="background:#804000;color:#fff;font-size:9px;padding:0 5px;border:2px solid;border-color:#808080 #fff #fff #808080;font-weight:bold;">⚠ ALERTS DISMISSED: <span id="consequence-count">0</span></span>
        </div>
        <div class="${isPushy ? 'aria-limitations-pushy' : 'aria-limitations-calm'}">
          ARIA analysis may be incomplete or based on inaccurate inputs. All decisions remain the responsibility of the duty operator.
        </div>
        ${_murmurPanelHTML()}
      </div>`;

    updateConsequenceBadge(Telemetry.consequenceCount);
    updatePushyAlertBadge(Telemetry.pushyAlertCount);
    Murmur.mount();
  }

  // ── Summary screen ────────────────────────────────────────────────
  function renderSummary(sessionData) {
    window.GameAudio?.soundSessionEnd();
    const screen = document.getElementById('screen-summary');
    if (!screen) return;

    const v        = sessionData.finalVars;
    const log      = sessionData.actionLog;
    const collapse = sessionData.systemCollapse;
    const tags     = sessionData.narrativeTags || [sessionData.archetypeLabel];
    const primaryTag = tags[0];
    const tbStyle    = collapse ? 'background:#800000;' : '';
    const condLabel  = sessionData.condition === 'pushy' ? 'CONDITION B (PUSHY)' : 'CONDITION A (CALM)';

    const tagBadgesHtml = tags.map(tag => {
      const isCollapse = tag === 'System Collapse';
      return `<span class="traj-badge" style="border-color:${isCollapse ? '#ff4444' : '#4488ff'};${isCollapse ? 'background:#1a0000;' : ''}margin-right:4px;">${_escHtml(tag.toUpperCase())}</span>`;
    }).join('');

    const actionLogHtml = log.map(e =>
      `<span style="color:#888;font-size:8px;">T${e.turn}</span>&nbsp;<span style="color:#aaa;font-size:8px;">${_escHtml(e.actionName)}</span>`
    ).join(' · ');

    screen.innerHTML = `
      <div class="window" style="width:640px;max-height:90vh;overflow-y:auto;">
        <div class="title-bar" style="${tbStyle}">
          <div class="title-bar-text">Session Post-Mortem — Sector Management Division</div>
          <div class="title-bar-controls"><button aria-label="Close"></button></div>
        </div>
        <div class="window-body">
          <div class="terminal">
            <div class="t-dim">GRIDHUB | ${new Date().toISOString().slice(0,10)} | ${_escHtml(sessionData.participant_id || 'UNKNOWN')} | ${condLabel}</div>
            <div class="t-sep"></div>
            <div class="t-head" style="margin-bottom:2px;">SESSION TRAJECTORY</div>
            <div style="margin:4px 0 2px;">${tagBadgesHtml}</div>
            <div class="t-body" style="margin:6px 0;">${_escHtml(_trajectoryBlurb(primaryTag, sessionData))}</div>
            <div class="t-sep"></div>
            <div class="t-head" style="margin-bottom:3px;">BEHAVIOURAL DATA</div>
            <div class="data-grid">
              <div class="data-box"><div class="t-label">AI followed</div><div class="t-num">${sessionData.aiFollowCount}/6</div><div class="t-warn">${sessionData.aiFollowRate.bracket} reliance</div></div>
              <div class="data-box"><div class="t-label">Further analysis</div><div class="t-num">${sessionData.faRequestedCount}</div><div class="t-label">turns requested</div></div>
              <div class="data-box"><div class="t-label">xAI viewed</div><div class="t-num">${sessionData.xaiViewedCount}/6</div></div>
              <div class="data-box"><div class="t-label">Alerts dismissed</div><div class="t-num">${sessionData.consequence_alerts_dismissed_total}</div></div>
            </div>
            <div class="t-sep"></div>
            <div class="t-head" style="margin-bottom:4px;">VARIABLE TRAJECTORIES</div>
            ${_varRow('STABILITY',       70, v.stability)}
            ${_varRow('RESOURCES',       70, v.resources)}
            ${_varRow('WORKLOAD',        30, v.workload)}
            ${_varRow('PUB. CONFIDENCE', 70, v.confidence)}
            <div class="t-sep"></div>
            <div class="t-head" style="margin-bottom:2px;">ACTION LOG</div>
            <div style="line-height:1.8;">${actionLogHtml}</div>
            <div class="t-sep"></div>
            <div class="t-dim">Report generated by GRIDHUB automated systems. Session data archived. ■</div>
          </div>
          <div style="margin-top:6px;display:flex;gap:4px;">
            <button onclick="Main.showVignette(window._lastSessionData)">▶ View narrative report</button>
            <button onclick="window.print()">⎙ Print report</button>
          </div>
        </div>
      </div>`;
  }

  function _trajectoryBlurb(label, sd) {
    switch (label) {
      case 'System Collapse':
        return 'Resource reserves or system stability fell below critical threshold. Effective response in the final operational periods was prevented.';
      case 'AI Dependence':
        return `Operator followed automated advisory outputs on ${sd.aiFollowCount} of 6 turns. Independent assessment of available evidence was limited throughout the session.`;
      case 'Controlled Recovery':
        return 'All system variables were maintained above critical thresholds at session close. Operational management was broadly effective across the six-turn period.';
      case 'Preventative Management':
        return 'Operator initiated emergency rerouting at Turn 1, ahead of threshold breach. Preventative action reduced downstream impact on stability and public confidence.';
      case 'Public Confidence First':
        return 'Operator prioritised public-facing actions at Turn 2 and Turn 4. Variable trajectories reflect a bias toward confidence management over internal resource preservation.';
      case 'Deferred Escalation':
        return 'Operator deferred escalation at Turn 3 and continued monitoring at Turn 4. Delayed response extended exposure to instability.';
      case 'Resource Preservation':
        return 'Operator selected cost-preserving actions on 4 or more turns. Resource reserves were protected; operational flexibility was maintained.';
      case 'Reactive Stabilisation':
        return 'Operator monitored at Turn 1 and initiated maintenance at Turn 5. Stability was managed reactively rather than proactively.';
      default:
        return 'Session completed within standard operational parameters. Variable trajectories showed no single dominant pattern.';
    }
  }

  function _varRow(label, start, end) {
    return `<div class="var-row">
      <div class="var-name">${label}</div>
      <div class="mini-bar"><div class="mini-fill" style="width:${start}%;background:#008000;"></div></div>
      <div class="var-val" style="color:#aaa;">${start}%</div>
      <div style="color:#555;font-size:8px;margin:0 2px;">→</div>
      <div class="mini-bar"><div class="mini-fill" style="width:${end}%;background:${_barColour(end)};"></div></div>
      <div class="var-val" style="color:${_barColour(end)};">${end}%</div>
    </div>`;
  }

  // ── Helpers ───────────────────────────────────────────────────────
  function _escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _gameTime() {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  return {
    updateVarBars,
    updateTurnCounter,
    startClock,
    stopClock,
    showCentreSpinner,
    hideCentreSpinner,
    addStackNotification,
    clearNotificationStack,
    showTimerDisplay,
    updateTimerDisplay,
    clearTimerDisplay,
    showDutyLogModal,
    showTurnSummaryLoading,
    setTurnSummaryText,
    clearTurnSummary,
    showVoicemailWindow,
    showVoicemailLoading,
    revealVoicemailTypewriter,
    hideVoicemailWindow,
    updatePushyAlertBadge,
    renderARIA,
    updateTurnLog,
    updateConsequenceBadge,
    showFAWindow,
    closeFAWindow,
    clearTaskbarFAItem,
    showXAIWindow,
    closeXAIWindow,
    showPushyPopup,
    removePushyPopup,
    showConsequencePopup,
    showBetweenTurnPopup,
    showNewspaper,
    showPlaceholderConsequencePopup,
    renderActions,
    renderIncident,
    renderIncidentT3Start,
    appendReport,
    appendReportPartial,
    updateReportToTimeout,
    renderActionsLocked,
    unlockActions,
    showARIADegraded,
    renderSummary,
  };
})();
