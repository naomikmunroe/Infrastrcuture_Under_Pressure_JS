<<<<<<< HEAD
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
  function renderARIA(turnData, confidenceValue) {
    const cond     = State.condition;
    const aria     = turnData.aria[cond];
    const panel    = document.getElementById('aria-panel');
    const turnIdx  = State.turn - 1; // 0-based
    if (!panel) return;

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

    panel.innerHTML = `
      <div class="title-bar" id="aria-titlebar" style="${flashStyle}">
        <div class="title-bar-text">${isPushy ? '⚠ ARIA — DIRECTIVE' : 'AI Advisory — ARIA'}</div>
        <div class="title-bar-controls"><button aria-label="Close"></button></div>
      </div>
      <div class="window-body" style="padding:4px;font-size:9px;overflow-y:auto;">
        <div style="color:${aria.modeColor};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:3px;font-size:8px;">${aria.modeLabel}</div>
        <div class="${isPushy ? 'aria-log-pushy' : 'aria-log-calm'}">${_escHtml(aria.text)}${cursor}</div>
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
      </div>`;

    document.getElementById('btn-xai').onclick = () => Turns.handleXAIRequest();

    // Restore badges after re-render
    updateConsequenceBadge(Telemetry.consequenceCount);
    updatePushyAlertBadge(Telemetry.pushyAlertCount);
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

  // ── Consequence popup ─────────────────────────────────────────────
  function showConsequencePopup(detail, onAcknowledge) {
    const { description, turn, effects } = detail;
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const popup = document.createElement('div');
    popup.className   = 'window consequence-popup';
    popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;z-index:300;box-shadow:3px 3px 0 #000;';
    popup.innerHTML = `
      <div class="title-bar" style="background:#804000;">
        <div class="title-bar-text">⚠ GRIDHUB — SYSTEM CONSEQUENCE EVENT</div>
        <div class="title-bar-controls"><button aria-label="Close" id="conseq-x"></button></div>
      </div>
      <div class="window-body" style="font-size:9px;font-family:'Courier New',monospace;">
        <div style="font-size:8px;color:#804000;font-weight:bold;letter-spacing:1px;margin-bottom:3px;">CONSEQUENCE ALERT</div>
        <div style="font-size:9px;line-height:1.5;margin-bottom:4px;">${_escHtml(description)}</div>
        <div style="font-size:8px;color:#808080;font-style:italic;margin-bottom:6px;">Source: GRIDHUB Automated Systems | ${time}</div>
        <button id="conseq-ack" style="background:#c0c0c0;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:2px 8px;cursor:pointer;">[ ACKNOWLEDGE ]</button>
      </div>`;

    document.getElementById('game-overlay').appendChild(popup);

    const ack = () => {
      Telemetry.logConsequencePopupAcknowledged(turn, effects, description);
      updateConsequenceBadge(Telemetry.consequenceCount);
      popup.remove();
      if (onAcknowledge) onAcknowledge();
    };

    document.getElementById('conseq-ack').onclick = ack;
    document.getElementById('conseq-x').onclick   = ack;
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
=======
/**
 * ui.js — DOM construction and update helpers.
 * No game logic here. Reads from State, dispatches events upward.
 */

const UI = (() => {

  // ── VARIABLE BARS ─────────────────────────────────────────────────────
  function updateVarBars(vars) {
    ['stability','resources','workload','confidence'].forEach(k => {
      const fill  = document.getElementById(`bar-${k}`);
      const label = document.getElementById(`val-${k}`);
      if (!fill || !label) return;

      const pct = vars[k];
      fill.style.width = pct + '%';
      label.textContent = pct;

      fill.classList.remove('critical','warning');
      if (k === 'workload') {
        if (pct >= 75) fill.classList.add('critical');
        else if (pct >= 50) fill.classList.add('warning');
      } else {
        if (pct < 20)      fill.classList.add('critical');
        else if (pct < 40) fill.classList.add('warning');
      }
    });
  }

  // ── REPORTS ──────────────────────────────────────────────────────────
  function renderReports(reports) {
    const container = document.getElementById('reports-container');
    if (!container) return;
    container.innerHTML = '';
    reports.forEach(r => {
      const div = document.createElement('div');
      div.className = 'report-block';
      div.innerHTML = `
        <div class="report-header">${r.label} — <em>${r.source}</em></div>
        <div class="report-body"><ul>${r.bullets.map(b=>`<li>${b}</li>`).join('')}</ul></div>
      `;
      container.appendChild(div);
    });
  }

  // ── ACTIONS ───────────────────────────────────────────────────────────
  function renderActions(actions, onSelect) {
    const container = document.getElementById('actions-container');
    if (!container) return;
    container.innerHTML = '';
    actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className   = 'action-btn';
      btn.dataset.id  = a.id;
      btn.innerHTML   = `
        <strong>${a.name}</strong><br>
        <span class="action-cost">${a.immediate}</span><br>
        <span class="action-risk">Future risk: ${a.delayed}</span>
      `;
      btn.addEventListener('click', () => onSelect(a));
>>>>>>> 464c21bc7439d9e29667dac0b9839d3259148ac8
      container.appendChild(btn);
    });
  }

<<<<<<< HEAD
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

  // ── Summary screen ────────────────────────────────────────────────
  function renderSummary(sessionData) {
    const screen = document.getElementById('screen-summary');
    if (!screen) return;

    const v        = sessionData.finalVars;
    const log      = sessionData.actionLog;
    const collapse = sessionData.systemCollapse;
    const tbStyle  = collapse ? 'background:#800000;' : '';
    const label    = sessionData.archetypeLabel;
    const trajColour = collapse ? '#ff4444' : '#4488ff';
    const condLabel  = sessionData.condition === 'pushy' ? 'CONDITION B (PUSHY)' : 'CONDITION A (CALM)';

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
            <div class="traj-badge" style="border-color:${trajColour};${collapse ? 'background:#1a0000;' : ''}">${_escHtml(label.toUpperCase())}</div>
            <div class="t-body" style="margin:6px 0;">${_escHtml(_trajectoryBlurb(label, sessionData))}</div>
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
    renderActions,
    renderIncident,
    renderSummary,
  };
})();
=======
  // ── FURTHER ANALYSIS WINDOW ───────────────────────────────────────────
  let _faWindowOpenTime = null;

  function showFAWindow(fa, onClose) {
    const win = document.getElementById('window-fa');
    if (!win) return;

    win.querySelector('.window-body').innerHTML =
      `<p><strong>Further Analysis — ${fa.expandedReport}</strong></p>
       <p style="margin-top:6px;font-size:11px;line-height:1.6">${fa.text}</p>`;

    win.className = `floating-window window fa-${fa.confidence === 'high' ? 'contradiction' : 'vague'}`;
    win.style.display = 'block';
    _faWindowOpenTime = Date.now();
    Telemetry.logFAWindowOpened();

    win.querySelector('.title-bar-close').onclick = () => {
      win.style.display = 'none';
      const timeOpen = Date.now() - _faWindowOpenTime;
      Telemetry.logFAWindowClosed(timeOpen);
      // Show minimised taskbar button
      const tbBtn = document.getElementById('taskbar-fa-btn');
      if (tbBtn) {
        tbBtn.textContent = `FA REPORT — T${State.turn}`;
        tbBtn.classList.add('visible');
        tbBtn.onclick = () => {
          win.style.display = 'block';
          tbBtn.classList.remove('visible');
        };
      }
      if (onClose) onClose();
    };

    makeDraggable(win);
  }

  // ── xAI WINDOW ────────────────────────────────────────────────────────
  function showXAIWindow(condition, confidenceValue) {
    const win  = document.getElementById('window-xai');
    const data = XAI_TEXT[condition];
    if (!win || !data) return;

    win.className = `floating-window window ${condition}`;
    win.querySelector('.window-body').innerHTML = `
      <p style="font-size:10px;color:#555;margin-bottom:4px">ARIA CONFIDENCE ASSESSMENT</p>
      <p style="margin-bottom:6px">Current confidence: <strong>${confidenceValue}%</strong></p>
      <p style="font-weight:bold;font-size:10px">Basis for assessment:</p>
      <ul style="font-size:10px;margin:4px 0 8px 12px;line-height:1.6">
        ${data.basis.map(b=>`<li>${b}</li>`).join('')}
      </ul>
      <p class="xai-dataset-note">${data.datasetNote}</p>
      <p class="${condition === 'pushy' ? 'xai-directive' : ''}" style="margin-top:6px;font-size:10px">
        ${data.footer}
      </p>
    `;

    win.style.display = 'block';
    Telemetry.logXAIViewed();

    win.querySelector('.title-bar-close').onclick = () => {
      win.style.display = 'none';
      // Cannot re-open this turn
      document.getElementById('btn-xai').disabled = true;
    };

    makeDraggable(win);
  }

  // ── ARIA PANEL ─────────────────────────────────────────────────────────
  function updateARIA(condition, text, confidenceValue) {
    const log    = document.getElementById('aria-log');
    const bar    = document.getElementById('aria-confidence-bar');
    const label  = document.getElementById('aria-confidence-label');
    const alerts = document.getElementById('aria-alert-counter');
    const limits = document.getElementById('aria-limitations');

    if (log) {
      log.className = `aria-log ${condition}`;
      log.textContent = text;
    }
    if (bar)   bar.style.width = confidenceValue + '%';
    if (label) {
      if (condition === 'pushy') {
        label.textContent = `${confidenceValue}% — ACT NOW`;
        label.className   = 'act-now';
      } else {
        label.textContent = `${confidenceValue}% — uncertainty acknowledged`;
        label.className   = '';
      }
    }
    if (alerts) alerts.classList.toggle('visible', condition === 'pushy');
    if (limits) limits.className = `aria-limitations ${condition}`;
  }

  // ── STATUS POPUP ──────────────────────────────────────────────────────
  const STATUS_TEXT = {
    stability: [
      [60, "All monitored infrastructure sectors are operating within expected parameters. No active interventions are currently required."],
      [30, "One or more infrastructure sectors are showing signs of stress. Continued monitoring is recommended."],
      [0,  "Infrastructure integrity is at risk. Immediate intervention may be required to prevent further degradation."],
    ],
    resources: [
      [50, "Staffing and operational reserves are within acceptable limits for the current demand level."],
      [20, "Operational reserves are below preferred levels. Resource allocation decisions may affect response capacity."],
      [0,  "Reserve capacity is critically low. Further expenditure may compromise operational response capability."],
    ],
    workload: [
      [50, "Current task load is within operational norms. Decision quality is unlikely to be affected at this level."],
      [75, "Operator workload is above baseline. Prioritisation of tasks is recommended to maintain decision quality."],
      [0,  "Workload is at a level associated with reduced decision quality in comparable operational contexts."],
    ],
    confidence: [
      [60, "Public awareness of current operational conditions remains limited. No media inquiries have been recorded."],
      [30, "Public concern regarding service status is increasing. Communications are being monitored."],
      [0,  "Public confidence has deteriorated significantly. Operational decisions are subject to external visibility."],
    ],
  };

  function showStatusPopup(metric, value) {
    const thresholds = STATUS_TEXT[metric];
    const text = thresholds.find(([t]) => value >= t)?.[1] || thresholds[thresholds.length-1][1];
    const win  = document.getElementById('window-status');
    if (!win) return;
    win.querySelector('.title-bar-text').textContent = `STATUS REPORT — ${metric.toUpperCase()}`;
    win.querySelector('.window-body').innerHTML =
      `<p style="font-size:11px;line-height:1.6">${text}</p>`;
    win.style.display = 'block';
    win.querySelector('.title-bar-close').onclick = () => win.style.display = 'none';
  }

  // ── DRAGGABLE ─────────────────────────────────────────────────────────
  function makeDraggable(el) {
    const titleBar = el.querySelector('.title-bar');
    if (!titleBar) return;
    let ox = 0, oy = 0, mx = 0, my = 0;
    titleBar.onmousedown = e => {
      e.preventDefault();
      mx = e.clientX; my = e.clientY;
      document.onmouseup   = () => { document.onmouseup = null; document.onmousemove = null; };
      document.onmousemove = e => {
        ox = mx - e.clientX; oy = my - e.clientY;
        mx = e.clientX;      my = e.clientY;
        el.style.top  = (el.offsetTop  - oy) + 'px';
        el.style.left = (el.offsetLeft - ox) + 'px';
      };
    };
  }

  // ── PUBLIC ────────────────────────────────────────────────────────────
  return { updateVarBars, renderReports, renderActions, showFAWindow, showXAIWindow, updateARIA, showStatusPopup };
})();

// Re-render bars whenever vars change
document.addEventListener('varsChanged', e => UI.updateVarBars(e.detail));
>>>>>>> 464c21bc7439d9e29667dac0b9839d3259148ac8
