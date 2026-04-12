#!/usr/bin/env node
/**
 * Seed concepts inferred from seeded sparks.
 * Run after seed-sparks.mjs.
 *
 * Usage: node infra/seed-concepts.mjs
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';

const connStr = 'UseDevelopmentStorage=true';
const client = BlobServiceClient.fromConnectionString(connStr);
const container = client.getContainerClient('cortexyou-items');

// Use the first (oldest-created) spark IDs — duplicates from double-seed are ignored
const SPARK_IDS = {
  avoidanceAndStress:   'dc005e6d-d34a-483d-bce5-9aadc74fd73e',
  mistakesAndLessons:   '637f191c-5311-421a-a642-d476e36c934e',
  leadershipValues:     'c2a1ab93-f45b-4922-9d87-78ba2dca3741',
  strategicThinking:    '320c0d23-9ba2-40d4-9200-f630d145bc06',
  emotionAndRational:   '4caf9d36-81f2-4c8a-bca5-68e6e25a09a6',
  expectations:         '065147dd-79e8-456b-baf6-01e04a1384f4',
  itAndAgents:          '4b25b89f-1ebf-4a48-8b43-d95825446820',
  comparisonAndJoy:     '8898f6ba-92b4-403a-bc56-13c155d01eb3',
  shipToLearn:          '1620f0f8-9b85-4417-aead-2f0879a39aee',
  designerDeveloper:    '2c0ac195-2d51-48a1-8ad2-0c4949492ca8',
};

const now = new Date().toISOString();

const concepts = [
  {
    id: randomUUID(),
    type: 'concept',
    name: 'Effective Communication',
    description: 'The practice of communicating clearly, honestly, and at the right time — matching the register (emotional vs rational) of the other person, setting explicit expectations, and having difficult conversations rather than avoiding them.',
    tags: ['communication', 'leadership', 'relationships'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    type: 'concept',
    name: 'Leadership',
    description: 'The values, behaviours, and mindsets that define effective leaders — including radical honesty, taking ownership, setting and sharing values, and developing emotional intelligence.',
    tags: ['leadership', 'values', 'culture'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    type: 'concept',
    name: 'Learning From Mistakes',
    description: 'The idea that the most powerful learning comes not from lessons themselves, but from the mistakes and lived experience people bring to them. Closely tied to a "ship to learn" iteration mindset.',
    tags: ['learning', 'growth', 'mistakes', 'iteration'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    type: 'concept',
    name: 'Strategic Thinking',
    description: 'A mode of thinking characterised by zooming out, contrarian questioning, action-orientation, and radical honesty. Strategy is communication — it is less a skill and more a personality type.',
    tags: ['strategy', 'thinking', 'frameworks'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    type: 'concept',
    name: 'AI & Future of Work',
    description: 'The emerging shift in how organisations will manage intelligence — from software to AI agents. IT departments become the "HR" for agents, onboarding and governing them like employees.',
    tags: ['ai', 'future-of-work', 'agents'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    type: 'concept',
    name: 'Mindset & Identity',
    description: 'How we define ourselves and measure our progress shapes our wellbeing and performance. Comparison undermines joy; choosing an identity (designer by heart, developer by choice) gives direction.',
    tags: ['mindset', 'identity', 'self-awareness'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    type: 'concept',
    name: 'Shipping & Iteration',
    description: 'The discipline of releasing early to create feedback loops rather than perfecting in isolation. "Ship to Learn" — progress comes from action, feedback, and adjustment.',
    tags: ['product', 'shipping', 'iteration', 'learning'],
    createdAt: now,
    updatedAt: now,
  },
];

// Map concepts to the sparks they relate to
const conceptSparkMap = {
  'Effective Communication':  [SPARK_IDS.avoidanceAndStress, SPARK_IDS.emotionAndRational, SPARK_IDS.expectations],
  'Leadership':               [SPARK_IDS.leadershipValues, SPARK_IDS.strategicThinking, SPARK_IDS.emotionAndRational, SPARK_IDS.avoidanceAndStress],
  'Learning From Mistakes':   [SPARK_IDS.mistakesAndLessons, SPARK_IDS.shipToLearn],
  'Strategic Thinking':       [SPARK_IDS.strategicThinking, SPARK_IDS.leadershipValues],
  'AI & Future of Work':      [SPARK_IDS.itAndAgents],
  'Mindset & Identity':       [SPARK_IDS.comparisonAndJoy, SPARK_IDS.designerDeveloper],
  'Shipping & Iteration':     [SPARK_IDS.shipToLearn, SPARK_IDS.mistakesAndLessons],
};

// Build conceptId lookup
const conceptByName = {};

console.log(`\nSeeding ${concepts.length} concepts into Azurite...\n`);

let ok = 0;
for (const concept of concepts) {
  conceptByName[concept.name] = concept.id;
  const blobPath = `concepts/${concept.id}.json`;
  const blob = container.getBlockBlobClient(blobPath);
  const body = JSON.stringify(concept, null, 2);
  try {
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    console.log(`  ✓ ${concept.name}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${concept.name}: ${err.message}`);
  }
}

// Back-link spark conceptIds
console.log('\nBack-linking sparks to concepts...\n');
for (const [conceptName, sparkIds] of Object.entries(conceptSparkMap)) {
  const conceptId = conceptByName[conceptName];
  for (const sparkId of sparkIds) {
    const blobPath = `sparks/${sparkId}.json`;
    const blobClient = container.getBlobClient(blobPath);
    try {
      const exists = await blobClient.exists();
      if (!exists) continue;
      const buf = await blobClient.downloadToBuffer();
      const spark = JSON.parse(buf.toString('utf-8'));
      if (!spark.conceptIds.includes(conceptId)) {
        spark.conceptIds.push(conceptId);
        spark.updatedAt = now;
      }
      const body = JSON.stringify(spark, null, 2);
      await container.getBlockBlobClient(blobPath).upload(body, Buffer.byteLength(body), {
        blobHTTPHeaders: { blobContentType: 'application/json' },
      });
      console.log(`  ✓ linked "${conceptName}" → ${spark.title}`);
    } catch (err) {
      console.error(`  ✗ ${sparkId}: ${err.message}`);
    }
  }
}

console.log(`\n${ok}/${concepts.length} concepts seeded.\n`);
