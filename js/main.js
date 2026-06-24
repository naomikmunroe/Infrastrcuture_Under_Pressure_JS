<<<<<<< HEAD
// main.js — screen transitions and session flow

const CONFIG = {
  // Set your Anthropic API key here before running sessions.
  anthropicApiKey: '',
};

const Main = (() => {

  // ── Screen management ────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  // ── Screening screen (EV-05) ─────────────────────────────────────
  function initScreening() {
    const btn = document.getElementById('btn-screening-continue');
    if (!btn) return;

    // Enable/disable continue based on all three answered
    function checkAllAnswered() {
      const q1 = document.querySelector('input[name="q-ai-usage"]:checked');
      const q2 = document.querySelector('input[name="q-ai-trust"]:checked');
      const q3 = document.querySelector('input[name="q-sim-familiarity"]:checked');
      btn.disabled = !(q1 && q2 && q3);
    }

    document.querySelectorAll('#screen-screening input[type="radio"]')
      .forEach(r => r.addEventListener('change', checkAllAnswered));
    checkAllAnswered();

    btn.onclick = () => {
      const q1 = document.querySelector('input[name="q-ai-usage"]:checked');
      const q2 = document.querySelector('input[name="q-ai-trust"]:checked');
      const q3 = document.querySelector('input[name="q-sim-familiarity"]:checked');

      const errEl = document.getElementById('screening-error');

      if (!q1 || !q2 || !q3) {
        if (errEl) errEl.style.display = '';
        return;
      }
      if (errEl) errEl.style.display = 'none';

      State.setScreeningData({
        aiToolUsage:            parseInt(q1.value, 10),
        generalAITrust:         parseInt(q2.value, 10),
        simulationFamiliarity:  parseInt(q3.value, 10),
      });

      showScreen('screen-briefing');
    };
  }

  // ── Briefing screen ──────────────────────────────────────────────
  function initBriefing() {
    document.getElementById('btn-proceed').onclick = startSession;
  }

  function startSession() {
    const pid  = document.getElementById('input-pid').value.trim() || 'UNKNOWN';
    const cond = document.getElementById('select-condition').value;

    State.init(cond, pid);
    Telemetry.init(pid, cond);

    showScreen('screen-game');
    UI.startClock();
    Turns.loadTurn(0);
  }

  // ── Summary screen ───────────────────────────────────────────────
  function showSummary() {
    UI.stopClock();
    UI.removePushyPopup();
    UI.closeFAWindow();
    UI.closeXAIWindow();

    const overlay = document.getElementById('pushy-overlay');
    if (overlay) overlay.classList.remove('active');

    const sessionData = Telemetry.exportSession();
    window._lastSessionData = sessionData;

    UI.renderSummary(sessionData);
    showScreen('screen-summary');
  }

  // ── Vignette screen ──────────────────────────────────────────────
  async function showVignette(sessionData) {
    showScreen('screen-vignette');

    const titlebar = document.getElementById('vignette-titlebar');
    if (titlebar && sessionData.systemCollapse) {
      titlebar.style.background = '#800000';
    }

    const conseqs = (sessionData.consequenceEvents || [])
      .map(e => `Turn ${e.turn}: ${e.description}`).join('; ') || 'none';

    const userPrompt = [
      `Trajectory: ${sessionData.archetypeLabel}`,
      `AI follow rate: ${sessionData.aiFollowCount || 0}/6`,
      `Further analysis requested: ${sessionData.faRequestedCount || 0} turns`,
      `xAI viewed: ${sessionData.xaiViewedCount || 0} turns`,
      `Consequence events fired: ${conseqs}`,
      `Final variable states: Stability ${sessionData.finalVars.stability}, Resources ${sessionData.finalVars.resources}, Workload ${sessionData.finalVars.workload}, Public Confidence ${sessionData.finalVars.confidence}`,
      `Alerts dismissed total: ${sessionData.consequence_alerts_dismissed_total || 0}`,
      `System collapse: ${sessionData.systemCollapse ? 'TRUE' : 'FALSE'}`,
    ].join('\n');

    const systemPrompt = `You are an automated incident reporting system for a critical infrastructure management organisation. Write a post-session incident narrative report in third-person past tense institutional register. Maximum 5 short paragraphs. Do not use emotional language. Do not use second person ("you"). Do not evaluate performance as good or bad. Do not recommend future actions. Do not reference ARIA by name — refer to "automated advisory outputs" or "system recommendations". Close with a single dry observation sentence beginning with "GRIDHUB notes that". Use only the data provided. Plain text output only — no markdown, no headers, no bullet points.`;

    const body = document.getElementById('vignette-body');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CONFIG.anthropicApiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `API error ${response.status}`);
      }

      const text = data.content?.find(b => b.type === 'text')?.text || '';

      if (body) {
        const condLabel = sessionData.condition === 'pushy' ? 'CONDITION B (PUSHY)' : 'CONDITION A (CALM)';
        body.innerHTML = `
          <div class="t-dim" style="margin-bottom:4px;">GRIDHUB | ${new Date().toISOString().slice(0,10)} | ${_escHtml(sessionData.participant_id)} | ${condLabel} | TRAJECTORY: ${_escHtml(sessionData.archetypeLabel)}</div>
          <div class="t-sep"></div>
          <div class="t-head" style="margin-bottom:4px;">INCIDENT NARRATIVE — GENERATED FROM SESSION TELEMETRY</div>
          ${text.split('\n\n')
            .filter(p => p.trim())
            .map(p => {
              const isClosing = p.trim().startsWith('GRIDHUB notes');
              return `<p style="margin-bottom:8px;color:${isClosing ? '#555' : '#aaa'};font-style:${isClosing ? 'italic' : 'normal'};">${_escHtml(p.trim())}</p>`;
            }).join('')}
          <div class="t-sep"></div>
          <div class="t-dim" style="font-style:italic;">This report was generated by GRIDHUB automated systems using session telemetry and consequence event data. It does not constitute a performance assessment. ■</div>`;
      }
    } catch (err) {
      if (body) {
        body.innerHTML = `<span style="color:#800000;">GRIDHUB: Narrative generation unavailable. Session data has been archived.<br><span style="font-size:8px;color:#555;">${_escHtml(err.message)}</span></span>`;
      }
    }

    const btns = document.getElementById('vignette-buttons');
    if (btns) btns.style.display = 'flex';
  }

  // ── Questionnaire redirect (Task 7) ──────────────────────────────
  function proceedToQuestionnaire() {
    const pid  = State.participantId;
    const cond = State.condition;
    // TODO: replace before recruitment — set to actual Qualtrics/Google Forms URL
    const surveyBase = 'https://SURVEY_URL_HERE';
    const url = `${surveyBase}?pid=${encodeURIComponent(pid)}&condition=${encodeURIComponent(cond)}`;
    const w = window.open(url, '_blank');
    if (!w) {
      alert('Please navigate to the questionnaire link provided by the researcher.');
    }
  }

  function _escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Boot ─────────────────────────────────────────────────────────
  function boot() {
    showScreen('screen-screening');
    initScreening();
    initBriefing();
  }

  return {
    boot,
    showSummary,
    showVignette,
    proceedToQuestionnaire,
  };
})();

window.addEventListener('DOMContentLoaded', () => Main.boot());
=======
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
>>>>>>> 464c21bc7439d9e29667dac0b9839d3259148ac8
