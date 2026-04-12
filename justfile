set windows-shell := ["powershell.exe", "-Command"]

default:
	@just --list

# ─── Install ──────────────────────────────────────────────────────────────────

install:
	npm install

# ─── Development ─────────────────────────────────────────────────────────────

# Start Azurite blob emulator (requires: npm i -g azurite)
dev-storage:
	azurite --silent --location .azurite --skipApiVersionCheck

# Create all Azurite containers (Azurite must be running first)
bootstrap-storage:
	node infra/bootstrap-blob.mjs

# Seed initial sparks from OneNote export (Azurite must be running first)
seed:
	node infra/seed-sparks.mjs

# Seed concepts inferred from sparks (run after seed)
seed-concepts:
	node infra/seed-concepts.mjs

# Start Azure Functions host (port 7071) using Node 20 via fnm
dev-api: build-api
	fnm env --shell powershell | Invoke-Expression; fnm use 20; Set-Location apps/api; func start --port 7071

# Start Vite dev server (port 3000)
dev-web:
	cd apps/web && npm run dev

# Start everything: Azurite (if not running), API (Node 20), Vite, SWA CLI.
dev:
	-Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
	-Get-NetTCPConnection -LocalPort 7071 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
	Start-Process pwsh -ArgumentList '-NoProfile', '-Command', "Set-Location '{{justfile_directory()}}\apps\web'; npm run dev; Read-Host 'Vite exited'"
	Start-Process pwsh -ArgumentList '-NoProfile', '-Command', "Set-Location '{{justfile_directory()}}\apps\api'; fnm env --shell powershell | Invoke-Expression; fnm use 20; npm run build; func start --port 7071; Read-Host 'API exited'"
	Write-Host 'Waiting for Vite :3000 and API :7071...'
	while (!(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) -or !(Get-NetTCPConnection -LocalPort 7071 -State Listen -ErrorAction SilentlyContinue)) { Start-Sleep -Milliseconds 500 }
	Write-Host 'All services ready. Starting SWA CLI...'
	swa start --config swa-cli.config.json --app-devserver-url http://localhost:3000

# ─── Build ────────────────────────────────────────────────────────────────────

build-api:
	fnm env --shell powershell | Invoke-Expression; fnm use 20; Set-Location apps/api; npm run build

build-web:
	cd apps/web && npm run build

build: build-api build-web

# ─── Type-check & Lint ────────────────────────────────────────────────────────

typecheck-web:
	cd apps/web && npx tsc --noEmit

typecheck-api:
	cd apps/api && npx tsc --noEmit

typecheck: typecheck-web typecheck-api

fmt:
	npx prettier --write "apps/**/*.{ts,tsx,json}"

lint:
	npx eslint apps/web/src apps/api/src

test:
	@echo "No tests configured yet."

# ─── Deploy ───────────────────────────────────────────────────────────────────

deploy:
	swa deploy --config swa-cli.config.json --env production
