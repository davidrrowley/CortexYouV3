import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import { buildIndex, buildGraph } from '../lib/graphBuilder';
import { appendLog } from '../lib/blobStorage';
import { ulid } from 'ulid';

function json(data: unknown, status = 200): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function rebuildIndex(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const index = await buildIndex();
  await appendLog({
    id: ulid(),
    timestamp: new Date().toISOString(),
    action: 'index_rebuild',
    entityType: 'system',
    entityId: 'derived/index.json',
    summary: `Rebuilt index with ${index.items.length} entries`,
    userId: auth.principal.userId,
  });

  return json({ generatedAt: index.generatedAt, count: index.items.length });
}

async function rebuildGraph(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const graph = await buildGraph();
  await appendLog({
    id: ulid(),
    timestamp: new Date().toISOString(),
    action: 'graph_rebuild',
    entityType: 'system',
    entityId: 'derived/graph.json',
    summary: `Rebuilt graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
    userId: auth.principal.userId,
  });

  return json({
    generatedAt: graph.generatedAt,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
  });
}

app.http('rebuild-index', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'rebuild/index',
  handler: rebuildIndex,
});

app.http('rebuild-graph', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'rebuild/graph',
  handler: rebuildGraph,
});
