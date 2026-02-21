# SadakaBox - Makefile
# Cloudflare Worker project with integrated React frontend

.PHONY: help install dev dev-watch build deploy generate migrate create-migration cf-typegen clean setup all

# Default target
help:
	@echo "Available commands:"
	@echo "  make install          - Install dependencies with bun"
	@echo "  make dev              - Start Vite dev server with HMR (API + Frontend together)"
	@echo "  make dev-watch        - Same as dev (HMR is built-in)"
	@echo "  make build            - Build for production"
	@echo "  make deploy           - Build and deploy to Cloudflare Workers"
	@echo "  make db-generate      - Generate Drizzle migrations"
	@echo "  make create-migration - Create a new D1 migration"
	@echo "  make migrate-local    - Apply migrations to local D1"
	@echo "  make migrate-remote   - Apply migrations to remote D1"
	@echo "  make cf-typegen       - Generate Cloudflare Worker types"
	@echo "  make clean            - Clean build artifacts"

# Install dependencies
install:
	bun install

# Build for production
build:
	bunx vite build

# Development - start Vite dev server with HMR (API + Frontend together via @cloudflare/vite-plugin)
dev:
	bunx vite dev

# Deploy to production
deploy: build
	bunx wrangler deploy

# Generate Drizzle migrations
db-generate:
	bunx drizzle-kit generate

# Create a new D1 migration
create-migration:
	@read -p "Enter migration name: " name; \
	bunx wrangler d1 migrations create sadakabox $$name

# Push schema changes directly (for development)
db-push:
	bunx drizzle-kit push

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
setup: install cf-typegen
	@echo "Setup complete! Run 'make dev' to start development."

# All-in-one: generate, typegen, build, and dev
all: cf-typegen dev
