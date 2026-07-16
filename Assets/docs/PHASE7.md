# Infrastructure Under Pressure — Phase 7
# Emergent Narrative and GenAI Integration

## Scope
Four implementation tasks following supervisor feedback (Hargood, July 2026).
Decision log: AD-39 through AD-44.

Phase 7 is complete when Murmur posts generate and display per turn,
turn summary lines generate on each turn summary screen, the duty log
prompt is updated, the vignette template is hosted, and the tracking
spreadsheet URLs are updated.

---

## What exists already (do not re-implement)

- Anthropic API proxy via Netlify function at /.netlify/functions/vignette
- Vignette generation in Main.showVignette() using full telemetry prompt
- The Sector Gazette popup at gaps 2, 4, 5 with State.currentGap tracking
- Duty log modal between T3 and T4 with 80-character minimum
- Turn summary screen between turns
- Between-turn event system with State.currentGap counter
- All telemetry fields through AD-38

---

## Task 1 — Murmur social feed (AD-39, AD-44)

### What it is
A fictional civilian social media platform displayed in the right panel
below the ARIA advisory section. Generates 3–4 short posts per turn via
Anthropic API call on turn load. Posts accumulate across turns — new posts
appear at top, older posts scroll down. Non-interactive.

### Position in layout
Add a new sub-section at the bottom of #panel-aria (right panel),
below the ARIA limitations footer. Separated by a thin rule.

Header: small Win98 window title bar: "Murmur — Public Feed ⚡"
(no close button — cannot be dismissed)

Post container: scrollable, max-height 160px, overflow-y auto.

### Post styling
Platform feel — NOT Win98 institutional. Deliberately different register:
- Background: #fafafa (off-white, slightly warmer than system windows)
- Border: 1px solid #e0e0e0
- Each post: a small card with username in blue bold, timestamp in grey,
  post text in dark grey
- Username format: @[firstname]_[descriptor] e.g. @sarah_northgrid,
  @concerned_commuter, @sector7_steve, @local_mum2024
- Timestamp: relative e.g. "2m ago", "14m ago", "1h ago" — fictional,
  consistent within a turn
- Post text: 10–20 words, colloquial, no technical jargon

Example post cards:
```
@northgrid_watch · 2m ago
Third time this week the street lights have flickered.
Someone explain what's actually going on?

@concerned_commuter · 8m ago
Signal failures again on the 07:42. Is it related to
the grid issues? No one tells us anything.
```

### Netlify function — extend existing vignette proxy

The existing vignette function proxies Anthropic API calls. Create a
separate function for Murmur to keep concerns separate:

`netlify/functions/murmur.js`

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const { vars, condition, gap, gazetteHeadline } = JSON.parse(event.body);

  const systemPrompt = `You are generating posts for Murmur, a fictional civilian 
social media platform. Generate exactly 4 short posts from fictional civilian 
accounts reacting to local infrastructure conditions. Each post must be under 
20 words. Write in colloquial, emotional, everyday language — not institutional 
or technical. Posts should feel like real people, not press releases.

Username format: @firstname_descriptor (e.g. @sarah_northgrid, @local_dad_sw4)
Include a fictional relative timestamp: "2m ago", "14m ago", "1h ago" etc.

Do not reference specific technical systems, variable names, or game mechanics.
React to lived experience: flickering lights, disrupted commutes, slow responses,
uncertainty about what is happening.

${gazetteHeadline ? `One post may react to this recent news without quoting it directly: "${gazetteHeadline}"` : ''}

Respond in this exact JSON format only — no other text:
{"posts":[{"username":"@name","time":"Xm ago","text":"post text here"},...]}`; 

  const userPrompt = `Current conditions:
Stability: ${vars.stability}/100
Resources: ${vars.resources}/100  
Workload: ${vars.workload}/100
Public Confidence: ${vars.confidence}/100
Condition: ${condition}
Session gap: ${gap}

Generate 4 civilian social media posts appropriate to these conditions.
Low confidence = more anxiety and frustration. High workload = complaints
about slow response times. Low stability = reports of disruption.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json();
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
};
```

### Calling Murmur from turns.js

Call on turn load, after ARIA content renders. Non-blocking — do not
await before rendering the rest of the turn. Show a loading placeholder
while posts generate.

```javascript
async function loadMurmur(turnIndex) {
  const murmurContainer = document.getElementById('murmur-posts');
  if (!murmurContainer) return;

  // Show loading placeholder
  murmurContainer.innerHTML = `
    <div style="font-size:9px;color:#aaa;padding:4px;font-style:italic;">
      Loading Murmur feed…
    </div>`;

  // Get active Gazette headline if applicable
  const gazetteHeadline = getActiveGazetteHeadline(State.currentGap);

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
    const text = data.content?.find(b => b.type === 'text')?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    const posts = parsed.posts || [];

    // Prepend new posts to existing feed
    const newHTML = posts.map(post => `
      <div style="border-bottom:1px solid #eee;padding:4px 0;margin-bottom:2px;">
        <div>
          <span style="color:#000080;font-weight:bold;font-size:9px;">${post.username}</span>
          <span style="color:#aaa;font-size:8px;margin-left:4px;">${post.time}</span>
        </div>
        <div style="font-size:10px;color:#333;line-height:1.4;margin-top:1px;">${post.text}</div>
      </div>
    `).join('');

    murmurContainer.innerHTML = newHTML + murmurContainer.innerHTML;

    // Log to telemetry
    Telemetry.logMurmurPosts(State.turn, posts, State.vars);

  } catch (err) {
    murmurContainer.innerHTML = `
      <div style="font-size:9px;color:#aaa;padding:4px;font-style:italic;">
        Murmur feed unavailable.
      </div>`;
  }
}

function getActiveGazetteHeadline(gap) {
  // NEWSPAPER_EDITIONS is already in data.js
  const edition = NEWSPAPER_EDITIONS.find(e => e.appearsAfterGap === gap);
  return edition ? edition.headline.replace('\n', ' ') : null;
}
```

Call `loadMurmur(turnIndex)` without await in `loadTurn()` after
ARIA panel renders — let it load in background.

### Murmur panel HTML (add to main.js buildGameScreen)

Add below #aria-limitations in the right panel:

```html
<hr style="margin:8px 2px;border-color:#ddd;">
<div style="font-size:9px;color:#555;font-weight:bold;margin-bottom:4px;">
  ⚡ Murmur — Public Feed
</div>
<div id="murmur-posts" style="
  max-height:160px;
  overflow-y:auto;
  font-size:10px;
  background:#fafafa;
  border:1px solid #e0e0e0;
  padding:4px;
">
  <div style="font-size:9px;color:#aaa;font-style:italic;">
    Connecting to Murmur…
  </div>
</div>
```

### Telemetry

Add to telemetry.js:

```javascript
logMurmurPosts(turn, posts, vars) {
  log('murmur_posts_generated', {
    turn,
    posts, // array of {username, time, text}
    vars_snapshot: {...vars},
  });
},
```

Add to session export:
```javascript
murmurLog: _events.filter(e => e.type === 'murmur_posts_generated')
  .map(e => ({ turn: e.turn, posts: e.posts })),
```

---

## Task 2 — Turn summary narrative lines (AD-40)

### What it is
One LLM-generated institutional sentence displayed on the turn summary
screen, describing what changed systemically after the completed turn.
Appears below the variable bars, above any consequence event summaries.

### Netlify function

Add to `netlify/functions/turnsummary.js`:

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const { turn, varsBefore, varsAfter, consequencesFired } = JSON.parse(event.body);

  const systemPrompt = `You are an automated reporting system for a critical 
infrastructure management organisation. Write exactly one sentence summarising 
what changed in the system during this operational turn. 

Use institutional third-person past tense. Do not evaluate performance. 
Do not use second person. Do not recommend actions. Reference the specific 
variables that changed and by how much. If consequence events fired, name 
them concisely. Maximum 30 words. Plain text only.

Example: "System stability declined by 10 points following deferred maintenance 
action, while resource reserves remained unchanged at 45% of operational capacity."`;

  const delta = {
    stability:  varsAfter.stability  - varsBefore.stability,
    resources:  varsAfter.resources  - varsBefore.resources,
    workload:   varsAfter.workload   - varsBefore.workload,
    confidence: varsAfter.confidence - varsBefore.confidence,
  };

  const userPrompt = `Turn ${turn} outcome:
${Object.entries(delta).map(([k,v]) => 
  `${k}: ${varsBefore[k]} → ${varsAfter[k]} (${v >= 0 ? '+' : ''}${v})`
).join('\n')}
${consequencesFired.length ? `Consequence events: ${consequencesFired.join(', ')}` : ''}

Write one institutional summary sentence.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json();
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
};
```

### Calling from turns.js

In `handleBetweenTurn()` or the turn summary rendering, after variable
bars update, call the turnsummary function with varsBefore and varsAfter.
Track varsBefore at the start of each turn in a local variable.

Display the generated sentence in italic grey 10px below the variable
bars on the turn summary screen:

```html
<div id="turn-summary-narrative" style="
  font-size:10px;
  color:#666;
  font-style:italic;
  margin-top:8px;
  padding:4px 6px;
  border-left:2px solid #ccc;
  line-height:1.6;
">
  Generating summary…
</div>
```

Error fallback: if API call fails, leave the element empty — do not
show an error message on the turn summary screen.

---

## Task 3 — Duty log prompt reframe (AD-41)

Single string change only. Find the duty log modal prompt text and
update it:

**Find:**
```
"Describe the current system state"
```
or equivalent current prompt text in the duty log modal.

**Replace with:**
```
"Summarise the situation as it stands and any patterns you have observed."
```

The GRIDHUB protocol enforcement line below it remains:
"GRIDHUB PROTOCOL 7 — Situation reports must contain a complete
operational summary. Minimum length requirement applies."

No other changes to the duty log modal.

---

## Task 4 — Vignette template and hosting (AD-43)

### Create vignette template

Create `public/vignette-template.html` — a standalone GRIDHUB-styled
page for displaying individual session vignettes.

Page structure:
- Win98-inspired aesthetic but readable as standalone (no 98.css dependency)
- Black terminal background, green/grey monospace text
- GRIDHUB header with participant ID, condition, date placeholders
- Content area where vignette text is pasted
- Standard footer: "This report was generated by GRIDHUB automated
  systems from session telemetry. It does not constitute a performance
  assessment. ■"
- No dependencies on prototype JS files
- No interactive elements

Create a holding page at `public/vignettes/holding.html`:
```html
GRIDHUB AUTOMATED REPORT SYSTEM
Session report: PENDING
This report will be available shortly after your session ends.
Contact the researcher if this page has not updated within 24 hours.
```

All 30 vignette slots should be created as copies of holding.html
with predictable names. Create a script `scripts/create-vignette-slots.js`
that generates all 30:

```javascript
// Generates public/vignettes/P01-calm.html through P15-pushy.html
const fs = require('fs');
// P01,P03... calm first; P02,P04... pushy first
for (let i = 1; i <= 15; i++) {
  const pid = `P${String(i).padStart(2,'0')}`;
  const calmFirst = i % 2 !== 0;
  const [c1, c2] = calmFirst ? ['calm','pushy'] : ['pushy','calm'];
  ['calm','pushy'].forEach(cond => {
    const filename = `public/vignettes/${pid}-${cond}.html`;
    // Copy holding.html content with pid/cond substituted
    fs.copyFileSync('public/vignettes/holding.html', filename);
  });
}
console.log('30 vignette slots created.');
```

### Update questionnaire spec

Add to questionnaire_spec.md:

Q7 (Form B, Page 2, after Q6):
```
After each session you received an automated incident report generated 
by the system from your session data. Links to both reports were included 
in your session invitation email.

Reflecting on one or both of those reports — did it accurately describe 
what happened? Was there anything it got wrong, overstated, or left out?

Minimum: 50 characters.
```

---

## Architecture rules

- Murmur API call is non-blocking — do not await before rendering turn
- Turn summary API call can be awaited — turn summary screen is a pause point
- Both new functions use the same CORS headers as the existing vignette function
- Murmur posts log to telemetry — turn summary line does not (covered by turn telemetry)
- Vignette template has no JS dependencies — static HTML only
- All new Netlify functions use process.env.ANTHROPIC_API_KEY — same env var

---

## Done criteria

### Task 1 — Murmur
- [ ] Murmur panel visible in right column below ARIA limitations footer
- [ ] 3–4 posts generate on Turn 1 load
- [ ] Posts accumulate across turns — new posts at top
- [ ] Loading placeholder shows while generating
- [ ] Error fallback renders "feed unavailable" — no broken screen
- [ ] Post styling distinct from Win98 — social media register
- [ ] Gap 2, 4, 5: at least one post may reference active Gazette headline
- [ ] Gap 1, 3: posts generated from variable state only
- [ ] `murmur_posts_generated` event logged per turn in telemetry
- [ ] `murmurLog` array in session export

### Task 2 — Turn summary lines
- [ ] One sentence renders on turn summary screen after each turn
- [ ] Sentence references specific variables and deltas
- [ ] Consequence events named if fired this turn
- [ ] Italic grey styling below variable bars
- [ ] Error fallback: empty element, no error text
- [ ] Loading state: "Generating summary…" while awaiting

### Task 3 — Duty log prompt
- [ ] Prompt text updated to invite causal pattern recognition
- [ ] GRIDHUB protocol enforcement line unchanged
- [ ] 80-character minimum unchanged
- [ ] No other changes to duty log modal

### Task 4 — Vignette template
- [ ] public/vignette-template.html created — GRIDHUB styled, standalone
- [ ] public/vignettes/holding.html created with pending message
- [ ] scripts/create-vignette-slots.js creates all 30 holding slots
- [ ] Running the script produces P01-calm.html through P15-pushy.html
- [ ] Template is readable in browser with no prototype dependencies
- [ ] Q7 added to Form B questionnaire spec

### Final checks
- [ ] All three Netlify functions deploy without errors
- [ ] Run full session — Murmur posts appear each turn
- [ ] Run full session — turn summary line appears after each turn
- [ ] Vignette holding page accessible at /vignettes/P01-calm.html
- [ ] iup_path_simulator_1.py --test exits 0
