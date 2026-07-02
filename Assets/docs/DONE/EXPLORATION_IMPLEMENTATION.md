# Exploration Implementation — DONE
**Infrastructure Under Pressure (IUP)**

Implementation complete. Ambient environment layer; no telemetry integration.

---

## Overview

Win98-style Start menu on the taskbar with draggable, closeable document windows and application panels accessible as ambient exploration content. No game state is read or written; no telemetry events are fired for any exploration interaction.

---

## Files Modified / Created

| File | Change |
|---|---|
| `index.html` | CSS — `.sm-*` (Start menu), `.float-win`, `.float-win-body`, `.maint-tbl`, `.st-*` status classes |
| `index.html` | Added `id="start-btn"` to taskbar Start button |
| `index.html` | Added `<script src="js/startmenu.js"></script>` |
| `js/startmenu.js` | New file — self-contained IIFE, all Start menu + window + dialog logic |

---

## Start Menu Structure

Opens on **Start** click; closes on **click-away** or **Escape**.
Positioned `fixed; bottom: 24px; left: 0` — always sits above the taskbar.

### Recent Documents

| Item | Behaviour |
|---|---|
| Sector_Maintenance_Schedule_Q2.pdf | Opens maintenance table window |
| ARIA_Model_Update_Notice.txt | Opens ARIA model notice window |
| GRIDHUB_Session_Closure_Notice.txt | Opens session closure notice window |
| Incident_Log_2026.csv | 403 error dialog |

### Applications

| Item | Behaviour |
|---|---|
| Weather Monitor | Opens weather data window |
| GRIDHUB Sector Map | Opens SVG sector schematic window |
| GRIDHUB News Feed | Opens internal bulletins window |
| ARIA Configuration Panel | 403 error dialog |

### System

| Item | Behaviour |
|---|---|
| Shut Down… | Error dialog — cannot shut down during active incident response |

---

## Content Windows

All windows are draggable (title bar), closeable (✕ button), raise to front on click, and cascade on open. Multiple may be open simultaneously. Re-opening an already-open window brings it to front rather than duplicating it.

### 1. Sector_Maintenance_Schedule_Q2.pdf

- **Window title:** `Maintenance Schedule — Q2 2026 [READ ONLY]`
- **Width:** 540px
- 8-row table: Ref / Item / Substation / Scheduled Date / Status
- Statuses: Complete (green), Overdue (red/bold), Scheduled (blue)
- Two Overdue items reference Sector A:
  - `MNT-003` — Switchgear maintenance, Sector A — Sub 1, 2026-03-15
  - `MNT-006` — Busbar thermal imaging, Sector A — Sub 3, 2026-04-18
- Footer: Protocol 4.2 escalation note

### 2. ARIA_Model_Update_Notice.txt

- **Window title:** `ARIA_Model_Update_Notice.txt` | **Width:** 370px
- Content (verbatim): model update Q3 2026, training cutoff December 2023, ARIA-MU-2026-003

### 3. GRIDHUB_Session_Closure_Notice.txt

- **Window title:** `GRIDHUB_Session_Closure_Notice.txt` | **Width:** 360px
- Content: WARNING — do not close terminal during active incident response; formal closure required by duty supervisor; Protocol 3.1

### 4. Weather Monitor

- **Window title:** `Weather Monitor — National Grid Integration` | **Width:** 330px
- Source: National Grid Weather Integration Service
- Current conditions: Elevated temperature, 38°C (+11°C above seasonal), Peak demand risk: HIGH
- 5-day outlook: 34–38°C, all above seasonal average
- Advisory banner in amber

### 5. GRIDHUB Sector Map

- **Window title:** `GRIDHUB Sector Overview — Live View [15 min delay]` | **Width:** 400px
- SVG schematic, 380×~200px, `fill="#d4d0c8"` background
- 3 × 2 grid of sectors A–F:
  - **Sector A** — amber `#e8c860`, label "MONITORING / ⚠ ELEVATED RISK"
  - **Sector B** — green `#82c882`, label "STABLE"
  - **Sector C** — amber `#e8c860`, label "MONITORING / ⚠ ELEVATED RISK"
  - **Sectors D, E, F** — green, label "STABLE"
- Each sector shows two substation circles connected by a dashed line
- Inter-sector transmission lines connecting all adjacent sector pairs
- Legend: Green = Stable, Amber = Monitoring required, Red = Incident active

### 6. GRIDHUB News Feed

- **Window title:** `GRIDHUB News Feed — Internal Bulletins` | **Width:** 390px
- Four bulletins in reverse-chronological order:
  - `[2026-06-28]` Regional demand forecast revised upward for Q3.
  - `[2026-06-15]` ARIA model update scheduled — see notice ARIA-MU-2026-003.
  - `[2026-06-10]` Contractor availability reduced — southern sectors.
  - `[2026-05-30]` Repeat fault reports logged — Sector A substations.

---

## Dialogs

### 403 Forbidden
- **Title:** `Access Denied — GRIDHUB Security`
- **Body:** `403 FORBIDDEN` (red bold) + access restriction message + Ref: GRIDHUB-SEC-403
- Triggered by: Incident_Log_2026.csv, ARIA Configuration Panel
- Dismisses on OK or backdrop click

### Shut Down
- **Title:** `Shut Down GRIDHUB Terminal`
- **Body:** "Cannot shut down terminal during active incident response. All operational sessions must be formally closed by the duty supervisor." + Ref: GH-OPS-PROC-3.1
- Dismisses on OK or backdrop click

---

## Architecture Notes

- `js/startmenu.js` is a self-contained IIFE with zero dependencies on `State`, `Telemetry`, `UI`, `Turns`, or `Main`
- Loaded last (after `audio.js`) — no load-order constraints
- `_open` object (key → DOM element) prevents duplicate windows; re-clicking brings existing window to front
- `_dispatch(act)` routes menu item clicks: `'win:KEY'` → `_openWin`, `'403'` → `_show403`, `'shutdown'` → `_showShutdown`
- Z-index: Start menu 1000 (dialogs), 400+ (document windows), below consequence popups
- Drag clamped to viewport on all four edges
- Template literals used throughout (ES6, no module restrictions apply)

---

## Acceptance Criteria

- [x] Start menu opens on Start button click
- [x] Start menu closes on click-away
- [x] Start menu closes on Escape key
- [x] Three sections: Recent Documents, Applications, System
- [x] All 6 content windows open as draggable Win98 windows
- [x] Multiple windows can be open simultaneously
- [x] Re-clicking an open document brings it to front, no duplicate
- [x] Close button removes window
- [x] Incident_Log_2026.csv shows 403 dialog
- [x] ARIA Configuration Panel shows 403 dialog
- [x] Shut Down shows error dialog with spec text
- [x] Dialogs dismiss on OK or backdrop click
- [x] Sector A and C highlighted amber in sector map
- [x] Sector map legend includes green / amber / red
- [x] Weather window shows condition, peak demand risk HIGH, 5-day outlook
- [x] News feed shows all 4 bulletins verbatim
- [x] Overdue Sector A items present in maintenance table (MNT-003, MNT-006)
- [x] No telemetry events fired by any exploration interaction
- [x] No game state read or written
