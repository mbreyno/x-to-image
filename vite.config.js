import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// ── Shared helpers (mirrors netlify/functions/photo-proxy.js) ─────────────────

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

// Returns an array of up to 5 unique keywords, priority-ordered
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

// apiKey is passed in explicitly so it works when loaded from .env via loadEnv()
// Returns an array of 3–5 keywords, or null on failure
async function claudeKeywords(text, apiKey) {
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
  } catch { return null }
}

async function fetchImageAsBase64(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) return null
    const buffer = await res.arrayBuffer()
    return { base64: Buffer.from(buffer).toString('base64'), contentType }
  } catch { clearTimeout(timer); return null }
}

async function photoFromOpenverse(query) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    // Note: no license_type filter — it was cutting results to near-zero
    const apiRes = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=20`,
      { headers: { 'User-Agent': 'x-to-image/1.0', 'Accept': 'application/json' }, signal: controller.signal }
    )
    clearTimeout(timer)
    if (!apiRes.ok) return null
    const data = await apiRes.json()
    const results = (data.results || []).filter(r => r.url).sort(() => Math.random() - 0.5)
    for (const pick of results.slice(0, 3)) {
      const img = await fetchImageAsBase64(pick.url)
      if (img) return img
    }
    return null
  } catch { return null }
}

// ── Photo dev-proxy plugin ────────────────────────────────────────────────────

function photoDevProxy(anthropicApiKey) {
  return {
    name: 'photo-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/photo-api', async (req, res) => {
        const urlObj     = new URL(`http://localhost${req.url}`)
        const queryParam = (urlObj.searchParams.get('query') || '').trim()
        const textParam  = (urlObj.searchParams.get('text')  || '').trim()
        const t          = urlObj.searchParams.get('t') || Date.now()

        const sendJson = (statusCode, obj) => {
          res.statusCode = statusCode
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(obj))
        }

        let query = queryParam
        let keywordList = null

        if (!query && textParam) {
          keywordList = (await claudeKeywords(textParam, anthropicApiKey)) || heuristicKeywords(textParam)
          query = keywordList[0]
          console.log(`[photo-dev] keyword list: ${JSON.stringify(keywordList)}`)
        }
        if (!query) query = 'abstract'

        const extra = keywordList ? { keywordList } : {}

        const img1 = await photoFromOpenverse(query)
        if (img1) { sendJson(200, { dataUrl: `data:${img1.contentType};base64,${img1.base64}`, keywords: query, ...extra }); return }

        const url2 = `https://picsum.photos/seed/${encodeURIComponent(query + '-' + t)}/1080/1080`
        const img2 = await fetchImageAsBase64(url2)
        if (img2) { sendJson(200, { dataUrl: `data:${img2.contentType};base64,${img2.base64}`, keywords: query, ...extra }); return }

        sendJson(502, { error: 'Could not load a photo from any source. Please try again.' })
      })
    },
  }
}

// ── Vite config ───────────────────────────────────────────────────────────────
// Use the function form so loadEnv runs before any plugin code executes,
// ensuring ANTHROPIC_API_KEY from .env is available to the dev proxy.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')   // loads .env, .env.local, etc.
  const anthropicApiKey = env.ANTHROPIC_API_KEY || ''

  if (anthropicApiKey) {
    console.log('[photo-dev] Claude keyword extraction enabled ✓')
  } else {
    console.log('[photo-dev] No ANTHROPIC_API_KEY found — using heuristic keyword extraction')
  }

  return {
    plugins: [react(), photoDevProxy(anthropicApiKey)],
    server: {
      proxy: {
        '/twitter-api': {
          target: 'https://api.twitter.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/twitter-api/, ''),
        },
        '/syndication-api': {
          target: 'https://cdn.syndication.twimg.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/syndication-api/, ''),
        },
      },
    },
  }
})
