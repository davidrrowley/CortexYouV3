# Local development

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| Azure Functions Core Tools | v4 | `npm i -g azure-functions-core-tools@4 --unsafe-perm true` |
| Azurite (Storage emulator) | latest | `npm i -g azurite` |
| Static Web Apps CLI | latest | `npm i -g @azure/static-web-apps-cli` |
| just (task runner) | latest | `winget install Casey.Just` |
| Azure CLI | latest | https://aka.ms/installazurecliwindows |

---

## One-time setup

```powershell
# 1. Install npm workspaces dependencies
just install

# 2. Create local.settings.json for Azure Functions
# (check apps/api/local.settings.json — already committed with Azurite defaults)

# 3. Bootstrap Azurite containers
#    Start Azurite first in a terminal: just dev-storage
just bootstrap-storage
```

---

## Daily development

Open three terminals:

**Terminal 1 — Storage emulator**
```powershell
just dev-storage
```

**Terminal 2 — API (Azure Functions on :7071)**
```powershell
just dev-api
```

**Terminal 3 — Frontend (Vite on :3000)**
```powershell
just dev-web
```

Alternatively, use the SWA CLI for a fully integrated experience (includes GitHub auth emulation):
```powershell
just dev
# Opens http://localhost:4280
```

---

## Environment variables

| Variable | Location | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `apps/web/.env.local` | Leave empty when using SWA CLI proxy |
| `AzureWebJobsStorage` | `apps/api/local.settings.json` | Azurite connection string |
| `STORAGE_ACCOUNT_NAME` | `apps/api/local.settings.json` | `devstoreaccount1` for local |
| `STORAGE_ACCOUNT_KEY` | `apps/api/local.settings.json` | Azurite dev key |

---

## Storage containers

| Container | Purpose |
|---|---|
| `cortexyou-items` | Canonical JSON for sparks / concepts / areas |
| `cortexyou-raw` | User-uploaded media files |
| `cortexyou-derived` | `index.json`, `graph.json` |
| `cortexyou-logs` | Immutable event log (JSONL append blobs) |
| `cortexyou-exports` | Export bundles |

---

## Common tasks

```powershell
just typecheck      # Type-check both apps
just lint           # ESLint both apps
just build          # Production build
just deploy         # Deploy to Azure Static Web Apps
```

