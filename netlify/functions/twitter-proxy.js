// Thin proxy that forwards requests to api.twitter.com.
// Needed because browsers block direct cross-origin calls to the X API (CORS).
// The Vite dev server handles this in development; this function handles it in production.

export const handler = async (event) => {
  // Strip the Netlify function prefix to recover the original Twitter API path.
  // e.g. /.netlify/functions/twitter-proxy/2/users/me  →  /2/users/me
  const twitterPath = event.path.replace('/.netlify/functions/twitter-proxy', '')
  const query       = event.rawQuery ? `?${event.rawQuery}` : ''
  const url         = `https://api.twitter.com${twitterPath}${query}`

  const authHeader  = event.headers['authorization'] || event.headers['Authorization'] || ''

  try {
    const response = await fetch(url, {
      method:  event.httpMethod,
      headers: {
        'Authorization': authHeader,
        'Content-Type':  'application/json',
      },
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' ? event.body : undefined,
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
