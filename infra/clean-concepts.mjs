#!/usr/bin/env node
/**
 * Deletes ALL concept blobs from storage so a clean reseed can be run.
 * Does NOT touch sparks.
 *
 * Usage (local):
 *   node infra/clean-concepts.mjs
 *
 * Usage (production):
 *   $env:STORAGE_CONNECTION_STRING = "..."
 *   node infra/clean-concepts.mjs
 */

import { BlobServiceClient } from '@azure/storage-blob';

const connStr = process.env.STORAGE_CONNECTION_STRING ?? 'UseDevelopmentStorage=true';
const client = BlobServiceClient.fromConnectionString(connStr);
const container = client.getContainerClient(
  process.env.STORAGE_CONTAINER_ITEMS ?? 'cortexyou-items',
);

let deleted = 0;
for await (const blob of container.listBlobsFlat({ prefix: 'concepts/' })) {
  await container.deleteBlob(blob.name);
  console.log(`  deleted ${blob.name}`);
  deleted++;
}

// Also clear conceptIds from all sparks so they're clean before reseed
let patched = 0;
for await (const blob of container.listBlobsFlat({ prefix: 'sparks/' })) {
  const blobClient = container.getBlobClient(blob.name);
  const buf = await blobClient.downloadToBuffer();
  const spark = JSON.parse(buf.toString('utf-8'));
  if (!spark.conceptIds?.length) continue;
  spark.conceptIds = [];
  spark.updatedAt = new Date().toISOString();
  const body = JSON.stringify(spark, null, 2);
  await container.getBlockBlobClient(blob.name).upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  patched++;
}

console.log(`\nDeleted ${deleted} concept blobs, cleared conceptIds from ${patched} sparks.`);
console.log('Now run: node infra/seed-sparks.mjs; node infra/seed-concepts.mjs');
