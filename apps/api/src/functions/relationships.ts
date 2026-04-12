import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import { readJson, writeJson, appendLog } from '../lib/blobStorage';
import type { Spark, EdgeType } from '../types/models';
import { ulid } from 'ulid';

const VALID_EDGE_TYPES: EdgeType[] = [
  'relates_to',
  'supports',
  'examples',
  'inspired_by',
  'belongs_to',
];

function json(data: unknown, status = 200): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function createRelationship(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  let body: { sourceId?: unknown; targetId?: unknown; type?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { sourceId, targetId, type } = body;
  if (typeof sourceId !== 'string' || !sourceId.startsWith('spark_')) {
    return json({ error: 'sourceId must be a spark id' }, 422);
  }
  if (typeof targetId !== 'string') {
    return json({ error: 'targetId is required' }, 422);
  }
  if (!VALID_EDGE_TYPES.includes(type as EdgeType)) {
    return json(
      { error: `type must be one of: ${VALID_EDGE_TYPES.join(', ')}` },
      422,
    );
  }

  const sparkPath = `sparks/${sourceId}.json`;
  const spark = await readJson<Spark>('items', sparkPath);
  if (!spark || spark.deletedAt) return json({ error: 'Spark not found' }, 404);

  // Avoid duplicate links
  const exists = spark.links.some(
    (l) => l.targetId === targetId && l.type === type,
  );
  if (exists) return json({ message: 'Relationship already exists' }, 200);

  const now = new Date().toISOString();
  const updated: Spark = {
    ...spark,
    conceptIds:
      type === 'belongs_to' && targetId.startsWith('concept_')
        ? [...new Set([...spark.conceptIds, targetId])]
        : spark.conceptIds,
    links: [
      ...spark.links,
      {
        targetId: targetId as string,
        type: type as EdgeType,
        createdBy: 'user',
        createdAt: now,
      },
    ],
    updatedAt: now,
  };

  await writeJson('items', sparkPath, updated);
  await appendLog({
    id: ulid(),
    timestamp: now,
    action: 'relationship_add',
    entityType: 'relationship',
    entityId: `${sourceId}__${targetId}__${type}`,
    summary: `Added ${type} from ${sourceId} → ${targetId}`,
    userId: auth.principal.userId,
  });

  return json({ message: 'Relationship created' }, 201);
}

async function deleteRelationship(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  let body: { sourceId?: unknown; targetId?: unknown; type?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { sourceId, targetId, type } = body;
  if (typeof sourceId !== 'string' || typeof targetId !== 'string') {
    return json({ error: 'sourceId and targetId are required' }, 422);
  }

  const sparkPath = `sparks/${sourceId}.json`;
  const spark = await readJson<Spark>('items', sparkPath);
  if (!spark || spark.deletedAt) return json({ error: 'Spark not found' }, 404);

  const now = new Date().toISOString();
  const updated: Spark = {
    ...spark,
    conceptIds:
      type === 'belongs_to'
        ? spark.conceptIds.filter((c) => c !== targetId)
        : spark.conceptIds,
    links: spark.links.filter(
      (l) => !(l.targetId === targetId && l.type === type),
    ),
    updatedAt: now,
  };

  await writeJson('items', sparkPath, updated);
  await appendLog({
    id: ulid(),
    timestamp: now,
    action: 'relationship_remove',
    entityType: 'relationship',
    entityId: `${sourceId}__${targetId}__${type}`,
    summary: `Removed ${type} from ${sourceId} → ${targetId}`,
    userId: auth.principal.userId,
  });

  return { status: 204 };
}

app.http('relationships-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'relationships',
  handler: createRelationship,
});

app.http('relationships-delete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'relationships',
  handler: deleteRelationship,
});
