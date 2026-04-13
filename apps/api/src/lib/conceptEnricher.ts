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
 *   AZURE_OPENAI_API_VERSION – only needed for non-/openai/v1 endpoints (default: 2024-12-01-preview)
 */

import type { Spark, Concept } from '../types/models';

type Logger = { log: (...args: unknown[]) => void };

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
2. Decide which concepts the spark *clearly* belongs to. Include a concept only if it's a genuinely strong thematic match — not a superficial word match. Prefer matching an existing concept over creating a new one.
3. Only if the spark introduces a single dominant theme that is not covered by ANY existing concept, propose exactly ONE new concept (name ≤ 5 words, description ≤ 80 chars). If the spark touches multiple new themes, pick only the most central one.
4. If existing concepts cover the spark well enough, do NOT create new ones even if the match is imperfect.

Respond ONLY with valid JSON in this exact shape — no markdown, no prose:
{
  "matchedConceptIds": ["<id>", ...],
  "newConcepts": [{ "name": "<name>", "description": "<description>" }]
}

"newConcepts" must contain at most ONE entry. If no existing concepts match and no new concept is warranted, return { "matchedConceptIds": [], "newConcepts": [] }.

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
  logger?: Logger,
): Promise<EnrichmentResult> {
  const endpoint = process.env['AZURE_OPENAI_ENDPOINT']?.replace(/\/+$/, '');
  const apiKey = process.env['AZURE_OPENAI_API_KEY'];
  const deployment = process.env['AZURE_OPENAI_DEPLOYMENT'] ?? 'gpt-4o';
  const apiVersion = process.env['AZURE_OPENAI_API_VERSION'] ?? '2024-12-01-preview';

  if (!endpoint || !apiKey) {
    logger?.log('[conceptEnricher] skipping – AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY not set');
    return { matchedConceptIds: [], newConcepts: [] };
  }

  // Match chat.ts: /openai/v1 endpoints don't need api-version in the path
  const chatUrl = endpoint.includes('/openai/v1')
    ? `${endpoint}/chat/completions`
    : `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  logger?.log(`[conceptEnricher] POST ${chatUrl} model=${deployment} concepts=${existingConcepts.length}`);

  const aiResponse = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      model: deployment,
      temperature: 0.2,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildPrompt(spark, existingConcepts) }],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text().catch(() => '(unreadable)');
    logger?.log(`[conceptEnricher] upstream error ${aiResponse.status}: ${errText}`);
    return { matchedConceptIds: [], newConcepts: [] };
  }

  const data = await aiResponse.json() as {
    choices?: Array<{ message: { content: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  logger?.log(`[conceptEnricher] raw response: ${raw}`);

  let parsed: EnrichmentResult;
  try {
    parsed = JSON.parse(raw) as EnrichmentResult;
  } catch {
    logger?.log('[conceptEnricher] failed to parse JSON response');
    return { matchedConceptIds: [], newConcepts: [] };
  }

  // Sanitise: only return matched IDs that actually exist
  const existingIds = new Set(existingConcepts.map((c) => c.id));
  const matchedConceptIds = (parsed.matchedConceptIds ?? []).filter((id) =>
    existingIds.has(id),
  );

  // Cap at one new concept regardless of what the model returns
  const newConcepts = (parsed.newConcepts ?? [])
    .filter((c) => c.name?.trim() && c.description?.trim())
    .slice(0, 1);

  logger?.log(`[conceptEnricher] matched=${matchedConceptIds.length} new=${newConcepts.length}`);
  return { matchedConceptIds, newConcepts };
}
