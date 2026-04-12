#!/usr/bin/env node
/**
 * enrich-existing-sparks.mjs
 *
 * One-shot migration: loads all sparks + concepts from storage,
 * calls Azure AI Foundry to match sparks to concepts (and create new ones),
 * then patches conceptIds back onto each spark.
 *
 * Usage (local Azurite):
 *   node infra/enrich-existing-sparks.mjs
 *
 * Usage (production):
 *   $env:STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;..."
 *   $env:AZURE_OPENAI_ENDPOINT     = "https://itmifoundryrg.services.ai.azure.com/api/projects/itmi-default/openai/v1"
 *   $env:AZURE_OPENAI_API_KEY      = "your-key"
 *   $env:AZURE_OPENAI_DEPLOYMENT   = "gpt-4o"
 *   node infra/enrich-existing-sparks.mjs
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';

// ─── Storage setup ────────────────────────────────────────────────────────────

const connStr = process.env.STORAGE_CONNECTION_STRING ?? 'UseDevelopmentStorage=true';
const storageClient = BlobServiceClient.fromConnectionString(connStr);
const itemsContainer = storageClient.getContainerClient(
  process.env.STORAGE_CONTAINER_ITEMS ?? 'cortexyou-items',
);

// ─── Storage helpers ──────────────────────────────────────────────────────────

async function listBlobs(prefix) {
  const paths = [];
  for await (const blob of itemsContainer.listBlobsFlat({ prefix })) {
    paths.push(blob.name);
  }
  return paths;
}

async function readJson(path) {
  try {
    const blob = itemsContainer.getBlobClient(path);
    if (!(await blob.exists())) return null;
    const buf = await blob.downloadToBuffer();
    return JSON.parse(buf.toString('utf-8'));
  } catch {
    return null;
  }
}

async function writeJson(path, data) {
  const blob = itemsContainer.getBlockBlobClient(path);
  const body = JSON.stringify(data, null, 2);
  await blob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
}

// ─── OpenAI enrichment ────────────────────────────────────────────────────────

async function enrichSpark(spark, concepts) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o';

  if (!endpoint || !apiKey) {
    console.warn('  ⚠ No OpenAI config — skipping AI enrichment, using tag-based matching only');
    return tagBasedMatch(spark, concepts);
  }

  const conceptList = concepts.length > 0
    ? concepts.map(c => `  - id: "${c.id}", name: "${c.name}", description: "${c.description}"`).join('\n')
    : '  (none yet)';

  const prompt = `You are a knowledge-graph curator. A spark has just been captured.

Your job:
1. Look at the EXISTING CONCEPTS list.
2. Decide which concepts the spark *clearly* belongs to. Include only strong thematic matches.
3. If the spark introduces a theme not covered by any existing concept, propose one or more NEW concepts (name ≤ 5 words, description ≤ 80 chars).

Respond ONLY with valid JSON — no markdown, no prose:
{
  "matchedConceptIds": ["<id>", ...],
  "newConcepts": [{ "name": "<name>", "description": "<description>" }, ...]
}

─── SPARK ───────────────────────────────────────────────────────────────────────
Title: ${spark.title}
Summary: ${spark.summary || '(none)'}
Body: ${(spark.bodyMarkdown || '').slice(0, 600)}
Tags: ${(spark.tags || []).join(', ') || '(none)'}

─── EXISTING CONCEPTS ───────────────────────────────────────────────────────────
${conceptList}`;

  const res = await fetch(`${endpoint}/chat/completions`, {
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
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI call failed: ${res.status} ${err}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? '{}';

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { matchedConceptIds: [], newConcepts: [] };
  }

  const existingIds = new Set(concepts.map(c => c.id));
  return {
    matchedConceptIds: (parsed.matchedConceptIds ?? []).filter(id => existingIds.has(id)),
    newConcepts: (parsed.newConcepts ?? []).filter(c => c.name?.trim() && c.description?.trim()),
  };
}

// Fallback: match by overlapping tags when AI is unavailable
function tagBasedMatch(spark, concepts) {
  const sparkTags = new Set((spark.tags ?? []).map(t => t.toLowerCase()));
  const matched = concepts
    .filter(c => (c.tags ?? []).some(t => sparkTags.has(t.toLowerCase())))
    .map(c => c.id);
  return { matchedConceptIds: matched, newConcepts: [] };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading sparks and concepts from storage…');

  const [sparkPaths, conceptPaths] = await Promise.all([
    listBlobs('sparks/'),
    listBlobs('concepts/'),
  ]);

  const sparks = (await Promise.all(sparkPaths.map(p => readJson(p)))).filter(Boolean);
  const concepts = (await Promise.all(conceptPaths.map(p => readJson(p)))).filter(c => c && !c.deletedAt);

  console.log(`Found ${sparks.length} sparks, ${concepts.length} concepts\n`);

  // Work with a mutable concept list so newly created concepts can be matched later
  const allConcepts = [...concepts];

  for (const spark of sparks) {
    if (spark.deletedAt) continue;

    console.log(`→ ${spark.title}`);

    let result;
    try {
      result = await enrichSpark(spark, allConcepts);
    } catch (err) {
      console.error(`  ✗ enrichment failed: ${err.message}`);
      continue;
    }

    // Create net-new concepts
    for (const proposed of result.newConcepts) {
      const now = new Date().toISOString();
      const newConcept = {
        id: `concept_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        type: 'concept',
        name: proposed.name.trim(),
        description: proposed.description.trim(),
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      await writeJson(`concepts/${newConcept.id}.json`, newConcept);
      allConcepts.push(newConcept);
      result.matchedConceptIds.push(newConcept.id);
      console.log(`  + created concept: ${newConcept.name}`);
    }

    if (result.matchedConceptIds.length === 0) {
      console.log('  ○ no matches');
      continue;
    }

    // Merge with any existing conceptIds (don't overwrite manual ones)
    const merged = [...new Set([...(spark.conceptIds ?? []), ...result.matchedConceptIds])];
    if (merged.length === (spark.conceptIds ?? []).length &&
        merged.every(id => spark.conceptIds.includes(id))) {
      console.log(`  ○ already linked to: ${merged.join(', ')}`);
      continue;
    }

    spark.conceptIds = merged;
    spark.updatedAt = new Date().toISOString();
    await writeJson(`sparks/${spark.id}.json`, spark);
    console.log(`  ✓ linked to: ${result.matchedConceptIds.map(id => allConcepts.find(c => c.id === id)?.name ?? id).join(', ')}`);

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
