# Deployment Modes

This project supports two deployment modes:

1. **Combined Mode** (default): Frontend and API Worker deployed together on Cloudflare
2. **Separated Mode**: Frontend on static host (e.g., GitHub Pages) + API Worker on Cloudflare

---

## Combined Mode (Default)

In this mode, Vite builds both the frontend and the Worker together. The frontend is served as static assets through the Worker.

### Configuration

- Uses [`vite.config.ts`](vite.config.ts) with `@cloudflare/vite-plugin`
- Uses [`wrangler.jsonc`](wrangler.jsonc) with assets binding

### Scripts

```bash
# Development
bun run dev

# Build and preview locally
bun run preview

# Deploy to Cloudflare
bun run deploy
```

### Environment Variables

No additional environment variables needed. The API is served at relative `/api` paths.

---

## Static Frontend Mode

In this mode:
- **Frontend**: Built as static files and deployed to GitHub Pages (or similar)

### Configuration

- **Frontend**: Uses [`vite.static.config.ts`](vite.static.config.ts) - no Cloudflare plugin

### Scripts

```bash
# Build frontend for static hosting
bun run build:static

# Deploy frontend (manually upload dist/static to GitHub Pages)
bun run deploy:static  # Shows instructions
```

### Environment Variables

#### Frontend Build-time (set in GitHub Actions or locally)

```bash
# Point to your deployed Worker URL
VITE_API_URL=https://your-worker.your-subdomain.workers.dev/api
```

#### Worker Runtime (set in Cloudflare Dashboard or Wrangler secrets)

```bash
# Required: Allow your static host origin
ALLOWED_ORIGINS=https://yourusername.github.io,https://yourdomain.com

# Optional: Set environment
NODE_ENV=production
```

### Setting up ALLOWED_ORIGINS

When deploying the Worker separately, you MUST configure `ALLOWED_ORIGINS` to allow your frontend domain:

```bash
# Set the secret using Wrangler
bunx wrangler secret put ALLOWED_ORIGINS --config wrangler.jsonc
# Enter: https://yourusername.github.io
```

Or add to `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "ALLOWED_ORIGINS": "https://yourusername.github.io"
  }
}
```

⚠️ **Security Note**: Never commit secrets to your repository. Use Wrangler secrets for sensitive values.

---

## GitHub Pages Deployment

### 1. Create Repository Secrets

Go to Settings → Secrets and variables → Actions, and add:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token. Create this in **User Profile** > **API Tokens** > **Create Token** > **Edit Cloudflare Workers**.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID. Found on the **Workers & Pages** overview page in the Cloudflare dashboard.

### 2. Update the Workflow

Edit [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and update:

- `VITE_API_URL`: Your Cloudflare Worker URL

### 3. Deploy

Push to the `main` branch, and both the frontend (GitHub Pages) and Worker will deploy automatically.

---

## Switching Between Modes

### From Combined to Separated

1. Build the frontend: `bun run build:static`
2. Set `ALLOWED_ORIGINS` on the Worker
3. Upload `dist/static` to your static host

### From Separated to Combined

1. Use `wrangler.jsonc` instead of `wrangler.jsonc`
2. Run `bun run deploy` (which uses the combined config)

---

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. Check that `ALLOWED_ORIGINS` is set on the Worker
2. Ensure the origin matches exactly (including `https://` and no trailing slash)
3. For multiple origins, separate with commas: `https://a.com,https://b.com`

### API Not Found (404)

If API requests return 404:

1. Verify `VITE_API_URL` is set correctly during the frontend build
2. Check that the Worker is deployed and accessible
3. Ensure the Worker URL ends with `/api` (not `/`)

### Authentication Issues

If login/registration doesn't work:

1. Check that cookies are being sent (credentials: 'include')
2. Verify `ALLOWED_ORIGINS` includes your frontend domain
3. Ensure the Worker is configured with the correct KV namespace
