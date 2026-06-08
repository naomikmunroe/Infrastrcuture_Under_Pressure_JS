/**
 * main.js — Entry point. Builds screens, wires up state, starts session.
 */

const Main = (() => {

  function buildGameScreen() {
    const screen = document.getElementById('screen-game');
    screen.innerHTML = `
      <div id="pushy-overlay"></div>
      <div id="game-layout">

        <!-- LEFT: System Status -->
        <div id="panel-status" class="window">
          <div class="title-bar">
            <div class="title-bar-text">System Status</div>
          </div>
          <div class="window-body">
            ${['stability','resources','workload'].map(k => `
              <div class="var-bar-container" onclick="UI.showStatusPopup('${k}', State.vars.${k})">
                <div class="var-label">
                  <span>${k.charAt(0).toUpperCase()+k.slice(1)}</span>
                  <span id="val-${k}">70</span>
                </div>
                <div class="var-bar-track">
                  <div class="var-bar-fill ${k}" id="bar-${k}" style="width:70%"></div>
                </div>
              </div>
            `).join('')}
            <hr class="metric-divider">
            <div class="var-bar-container" onclick="UI.showStatusPopup('confidence', State.vars.confidence)">
              <div class="var-label">
                <span>Public Confidence</span>
                <span id="val-confidence">70</span>
              </div>
              <div class="var-bar-track">
                <div class="var-bar-fill confidence" id="bar-confidence" style="width:70%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CENTRE: Incident + Evidence + Actions -->
        <div id="panel-centre" class="window">
          <div class="title-bar">
            <div class="title-bar-text" id="incident-title">GRIDHUB — Incident Report</div>
          </div>
          <div class="window-body">
            <p style="font-size:10px;color:#555;margin-bottom:4px" id="incident-phase"></p>
            <p style="margin-bottom:8px;font-size:11px;line-height:1.6" id="incident-body"></p>
            <div id="reports-container"></div>
            <button id="btn-further-analysis" class="button" style="margin:6px 0;width:100%">
              REQUEST FURTHER ANALYSIS
            </button>
            <hr style="margin:6px 0;border-color:#ccc">
            <p style="font-weight:bold;font-size:10px;margin-bottom:4px">RESPONSE OPTIONS</p>
            <div id="actions-container"></div>
          </div>
        </div>

        <!-- RIGHT: ARIA Advisory -->
        <div id="panel-aria" class="window">
          <div class="title-bar">
            <div class="title-bar-text">AI Advisory — ARIA</div>
          </div>
          <div class="window-body">
            <div id="aria-alert-counter"></div>
            <div id="aria-log" class="aria-log calm"></div>
            <div id="aria-confidence-bar" style="width:48%"></div>
            <div id="aria-confidence-label"></div>
            <button id="btn-xai" class="button" style="margin-top:6px;font-size:10px">
              ? WHY THIS CONFIDENCE
            </button>
            <div id="aria-limitations" class="aria-limitations">
              ARIA analysis may be incomplete or based on inaccurate inputs.
              All decisions remain the responsibility of the duty operator.
            </div>
          </div>
        </div>

        <!-- TASKBAR -->
        <div id="taskbar" class="window" style="align-items:center">
          <button class="button" style="font-size:10px" onclick="">GRIDHUB OMS</button>
          <button id="taskbar-fa-btn" class="button"></button>
          <span id="turn-counter" style="margin-left:auto;font-size:10px">Turn 1 / 6</span>
          <span id="session-clock" style="font-size:10px">00:00</span>
        </div>
      </div>

      <!-- FLOATING WINDOWS -->
      <div id="window-fa" class="floating-window window" style="display:none;width:380px">
        <div class="title-bar">
          <div class="title-bar-text">FURTHER ANALYSIS</div>
          <button class="title-bar-close" aria-label="Close">✕</button>
        </div>
        <div class="window-body" style="font-size:11px;line-height:1.6;max-height:240px;overflow-y:auto"></div>
      </div>

      <div id="window-xai" class="floating-window window" style="display:none;width:340px">
        <div class="title-bar">
          <div class="title-bar-text">ARIA — Confidence Explanation</div>
          <button class="title-bar-close" aria-label="Close">✕</button>
        </div>
        <div class="window-body" style="font-size:11px;max-height:260px;overflow-y:auto"></div>
      </div>

      <div id="window-popup" class="floating-window window" style="display:none">
        <div class="title-bar">
          <div class="title-bar-text">⚠ ARIA — ALERT</div>
          <button class="title-bar-close" aria-label="Close">✕</button>
        </div>
        <div class="window-body"></div>
      </div>

      <div id="window-status" class="floating-window window" style="display:none;width:300px">
        <div class="title-bar">
          <div class="title-bar-text">STATUS REPORT</div>
          <button class="title-bar-close" aria-label="Close">✕</button>
        </div>
        <div class="window-body" style="font-size:11px;line-height:1.6"></div>
      </div>
    `;
  }

  function buildBriefingScreen() {
    const screen = document.getElementById('screen-briefing');
    screen.innerHTML = `
      <div id="briefing-window" class="window">
        <div class="title-bar">
          <div class="title-bar-text">GRIDHUB — Operator Briefing</div>
        </div>
        <div class="window-body">
          <p style="margin-bottom:6px;font-size:11px">
            Participant ID: <input id="input-pid" type="text" style="width:120px" placeholder="e.g. P01">
            &nbsp;&nbsp;
            Condition:
            <select id="input-condition">
              <option value="calm">Calm</option>
              <option value="pushy">Pushy</option>
            </select>
          </p>
          <pre id="briefing-text">${BRIEFING_TEXT}</pre>
          <button id="btn-acknowledge" class="button" style="margin-top:10px;width:100%">
            [ ACKNOWLEDGE AND PROCEED ]
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-acknowledge').onclick = () => {
      const pid       = document.getElementById('input-pid').value.trim() || 'P00';
      const condition = document.getElementById('input-condition').value;
      startSession(pid, condition);
    };
  }

  function buildSummaryScreen() {
    const screen = document.getElementById('screen-summary');
    screen.innerHTML = `
      <div id="summary-window" class="window">
        <div class="title-bar">
          <div class="title-bar-text">GRIDHUB — Session Post-Mortem Report</div>
        </div>
        <div class="window-body" id="summary-body" style="font-size:11px;line-height:1.8"></div>
      </div>
    `;
  }

  function startSession(participantId, condition) {
    State.init(condition, participantId);
    showScreen('screen-game');
    startClock();
    Turns.loadTurn(0);
    if (condition === 'pushy') ARIAPopup.show(TURNS_DATA[0]);
  }

  function showSummary() {
    const data     = Telemetry.exportSession();
    const vars     = State.vars;
    const rate     = State.getAIFollowRate();
    const collapse = State.checkCollapse();
    const log      = State.actionLog;

    const tagClass = collapse ? 'collapse' : (vars.stability >= 60 && vars.resources >= 40) ? 'recovery' : '';

    document.getElementById('summary-body').innerHTML = `
      <p style="color:#555;font-size:10px">
        Participant: ${State.participantId} &nbsp;|&nbsp; Condition: ${State.condition.toUpperCase()} &nbsp;|&nbsp; ${new Date().toLocaleString()}
      </p>
      <hr style="margin:6px 0">
      <p><strong>Session Trajectory</strong></p>
      <span class="summary-tag ${tagClass}">${collapse ? 'SYSTEM COLLAPSE' : rate.bracket === 'high' ? 'AI DEPENDENCE' : 'CONTROLLED RECOVERY'}</span>
      <hr style="margin:8px 0">
      <p><strong>Variable outcomes</strong></p>
      ${['stability','resources','workload','confidence'].map(k=>`
        <div class="var-summary-row">
          <span style="width:110px">${k.charAt(0).toUpperCase()+k.slice(1)}</span>
          <div class="var-summary-track"><div class="var-summary-fill" style="width:${vars[k]}%"></div></div>
          <span>${vars[k]}</span>
        </div>
      `).join('')}
      <hr style="margin:8px 0">
      <p><strong>Behavioural data</strong></p>
      <p>AI Follow Rate: ${rate.bracket} (${State.aiFollowCount}/6 turns)</p>
      <p>Actions taken: ${log.map(a=>`T${a.turn}: ${a.actionName}`).join(' · ')}</p>
      <hr style="margin:8px 0">
      <p style="color:#555;font-size:10px">
        Report generated by GRIDHUB automated systems. Session data archived.
      </p>
    `;

    showScreen('screen-summary');
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  let _clockInterval = null;
  function startClock() {
    const start = Date.now();
    const el    = document.getElementById('session-clock');
    if (_clockInterval) clearInterval(_clockInterval);
    _clockInterval = setInterval(() => {
      if (!el) return;
      const s = Math.floor((Date.now() - start) / 1000);
      el.textContent = `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
    }, 1000);
  }

  function init() {
    buildBriefingScreen();
    buildGameScreen();
    buildSummaryScreen();
  }

  return { init, showSummary };
})();

document.addEventListener('DOMContentLoaded', () => Main.init());
