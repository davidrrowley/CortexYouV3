import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import { readJson, writeJson, listBlobPaths, appendLog } from '../lib/blobStorage';
import type { Concept } from '../types/models';
import { ulid } from 'ulid';

function conceptPath(id: string) {
  return `concepts/${id}.json`;
}

function json(data: unknown, status = 200): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function listConcepts(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const paths = await listBlobPaths('items', 'concepts/');
  const concepts: Concept[] = [];
  for (const path of paths) {
    const c = await readJson<Concept>('items', path);
    if (!c || c.deletedAt) continue;
    concepts.push(c);
  }
  concepts.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return json({ items: concepts, total: concepts.length });
}

async function getConcept(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const c = await readJson<Concept>('items', conceptPath(req.params.id));
  if (!c || c.deletedAt) return json({ error: 'Not found' }, 404);
  return json(c);
}

async function createConcept(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  let body: Partial<Concept>;
  try {
    body = (await req.json()) as Partial<Concept>;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!body.name?.trim()) return json({ error: 'name is required' }, 422);

  const now = new Date().toISOString();
  const concept: Concept = {
    id: `concept_${ulid()}`,
    type: 'concept',
    name: body.name.trim(),
    description: body.description ?? '',
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await writeJson('items', conceptPath(concept.id), concept);
  await appendLog({
    id: ulid(),
    timestamp: now,
    action: 'create',
    entityType: 'concept',
    entityId: concept.id,
    summary: `Created concept: ${concept.name}`,
    userId: auth.principal.userId,
  });

  return json(concept, 201);
}

async function updateConcept(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const id = req.params.id;
  const existing = await readJson<Concept>('items', conceptPath(id));
  if (!existing || existing.deletedAt) return json({ error: 'Not found' }, 404);

  let body: Partial<Concept>;
  try {
    body = (await req.json()) as Partial<Concept>;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const updated: Concept = {
    ...existing,
    name: body.name?.trim() ?? existing.name,
    description: body.description ?? existing.description,
    tags: body.tags ?? existing.tags,
    updatedAt: new Date().toISOString(),
  };

  await writeJson('items', conceptPath(id), updated);
  await appendLog({
    id: ulid(),
    timestamp: updated.updatedAt,
    action: 'update',
    entityType: 'concept',
    entityId: id,
    summary: `Updated concept: ${updated.name}`,
    userId: auth.principal.userId,
  });

  return json(updated);
}

async function deleteConcept(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const id = req.params.id;
  const existing = await readJson<Concept>('items', conceptPath(id));
  if (!existing || existing.deletedAt) return json({ error: 'Not found' }, 404);

  const now = new Date().toISOString();
  await writeJson('items', conceptPath(id), {
    ...existing,
    deletedAt: now,
    updatedAt: now,
  });
  await appendLog({
    id: ulid(),
    timestamp: now,
    action: 'delete',
    entityType: 'concept',
    entityId: id,
    summary: `Soft-deleted concept: ${existing.name}`,
    userId: auth.principal.userId,
  });

  return { status: 204 };
}

app.http('concepts-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'concepts',
  handler: listConcepts,
});
app.http('concepts-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'concepts',
  handler: createConcept,
});
app.http('concepts-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'concepts/{id}',
  handler: getConcept,
});
app.http('concepts-update', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'concepts/{id}',
  handler: updateConcept,
});
app.http('concepts-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'concepts/{id}',
  handler: deleteConcept,
});
