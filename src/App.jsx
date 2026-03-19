import { useState, useRef, useCallback, useEffect } from 'react'
import html2canvas from 'html2canvas'

// ─── Icons ───────────────────────────────────────────────────────────────────

const XLogo = ({ size = 20, color = 'currentColor', style = {} }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={style} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const VerifiedBadge = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#1d9bf0" aria-label="Verified account" style={{ flexShrink: 0 }}>
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.88 9.33 2 10.57 2 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.2 3.92-.81s1.26-2.52.8-3.91C21.36 14.67 22.25 13.43 22.25 12zm-6.12-1.26l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06l1.97 1.97 4.97-4.97a.75.75 0 011.06 1.06z" />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
  </svg>
)

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="4" rx="1" />
    <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// Buffer's brand mark — simplified hourglass shape
const BufferIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)


// ─── Data ─────────────────────────────────────────────────────────────────────

const GRADIENTS = [
  { id: 'purple',   name: 'Purple Dream',  bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'ocean',    name: 'Ocean Blue',    bg: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'sunset',   name: 'Sunset',        bg: 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)' },
  { id: 'forest',   name: 'Forest',        bg: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)' },
  { id: 'rose',     name: 'Rose Gold',     bg: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' },
  { id: 'midnight', name: 'Midnight',      bg: 'linear-gradient(135deg, #0F2027 0%, #2C5364 100%)' },
  { id: 'peach',    name: 'Peach',         bg: 'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)' },
  { id: 'electric', name: 'Electric',      bg: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)' },
  { id: 'emerald',  name: 'Emerald',       bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'cosmic',   name: 'Cosmic',        bg: 'linear-gradient(135deg, #FF0099 0%, #493240 100%)' },
  { id: 'ice',      name: 'Ice',           bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 'gold',     name: 'Gold',          bg: 'linear-gradient(135deg, #F7971E 0%, #FFD200 100%)' },
]

const ORIENTATIONS = {
  square:    { w: 420, h: 420, label: '1:1 Square',     exportScale: 2.57 },
  portrait:  { w: 378, h: 472, label: '4:5 Portrait',   exportScale: 2.86 },
  landscape: { w: 504, h: 284, label: '16:9 Landscape', exportScale: 3.81 },
}

const THEMES = {
  dark:  { bg: '#000000', text: '#e7e9ea', sub: '#71767b', border: '#2f3336', name: 'Dark',  icon: '🌙' },
  light: { bg: '#ffffff', text: '#0f1419', sub: '#536471', border: '#eff3f4', name: 'Light', icon: '☀️' },
  dim:   { bg: '#15202b', text: '#f7f9f9', sub: '#8b98a5', border: '#38444d', name: 'Dim',   icon: '🌫️' },
}

const CARD_PADDING = {
  compact:     { px: 20, py: 20, label: 'Compact' },
  comfortable: { px: 28, py: 24, label: 'Comfortable' },
  spacious:    { px: 36, py: 32, label: 'Spacious' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 200
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, 0, 0, size, size)
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error(`Failed to load: ${src}`))
    img.src = src
  })
}

const formatHandle = (h) => {
  if (!h) return '@handle'
  return h.startsWith('@') ? h : `@${h}`
}

// Pull a few meaningful words from post text to use as photo search keywords
// when the user hasn't typed their own.
function extractPostKeywords(text) {
  if (!text || !text.trim()) return 'abstract'

  const stopWords = new Set([
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

  // ── Priority 1: Hashtags ─────────────────────────────────────────────────
  // These are the most explicit topic signals in any post.
  const hashtags = [...text.matchAll(/#(\w{2,})/g)]
    .map(m => m[1].toLowerCase())
    .filter(w => !stopWords.has(w))

  // Strip URLs and hashtags before further analysis
  const stripped = text
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/#\w+/g, ' ')

  // ── Priority 2: Capitalized proper nouns and ALL-CAPS acronyms ───────────
  // e.g. "Tesla", "OpenAI", "NFT", "GPT", "Bitcoin", "JavaScript"
  const properNouns = [...stripped.matchAll(/\b([A-Z][a-z]{2,}|[A-Z]{2,})\b/g)]
    .map(m => m[1].toLowerCase())
    .filter(w => !stopWords.has(w) && w.length > 1)

  // ── Priority 3: Ordinary content words ───────────────────────────────────
  const contentWords = stripped
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w))

  // Combine in priority order, deduplicate, cap at 5 terms
  const seen = new Set()
  const result = []
  for (const w of [...hashtags, ...properNouns, ...contentWords]) {
    if (w && !seen.has(w) && result.length < 5) {
      seen.add(w)
      result.push(w)
    }
  }

  return result.join(' ') || 'abstract'
}

function isXUrl(text) {
  return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/\S+\/status\/\d+/i.test(text.trim())
}

function parseOEmbedHtml(html) {
  const parser = new DOMParser()
  const doc    = parser.parseFromString(html, 'text/html')
  const p      = doc.querySelector('blockquote p')
  if (!p) return ''
  const clone  = p.cloneNode(true)

  clone.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href') || ''
    if (href.includes('t.co') || href.includes('pic.twitter')) a.remove()
  })
  clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
  clone.querySelectorAll('p, div').forEach(el => el.prepend('\n'))

  return clone.textContent
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <div style={{ background: '#111827', borderRadius: 16, padding: 24, border: '1px solid #1f2937' }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f9fafb', marginBottom: 18, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function SegmentControl({ options, value, onChange, fullWidth = true }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            flex: fullWidth ? 1 : 'none',
            padding: '9px 12px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            background: value === opt.value ? '#3b82f6' : '#1f2937',
            color: value === opt.value ? 'white' : '#9ca3af',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer',
          background: checked ? '#3b82f6' : '#374151', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ color: '#9ca3af', fontSize: 14 }}>{label}</span>
    </label>
  )
}

// ─── X Post Card ──────────────────────────────────────────────────────────────

function XPostCard({ cardRef, postText, authorName, authorHandle, profilePhoto, showVerified, theme, orientation, bgStyle, selectedGradient, solidColor, cardPadding, photoBackground }) {
  const t    = THEMES[theme]
  const dims = ORIENTATIONS[orientation]
  const pad  = CARD_PADDING[cardPadding]

  const cardBgStyle = bgStyle === 'photo' && photoBackground
    ? { backgroundImage: `url(${photoBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: bgStyle === 'gradient' ? selectedGradient : solidColor }
  const handle      = formatHandle(authorHandle)
  const displayName = authorName || 'Author Name'
  const initials    = displayName.charAt(0).toUpperCase()

  const textLen  = postText ? postText.length : 60
  const fontScale = Math.min(1, Math.max(0.62, 1 - (textLen - 100) * 0.0013))

  const nameFontSize   = Math.max(13, Math.round(dims.w * 0.036))
  const handleFontSize = Math.max(11, Math.round(dims.w * 0.030))
  const bodyFontSize   = Math.max(11, Math.round(dims.w * 0.040 * fontScale))
  const footerFontSize = Math.max(10, Math.round(dims.w * 0.027))
  const avatarSize     = Math.max(36, Math.round(dims.w * 0.105))
  const xLogoSize      = Math.max(16, Math.round(dims.w * 0.048))
  const verifiedSize   = Math.max(14, Math.round(dims.w * 0.040))

  const innerWidth = dims.w - (pad.px * 2) - 32
  const innerMaxH  = dims.h - (pad.py * 2) - 32

  return (
    <div ref={cardRef} style={{
      width: dims.w, height: dims.h, ...cardBgStyle, borderRadius: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        background: t.bg, borderRadius: 18, width: innerWidth, maxHeight: innerMaxH,
        overflow: 'hidden', padding: `${pad.py}px ${pad.px}px`, border: `1px solid ${t.border}`,
        boxShadow: theme === 'light'
          ? '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative', zIndex: 1, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="Avatar" style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} crossOrigin="anonymous" />
            ) : (
              <div style={{
                width: avatarSize, height: avatarSize, borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: Math.round(avatarSize * 0.42), userSelect: 'none',
              }}>{initials}</div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
                <span style={{ color: t.text, fontWeight: 700, fontSize: nameFontSize, lineHeight: 1.2 }}>{displayName}</span>
                {showVerified && <VerifiedBadge size={verifiedSize} />}
              </div>
              <div style={{ color: t.sub, fontSize: handleFontSize, marginTop: 2, lineHeight: 1.2 }}>{handle}</div>
            </div>
          </div>
          <XLogo size={xLogoSize} color={t.text} style={{ opacity: 0.9, flexShrink: 0, marginTop: 2 }} />
        </div>

        {/* Body */}
        <p style={{
          color: t.text, fontSize: bodyFontSize, lineHeight: 1.65,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
          letterSpacing: '-0.01em', flex: 1, overflow: 'hidden',
        }}>
          {postText || 'Your post text will appear here.\n\nPaste an X post URL above to get started.'}
        </p>

        {/* Footer */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: t.sub, fontSize: footerFontSize }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: t.sub, fontSize: footerFontSize }}>via</span>
            <XLogo size={footerFontSize + 2} color={t.sub} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── Card state ──────────────────────────────────────────────────────────────
  const [postText, setPostText]         = useState('')
  const [authorName, setAuthorName]     = useState('')
  const [authorHandle, setAuthorHandle] = useState('')
  const [showVerified, setShowVerified] = useState(true)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [theme, setTheme]               = useState('dark')
  const [orientation, setOrientation]   = useState('square')
  const [bgStyle, setBgStyle]           = useState('gradient')
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].bg)
  const [solidColor, setSolidColor]     = useState('#1a1a2e')
  const [cardPadding, setCardPadding]   = useState('comfortable')

  // ── Fetch state ──────────────────────────────────────────────────────────────
  const [isDownloading, setIsDownloading] = useState(false)
  const [urlInput, setUrlInput]           = useState('')
  const [isFetching, setIsFetching]       = useState(false)
  const [fetchError, setFetchError]       = useState('')
  const [copied, setCopied]               = useState(false)
  const [isBuffering, setIsBuffering]     = useState(false)
  const [bufferStatus, setBufferStatus]   = useState('')

  // ── Photo background state ────────────────────────────────────────────────
  const [photoKeywords, setPhotoKeywords]     = useState('')
  const [photoBackground, setPhotoBackground] = useState(null)
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false)
  const [photoFetchError, setPhotoFetchError] = useState('')
  const [derivedKeywords, setDerivedKeywords] = useState('')
  // Keyword cycling — populated from server on first auto-generate
  const [keywordList, setKeywordList]   = useState([])
  const [keywordIndex, setKeywordIndex] = useState(0)

  const cardRef      = useRef(null)
  const fileInputRef = useRef(null)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleFetchFromUrl = useCallback(async (url) => {
    const trimmed = (url || urlInput).trim()
    if (!trimmed) return
    setIsFetching(true)
    setFetchError('')
    try {
      const endpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(trimmed)}&omit_script=true`
      const res  = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const text = parseOEmbedHtml(data.html)
      if (text) setPostText(text)
      if (data.author_name) setAuthorName(data.author_name)

      let handle = ''
      if (data.author_url) {
        const match = data.author_url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/i)
        if (match) { handle = match[1]; setAuthorHandle(`@${handle}`) }
      }

      if (handle) {
        for (const avatarUrl of [`https://unavatar.io/x/${handle}`, `https://unavatar.io/twitter/${handle}`]) {
          try { setProfilePhoto(await loadImageAsDataUrl(avatarUrl)); break }
          catch (e) { console.warn(`Avatar failed (${avatarUrl}):`, e.message) }
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setFetchError("Couldn't fetch that post. Try pasting the post text manually instead.")
    } finally {
      setIsFetching(false)
    }
  }, [urlInput])

  const handleCopyText = useCallback(async () => {
    if (!postText) return
    await navigator.clipboard.writeText(postText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [postText])

  const handleUrlChange = useCallback((e) => {
    const val = e.target.value
    setUrlInput(val)
    setFetchError('')
    if (isXUrl(val)) handleFetchFromUrl(val)
  }, [handleFetchFromUrl])

  // Reset keyword cycling whenever the post text changes
  useEffect(() => {
    setKeywordList([])
    setKeywordIndex(0)
    setDerivedKeywords('')
  }, [postText])

  const handleFetchPhoto = useCallback(async () => {
    setIsFetchingPhoto(true)
    setPhotoFetchError('')
    try {
      const params = new URLSearchParams({ t: Date.now() })

      if (photoKeywords.trim()) {
        // User typed explicit keywords — use them directly, no cycling
        params.set('query', photoKeywords.trim())
        setDerivedKeywords('')
      } else if (keywordList.length > 0) {
        // Cycle to the next keyword in the list we already have
        const idx = keywordIndex % keywordList.length
        const kw  = keywordList[idx]
        params.set('query', kw)
        setKeywordIndex(idx + 1)
        setDerivedKeywords(`${kw} (${idx + 1} of ${keywordList.length})`)
      } else if (postText.trim()) {
        // First time — ask the server to extract a keyword list from the post text
        params.set('text', postText.trim())
      } else {
        params.set('query', 'abstract')
      }

      const res  = await fetch(`/photo-api?${params}`)
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`)
      setPhotoBackground(json.dataUrl)

      // On the first auto-generate the server returns the full keyword list
      if (json.keywordList && json.keywordList.length > 0) {
        setKeywordList(json.keywordList)
        setKeywordIndex(1)  // first keyword was just used; next click starts at index 1
        setDerivedKeywords(`${json.keywordList[0]} (1 of ${json.keywordList.length})`)
      }
    } catch {
      setPhotoFetchError("Couldn't load a photo. Try different keywords or check your connection.")
    } finally {
      setIsFetchingPhoto(false)
    }
  }, [photoKeywords, postText, keywordList, keywordIndex])

  const handleBuffer = useCallback(async () => {
    if (!cardRef.current) return
    setIsBuffering(true)
    setBufferStatus('')
    try {
      // Step 1: render at a lightweight scale for upload/clipboard — Buffer only needs a
      // preview-sized image, not full Instagram resolution. JPEG is ~10× smaller than PNG.
      const BUFFER_SCALE = 1.5   // ~630–756 px wide: fast to render, fast to upload
      const canvas = await html2canvas(cardRef.current, {
        scale: BUFFER_SCALE, useCORS: true, allowTaint: true,
        backgroundColor: null, logging: false, imageTimeout: 15000,
      })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.88))

      // Step 2: convert blob → base64 data URL for upload
      const base64DataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror   = reject
        reader.readAsDataURL(blob)
      })

      // Step 3: try to upload to imgbb so we get a public URL for Buffer's picture= param
      let pictureUrl = null
      try {
        const uploadRes  = await fetch('/upload-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData: base64DataUrl }),
        })
        const uploadData = await uploadRes.json()
        if (uploadData.url) pictureUrl = uploadData.url
        console.log('[Buffer] Uploaded image →', pictureUrl)
      } catch (uploadErr) {
        console.warn('[Buffer] Image upload failed:', uploadErr.message)
      }

      // Step 4: build Buffer URL — include picture= if we have a hosted URL
      let bufferUrl = `https://buffer.com/add?text=${encodeURIComponent(postText || '')}`
      if (pictureUrl) bufferUrl += `&picture=${encodeURIComponent(pictureUrl)}`
      window.open(bufferUrl, 'buffer-share', 'width=750,height=650,scrollbars=yes,resizable=yes')

      // Step 5: also silently copy to clipboard as a paste-fallback
      let imageCopied = false
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/jpeg': blob })])
        imageCopied = true
      } catch (clipErr) {
        console.warn('[Buffer] Clipboard write failed:', clipErr.message)
      }

      // Step 6: status message
      if (pictureUrl) {
        setBufferStatus('✓ Image attached to Buffer! If it doesn\'t appear, paste with ⌘V (or Ctrl+V)')
      } else if (imageCopied) {
        setBufferStatus('📋 Image copied — paste it into Buffer with ⌘V (or Ctrl+V)')
      } else {
        setBufferStatus('⚠️ Please download the image and attach it manually in Buffer')
      }
      setTimeout(() => setBufferStatus(''), 8000)
    } catch (err) {
      console.error('[Buffer] error:', err.message)
      window.open(
        `https://buffer.com/add?text=${encodeURIComponent(postText || '')}`,
        'buffer-share', 'width=750,height=650,scrollbars=yes,resizable=yes'
      )
    } finally {
      setIsBuffering(false)
    }
  }, [postText, orientation])

  const handlePhotoUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setProfilePhoto(reader.result)
    reader.readAsDataURL(file)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setIsDownloading(true)
    try {
      const dims   = ORIENTATIONS[orientation]
      const canvas = await html2canvas(cardRef.current, {
        scale: dims.exportScale, useCORS: true, allowTaint: true,
        backgroundColor: null, logging: false, imageTimeout: 15000,
      })
      const link = document.createElement('a')
      const safeHandle = (authorHandle || 'post').replace(/[@\s]/g, '').toLowerCase()
      link.download = `xpost-${safeHandle}-${orientation}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
    } catch (err) {
      console.error('Export error:', err)
      alert('Something went wrong. Try removing the profile photo and retrying.')
    } finally {
      setIsDownloading(false)
    }
  }, [orientation, authorHandle])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const dims      = ORIENTATIONS[orientation]
  const charCount = postText.length
  const charLimit = 560
  const charPct   = Math.min(100, (charCount / charLimit) * 100)
  const charColor = charCount > charLimit * 0.9 ? '#ef4444' : charCount > charLimit * 0.75 ? '#f59e0b' : '#6b7280'
  const cardProps = { postText, authorName, authorHandle, profilePhoto, showVerified, theme, orientation, bgStyle, selectedGradient, solidColor, cardPadding, photoBackground }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hover-lift:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(59,130,246,0.35) !important; }
        .hover-lift        { transition: all 0.2s ease; }
        .gradient-swatch:hover { transform: scale(1.12) !important; }
        .gradient-swatch   { transition: all 0.15s ease; }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .preview-sticky { position: relative !important; top: auto !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white' }}>

        {/* Header */}
        <header style={{
          borderBottom: '1px solid #1a1a2a', padding: '14px 24px',
          background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '7px 10px',
                display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <XLogo size={20} color="white" />
                <span style={{ color: '#9ca3af', fontSize: 16 }}>→</span>
                <span style={{
                  fontSize: 15, fontWeight: 700,
                  background: 'linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>Instagram</span>
              </div>
              <span style={{ color: '#f9fafb', fontWeight: 600, fontSize: 17 }}>X to Image</span>
            </div>
            <p style={{ color: '#4b5563', fontSize: 13 }}>Turn tweets into beautiful social cards</p>
          </div>
        </header>

        {/* Main */}
        <main style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px' }}>
          <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 28, alignItems: 'start' }}>

            {/* ── LEFT ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Post Content */}
              <SectionCard title="Post Content">
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Paste Post URL
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={urlInput} onChange={handleUrlChange}
                      placeholder="https://x.com/user/status/123…"
                      style={{ flex: 1, background: '#1a2233', borderRadius: 10, padding: '11px 14px', color: 'white', border: `1px solid ${fetchError ? '#ef4444' : '#2d3a4f'}`, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    <button onClick={() => handleFetchFromUrl()} disabled={isFetching || !urlInput.trim()} style={{
                      padding: '11px 16px', borderRadius: 10, border: 'none',
                      background: isFetching ? '#1f3a5f' : '#1d4ed8', color: 'white', fontSize: 13, fontWeight: 600,
                      cursor: isFetching || !urlInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: !urlInput.trim() ? 0.5 : 1, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {isFetching ? <><SpinnerIcon /> Fetching…</> : '⚡ Fetch Post'}
                    </button>
                  </div>
                  {fetchError && <p style={{ color: '#f87171', fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>{fetchError}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
                    <span style={{ color: '#374151', fontSize: 12 }}>or type / paste text directly</span>
                    <div style={{ flex: 1, height: 1, background: '#1f2937' }} />
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={postText} onChange={e => setPostText(e.target.value)}
                    placeholder="Paste or type the post text here…"
                    maxLength={charLimit} rows={6}
                    style={{ width: '100%', background: '#1a2233', borderRadius: 12, padding: '14px 16px', color: 'white', border: '1px solid #2d3a4f', resize: 'vertical', fontSize: 15, lineHeight: 1.55, boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                    {/* Copy button */}
                    <button
                      onClick={handleCopyText}
                      disabled={!postText}
                      title="Copy post text to clipboard"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: copied ? 'rgba(34,197,94,0.15)' : 'transparent',
                        border: `1px solid ${copied ? '#22c55e' : '#2d3a4f'}`,
                        borderRadius: 7, padding: '4px 10px', cursor: postText ? 'pointer' : 'not-allowed',
                        color: copied ? '#22c55e' : '#6b7280', fontSize: 12, fontFamily: 'inherit',
                        opacity: postText ? 1 : 0.35, transition: 'all 0.2s',
                      }}
                    >
                      {copied ? <CheckIcon /> : <ClipboardIcon />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    {/* Char counter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width={20} height={20} viewBox="0 0 20 20" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={10} cy={10} r={8} fill="none" stroke="#2d3a4f" strokeWidth={2.5} />
                        <circle cx={10} cy={10} r={8} fill="none" stroke={charColor} strokeWidth={2.5}
                          strokeDasharray={`${charPct * 0.502} 50.2`} strokeLinecap="round" />
                      </svg>
                      <span style={{ color: charColor, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{charLimit - charCount}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Author Info */}
              <SectionCard title="Author Info">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Display Name"
                    style={{ background: '#1a2233', borderRadius: 10, padding: '11px 14px', color: 'white', border: '1px solid #2d3a4f', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }} />
                  <input value={authorHandle} onChange={e => setAuthorHandle(e.target.value)} placeholder="@handle"
                    style={{ background: '#1a2233', borderRadius: 10, padding: '11px 14px', color: 'white', border: '1px solid #2d3a4f', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', width: '100%' }} />
                  <Toggle checked={showVerified} onChange={setShowVerified} label="Show verified badge" />
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1a2233', borderRadius: 10, padding: '10px 14px', border: '1px dashed #374151', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#1e2a3f' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.background = '#1a2233' }}
                  >
                    {profilePhoto
                      ? <img src={profilePhoto} alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2d3a4f', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#6b7280" strokeWidth={2} strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                    }
                    <div>
                      <div style={{ color: '#d1d5db', fontSize: 13, fontWeight: 500 }}>{profilePhoto ? 'Change profile photo' : 'Upload profile photo'}</div>
                      <div style={{ color: '#6b7280', fontSize: 12, marginTop: 1 }}>Optional · PNG, JPG, WEBP</div>
                    </div>
                    {profilePhoto && (
                      <button onClick={e => { e.stopPropagation(); setProfilePhoto(null) }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
                        title="Remove photo">×</button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </div>
              </SectionCard>

              {/* Appearance */}
              <SectionCard title="Appearance">
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Card Theme</label>
                  <SegmentControl value={theme} onChange={setTheme} options={Object.entries(THEMES).map(([k, v]) => ({ value: k, label: `${v.icon} ${v.name}` }))} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Format</label>
                  <SegmentControl value={orientation} onChange={setOrientation} options={[{ value: 'square', label: '⬜ Square' }, { value: 'portrait', label: '📱 Portrait' }, { value: 'landscape', label: '🖥 Landscape' }]} />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Spacing</label>
                  <SegmentControl value={cardPadding} onChange={setCardPadding} options={Object.entries(CARD_PADDING).map(([k, v]) => ({ value: k, label: v.label }))} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#6b7280', fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Background</label>
                  <div style={{ marginBottom: 14 }}>
                    <SegmentControl value={bgStyle} onChange={setBgStyle} options={[{ value: 'gradient', label: '🎨 Gradient' }, { value: 'solid', label: '🎯 Solid' }, { value: 'photo', label: '🖼 Photo' }]} />
                  </div>
                  {bgStyle === 'gradient' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                      {GRADIENTS.map(g => (
                        <button key={g.id} className="gradient-swatch" onClick={() => setSelectedGradient(g.bg)} title={g.name} style={{
                          height: 38, borderRadius: 9, background: g.bg, cursor: 'pointer',
                          border: selectedGradient === g.bg ? '2.5px solid white' : '2px solid transparent',
                          boxShadow: selectedGradient === g.bg ? '0 0 0 3px rgba(59,130,246,0.5)' : 'none',
                        }} />
                      ))}
                    </div>
                  )}
                  {bgStyle === 'solid' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <input type="color" value={solidColor} onChange={e => setSolidColor(e.target.value)}
                        style={{ width: 52, height: 52, borderRadius: 10, cursor: 'pointer', border: '1px solid #2d3a4f', background: solidColor, padding: 2 }} />
                      <div>
                        <div style={{ color: '#f9fafb', fontSize: 15, fontFamily: 'monospace', fontWeight: 500 }}>{solidColor.toUpperCase()}</div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Click swatch to change</div>
                      </div>
                    </div>
                  )}
                  {bgStyle === 'photo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {photoBackground && (
                        <div style={{ borderRadius: 10, overflow: 'hidden', height: 90, position: 'relative' }}>
                          <img src={photoBackground} alt="Background preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.3), transparent)' }} />
                          <span style={{ position: 'absolute', bottom: 8, left: 10, color: 'white', fontSize: 11, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Current photo</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={photoKeywords}
                          onChange={e => { setPhotoKeywords(e.target.value); setPhotoFetchError(''); setDerivedKeywords('') }}
                          onKeyDown={e => e.key === 'Enter' && handleFetchPhoto()}
                          placeholder="e.g. mountain sunset, neon city…"
                          style={{ flex: 1, background: '#1a2233', borderRadius: 10, padding: '11px 14px', color: 'white', border: '1px solid #2d3a4f', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        <button onClick={handleFetchPhoto} disabled={isFetchingPhoto} style={{
                          padding: '11px 14px', borderRadius: 10, border: 'none', flexShrink: 0,
                          background: isFetchingPhoto ? '#1f3a5f' : '#1d4ed8', color: 'white', fontSize: 13, fontWeight: 600,
                          cursor: isFetchingPhoto ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                        }}>
                          {isFetchingPhoto ? <><SpinnerIcon /> Loading…</> : photoBackground ? '🔄 New Photo' : '⚡ Generate'}
                        </button>
                      </div>
                      {photoFetchError && <p style={{ color: '#f87171', fontSize: 12, lineHeight: 1.4 }}>{photoFetchError}</p>}
                      {derivedKeywords && !photoKeywords.trim() && (
                        <p style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                          Topic: <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{derivedKeywords}</span>
                          {keywordList.length > 1 && <span style={{ color: '#4b5563' }}> — click New Photo to try the next topic</span>}
                        </p>
                      )}
                      <p style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                        Keywords are <span style={{ color: '#6b7280' }}>optional</span> — leave blank and topics will be extracted from your post.
                        Each click of <strong style={{ color: '#6b7280' }}>New Photo</strong> tries a different topic keyword.
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Download + Buffer */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="hover-lift" onClick={handleDownload} disabled={isDownloading} style={{
                  flex: 1, padding: '15px 20px', borderRadius: 14, border: 'none',
                  background: isDownloading ? 'linear-gradient(135deg, #1d4ed8, #5b21b6)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white', fontSize: 15, fontWeight: 600,
                  cursor: isDownloading ? 'not-allowed' : 'pointer', opacity: isDownloading ? 0.8 : 1,
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 4px 20px rgba(59,130,246,0.25)',
                }}>
                  {isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
                  {isDownloading ? 'Generating…' : 'Download PNG'}
                </button>

                <button
                  className="hover-lift"
                  onClick={handleBuffer}
                  disabled={isBuffering}
                  title="Generate image and open in Buffer to schedule"
                  style={{
                    padding: '15px 18px', borderRadius: 14, border: '1px solid #2d3a4f',
                    background: isBuffering ? '#1a2233' : '#111827',
                    color: '#e5e7eb', fontSize: 14, fontWeight: 600,
                    cursor: isBuffering ? 'not-allowed' : 'pointer',
                    opacity: isBuffering ? 0.7 : 1,
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}
                >
                  {isBuffering ? <SpinnerIcon /> : <BufferIcon size={17} />}
                  {isBuffering ? 'Preparing…' : 'Buffer'}
                </button>
              </div>
              {bufferStatus ? (
                <p style={{
                  fontSize: 12, textAlign: 'center', marginTop: -8, lineHeight: 1.5,
                  color: bufferStatus.startsWith('📋') ? '#22c55e' : '#f59e0b',
                }}>
                  {bufferStatus}
                </p>
              ) : (
                <p style={{ color: '#374151', fontSize: 12, textAlign: 'center', marginTop: -8 }}>
                  Exports at {orientation === 'square' ? '1080×1080' : orientation === 'portrait' ? '1080×1350' : '1920×1080'} px · Buffer opens with text pre-filled
                </p>
              )}

            </div>

            {/* ── RIGHT: Preview ── */}
            <div className="preview-sticky" style={{ position: 'sticky', top: 88 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#f9fafb' }}>Live Preview</h2>
                <span style={{ background: '#1f2937', color: '#9ca3af', fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 20, border: '1px solid #2d3a4f' }}>
                  {dims.label}
                </span>
              </div>
              <div style={{
                background: 'repeating-conic-gradient(#161622 0% 25%, #111118 0% 50%) 0 0 / 20px 20px',
                borderRadius: 20, border: '1px solid #1f2937', padding: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 520, overflow: 'hidden',
              }}>
                <div style={{ transform: orientation === 'landscape' ? `scale(${Math.min(1, (window.innerWidth * 0.38) / dims.w)})` : 'scale(1)', transformOrigin: 'center center' }}>
                  <XPostCard cardRef={cardRef} {...cardProps} />
                </div>
              </div>
              <div style={{ marginTop: 16, background: '#111827', borderRadius: 12, padding: '14px 18px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tips</p>
                {[
                  '📋 Paste a post URL above and it auto-fetches the content',
                  '🖼 Upload a real profile photo for best results',
                  '🎨 Gradient backgrounds look great on Instagram',
                  '📐 Square format works for feed posts, Portrait for Reels cover',
                ].map((tip, i) => (
                  <p key={i} style={{ color: '#4b5563', fontSize: 12, lineHeight: 1.4 }}>{tip}</p>
                ))}
              </div>
            </div>

          </div>
        </main>

        <footer style={{ borderTop: '1px solid #1a1a2a', padding: '20px 24px', textAlign: 'center', marginTop: 40 }}>
          <p style={{ color: '#374151', fontSize: 13 }}>X to Image · Built with React + Vite</p>
        </footer>

      </div>
    </>
  )
}
