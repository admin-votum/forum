// Forum's direct RSS bridge.
//
// This endpoint intentionally reads publisher RSS feeds directly. It does not
// consume Votum, deFramed, or another app's generated feed.

const UNIVERSE_SOURCES = [
  {url: 'https://www.nasa.gov/feed/', source: 'NASA'},
  {url: 'https://www.esa.int/rssfeed/Our_Activities/Space_News', source: 'ESA'},
  {url: 'https://www.space.com/feeds/all', source: 'Space.com'},
  {url: 'https://phys.org/rss-feed/', source: 'Phys.org'},
  {url: 'https://www.sciencedaily.com/rss/all.xml', source: 'ScienceDaily'},
  {url: 'https://www.nature.com/nature.rss', source: 'Nature'},
  {url: 'https://www.quantamagazine.org/feed/', source: 'Quanta'},
  {url: 'https://www.newscientist.com/feed/home/', source: 'New Scientist'},
  {url: 'https://www.livescience.com/feeds/all', source: 'Live Science'},
  {
    url: 'https://www.smithsonianmag.com/rss/latest_articles/',
    source: 'Smithsonian',
  },
  {url: 'https://www.atlasobscura.com/feeds/latest', source: 'Atlas Obscura'},
  {
    url: 'https://feeds.arstechnica.com/arstechnica/science',
    source: 'Ars Technica',
  },
  {url: 'https://news.mit.edu/rss/research', source: 'MIT News'},
]

const POLITICS_SOURCES = [
  {url: 'https://feeds.reuters.com/reuters/topNews', source: 'Reuters'},
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    source: 'NYT',
  },
  {url: 'http://feeds.bbci.co.uk/news/rss.xml', source: 'BBC News'},
  {
    url: 'https://feeds.washingtonpost.com/rss/world',
    source: 'Washington Post',
  },
  {url: 'https://feeds.skynews.com/feeds/rss/world.xml', source: 'Sky News'},
  {url: 'https://feeds.feedburner.com/breitbart', source: 'Breitbart'},
  {url: 'https://theintercept.com/feed/?rss', source: 'The Intercept'},
  {url: 'https://rss.politico.com/politics-news.xml', source: 'Politico'},
  {url: 'https://feeds.foxnews.com/foxnews/politics', source: 'Fox News'},
  {url: 'https://www.theguardian.com/world/rss', source: 'The Guardian'},
]

const STREAMS = {
  universe: UNIVERSE_SOURCES,
  politics: POLITICS_SOURCES,
}

// Temporary static conversation rooms for Forum testing. The query parameter
// gives this phase its own comment namespace, while the RSS path remains ready
// to restore when the conversation test is finished.
const STATIC_TEST_ARTICLES = [
  {
    id: 'https://www.newscientist.com/article/2583296-could-geoengineering-ice-arches-help-preserve-arctic-sea-ice/?frm_test=forum-council',
    headline: 'Could geoengineering ‘ice arches’ help preserve Arctic sea ice?',
    url: 'https://www.newscientist.com/article/2583296-could-geoengineering-ice-arches-help-preserve-arctic-sea-ice/?frm_test=forum-council',
    source: 'New Scientist',
    category: 'universe',
    image: 'https://www.newscientist.com/wp-content/uploads/2026/08/SEI_307431927.jpg',
    publishedAt: '2026-08-07T11:00:00.000Z',
  },
  {
    id: 'https://www.sciencedaily.com/releases/2026/08/260806050713.htm?frm_test=forum-council',
    headline: 'Earth’s molten core suddenly reversed direction — and scientists don’t know why',
    url: 'https://www.sciencedaily.com/releases/2026/08/260806050713.htm?frm_test=forum-council',
    source: 'ScienceDaily',
    category: 'universe',
    image: 'https://www.sciencedaily.com/images/1920/earths-stormy-heart.webp',
    publishedAt: '2026-08-07T10:24:52.000Z',
  },
  {
    id: 'https://www.livescience.com/space/space-exploration/nasa-grants-voyager-2-probe-another-year-of-power-with-risky-big-bang-maneuver-now-will-it-work-for-voyager-1?frm_test=forum-council',
    headline: 'NASA grants Voyager 2 probe another year of power with risky ‘Big Bang’ maneuver',
    url: 'https://www.livescience.com/space/space-exploration/nasa-grants-voyager-2-probe-another-year-of-power-with-risky-big-bang-maneuver-now-will-it-work-for-voyager-1?frm_test=forum-council',
    source: 'Live Science',
    category: 'universe',
    image: 'https://cdn.mos.cms.futurecdn.net/UbGVdsGpa7MfEzeSc6yadJ-1280-80.jpg',
    publishedAt: '2026-08-07T10:00:00.000Z',
  },
  {
    id: 'https://phys.org/news/2026-08-microbreaks-key-boosting-energy.html?frm_test=forum-council',
    headline: 'Microbreaks key to boosting energy and motivation at work, study finds',
    url: 'https://phys.org/news/2026-08-microbreaks-key-boosting-energy.html?frm_test=forum-council',
    source: 'Phys.org',
    category: 'universe',
    image: 'https://scx1.b-cdn.net/csz/news/tmb/2026/office-breaks.jpg',
    publishedAt: '2026-08-07T11:40:01.000Z',
  },
  {
    id: 'https://science.nasa.gov/image-article/apod/apod-2026-august-10-three-galaxy-pairs/?frm_test=forum-council',
    headline: 'APOD: 2026 August 10 – Three Galaxy Pairs',
    url: 'https://science.nasa.gov/image-article/apod/apod-2026-august-10-three-galaxy-pairs/?frm_test=forum-council',
    source: 'NASA',
    category: 'universe',
    image: 'https://assets.science.nasa.gov/content/dam/science/cds/apod/apod/2026/august/Three3GalaxyPairs_Sampaio_2784.jpg/jcr:content/renditions/cq5dam.web.1280.1280.jpeg',
    publishedAt: '2026-08-10T04:05:00.000Z',
  },
  {
    id: 'https://phys.org/news/2026-08-urban-canals-temperatures-2c.html?frm_test=forum-council',
    headline: 'Urban canals can cut temperatures by more than 2°C during heat waves',
    url: 'https://phys.org/news/2026-08-urban-canals-temperatures-2c.html?frm_test=forum-council',
    source: 'Phys.org',
    category: 'universe',
    image: 'https://scx2.b-cdn.net/gfx/news/hires/2026/urban-canals-can-cut-t.jpg',
    publishedAt: '2026-08-10T08:40:04.000Z',
  },
  {
    id: 'https://www.sciencedaily.com/releases/2026/08/260808235013.htm?frm_test=forum-council',
    headline: '60,000-year-old ostrich eggshell engravings reveal a surprisingly sophisticated human mind',
    url: 'https://www.sciencedaily.com/releases/2026/08/260808235013.htm?frm_test=forum-council',
    source: 'ScienceDaily',
    category: 'universe',
    image: 'https://www.sciencedaily.com/images/1920/engraved-fragments-of-ostrich-eggshell.webp',
    publishedAt: '2026-08-09T07:51:37.000Z',
  },
  {
    id: 'https://www.quantamagazine.org/neutrinos-from-deep-inside-earth-provide-a-new-picture-of-the-mantle-20260807/?frm_test=forum-council',
    headline: 'Neutrinos From Deep Inside Earth Provide a New Picture of the Mantle',
    url: 'https://www.quantamagazine.org/neutrinos-from-deep-inside-earth-provide-a-new-picture-of-the-mantle-20260807/?frm_test=forum-council',
    source: 'Quanta',
    category: 'universe',
    image: 'https://www.quantamagazine.org/wp-content/uploads/2026/08/Central-acrylic-sphere-and-PMTs-cr-JUNO-Collaboration-Social.jpg',
    publishedAt: '2026-08-07T13:55:32.000Z',
  },
  {
    id: 'https://www.newscientist.com/article/2583902-earth-extremophile-can-grow-in-near-mars-like-conditions/?frm_test=forum-council',
    headline: 'Earth extremophile can grow in near-Mars-like conditions',
    url: 'https://www.newscientist.com/article/2583902-earth-extremophile-can-grow-in-near-mars-like-conditions/?frm_test=forum-council',
    source: 'New Scientist',
    category: 'universe',
    image: 'https://www.newscientist.com/wp-content/uploads/2026/08/SEI_307885345.jpg',
    publishedAt: '2026-08-10T13:00:00.000Z',
  },
  {
    id: 'https://www.livescience.com/space/astronomy/will-you-be-looking-up-on-aug-12-the-best-skywatching-day-and-night-of-the-year?frm_test=forum-council',
    headline: 'Will you be looking up on Aug. 12, the best skywatching day and night of the year?',
    url: 'https://www.livescience.com/space/astronomy/will-you-be-looking-up-on-aug-12-the-best-skywatching-day-and-night-of-the-year?frm_test=forum-council',
    source: 'Live Science',
    category: 'universe',
    image: 'https://cdn.mos.cms.futurecdn.net/E9uYxMste2hVMwcKRTd5k3-1280-80.png',
    publishedAt: '2026-08-10T11:00:00.000Z',
  },
  {
    id: 'https://www.smithsonianmag.com/smart-news/a-spacex-rocket-part-just-slammed-into-the-moon-creating-a-dust-plume-and-crater-heres-what-some-scientific-instruments-saw-180989299/?frm_test=forum-council',
    headline: 'A SpaceX Rocket Part Just Slammed Into the Moon, Creating a Dust Plume and Crater',
    url: 'https://www.smithsonianmag.com/smart-news/a-spacex-rocket-part-just-slammed-into-the-moon-creating-a-dust-plume-and-crater-heres-what-some-scientific-instruments-saw-180989299/?frm_test=forum-council',
    source: 'Smithsonian',
    category: 'universe',
    image: 'https://watchthestars.co.uk/images/blog/moon-impact-ejecta-plume.webp',
    publishedAt: '2026-08-07T21:26:02.000Z',
  },
  {
    id: 'https://arstechnica.com/science/2026/08/peer-review-is-overwhelmed-can-it-survive-in-the-ai-era/?frm_test=forum-council',
    headline: 'Peer review is overwhelmed—can it survive in the AI era?',
    url: 'https://arstechnica.com/science/2026/08/peer-review-is-overwhelmed-can-it-survive-in-the-ai-era/?frm_test=forum-council',
    source: 'Ars Technica',
    category: 'universe',
    image: 'https://cdn.arstechnica.net/wp-content/uploads/2026/08/peer-review-difficulties-1152x648.jpg',
    publishedAt: '2026-08-10T11:00:47.000Z',
  },
  {
    id: 'https://news.mit.edu/2026/mit-researchers-tackle-economic-realities-fusion-power-0810?frm_test=forum-council',
    headline: 'MIT researchers tackle the economic realities of fusion power',
    url: 'https://news.mit.edu/2026/mit-researchers-tackle-economic-realities-fusion-power-0810?frm_test=forum-council',
    source: 'MIT News',
    category: 'universe',
    image: 'https://news.mit.edu/sites/default/files/styles/news_article__cover_image__original/public/images/202608/MIT-FusionEconomics-01-press_1.jpg?itok=tXuhPoKt',
    publishedAt: '2026-08-10T04:00:00.000Z',
  },
  {
    id: 'https://www.nature.com/articles/d41586-026-02276-z?frm_test=forum-council',
    headline: 'This AI tool claims to pick the top 1% of preprints. Should researchers trust it?',
    url: 'https://www.nature.com/articles/d41586-026-02276-z?frm_test=forum-council',
    source: 'Nature',
    category: 'universe',
    image: 'https://media.nature.com/lw1200/magazine-assets/d41586-026-02276-z/d41586-026-02276-z_53008026.jpg',
    publishedAt: '2026-08-08T09:00:00.000Z',
  },
  {
    id: 'https://science.nasa.gov/image-article/apod/apod-2026-august-11-six-moons-of-saturn/?frm_test=forum-council',
    headline: 'APOD: 2026 August 11 – Six Moons of Saturn',
    url: 'https://science.nasa.gov/image-article/apod/apod-2026-august-11-six-moons-of-saturn/?frm_test=forum-council',
    source: 'NASA',
    category: 'universe',
    image: 'https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/2026/august/2026-08-05-0609_7-SaturnSystem_c.jpg?w=1000&h=896&fit=clip&crop=faces%2Cfocalpoint',
    publishedAt: '2026-08-11T04:05:00.000Z',
  },
  {
    id: 'https://news.mit.edu/2026/hunt-dark-matter-jessica-fry-0811?frm_test=forum-council',
    headline: 'On the hunt for dark matter',
    url: 'https://news.mit.edu/2026/hunt-dark-matter-jessica-fry-0811?frm_test=forum-council',
    source: 'MIT News',
    category: 'universe',
    image: 'https://news.mit.edu/sites/default/files/styles/news_article__cover_image__original/public/images/202607/mit-lns-Jessica_Fry.JPG?itok=U1j9SKGY',
    publishedAt: '2026-08-11T04:00:00.000Z',
  },
  {
    id: 'https://www.quantamagazine.org/why-are-rivers-so-mathematical-20260810/?frm_test=forum-council',
    headline: 'Why Are Rivers So Mathematical?',
    url: 'https://www.quantamagazine.org/why-are-rivers-so-mathematical-20260810/?frm_test=forum-council',
    source: 'Quanta',
    category: 'universe',
    image: 'https://www.quantamagazine.org/wp-content/uploads/2026/08/Qualia-River-Fractals-cr-Ada-Zejun-Shen-Social.jpg',
    publishedAt: '2026-08-10T14:56:34.000Z',
  },
  {
    id: 'https://www.livescience.com/archaeology/2-400-year-old-grave-of-possible-ancient-pro-wrestler-discovered-in-turkey?frm_test=forum-council',
    headline: '2,400-year-old grave of possible ancient pro wrestler discovered in Turkey',
    url: 'https://www.livescience.com/archaeology/2-400-year-old-grave-of-possible-ancient-pro-wrestler-discovered-in-turkey?frm_test=forum-council',
    source: 'Live Science',
    category: 'universe',
    image: 'https://cdn.mos.cms.futurecdn.net/VRknRmB9MVJA5yRuQsX5gZ-1280-80.png',
    publishedAt: '2026-08-10T20:07:51.000Z',
  },
  {
    id: 'https://www.smithsonianmag.com/smart-news/off-the-coast-of-sicily-divers-discovered-a-roman-era-shipwreck-with-hundreds-of-amphorae-ancient-jars-frequently-used-to-hold-wine-180989307/?frm_test=forum-council',
    headline: 'Divers discover a Roman-era shipwreck with hundreds of wine jars',
    url: 'https://www.smithsonianmag.com/smart-news/off-the-coast-of-sicily-divers-discovered-a-roman-era-shipwreck-with-hundreds-of-amphorae-ancient-jars-frequently-used-to-hold-wine-180989307/?frm_test=forum-council',
    source: 'Smithsonian',
    category: 'universe',
    image: 'https://tf-cmsv2-smithsonianmag-media.s3.amazonaws.com/filer_public/30/57/30579555-8228-49cb-9c4a-3f48317255e5/amphorae_wall.jpg',
    publishedAt: '2026-08-10T21:53:11.000Z',
  },
]

// Keep the live test intentionally small while the casting engine is tuned.
// The larger catalog remains in the file so it can be restored without
// touching the article/comment implementation later.
const VISIBLE_STATIC_TEST_ARTICLES = STATIC_TEST_ARTICLES.slice(0, 5)

function cleanHtml(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#160;|&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readTag(block, tag) {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  )
  return cleanHtml(match?.[1] || '')
}

function readLink(block) {
  return (
    readTag(block, 'link') ||
    block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ||
    ''
  )
}

function readImage(block) {
  const image =
    block.match(
      /<media:(?:content|thumbnail)\b[^>]*url=["']([^"']+)["']/i,
    )?.[1] ||
    block.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i)?.[1] ||
    block.match(/<img\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/i)?.[1] ||
    ''

  try {
    const parsed = new URL(image)
    return parsed.protocol === 'https:' ? parsed.href : ''
  } catch {
    return ''
  }
}

function parseDate(value) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp).toISOString()
}

function parseFeed(xml, source, category) {
  const blocks = [
    ...(String(xml).match(/<item\b[\s\S]*?<\/item>/gi) || []),
    ...(String(xml).match(/<entry\b[\s\S]*?<\/entry>/gi) || []),
  ]

  return blocks
    .map(block => {
      const headline = readTag(block, 'title')
      const url = readLink(block)
      const publishedAt = parseDate(
        readTag(block, 'pubDate') ||
          readTag(block, 'published') ||
          readTag(block, 'updated') ||
          readTag(block, 'dc:date'),
      )

      if (!headline || headline.length < 15 || !/^https?:\/\//i.test(url)) {
        return null
      }

      return {
        id: url,
        headline,
        url,
        source: source.source,
        category,
        image: readImage(block) || undefined,
        publishedAt,
      }
    })
    .filter(Boolean)
    .slice(0, 5)
}

async function fetchSource(source, category) {
  try {
    const response = await fetch(source.url, {
      headers: {
        Accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml',
        'User-Agent': 'ForumRSS/1.0',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return []
    return parseFeed(await response.text(), source, category)
  } catch {
    return []
  }
}

exports.handler = async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  }
  const stream = event.queryStringParameters?.stream || 'universe'
  const sources = STREAMS[stream]

  if (!sources) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({error: 'stream must be universe or politics'}),
    }
  }

  if (stream === 'universe' && process.env.FRM_STATIC_UNIVERSE === 'true') {
    return {
      statusCode: 200,
      headers: {...headers, 'Cache-Control': 'no-store'},
      body: JSON.stringify({
        articles: VISIBLE_STATIC_TEST_ARTICLES,
        count: VISIBLE_STATIC_TEST_ARTICLES.length,
        stream,
        mode: 'static-test',
      }),
    }
  }

  const results = await Promise.all(
    sources.map(source => fetchSource(source, stream)),
  )
  const seen = new Set()
  const articles = results
    .flat()
    .filter(article => {
      const titleKey = article.headline
        .toLowerCase()
        .replace(/\W+/g, ' ')
        .trim()
      if (seen.has(article.url) || seen.has(titleKey)) return false
      seen.add(article.url)
      seen.add(titleKey)
      return true
    })
    .sort(
      (a, b) => Date.parse(b.publishedAt || 0) - Date.parse(a.publishedAt || 0),
    )
    .slice(0, 36)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({articles, count: articles.length, stream}),
  }
}
