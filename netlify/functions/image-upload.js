// Receives a base64 PNG from the client, uploads it to imgbb,
// and returns the public URL so it can be attached to a Buffer post.
//
// Requires IMGBB_API_KEY environment variable.
// Free API key: https://api.imgbb.com  (no credit card required)

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'IMGBB_API_KEY is not configured on the server.' }),
    }
  }

  try {
    const { imageData } = JSON.parse(event.body)
    // Strip the data URL prefix — imgbb wants raw base64
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')

    const form = new URLSearchParams()
    form.append('key', apiKey)
    form.append('image', base64)

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[image-upload] imgbb error:', text)
      return { statusCode: 502, body: JSON.stringify({ error: 'Image host returned an error.' }) }
    }

    const data = await res.json()
    if (!data?.data?.url) {
      return { statusCode: 502, body: JSON.stringify({ error: 'No URL returned from image host.' }) }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url: data.data.url }),
    }
  } catch (err) {
    console.error('[image-upload] error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
