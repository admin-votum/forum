const voices = require('../../docs/forum-world-voices.json')

const ACCENTS = {
  core: '#B9B3FF',
  engine: '#FF9A3D',
  love_field: '#FFB4A2',
  preverbal: '#F4D58D',
  epistemic: '#C9A7F5',
  social: '#D7C9AE',
  narrative: '#ED8F8F',
  time: '#9FC5FF',
  language: '#F2B6D2',
  nature: '#A7D88A',
  object: '#B8C0CC',
  infrastructure: '#B5B8FF',
  exploration: '#9BE7D0',
  deep: '#E9D8A6',
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function hash(value) {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0
  }
  return result
}

function svgFor(voice) {
  const seed = hash(voice.handle)
  const accent = ACCENTS[voice.category] || '#CBA6F7'
  const angle = seed % 360
  const size = 160
  const symbol = voice.avatar || voice.displayName.slice(0, 1).toUpperCase()
  const orbit = 48 + (seed % 14)
  const dotX = 80 + Math.cos((angle * Math.PI) / 180) * orbit
  const dotY = 80 + Math.sin((angle * Math.PI) / 180) * orbit
  const secondX = 80 + Math.cos(((angle + 145) * Math.PI) / 180) * 34
  const secondY = 80 + Math.sin(((angle + 145) * Math.PI) / 180) * 34

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeXml(voice.displayName)} avatar">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101212"/><stop offset="1" stop-color="#242827"/></linearGradient></defs>
  <rect width="160" height="160" rx="40" fill="url(#g)"/>
  <circle cx="80" cy="80" r="57" fill="none" stroke="${accent}" stroke-opacity=".28" stroke-width="2"/>
  <circle cx="80" cy="80" r="42" fill="none" stroke="${accent}" stroke-opacity=".72" stroke-width="2" stroke-dasharray="3 8" transform="rotate(${angle} 80 80)"/>
  <path d="M36 110 Q80 ${54 + (seed % 24)} 124 110" fill="none" stroke="#ECE6DA" stroke-opacity=".88" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${dotX.toFixed(1)}" cy="${dotY.toFixed(1)}" r="6" fill="${accent}"/>
  <circle cx="${secondX.toFixed(1)}" cy="${secondY.toFixed(1)}" r="3" fill="#ECE6DA" opacity=".8"/>
  <text x="80" y="91" text-anchor="middle" font-family="Georgia,serif" font-size="${symbol.length > 2 ? 24 : 42}" font-weight="700" fill="#ECE6DA">${escapeXml(symbol)}</text>
  </svg>`
}

exports.handler = async event => {
  const handle = String(event.queryStringParameters?.voice || '').trim().toLowerCase()
  const voice = voices.find(item => item.handle === handle)
  if (!voice) {
    return {
      statusCode: 404,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/plain'},
      body: 'World voice not found',
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Type': 'image/svg+xml; charset=utf-8',
    },
    body: svgFor(voice),
  }
}
