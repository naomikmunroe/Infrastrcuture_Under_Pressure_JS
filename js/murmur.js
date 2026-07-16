// murmur.js — Murmur civilian social feed (Phase 7, AD-39/AD-44)
// Posts accumulate in memory across turns; #murmur-posts is rebuilt by the
// ARIA panel template every turn, so Murmur.mount() must be called after
// every panel re-render to restore the accumulated feed.

const Murmur = (() => {
  let _posts   = []; // accumulated {username, time, text}, newest first
  let _loading = false;

  function _escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _renderPosts() {
    return _posts.map(post => `
      <div style="border-bottom:1px solid #eee;padding:4px 0;margin-bottom:2px;">
        <div>
          <span style="color:#000080;font-weight:bold;font-size:9px;">${_escHtml(post.username)}</span>
          <span style="color:#aaa;font-size:8px;margin-left:4px;">${_escHtml(post.time)}</span>
        </div>
        <div style="font-size:10px;color:#333;line-height:1.4;margin-top:1px;">${_escHtml(post.text)}</div>
      </div>`).join('');
  }

  // Re-populate #murmur-posts after the ARIA panel has been rebuilt.
  function mount() {
    const el = document.getElementById('murmur-posts');
    if (!el) return;
    if (_loading) {
      el.innerHTML = `<div style="font-size:9px;color:#aaa;padding:4px;font-style:italic;">Loading Murmur feed…</div>` + _renderPosts();
    } else if (_posts.length) {
      el.innerHTML = _renderPosts();
    } else {
      el.innerHTML = `<div style="font-size:9px;color:#aaa;font-style:italic;">Connecting to Murmur…</div>`;
    }
  }

  function _getActiveGazetteHeadline(gap) {
    const edition = NEWSPAPER_EDITIONS.find(e => e.appearsAfterGap === gap);
    return edition ? edition.headline.replace('\n', ' ') : null;
  }

  async function loadTurn(turnIndex) {
    _loading = true;
    mount();

    const gazetteHeadline = _getActiveGazetteHeadline(State.currentGap);

    try {
      const response = await fetch('/.netlify/functions/murmur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vars: State.vars,
          condition: State.condition,
          gap: State.currentGap,
          gazetteHeadline,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `API error ${response.status}`);

      const text  = data.content?.find(b => b.type === 'text')?.text || '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      const posts = (JSON.parse(clean).posts || []);

      _posts   = [...posts, ..._posts]; // new posts at top
      _loading = false;
      mount();

      Telemetry.logMurmurPosts(State.turn, posts, State.vars);
    } catch (err) {
      _loading = false;
      if (_posts.length === 0) {
        const el = document.getElementById('murmur-posts');
        if (el) {
          el.innerHTML = `<div style="font-size:9px;color:#aaa;padding:4px;font-style:italic;">Murmur feed unavailable.</div>`;
        }
      } else {
        mount(); // keep showing the accumulated feed from prior turns
      }
    }
  }

  return { mount, loadTurn };
})();
