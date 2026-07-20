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
