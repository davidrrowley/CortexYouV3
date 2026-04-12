import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { requireAuth } from '../lib/auth';
import { generateUploadSas, sasExpiresAt } from '../lib/blobStorage';
import { ulid } from 'ulid';

const MAX_SIZE_BYTES = parseInt(process.env.UPLOAD_MAX_SIZE_BYTES ?? '52428800', 10); // 50 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
]);

async function uploadSas(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(req);
  if ('error' in auth) {
    return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let body: { filename?: unknown; mimeType?: unknown; sizeBytes?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return { status: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { filename, mimeType, sizeBytes } = body;

  if (typeof filename !== 'string' || !filename.trim()) {
    return { status: 422, body: JSON.stringify({ error: 'filename is required' }) };
  }
  if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      status: 422,
      body: JSON.stringify({
        error: `mimeType must be one of: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      }),
    };
  }
  if (typeof sizeBytes !== 'number' || sizeBytes > MAX_SIZE_BYTES || sizeBytes < 1) {
    return {
      status: 422,
      body: JSON.stringify({ error: `sizeBytes must be between 1 and ${MAX_SIZE_BYTES}` }),
    };
  }

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  // Sanitise filename to prevent path traversal
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blobPath = `${yyyy}/${mm}/${ulid()}_${safeName}`;

  const uploadUrl = generateUploadSas(blobPath);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadUrl,
      blobPath,
      expiresAt: sasExpiresAt(),
    }),
  };
}

app.http('uploadSas', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'uploads/sas',
  handler: uploadSas,
});
