#!/usr/bin/env node
/**
 * Bootstrap Azure Blob Storage containers for CortexYou.
 * Works against Azurite (local) or a real Azure Storage account.
 *
 * Usage (Azurite):  node bootstrap-blob.mjs
 * Usage (Azure):    STORAGE_ACCOUNT_NAME=myaccount STORAGE_ACCOUNT_KEY=xxx node bootstrap-blob.mjs
 */

import { BlobServiceClient } from '@azure/storage-blob';

const CONTAINERS = [
  'cortexyou-items',
  'cortexyou-raw',
  'cortexyou-derived',
  'cortexyou-logs',
  'cortexyou-exports',
];

const accountName = process.env.STORAGE_ACCOUNT_NAME || '';
const accountKey  = process.env.STORAGE_ACCOUNT_KEY  || '';

// Use canonical Azurite shorthand locally; real credentials in production
const connStr = (accountName && accountKey)
  ? `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`
  : 'UseDevelopmentStorage=true';

const isAzurite = !accountName;
console.log(`\nTarget: ${isAzurite ? 'Azurite (local)' : `Azure Storage — ${accountName}`}`);

const client = BlobServiceClient.fromConnectionString(connStr);

let failed = false;
for (const name of CONTAINERS) {
  process.stdout.write(`  Creating ${name} … `);
  try {
    const cc = client.getContainerClient(name);
    const resp = await cc.createIfNotExists();
    console.log(resp.succeeded ? '✓ created' : 'already exists');
  } catch (err) {
    console.log(`✗ FAILED: ${err.message}`);
    failed = true;
  }
}

console.log('');
if (failed) {
  console.error('One or more containers failed. Is Azurite running? (just dev-storage)');
  process.exit(1);
} else {
  console.log('All containers ready.');
}
