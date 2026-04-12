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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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
    id: makeId(),
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

console.log(`\nSeeding ${sparks.length} sparks into Azurite...\n`);

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
