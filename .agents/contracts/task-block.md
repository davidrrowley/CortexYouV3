# Task Block Contract

Tasks in `specs/**/tasks.md` should be written as **parseable blocks**.

This contract exists so that:
- humans can scan quickly
- agents can be routed deterministically
- CI can validate governance cheaply

## Required fields

Each task must include:

- `owner:` an agent id from `.agents/registry/agents.v1.yml`
- `acceptance:` list of acceptance criteria (observable outcomes)
- `validate:` list of validation steps (exact checks that prove it works)

## Recommended fields

- `stream:` the team/workstream (`orchestration|app|cloud|data|ux|security|quality|platform|devex`)
- `depends_on:` list of task IDs or links; leave empty or omit to signal parallel-safe work
- `intent:` 1–3 lines describing what this task is trying to achieve
- `risk:` `low | medium | high`
- `evidence:` path(s) to PR, test run, screenshots, logs (record after completion)
- `cost_profile:` `cheap_text | cheap_router | balanced_reasoning | top_reasoning`

## Parallelization

When a task has no `depends_on` (or an empty list), the Orchestrator may delegate it to a subagent in parallel with other independent tasks. Use this to model work streams that can execute concurrently:

- Frontend, backend, and infra work often have no coupling
- Tests can run in parallel once their respective components are ready
- Documentation and threat modeling can proceed alongside implementation

## Example

```md
### T-API-001: Create capture ingestion endpoint
owner: app-typescript
stream: app
depends_on: [T-ARCH-002]
risk: medium
cost_profile: balanced_reasoning
intent:
- Provide an authenticated endpoint for clients to submit capture metadata and a blob reference.

acceptance:
- Endpoint accepts metadata + blob reference
- Validates authN/authZ and size limits
- Returns 201 on success, 400 for bad input, 401 for missing token

validate:
- Unit tests pass (run: `npm test -- --grep "capture ingestion"`)
- OpenAPI spec updated with new endpoint
- Manual test recorded in docs/runbooks/api.md

evidence:
- .agents/outputs/evidence/capture-client/T-API-001.md
```
