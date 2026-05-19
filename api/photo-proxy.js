// Fetches a topic-relevant stock photo and returns it as a base64 data URL.
//
// Query params:
//   query  – explicit keyword string typed by the user (takes priority)
//   text   – raw post text; server will extract keywords from it if query is blank
//   t      – timestamp for cache-busting
//
// Keyword extraction strategy (when `query` is blank and `text` is provided):
//   1. Claude Haiku API — understands topic context (requires ANTHROPIC_API_KEY env var)
//   2. Heuristic fallback — prioritises hashtags → proper nouns → content words
//
// Photo source:
//   Pexels (api.pexels.com) — high-quality curated stock photos, no attribution required

// ── Keyword extraction ────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','have','has','had','do','does',
  'did','will','would','could','should','may','might','can','it','its','this',
  'that','i','we','you','he','she','they','my','your','our','their','me','him',
  'her','us','them','not','no','so','if','as','up','out','about','just','also',
  'very','more','some','all','what','when','how','who','which','there','then',
  'than','into','over','after','before','here','get','got','been','much','many',
  'like','know','think','want','need','good','make','time','new','now','re',
  'day','say','said','look','come','going','yeah','okay','yes','oh',
  'great','real','people','things','thing','right','still','even','back',
  'well','really','actually','literally','basically',
])

function heuristicKeywords(text) {
  if (!text || !text.trim()) return ['abstract']
  const hashtags = [...text.matchAll(/#(\w{2,})/g)]
    .map(m => m[1].toLowerCase()).filter(w => !STOP_WORDS.has(w))
  const stripped = text.replace(/https?:\/\/\S+/g, ' ').replace(/#\w+/g, ' ')
  const properNouns = [...stripped.matchAll(/\b([A-Z][a-z]{2,}|[A-Z]{2,})\b/g)]
    .map(m => m[1].toLowerCase()).filter(w => !STOP_WORDS.has(w) && w.length > 1)
  const contentWords = stripped.replace(/[^a-zA-Z\s]/g, ' ').toLowerCase()
    .split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w))
  const seen = new Set(); const result = []
  for (const w of [...hashtags, ...properNouns, ...contentWords]) {
    if (w && !seen.has(w) && result.length < 5) { seen.add(w); result.push(w) }
  }
  return result.length > 0 ? result : ['abstract']
}

async function claudeKeywords(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 40,
        messages: [{
          role: 'user',
          content: `Given this social media post, reply with 3 to 5 distinct single words that could each independently work as a stock photo search term representing the post's topic. Words should be concrete and visual (e.g. "money", "coding", "fitness", "teamwork"). Reply with ONLY the words separated by spaces, nothing else.\n\nPost: ${text}`,
        }],
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    const words = (data.content?.[0]?.text?.trim() || '')
      .split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(Boolean)
    return words.length > 0 ? words.slice(0, 5) : null
  } catch (err) {
    console.error(`[photo-proxy] Claude keyword extraction failed: ${err.message}`)
    return null
  }
}

// ── Photo fetching ────────────────────────────────────────────────────────────

async function fetchImageAsBase64(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null
    const buffer = await res.arrayBuffer()
    return { base64: Buffer.from(buffer).toString('base64'), contentType }
  } catch {
    clearTimeout(timer)
    return null
  }
}

async function photoFromPexels(query) {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    const apiRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=square`,
      {
        headers: { Authorization: apiKey },
        signal: controller.signal,
      }
    )
    clearTimeout(timer)
    if (!apiRes.ok) return null
    const data = await apiRes.json()
    const results = (data.photos || []).filter(p => p.src?.large2x || p.src?.large)
    // Shuffle so repeated calls with the same keyword yield variety
    results.sort(() => Math.random() - 0.5)
    for (const pick of results.slice(0, 5)) {
      const imgUrl = pick.src.large2x || pick.src.large
      const img = await fetchImageAsBase64(imgUrl)
      if (img) return img
    }
    return null
  } catch (err) {
    console.error(`[photo-proxy] Pexels failed: ${err.message}`)
    return null
  }
}

// ── Vercel handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store')

  const queryParam = (req.query.query || '').trim()
  const textParam  = (req.query.text  || '').trim()

  let query = queryParam
  let keywordList = null

  if (!query && textParam) {
    keywordList = (await claudeKeywords(textParam)) || heuristicKeywords(textParam)
    query = keywordList[0]
    console.log(`[photo-proxy] Keyword list: ${JSON.stringify(keywordList)}`)
  }
  if (!query) query = 'abstract'

  const img = await photoFromPexels(query)
  if (img) {
    return res.status(200).json({
      dataUrl: `data:${img.contentType};base64,${img.base64}`,
      keywords: query,
      ...(keywordList ? { keywordList } : {}),
    })
  }

  return res.status(502).json({ error: 'Could not load a photo. Check your PEXELS_API_KEY or try different keywords.' })
}
