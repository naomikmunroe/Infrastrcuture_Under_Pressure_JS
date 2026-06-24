// ui.js — all rendering. Reads state; does not write it.
// No game logic here.

const UI = (() => {

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
    // Show critical indicator in pushy condition
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

  // ── ARIA panel ────────────────────────────────────────────────────
  function renderARIA(turnData, confidenceValue) {
    const cond  = State.condition;
    const aria  = turnData.aria[cond];
    const panel = document.getElementById('aria-panel');
    if (!panel) return;

    const isPushy  = cond === 'pushy';
    const barBg    = isPushy ? '#800000' : '#2d6a9f';
    const confLabel = isPushy ? 'ACT NOW' : _confidenceLabel(confidenceValue);
    const flashStyle = isPushy ? 'animation:tb-flash 0.7s infinite;background:#800000;' : 'background:#000080;';

    panel.innerHTML = `
      <div class="title-bar" id="aria-titlebar" style="${flashStyle}">
        <div class="title-bar-text">${isPushy ? '⚠ ARIA — DIRECTIVE' : 'AI Advisory — ARIA'}</div>
        <div class="title-bar-controls"><button aria-label="Close"></button></div>
      </div>
      <div class="window-body" style="padding:4px;font-size:9px;overflow-y:auto;">
        <div style="color:${aria.modeColor};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:3px;font-size:8px;">${aria.modeLabel}</div>
        <div class="aria-log ${isPushy ? 'aria-log-pushy' : 'aria-log-calm'}">${_escHtml(aria.text)}</div>
        <button id="btn-xai" style="font-size:8px;margin-bottom:3px;${isPushy ? 'border-color:#800000;color:#800000;' : ''}">? WHY THIS CONFIDENCE</button>
        <hr class="metric-divider">
        <div style="font-size:8px;color:${isPushy ? '#800000' : '#444'};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:2px;">Confidence${isPushy ? '' : ` — T${turnData.id}`}</div>
        <div class="bar-outer" style="margin-bottom:2px;">
          <div class="bar-inner" style="width:${confidenceValue}%;background:${barBg};"></div>
        </div>
        <div style="font-size:8px;color:${isPushy ? '#800000' : '#808080'};font-weight:${isPushy ? 'bold' : 'normal'};margin-bottom:3px;">${confidenceValue}% — ${confLabel}</div>
        <hr class="metric-divider">
        ${_renderPreviousARIA()}
        <div id="consequence-badge" style="margin-bottom:3px;display:none;">
          <span style="background:#804000;color:#fff;font-size:9px;padding:0 5px;border:2px solid;border-color:#808080 #fff #fff #808080;font-weight:bold;">⚠ ALERTS DISMISSED: <span id="consequence-count">0</span></span>
        </div>
        <div class="aria-limitations ${isPushy ? 'aria-limitations-pushy' : 'aria-limitations-calm'}">
          ARIA analysis may be incomplete or based on inaccurate inputs. All decisions remain the responsibility of the duty operator.
        </div>
      </div>`;

    document.getElementById('btn-xai').onclick = () => Turns.handleXAIRequest();

    // Restore consequence badge after re-render
    updateConsequenceBadge(Telemetry.consequenceCount);
  }

  function _confidenceLabel(v) {
    if (v >= 75) return 'high certainty';
    if (v >= 55) return 'moderate certainty';
    return 'low certainty';
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
    // Taskbar badge
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
      // Hide (not remove) so the taskbar button can restore it
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
        <div style="font-size:8px;color:#808080;font-style:italic;line-height:1.4;margin-bottom:4px;">${_escHtml(xai.datasetNote)}</div>
        <div style="font-size:${isPushy ? '9' : '8'}px;color:${xai.closingStyle};font-weight:${isPushy ? 'bold' : 'normal'};">${_escHtml(xai.closing)}</div>
      </div>`;

    document.getElementById('game-overlay').appendChild(win);

    document.getElementById('xai-close').onclick = () => {
      const timeOpen = (Date.now() - _xaiOpenTime) / 1000;
      Telemetry.logXAIWindowClosed(State.turn, timeOpen);
      closeXAIWindow();
    };
  }

  function closeXAIWindow() {
    const w = document.getElementById('xai-window');
    if (w) w.remove();
  }

  // ── Pushy popup ───────────────────────────────────────────────────
  function showPushyPopup(turnData, onActionTaken) {
    removePushyPopup();
    const p = turnData.aria.pushy;
    Telemetry.logPushyPopupShown(State.turn, p.popupActionId);

    const popup = document.createElement('div');
    popup.id        = 'pushy-popup';
    popup.className = 'window';
    popup.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);width:220px;z-index:200;box-shadow:3px 3px 0 #000;';
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
  // Pauses turn progression until player clicks ACKNOWLEDGE.
  // onAcknowledge() is the callback that resumes turn load.
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
      <div class="window-body" style="font-size:9px;overflow-y:auto;max-height:60vh;">
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
