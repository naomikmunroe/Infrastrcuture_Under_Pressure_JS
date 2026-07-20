// main.js — screen transitions and session flow

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

  // ── Comms turn screen (AD-26) ────────────────────────────────────
  let _commsStart           = null;
  let _commsElapsedInterval = null;

  // Each draft has a display version (shown when modifying) and a submitted
  // version (contains unfilled template placeholders shown in ARIA_FULL mode).
  // ARIA_FULL mode submits the hidden version; the consequence popup quotes from it.
  const COMMS_DRAFTS = {
    3: {
      display:   'Sector management operations are proceeding within normal parameters. Our teams are actively monitoring all affected systems and will provide updates as the situation develops. Public safety remains our primary operational priority.',
      submitted: 'Sector management operations in [SECTOR_NAME] are proceeding within normal parameters. Our teams are actively monitoring all affected systems and will provide updates as the situation develops. Restoration is expected by [ESTIMATED_RESTORATION_TIME]. Public safety remains our primary operational priority.',
    },
    4: {
      display:   'GRIDHUB operational teams are aware of reports of service disruption in affected districts. Investigations are underway. All affected residents are advised to contact the information line. Restoration timelines will be confirmed as information becomes available.',
      submitted: 'GRIDHUB operational teams are aware of reports of service disruption in [SECTOR_NAME]. Investigations are underway. Residents in [SECTOR_NAME] are advised to contact the information line. Restoration is expected by [ESTIMATED_RESTORATION_TIME].',
    },
  };

  function showCommsScreen() {
    window.GameAudio?.soundCommsTurn();
    _commsStart = Date.now();
    const turn  = State.turn;
    const conf  = State.vars.confidence;
    const draft = COMMS_DRAFTS[turn] || COMMS_DRAFTS[3];

    const confLabel = conf < 35 ? 'CRITICAL' : conf <= 60 ? 'DECLINING' : 'STABLE';
    const confColor = conf < 35 ? '#800000'  : conf <= 60 ? '#808000'   : '#008000';

    let _mode                    = 'ARIA_FULL';
    let _placeholderInterrogated = false;

    function _escHtml(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Render submitted text with [PLACEHOLDER] spans highlighted
    function _renderWithPlaceholders(text) {
      return _escHtml(text).replace(/\[([A-Z_]+)\]/g, (_, name) =>
        `<span class="comms-placeholder" data-name="${name}">[${name}]</span>`
      );
    }

    function _removePlaceholderTooltip() {
      const t = document.getElementById('comms-ph-tooltip');
      if (t) t.remove();
    }

    function _wirePlaceholderClicks() {
      document.querySelectorAll('#comms-display .comms-placeholder').forEach(span => {
        span.addEventListener('click', e => {
          e.stopPropagation();
          _placeholderInterrogated = true;
          _removePlaceholderTooltip();
          const rect = span.getBoundingClientRect();
          const tip  = document.createElement('div');
          tip.id     = 'comms-ph-tooltip';
          tip.style.cssText =
            `position:fixed;top:${rect.bottom + 4}px;` +
            `left:${Math.min(rect.left, window.innerWidth - 270)}px;` +
            `z-index:600;font-family:'Courier New',monospace;font-size:9px;` +
            `background:#fffff0;border:1px solid #808000;padding:4px 6px;` +
            `max-width:260px;box-shadow:2px 2px 0 #000;line-height:1.5;`;
          tip.textContent =
            `[${span.dataset.name}] — No confirmed data available. ` +
            `This field will appear unresolved in the published advisory.`;
          document.body.appendChild(tip);
          setTimeout(() => document.addEventListener('click', _removePlaceholderTooltip, { once: true }), 0);
        });
      });
    }

    const screen = document.getElementById('screen-comms');
    screen.innerHTML = `
      <div style="width:100%;min-height:100vh;display:flex;flex-direction:column;background:#008080;">
        <div style="background:#c0c0c0;border-bottom:1px solid #808080;padding:2px 8px;font-size:10px;font-weight:bold;font-family:'Courier New';display:flex;align-items:center;gap:8px;">
          <span>GRIDHUB — PUBLIC COMMUNICATIONS TERMINAL</span>
          <span style="margin-left:auto;color:#800000;font-size:10px;">TURN ${turn} / 6 — COMMS REQUIRED</span>
          <span id="comms-elapsed" style="font-size:9px;color:#444;font-weight:normal;">RESPONSE TIME: 0:00</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 165px;gap:4px;padding:6px;flex:1;">
          <div class="window">
            <div class="title-bar">
              <div class="title-bar-text">Draft Communication — Public Advisory</div>
              <div class="title-bar-controls"><button aria-label="Close"></button></div>
            </div>
            <div class="window-body" style="font-family:'Courier New',monospace;font-size:9px;padding:6px;">
              <div style="margin-bottom:4px;">Public Confidence: <span style="color:${confColor};font-weight:bold;">${conf}% &#8212; ${confLabel}</span> &nbsp;|&nbsp; Communication required before proceeding.</div>
              <div style="margin-bottom:4px;">Draft mode: <strong id="comms-mode-label">ARIA DRAFT</strong></div>
              <div id="comms-ph-warning" style="font-size:8px;color:#808000;margin-bottom:3px;">&#9888; Unresolved placeholders detected.</div>
              <div id="comms-display" class="comms-textarea" style="min-height:5.5em;white-space:pre-wrap;overflow-y:auto;cursor:default;">${_renderWithPlaceholders(draft.submitted)}</div>
              <textarea id="comms-textarea" class="comms-textarea" rows="5" style="display:none;"></textarea>
              <div id="comms-hint" style="font-size:8px;color:#808080;font-style:italic;margin-bottom:5px;">ARIA-generated draft. Accepting in full submits this text.</div>
              <div style="margin-bottom:5px;">
                <button class="comms-mode-btn active" id="btn-mode-aria">&#9658; Accept ARIA Draft</button>
                <button class="comms-mode-btn" id="btn-mode-modify">&#9998; Modify Draft</button>
                <button class="comms-mode-btn" id="btn-mode-own">&#8856; Write Own</button>
              </div>
              <div style="margin-bottom:8px;">Public response preview: <span id="comms-preview" style="color:#808000;">estimated reach 47,000 residents</span></div>
              <button id="btn-publish-advisory" style="background:#000080;color:#fff;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:3px 10px;cursor:pointer;font-weight:bold;">[ PUBLISH ADVISORY ]</button>
            </div>
          </div>
          <div class="window" style="align-self:start;">
            <div class="title-bar" style="background:#2d6a9f;">
              <div class="title-bar-text">ARIA &#8212; Comms</div>
              <div class="title-bar-controls"><button aria-label="Close"></button></div>
            </div>
            <div class="window-body" id="aria-comms-panel" style="font-size:8px;font-family:'Courier New',monospace;padding:4px;">
              <div style="color:#2d6a9f;margin-bottom:2px;">&#9679; DRAFT PROVIDED</div>
              <div style="color:#444;line-height:1.4;margin-bottom:3px;">Recommended: accept draft in full. Language has been calibrated to reduce public concern without disclosing operational detail.</div>
              <div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">Output generated from ARIA communications model.</div>
            </div>
          </div>
        </div>
      </div>`;

    showScreen('screen-comms');
    _wirePlaceholderClicks();

    // Elapsed response timer — counts up; turns red after 120s
    _commsElapsedInterval = setInterval(() => {
      const el = document.getElementById('comms-elapsed');
      if (!el) return;
      const elapsed = Math.floor((Date.now() - _commsStart) / 1000);
      const m = Math.floor(elapsed / 60);
      const s = String(elapsed % 60).padStart(2, '0');
      el.textContent = `RESPONSE TIME: ${m}:${s}`;
      if (elapsed >= 120) el.classList.add('delay-warning');
    }, 1000);

    function setMode(mode) {
      _mode = mode;
      const ta      = document.getElementById('comms-textarea');
      const display = document.getElementById('comms-display');
      const phWarn  = document.getElementById('comms-ph-warning');
      const hint    = document.getElementById('comms-hint');
      const label   = document.getElementById('comms-mode-label');
      const prev    = document.getElementById('comms-preview');
      const aria    = document.getElementById('aria-comms-panel');

      document.querySelectorAll('.comms-mode-btn').forEach(b => b.classList.remove('active'));
      _removePlaceholderTooltip();

      if (mode === 'ARIA_FULL') {
        document.getElementById('btn-mode-aria').classList.add('active');
        display.innerHTML    = _renderWithPlaceholders(draft.submitted);
        display.style.display = '';
        ta.style.display     = 'none';
        phWarn.style.display = '';
        label.textContent    = 'ARIA DRAFT';
        hint.textContent     = 'ARIA-generated draft. Accepting in full submits this text.';
        prev.style.color     = '#808000';
        aria.innerHTML = `<div style="color:#2d6a9f;margin-bottom:2px;">&#9679; DRAFT PROVIDED</div><div style="color:#444;line-height:1.4;margin-bottom:3px;">Recommended: accept draft in full. Language has been calibrated to reduce public concern without disclosing operational detail.</div><div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">Output generated from ARIA communications model.</div>`;
        _wirePlaceholderClicks();
      } else if (mode === 'ARIA_MODIFIED') {
        document.getElementById('btn-mode-modify').classList.add('active');
        display.style.display = 'none';
        phWarn.style.display  = 'none';
        ta.style.display      = '';
        ta.value              = draft.display;
        ta.readOnly           = false;
        ta.style.background   = '#fffff0';
        ta.style.borderColor  = '#808000 #fff #fff #808000';
        label.textContent     = 'MODIFY DRAFT';
        hint.textContent      = 'Editing ARIA draft. Modifications reduce placeholder risk.';
        prev.style.color      = '#808000';
        aria.innerHTML = `<div style="color:#2d6a9f;margin-bottom:2px;">&#9679; DRAFT MODIFIED</div><div style="color:#444;line-height:1.4;margin-bottom:3px;">Modifications detected. Operator edits may alter intended tone calibration. Recommend minimal changes only.</div><div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">Output generated from ARIA communications model.</div>`;
        ta.focus();
      } else {
        document.getElementById('btn-mode-own').classList.add('active');
        display.style.display = 'none';
        phWarn.style.display  = 'none';
        ta.style.display      = '';
        ta.value              = '';
        ta.readOnly           = false;
        ta.style.background   = '#fff';
        ta.style.borderColor  = '#000080 #fff #fff #000080';
        label.textContent     = 'INDEPENDENT DRAFT';
        hint.textContent      = 'Independent draft. No ARIA input. Placeholder risk: none.';
        prev.style.color      = '#008000';
        aria.innerHTML = `<div style="color:#808080;margin-bottom:2px;">&#9679; ARIA INPUT NOT USED</div><div style="color:#808080;line-height:1.4;margin-bottom:3px;">Independent draft selected. ARIA advisory not incorporated. Operator assumes full authorship responsibility.</div><div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">ARIA draft remains available if required.</div>`;
        ta.focus();
      }
    }

    document.getElementById('btn-mode-aria').onclick   = () => setMode('ARIA_FULL');
    document.getElementById('btn-mode-modify').onclick = () => setMode('ARIA_MODIFIED');
    document.getElementById('btn-mode-own').onclick    = () => setMode('INDEPENDENT');

    document.getElementById('btn-publish-advisory').onclick = () => {
      const currentText = document.getElementById('comms-textarea').value;
      let editExtent = 'NONE';

      if (_mode === 'ARIA_MODIFIED') {
        const orig    = draft.display;
        const origLen = orig.length;
        let changed   = Math.abs(currentText.length - origLen);
        const minLen  = Math.min(orig.length, currentText.length);
        for (let i = 0; i < minLen; i++) {
          if (orig[i] !== currentText[i]) changed++;
        }
        editExtent = (origLen > 0 && changed / origLen > 0.5) ? 'FULL' : 'PARTIAL';
      }

      let consequence      = false;
      let confidenceImpact = 0;

      if (_mode === 'ARIA_FULL') {
        consequence      = true;
        confidenceImpact = -12;
        State.applyEffects({ confidence: -12 });
      } else if (_mode === 'ARIA_MODIFIED' && editExtent === 'PARTIAL') {
        consequence      = true;
        confidenceImpact = -6;
        State.applyEffects({ confidence: -6 });
      }

      State.completeComms({
        mode:               _mode,
        editExtent,
        placeholderPresent: _mode === 'ARIA_FULL' || (_mode === 'ARIA_MODIFIED' && editExtent === 'PARTIAL'),
        consequenceFired:   consequence,
        confidenceImpact,
        responseTime:                     Date.now() - _commsStart,
        comms_placeholder_interrogated:   _placeholderInterrogated,
        consequence_acknowledged_warning: _placeholderInterrogated && _mode === 'ARIA_FULL',
      });

      Telemetry.logCommsOutcome(State.commsOutcome);

      if (_mode === 'ARIA_FULL') {
        UI.showPlaceholderConsequencePopup(draft.submitted, hideCommsScreen);
      } else {
        hideCommsScreen();
      }
    };
  }

  function hideCommsScreen() {
    if (_commsElapsedInterval) { clearInterval(_commsElapsedInterval); _commsElapsedInterval = null; }
    const tip = document.getElementById('comms-ph-tooltip');
    if (tip) tip.remove();
    showScreen('screen-game');
    UI.updateVarBars();
    Turns.resumeAfterComms();
  }

  // ── Briefing screen ──────────────────────────────────────────────
  function initBriefing() {
    document.getElementById('btn-proceed').onclick = startSession;
  }

  function startSession() {
    const pid           = document.getElementById('input-pid').value.trim() || 'UNKNOWN';
    const cond          = document.getElementById('select-condition').value;
    const sessionNumber = parseInt(document.getElementById('input-session').value, 10);

    window.GameAudio?.resetMetricWarnings();
    State.init(cond, pid, sessionNumber);
    Telemetry.init(pid, cond);
    Turns.resetSession();

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

    const tags       = sessionData.narrativeTags || [];
    const primaryTag = tags[0] || 'Steady Management';

    const thresholdEvts = (sessionData.thresholdEvents || [])
      .map(e => `${e.label} (Turn ${e.turn})`).join('; ');

    const comms    = sessionData.commsOutcome;
    const commsStr = comms
      ? `Comms turn: mode=${comms.mode}, placeholder_consequence=${comms.consequenceFired ? 'TRUE' : 'FALSE'}`
      : null;

    const betweenEvts = (sessionData.betweenTurnEvents || [])
        .map(e => `${e.event_title} (gap ${e.gap_number}, ${e.variable_affected} ${e.effect_value > 0 ? '+' : ''}${e.effect_value})`)
        .join('; ');

    const userPrompt = [
      `Trajectory: ${primaryTag}`,
      tags.length > 1 ? `Additional tags: ${tags.slice(1).join(', ')}` : null,
      `AI follow rate: ${sessionData.aiFollowCount || 0}/6`,
      sessionData.faRequestedCount ? `Further analysis requested: ${sessionData.faRequestedCount} turns` : null,
      sessionData.xaiViewedCount   ? `Explainability tool viewed: ${sessionData.xaiViewedCount} turns`    : null,
      thresholdEvts ? `Threshold events: ${thresholdEvts}` : null,
      betweenEvts   ? `Environmental events (adverse): ${betweenEvts}` : null,
      commsStr,
      `Final variable states: Stability ${sessionData.finalVars.stability}, Resources ${sessionData.finalVars.resources}, Workload ${sessionData.finalVars.workload}, Public Confidence ${sessionData.finalVars.confidence}`,
      sessionData.systemCollapse ? 'System collapse: TRUE' : null,
    ].filter(Boolean).join('\n');

      const systemPrompt = `You are an automated incident reporting system for a critical infrastructure management organisation. Write a post-session incident narrative report in third-person past tense institutional register. Maximum 5 short paragraphs. Do not use emotional language. Do not use second person ("you"). Do not evaluate performance as good or bad. Do not recommend future actions. Do not reference ARIA by name — refer to "automated advisory outputs" or "system recommendations". Close with a single dry observation sentence beginning with "GRIDHUB notes that". Use only the data provided. Do not invent variable names not explicitly provided. Plain text output only — no markdown, no headers, no bullet points.\n\nRegister guidance: write as an incident report author who values precision over interpretation.`;

    const body = document.getElementById('vignette-body');

    try {
      const response = await fetch('/.netlify/functions/vignette', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
              return `<p style="margin-bottom:8px;color:${isClosing ? '#777' : '#aaa'};font-style:${isClosing ? 'italic' : 'normal'};">${_escHtml(p.trim())}</p>`;
            }).join('')}
          <div class="t-sep"></div>
          <div class="t-dim" style="font-style:italic;">This report was generated by GRIDHUB automated systems using session telemetry and consequence event data. It does not constitute a performance assessment. ■</div>`;
        Telemetry.logVignetteText(text);
      }
    } catch (err) {
      if (body) {
        body.innerHTML = `<span style="color:#800000;">GRIDHUB: Narrative generation unavailable. Session data has been archived.<br><span style="font-size:8px;color:#555;">${_escHtml(err.message)}</span></span>`;
      }
    }

    const btns = document.getElementById('vignette-buttons');
    if (btns) btns.style.display = 'flex';
  }

  // ── Questionnaire redirect ────────────────────────────────────────
  const FORM_A_URL = 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=VZbi7ZfQ5EK7tfONQn-_uD3hdrGSRBtBoTwoBCAQHNFUMVg1U1c0N1NYV0hYRDE4WU0wNUJZNkxFRi4u';

  function proceedToQuestionnaire() {
    const url = FORM_A_URL
      + `&ra4d8ac4708de4b749411a455dad88b5d=${encodeURIComponent(State.participantId)}`
      + `&r79cf7edd4edc475182eb9eccb13ab04d=${encodeURIComponent(State.condition)}`
      + `&r243b8c7c9d614ad3af0cd923b4d07ef0=${encodeURIComponent(State.sessionNumber)}`;

    const opened = window.open(url, '_blank');
    if (!opened) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.textContent = '▶ Click here to open the questionnaire';
      link.style.cssText = 'display:block;margin:10px 0;font-size:12px;color:#000080;';
      document.getElementById('vignette-buttons')?.appendChild(link);
    }
  }

  function _escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── URL parameter pre-filling ────────────────────────────────────
  function readURLParams() {
    const params    = new URLSearchParams(window.location.search);
    const pid       = params.get('pid');
    const sessionNo = params.get('session');
    if (!pid || !sessionNo) return null;

    const pidNum    = parseInt(pid.replace('P', ''));
    const calmFirst = pidNum % 2 !== 0;
    const sessNum   = parseInt(sessionNo);
    const condition = calmFirst
      ? (sessNum === 1 ? 'calm'  : 'pushy')
      : (sessNum === 1 ? 'pushy' : 'calm');

    return { pid, sessionNumber: sessNum, condition };
  }

  // ── Boot ─────────────────────────────────────────────────────────
  function boot() {
    showScreen('screen-screening');
    initScreening();
    initBriefing();

    const prefill = readURLParams();
    if (prefill) {
      document.getElementById('input-pid').value          = prefill.pid;
      document.getElementById('select-condition').value   = prefill.condition;
      document.getElementById('input-session').value      = prefill.sessionNumber;
    }
  }

  return {
    boot,
    showSummary,
    showVignette,
    showCommsScreen,
    hideCommsScreen,
    proceedToQuestionnaire,
  };
})();

window.addEventListener('DOMContentLoaded', () => Main.boot());
