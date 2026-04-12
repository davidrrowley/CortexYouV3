import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import {
  listBlobPaths,
  readJson,
  getContainerClient,
  appendLog,
} from '../lib/blobStorage';
import type { Spark, Concept, Area } from '../types/models';
import { ulid } from 'ulid';

function json(data: unknown, status = 200): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

async function exportBundle(
  req: HttpRequest,
  _ctx: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) return { status: 401 };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportId = `${timestamp}_${ulid()}`;

  const manifest: {
    exportId: string;
    createdAt: string;
    sparks: number;
    concepts: number;
    areas: number;
  } = {
    exportId,
    createdAt: new Date().toISOString(),
    sparks: 0,
    concepts: 0,
    areas: 0,
  };

  const exportsContainer = getContainerClient('exports');

  // Export sparks
  const sparkPaths = await listBlobPaths('items', 'sparks/');
  for (const path of sparkPaths) {
    const spark = await readJson<Spark>('items', path);
    if (!spark) continue;
    const blob = exportsContainer.getBlockBlobClient(
      `${exportId}/items/${path}`,
    );
    const body = JSON.stringify(spark, null, 2);
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    if (!spark.deletedAt) manifest.sparks++;
  }

  // Export concepts
  const conceptPaths = await listBlobPaths('items', 'concepts/');
  for (const path of conceptPaths) {
    const concept = await readJson<Concept>('items', path);
    if (!concept) continue;
    const blob = exportsContainer.getBlockBlobClient(
      `${exportId}/items/${path}`,
    );
    const body = JSON.stringify(concept, null, 2);
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    if (!concept.deletedAt) manifest.concepts++;
  }

  // Export areas
  const areaPaths = await listBlobPaths('items', 'areas/');
  for (const path of areaPaths) {
    const area = await readJson<Area>('items', path);
    if (!area) continue;
    const blob = exportsContainer.getBlockBlobClient(
      `${exportId}/items/${path}`,
    );
    const body = JSON.stringify(area, null, 2);
    await blob.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    if (!area.deletedAt) manifest.areas++;
  }

  // Write manifest
  const manifestBlob = exportsContainer.getBlockBlobClient(
    `${exportId}/manifest.json`,
  );
  const manifestBody = JSON.stringify(manifest, null, 2);
  await manifestBlob.upload(manifestBody, Buffer.byteLength(manifestBody), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });

  await appendLog({
    id: ulid(),
    timestamp: manifest.createdAt,
    action: 'export',
    entityType: 'system',
    entityId: exportId,
    summary: `Exported ${manifest.sparks} sparks, ${manifest.concepts} concepts`,
    userId: auth.principal.userId,
  });

  return json(manifest);
}

app.http('export', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'export',
  handler: exportBundle,
});
