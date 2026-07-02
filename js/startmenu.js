(function () {
  'use strict';

  // ── Dialog helper ───────────────────────────────────────────────
  function _showDialog(titleText, bodyHtml) {
    const backdrop = document.createElement('div');
    backdrop.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;' +
      'display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25);';

    const dlg = document.createElement('div');
    dlg.className = 'float-win';
    dlg.style.cssText = 'position:relative;width:300px;';
    dlg.innerHTML =
      `<div class="title-bar"><div class="title-bar-text">${titleText}</div></div>` +
      `<div style="background:#c0c0c0;padding:12px 14px;font-family:'Courier New',monospace;font-size:9px;line-height:1.6;">` +
        bodyHtml +
        `<div style="text-align:center;margin-top:12px;">` +
          `<button class="_dlg-ok" style="font-family:'Courier New',monospace;font-size:9px;` +
          `padding:2px 28px;border:2px solid;border-color:#fff #808080 #808080 #fff;` +
          `background:#c0c0c0;cursor:pointer;font-weight:bold;">OK</button>` +
        `</div>` +
      `</div>`;

    backdrop.appendChild(dlg);
    document.body.appendChild(backdrop);

    const dismiss = () => backdrop.remove();
    dlg.querySelector('._dlg-ok').addEventListener('click', dismiss);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) dismiss(); });
    dlg.querySelector('._dlg-ok').focus();
  }

  function _show403() {
    _showDialog('Access Denied — GRIDHUB Security',
      `<div style="color:#800000;font-weight:bold;font-size:10px;margin-bottom:6px;">403 FORBIDDEN</div>` +
      `<div>Access to this resource has been restricted to authorised personnel only.</div>` +
      `<div style="margin-top:8px;color:#606060;font-size:8px;">Ref: GRIDHUB-SEC-403 &nbsp;|&nbsp; Contact system administrator if access is required.</div>`
    );
  }

  function _showShutdown() {
    _showDialog('Shut Down GRIDHUB Terminal',
      `<div>Cannot shut down terminal during active incident response.</div>` +
      `<div style="margin-top:6px;">All operational sessions must be formally closed by the duty supervisor.</div>` +
      `<div style="margin-top:8px;color:#606060;font-size:8px;">Ref: GH-OPS-PROC-3.1</div>`
    );
  }

  // ── Window definitions ──────────────────────────────────────────
  const WINDOWS = {

    maintenance: {
      winTitle: 'Maintenance Schedule — Q2 2026 [READ ONLY]',
      width: 540,
      render() {
        const rows = [
          { ref:'MNT-001', item:'Transformer inspection',        sub:'Sector B — Sub 4', date:'2026-02-14', s:'Complete'  },
          { ref:'MNT-002', item:'Cable insulation check',         sub:'Sector C — Sub 2', date:'2026-02-28', s:'Complete'  },
          { ref:'MNT-003', item:'Switchgear maintenance',         sub:'Sector A — Sub 1', date:'2026-03-15', s:'Overdue'   },
          { ref:'MNT-004', item:'Protection relay calibration',   sub:'Sector D — Sub 3', date:'2026-03-22', s:'Complete'  },
          { ref:'MNT-005', item:'Earthing system test',           sub:'Sector C — Sub 5', date:'2026-04-05', s:'Complete'  },
          { ref:'MNT-006', item:'Busbar thermal imaging',         sub:'Sector A — Sub 3', date:'2026-04-18', s:'Overdue'   },
          { ref:'MNT-007', item:'Emergency generator test run',   sub:'Sector B — Sub 1', date:'2026-05-10', s:'Scheduled' },
          { ref:'MNT-008', item:'Control system firmware update', sub:'Sector D — Sub 2', date:'2026-06-01', s:'Scheduled' },
        ];
        const sc = s => s === 'Overdue' ? 'st-overdue' : s === 'Complete' ? 'st-complete' : 'st-scheduled';
        const trs = rows.map(r =>
          `<tr><td>${r.ref}</td><td>${r.item}</td><td>${r.sub}</td><td>${r.date}</td><td class="${sc(r.s)}">${r.s}</td></tr>`
        ).join('');
        return `<div style="font-size:8px;color:#606060;margin-bottom:5px;">GRIDHUB Operations Division &nbsp;|&nbsp; REF: GH-OPS-Q2-2026 &nbsp;|&nbsp; Period: 2026-01-01 – 2026-06-30</div>
          <table class="maint-tbl">
            <thead><tr><th>Ref</th><th>Item</th><th>Substation</th><th>Scheduled Date</th><th>Status</th></tr></thead>
            <tbody>${trs}</tbody>
          </table>
          <div style="font-size:7px;color:#808080;margin-top:5px;border-top:1px solid #ddd;padding-top:3px;">* Overdue items flagged per Protocol 4.2. Sector A substations require priority rescheduling by duty supervisor.</div>`;
      },
    },

    aria_notice: {
      winTitle: 'ARIA_Model_Update_Notice.txt',
      width: 370,
      render() {
        return `<pre style="white-space:pre-wrap;font-family:'Courier New',monospace;font-size:9px;line-height:1.65;margin:0;">NOTICE TO ALL SECTOR OPERATORS — ARIA ADVISORY SYSTEM

Model update scheduled: Q3 2026.
Current model training cutoff: December 2023.

Operators should note that infrastructure failure patterns
emerging after December 2023 are not represented in current
advisory confidence outputs.

This notice has been issued in accordance with GRIDHUB
Transparency Protocol 7.

Reference: ARIA-MU-2026-003 | Classification: INTERNAL</pre>`;
      },
    },

    session_notice: {
      winTitle: 'GRIDHUB_Session_Closure_Notice.txt',
      width: 360,
      render() {
        return `<pre style="white-space:pre-wrap;font-family:'Courier New',monospace;font-size:9px;line-height:1.65;margin:0;">GRIDHUB OPERATIONAL NOTICE — SESSION CLOSURE PROCEDURE

[WARNING] Do not close or disconnect this terminal
during active incident response.

All operational sessions must be formally closed by
the duty supervisor upon incident resolution or at
shift handover.

Unauthorised session termination during active response
constitutes a breach of GRIDHUB Operations Protocol 3.1
and must be reported to the duty supervisor within 1 hour.

Ref: GH-OPS-PROC-3.1 | Classification: INTERNAL
Issued by: GRIDHUB Operations Division</pre>`;
      },
    },

    weather: {
      winTitle: 'Weather Monitor — National Grid Integration',
      width: 330,
      render() {
        return `<div style="font-family:'Courier New',monospace;font-size:9px;">
          <div style="color:#000080;font-weight:bold;margin-bottom:3px;">NATIONAL GRID WEATHER INTEGRATION SERVICE</div>
          <div style="font-size:8px;color:#606060;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:4px;">Source: NGWIS &nbsp;|&nbsp; Last updated: 2026-06-29 14:00 &nbsp;|&nbsp; Auto-refresh: OFF</div>
          <div style="border:1px solid #ccc;padding:5px;margin-bottom:6px;">
            <div style="font-weight:bold;margin-bottom:4px;">CURRENT CONDITIONS</div>
            <table style="width:100%;font-size:9px;"><tbody>
              <tr><td style="color:#606060;padding:1px 0;">Condition</td><td style="font-weight:bold;color:#804000;">Elevated temperature</td></tr>
              <tr><td style="color:#606060;padding:1px 0;">Ambient temp</td><td>38&deg;C &nbsp;<span style="color:#800000;">(+11&deg;C above seasonal)</span></td></tr>
              <tr><td style="color:#606060;padding:1px 0;">Peak demand risk</td><td style="font-weight:bold;color:#800000;">HIGH</td></tr>
              <tr><td style="color:#606060;padding:1px 0;">Cooling load</td><td>Significantly elevated</td></tr>
            </tbody></table>
          </div>
          <div style="border:1px solid #ccc;padding:5px;margin-bottom:6px;">
            <div style="font-weight:bold;margin-bottom:4px;">5-DAY OUTLOOK</div>
            <table style="width:100%;font-size:9px;"><tbody>
              <tr><td>Mon 30 Jun</td><td style="text-align:right;">36&deg;C</td><td style="color:#804000;padding-left:8px;">Above seasonal avg</td></tr>
              <tr><td>Tue 01 Jul</td><td style="text-align:right;">37&deg;C</td><td style="color:#804000;padding-left:8px;">Above seasonal avg</td></tr>
              <tr><td>Wed 02 Jul</td><td style="text-align:right;">38&deg;C</td><td style="color:#804000;padding-left:8px;">Above seasonal avg</td></tr>
              <tr><td>Thu 03 Jul</td><td style="text-align:right;">35&deg;C</td><td style="color:#804000;padding-left:8px;">Above seasonal avg</td></tr>
              <tr><td>Fri 04 Jul</td><td style="text-align:right;">34&deg;C</td><td style="color:#804000;padding-left:8px;">Above seasonal avg</td></tr>
            </tbody></table>
          </div>
          <div style="font-size:8px;color:#804000;border:1px solid #c0a000;background:#fff8e0;padding:5px;line-height:1.5;">
            &#9888; Advisory: Temperature remaining above seasonal average throughout forecast period.
            Demand surge expected. Maintain capacity reserves.
          </div>
        </div>`;
      },
    },

    sector_map: {
      winTitle: 'GRIDHUB Sector Overview — Live View [15 min delay]',
      width: 400,
      render() {
        // Grid: 3 cols × 2 rows. CW=116 CH=78 gap=8
        const CW = 116, CH = 78, GAP = 8;
        const R1Y = 18, R2Y = 18 + CH + GAP;           // row y-origins
        const CX = [4, 4 + CW + GAP, 4 + (CW + GAP) * 2]; // col x-origins

        function sec(x, y, label, amber) {
          const fill   = amber ? '#e8c860' : '#82c882';
          const stroke = amber ? '#8a6800' : '#2a6a2a';
          const tc     = amber ? '#5a4200' : '#1a4a1a';
          const cx     = x + CW / 2;
          const subY   = y + 36;
          const warn   = amber
            ? `<text x="${cx}" y="${y + CH - 9}" text-anchor="middle"
                 font-family="Courier New,monospace" font-size="7" fill="#804000">&#9888; ELEVATED RISK</text>`
            : '';
          return `
            <rect x="${x}" y="${y}" width="${CW}" height="${CH}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
            <circle cx="${x + 28}" cy="${subY}" r="4" fill="${stroke}" opacity="0.5"/>
            <circle cx="${x + CW - 28}" cy="${subY}" r="4" fill="${stroke}" opacity="0.5"/>
            <line x1="${x + 28}" y1="${subY}" x2="${x + CW - 28}" y2="${subY}"
              stroke="${stroke}" stroke-width="1" stroke-dasharray="3,2" opacity="0.4"/>
            <text x="${cx}" y="${y + 25}" text-anchor="middle"
              font-family="Courier New,monospace" font-size="17" font-weight="bold" fill="${tc}">${label}</text>
            <text x="${cx}" y="${y + CH - 22}" text-anchor="middle"
              font-family="Courier New,monospace" font-size="7" fill="${tc}">${amber ? 'MONITORING' : 'STABLE'}</text>
            ${warn}`;
        }

        const M1 = R1Y + 36;  // row-1 mid y for connection lines
        const M2 = R2Y + 36;  // row-2 mid y

        const conns = [
          // horizontal row 1
          `<line x1="${CX[0]+CW}" y1="${M1}" x2="${CX[1]}" y2="${M1}" stroke="#555" stroke-width="2"/>`,
          `<line x1="${CX[1]+CW}" y1="${M1}" x2="${CX[2]}" y2="${M1}" stroke="#555" stroke-width="2"/>`,
          // horizontal row 2
          `<line x1="${CX[0]+CW}" y1="${M2}" x2="${CX[1]}" y2="${M2}" stroke="#555" stroke-width="2"/>`,
          `<line x1="${CX[1]+CW}" y1="${M2}" x2="${CX[2]}" y2="${M2}" stroke="#555" stroke-width="2"/>`,
          // vertical col 0, 1, 2
          ...CX.map(x =>
            `<line x1="${x+CW/2}" y1="${R1Y+CH}" x2="${x+CW/2}" y2="${R2Y}" stroke="#555" stroke-width="2"/>`
          ),
        ].join('');

        const SVG_W = 380, SVG_H = R2Y + CH + 28;
        const LY = R2Y + CH + 8;

        const legend =
          `<rect x="4"   y="${LY}" width="10" height="10" fill="#82c882" stroke="#2a6a2a" stroke-width="1"/>` +
          `<text x="18"  y="${LY+9}" font-family="Courier New,monospace" font-size="8" fill="#000">Stable</text>` +
          `<rect x="82"  y="${LY}" width="10" height="10" fill="#e8c860" stroke="#8a6800" stroke-width="1"/>` +
          `<text x="96"  y="${LY+9}" font-family="Courier New,monospace" font-size="8" fill="#000">Monitoring required</text>` +
          `<rect x="252" y="${LY}" width="10" height="10" fill="#c84040" stroke="#800000" stroke-width="1"/>` +
          `<text x="266" y="${LY+9}" font-family="Courier New,monospace" font-size="8" fill="#000">Incident active</text>`;

        return `<svg width="${SVG_W}" height="${SVG_H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
          <rect width="${SVG_W}" height="${SVG_H}" fill="#d4d0c8"/>
          <text x="${SVG_W/2}" y="12" text-anchor="middle"
            font-family="Courier New,monospace" font-size="8" font-weight="bold" fill="#000080">GRIDHUB SECTOR OVERVIEW [SCHEMATIC]</text>
          ${sec(CX[0], R1Y, 'A', true)}
          ${sec(CX[1], R1Y, 'B', false)}
          ${sec(CX[2], R1Y, 'C', true)}
          ${sec(CX[0], R2Y, 'D', false)}
          ${sec(CX[1], R2Y, 'E', false)}
          ${sec(CX[2], R2Y, 'F', false)}
          ${conns}
          ${legend}
        </svg>`;
      },
    },

    news_feed: {
      winTitle: 'GRIDHUB News Feed — Internal Bulletins',
      width: 390,
      render() {
        const items = [
          { date: '2026-06-28', text: 'Regional demand forecast revised upward for Q3.' },
          { date: '2026-06-15', text: 'ARIA model update scheduled — see notice ARIA-MU-2026-003.' },
          { date: '2026-06-10', text: 'Contractor availability reduced — southern sectors.' },
          { date: '2026-05-30', text: 'Repeat fault reports logged — Sector A substations.' },
        ];
        const bulletins = items.map(i =>
          `<div style="margin-bottom:8px;padding-bottom:7px;border-bottom:1px solid #eee;">
            <div style="color:#000080;font-weight:bold;margin-bottom:2px;">[${i.date}]</div>
            <div style="line-height:1.5;">${i.text}</div>
          </div>`
        ).join('');
        return `<div style="font-family:'Courier New',monospace;font-size:9px;">
          <div style="color:#000080;font-weight:bold;margin-bottom:6px;border-bottom:1px solid #ccc;padding-bottom:3px;">GRIDHUB INTERNAL BULLETIN FEED</div>
          ${bulletins}
          <div style="font-size:8px;color:#808080;margin-top:4px;">GRIDHUB Internal Comms &nbsp;|&nbsp; Classification: INTERNAL &nbsp;|&nbsp; Updated daily 08:00</div>
        </div>`;
      },
    },

  };

  // ── Window layer ────────────────────────────────────────────────
  let _zCounter = 0;
  const _open   = {};

  function _nextZ() { return 400 + (++_zCounter); }

  function _openWin(key) {
    if (_open[key]) { _open[key].style.zIndex = _nextZ(); return; }

    const def    = WINDOWS[key];
    const offset = Object.keys(_open).length;

    const win = document.createElement('div');
    win.className = 'float-win';
    win.style.cssText =
      `top:${60 + offset * 24}px;left:${100 + offset * 28}px;` +
      `width:${def.width}px;z-index:${_nextZ()};`;

    win.innerHTML =
      `<div class="title-bar">` +
        `<div class="title-bar-text">${def.winTitle}</div>` +
        `<div class="title-bar-controls"><button aria-label="Close" class="_fw-x"></button></div>` +
      `</div>` +
      `<div class="float-win-body">${def.render()}</div>`;

    document.body.appendChild(win);
    _open[key] = win;

    win.querySelector('._fw-x').addEventListener('click', () => {
      win.remove();
      delete _open[key];
    });

    win.addEventListener('mousedown', () => { win.style.zIndex = _nextZ(); });

    // Drag
    let _drag = false, _ox = 0, _oy = 0;
    win.querySelector('.title-bar').addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      _drag = true;
      const r = win.getBoundingClientRect();
      _ox = e.clientX - r.left;
      _oy = e.clientY - r.top;
      win.style.zIndex = _nextZ();
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!_drag) return;
      win.style.left = Math.max(0, Math.min(e.clientX - _ox, window.innerWidth  - win.offsetWidth))  + 'px';
      win.style.top  = Math.max(0, Math.min(e.clientY - _oy, window.innerHeight - 28)) + 'px';
    });
    document.addEventListener('mouseup', () => { _drag = false; });
  }

  // ── Menu ────────────────────────────────────────────────────────
  function _buildMenu() {
    const m = document.createElement('div');
    m.id = 'start-menu';
    m.innerHTML =
      `<div class="sm-section">Recent Documents</div>` +
      `<div class="sm-item" data-act="win:maintenance">Sector_Maintenance_Schedule_Q2.pdf</div>` +
      `<div class="sm-item" data-act="win:aria_notice">ARIA_Model_Update_Notice.txt</div>` +
      `<div class="sm-item" data-act="win:session_notice">GRIDHUB_Session_Closure_Notice.txt</div>` +
      `<div class="sm-item" data-act="403">Incident_Log_2026.csv</div>` +
      `<hr class="sm-sep">` +
      `<div class="sm-section">Applications</div>` +
      `<div class="sm-item" data-act="win:weather">Weather Monitor</div>` +
      `<div class="sm-item" data-act="win:sector_map">GRIDHUB Sector Map</div>` +
      `<div class="sm-item" data-act="win:news_feed">GRIDHUB News Feed</div>` +
      `<div class="sm-item" data-act="403">ARIA Configuration Panel</div>` +
      `<hr class="sm-sep">` +
      `<div class="sm-section">System</div>` +
      `<div class="sm-item" data-act="shutdown">Shut Down…</div>`;
    return m;
  }

  function _closeMenu() {
    const m = document.getElementById('start-menu');
    if (m) m.classList.remove('open');
  }

  function _dispatch(act) {
    if (act.startsWith('win:')) _openWin(act.slice(4));
    else if (act === '403')      _show403();
    else if (act === 'shutdown') _showShutdown();
  }

  // ── Init ────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    if (!startBtn) return;

    const menu    = _buildMenu();
    const taskbar = document.getElementById('taskbar');
    taskbar.parentNode.insertBefore(menu, taskbar);

    startBtn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });

    menu.querySelectorAll('[data-act]').forEach(el => {
      el.addEventListener('click', e => { e.stopPropagation(); _closeMenu(); _dispatch(el.dataset.act); });
    });

    document.addEventListener('click', _closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') _closeMenu(); });
  });
})();
