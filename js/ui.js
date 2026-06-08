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
      container.appendChild(btn);
    });
  }

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
