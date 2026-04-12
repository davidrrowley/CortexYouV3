# GitHub Copilot Skills Guide

This repo ships with two connected systems: **speckit** defines *what* needs to be built (specs, plans, tasks); **`.agents/`** defines *who* builds it and *how* (agents, routing, skills). GitHub Copilot is the runtime that connects them.

> **Quick reference:** Full skill catalogue → [`.agents/skills/SKILLS_INDEX.md`](../.agents/skills/SKILLS_INDEX.md)

---

## 1. The Mental Model — Start Here

Before invoking any skill, understand how the two systems connect:

```
speckit.specify  →  specs/NNN/spec.md
speckit.plan     →  specs/NNN/plan.md
speckit.tasks    →  specs/NNN/tasks.md
                          │
              speckit-requirements agent
              GATES: spec quality + task format
                          │
          .agents/orchestrator reads tasks.md
          delegates to owner: per task block
                          │
      Each owner agent invokes its skills
      (frontend-carbon, app-python, terraform-iac…)
                          │
      check_specs.py CI validates at PR time
```

**speckit** is the input layer — it turns stakeholder notes into structured artefacts.  
**`.agents/`** is the execution layer — agents with routing rules and 174 skills do the work.  
**Skills** are invoked by agents during execution; you can also invoke them directly in Copilot Chat.

---

## 2. Your First Feature — Step by Step

If you've just cloned the repo, this is the recommended flow for any new piece of work:

### Step 1 — Spec it

```
/speckit.specify
```

Produces `specs/NNN/spec.md`. The **speckit-requirements** agent gates quality using the `spec-normalisation` skill — user stories must be in Given/When/Then, NFRs must be explicit.

### Step 2 — Plan it

```
/speckit.plan
```

Produces `specs/NNN/plan.md` with architecture artefacts, C4 diagrams, and design decisions. Routes to the **architect** agent for review, which invokes the `architecture-review` skill.

### Step 3 — Break it into tasks

```
/speckit.tasks
```

Produces `specs/NNN/tasks.md`. Every task **must** be a task block — not a legacy list item:

```md
### T-API-001: Create user endpoint
owner: app-typescript
stream: app
depends_on: []
acceptance:
- POST /users returns 201 with location header
validate:
- Run: npm test -- users.spec.ts
```

> ⚠️ Legacy `- [ ] T001` list items look like tasks but will **fail governance CI**.  
> Every task needs `owner:`, `acceptance:`, and `validate:`.

### Step 4 — Let agents execute

The orchestrator reads `tasks.md` and delegates to each `owner:` agent. Tasks with `depends_on: []` run in parallel. Each agent invokes appropriate skills from `.agents/skills/`.

### Step 5 — CI validates at PR

`scripts/spec_governance/check_specs.py` enforces:
- Task blocks exist (not legacy list format)
- `owner:` is a valid agent ID from `.agents/registry/agents.v1.yml`
- `acceptance:` and `validate:` are present on every task

### Owner assignment — quick reference

Pick `owner:` by matching the task's output path:

| Output path | Owner agent |
|-------------|-------------|
| `apps/web/**` | `frontend-carbon` |
| `apps/android/**` | `android-material` |
| `apps/windows/**` | `windows-fluent` |
| `apps/api/**` | `app-typescript` |
| Python services | `app-python` |
| `infra/**` | `terraform-iac` |
| Security / auth / RBAC | `appsec-tooling` |
| CI/CD, pipelines | `cicd-engineer` |
| `docs/architecture/**` | `architect` |
| `docs/adr/**` | `architect` |
| `specs/**` | `speckit-requirements` |

Full registry: `.agents/registry/agents.v1.yml`

---

## 3. How Skills Work

Skills are domain-specific instruction files at `.agents/skills/<name>/SKILL.md`. They contain tested workflows, output formats, and quality gates that Copilot loads as context.

GitHub Copilot matches your language against each skill's `description` field — **the description is the routing key**. You don't have to name the skill; describing your need is usually enough.

### Three ways to invoke a skill

**Natural language** — describe the task; Copilot matches the trigger words automatically:

```
"Review this architecture against WAF"           → architecture-review
"Draw a C4 container diagram"                    → mermaid-diagrams
"Run a threat model on this API"                 → threat-modelling
"Design the REST API for this service"           → api-design
"Map the bounded contexts for this domain"       → domain-driven-design
"Write an ADR for this database choice"          → adr-writing
```

**`#file:` reference** — attach the skill file directly when you want a specific workflow:

```
#file:.agents/skills/architecture-review/SKILL.md
Review the architecture in docs/architecture/architecture.md
```

Use this when Copilot picks the wrong skill, when you want a specific phase of a skill, or when chaining skills for predictable sequencing.

**Agent mode** — in Copilot agent mode, select a specialist agent from `.agents/prompts/`. Each agent has a skill invocation table built in:

| Agent | Skills it invokes |
|-------|-------------------|
| `architect` | architecture-review, mermaid-diagrams, domain-driven-design, api-design, threat-modelling, adr-writing |
| `threat-model` | threat-modelling, mermaid-diagrams, adr-writing, azure-compliance |
| `speckit-requirements` | spec-normalisation, task-breakdown, github-issue-creator |

---

## 4. The Four Skill Tiers

| Tier | Count | Use when |
|------|-------|----------|
| **Native** | 13 | General engineering: design, spec, review, delivery |
| **Azure Workflow** | 25 | Provisioning, deploying, debugging Azure workloads |
| **Core** | 9 | Cross-language architecture, agents, MCP servers |
| **SDK** | 128 | Writing code against a specific Azure SDK package |

**Rule of thumb:**
- Starting new work → Native skills  
- Deploying to Azure → Azure Workflow skills  
- Writing SDK code → SDK skills (match by service + language)  
- Designing systems → Native architecture skills + Core `cloud-solution-architect`

### Native skills (13)

`architecture-review` · `mermaid-diagrams` · `threat-modelling` · `domain-driven-design` · `api-design` · `adr-writing` · `code-review` · `security-review` · `spec-normalisation` · `task-breakdown` · `orchestration-routing` · `ux-carbon-critique` · `doc-hygiene`

### Orchestrating skills — use these as entry points

Some skills orchestrate others internally. Start at the top-level skill; don't pre-load sub-skills yourself.

| Entry point skill | Invokes |
|------------------|---------|
| `architecture-review` | mermaid-diagrams, cloud-solution-architect, threat-modelling, domain-driven-design, api-design, adr-writing |
| `orchestration-routing` | spec-normalisation, task-breakdown, adr-writing |

Example: instead of separately requesting a C4 diagram, then a WAF review, then a threat model — start `architecture-review` and it walks all 8 phases.

---

## 5. Quick Lookup by Task

### Design

| Task | Skill |
|------|-------|
| New system design from scratch | `cloud-solution-architect` |
| Review existing architecture | `architecture-review` |
| Model the domain | `domain-driven-design` |
| Design an API | `api-design` |
| Draw a diagram | `mermaid-diagrams` |
| Document a decision | `adr-writing` |
| Enterprise Azure topology | `azure-enterprise-infra-planner` |

### Build

| Task | Skill |
|------|-------|
| Scaffold Azure infra | `azure-prepare` |
| Write code using an Azure SDK | Matching `*-py` / `*-dotnet` / `*-ts` / `*-java` skill |
| Build an AI agent | `agent-framework-azure-ai-py` or `azure-ai-projects-py` |
| Build an MCP server | `mcp-builder` |
| Build a Teams / M365 agent | `m365-agents-ts` / `m365-agents-py` / `m365-agents-dotnet` |
| Add authentication | `azure-identity-*` + `entra-app-registration` |

### Deploy

| Task | Skill |
|------|-------|
| Check pre-deployment readiness | `azure-validate` |
| Run `azd up` / Bicep / Terraform | `azure-deploy` |
| Debug production issues | `azure-diagnostics` |
| Migrate from AWS/GCP | `azure-cloud-migrate` |
| Upgrade hosting plan | `azure-upgrade` |

### Review

| Task | Skill |
|------|-------|
| Code review | `code-review` |
| Security audit | `security-review` |
| Threat model | `threat-modelling` |
| Architecture review | `architecture-review` |
| UX review | `ux-carbon-critique` / `frontend-design-review` |
| Documentation cleanup | `doc-hygiene` |
| Azure compliance check | `azure-compliance` |
| Cost optimisation | `azure-cost-optimization` |

### Spec and plan

| Task | Skill |
|------|-------|
| Turn requirements into a spec | `spec-normalisation` |
| Break a spec into tasks | `task-breakdown` |
| Create GitHub issues from tasks | `github-issue-creator` |
| Write an ADR | `adr-writing` |

### Azure SDK code generation

Match by **service** and **language** — these skills pin up-to-date API patterns and avoid hallucinated calls:

```
"Connect to Cosmos DB from Python"                         → azure-cosmos-py
"Parse invoices in .NET"                                   → azure-ai-document-intelligence-dotnet
"Publish events from TypeScript"                           → azure-eventhub-ts
"Authenticate with DefaultAzureCredential in Java"         → azure-identity-java
```

Always attach SDK skills with `#file:` — they are the highest-value skills for correctness:

```
#file:.agents/skills/azure-storage-blob-ts/SKILL.md
Write a function to upload a file to a container with retry logic
```

---

## 6. Common Workflows

### New feature, from nothing

```
1. spec-normalisation    → structured spec.md
2. architecture-review   → C4 diagrams, WAF, threat model, ADR candidates
3. api-design            → OpenAPI contract
4. task-breakdown        → tasks.md with owner/acceptance/validate
5. <sdk skill>           → implementation code
6. code-review           → review pass
7. azure-validate        → pre-deployment check
8. azure-deploy          → ship it
```

### "Is this design safe to ship?"

```
1. architecture-review   → Phase 6: threat model
2. threat-modelling      → STRIDE register + mitigations
3. security-review       → OWASP / code-level findings
4. azure-compliance      → Azure resource posture
```

### "Help me understand this codebase"

```
1. architecture-review   → Phase 2–3: C4 context + container diagrams
2. domain-driven-design  → map bounded contexts from the codebase
3. mermaid-diagrams      → produce final diagrams
```

### "Set up Azure observability"

```
1. appinsights-instrumentation  → SDK setup + telemetry patterns
2. azure-observability          → Monitor, dashboards, alerts
3. azure-kusto                  → KQL queries for analysis
```

---

## 7. Tips and Anti-Patterns

**Read the skill, don't just trigger it.** Use `#file:.agents/skills/<name>/SKILL.md` and ask Copilot to summarise the phases — then steer the session using phase vocabulary.

**Provide inputs upfront.** Skills prompt for what they need. Giving spec, data classification, deployment target, and NFRs at the start produces better first-pass output.

**One skill per concern.** Don't ask a single prompt to do spec-writing, architecture, and ADRs. Invoke the right skill for each concern in sequence.

**Use `cloud-solution-architect` for green-field, `architecture-review` for existing.** `cloud-solution-architect` designs from scratch; `architecture-review` critiques what's already there.

**Commit artefacts to the repo.** ADRs → `docs/adr/`, architecture diagrams → `docs/architecture/`, threat models → `docs/security/`. Skills produce artefacts; artefacts belong in version control.

**SDK skills are always worth attaching.** Azure SDK patterns change with every version. Even when you think Copilot knows the API, attach the skill file to pin the correct patterns.

| Do | Don't |
|----|-------|
| Start with `architecture-review` for a review session | Ask disconnected questions hoping Copilot assembles a review |
| Attach `#file:` for SDK code generation | Trust Copilot's unaided knowledge for SDK API calls |
| Work through skill phases in order | Jump to Phase 5 without completing Phases 1–4 |
| Give the skill the inputs it asks for | Proceed with assumptions when the skill asks for missing data |
| Commit diagrams and ADRs to the repo | Leave artefacts only in the chat window |
| Use `cloud-solution-architect` for new designs | Use `architecture-review` on something that doesn't exist yet |

---

## 8. Keeping Skills Current

Skills are updated monthly from upstream. Run:

```powershell
# From repo root
.\scripts\update-skills.ps1

# Also install at user level for VS Code auto-discovery
.\scripts\update-skills.ps1 -UserLevel
```

Commit `.agents/skills/` after updating so all contributors get the new versions.

---

*Full skill catalogue: [`.agents/skills/SKILLS_INDEX.md`](../.agents/skills/SKILLS_INDEX.md)*
