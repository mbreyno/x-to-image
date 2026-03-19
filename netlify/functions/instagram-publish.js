// ── Instagram Graph API — Content Publishing ──────────────────────────────────
//
// Required env vars (set in Netlify dashboard → Environment variables):
//   INSTAGRAM_USER_ID      – your Instagram Business/Creator user ID
//   INSTAGRAM_ACCESS_TOKEN – a long-lived access token with instagram_content_publish scope
//   IMGBB_API_KEY          – used to host the image at a public URL Instagram can fetch
//
// Your Instagram account MUST be a Professional account (Business or Creator)
// connected to a Facebook Page and linked to a Meta App that has been granted
// the instagram_content_publish permission.
//
// How to get your credentials:
//   1. Go to developers.facebook.com → create an app → add "Instagram Graph API"
//   2. Open Graph API Explorer, select your app, add permission
//      "instagram_content_publish", generate a User Access Token
//   3. Exchange it for a long-lived token:
//      GET https://graph.facebook.com/oauth/access_token
//        ?grant_type=fb_exchange_token
//        &client_id={app_id}&client_secret={app_secret}
//        &fb_exchange_token={short_lived_token}
//   4. Get your Instagram user ID:
//      GET https://graph.facebook.com/me/accounts (pick the Page)
//      GET https://graph.facebook.com/{page_id}?fields=instagram_business_account
// ─────────────────────────────────────────────────────────────────────────────

const GRAPH_API = 'https://graph.facebook.com/v21.0'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
    }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const sendJson = (statusCode, obj) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj),
  })

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId      = process.env.INSTAGRAM_USER_ID
  const imgbbKey    = process.env.IMGBB_API_KEY

  if (!accessToken || !userId) {
    return sendJson(503, {
      error: 'Instagram not configured',
      detail: 'Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID to your Netlify environment variables. See the function comments for setup instructions.',
    })
  }
  if (!imgbbKey) {
    return sendJson(503, { error: 'IMGBB_API_KEY not set — needed to host the image for Instagram' })
  }

  let imageData, caption
  try {
    ;({ imageData, caption } = JSON.parse(event.body))
  } catch {
    return sendJson(400, { error: 'Invalid JSON body' })
  }

  // ── Step 1: upload image to imgbb for a public HTTPS URL ──────────────────
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, '')
  const form   = new URLSearchParams()
  form.append('key', imgbbKey)
  form.append('image', base64)

  let imageUrl
  try {
    const imgbbRes  = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const imgbbData = await imgbbRes.json()
    imageUrl = imgbbData?.data?.url
    if (!imageUrl) throw new Error(imgbbData?.error?.message || 'No URL returned from imgbb')
  } catch (err) {
    return sendJson(502, { error: `Image hosting failed: ${err.message}` })
  }

  // ── Step 2: create Instagram media container ──────────────────────────────
  // Instagram captions are capped at 2200 characters
  const safeCaption = (caption || '').slice(0, 2200)

  let creationId
  try {
    const containerRes  = await fetch(`${GRAPH_API}/${userId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption: safeCaption, access_token: accessToken }),
    })
    const containerData = await containerRes.json()
    if (containerData.error) throw new Error(containerData.error.message)
    creationId = containerData.id
    if (!creationId) throw new Error('No creation_id returned')
  } catch (err) {
    return sendJson(400, { error: `Failed to create media container: ${err.message}` })
  }

  // ── Step 3: publish the container ────────────────────────────────────────
  try {
    const publishRes  = await fetch(`${GRAPH_API}/${userId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
    })
    const publishData = await publishRes.json()
    if (publishData.error) throw new Error(publishData.error.message)
    if (!publishData.id) throw new Error('No media ID returned from publish')

    return sendJson(200, { success: true, mediaId: publishData.id })
  } catch (err) {
    return sendJson(400, { error: `Failed to publish: ${err.message}` })
  }
}
