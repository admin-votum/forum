const ALLOWED_HANDLE = /^[a-z0-9_]{3,32}$/

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return json(204, {})

  // This function is intentionally inert unless the local dev server opts in.
  if (process.env.FORUM_DEV_LOGIN !== 'true') {
    return json(404, {error: 'Local handle login is disabled'})
  }

  if (event.httpMethod !== 'POST') return json(405, {error: 'POST required'})

  let handle = ''
  try {
    handle = String(JSON.parse(event.body || '{}').handle || '')
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
  } catch {
    return json(400, {error: 'Invalid JSON'})
  }

  if (!ALLOWED_HANDLE.test(handle)) {
    return json(400, {error: 'Enter a valid forum handle'})
  }

  const password = process.env.FORUM_TEST_PASSWORD
  if (!password) return json(503, {error: 'Local test password is not configured'})

  try {
    const response = await fetch('https://votum.ink/.netlify/functions/frm-auth-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:19010',
      },
      body: JSON.stringify({
        email: `roma.atlass+${handle}@gmail.com`,
        password,
      }),
    })
    const body = await response.json().catch(() => ({}))
    return json(response.status, body)
  } catch (error) {
    return json(502, {error: error.message || 'Local handle login unavailable'})
  }
}
