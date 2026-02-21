# Deployment Guide

This guide covers deploying Sadaqah Box to Cloudflare Workers with D1 database and KV namespace.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Cloudflare Setup](#cloudflare-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Logging](#monitoring--logging)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Sadaqah Box is deployed to Cloudflare Workers, a serverless edge computing platform. The deployment includes:

- **Worker** - API and frontend serving
- **D1 Database** - SQLite database
- **KV Namespace** - Session storage and caching
- **Assets** - Static file hosting

### Architecture

```
                    Cloudflare Edge Network
                    +---------------------+
                    |                     |
User Request -----> |  Worker (Hono API)  |
                    |         |           |
                    |    +----+----+      |
                    |    |         |      |
                    |   D1        KV      |
                    | Database  Namespace |
                    +---------------------+
```

---

## Prerequisites

### Required

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed via project dependencies)
- Domain (optional, but recommended)

### Account Requirements

| Feature | Free Tier | Paid |
|---------|-----------|------|
| Workers | 100k requests/day | Unlimited |
| D1 Database | 500MB | 5GB+ |
| KV Namespace | 100k reads/day | Unlimited |

---

## Cloudflare Setup

### 1. Install Wrangler

```bash
# Already included in project dependencies
# Login to Cloudflare
bunx wrangler login
```

This will open a browser for authentication.

### 2. Verify Login

```bash
bunx wrangler whoami
```

### 3. Get Account ID

```bash
bunx wrangler list
```

Or find it in the Cloudflare dashboard under your account.

---

## Database Configuration

### 1. Create D1 Database

```bash
# Create production database
bunx wrangler d1 create sadaqahbox

# Note the database ID from the output
# Output example:
# Created new D1 database "sadaqahbox"
# [[d1_databases]]
# binding = "DB"
# database_name = "sadaqahbox"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. Update wrangler.jsonc

Update the `database_id` in `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "sadaqahbox",
      "database_id": "YOUR_DATABASE_ID_HERE"  // <-- Update this
    }
  ]
}
```

### 3. Create KV Namespace

```bash
# Create KV namespace for auth sessions
bunx wrangler kv:namespace create AUTH_KV

# Note the ID from the output
# Output example:
# [[kv_namespaces]]
# binding = "AUTH_KV"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Update wrangler.jsonc for KV

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "AUTH_KV",
      "id": "YOUR_KV_NAMESPACE_ID_HERE"  // <-- Update this
    }
  ]
}
```

### 5. Run Migrations

```bash
# Apply migrations to production database
bun run migrate:remote
```

---

## Environment Variables

### Production Secrets

Set secrets in Cloudflare (not in code):

```bash
# Set API keys (optional, for enhanced rate fetching)
bunx wrangler secret put GOLD_API_TOKEN
bunx wrangler secret put COINGECKO_API_KEY
bunx wrangler secret put CRYPTOCOMPARE_API_KEY

# Set Better Auth secrets (required for production)
bunx wrangler secret put BETTER_AUTH_SECRET
bunx wrangler secret put BETTER_AUTH_URL
```

### Available Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `GOLD_API_TOKEN` | No | GoldAPI.io token for gold prices |
| `COINGECKO_API_KEY` | No | CoinGecko Pro API key |
| `CRYPTOCOMPARE_API_KEY` | No | CryptoCompare API key |
| `BETTER_AUTH_SECRET` | Yes | Base64 encoded secret for encryption |
| `BETTER_AUTH_URL` | Yes | Production URL (e.g., https://sadaqahbox.com) |

### Setting Secrets via Dashboard

1. Go to Workers & Pages > your worker
2. Click "Settings" > "Variables"
3. Add encrypted environment variables

---

## Deployment Process

### Automated Deployment

```bash
# Build and deploy in one command
bun run deploy
```

This runs:
1. `bun run build` - Builds the frontend and prepares the worker
2. `bunx wrangler deploy` - Deploys to Cloudflare

### Manual Deployment

```bash
# Step 1: Build
bun run build

# Step 2: Deploy
bunx wrangler deploy
```

### Deployment Output

```
Uploaded sadaqahbox (1.2 sec)
Published sadaqahbox
  https://sadaqahbox.<your-subdomain>.workers.dev
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://sadaqahbox.<subdomain>.workers.dev/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T12:00:00.000Z"
  }
}
```

### 2. Test Authentication

1. Navigate to your deployed URL
2. Try signing up
3. Verify session persistence

### 3. Check API Documentation

Navigate to `/api/docs` to verify OpenAPI documentation is working.

### 4. Verify Database

```bash
# Check database status
bunx wrangler d1 info sadaqahbox

# Query database (example)
bunx wrangler d1 execute sadaqahbox --command "SELECT * FROM users LIMIT 5"
```

---

## Custom Domain Setup

### 1. Add Custom Domain

```bash
# Add domain to worker
bunx wrangler domains add sadaqahbox.com
```

Or via dashboard:
1. Go to Workers > your worker > Settings > Domains
2. Add custom domain

### 2. Update DNS

Add the required DNS records in Cloudflare:
- Type: `AAAA`
- Name: `@` (or subdomain)
- Content: `100::` (Workers placeholder)

### 3. Update CORS (if needed)

Update `src/api/setup/cors.ts` if your domain changes:

```typescript
origin: [
  'https://sadaqahbox.com',
  'https://www.sadaqahbox.com',
],
```

---

## Monitoring & Logging

### View Logs

```bash
# Tail logs in real-time
bunx wrangler tail

# Filter by status
bunx wrangler tail --status error
```

### Log Dashboard

1. Go to Workers > your worker
2. Click "Logs" tab
3. View real-time and historical logs

### Metrics

Available in the dashboard:
- Request count
- Error rate
- CPU time
- Duration percentiles

### Alerts

Set up alerts in Cloudflare:
1. Go to Notifications
2. Create alert policy
3. Select "Workers" metrics

---

## Rollback Procedures

### Quick Rollback

```bash
# List deployments
bunx wrangler deployments list

# Rollback to previous version
bunx wrangler rollback
```

### Specific Version Rollback

```bash
# Get deployment ID
bunx wrangler deployments list

# Rollback to specific version
bunx wrangler rollback --deployment-id <deployment-id>
```

### Database Rollback

Database rollbacks are manual:
1. Backup current data
2. Run down migration SQL
3. Verify data integrity

---

## Troubleshooting

### Common Deployment Errors

#### "Error: No such binding: DB"

The D1 database binding is not configured correctly.

**Solution:**
1. Verify `wrangler.jsonc` has correct `database_id`
2. Run `bunx wrangler d1 list` to see available databases

#### "Error: KV namespace not found"

The KV namespace binding is missing.

**Solution:**
1. Create KV namespace: `bunx wrangler kv:namespace create AUTH_KV`
2. Update `wrangler.jsonc` with the new ID

#### "Error: Script too large"

Worker script exceeds size limit (1MB free, 10MB paid).

**Solution:**
1. Check bundle size: `bun run build && ls -la dist`
2. Remove unused dependencies
3. Use dynamic imports for large modules

#### "Error: Rate limited"

Too many deployment requests.

**Solution:**
Wait a few minutes and retry.

### Runtime Errors

#### 500 Internal Server Error

1. Check logs: `bunx wrangler tail`
2. Verify database migrations are applied
3. Check environment variables

#### Authentication Not Working

1. Verify KV namespace is configured
2. Check cookie settings in `src/auth/index.ts`
3. Ensure HTTPS is used (required for cookies)

#### CORS Errors

1. Update CORS settings in `src/api/setup/cors.ts`
2. Ensure all domains are listed
3. Check credentials setting

### Database Issues

#### "No such table: users"

Migrations not applied.

**Solution:**
```bash
bun run migrate:remote
```

#### "Database is locked"

Concurrent write operations.

**Solution:**
D1 handles this automatically, but reduce concurrent writes if persistent.

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-worker:
    name: Deploy Worker
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - name: Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --config wrangler.jsonc
          packageManager: bun
```

### Required Secrets

Add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN` - Create in Cloudflare dashboard
- `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare dashboard (Account > Workers & Pages)

### Creating API Token

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create Token
3. Use "Edit Cloudflare Workers" template
4. Copy token to GitHub secrets

---

## Performance Optimization

### Edge Caching

Workers automatically cache at the edge. Optimize by:

1. **Static Assets** - Served from edge automatically
2. **API Responses** - Add cache headers where appropriate
3. **Database Queries** - Use KV for caching

### Bundle Size

```bash
# Analyze bundle
bun run build
ls -la dist/
```

Tips:
- Use dynamic imports for large components
- Remove unused dependencies
- Tree-shake imports

### Database Optimization

1. **Indexes** - Ensure all query columns are indexed
2. **Query Efficiency** - Use Drizzle relations to avoid N+1
3. **Connection Pooling** - D1 handles this automatically

---

## Security Checklist

- [ ] HTTPS enforced (automatic on Workers)
- [ ] CORS configured correctly
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Secrets stored as encrypted variables
- [ ] Database access restricted to Worker only
- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive operations

---

## Cost Management

### Free Tier Limits

| Resource | Limit | Overages |
|----------|-------|----------|
| Requests | 100k/day | $0.50/million |
| D1 Reads | 5M/day | $0.001/million |
| D1 Writes | 100k/day | $1/million |
| KV Reads | 100k/day | $0.50/million |
| KV Writes | 1k/day | $5/million |

### Monitoring Costs

1. Go to Cloudflare Dashboard > Billing
2. View usage by product
3. Set up billing alerts

---

## See Also

- [Architecture Guide](ARCHITECTURE.md) - System design
- [Development Guide](DEVELOPMENT.md) - Local development
- [API Reference](API.md) - REST endpoints
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
