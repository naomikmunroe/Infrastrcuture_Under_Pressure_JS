// main.js — screen transitions and session flow

const CONFIG = {
  // Set your Anthropic API key here before running sessions.
  // The vignette screen makes a direct browser API call.
  anthropicApiKey: '',
};

const Main = (() => {

  // ── Screen management ────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  }

  // ── Briefing screen ──────────────────────────────────────────────
  function initBriefing() {
    document.getElementById('btn-proceed').onclick = startSession;
  }

  function startSession() {
    const pid   = document.getElementById('input-pid').value.trim() || 'UNKNOWN';
    const cond  = document.getElementById('select-condition').value;

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

    const sessionData = Telemetry.exportSession();
    window._lastSessionData = sessionData;

    UI.renderSummary(sessionData);
    showScreen('screen-summary');
  }

  // ── Vignette screen ──────────────────────────────────────────────
  async function showVignette(sessionData) {
    showScreen('screen-vignette');

    // Red titlebar for system collapse
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

  function proceedToQuestionnaire() {
    alert('Questionnaire link to be added in Phase 3.');
  }

  function _escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Boot ─────────────────────────────────────────────────────────
  function boot() {
    showScreen('screen-briefing');
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
