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
