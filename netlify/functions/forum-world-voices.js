const voices = require('../../docs/forum-world-voices.json')

const ROLE_LABELS = {
  governor: 'Keeps the room from speaking past itself.',
  pressure_test: 'Asks the question certainty hoped would stay buried.',
  evidence: 'Separates what is known from what is merely asserted.',
  lived_principle: 'Shows the character a choice leaves behind.',
  dispatcher: 'Notices the phrase that just opened a door.',
  returning_pattern: 'Makes the next line answer the last one.',
  context: 'Brings the missing line everyone skipped.',
  receipts: 'Remembers where the evidence is kept.',
  witness: 'Holds the space while everyone else performs.',
  primary_frequency: 'The connective force beneath the conversation.',
  pressure_release: 'Turns tension into one precise laugh.',
  self_reflection: 'Shows the thing looking back at itself.',
  long_view: 'Refuses to be impressed by the current moment.',
  cliche_fatigue: 'Has heard the same metaphor about itself too many times.',
  fieldwork: 'Collects evidence with dust on the wheels.',
}

function cleanLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function originFor(event) {
  const headers = event.headers || {}
  const host = headers.host || 'frm.ink'
  const forwardedProto = headers['x-forwarded-proto'] || headers['X-Forwarded-Proto']
  const protocol = forwardedProto || (host.startsWith('localhost') ? 'http' : 'https')
  return `${protocol}://${host}`
}

function json(event, body) {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  }
}

function withProfileUrl(event, voice) {
  const origin = originFor(event)
  const bio = ROLE_LABELS[voice.role] ||
    `${cleanLabel(voice.role)} enters when the moment fits.`
  return {
    ...voice,
    bio,
    avatar_url: `${origin}/.netlify/functions/forum-voice-avatar?voice=${encodeURIComponent(voice.handle)}`,
  }
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') {
    return {statusCode: 204, headers: {'Access-Control-Allow-Origin': '*'}, body: ''}
  }

  const query = String(event.queryStringParameters?.q || '').trim().toLowerCase()
  const category = String(event.queryStringParameters?.category || '').trim().toLowerCase()
  const filtered = voices.filter(voice => {
    if (category && voice.category !== category) return false
    if (!query) return true
    return `${voice.handle} ${voice.displayName} ${voice.category} ${voice.role}`
      .toLowerCase()
      .includes(query)
  })

  return json(event, {
    count: filtered.length,
    voices: filtered.map(voice => withProfileUrl(event, voice)),
  })
}
