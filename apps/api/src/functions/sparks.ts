import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import {
  readJson,
  writeJson,
  listBlobPaths,
  appendLog,
} from '../lib/blobStorage';
import type { Spark, Concept } from '../types/models';
import { ulid } from 'ulid';
import { enrichSparkWithConcepts } from '../lib/conceptEnricher';

function conceptPath(id: string) {
  return `concepts/${id}.json`;
}

function sparkPath(id: string) {
  return `sparks/${id}.json`;
}

function json(data: unknown, status = 200): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

// ─── GET /api/sparks ──────────────────────────────────────────────────────────

async function listSparks(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const q = (req.query.get('q') ?? '').toLowerCase();
  const status = req.query.get('status') ?? '';
  const contentType = req.query.get('contentType') ?? '';
  const tag = req.query.get('tag') ?? '';
  const conceptId = req.query.get('conceptId') ?? '';
  const limit = Math.min(parseInt(req.query.get('limit') ?? '50', 10), 200);
  const sort = req.query.get('sort') === 'updatedAt' ? 'updatedAt' : 'createdAt';
  const order = req.query.get('order') === 'asc' ? 'asc' : 'desc';

  const paths = await listBlobPaths('items', 'sparks/');
  const sparks: Spark[] = [];

  for (const path of paths) {
    const spark = await readJson<Spark>('items', path);
    if (!spark || spark.deletedAt) continue;
    if (status && spark.status !== status) continue;
    if (contentType && spark.contentType !== contentType) continue;
    if (tag && !spark.tags.includes(tag)) continue;
    if (conceptId && !spark.conceptIds.includes(conceptId)) continue;
    if (q) {
      const searchable = [
        spark.title,
        spark.summary,
        spark.whyItMatters,
        spark.bodyMarkdown,
        ...spark.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(q)) continue;
    }
    sparks.push(spark);
  }

  sparks.sort((a, b) => {
    const av = new Date(a[sort]).getTime();
    const bv = new Date(b[sort]).getTime();
    return order === 'desc' ? bv - av : av - bv;
  });

  return json({ items: sparks.slice(0, limit), total: sparks.length });
}

// ─── GET /api/sparks/{id} ─────────────────────────────────────────────────────

async function getSpark(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const id = req.params.id;
  const spark = await readJson<Spark>('items', sparkPath(id));
  if (!spark || spark.deletedAt) return json({ error: 'Not found' }, 404);
  return json(spark);
}

// ─── POST /api/sparks ─────────────────────────────────────────────────────────

async function createSpark(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  let body: Partial<Spark>;
  try {
    body = (await req.json()) as Partial<Spark>;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.title?.trim()) return json({ error: 'title is required' }, 422);

  const now = new Date().toISOString();
  const spark: Spark = {
    id: `spark_${ulid()}`,
    type: 'spark',
    title: body.title.trim(),
    summary: body.summary ?? '',
    whyItMatters: body.whyItMatters ?? '',
    contentType: body.contentType ?? 'note',
    bodyMarkdown: body.bodyMarkdown ?? '',
    sourceUrl: body.sourceUrl ?? null,
    media: body.media ?? [],
    tags: body.tags ?? [],
    conceptIds: body.conceptIds ?? [],
    areaIds: body.areaIds ?? [],
    status: body.status ?? 'inbox',
    createdAt: now,
    updatedAt: now,
    capturedAt: body.capturedAt ?? now,
    links: body.links ?? [],
    metadata: {
      device: body.metadata?.device ?? '',
      captureMethod: body.metadata?.captureMethod ?? 'quick-add',
      sourceTitle: body.metadata?.sourceTitle ?? null,
    },
  };

  await writeJson('items', sparkPath(spark.id), spark);
  await appendLog({
    id: ulid(),
    timestamp: now,
    action: 'create',
    entityType: 'spark',
    entityId: spark.id,
    summary: `Created spark: ${spark.title}`,
    userId: auth.principal.userId,
  });

  // ── AI concept enrichment (fire-and-update, non-blocking on error) ──────────
  try {
    const conceptPaths = await listBlobPaths('items', 'concepts/');
    const allConcepts: Concept[] = [];
    for (const p of conceptPaths) {
      const c = await readJson<Concept>('items', p);
      if (c && !c.deletedAt) allConcepts.push(c);
    }

    const enrichment = await enrichSparkWithConcepts(spark, allConcepts);
    const enrichedConceptIds = [...new Set([...spark.conceptIds, ...enrichment.matchedConceptIds])];

    // Create any net-new concepts the model proposed
    for (const proposed of enrichment.newConcepts) {
      const newConceptNow = new Date().toISOString();
      const newConcept: Concept = {
        id: `concept_${ulid()}`,
        type: 'concept',
        name: proposed.name.trim(),
        description: proposed.description.trim(),
        tags: [],
        createdAt: newConceptNow,
        updatedAt: newConceptNow,
      };
      await writeJson('items', conceptPath(newConcept.id), newConcept);
      await appendLog({
        id: ulid(),
        timestamp: newConceptNow,
        action: 'create',
        entityType: 'concept',
        entityId: newConcept.id,
        summary: `AI-suggested concept: ${newConcept.name}`,
        userId: auth.principal.userId,
      });
      enrichedConceptIds.push(newConcept.id);
    }

    if (enrichedConceptIds.length > 0) {
      spark.conceptIds = enrichedConceptIds;
      spark.updatedAt = new Date().toISOString();
      await writeJson('items', sparkPath(spark.id), spark);
    }
  } catch (err) {
    // Enrichment failure must never block the 201 response
    console.error('[conceptEnricher] failed:', err);
  }

  return json(spark, 201);
}

// ─── PUT /api/sparks/{id} ─────────────────────────────────────────────────────

async function updateSpark(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const id = req.params.id;
  const existing = await readJson<Spark>('items', sparkPath(id));
  if (!existing || existing.deletedAt) return json({ error: 'Not found' }, 404);

  let body: Partial<Spark>;
  try {
    body = (await req.json()) as Partial<Spark>;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Prevent overwriting protected fields
  const { id: _id, type: _type, createdAt: _ca, ...updates } = body as Record<string, unknown>;
  const updated: Spark = {
    ...existing,
    ...(updates as Partial<Spark>),
    id: existing.id,
    type: 'spark',
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await writeJson('items', sparkPath(id), updated);
  await appendLog({
    id: ulid(),
    timestamp: updated.updatedAt,
    action: 'update',
    entityType: 'spark',
    entityId: id,
    summary: `Updated spark: ${updated.title}`,
    userId: auth.principal.userId,
  });

  return json(updated);
}

// ─── DELETE /api/sparks/{id} ──────────────────────────────────────────────────

async function deleteSpark(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const id = req.params.id;
  const existing = await readJson<Spark>('items', sparkPath(id));
  if (!existing || existing.deletedAt) return json({ error: 'Not found' }, 404);

  const now = new Date().toISOString();
  const softDeleted: Spark = { ...existing, deletedAt: now, updatedAt: now };
  await writeJson('items', sparkPath(id), softDeleted);
  await appendLog({
    id: ulid(),
    timestamp: now,
    action: 'delete',
    entityType: 'spark',
    entityId: id,
    summary: `Soft-deleted spark: ${existing.title}`,
    userId: auth.principal.userId,
  });

  return { status: 204 };
}

// ─── Register routes ──────────────────────────────────────────────────────────

app.http('sparks-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sparks',
  handler: listSparks,
});

app.http('sparks-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'sparks',
  handler: createSpark,
});

app.http('sparks-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'sparks/{id}',
  handler: getSpark,
});

app.http('sparks-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'sparks/{id}',
  handler: updateSpark,
});

app.http('sparks-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'sparks/{id}',
  handler: deleteSpark,
});
