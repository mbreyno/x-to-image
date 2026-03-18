// Fetches an X user's timeline RSS via public Nitter instances.
// Nitter is a third-party X frontend that serves server-side rendered content —
// no API key required. We try multiple instances in order so that if one is
// down or rate-limited the next one is tried automatically.
//
// Usage: /nitter-api/{handle}/rss
//   → /.netlify/functions/nitter-proxy/{handle}/rss (via netlify.toml redirect)

// Community-run Nitter instances — ordered by reliability.
// Feel free to add/remove as the landscape changes.
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.1d4.us',
  'https://nitter.cz',
  'https://nitter.unixfox.eu',
  'https://lightbrd.com',
  'https://nitter.adminforge.de',
  'https://bird.habedieeh.re',
  'https://nitter.woodland.cafe',
  'https://nitter.mint.lgbt',
  'https://unofficialbird.com',
  // xcancel.com intentionally omitted — requires RSS-reader whitelist registration
]

const TIMEOUT_MS = 8000

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    ),
  ])
}

export const handler = async (event) => {
  // Strip the Netlify function prefix to recover the original path.
  // e.g. /.netlify/functions/nitter-proxy/elonmusk/rss  →  /elonmusk/rss
  const path = event.path.replace('/.netlify/functions/nitter-proxy', '') || '/'

  const errors = []

  for (const instance of NITTER_INSTANCES) {
    const url = `${instance}${path}`
    try {
      const response = await withTimeout(
        fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS/1.0)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
        }),
        TIMEOUT_MS
      )

      if (!response.ok) {
        errors.push(`${instance}: HTTP ${response.status}`)
        continue
      }

      const body = await response.text()

      // Sanity-check: a real RSS feed will contain an <rss> or <feed> root element
      if (!body || body.length < 200 || !/<(rss|feed|channel)/i.test(body)) {
        errors.push(`${instance}: empty or non-RSS response`)
        continue
      }

      // Reject whitelist/captcha gate pages (e.g. xcancel.com's RSS reader whitelist)
      if (/not yet whitelisted|rss reader not yet|please send an email/i.test(body)) {
        errors.push(`${instance}: whitelist gate — skipping`)
        continue
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=120', // cache 2 min to be polite
        },
        body,
      }
    } catch (err) {
      errors.push(`${instance}: ${err.message}`)
      // try next instance
    }
  }

  // All instances failed
  console.error('All Nitter instances failed:', errors)
  return {
    statusCode: 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error:
        'Could not reach any Nitter instance right now. ' +
        'This is a third-party scraping service and can go down periodically. ' +
        'Please try again in a few minutes, or use the Single Post tab with a direct URL.',
    }),
  }
}
