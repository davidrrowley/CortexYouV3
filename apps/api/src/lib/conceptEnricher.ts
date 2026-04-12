/**
 * conceptEnricher.ts
 *
 * After a spark is saved, calls Azure AI Foundry to:
 *  1. Match the spark against existing concepts (return their IDs)
 *  2. Suggest net-new concepts when no good match exists
 *
 * Config (local.settings.json / app settings):
 *   AZURE_OPENAI_ENDPOINT   – e.g. https://itmifoundryrg.services.ai.azure.com/api/projects/itmi-default/openai/v1
 *   AZURE_OPENAI_API_KEY    – your Foundry API key
 *   AZURE_OPENAI_DEPLOYMENT – model deployment name, e.g. gpt-4o (default)
 */

import OpenAI from 'openai';
import type { Spark, Concept } from '../types/models';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrichmentResult {
  /** IDs of existing concepts this spark belongs to */
  matchedConceptIds: string[];
  /** New concepts to create (name + short description) */
  newConcepts: Array<{ name: string; description: string }>;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(spark: Spark, existingConcepts: Concept[]): string {
  const conceptList =
    existingConcepts.length > 0
      ? existingConcepts
          .map((c) => `  - id: "${c.id}", name: "${c.name}", description: "${c.description}"`)
          .join('\n')
      : '  (none yet)';

  return `You are a knowledge-graph curator. A new "spark" (a small unit of insight or idea) has just been captured.

Your job:
1. Look at the EXISTING CONCEPTS list.
2. Decide which concepts the spark *clearly* belongs to. Include a concept only if it's a genuinely strong thematic match — not a superficial word match.
3. If the spark introduces a theme not covered by any existing concept, propose one or more NEW concepts (name ≤ 5 words, description ≤ 80 chars).

Respond ONLY with valid JSON in this exact shape — no markdown, no prose:
{
  "matchedConceptIds": ["<id>", ...],
  "newConcepts": [{ "name": "<name>", "description": "<description>" }, ...]
}

If no existing concepts match and no new concept is warranted, return { "matchedConceptIds": [], "newConcepts": [] }.

─── SPARK ───────────────────────────────────────────────────────────────────────
Title: ${spark.title}
Summary: ${spark.summary || '(none)'}
Body: ${spark.bodyMarkdown?.slice(0, 800) || '(none)'}
Tags: ${spark.tags.join(', ') || '(none)'}

─── EXISTING CONCEPTS ───────────────────────────────────────────────────────────
${conceptList}`;
}

// ─── Enricher ─────────────────────────────────────────────────────────────────

export async function enrichSparkWithConcepts(
  spark: Spark,
  existingConcepts: Concept[],
): Promise<EnrichmentResult> {
  const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
  const apiKey = process.env['AZURE_OPENAI_API_KEY'];
  const deployment = process.env['AZURE_OPENAI_DEPLOYMENT'] ?? 'gpt-4o';

  if (!endpoint || !apiKey) {
    // Enrichment is optional — skip gracefully when not configured
    return { matchedConceptIds: [], newConcepts: [] };
  }

  const client = new OpenAI({
    baseURL: endpoint,
    apiKey,
    // Azure AI Foundry uses api-version in query + api-key header
    defaultQuery: { 'api-version': '2025-01-01-preview' },
    defaultHeaders: { 'api-key': apiKey },
  });

  const response = await client.chat.completions.create({
    model: deployment,
    temperature: 0.2,
    max_tokens: 512,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'user', content: buildPrompt(spark, existingConcepts) },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';

  let parsed: EnrichmentResult;
  try {
    parsed = JSON.parse(raw) as EnrichmentResult;
  } catch {
    // Malformed response — degrade gracefully
    return { matchedConceptIds: [], newConcepts: [] };
  }

  // Sanitise: only return matched IDs that actually exist
  const existingIds = new Set(existingConcepts.map((c) => c.id));
  const matchedConceptIds = (parsed.matchedConceptIds ?? []).filter((id) =>
    existingIds.has(id),
  );

  const newConcepts = (parsed.newConcepts ?? []).filter(
    (c) => c.name?.trim() && c.description?.trim(),
  );

  return { matchedConceptIds, newConcepts };
}
