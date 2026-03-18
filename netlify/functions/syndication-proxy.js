// Proxies requests to cdn.syndication.twimg.com (Twitter's free public embed API).
// No authentication required — this is the same endpoint used by embedded tweet widgets.

export const handler = async (event) => {
  const syndicationPath = event.path.replace('/.netlify/functions/syndication-proxy', '')
  const query           = event.rawQuery ? `?${event.rawQuery}` : ''
  const url             = `https://cdn.syndication.twimg.com${syndicationPath}${query}`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const body = await response.text()

    return {
      statusCode: response.status,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body,
    }
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy error', detail: err.message }),
    }
  }
}
