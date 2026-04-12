#!/usr/bin/env node
/**
 * Seed sparks from OneNote export into local Azurite blob storage.
 * Run after Azurite is started and containers are bootstrapped.
 *
 * Usage: node infra/seed-sparks.mjs
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'crypto';

const connStr = process.env.STORAGE_CONNECTION_STRING ?? 'UseDevelopmentStorage=true';
const client = BlobServiceClient.fromConnectionString(connStr);
const container = client.getContainerClient(process.env.STORAGE_CONTAINER_ITEMS ?? 'cortexyou-items');

function makeId() {
  return randomUUID();
}

const now = new Date().toISOString();

const sparks = [
  {
    id: 'dc005e6d-d34a-483d-bce5-9aadc74fd73e',
    type: 'spark',
    title: 'Conversations and actions we avoid cause stress',
    summary: 'It is often the conversation we haven\'t had and actions we haven\'t done that stresses us out.',
    whyItMatters: 'Avoidance of difficult conversations is a core driver of anxiety and team dysfunction.',
    contentType: 'quote',
    bodyMarkdown: '> It is often the conversation we haven\'t had and actions we haven\'t done that stresses us out.',
    sourceUrl: null,
    media: [],
    tags: ['leadership', 'communication', 'mental-health'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2024-05-17T07:47:00.000Z',
    updatedAt: now,
    capturedAt: '2024-05-17T07:47:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'OneNote Quotes' },
  },
  {
    id: '637f191c-5311-421a-a642-d476e36c934e',
    type: 'spark',
    title: 'Mistakes brought to lessons, not lessons to people',
    summary: 'It\'s not what lessons bring to people, it\'s the mistakes they bring to the lessons.',
    whyItMatters: 'Learning is most effective when driven by lived experience and failure, not passive content.',
    contentType: 'quote',
    bodyMarkdown: '> It\'s not what lessons bring to people, it\'s the mistakes they bring to the lessons.',
    sourceUrl: null,
    media: [],
    tags: ['learning', 'growth', 'mistakes'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2024-05-20T10:12:00.000Z',
    updatedAt: now,
    capturedAt: '2024-05-20T10:12:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'OneNote Quotes' },
  },
  {
    id: 'c2a1ab93-f45b-4922-9d87-78ba2dca3741',
    type: 'spark',
    title: 'Leadership values: Belonging, Mastery, Integrity',
    summary: 'Leadership values shared at an offsite: Belonging, Mastery and Integrity.',
    whyItMatters: 'Naming your values explicitly aligns teams and creates accountability.',
    contentType: 'note',
    bodyMarkdown: 'I recently had an offsite with my staff. In one of the sessions, we shared our leadership values. Mine were **Belonging**, **Mastery** and **Integrity**.',
    sourceUrl: 'https://www.linkedin.com/feed/',
    media: [],
    tags: ['leadership', 'values', 'culture'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2024-06-04T14:52:00.000Z',
    updatedAt: now,
    capturedAt: '2024-06-04T14:52:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'LinkedIn' },
  },
  {
    id: '320c0d23-9ba2-40d4-9200-f630d145bc06',
    type: 'spark',
    title: '7 Surprising Traits of Highly Strategic Thinkers',
    summary: 'Strategic thinkers are: bad with detail, naturally contrarian, action oriented, radically honest, take responsibility, great writers, and kinda unprofessional.',
    whyItMatters: 'Strategy is a personality type as much as a skill — these traits reframe what "strategic" actually means.',
    contentType: 'note',
    bodyMarkdown: `## The 7 Surprising Traits Of Highly Strategic Thinkers
*by Alex M H Smith / BasicArts*

1. **Bad with detail** — Zoom out to the gist rather than all the info.
2. **Naturally contrarian** — Question received wisdom; think the opposite.
3. **Action oriented** — Think about the *action*, not just the *analysis*.
4. **Radically honest** — Effectiveness requires grasping uncomfortable truths.
5. **Takes responsibility** — Own the strategy as your opinion; don't hide behind process.
6. **Great writers** — All strategy is communication.
7. **Kinda unprofessional** — Free-wheeling, playful, mischievous. Breakthroughs happen outside the boardroom.`,
    sourceUrl: null,
    media: [],
    tags: ['strategy', 'thinking', 'leadership', 'frameworks'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2024-06-15T09:31:00.000Z',
    updatedAt: now,
    capturedAt: '2024-06-15T09:31:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'OneNote Quotes' },
  },
  {
    id: '4caf9d36-81f2-4c8a-bca5-68e6e25a09a6',
    type: 'spark',
    title: 'Meet emotion with emotion, rational with rational',
    summary: 'Meet emotion with emotion, meet rational with rational — you don\'t have to be honest \'in the moment\'.',
    whyItMatters: 'Matching communication register to the other person\'s state is more effective than always leading with logic.',
    contentType: 'quote',
    bodyMarkdown: '> Meet emotion with emotion, meet rational with rational, you don\'t have to be honest \'in the moment\'\n\n— Simon Sinek',
    sourceUrl: null,
    media: [],
    tags: ['communication', 'emotional-intelligence', 'leadership'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2024-07-10T11:33:00.000Z',
    updatedAt: now,
    capturedAt: '2024-07-10T11:33:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'Simon Sinek' },
  },
  {
    id: '065147dd-79e8-456b-baf6-01e04a1384f4',
    type: 'spark',
    title: 'Uncommunicated expectations are premeditated resentments',
    summary: 'Uncommunicated expectations are premeditated resentments.',
    whyItMatters: 'Making expectations explicit is a foundation of healthy relationships and teams.',
    contentType: 'quote',
    bodyMarkdown: '> Uncommunicated expectations are premeditated resentments.\n\n— Neil Strauss',
    sourceUrl: null,
    media: [],
    tags: ['communication', 'relationships', 'expectations'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2024-07-10T11:38:00.000Z',
    updatedAt: now,
    capturedAt: '2024-07-10T11:38:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'Neil Strauss' },
  },
  {
    id: '4b25b89f-1ebf-4a48-8b43-d95825446820',
    type: 'spark',
    title: 'IT will be the HR for AI agents',
    summary: 'In the future, IT departments will be the \'HR\' for AI agents — today managing software, tomorrow onboarding AI agents.',
    whyItMatters: 'This reframes organisational structure for an AI-native future and has real implications for IT/ops roles.',
    contentType: 'note',
    bodyMarkdown: 'In the future, IT Dept will be the \'HR\' for AI agents! Today manage software, tomorrow onboard AI agents etc.\n\n*Source: Jensen Huang Keynote at CES 2025*',
    sourceUrl: null,
    media: [],
    tags: ['ai', 'future-of-work', 'it', 'agents'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2025-01-07T10:49:00.000Z',
    updatedAt: now,
    capturedAt: '2025-01-07T10:49:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'Jensen Huang — CES 2025' },
  },
  {
    id: '8898f6ba-92b4-403a-bc56-13c155d01eb3',
    type: 'spark',
    title: 'Comparison is the thief of joy',
    summary: 'Comparison is the thief of joy.',
    whyItMatters: 'A timeless reminder that measuring yourself against others undermines contentment and intrinsic motivation.',
    contentType: 'quote',
    bodyMarkdown: '> Comparison is the thief of joy.',
    sourceUrl: null,
    media: [],
    tags: ['mindset', 'happiness', 'self-awareness'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2026-01-07T09:32:00.000Z',
    updatedAt: now,
    capturedAt: '2026-01-07T09:32:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'OneNote Quotes' },
  },
  {
    id: '1620f0f8-9b85-4417-aead-2f0879a39aee',
    type: 'spark',
    title: 'Ship to Learn — don\'t ship perfect',
    summary: '"Ship to Learn" — don\'t ship perfect, ship, get feedback, adjust.',
    whyItMatters: 'Perfectionism delays learning. Shipping creates the feedback loop that makes products better.',
    contentType: 'note',
    bodyMarkdown: '"Ship to Learn" — don\'t ship perfect, ship, get feedback, adjust…\n\n*Source: GitHub*',
    sourceUrl: null,
    media: [],
    tags: ['product', 'shipping', 'learning', 'iteration'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2026-02-23T13:11:00.000Z',
    updatedAt: now,
    capturedAt: '2026-02-23T13:11:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'GitHub' },
  },
  {
    id: '2c0ac195-2d51-48a1-8ad2-0c4949492ca8',
    type: 'spark',
    title: 'Designer by heart, developer by choice',
    summary: 'Designer by heart, developer by choice.',
    whyItMatters: 'Identity matters — leading with design thinking while building things bridges empathy and execution.',
    contentType: 'quote',
    bodyMarkdown: '> Designer by heart, developer by choice.',
    sourceUrl: null,
    media: [],
    tags: ['identity', 'design', 'development', 'craft'],
    conceptIds: [],
    areaIds: [],
    status: 'inbox',
    createdAt: '2026-03-28T14:18:00.000Z',
    updatedAt: now,
    capturedAt: '2026-03-28T14:18:00.000Z',
    links: [],
    metadata: { device: 'import', captureMethod: 'manual', sourceTitle: 'OneNote Quotes' },
  },
];

// Remove duplicate blobs: same title but different ID (from earlier random-UUID seed runs)
const canonicalTitleToId = new Map(sparks.map(s => [s.title, s.id]));
let cleaned = 0;
for await (const blob of container.listBlobsFlat({ prefix: 'sparks/' })) {
  const blobClient = container.getBlobClient(blob.name);
  try {
    const buf = await blobClient.downloadToBuffer();
    const existing = JSON.parse(buf.toString('utf-8'));
    const canonicalId = canonicalTitleToId.get(existing.title);
    if (canonicalId && canonicalId !== existing.id) {
      await container.deleteBlob(blob.name);
      console.log(`  removed duplicate: "${existing.title}" (${existing.id})`);
      cleaned++;
    }
  } catch { /* skip unreadable blobs */ }
}
if (cleaned) console.log(`\nRemoved ${cleaned} duplicate(s).\n`);

console.log(`\nSeeding ${sparks.length} sparks...\n`);

let ok = 0;
for (const spark of sparks) {
  const blobPath = `sparks/${spark.id}.json`;
  const blob = container.getBlockBlobClient(blobPath);
  const body = JSON.stringify(spark, null, 2);
  try {
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    console.log(`  ✓ ${spark.title}`);
    ok++;
  } catch (err) {
    console.error(`  ✗ ${spark.title}: ${err.message}`);
  }
}

console.log(`\n${ok}/${sparks.length} sparks seeded.\n`);
