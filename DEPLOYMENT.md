# 🚀 Deployment Guide — Third Time Traders

## Overview

Third Time Traders is a Next.js web game. All game data (saves, leaderboard, player state) is stored client-side using `localStorage` and Dexie (IndexedDB), making deployment simple — no backend database required.

---

## Deployment Options

### 1. Local Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 2. Self-Host (Node.js)

```bash
npm run build
npm start -- -p 3000 -H 0.0.0.0
# Or use the convenience script:
npm run self-host
```

The app will be available at `http://<your-ip>:3000`.

### 3. Docker

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build manually
docker build -t third-time-traders .
docker run -p 3000:3000 third-time-traders
```

### 4. Vercel (Recommended for public hosting)

1. Push your repo to GitHub
2. Connect it at [vercel.com](https://vercel.com)
3. Vercel auto-detects Next.js and deploys with zero config
4. Custom domain support included

### 5. Other Platforms

| Platform      | Command                                  | Notes                           |
|---------------|------------------------------------------|---------------------------------|
| **Netlify**   | `npm run build` → deploy `.next`         | Use `@netlify/plugin-nextjs`    |
| **Railway**   | Connect GitHub → auto-deploy             | Free tier available             |
| **Fly.io**    | `fly launch` → `fly deploy`             | Uses Dockerfile                 |
| **AWS**       | Use Amplify or ECS with the Dockerfile   | Scalable, more config needed    |
| **Cloudflare**| `@cloudflare/next-on-pages`              | Edge deployment                 |

---

## Data Storage Architecture

### Client-Side Storage (Default)

All data is stored in the browser:

| Data              | Storage            | Key/DB Name         |
|-------------------|--------------------|---------------------|
| Game saves        | `localStorage`     | `ttt-save`          |
| Leaderboard       | `localStorage`     | `ttt-leaderboard`   |
| Player sessions   | `localStorage`     | Zustand persistence |
| Extended data     | IndexedDB (Dexie)  | `ThirdTimeTraders`  |

**Pros:**
- Zero backend infrastructure
- Instant load/save
- Works offline
- Privacy-friendly (data stays on device)

**Cons:**
- Data is per-browser (no cross-device sync)
- Leaderboard is local only
- Can be cleared by user

### Future: Server-Side Leaderboard

For a shared global leaderboard, you can add an API route:

```
POST /api/leaderboard  → submit score
GET  /api/leaderboard  → get top scores
```

Backed by:
- **SQLite** (simplest, single-file DB)
- **PostgreSQL** (scalable, hosted on Supabase/Neon)
- **Redis** (fast sorted sets, great for leaderboards)

---

## Environment Variables

| Variable                  | Default       | Description                    |
|---------------------------|---------------|--------------------------------|
| `PORT`                    | `3000`        | Server port                    |
| `HOSTNAME`                | `0.0.0.0`     | Listen address                 |
| `NEXT_TELEMETRY_DISABLED` | `1`           | Disable Next.js telemetry      |

---

## Health Check

```bash
curl http://localhost:3000
```

---

## Testing

```bash
# Unit tests (Vitest)
npm test

# Unit tests with coverage
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e

# E2E tests with browser visible
npm run test:e2e:headed

# E2E tests with interactive UI
npm run test:e2e:ui
```

---

## Production Checklist

- [ ] Run `npm run build` — ensure no build errors
- [ ] Run `npm test` — all 298 unit tests pass
- [ ] Run `npm run test:e2e` — all E2E tests pass
- [ ] Set `output: 'standalone'` in `next.config.ts` (already done)
- [ ] Add custom domain (if deploying to Vercel/Netlify)
- [ ] Set up monitoring (optional: Vercel Analytics, Sentry)
- [ ] Enable compression (handled by Next.js in production)
