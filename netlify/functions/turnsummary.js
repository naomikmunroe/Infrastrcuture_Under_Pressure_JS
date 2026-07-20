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

  const systemPrompt = `You are an observer summarising what just happened in a critical
infrastructure management session. Write one short sentence that
names the significant change or pattern from this turn — not the
numbers, but what they mean operationally. Use plain English. Focus
on consequence and direction, not measurement. Maximum 20 words.
Do not start with 'System' or 'The system'.

Examples of good output:
Stability held, but at the cost of resources that may not be
recoverable later.
A difficult turn — workload climbed while confidence continued to slip.
The rerouting bought time, but the maintenance backlog is growing.`;

  const delta = {
    stability:  varsAfter.stability  - varsBefore.stability,
    resources:  varsAfter.resources  - varsBefore.resources,
    workload:   varsAfter.workload   - varsBefore.workload,
    confidence: varsAfter.confidence - varsBefore.confidence,
  };

  const userPrompt = `Turn ${turn} outcome:
${Object.entries(delta).map(([k, v]) =>
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
