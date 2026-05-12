# BO Command Center — Deployment Guide

## Push to GitHub & Deploy on Vercel (Free Plan)

### Step 1 — Push this folder to GitHub

Open Terminal and run these commands:

```bash
cd "/Users/divinoelyonyahshuaruach/Documents/Claude/Projects/Project  Management BO/bo-project"

git init
git add .
git commit -m "Initial commit: BO Command Center"
git branch -M main
git remote add origin https://github.com/Elyru89/BO-Project.git
git push -u origin main
```

If the remote already exists, use:
```bash
git remote set-url origin https://github.com/Elyru89/BO-Project.git
git push -u origin main --force
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import the **Elyru89/BO-Project** repository
4. Framework: **Next.js** (auto-detected)
5. Build command: `next build` (default)
6. Output directory: `.next` (default)
7. Click **Deploy**

That's it — Vercel will build and deploy automatically. ✅

### Step 3 — Future Updates

Every time you push to `main`, Vercel auto-deploys:

```bash
git add .
git commit -m "Update: [what you changed]"
git push
```

---

## Run Locally (Development)

```bash
cd bo-project
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## App Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | KPIs, team progress, monthly goals |
| PDP Tracker | `/pdp-tracker` | 10,583 SKU completion tracking |
| Video Pipeline | `/video-pipeline` | Video projects + completed archive |
| Design Projects | `/darwin-projects` | Darwin's creative task board |
| Brand Banners | `/brand-banners` | Partner banner completion |
| Influencer Hub | `/influencer-hub` | Creator partnerships & links |
| Video Ads | `/video-ads` | Paid ad specs & production queue |

---

## Upgrading to Full Database (v2)

The app currently uses JSON seed files. To handle all 10,583 SKUs and enable real-time editing:

1. Create a free [Supabase](https://supabase.com) project
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel environment variables
3. Run the migration scripts (coming in v2)
