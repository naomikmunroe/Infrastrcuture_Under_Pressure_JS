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
