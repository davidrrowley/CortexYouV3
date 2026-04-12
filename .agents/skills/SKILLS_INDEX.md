# Skills Index

This template ships **174 bundled skills** across three tiers, available immediately on clone — no setup required.

A **skill** is a reusable capability with a defined contract:

- `SKILL.md` — intent, trigger language, workflow, examples
- `prompt.md` — execution prompt (where present)
- `rubric.md` — quality evaluation (where present)

**Updating skills:** Run `scripts/update-skills.ps1` to pull the latest versions from both upstream Microsoft repositories and commit the changes.

---

## Skill Tiers

| Tier | Source | Count | Description |
|------|--------|-------|-------------|
| **Native** | This template | 13 | Architecture, delivery, security, doc, UX skills |
| **Azure Workflow** | [microsoft/azure-skills](https://github.com/microsoft/azure-skills) | 25 | End-to-end Azure provisioning, deployment, diagnostics |
| **Core** | [microsoft/skills](https://github.com/microsoft/skills) `.github/skills/` | 9 | Language-agnostic: architect, MCP, Entra, Copilot SDK |
| **SDK — Python** | [microsoft/skills](https://github.com/microsoft/skills) | 42 | Azure SDK usage patterns for Python |
| **SDK — .NET** | [microsoft/skills](https://github.com/microsoft/skills) | 29 | Azure SDK usage patterns for .NET / C# |
| **SDK — TypeScript** | [microsoft/skills](https://github.com/microsoft/skills) | 24 | Azure SDK usage patterns for TypeScript |
| **SDK — Java** | [microsoft/skills](https://github.com/microsoft/skills) | 26 | Azure SDK usage patterns for Java |
| **SDK — Rust** | [microsoft/skills](https://github.com/microsoft/skills) | 7 | Azure SDK usage patterns for Rust |
| **Total** | | **174** | |

Use this index to understand what capabilities already exist before creating new ones.

---

## Tier 1: Native Template Skills (13)

### Orchestration & Delivery

| Skill | Purpose |
|-------|---------|
| `orchestration-routing` | Route work to specialist agents, enforce phase gates, maintain coordination |
| `spec-normalisation` | Convert raw requirements into structured, testable specs |
| `task-breakdown` | Turn specs and plans into executable task lists |

### Architecture & Engineering

| Skill | Purpose |
|-------|---------|
| `architecture-review` | Orchestrating 8-phase architecture review: C4 diagrams, WAF, threat model, domain model, ADRs |
| `adr-writing` | Convert decisions into ADRs with context, options, and consequences |
| `code-review` | Review implementation for quality, maintainability, and standards alignment |
| `domain-driven-design` | Event storming, bounded contexts, aggregates, context mapping, microservice heuristics |
| `api-design` | Contract-first API design: REST, GraphQL, gRPC, error contracts, pagination, versioning |
| `threat-modelling` | STRIDE threat modelling with DFD, DREAD scoring, mitigation register |
| `mermaid-diagrams` | C4 context/container, sequence, flowchart, ER, state, class, GitGraph diagrams |

### UX & Design

| Skill | Purpose |
|-------|---------|
| `ux-carbon-critique` | Evaluate UX against IBM Carbon guidance and accessibility expectations |

### Security & Quality

| Skill | Purpose |
|-------|---------|
| `security-review` | Identify security risks and suggest mitigations |
| `doc-hygiene` | Improve documentation clarity, consistency, and traceability |

---

## Tier 2: Azure Workflow Skills (25)

From [microsoft/azure-skills](https://github.com/microsoft/azure-skills). Maintained by Microsoft with authoritative Azure workflows.

### Agent-to-skill mapping

| Agent | Skills to invoke |
|-------|----------------|
| `azure-fullstack` | azure-prepare, azure-validate, azure-deploy, azure-diagnostics, azure-cost-optimization, azure-compute, azure-kubernetes, azure-resource-visualizer, azure-enterprise-infra-planner, azure-observability, azure-storage, azure-upgrade, appinsights-instrumentation |
| `terraform-iac` | azure-prepare, azure-validate, azure-deploy, azure-enterprise-infra-planner, azure-cost-optimization, azure-kubernetes |
| `appsec-tooling` | azure-rbac, azure-compliance, entra-app-registration |
| `cicd-engineer` | azure-validate, azure-deploy, azure-diagnostics, azure-cloud-migrate |
| `architect` | azure-resource-visualizer, azure-enterprise-infra-planner, azure-quotas |
| `threat-model` | azure-compliance |

### Skill catalogue

| Skill | Purpose |
|-------|---------|
| `azure-prepare` | Scaffold Azure infra (Bicep/Terraform/azd), set up azure.yaml and Dockerfiles |
| `azure-validate` | Pre-deployment validation: config, Bicep/Terraform, permissions, prerequisites |
| `azure-deploy` | Execute deployments (`azd up`, `az deployment`, `terraform apply`) with error recovery |
| `azure-diagnostics` | Debug production issues using AppLens, Azure Monitor, resource health |
| `azure-cost-optimization` | Identify cost savings, orphaned resources, rightsizing opportunities |
| `azure-compute` | VM/VMSS recommendations, pricing, autoscale, connectivity troubleshooting |
| `azure-kubernetes` | Plan and configure AKS clusters (SKU, networking, security, autoscale) |
| `azure-enterprise-infra-planner` | Architect enterprise topology: landing zones, hub-spoke, multi-region |
| `azure-resource-visualizer` | Generate Mermaid architecture diagrams from Azure resource groups |
| `azure-resource-lookup` | List and find Azure resources across subscriptions |
| `azure-observability` | Set up Azure Monitor, Application Insights, Log Analytics, Workbooks |
| `appinsights-instrumentation` | Instrument apps with Application Insights SDK, telemetry patterns |
| `azure-storage` | Blob, File, Queue, Table, Data Lake — configuration and lifecycle |
| `azure-upgrade` | Upgrade Azure hosting plans, tiers, or SKUs |
| `azure-ai` | Azure AI Search, Speech, OpenAI, Document Intelligence |
| `azure-aigateway` | Configure Azure API Management as an AI gateway |
| `azure-kusto` | KQL queries for Azure Data Explorer / Log Analytics |
| `azure-messaging` | Troubleshoot Event Hubs and Service Bus SDK issues |
| `azure-rbac` | Find least-privilege RBAC roles and generate assignment Bicep/CLI |
| `azure-compliance` | Run compliance audits (azqr), Key Vault expiration checks |
| `azure-quotas` | Check/manage Azure quotas and capacity before provisioning |
| `azure-cloud-migrate` | Assess and migrate cross-cloud workloads (AWS/GCP → Azure) |
| `entra-app-registration` | Register Entra ID apps, configure OAuth 2.0, set up MSAL |
| `microsoft-foundry` | Deploy and evaluate Foundry agents, manage models and RBAC |
| `azure-hosted-copilot-sdk` | Build and deploy GitHub Copilot SDK apps to Azure |

---

## Tier 3: Core Skills (9)

From [microsoft/skills](https://github.com/microsoft/skills) `.github/skills/`. Language-agnostic, workflow-focused.

| Skill | Purpose |
|-------|---------|
| `cloud-solution-architect` | Design cloud architectures, select patterns, produce architecture artefacts |
| `continual-learning` | Encode lessons learned and update skill knowledge bases |
| `copilot-sdk` | Build and integrate GitHub Copilot SDK apps |
| `entra-agent-id` | Configure Entra ID for agent workloads and managed identities |
| `frontend-design-review` | Review frontend code against design system and UX standards |
| `github-issue-creator` | Create well-structured GitHub issues from requirements or bug reports |
| `mcp-builder` | Build Model Context Protocol (MCP) servers and tools |
| `podcast-generation` | Generate podcast scripts and audio content from source material |
| `skill-creator` | Create new SKILL.md files following the skills contract |

---

## Tier 4: SDK Skills (128)

From [microsoft/skills](https://github.com/microsoft/skills) plugin bundles. Each skill provides usage patterns, code samples, and best practices for a specific Azure SDK package. Invoke these skills when writing or reviewing code that uses the corresponding SDK.

### Python (42 skills)

| Skill | SDK |
|-------|-----|
| `agent-framework-azure-ai-py` | Microsoft Agent Framework + Azure AI |
| `agents-v2-py` | Azure AI Agents v2 |
| `azure-ai-contentsafety-py` | Azure AI Content Safety |
| `azure-ai-contentunderstanding-py` | Azure AI Content Understanding |
| `azure-ai-language-conversations-py` | Azure AI Language — Conversations |
| `azure-ai-ml-py` | Azure Machine Learning |
| `azure-ai-projects-py` | Azure AI Projects |
| `azure-ai-textanalytics-py` | Azure AI Text Analytics |
| `azure-ai-transcription-py` | Azure AI Transcription |
| `azure-ai-translation-document-py` | Azure AI Translation — Documents |
| `azure-ai-translation-text-py` | Azure AI Translation — Text |
| `azure-ai-vision-imageanalysis-py` | Azure AI Vision Image Analysis |
| `azure-ai-voicelive-py` | Azure AI Voice Live |
| `azure-appconfiguration-py` | Azure App Configuration |
| `azure-containerregistry-py` | Azure Container Registry |
| `azure-cosmos-db-py` | Azure Cosmos DB (latest SDK) |
| `azure-cosmos-py` | Azure Cosmos DB |
| `azure-data-tables-py` | Azure Data Tables |
| `azure-eventgrid-py` | Azure Event Grid |
| `azure-eventhub-py` | Azure Event Hubs |
| `azure-identity-py` | Azure Identity / DefaultAzureCredential |
| `azure-keyvault-py` | Azure Key Vault |
| `azure-messaging-webpubsubservice-py` | Azure Web PubSub |
| `azure-mgmt-apicenter-py` | Azure API Center (management) |
| `azure-mgmt-apimanagement-py` | Azure API Management (management) |
| `azure-mgmt-botservice-py` | Azure Bot Service (management) |
| `azure-mgmt-fabric-py` | Microsoft Fabric (management) |
| `azure-monitor-ingestion-py` | Azure Monitor — Log Ingestion |
| `azure-monitor-opentelemetry-exporter-py` | Azure Monitor OpenTelemetry Exporter |
| `azure-monitor-opentelemetry-py` | Azure Monitor OpenTelemetry |
| `azure-monitor-query-py` | Azure Monitor — Query |
| `azure-search-documents-py` | Azure AI Search |
| `azure-servicebus-py` | Azure Service Bus |
| `azure-speech-to-text-rest-py` | Azure Speech-to-Text REST |
| `azure-storage-blob-py` | Azure Blob Storage |
| `azure-storage-file-datalake-py` | Azure Data Lake Storage |
| `azure-storage-file-share-py` | Azure File Storage |
| `azure-storage-queue-py` | Azure Queue Storage |
| `fastapi-router-py` | FastAPI Router patterns |
| `hosted-agents-v2-py` | Azure AI Hosted Agents v2 |
| `m365-agents-py` | Microsoft 365 Agents |
| `pydantic-models-py` | Pydantic model patterns |

### .NET / C# (29 skills)

| Skill | SDK |
|-------|-----|
| `azure-ai-agents-persistent-dotnet` | Azure AI Agents — Persistent state |
| `azure-ai-document-intelligence-dotnet` | Azure AI Document Intelligence |
| `azure-ai-openai-dotnet` | Azure OpenAI |
| `azure-ai-projects-dotnet` | Azure AI Projects |
| `azure-ai-voicelive-dotnet` | Azure AI Voice Live |
| `azure-eventgrid-dotnet` | Azure Event Grid |
| `azure-eventhub-dotnet` | Azure Event Hubs |
| `azure-identity-dotnet` | Azure Identity / DefaultAzureCredential |
| `azure-maps-search-dotnet` | Azure Maps Search |
| `azure-mgmt-apicenter-dotnet` | Azure API Center (management) |
| `azure-mgmt-apimanagement-dotnet` | Azure API Management (management) |
| `azure-mgmt-applicationinsights-dotnet` | Application Insights (management) |
| `azure-mgmt-arizeaiobservabilityeval-dotnet` | Arize AI Observability eval (management) |
| `azure-mgmt-botservice-dotnet` | Azure Bot Service (management) |
| `azure-mgmt-fabric-dotnet` | Microsoft Fabric (management) |
| `azure-mgmt-mongodbatlas-dotnet` | MongoDB Atlas on Azure (management) |
| `azure-mgmt-weightsandbiases-dotnet` | Weights & Biases on Azure (management) |
| `azure-resource-manager-cosmosdb-dotnet` | Cosmos DB (ARM) |
| `azure-resource-manager-durabletask-dotnet` | Durable Task (ARM) |
| `azure-resource-manager-mysql-dotnet` | Azure Database for MySQL (ARM) |
| `azure-resource-manager-playwright-dotnet` | Azure Playwright Testing (ARM) |
| `azure-resource-manager-postgresql-dotnet` | Azure Database for PostgreSQL (ARM) |
| `azure-resource-manager-redis-dotnet` | Azure Cache for Redis (ARM) |
| `azure-resource-manager-sql-dotnet` | Azure SQL Database (ARM) |
| `azure-search-documents-dotnet` | Azure AI Search |
| `azure-security-keyvault-keys-dotnet` | Azure Key Vault Keys |
| `azure-servicebus-dotnet` | Azure Service Bus |
| `m365-agents-dotnet` | Microsoft 365 Agents |
| `microsoft-azure-webjobs-extensions-authentication-events-dotnet` | Azure WebJobs Auth Events |

### TypeScript (24 skills)

| Skill | SDK |
|-------|-----|
| `azure-ai-contentsafety-ts` | Azure AI Content Safety |
| `azure-ai-document-intelligence-ts` | Azure AI Document Intelligence |
| `azure-ai-projects-ts` | Azure AI Projects |
| `azure-ai-translation-ts` | Azure AI Translation |
| `azure-ai-voicelive-ts` | Azure AI Voice Live |
| `azure-appconfiguration-ts` | Azure App Configuration |
| `azure-cosmos-ts` | Azure Cosmos DB |
| `azure-eventhub-ts` | Azure Event Hubs |
| `azure-identity-ts` | Azure Identity / DefaultAzureCredential |
| `azure-keyvault-keys-ts` | Azure Key Vault Keys |
| `azure-keyvault-secrets-ts` | Azure Key Vault Secrets |
| `azure-microsoft-playwright-testing-ts` | Azure Playwright Testing |
| `azure-monitor-opentelemetry-ts` | Azure Monitor OpenTelemetry |
| `azure-postgres-ts` | Azure Database for PostgreSQL |
| `azure-search-documents-ts` | Azure AI Search |
| `azure-servicebus-ts` | Azure Service Bus |
| `azure-storage-blob-ts` | Azure Blob Storage |
| `azure-storage-file-share-ts` | Azure File Storage |
| `azure-storage-queue-ts` | Azure Queue Storage |
| `azure-web-pubsub-ts` | Azure Web PubSub |
| `frontend-ui-dark-ts` | Frontend dark mode UI patterns |
| `m365-agents-ts` | Microsoft 365 Agents |
| `react-flow-node-ts` | React Flow node patterns |
| `zustand-store-ts` | Zustand state store patterns |

### Java (26 skills)

| Skill | SDK |
|-------|-----|
| `azure-ai-agents-persistent-java` | Azure AI Agents — Persistent state |
| `azure-ai-anomalydetector-java` | Azure AI Anomaly Detector |
| `azure-ai-contentsafety-java` | Azure AI Content Safety |
| `azure-ai-formrecognizer-java` | Azure AI Form Recognizer |
| `azure-ai-projects-java` | Azure AI Projects |
| `azure-ai-vision-imageanalysis-java` | Azure AI Vision Image Analysis |
| `azure-ai-voicelive-java` | Azure AI Voice Live |
| `azure-appconfiguration-java` | Azure App Configuration |
| `azure-communication-callautomation-java` | Azure Communication — Call Automation |
| `azure-communication-callingserver-java` | Azure Communication — Calling Server |
| `azure-communication-chat-java` | Azure Communication — Chat |
| `azure-communication-common-java` | Azure Communication Common |
| `azure-communication-sms-java` | Azure Communication — SMS |
| `azure-compute-batch-java` | Azure Batch Compute |
| `azure-cosmos-java` | Azure Cosmos DB |
| `azure-data-tables-java` | Azure Data Tables |
| `azure-eventgrid-java` | Azure Event Grid |
| `azure-eventhub-java` | Azure Event Hubs |
| `azure-identity-java` | Azure Identity / DefaultAzureCredential |
| `azure-messaging-webpubsub-java` | Azure Web PubSub |
| `azure-monitor-ingestion-java` | Azure Monitor — Log Ingestion |
| `azure-monitor-opentelemetry-exporter-java` | Azure Monitor OpenTelemetry Exporter |
| `azure-monitor-query-java` | Azure Monitor — Query |
| `azure-security-keyvault-keys-java` | Azure Key Vault Keys |
| `azure-security-keyvault-secrets-java` | Azure Key Vault Secrets |
| `azure-storage-blob-java` | Azure Blob Storage |

### Rust (7 skills)

| Skill | SDK |
|-------|-----|
| `azure-cosmos-rust` | Azure Cosmos DB |
| `azure-eventhub-rust` | Azure Event Hubs |
| `azure-identity-rust` | Azure Identity |
| `azure-keyvault-certificates-rust` | Azure Key Vault Certificates |
| `azure-keyvault-keys-rust` | Azure Key Vault Keys |
| `azure-keyvault-secrets-rust` | Azure Key Vault Secrets |
| `azure-storage-blob-rust` | Azure Blob Storage |

---

## Updating Skills

Run from the repo root:

```powershell
# Update bundled skills (commit result to share with team)
powershell -ExecutionPolicy Bypass -File .\scripts\update-skills.ps1

# Also install at user level (~/.agents/skills/) for VS Code auto-discovery
powershell -ExecutionPolicy Bypass -File .\scripts\update-skills.ps1 -UserLevel
```

After running, commit `.agents/skills/` to propagate updates to all contributors.

The script pulls from two upstream repos:
- `https://github.com/microsoft/skills` — Core + SDK skills
- `https://github.com/microsoft/azure-skills` — Azure workflow skills

---

## Adding a new skill

1. Create a folder under `.agents/skills/<skill-name>/`
2. Add a `SKILL.md` with intent, trigger language, workflow
3. Update this index

### Naming convention

Use kebab-case, action-oriented names: `architecture-review`, `azure-storage`, `code-review`.

### When to create vs use existing

Create a new skill when the task is repeatable, has a clear input/output contract, and benefits from a quality rubric. Use an existing skill for one-off tasks.
