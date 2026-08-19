const DEMO_READS = [
  [
    'Claude',
    38,
    'The headline foregrounds conflict and leaves the baseline outside the frame.',
  ],
  [
    'ChatGPT',
    46,
    'An active verb assigns motive before the evidence is presented.',
  ],
  [
    'Gemini',
    31,
    'The framing is visible, but the underlying claim may still be sound.',
  ],
  [
    'DeepSeek',
    62,
    'The missing denominator is doing more work than the headline admits.',
  ],
]

const buckets = new Map()

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  }
}

function rateLimit(event, limit = 12, windowMs = 10 * 60 * 1000) {
  const ip =
    event?.headers?.['x-nf-client-connection-ip'] ||
    event?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(ip, {start: now, count: 1})
    return true
  }

  bucket.count += 1
  return bucket.count <= limit
}

function parseJsonText(value) {
  const clean = String(value || '')
    .replace(/^```json\s*|\s*```$/g, '')
    .trim()
  return JSON.parse(clean)
}

function normalizeInput(value = {}) {
  return {
    title: String(value.title || '')
      .trim()
      .slice(0, 500),
    description: String(value.description || '')
      .trim()
      .slice(0, 6000),
    source: String(value.source || '')
      .trim()
      .slice(0, 120),
  }
}

async function fetchTimed(url, options, timeoutMs = 18000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {...options, signal: controller.signal})
  } finally {
    clearTimeout(timer)
  }
}

async function call(model, work) {
  try {
    return {model, ok: true, data: await work()}
  } catch (error) {
    return {model, ok: false, error: error?.message || 'Unavailable'}
  }
}

async function readWithMinds(system, user) {
  const tasks = []

  if (process.env.ANTHROPIC_API_KEY) {
    tasks.push(
      call('Claude', async () => {
        const response = await fetchTimed(
          'https://api.anthropic.com/v1/messages',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
              max_tokens: 900,
              system,
              messages: [{role: 'user', content: user}],
            }),
          },
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return parseJsonText(data.content?.[0]?.text)
      }),
    )
  }

  if (process.env.OPENAI_API_KEY) {
    tasks.push(
      call('ChatGPT', async () => {
        const response = await fetchTimed(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
              response_format: {type: 'json_object'},
              messages: [
                {role: 'system', content: system},
                {role: 'user', content: user},
              ],
            }),
          },
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return parseJsonText(data.choices?.[0]?.message?.content)
      }),
    )
  }

  if (process.env.GEMINI_API_KEY) {
    tasks.push(
      call('Gemini', async () => {
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
        const response = await fetchTimed(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              contents: [{parts: [{text: `${system}\n\n${user}`}]}],
              generationConfig: {responseMimeType: 'application/json'},
            }),
          },
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return parseJsonText(data.candidates?.[0]?.content?.parts?.[0]?.text)
      }),
    )
  }

  if (process.env.DEEPSEEK_API_KEY) {
    tasks.push(
      call('DeepSeek', async () => {
        const response = await fetchTimed(
          'https://api.deepseek.com/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
              response_format: {type: 'json_object'},
              messages: [
                {role: 'system', content: system},
                {role: 'user', content: user},
              ],
            }),
          },
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return parseJsonText(data.choices?.[0]?.message?.content)
      }),
    )
  }

  return Promise.all(tasks)
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, {error: 'POST required'})
  if (!rateLimit(event))
    return json(429, {error: 'Too many reads. Try again later.'})

  let input
  try {
    input = normalizeInput(JSON.parse(event.body || '{}'))
  } catch {
    return json(400, {error: 'Invalid JSON'})
  }

  if (!input.title) return json(400, {error: 'A headline is required'})

  const system =
    'You are one independent analytical intelligence evaluating only headline framing. Do not verify the underlying facts or add facts. Return JSON only with score (0 low framing/spin to 100 maximal framing/spin) and read (one concise sentence naming a specific signal).'
  const user = `Source: ${input.source || 'unknown'}\nHeadline: ${input.title}\nContext: ${input.description}`
  const responses = await readWithMinds(system, user)
  const models = responses
    .filter(result => result.ok)
    .map(result => ({
      model: result.model,
      score: Number(result.data.score),
      read: String(result.data.read || '').slice(0, 500),
    }))
    .filter(result => Number.isFinite(result.score))
  const output = models.length
    ? models
    : DEMO_READS.map(([model, score, read]) => ({model, score, read}))
  const scores = output.map(result => result.score)

  return json(200, {
    demo: !models.length,
    models: output,
    spread: Math.max(...scores) - Math.min(...scores),
    failures: responses
      .filter(result => !result.ok)
      .map(result => result.model),
  })
}
