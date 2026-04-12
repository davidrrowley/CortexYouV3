import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  ContainerClient,
} from '@azure/storage-blob';

const connectionString = process.env.STORAGE_CONNECTION_STRING;
const accountName = process.env.STORAGE_ACCOUNT_NAME ?? 'devstoreaccount1';
const accountKey = process.env.STORAGE_ACCOUNT_KEY;
const blobEndpoint = process.env.STORAGE_BLOB_ENDPOINT;

const CONTAINERS = {
  items: process.env.STORAGE_CONTAINER_ITEMS ?? 'cortexyou-items',
  raw: process.env.STORAGE_CONTAINER_RAW ?? 'cortexyou-raw',
  derived: process.env.STORAGE_CONTAINER_DERIVED ?? 'cortexyou-derived',
  logs: process.env.STORAGE_CONTAINER_LOGS ?? 'cortexyou-logs',
  exports: process.env.STORAGE_CONTAINER_EXPORTS ?? 'cortexyou-exports',
} as const;

export type ContainerName = keyof typeof CONTAINERS;

function getBlobServiceClient(): BlobServiceClient {
  if (connectionString) {
    // Connection string covers both Azurite (UseDevelopmentStorage=true) and explicit keys
    return BlobServiceClient.fromConnectionString(connectionString);
  }
  if (blobEndpoint && accountKey) {
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    return new BlobServiceClient(blobEndpoint, credential);
  }
  // Production – use DefaultAzureCredential via managed identity
  const { DefaultAzureCredential } = require('@azure/identity');
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
}

export function getContainerClient(container: ContainerName): ContainerClient {
  return getBlobServiceClient().getContainerClient(CONTAINERS[container]);
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

export async function readJson<T>(
  container: ContainerName,
  blobPath: string,
): Promise<T | null> {
  try {
    const cc = getContainerClient(container);
    const blob = cc.getBlobClient(blobPath);
    const exists = await blob.exists();
    if (!exists) return null;
    const buf = await blob.downloadToBuffer();
    return JSON.parse(buf.toString('utf-8')) as T;
  } catch {
    return null;
  }
}

export async function writeJson(
  container: ContainerName,
  blobPath: string,
  data: unknown,
): Promise<void> {
  const cc = getContainerClient(container);
  const client = cc.getBlockBlobClient(blobPath);
  const body = JSON.stringify(data, null, 2);
  await client.upload(body, Buffer.byteLength(body, 'utf-8'), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
}

export async function deleteBlob(
  container: ContainerName,
  blobPath: string,
): Promise<void> {
  const cc = getContainerClient(container);
  await cc.getBlockBlobClient(blobPath).deleteIfExists();
}

export async function listBlobPaths(
  container: ContainerName,
  prefix: string,
): Promise<string[]> {
  const cc = getContainerClient(container);
  const paths: string[] = [];
  for await (const blob of cc.listBlobsFlat({ prefix })) {
    paths.push(blob.name);
  }
  return paths;
}

// ─── SAS token generation ─────────────────────────────────────────────────────

const SAS_TTL_MINUTES = parseInt(
  process.env.SAS_TOKEN_TTL_MINUTES ?? '15',
  10,
);

export function generateUploadSas(blobPath: string): string {
  if (!accountKey) {
    throw new Error(
      'Cannot generate SAS token without a storage account key. ' +
        'In production use user delegation SAS with a managed identity.',
    );
  }
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + SAS_TTL_MINUTES * 60 * 1000);
  const sas = generateBlobSASQueryParameters(
    {
      containerName: CONTAINERS.raw,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse('cw'), // create + write only
      expiresOn,
    },
    credential,
  ).toString();
  const endpoint = blobEndpoint
    ? blobEndpoint
    : `https://${accountName}.blob.core.windows.net`;
  return `${endpoint}/${CONTAINERS.raw}/${blobPath}?${sas}`;
}

export function sasExpiresAt(): string {
  return new Date(
    Date.now() + SAS_TTL_MINUTES * 60 * 1000,
  ).toISOString();
}

// ─── Append-only log ──────────────────────────────────────────────────────────

export async function appendLog(entry: Record<string, unknown>): Promise<void> {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const logPath = `events/${yyyy}/${mm}/${dd}.jsonl`;

  const cc = getContainerClient('logs');
  const appendClient = cc.getAppendBlobClient(logPath);

  // Create if not exists
  await appendClient.createIfNotExists();
  const line = JSON.stringify(entry) + '\n';
  await appendClient.appendBlock(line, Buffer.byteLength(line, 'utf-8'));
}
