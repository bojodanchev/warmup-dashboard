# X Warmup Dashboard

Central activity tracking for X warmup accounts. Deployed on Vercel with Vercel KV storage.

## Deploy to Vercel

1. **Push to GitHub** (or deploy directly from folder)

2. **Create Vercel Project:**
   ```bash
   cd warmup-dashboard
   npx vercel
   ```

3. **Add Vercel KV:**
   - Go to your Vercel project dashboard
   - Storage → Create Database → KV
   - Connect to your project
   - Environment variables are auto-added

4. **Redeploy:**
   ```bash
   npx vercel --prod
   ```

## Configure Extension

After deploying, run this in browser console on each X profile:

```javascript
chrome.storage.local.set({
  centralLogEndpoint: 'https://YOUR-APP.vercel.app/api/log'
})
```

Replace `YOUR-APP` with your Vercel deployment URL.

## API Endpoints

- `POST /api/log` - Receive activity events from extension
- `GET /api/stats` - Get today's stats and recent events

## Dashboard Features

- Real-time activity tracking across all profiles
- Today's totals (likes, bookmarks, videos, sessions)
- Per-profile stats with last activity time
- Live activity feed with recent events
- Auto-refresh every 5 seconds

## Local Development

```bash
npm install
npm run dev
```

Note: Vercel KV requires Vercel environment. For local dev, deploy first and use `vercel env pull` to get credentials.
