# Microsoft provider artefacts

## Files

- `agents.yml` — Azure AI Foundry and Semantic Kernel agent configuration. Maps canonical agent IDs from `.agents/registry/agents.v1.yml` to Azure AI model deployments, instructions files, and tool configs.

## Usage

### Azure AI Foundry
Use the `azure_agent_name` and `instructions_file` fields when creating agents in Azure AI Studio or via the `azure-ai-projects` Python SDK.

### Semantic Kernel
Reference the `instructions_file` path to load agent system prompts into a Semantic Kernel `ChatCompletionAgent`. Use the `model_tier` field to select the correct model deployment.

## Keeping in sync

When adding or changing an agent in `.agents/registry/agents.v1.yml`, update the corresponding entry in `agents.yml`. Model tier keys (`cheap_router`, `balanced_reasoning`, `top_reasoning`) must match the `model_deployments` section at the top of `agents.yml`.
