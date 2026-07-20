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
