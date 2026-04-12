// ─── Core entity types ────────────────────────────────────────────────────────

export type ContentType = 'note' | 'link' | 'image' | 'quote' | 'mixed';
export type SparkStatus = 'inbox' | 'reviewed' | 'distilled' | 'archived';
export type EdgeType =
  | 'relates_to'
  | 'supports'
  | 'examples'
  | 'inspired_by'
  | 'belongs_to';
export type CaptureMethod = 'quick-add' | 'upload' | 'share' | 'manual';

// ─── Media attachment ─────────────────────────────────────────────────────────

export interface MediaAttachment {
  kind: 'image' | 'file';
  blobPath: string;
  mimeType: string;
  filename: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

// ─── Link (relationship embedded in spark) ───────────────────────────────────

export interface SparkLink {
  targetId: string;
  type: EdgeType;
  createdBy: 'user' | 'suggested';
  createdAt: string;
}

// ─── Spark ────────────────────────────────────────────────────────────────────

export interface Spark {
  id: string;
  type: 'spark';
  title: string;
  summary: string;
  whyItMatters: string;
  contentType: ContentType;
  bodyMarkdown: string;
  sourceUrl: string | null;
  media: MediaAttachment[];
  tags: string[];
  conceptIds: string[];
  areaIds: string[];
  status: SparkStatus;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  links: SparkLink[];
  metadata: {
    device: string;
    captureMethod: CaptureMethod;
    sourceTitle: string | null;
  };
  deletedAt?: string;
}

// ─── Concept ──────────────────────────────────────────────────────────────────

export interface Concept {
  id: string;
  type: 'concept';
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ─── Area ─────────────────────────────────────────────────────────────────────

export interface Area {
  id: string;
  type: 'area';
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// ─── Graph artefact ───────────────────────────────────────────────────────────

export interface GraphNodeData {
  id: string;
  label: string;
  type: 'spark' | 'concept' | 'area' | 'tag';
  status?: SparkStatus;
  contentType?: ContentType;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
}

export interface GraphArtefact {
  generatedAt: string;
  nodes: Array<{ data: GraphNodeData }>;
  edges: Array<{ data: GraphEdgeData }>;
}

// ─── Index artefact ───────────────────────────────────────────────────────────

export interface IndexEntry {
  id: string;
  type: 'spark' | 'concept' | 'area';
  title?: string;
  name?: string;
  summary?: string;
  tags: string[];
  status?: SparkStatus;
  contentType?: ContentType;
  createdAt: string;
  updatedAt: string;
}

export interface IndexArtefact {
  generatedAt: string;
  items: IndexEntry[];
}

// ─── Event log ────────────────────────────────────────────────────────────────

export type EventAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'relationship_add'
  | 'relationship_remove'
  | 'export'
  | 'index_rebuild'
  | 'graph_rebuild';

export interface EventLogEntry {
  id: string;
  timestamp: string;
  action: EventAction;
  entityType: 'spark' | 'concept' | 'area' | 'relationship' | 'system';
  entityId: string;
  summary: string;
  userId?: string;
}
