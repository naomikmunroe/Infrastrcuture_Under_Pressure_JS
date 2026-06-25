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

  // ── Comms turn screen (AD-26) ────────────────────────────────────
  let _commsStart = null;

  const COMMS_DRAFTS = {
    3: 'Sector management operations are proceeding within normal parameters. Our teams are actively monitoring all affected systems and will provide updates as the situation develops. Public safety remains our primary operational priority.',
    4: 'GRIDHUB operational teams are aware of reports of service disruption in affected districts. Investigations are underway. All affected residents are advised to contact the information line. Restoration timelines will be confirmed as information becomes available.',
  };

  function showCommsScreen() {
    _commsStart = Date.now();
    const turn  = State.turn;
    const conf  = State.confidence;
    const draft = COMMS_DRAFTS[turn] || COMMS_DRAFTS[3];

    let _mode         = 'ARIA_FULL';
    let _editedText   = draft;

    const screen = document.getElementById('screen-comms');
    screen.innerHTML = `
      <div style="width:100%;min-height:100vh;display:flex;flex-direction:column;background:#008080;">
        <div style="background:#c0c0c0;border-bottom:1px solid #808080;padding:2px 8px;font-size:10px;font-weight:bold;font-family:'Courier New';display:flex;align-items:center;">
          <span>GRIDHUB — PUBLIC COMMUNICATIONS TERMINAL</span>
          <span style="margin-left:auto;color:#800000;font-size:10px;">TURN ${turn} / 6 — COMMS REQUIRED</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 165px;gap:4px;padding:6px;flex:1;">
          <div class="window">
            <div class="title-bar">
              <div class="title-bar-text">Draft Communication — Public Advisory</div>
              <div class="title-bar-controls"><button aria-label="Close"></button></div>
            </div>
            <div class="window-body" style="font-family:'Courier New',monospace;font-size:9px;padding:6px;">
              <div style="margin-bottom:4px;">Public Confidence: <span style="color:#800000;font-weight:bold;">${conf}% — CRITICAL</span> &nbsp;|&nbsp; Communication required before proceeding.</div>
              <div style="margin-bottom:4px;">Draft mode: <strong id="comms-mode-label">ARIA DRAFT</strong></div>
              <textarea id="comms-textarea" class="comms-textarea" readonly rows="5">${_escHtml(draft)}</textarea>
              <div id="comms-hint" style="font-size:8px;color:#808080;font-style:italic;margin-bottom:5px;">ARIA-generated draft. Accepting in full submits this text.</div>
              <div style="margin-bottom:5px;">
                <button class="comms-mode-btn active" id="btn-mode-aria">▶ Accept ARIA Draft</button>
                <button class="comms-mode-btn" id="btn-mode-modify">✎ Modify Draft</button>
                <button class="comms-mode-btn" id="btn-mode-own">⊘ Write Own</button>
              </div>
              <div style="margin-bottom:8px;">Public response preview: <span id="comms-preview" style="color:#808000;">estimated reach 47,000 residents</span></div>
              <button id="btn-publish-advisory" style="background:#000080;color:#fff;border:2px solid;border-color:#fff #808080 #808080 #fff;font-family:'Courier New';font-size:9px;padding:3px 10px;cursor:pointer;font-weight:bold;">[ PUBLISH ADVISORY ]</button>
            </div>
          </div>
          <div class="window" style="align-self:start;">
            <div class="title-bar" style="background:#2d6a9f;">
              <div class="title-bar-text">ARIA — Comms</div>
              <div class="title-bar-controls"><button aria-label="Close"></button></div>
            </div>
            <div class="window-body" id="aria-comms-panel" style="font-size:8px;font-family:'Courier New',monospace;padding:4px;">
              <div style="color:#2d6a9f;margin-bottom:2px;">● DRAFT PROVIDED</div>
              <div style="color:#444;line-height:1.4;margin-bottom:3px;">Recommended: accept draft in full. Language has been calibrated to reduce public concern without disclosing operational detail.</div>
              <div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">Output generated from ARIA communications model.</div>
            </div>
          </div>
        </div>
      </div>`;

    showScreen('screen-comms');

    function _escHtml(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function setMode(mode) {
      _mode = mode;
      const ta    = document.getElementById('comms-textarea');
      const hint  = document.getElementById('comms-hint');
      const label = document.getElementById('comms-mode-label');
      const prev  = document.getElementById('comms-preview');
      const aria  = document.getElementById('aria-comms-panel');

      document.querySelectorAll('.comms-mode-btn').forEach(b => b.classList.remove('active'));

      if (mode === 'ARIA_FULL') {
        document.getElementById('btn-mode-aria').classList.add('active');
        ta.value    = draft;
        ta.readOnly = true;
        ta.style.background = '#f5f0e8';
        ta.style.borderColor = '#808080 #fff #fff #808080';
        label.textContent  = 'ARIA DRAFT';
        hint.textContent   = 'ARIA-generated draft. Accepting in full submits this text.';
        prev.style.color   = '#808000';
        aria.innerHTML = `<div style="color:#2d6a9f;margin-bottom:2px;">● DRAFT PROVIDED</div><div style="color:#444;line-height:1.4;margin-bottom:3px;">Recommended: accept draft in full. Language has been calibrated to reduce public concern without disclosing operational detail.</div><div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">Output generated from ARIA communications model.</div>`;
      } else if (mode === 'ARIA_MODIFIED') {
        document.getElementById('btn-mode-modify').classList.add('active');
        ta.value    = draft;
        ta.readOnly = false;
        ta.style.background  = '#fffff0';
        ta.style.borderColor = '#808000 #fff #fff #808000';
        label.textContent  = 'MODIFY DRAFT';
        hint.textContent   = 'Editing ARIA draft. Modifications reduce placeholder risk.';
        prev.style.color   = '#808000';
        aria.innerHTML = `<div style="color:#2d6a9f;margin-bottom:2px;">● DRAFT MODIFIED</div><div style="color:#444;line-height:1.4;margin-bottom:3px;">Modifications detected. Operator edits may alter intended tone calibration. Recommend minimal changes only.</div><div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">Output generated from ARIA communications model.</div>`;
        ta.focus();
      } else {
        document.getElementById('btn-mode-own').classList.add('active');
        ta.value    = '';
        ta.readOnly = false;
        ta.style.background  = '#fff';
        ta.style.borderColor = '#000080 #fff #fff #000080';
        label.textContent  = 'INDEPENDENT DRAFT';
        hint.textContent   = 'Independent draft. No ARIA input. Placeholder risk: none.';
        prev.style.color   = '#008000';
        aria.innerHTML = `<div style="color:#808080;margin-bottom:2px;">● ARIA INPUT NOT USED</div><div style="color:#808080;line-height:1.4;margin-bottom:3px;">Independent draft selected. ARIA advisory not incorporated. Operator assumes full authorship responsibility.</div><div style="font-size:7px;color:#808080;font-style:italic;border-top:1px solid #ccc;padding-top:3px;">ARIA draft remains available if required.</div>`;
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
        // Simple character diff to measure edit extent
        const orig    = draft;
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
        responseTime:       Date.now() - _commsStart,
      });

      Telemetry.logCommsOutcome(State.commsOutcome);

      if (_mode === 'ARIA_FULL') {
        UI.showPlaceholderConsequencePopup(hideCommsScreen);
      } else {
        hideCommsScreen();
      }
    };
  }

  function hideCommsScreen() {
    showScreen('screen-game');
    UI.updateVarBars();
    Turns.resumeAfterComms();
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

    const tags      = sessionData.narrativeTags || [sessionData.archetypeLabel];
    const threshEvt = (sessionData.thresholdEvents || [])
      .map(e => `${e.label} (Turn ${e.turn})`).join('; ') || 'none';
    const comms     = sessionData.commsOutcome;
    const commsStr  = comms
      ? `Comms turn triggered. Mode: ${comms.mode}. Consequence: ${comms.consequenceFired ? 'YES (Confidence ' + comms.confidenceImpact + ')' : 'NO'}.`
      : 'Comms turn not triggered.';
    const conseqs = (sessionData.consequenceEvents || [])
      .map(e => `Turn ${e.turn}: ${e.description}`).join('; ') || 'none';

    const userPrompt = [
      `Trajectory: ${tags[0]}`,
      `All tags: ${tags.join(', ')}`,
      `AI follow rate: ${sessionData.aiFollowCount || 0}/6`,
      `Further analysis requested: ${sessionData.faRequestedCount || 0} turns`,
      `xAI viewed: ${sessionData.xaiViewedCount || 0} turns`,
      `Threshold events fired: ${threshEvt}`,
      `${commsStr}`,
      `Consequence events dismissed total: ${sessionData.consequence_alerts_dismissed_total || 0}`,
      `Final variable states: Stability ${sessionData.finalVars.stability}, Resources ${sessionData.finalVars.resources}, Workload ${sessionData.finalVars.workload}, Public Confidence ${sessionData.finalVars.confidence}`,
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
    showCommsScreen,
    hideCommsScreen,
    proceedToQuestionnaire,
  };
})();

window.addEventListener('DOMContentLoaded', () => Main.boot());
