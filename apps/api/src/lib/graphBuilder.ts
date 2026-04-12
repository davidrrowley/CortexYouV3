import type { Spark, Concept, Area, GraphArtefact, IndexArtefact, IndexEntry } from '../types/models';
import { readJson, listBlobPaths, writeJson } from './blobStorage';

// ─── Index builder ────────────────────────────────────────────────────────────

export async function buildIndex(): Promise<IndexArtefact> {
  const now = new Date().toISOString();
  const entries: IndexEntry[] = [];

  // Collect sparks
  const sparkPaths = await listBlobPaths('items', 'sparks/');
  for (const path of sparkPaths) {
    const spark = await readJson<Spark>('items', path);
    if (!spark || spark.deletedAt) continue;
    entries.push({
      id: spark.id,
      type: 'spark',
      title: spark.title,
      summary: spark.summary,
      tags: spark.tags,
      status: spark.status,
      contentType: spark.contentType,
      createdAt: spark.createdAt,
      updatedAt: spark.updatedAt,
    });
  }

  // Collect concepts
  const conceptPaths = await listBlobPaths('items', 'concepts/');
  for (const path of conceptPaths) {
    const concept = await readJson<Concept>('items', path);
    if (!concept || concept.deletedAt) continue;
    entries.push({
      id: concept.id,
      type: 'concept',
      name: concept.name,
      summary: concept.description,
      tags: concept.tags,
      createdAt: concept.createdAt,
      updatedAt: concept.updatedAt,
    });
  }

  // Sort newest first
  entries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const artefact: IndexArtefact = { generatedAt: now, items: entries };
  await writeJson('derived', 'index.json', artefact);
  return artefact;
}

// ─── Graph builder ────────────────────────────────────────────────────────────

export async function buildGraph(): Promise<GraphArtefact> {
  const now = new Date().toISOString();
  const graph: GraphArtefact = { generatedAt: now, nodes: [], edges: [] };
  const edgeSet = new Set<string>();

  // Sparks
  const sparkPaths = await listBlobPaths('items', 'sparks/');
  for (const path of sparkPaths) {
    const spark = await readJson<Spark>('items', path);
    if (!spark || spark.deletedAt) continue;

    graph.nodes.push({
      data: {
        id: spark.id,
        label: spark.title,
        type: 'spark',
        status: spark.status,
        contentType: spark.contentType,
      },
    });

    // Explicit links
    for (const link of spark.links ?? []) {
      const edgeId = `${spark.id}__${link.targetId}__${link.type}`;
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        graph.edges.push({
          data: {
            id: edgeId,
            source: spark.id,
            target: link.targetId,
            type: link.type,
          },
        });
      }
    }

    // Concept memberships
    for (const conceptId of spark.conceptIds ?? []) {
      const edgeId = `${spark.id}__${conceptId}__belongs_to`;
      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
        graph.edges.push({
          data: {
            id: edgeId,
            source: spark.id,
            target: conceptId,
            type: 'belongs_to',
          },
        });
      }
    }
  }

  // Concepts
  const conceptPaths = await listBlobPaths('items', 'concepts/');
  for (const path of conceptPaths) {
    const concept = await readJson<Concept>('items', path);
    if (!concept || concept.deletedAt) continue;
    graph.nodes.push({
      data: { id: concept.id, label: concept.name, type: 'concept' },
    });
  }

  // Areas
  const areaPaths = await listBlobPaths('items', 'areas/');
  for (const path of areaPaths) {
    const area = await readJson<Area>('items', path);
    if (!area || area.deletedAt) continue;
    graph.nodes.push({
      data: { id: area.id, label: area.name, type: 'area' },
    });
  }

  await writeJson('derived', 'graph.json', graph);
  return graph;
}
