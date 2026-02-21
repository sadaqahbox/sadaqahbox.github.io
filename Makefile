# SadakaBox - Makefile
# Cloudflare Worker project with integrated React frontend

.PHONY: help install dev dev-watch build deploy generate migrate create-migration cf-typegen clean setup all

# Default target
help:
	@echo "Available commands:"
	@echo "  make install          - Install dependencies with bun"
	@echo "  make dev              - Build and start wrangler dev (API + Frontend together)"
	@echo "  make dev-watch        - Auto-rebuild on file changes + wrangler dev"
	@echo "  make build            - Build the frontend to dist/"
	@echo "  make deploy           - Build and deploy to Cloudflare Workers"
	@echo "  make generate         - Generate Prisma client"
	@echo "  make create-migration - Create a new D1 migration"
	@echo "  make migrate-local    - Apply migrations to local D1"
	@echo "  make migrate-remote   - Apply migrations to remote D1"
	@echo "  make cf-typegen       - Generate Cloudflare Worker types"
	@echo "  make clean            - Clean build artifacts"

# Install dependencies
install:
	bun install

# Build frontend (required before wrangler dev)
build:
	bunx vite build

# Development - build then run wrangler dev (serves API + static assets together)
dev: build
	bunx wrangler dev

# Development with watch - auto-rebuild on changes
dev-watch:
	bunx concurrently \"bunx vite build --watch\" \"bunx wrangler dev\"

# Deploy to production
deploy: build
	bunx wrangler deploy

# Generate Prisma client
generate:
	bunx prisma generate

# Create a new D1 migration
create-migration:
	@read -p "Enter migration name: " name; \
	bunx wrangler d1 migrations create sadakabox $$name

# Generate SQL from Prisma schema for a migration
diff-migration:
	bunx prisma migrate diff --from-local-d1 --to-schema ./prisma/schema.prisma --script

# Apply migrations locally
migrate-local:
	bunx wrangler d1 migrations apply sadakabox --local

# Apply migrations to remote
migrate-remote:
	bunx wrangler d1 migrations apply sadakabox --remote

# Generate Cloudflare Worker types
cf-typegen:
	bunx wrangler types

# Clean build artifacts
clean:
	rm -rf node_modules dist .wrangler

# Quick setup for new developers
setup: install generate cf-typegen
	@echo "Setup complete! Run 'make dev' to start development."

# All-in-one: generate, typegen, build, and dev
all: generate cf-typegen dev
