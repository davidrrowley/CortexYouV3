---
name: architecture-review
description: >-
  Conduct a systematic, multi-dimensional architecture review. Produces C4 diagrams, WAF
  assessment, threat model, domain model evaluation, and ADR candidates. Invoke when the user
  asks to review, validate, audit, or assess an architecture, system design, or technical
  approach. Triggers: "review this architecture", "architecture assessment", "WAF review",
  "Well-Architected", "is this design sound", "architecture quality", "technical review",
  "architecture feedback", "assess my design", "validate architecture".
---

# Architecture Review

An architecture review is a structured, evidence-based assessment. This skill orchestrates the
right sub-skills for each dimension. **Do not skip phases** — a review that misses security or
operability is incomplete.

---

## Inputs Required

Gather these before proceeding. Ask if missing.

| Input | Source | Required? |
|-------|--------|-----------|
| System description or spec | `specs/**/spec.md` or user description | Yes |
| Non-functional requirements | spec.md constraints section or from user | Yes |
| Existing diagrams or design docs | Provided in conversation | If available |
| Deployment target (Azure / cloud / on-prem) | spec or user | Yes |
| Data classification (PII? regulated?) | spec or user | Yes |
| Traffic profile (TPS, peak load) | spec or user | Recommended |

---

## Review Phases

Work through all phases in order. Produce a deliverable at each gate.

---

### Phase 1 — Scope and Goals

Before drawing anything, establish:

1. **System boundary** — what is in scope vs. out of scope?
2. **Quality attribute priorities** — rank these for this system:
   - Reliability / availability (SLA target?)
   - Security (data classification, compliance)
   - Performance (latency / throughput targets)
   - Scalability (growth projections)
   - Maintainability (team size, deployment frequency)
   - Cost (budget constraints)
3. **Constraints** — mandated tech stack, existing platform, regulatory requirements
4. **Existing decisions** — what has already been decided and cannot change?

**Gate:** Quality attribute ranking confirmed + constraints documented before proceeding.

---

### Phase 2 — C4 Context Diagram (Level 1)

> **Invoke `mermaid-diagrams` skill** for syntax guidance and templates.

Draw the system in its environment:

- The system under review (one box)
- External actors (users, external systems, data sources)
- Data flows between them (label each arrow with protocol + data type)

**Questions to answer:**
- Who are the users and what do they send/receive?
- Which external systems does this talk to?
- Where does the system boundary end?
- Which integrations are synchronous vs. asynchronous?

**Gate:** All external dependencies identified; data flows labelled with protocol.

---

### Phase 3 — C4 Container Diagram (Level 2)

> **Invoke `mermaid-diagrams` skill** for C4Container syntax.

Inside the system boundary, identify:

- Each container (API, web app, background worker, database, message queue, cache)
- Technology choice for each
- Communication patterns between containers (sync REST, async events, SQL, etc.)
- Data stores and what they hold
- Where secrets / credentials live

**Questions to answer:**
- Is state stored in the right tier (cache vs. DB vs. event log)?
- Is there a single point of failure?
- Which containers share a database (coupling risk)?
- Is there a clear API boundary that can be versioned?

**Gate:** All containers placed; no unnamed data stores; communication paths are explicit.

---

### Phase 4 — Domain Model Review

> **Invoke `domain-driven-design` skill** for bounded context and aggregate analysis.

Assess the domain model:

- Are bounded contexts correctly identified and separated?
- Do aggregates enforce the right invariants?
- Is there inappropriate coupling (shared tables, shared domain objects)?
- Are domain events used where necessary for decoupling?
- Does the microservice or module decomposition follow domain boundaries?

**Findings format:**

```
Domain concern: <name>
Finding: <what is right or wrong>
Risk: <what goes wrong if this is not fixed>
Recommendation: <concrete change>
```

---

### Phase 5 — API and Integration Review

> **Invoke `api-design` skill** for REST/GraphQL/gRPC contracts and review checklist.

For each integration identified in Phase 2–3:

- Is the right protocol chosen?
- Are resource URLs, methods, and response codes correct?
- Is error contract standardised (RFC 9457 Problem Details)?
- Is pagination implemented for list endpoints?
- Is versioning strategy defined?
- Are authentication and authorisation applied at the right layer?

---

### Phase 6 — Threat Model

> **Invoke `threat-modelling` skill** for STRIDE analysis and mitigations.

Using the DFD from Phase 3 as input:

1. Identify trust boundaries on the container diagram
2. Apply STRIDE to each external-facing component and data flow
3. Score each threat with DREAD
4. Produce mitigation record for each risk ≥ 6

**Minimum coverage required:**
- [ ] Authentication on all external entry points
- [ ] Authorisation at API + data layer
- [ ] Data in transit encrypted (TLS 1.2 minimum)
- [ ] Data at rest encrypted for PII / regulated data
- [ ] Injection prevention (SQL, command, SSRF)
- [ ] Secrets management (no credentials in code)
- [ ] Audit logging for all privileged actions

---

### Phase 7 — Well-Architected Framework Review

> **Invoke `cloud-solution-architect` skill** for WAF pillar assessment.

Assess each of the five pillars at the appropriate depth for this system:

| Pillar | Key questions |
|--------|--------------|
| **Reliability** | Is there a health model? What fails over automatically? What is the RTO/RPO? |
| **Security** | Is the blast radius limited? Is defence in depth applied? |
| **Cost Optimisation** | Are correct SKUs chosen? Is there autoscaling or reserved capacity? |
| **Operational Excellence** | Is there structured logging, distributed tracing, alerting? |
| **Performance Efficiency** | Is the bottleneck identified? Are caching layers appropriate? |

For Azure deployments, check specific services against their WAF guidance.

---

### Phase 8 — ADR Candidates

> **Invoke `adr-writing` skill** for each significant decision.

Any finding that implies a significant, reversible-with-cost decision must produce an ADR candidate. Minimum criteria:

- Decision with ≥ 2 reasonable alternatives
- Cannot easily be changed later without rework
- Affects multiple teams or system boundaries

Capture as:
```
ADR candidate: <title>
Decision required: <what choice must be made>
Options: <option A>, <option B>, <option C>
Recommendation: <option> because <rationale>
```

---

## Review Output Template

```markdown
# Architecture Review — <System Name>
Date: <YYYY-MM-DD>
Reviewer: <agent / person>
Review scope: <what was reviewed>

## Executive Summary
<2–4 sentences: overall health, top 3 risks, recommended actions>

## Quality Attribute Priorities
| Attribute | Priority | Target |
|-----------|----------|--------|
| Reliability | High | 99.9% uptime |
| Security | High | SOC 2 Type II |
| ... | ... | ... |

## C4 Diagrams
[Context diagram]
[Container diagram]

## Domain Model Assessment
[Bounded context map]
[Key findings]

## API Review Findings
| Endpoint / Integration | Finding | Severity | Action |
|------------------------|---------|----------|--------|

## Threat Model Summary
[STRIDE findings table]
[Top 3 risks with DREAD scores]
[Mitigation status]

## WAF Assessment
| Pillar | Score (1–5) | Key Gaps | Recommendations |
|--------|-------------|----------|-----------------|

## ADR Candidates
[List with status: proposed / decided]

## Risks Register
| Risk | Likelihood | Impact | Owner | Mitigation |
|------|-----------|--------|-------|-----------|

## Open Questions
| Question | Owner | Due |
|----------|-------|-----|
```

---

## Quality Bar

A review is **incomplete** if any of the following is missing:

- [ ] C4 Context diagram produced
- [ ] C4 Container diagram produced
- [ ] At least one trust boundary identified
- [ ] STRIDE applied to external-facing components
- [ ] WAF pillar assessment completed
- [ ] All significant decisions have an ADR candidate
- [ ] Risks register populated with mitigations

---

## Common Findings

| Finding | Risk | Typical Recommendation |
|---------|------|----------------------|
| Shared database between services | Tight coupling; schema changes break multiple services | Separate schemas per service; use events for cross-service data |
| Synchronous calls to slow external APIs | Latency and availability coupling | Introduce async queue; cache responses where TTL allows |
| No structured error contract | API consumers cannot handle errors reliably | Adopt RFC 9457 Problem Details |
| Credentials in environment variables without Key Vault | Credential leak via config dump or log | Move to managed identity or Key Vault reference |
| Single-region deployment with no DR plan | Entire system lost in a region outage | Define RPO/RTO; add passive replica or geo-redundant storage |
| No distributed tracing | Debugging cross-service issues is guesswork | Add OpenTelemetry with correlation IDs on all service entry points |
| Unbounded list queries | Memory and timeout issues at scale | Enforce pagination with cursor on all list endpoints |
