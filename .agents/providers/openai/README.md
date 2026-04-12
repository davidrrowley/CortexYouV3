# OpenAI provider artefacts

## Files

- `assistants.json` — assistant definitions for the OpenAI Assistants API. Each entry maps to an agent in `.agents/registry/agents.v1.yml` and references the canonical system prompt in `.agents/prompts/*/system.md`.

## Usage

Create assistants via the OpenAI platform or the `/v1/assistants` API using the `instructions_file` content as the assistant's system instructions. `AGENTS.md` at repo root provides the context entry point for all agents.

## Keeping in sync

When adding a new agent to `.agents/registry/agents.v1.yml`, add a corresponding entry in `assistants.json`. Model tier (`gpt-4o-mini` vs `gpt-4o`) should match the `cost_profile.default_model` in the registry.
