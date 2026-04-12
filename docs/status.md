# CortexYou V3 — Current Status

> Last updated: April 12, 2026

## What is this?

CortexYou V3 is a personal knowledge graph app. You capture sparks (ideas, quotes, insights), the system groups them under concepts (themes), and you can explore the connections visually and chat with the graph using GPT-4.1.

---

## Live deployment

| Resource | Value |
|---|---|
| URL | https://delightful-desert-028378503.7.azurestaticapps.net |
| Platform | Azure Static Web Apps |
| GitHub repo | `davidrrowley/CortexYouV3` |
| Storage account | `cortexyoustorageacct` |
| Blob container | `cortexyou-items` |
| AI model | GPT-4.1 via Azure AI Foundry |

---

## Architecture

```
Browser (React + Vite + Carbon)
    │
    ▼
Azure Static Web Apps
    ├── apps/web/dist          — React frontend
    └── apps/api/              — Azure Functions v4 (Node 20)
            ├── /api/me             — auth check
            ├── /api/sparks         — CRUD sparks
            ├── /api/concepts       — CRUD concepts
            ├── /api/relationships  — manage edges
            ├── /api/upload-sas     — blob SAS upload
            ├── /api/rebuild        — re-index graph
            ├── /api/export         — export data
            └── /api/chat           — GPT-4.1 over full graph context
```

Data is stored as JSON blobs in Azure Blob Storage:
- `sparks/{uuid}.json` — individual spark items
- `concepts/{concept-id}.json` — concept/theme nodes

---

## Feature inventory

### Graph view (`apps/web/src/views/GraphView.tsx`)
- Cytoscape.js + cytoscape-fcose layout
- Dark canvas (`#0d1117`), neon glows per node type
- Spark nodes: no text labels visible on canvas — hover shows a fixed-position flyout tooltip
- Concept nodes: label always visible
- Clicking a node opens a frosted-glass detail panel (right side)
- Neighbour dimming on selection
- Per-type edge colours (spark→concept, concept→concept, etc.)
- **"Chat with graph" button** in toolbar opens `<ChatPanel>`

### Chat panel (`apps/web/src/components/ChatPanel.tsx`)
- Slide-in drawer from the right
- 5 prompt starters shown on empty state
- Full message history with user/assistant bubbles
- Enter to send, Shift+Enter for newline
- "Clear conversation" button
- Sends full graph as system context to GPT-4.1 on every request
- Streaming: no (simple request/response)

### API functions (`apps/api/src/functions/`)
| File | Route | Purpose |
|---|---|---|
| `me.ts` | GET /api/me | Auth identity check |
| `sparks.ts` | GET/POST/PATCH/DELETE /api/sparks | Spark CRUD |
| `concepts.ts` | GET/POST/PATCH/DELETE /api/concepts | Concept CRUD |
| `relationships.ts` | POST /api/relationships | Manage concept↔spark edges |
| `uploadSas.ts` | POST /api/upload-sas | Generate SAS token for direct blob upload |
| `rebuild.ts` | POST /api/rebuild | Re-index / recompute graph edges |
| `export.ts` | GET /api/export | Download full graph as JSON |
| `chat.ts` | POST /api/chat | GPT-4.1 chat with full graph context |

### Authentication
- GitHub auth via Azure SWA managed auth
- Functions check `x-ms-client-principal` header

---

## AI integration

### Chat (`/api/chat`)
- Loads all spark + concept blobs from storage
- Builds a rich markdown system prompt including spark titles, summaries, body content, tags, and concept cross-links
- Sends to `${AZURE_OPENAI_ENDPOINT}/chat/completions` with `model: AZURE_OPENAI_DEPLOYMENT`
- Returns `{ reply: string }`

### Concept enrichment (on spark create)
- When a spark is saved, AI matches it to existing concepts and patches `conceptIds`
- Falls back to tag-based matching if no AI config

### Required environment variables (Azure portal → SWA → Environment variables)
```
AZURE_OPENAI_ENDPOINT    https://[foundry-host]/api/projects/[project]/openai/v1
AZURE_OPENAI_API_KEY     [key from Foundry]
AZURE_OPENAI_DEPLOYMENT  gpt-4.1
STORAGE_CONNECTION_STRING  DefaultEndpointsProtocol=https;AccountName=...
```

---

## Seed data

10 sparks and 7 concepts with stable hardcoded IDs are in:
- `infra/seed-sparks.mjs`
- `infra/seed-concepts.mjs`

### Running locally (Azurite)
```bash
node infra/seed-sparks.mjs
node infra/seed-concepts.mjs
```

### Running against production storage
```bash
STORAGE_CONNECTION_STRING="DefaultEndpoints..." node infra/seed-sparks.mjs
STORAGE_CONNECTION_STRING="DefaultEndpoints..." node infra/seed-concepts.mjs
```

### Utility scripts
| Script | Purpose |
|---|---|
| `infra/clean-concepts.mjs` | Delete all concept blobs and clear conceptIds from sparks |
| `infra/enrich-existing-sparks.mjs` | One-shot AI enrichment to match existing sparks to concepts |

---

## Local development

```bash
just dev
```

Runs concurrently:
1. SWA CLI (proxy on port 4280)
2. Vite dev server (port 5173)
3. Azure Functions local runtime (port 7071)

Local storage: Azurite (`UseDevelopmentStorage=true`)

Local settings: `apps/api/local.settings.json`

---

## CI/CD

GitHub Actions: `.github/workflows/azure-static-web-apps-delightful-desert-028378503.yml`

Triggers on push to `main`:
1. Build `apps/web` (Vite)
2. Build `apps/api` (TypeScript → dist)
3. Deploy to Azure SWA

---

## Known constraints

- Chat loads **all** blobs on every request — fine up to ~500 sparks, consider Qdrant vector search beyond that
- No streaming — chat waits for full GPT response before rendering
- Single user — auth is GitHub, no multi-tenancy
