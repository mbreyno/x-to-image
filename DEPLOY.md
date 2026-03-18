# Deploying X to Image on Netlify

## Prerequisites
- A [GitHub](https://github.com) account
- A [Netlify](https://netlify.com) account (free tier works perfectly)
- A custom domain (purchased from Namecheap, GoDaddy, Cloudflare, etc.)
- [Node.js 18+](https://nodejs.org) installed locally

---

## Step 1 — Test Locally

```bash
cd x-to-image
npm install
npm run dev
```

Open http://localhost:5173 to verify the app looks correct.

---

## Step 2 — Push to GitHub

1. Create a new repository at https://github.com/new
   (name it `x-to-image`, keep it **private** or **public**)

2. From inside the `x-to-image` folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/x-to-image.git
git push -u origin main
```

---

## Step 3 — Deploy to Netlify

1. Go to **https://app.netlify.com** and click **"Add new site" → "Import an existing project"**

2. Choose **GitHub** and authorize Netlify to access your repo

3. Select your `x-to-image` repository

4. Netlify will auto-detect the settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

5. Click **"Deploy site"**

Netlify will build and deploy in ~60 seconds. You'll get a free URL like `https://glowing-kelpie-abc123.netlify.app`.

---

## Step 4 — Add Your Custom Domain

### In Netlify:

1. Go to your site dashboard → **"Domain settings"** → **"Add a domain"**
2. Type your custom domain (e.g. `xtoimage.yourdomain.com`) and click **"Verify"**
3. Netlify will show you **DNS records to add**

### At your DNS provider (e.g. Cloudflare, Namecheap, GoDaddy):

**Option A — Apex domain** (e.g. `yourdomain.com`):
- Add an **A record** pointing to Netlify's load balancer IP: `75.2.60.5`
- Or add a **NETLIFY record** if your provider supports it

**Option B — Subdomain** (e.g. `xtoimage.yourdomain.com`):
- Add a **CNAME record**:
  - Name: `xtoimage`
  - Value: `YOUR_SITE.netlify.app`

### Back in Netlify:
- Click **"Verify DNS configuration"** (may take a few minutes to propagate)
- Once verified, click **"Enable HTTPS"** — Netlify provisions a free SSL certificate automatically

---

## Step 5 — Automatic Deploys

Every time you push to your `main` branch on GitHub, Netlify will automatically rebuild and redeploy. No manual steps needed.

---

## Updating the App

To make changes:

```bash
# Edit files in src/
npm run dev          # preview changes locally
git add .
git commit -m "Update description"
git push             # triggers auto-deploy on Netlify
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Run `npm install` then `npm run build` locally first |
| Domain not resolving | DNS can take up to 48 hours to propagate |
| HTTPS not working | Wait 5–10 min after DNS verification; Netlify provisions SSL automatically |
| Download button fails | Make sure the browser allows downloads; try a different browser |
