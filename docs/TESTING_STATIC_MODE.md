# Testing Static Mode (Frontend + Separate Worker)

This guide explains how to test the separated deployment mode where the frontend runs independently from the API Worker.

## Prerequisites

- Your Worker deployed to Cloudflare (or running locally)
- The Worker's `ALLOWED_ORIGINS` configured to allow `http://localhost:5173`

## Option 1: Quick Test (Recommended for Development)

### Step 1: Start the Worker locally

```bash
# Terminal 1: Run the worker with wrangler
bunx wrangler dev --config wrangler.worker.jsonc
```

The Worker will start on `http://localhost:8787` (or similar).

### Step 2: Start the static dev server

```bash
# Terminal 2: Run Vite with static config
bun run dev:static
```

This starts the frontend on `http://localhost:5173` without the Cloudflare plugin.

### Step 3: Configure the Server URL

1. Open `http://localhost:5173` in your browser
2. Click the **"Server"** button in the header
3. Enter: `http://localhost:8787` (or your worker URL)
4. Click **"Test Connection"** to verify
5. Click **"Save & Reload"**

The page will reload and connect to your local Worker.

---

## Option 2: Test with Production Worker

If you've already deployed your Worker to Cloudflare:

```bash
# Start the static dev server
bun run dev:static
```

Then in the browser:
1. Click **"Server"** in the header
2. Enter your production Worker URL: `https://your-worker.your-subdomain.workers.dev`
3. Test and save

**Note**: Make sure your production Worker has `ALLOWED_ORIGINS` set to allow `http://localhost:5173`.

---

## Option 3: Build and Serve Static Files

To test the actual production static build:

```bash
# 1. Build the static frontend
bun run build:static

# 2. Serve the static files (using vite preview or any static server)
bunx vite preview --config vite.static.config.ts

# Or use any static file server
# npx serve dist/static
```

Then configure the Server URL in the UI to point to your Worker.

---

## Setting ALLOWED_ORIGINS for Local Development

### For Local Worker (wrangler dev)

Create/edit `.dev.vars` in your project root:

```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
```

Or set it when running wrangler:

```bash
ALLOWED_ORIGINS=http://localhost:5173 bunx wrangler dev --config wrangler.worker.jsonc
```

### For Deployed Worker

```bash
# Set the secret on your deployed worker
bunx wrangler secret put ALLOWED_ORIGINS --config wrangler.worker.jsonc
# Enter: http://localhost:5173
```

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check that `ALLOWED_ORIGINS` includes your frontend URL exactly
2. Verify the Worker is reading the environment variable correctly
3. Check the Worker's CORS middleware is configured

### Connection Test Fails

If "Test Connection" fails:

1. Verify the Worker URL is correct (should not include `/api` - it gets added automatically)
2. Check the Worker is running and accessible
3. Look at the Worker's logs for any errors
4. Ensure the `/api/health` endpoint is accessible

### Changes Not Applying

After saving the server URL, the page **must reload** for changes to take effect. This is intentional to ensure all API clients pick up the new configuration.

---

## File Structure

```
├── vite.config.ts              # Combined mode (dev with Cloudflare plugin)
├── vite.static.config.ts       # Static mode (frontend only)
├── wrangler.jsonc              # Combined deployment config
├── wrangler.worker.jsonc       # Worker-only config (for separated mode)
└── dist/
    ├── static/                 # Static build output (for GitHub Pages)
    └── worker/                 # Worker build output
```

---

## NPM Scripts Reference

| Script | Purpose |
|--------|---------|
| `bun run dev` | Combined mode - frontend + worker together via Cloudflare plugin |
| `bun run dev:static` | Static mode - frontend only, connect to external worker |
| `bun run build:static` | Build static frontend for deployment |
| `bun run build:worker` | Build worker for deployment |
| `bun run deploy:worker` | Deploy worker to Cloudflare |
