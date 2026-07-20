# Infrastructure Under Pressure — Phase 7b
# Voicemail Consequence Mechanic (AD-45) — Revised

## Scope
Two systems implemented in order:

1. **Task 0 — Recurring characters** must be implemented and verified
   before any voicemail work begins. The voicemail references Murmur
   posts and GRIDHUB staff by name — characters must exist in the
   session before the voicemail can reference them meaningfully.

2. **Tasks 1–5 — Voicemail mechanic** — a single LLM-generated voicemail
   fires once per session between T4 and T5, selected by priority from
   six possible triggers based on variable state, behavioural patterns,
   and comms turn outcome. Every session receives a voicemail regardless
   of how the player handled the comms turn.

Phase 7b is complete when:
- Four recurring Murmur characters appear consistently across turns
- One voicemail fires per session between T4 and T5
- Trigger selection follows the six-case priority order
- Generated message references session-specific context
  (character names, variable state, comms outcome)
- Telemetry logs trigger case, generated text, and dismissal
- iup_path_simulator_1.py --test exits 0

---

## What exists already (do not re-implement)

- Murmur social feed — posts generated per turn via
  /.netlify/functions/murmur (Phase 7 Task 1)
- State.commsOutcome — mode, editExtent, consequenceFired
- State.vars — all four variables at any point in the session
- State.aiFollowCount — cumulative AI follows
- State.currentGap — gap counter
- Murmur posts logged to telemetry as murmur_posts_generated events
- GRIDHUB staff names in evidence reports:
  Patricia Okafor (Field Operations), Dev Mehta (Technical Services),
  Sandra Voss (Public Affairs)
- Netlify function proxy pattern from vignette and murmur functions

---

## Task 0 — Establish recurring characters in Murmur (IMPLEMENT FIRST)

### Why this must come before the voicemail

The voicemail API call uses session Murmur posts as context so it can
reference specific characters by name. If Murmur posts do not contain
named recurring characters, the voicemail produces a generic message
with no session specificity.

### Do not start Task 1 until Task 0 is verified.

Verification: play through two turns, check browser console for
murmur_posts_generated telemetry events. Confirm recurring characters
appear in at least two of the four posts per turn.

### The four recurring civilian characters

Update the Murmur system prompt in netlify/functions/murmur.js.
Replace the character section with the full definitions below.

```
RECURRING CHARACTERS — use these accounts every turn.
Each turn must include at least one post from a recurring character.
Their narrative must develop across the session — the player should
recognise them by Turn 3.

@julie_northgate
  Local resident, early 40s. Practical, increasingly frustrated.
  Has a fridge that keeps cutting out. Commutes by bus.
  Posts about specific small domestic details that accumulate.
  Starts resigned, becomes more vocal as things deteriorate.
  Turn 1 example: "Lights flickered again on Northgate Road.
    Third time this week. My fridge is going to give up 😩"
  Turn 3 example: "Still nothing official. Fridge has definitely
    gone. Is anyone actually in charge here?"
  Turn 5 example: "Council advisory said restored by [time]. 
    That time has passed. Keith Bramley is getting a call."

@keith_b_councillor
  Ward councillor. Professionally cautious. Non-committal.
  Tries to appear on top of things without promising anything.
  Usually replies to @julie_northgate or @northgrid_watch.
  Turn 2 example: "Aware of reports of intermittent disruption.
    Monitoring closely and in contact with sector management."
  Turn 4 example: "My office has received enquiries today. 
    All appropriate steps are being taken. Updates to follow."

@sector7_steve
  Works locally. Dry deadpan humour. Notices things quietly
  before they become official. Running commentary.
  Turn 1 example: "The lights at the junction are doing
    that thing again. You know the thing."
  Turn 3 example: "Three people at work asked me what's
    going on with the grid. I do not know."
  Turn 6 example: "Cannot tell if things are better or
    worse than yesterday. Probably worse."

@northgrid_watch
  Community monitoring account. Posts updates and speculation.
  Slightly conspiratorial. Increasingly alarmed as session progresses.
  Aggregates resident reports.
  Turn 1 example: "REPORTS: Intermittent disruption Northgate,
    Sector 7, Bridge Road. Unconfirmed. Monitoring."
  Turn 4 example: "UPDATE: Multiple reports of same issue.
    Council advisory appeared to contain placeholder text.
    Screenshot circulating in local FB group."
  Turn 5 example: "ESCALATING: Advisory error being discussed
    online. 200+ comments. No council response yet."

Instruction to model:
Use these four accounts consistently. Each turn must include at least
one recurring character. Their posts must feel narratively continuous —
Julie's fridge deteriorates, Keith's language stays cautious, Steve
stays dry, northgrid_watch escalates. Invent new usernames for the
remaining 1–2 posts per turn. Do not invent competing named characters.
```

### Verification checklist before Task 1

- [ ] @julie_northgate appears in Turn 1 Murmur posts
- [ ] @northgrid_watch appears in Turn 1 Murmur posts
- [ ] @keith_b_councillor appears by Turn 2
- [ ] @sector7_steve appears by Turn 2
- [ ] Posts feel narratively continuous across turns
- [ ] murmur_posts_generated telemetry events contain character usernames

---

## Task 1 — Voicemail trigger selection

### When the voicemail fires

Once per session, between T4 and T5 — after the comms turn screen
resolves and before T5 loads. Fires regardless of comms mode.
Uses variable state and session data at that point.

### Six-case priority order

Evaluate in order. Fire the first case that matches. If no case 1–5
matches, always fire case 6 (catch-all).

```javascript
function selectVoicemailCase(commsOutcome, vars, aiFollowCount) {
  // Case 1 — Placeholder error
  if (commsOutcome?.mode === 'ARIA_FULL' &&
      commsOutcome?.consequenceFired) return 1;

  // Case 2 — Workload critical
  if (vars.workload > 70) return 2;

  // Case 3 — Stability low
  if (vars.stability < 40) return 3;

  // Case 4 — Resources depleted
  if (vars.resources < 25) return 4;

  // Case 5 — High AI follow rate
  if (aiFollowCount >= 4) return 5;

  // Case 6 — Catch-all (always fires)
  return 6;
}
```

### Six cases — sender, theme, research function

| Case | Trigger | Sender | Theme | Research function |
|---|---|---|---|---|
| 1 | ARIA_FULL + placeholder consequence | Cllr Keith Bramley | Advisory contained garbled text — resident complaint | Trust consequence of uncritical AI acceptance |
| 2 | Workload > 70 | Patricia Okafor (Field Ops) | Her team is at breaking point | Workload variable gains a human face |
| 3 | Stability < 40 | Dev Mehta (Technical Services) | Diagnostics showing something the reports may have understated | Stability variable becomes a named colleague's concern |
| 4 | Resources < 25 | Sandra Voss (Public Affairs) | Press calls — can she say anything publicly? | Resource depletion becomes a communications crisis |
| 5 | AI Follow Rate ≥ 4 | Anonymous internal (no name) | Terse internal note questioning whether the operator is reading the evidence | Automation complacency surfaced as institutional concern |
| 6 | Catch-all | @northgrid_watch forwarded by ward office | Residents noticed something — general unease | Always fires — ensures every session has a human voice |

---

## Task 2 — Netlify function: netlify/functions/voicemail.js

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SYSTEM_PROMPTS = {
  1: `Write a short voicemail from Cllr Keith Bramley (local ward councillor)
to the GRIDHUB sector management duty operator. A resident has contacted
him about the public advisory that was issued — it contained placeholder
text that appeared verbatim, making it confusing and alarming.
Keith is professionally concerned but not aggressive. He references a
resident by name if one appears in the social media posts provided.
Maximum 70 words. Conversational voicemail format.
Ends with callback number: 07712 449031. Plain text only.`,

  2: `Write a short voicemail from Patricia Okafor, Field Operations Supervisor
at GRIDHUB, to the duty operator. Her team has been on extended shifts
and she is flagging that they are approaching operational limits.
She is professional and not complaining — just making sure the duty
operator is aware before decisions are made that require field deployment.
Maximum 60 words. Collegial but serious. Plain text only.`,

  3: `Write a short voicemail from Dev Mehta, Technical Services at GRIDHUB,
to the duty operator. He has been running secondary diagnostics and
the readings are more concerning than the official reports suggested.
He does not want to alarm anyone but thinks the duty operator should know.
Maximum 60 words. Technical but not alarmist. Ends with his extension: x2241.
Plain text only.`,

  4: `Write a short voicemail from Sandra Voss, Public Affairs at GRIDHUB,
to the duty operator. She has had three press calls in the last hour
and needs to know if there is anything she can say publicly about
current operational status and expected resolution.
Maximum 55 words. Slightly strained but professional.
Ends with: "Just let me know what I can work with." Plain text only.`,

  5: `Write a short internal voicemail message left for the GRIDHUB duty
operator. The message is from an unnamed senior colleague. It is terse
and mildly pointed — the colleague has noticed that the operator appears
to have followed the automated advisory system recommendations consistently
and is gently questioning whether independent assessment of the evidence
has taken place.
Do not be aggressive. Be institutional. Maximum 50 words. Plain text only.`,

  6: `Write a short voicemail from a junior ward office staff member
forwarding a message received from a community monitoring account
(@northgrid_watch). Residents have noticed that something is happening
with local infrastructure and are asking for more information.
The officer is reading it out as a routine log. Mild, not urgent.
Maximum 50 words. Ends with: "Logged for the ward record." Plain text only.`,
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const {
    voicemailCase,
    murmurPosts,
    vars,
    aiFollowCount,
    commsMode,
    turn,
  } = JSON.parse(event.body);

  const systemPrompt = SYSTEM_PROMPTS[voicemailCase];
  if (!systemPrompt) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ text: null }),
    };
  }

  // Build resident context from session Murmur posts
  const residentContext = murmurPosts.length > 0
    ? murmurPosts
        .flat()
        .map(p => `${p.username}: "${p.text}"`)
        .slice(-10)
        .join('\n')
    : 'No resident posts available.';

  const userPrompt = `Session context at Turn ${turn}:
Stability: ${vars.stability}/100
Resources: ${vars.resources}/100
Workload: ${vars.workload}/100
Public Confidence: ${vars.confidence}/100
AI recommendations followed: ${aiFollowCount} of ${turn - 1} turns
Comms mode: ${commsMode || 'not yet completed'}

Recent civilian social media posts from this session:
${residentContext}

Generate the voicemail message now.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ text, voicemailCase }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ text: null, voicemailCase }),
    };
  }
};
```

### Fallback text per case (used if API call fails)

```javascript
const FALLBACK_TEXT = {
  1: "Yes, Keith Bramley here, Northgate ward. I've had a resident contact me about the advisory — there seem to have been some issues with the text as published. Could someone call me back? 07712 449031. Thanks.",
  2: "Patricia here — Field Ops. Just flagging that my team is approaching shift limits. Wanted you to know before any further deployment decisions are made. Call me if needed.",
  3: "Dev Mehta, Technical Services. Secondary diagnostics are showing readings I think you should be aware of. Give me a call — extension 2241.",
  4: "Sandra Voss, Public Affairs. I've had press calls. Can someone tell me what I can say? Just let me know what I can work with.",
  5: "This is a message for the duty operator. I've been reviewing today's decision log. I'd encourage a review of the available evidence reports before the next operational period. That's all.",
  6: "This is the ward office calling. We've received a post from a community monitoring account asking for more information about current infrastructure status. Logged for the ward record.",
};
```

---

## Task 3 — Voicemail player UI

Win98 window, width 360px, z-index 1200. Positioned centre-screen.

```html
<div id="window-voicemail" class="window floating-window"
     style="display:none;width:360px;z-index:1200;">
  <div class="title-bar" style="background:#1a1a4a;">
    <div class="title-bar-text">⚠ GRIDHUB — INCOMING MESSAGE</div>
    <button class="title-bar-close" id="btn-voicemail-close">✕</button>
  </div>
  <div class="window-body" style="font-size:10px;padding:8px;">

    <table style="width:100%;font-size:10px;margin-bottom:8px;
                  border-collapse:collapse;">
      <tr>
        <td style="color:#555;width:80px;padding:1px 0;">FROM:</td>
        <td id="voicemail-from" style="font-weight:bold;color:#000080;"></td>
      </tr>
      <tr>
        <td style="color:#555;padding:1px 0;">TIME:</td>
        <td id="voicemail-time" style="color:#333;"></td>
      </tr>
      <tr>
        <td style="color:#555;padding:1px 0;">RE:</td>
        <td id="voicemail-subject" style="color:#333;"></td>
      </tr>
    </table>

    <hr style="border-color:#ccc;margin:6px 0;">

    <div id="voicemail-play-area" style="text-align:center;padding:6px 0;">
      <button id="btn-play-voicemail" class="button"
              style="font-size:11px;padding:4px 16px;">
        ▶ PLAY MESSAGE
      </button>
    </div>

    <div id="voicemail-text" style="display:none;
         background:#f8f8f0;
         border:1px inset #808080;
         padding:8px;
         font-size:10px;
         line-height:1.7;
         margin-top:6px;
         font-family:Arial,sans-serif;
         color:#222;
         font-style:italic;
         min-height:60px;">
    </div>

    <hr style="border-color:#ccc;margin:8px 0;">

    <div style="display:flex;gap:6px;justify-content:flex-end;">
      <button class="button" id="btn-voicemail-acknowledge"
              style="font-size:10px;">
        [ ACKNOWLEDGE ]
      </button>
      <button class="button" id="btn-voicemail-escalate"
              style="font-size:10px;">
        [ ESCALATE TO MANAGER ]
      </button>
    </div>
    <div style="font-size:8px;color:#888;margin-top:4px;text-align:right;">
      Both options log receipt. No further action required.
    </div>
  </div>
</div>
```

### Sender metadata per case

```javascript
const VOICEMAIL_META = {
  1: { from: 'Cllr K. Bramley — Northgate Ward',    subject: 'Resident enquiry — published advisory' },
  2: { from: 'P. Okafor — Field Operations',         subject: 'Team operational status' },
  3: { from: 'D. Mehta — Technical Services',        subject: 'Secondary diagnostic findings' },
  4: { from: 'S. Voss — Public Affairs',             subject: 'Press enquiries — statement request' },
  5: { from: 'Internal — [sender withheld]',         subject: 'Operational review note' },
  6: { from: 'Northgate Ward Office (staff message)', subject: 'Community monitoring — resident post' },
};
```

### Play button behaviour

1. Hide play button, show voicemail-text div with "Loading message…"
2. Call /.netlify/functions/voicemail with payload
3. On response: reveal message text character by character
   (typewriter effect at 25ms per character)
4. On failure: show fallback text for this case immediately
5. Log telemetry once text is fully displayed

### Dismiss behaviour

Both ACKNOWLEDGE and ESCALATE call the same handler — no mechanical
difference. × also dismisses. All three log the reply option.

```javascript
function dismissVoicemail(replyOption) {
  const timeOpen = Date.now() - _voicemailOpenTime;
  document.getElementById('window-voicemail').style.display = 'none';
  State.setVoicemailFired();
  Telemetry.logVoicemailDismissed(replyOption, timeOpen);
}
```

---

## Task 4 — Calling logic in main.js / turns.js

### When to call

After the comms screen resolves and before T5 loads.
In `resumeAfterComms()` or wherever T5 load is triggered:

```javascript
async function resumeAfterComms() {
  UI.clearAllPopups();

  // Show voicemail before T5 loads
  if (!State.voicemailFired) {
    const vmCase = selectVoicemailCase(
      State.commsOutcome,
      State.vars,
      State.aiFollowCount
    );
    await showVoicemail(vmCase); // awaited — T5 waits for dismissal
  }

  loadTurn(State.turn - 1); // T5
}
```

The voicemail is awaited — the player must dismiss it before T5 loads.
This gives it narrative weight: it is not ignorable.

### Building the payload

```javascript
async function showVoicemail(vmCase) {
  const meta = VOICEMAIL_META[vmCase];
  const win  = document.getElementById('window-voicemail');

  // Set header fields
  document.getElementById('voicemail-from').textContent    = meta.from;
  document.getElementById('voicemail-time').textContent    = generateFictionalTime();
  document.getElementById('voicemail-subject').textContent = meta.subject;

  // Show window
  win.style.display = 'block';
  _voicemailOpenTime = Date.now();

  // Log that voicemail was shown
  Telemetry.logVoicemailShown(vmCase, meta.from);

  // Wire play button
  document.getElementById('btn-play-voicemail').onclick = async () => {
    document.getElementById('btn-play-voicemail').style.display = 'none';
    const textEl = document.getElementById('voicemail-text');
    textEl.style.display = 'block';
    textEl.textContent = 'Loading message…';

    const murmurPosts = Telemetry.getMurmurPosts();

    try {
      const response = await fetch('/.netlify/functions/voicemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voicemailCase:  vmCase,
          murmurPosts,
          vars:           State.vars,
          aiFollowCount:  State.aiFollowCount,
          commsMode:      State.commsOutcome?.mode || null,
          turn:           State.turn,
        }),
      });

      const data = await response.json();
      const text = data.text || FALLBACK_TEXT[vmCase];
      typewriterReveal(textEl, text);
      Telemetry.logVoicemailPlayed(vmCase, text, State.commsOutcome?.mode);

    } catch {
      const text = FALLBACK_TEXT[vmCase];
      typewriterReveal(textEl, text);
      Telemetry.logVoicemailPlayed(vmCase, text, State.commsOutcome?.mode);
    }
  };

  // Wire dismiss buttons
  ['btn-voicemail-acknowledge','btn-voicemail-escalate','btn-voicemail-close']
    .forEach((id, i) => {
      const options = ['ACKNOWLEDGE','ESCALATE','CLOSE'];
      document.getElementById(id).onclick = () => dismissVoicemail(options[i]);
    });

  // Return promise that resolves on dismiss
  return new Promise(resolve => {
    _voicemailResolve = resolve;
  });
}

function dismissVoicemail(replyOption) {
  const timeOpen = Date.now() - _voicemailOpenTime;
  document.getElementById('window-voicemail').style.display = 'none';
  State.setVoicemailFired();
  Telemetry.logVoicemailDismissed(replyOption, timeOpen);
  if (_voicemailResolve) { _voicemailResolve(); _voicemailResolve = null; }
}

function generateFictionalTime() {
  // Generate a plausible time string based on session elapsed time
  const base = new Date();
  base.setHours(14, 30 + Math.floor(Math.random() * 60), 0);
  return base.toTimeString().slice(0,5);
}

function typewriterReveal(el, text) {
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, 25);
}
```

---

## Task 5 — Telemetry

Add to telemetry.js:

```javascript
logVoicemailShown(vmCase, sender) {
  log('voicemail_shown', { vmCase, sender });
},

logVoicemailPlayed(vmCase, generatedText, commsMode) {
  log('voicemail_played', { vmCase, generatedText, commsMode });
},

logVoicemailDismissed(replyOption, timeOpenMs) {
  log('voicemail_dismissed', { replyOption, timeOpenMs });
},
```

Add to session export:

```javascript
voicemail: (() => {
  const shown     = _events.find(e => e.type === 'voicemail_shown');
  const played    = _events.find(e => e.type === 'voicemail_played');
  const dismissed = _events.find(e => e.type === 'voicemail_dismissed');
  if (!shown) return null;
  return {
    case:          shown.vmCase,
    sender:        shown.sender,
    generatedText: played?.generatedText || null,
    commsMode:     played?.commsMode || null,
    replyOption:   dismissed?.replyOption || null,
    timeOpenMs:    dismissed?.timeOpenMs || null,
    messagePlayed: !!played,
  };
})(),
```

---

## Task 6 — State flag

Add to state.js:

```javascript
let _voicemailFired = false;

// In State.init():
_voicemailFired = false;

get voicemailFired() { return _voicemailFired; }
setVoicemailFired()  { _voicemailFired = true; }
```

---

## Architecture rules

- Voicemail fires ONCE per session — state flag enforced
- Fires between T4 and T5 — always, regardless of comms mode
- T5 does not load until voicemail is dismissed — use await pattern
- Player must click PLAY MESSAGE to see text — not auto-revealed
- Both reply buttons have identical mechanical effect
- Fallback text always available — no broken window states
- Generated text logged to telemetry before typewriter reveal begins
- selectVoicemailCase() is pure — no side effects

---

## Done criteria

### Task 0 — Recurring characters
- [ ] @julie_northgate appears in Turn 1
- [ ] @northgrid_watch appears in Turn 1
- [ ] @keith_b_councillor appears by Turn 2
- [ ] @sector7_steve appears by Turn 2
- [ ] Posts feel narratively continuous across turns
- [ ] At least one recurring character per turn in telemetry
- [ ] Verified before Task 1 begins

### Tasks 1–6 — Voicemail
- [ ] netlify/functions/voicemail.js deployed without errors
- [ ] selectVoicemailCase() returns correct case for each trigger condition
- [ ] Case 1 fires when ARIA_FULL + consequenceFired
- [ ] Case 2 fires when workload > 70
- [ ] Case 3 fires when stability < 40
- [ ] Case 4 fires when resources < 25
- [ ] Case 5 fires when aiFollowCount >= 4
- [ ] Case 6 fires when none of 1–5 match
- [ ] Only highest priority case fires — lower cases do not also fire
- [ ] Voicemail window appears between T4 and T5
- [ ] T5 does not load until voicemail is dismissed
- [ ] FROM, TIME, RE fields correct per case
- [ ] PLAY MESSAGE button reveals text via typewriter effect
- [ ] Generated text references session-specific content
  (Murmur character name, variable state, or comms outcome)
- [ ] Fallback text renders if API fails — no broken screen
- [ ] ACKNOWLEDGE, ESCALATE, and × all dismiss correctly
- [ ] voicemail_shown, voicemail_played, voicemail_dismissed
  all logged to telemetry
- [ ] voicemail object in session export with all fields
- [ ] voicemail: null if not fired (should not happen — case 6 catch-all)
- [ ] State.voicemailFired resets to false on State.init()
- [ ] iup_path_simulator_1.py --test exits 0
