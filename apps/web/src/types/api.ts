// ─── API request / response shapes ───────────────────────────────────────────

import type { Spark, Concept, Area, EdgeType } from './models';

// /api/me
export interface MeResponse {
  userId: string;
  userDetails: string;
  identityProvider: string;
  userRoles: string[];
}

// /api/uploads/sas
export interface SasRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SasResponse {
  uploadUrl: string;
  blobPath: string;
  expiresAt: string;
}

// /api/sparks
export type CreateSparkRequest = Omit<
  Spark,
  'id' | 'type' | 'createdAt' | 'updatedAt'
>;
export type UpdateSparkRequest = Partial<
  Omit<Spark, 'id' | 'type' | 'createdAt'>
>;

export interface SparkListResponse {
  items: Spark[];
  total: number;
  nextCursor?: string;
}

export interface SparkListParams {
  status?: string;
  contentType?: string;
  tag?: string;
  conceptId?: string;
  q?: string;
  cursor?: string;
  limit?: number;
  sort?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

// /api/concepts
export type CreateConceptRequest = Omit<
  Concept,
  'id' | 'type' | 'createdAt' | 'updatedAt'
>;
export type UpdateConceptRequest = Partial<
  Omit<Concept, 'id' | 'type' | 'createdAt'>
>;

// /api/relationships
export interface CreateRelationshipRequest {
  sourceId: string;
  targetId: string;
  type: EdgeType;
}

export interface DeleteRelationshipRequest {
  sourceId: string;
  targetId: string;
  type: EdgeType;
}

// Generic API error
export interface ApiError {
  error: string;
  message: string;
  status: number;
}
