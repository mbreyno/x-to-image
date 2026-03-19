# X to Image — Project Context

## What this is
A web app that converts X (Twitter) posts into styled PNG image cards for sharing on Instagram and other social platforms. Users paste an X post URL, customize the card's appearance, and export it.

**Live URL:** https://x-to-image.netlify.app
**GitHub:** https://github.com/mbreyno/x-to-image
**Deploys:** Automatically via Netlify on every push to `main`

---

## Tech stack
- **React 18 + Vite 5** — plain JSX, no TypeScript
- **Tailwind CSS** — app shell only; inline styles inside the card (required for html2canvas compatibility)
- **html2canvas** — renders the card DOM to a PNG at Instagram-native resolution
- **Netlify Functions** — serverless proxies for API calls (avoid CORS, hide keys)

---

## Key features
1. **Fetch from URL** — paste an X/Twitter post URL, auto-fetches text + author via oEmbed API (`publish.twitter.com/oembed`)
2. **Manual entry** — type/paste post text directly
3. **Avatar fetch** — pulls profile photo automatically via `unavatar.io`
4. **Themes** — Dark / Light / Dim card styles
5. **Orientations** — Square 1080×1080, Portrait 1080×1350, Landscape 1920×1080
6. **Backgrounds** — Gradient (12 presets), Solid color, Photo (from Openverse API)
7. **Intelligent photo keywords** — Claude Haiku extracts 3–5 topic keywords from post text; client cycles through them on each "New Photo" click
8. **Download PNG** — exports at full Instagram resolution
9. **Buffer integration** — uploads card to imgbb, opens `buffer.com/add?text=...&picture=<imgbbUrl>` with image pre-attached; also copies to clipboard as fallback

---

## File map

```
src/
  App.jsx                  — entire frontend (icons, data, components, handlers, render)

netlify/functions/
  photo-proxy.js           — Openverse photo search + Claude keyword extraction + Picsum fallback
  image-upload.js          — base64 PNG → imgbb upload → returns public URL (used by Buffer flow)

public/
  og-image.svg             — Open Graph preview image (1200×630)
  favicon.svg              — app icon

index.html                 — title tag, meta description, OG + Twitter card meta tags
netlify.toml               — build config + function redirects (/photo-api, /upload-api)
vite.config.js             — dev proxies that mirror Netlify functions locally
```

---

## Environment variables

| Variable | Where used | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Haiku keyword extraction in photo-proxy | Optional (falls back to heuristic) |
| `IMGBB_API_KEY` | image-upload.js — hosts images for Buffer's picture= param | Optional (Buffer still works, just no auto-attach) |

**Local:** Add to `.env` (gitignored)
**Production:** Add in Netlify dashboard → Site settings → Environment variables

---

## How to run locally
```bash
npm install
npm run dev        # starts at http://localhost:5173
```
The `vite.config.js` dev proxy plugins mirror the Netlify functions locally, so `/photo-api` and `/upload-api` work the same as in production.

## How to deploy
```bash
git add .
git commit -m "your message"
git push origin main    # Netlify auto-deploys
```

---

## Architecture notes

### Card rendering
- The `XPostCard` component uses pure inline styles so html2canvas can capture it faithfully
- Font sizes scale proportionally with card width using `Math.round(dims.w * factor)`
- Export scale is set per-orientation (`exportScale` in `ORIENTATIONS`) to hit exact Instagram pixel counts

### Photo background flow
1. User clicks "Generate" with no keyword typed
2. Client sends `text=<postText>` to `/photo-api`
3. Server calls Claude Haiku → returns array of 3–5 keywords (`keywordList`)
4. First keyword is used for the Openverse search; result returned as base64 `dataUrl`
5. On each subsequent "New Photo" click, client cycles through the keyword list without re-calling Claude

### Buffer flow
1. Render card at 1.5× JPEG (fast — ~30–80 KB vs ~1 MB PNG at full res)
2. Upload to imgbb via `/upload-api` → get public URL
3. Open `buffer.com/add?text=...&picture=<imgbbUrl>`
4. Also silently copy JPEG to clipboard as fallback

---

## Potential improvements to tackle next
- [ ] Mobile-responsive layout (the two-column grid breaks on small screens)
- [ ] Save/load card presets (localStorage)
- [ ] Multiple card templates / layouts
- [ ] Custom font picker
- [ ] Watermark / branding options
- [ ] Tweet thread support (multiple cards)
- [ ] Refresh the OG image to match latest app UI
