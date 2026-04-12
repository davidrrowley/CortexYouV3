---
name: domain-driven-design
description: >-
  Apply Domain-Driven Design (DDD) to model complex business domains. Use when identifying bounded
  contexts, designing aggregates, defining domain events, running event storming, mapping context
  relationships, or structuring a microservices split around domain boundaries. Triggers: "bounded
  context", "aggregate", "domain model", "event storming", "ubiquitous language", "domain events",
  "context map", "DDD", "value object", "domain service", "anti-corruption layer", "subdomain".
---

# Domain-Driven Design

## Overview

DDD aligns software models to business reality. Apply it when the domain is complex, the team
needs a shared language with domain experts, or you are determining microservice boundaries.

---

## Core Building Blocks

### Strategic Design (shapes the big picture)

| Concept | Definition | Key Questions |
|---------|------------|---------------|
| **Domain** | The entire problem space the software addresses | What business problem are we solving? |
| **Subdomain** | Coherent part of the domain with its own rules | Is this Core, Supporting, or Generic? |
| **Bounded Context** | Explicit boundary within which a domain model applies | Where does this language/model stop making sense? |
| **Ubiquitous Language** | Shared vocabulary between domain experts and engineers | Can everyone read the code and recognise the terms? |
| **Context Map** | Visual/narrative of how bounded contexts relate | How do these contexts communicate and translate? |

**Subdomain classification:**

| Type | Description | Approach |
|------|------------|---------|
| **Core** | Competitive differentiator — the business's reason to exist | Invest, custom-build, DDD rigorously |
| **Supporting** | Necessary but not differentiating | Build simply, or buy cheap |
| **Generic** | Commodity (email, payments, auth) | Buy off-the-shelf, SaaS |

### Tactical Design (shapes the model inside a context)

| Building Block | Role | Rules |
|---------------|------|-------|
| **Entity** | Has identity that persists over time | Equality by identity, not value |
| **Value Object** | Describes something; no identity | Immutable, equality by value |
| **Aggregate** | Cluster of entities/VOs with a root | All access via Aggregate Root; enforce invariants |
| **Aggregate Root** | Single entry point to the aggregate | Only it holds a public ID; others are internal |
| **Domain Event** | Something meaningful that happened in the domain | Past tense, immutable, published after state change |
| **Domain Service** | Business operation not naturally owned by an entity | Stateless, operates on multiple aggregates |
| **Repository** | Abstraction for loading/storing aggregates | One per aggregate root; hides persistence details |
| **Factory** | Encapsulates complex creation logic | Use when constructors aren't expressive enough |

---

## Event Storming Workflow

Run when starting a new domain or decomposing a monolith into bounded contexts.

### Phase 1 — Chaotic Exploration (60-90 min)
1. Large empty surface (whiteboard / Miro / FigJam).
2. Domain experts and engineers in the same room.
3. Everyone writes **Domain Events** (orange stickies, past tense): *"Order placed"*, *"Payment failed"*.
4. No grouping yet — capture everything.

### Phase 2 — Enforce the Timeline (30 min)
5. Arrange events chronologically left to right.
6. Mark **hotspots** (pink sticky) — confusion, conflict, unknowns.
7. Identify **duplicate or synonymous events** — first language conflict found = first bounded context candidate.

### Phase 3 — Add Commands & Actors (30 min)
8. Add **Commands** (blue stickies, imperative): *"Place order"* → triggers the event.
9. Add **Actors** (yellow sticky): who or what issues the command?
10. Add **Read Models** (green sticky): what information does the actor need to decide?

### Phase 4 — Identify Aggregates (30 min)
11. Group commands + events around the **noun** they operate on → first aggregate candidates.
12. Add **Policies** (lilac sticky): "Whenever [event], then [command]" — automation rules.
13. Mark **External Systems** (pink box) crossing context boundaries.

### Phase 5 — Draw Bounded Contexts (30 min)
14. Draw boundaries around cohesive event/command clusters.
15. Name each context using the **Ubiquitous Language** of that area.
16. Identify **Context Relationships** (see below).

---

## Context Mapping Patterns

| Pattern | Relationship | When to Use |
|---------|-------------|-------------|
| **Partnership** | Two contexts evolve together | Shared team, tightly coupled release |
| **Shared Kernel** | Small shared model both contexts depend on | Core shared entities; minimise — it's a liability |
| **Customer/Supplier** | Upstream publishes, downstream consumes | Clear dependency direction; supplier controls contract |
| **Conformist** | Downstream adopts upstream model wholesale | Upstream won't negotiate; cost of ACL too high |
| **Anti-Corruption Layer (ACL)** | Downstream translates upstream model | Upstream model would corrupt the downstream domain |
| **Open Host Service** | Upstream provides protocol for many consumers | Integration hub / platform |
| **Published Language** | Shared interchange format | OpenAPI, Avro schema, domain events on a bus |
| **Separate Ways** | No integration at this time | Duplication cheaper than integration |

---

## Aggregate Design Rules

1. **Design aggregates around invariants**, not around object graph convenience.
2. **Keep aggregates small** — large aggregates create contention. One transaction = one aggregate.
3. **Reference other aggregates by ID only** — never hold a direct object reference across aggregate boundaries.
4. **Apply eventual consistency between aggregates** — use domain events + sagas/process managers for multi-aggregate operations.
5. **Enforce all invariants inside the aggregate** — nothing outside should be able to leave it in an invalid state.

### Invariant test
> "Can I enforce this business rule by checking only the state inside this aggregate?"
> If no → you either have the wrong aggregate boundary, or you need eventual consistency.

---

## Domain Events

### Naming
- Past tense, domain language: `OrderPlaced`, `PaymentFailed`, `InventoryReserved`
- Include **all data needed** for consumers to react — no lazy loading across context boundaries

### Structure
```
Event name        : OrderPlaced
Timestamp         : when it occurred
Aggregate ID      : orderId
Causation ID      : command that caused it (tracing)
Correlation ID    : business process being tracked
Payload           : { customerId, lineItems, totalAmount, shippingAddress }
```

### Event vs Command
| | Command | Domain Event |
|--|---------|--------------|
| **Intent** | Request an action | Record what happened |
| **Can fail** | Yes | No — it already happened |
| **Addressed to** | A specific handler | Anyone who cares |
| **Tense** | `PlaceOrder` | `OrderPlaced` |

---

## Common Mistakes & Corrections

| Mistake | Correction |
|---------|-----------|
| Anemic domain model (data bags with no behaviour) | Move business logic into entities and value objects |
| One giant aggregate for everything | Identify invariants; split into smaller aggregates |
| Direct object references across context boundaries | Reference by ID; use ACL or Published Language for cross-context data |
| Using the same `Order` concept across all contexts | Each context owns its own `Order` — they will diverge |
| Database schema = domain model | Domain model leads; persistence is a detail |
| Skipping Ubiquitous Language | Every naming disagreement is a model problem |

---

## Microservice Boundary Heuristics

A bounded context is the **natural candidate** for a microservice boundary. Validate with:

1. **Can it be deployed independently?** (no shared database, no synchronous calls that always succeed together)
2. **Does it have a single team?** (Conway's Law — architecture follows communication structure)
3. **Can it fail independently without cascading?** (circuit breakers possible)
4. **Does it own its data?** (no shared tables)

> If a bounded context is too large for one service, look for aggregates that can be pulled out.
> If two services always deploy together, they belong in one bounded context.

---

## Output Checklist

After applying DDD to a design:

- [ ] Subdomains identified and classified (Core / Supporting / Generic)
- [ ] Bounded contexts named with Ubiquitous Language
- [ ] Context map drawn with integration patterns labelled
- [ ] Aggregates identified with invariants stated
- [ ] Domain events named and structured
- [ ] ACLs / translation layers planned for legacy or external systems
- [ ] Microservice boundary candidates justified
- [ ] ADR written for any significant modelling decision (invoke `adr-writing` skill)
