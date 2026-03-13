# Little Planets 🪐

A Suika-style planet merging game. Drop and merge planets to score points!

## Deploy to Vercel

### Option 1 — Vercel CLI (recommended)
```bash
npm install -g vercel
vercel
```

### Option 2 — Vercel Dashboard
1. Push this folder to a GitHub/GitLab repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import the repo
4. Set **Framework Preset** to **Other**
5. Leave **Build Command** empty
6. Set **Output Directory** to `.` (dot)
7. Click **Deploy**

## Local development
```bash
npx serve . -p 3000
# then open http://localhost:3000
```

## What was changed from the original
- Removed Daily Mode (required backend)
- Removed Leaderboard (required backend)
- Removed `/api/*` calls — all stubbed with no-ops
- Cleaned up `index.html` (removed Wayback Machine artifacts)
- Added `vercel.json` with caching headers and SPA rewrite rules
