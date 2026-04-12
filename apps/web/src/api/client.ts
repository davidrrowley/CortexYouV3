import type {
  Spark,
  Concept,
  SparkListParams,
  CreateSparkRequest,
  UpdateSparkRequest,
  CreateConceptRequest,
  UpdateConceptRequest,
  CreateRelationshipRequest,
  DeleteRelationshipRequest,
  SasRequest,
  SasResponse,
  MeResponse,
  GraphArtefact,
  IndexArtefact,
} from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function call<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...init,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API ${res.status}: ${errorBody}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const getMe = () => call<MeResponse>('/api/me');

// ─── Sparks ───────────────────────────────────────────────────────────────────

export function listSparks(params: SparkListParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') qs.set(k, String(v));
  });
  return call<{ items: Spark[]; total: number }>(
    `/api/sparks${qs.toString() ? `?${qs}` : ''}`,
  );
}

export const getSpark = (id: string) =>
  call<Spark>(`/api/sparks/${id}`);

export const createSpark = (body: CreateSparkRequest) =>
  call<Spark>('/api/sparks', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateSpark = (id: string, body: UpdateSparkRequest) =>
  call<Spark>(`/api/sparks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const deleteSpark = (id: string) =>
  call<void>(`/api/sparks/${id}`, { method: 'DELETE' });

// ─── Concepts ─────────────────────────────────────────────────────────────────

export const listConcepts = () =>
  call<{ items: Concept[]; total: number }>('/api/concepts');

export const getConcept = (id: string) =>
  call<Concept>(`/api/concepts/${id}`);

export const createConcept = (body: CreateConceptRequest) =>
  call<Concept>('/api/concepts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const updateConcept = (id: string, body: UpdateConceptRequest) =>
  call<Concept>(`/api/concepts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

export const deleteConcept = (id: string) =>
  call<void>(`/api/concepts/${id}`, { method: 'DELETE' });

// ─── Relationships ────────────────────────────────────────────────────────────

export const createRelationship = (body: CreateRelationshipRequest) =>
  call<{ message: string }>('/api/relationships', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const deleteRelationship = (body: DeleteRelationshipRequest) =>
  call<void>('/api/relationships', {
    method: 'DELETE',
    body: JSON.stringify(body),
  });

// ─── Uploads ──────────────────────────────────────────────────────────────────

export const getSasToken = (body: SasRequest) =>
  call<SasResponse>('/api/uploads/sas', {
    method: 'POST',
    body: JSON.stringify(body),
  });

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendChatMessage = (messages: ChatMessage[]) =>
  call<{ reply: string }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });

export async function uploadFileDirect(
  file: File,
): Promise<{ blobPath: string }> {
  const sas = await getSasToken({
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  const res = await fetch(sas.uploadUrl, {
    method: 'PUT',
    headers: { 'x-ms-blob-type': 'BlockBlob', 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return { blobPath: sas.blobPath };
}

// ─── Derived artefacts ────────────────────────────────────────────────────────

export const rebuildIndex = () => call<{ count: number }>('/api/rebuild/index', { method: 'POST' });
export const rebuildGraph = () =>
  call<{ nodeCount: number; edgeCount: number }>('/api/rebuild/graph', { method: 'POST' });

export const getGraphData = () =>
  fetch('/api/derived/graph.json', { credentials: 'same-origin' }).then(
    (r) => r.json() as Promise<GraphArtefact>,
  );

export const getIndexData = () =>
  fetch('/api/derived/index.json', { credentials: 'same-origin' }).then(
    (r) => r.json() as Promise<IndexArtefact>,
  );

// ─── Export ───────────────────────────────────────────────────────────────────

export const triggerExport = () =>
  call<{ exportId: string; sparks: number; concepts: number }>('/api/export', {
    method: 'POST',
  });
