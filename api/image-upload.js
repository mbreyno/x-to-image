// Receives a base64 image from the client, uploads it to imgbb,
// and returns the public URL so it can be attached to a Buffer post.
//
// Requires IMGBB_API_KEY environment variable.
// Free API key: https://api.imgbb.com  (no credit card required)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'IMGBB_API_KEY is not configured on the server.' })
  }

  try {
    // Vercel auto-parses JSON request bodies
    const { imageData } = req.body
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')

    const form = new URLSearchParams()
    form.append('key', apiKey)
    form.append('image', base64)

    const upstream = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })

    if (!upstream.ok) {
      const text = await upstream.text()
      console.error('[image-upload] imgbb error:', text)
      return res.status(502).json({ error: 'Image host returned an error.' })
    }

    const data = await upstream.json()
    if (!data?.data?.url) {
      return res.status(502).json({ error: 'No URL returned from image host.' })
    }

    return res.status(200).json({ url: data.data.url })
  } catch (err) {
    console.error('[image-upload] error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
