import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Button,
  Select,
  SelectItem,
  InlineNotification,
  SkeletonPlaceholder,
  Tag,
} from '@carbon/react';
import { ZoomIn, ZoomOut, Maximize, Reset, Chat } from '@carbon/icons-react';
import cytoscape, { Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { listSparks, listConcepts } from '../api/client';
import type { Spark, Concept, GraphArtefact } from '../types';
import ChatPanel from '../components/ChatPanel';

cytoscape.use(fcose);

const NODE_COLORS: Record<string, string> = {
  spark: '#4589ff',
  concept: '#42be65',
  area: '#ee5396',
  tag: '#a56eff',
};

const NODE_BORDER: Record<string, string> = {
  spark: '#0f62fe',
  concept: '#198038',
  area: '#9f1853',
  tag: '#6929c4',
};

const EDGE_COLORS: Record<string, string> = {
  belongs_to:      '#4589ff',
  relates_to:      '#a56eff',
  supports:        '#42be65',
  examples:        '#f1c21b',
  inspired_by:     '#ff832b',
  relationship_to: '#ee5396',
};

const STATUS_OPACITY: Record<string, number> = {
  inbox:     1,
  reviewed:  0.85,
  distilled: 0.7,
  archived:  0.45,
};

type LayoutName = 'fcose' | 'cose' | 'breadthfirst' | 'circle';

export default function GraphView() {
  const navigate = useNavigate();
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);

  const [layout, setLayout] = useState<LayoutName>('fcose');
  const [showTags, setShowTags] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'spark' | 'concept'>('all');
  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    label: string;
    type: string;
  } | null>(null);

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    type: string;
  } | null>(null);

  const [chatOpen, setChatOpen] = useState(false);

  // Fetch all sparks and concepts to build graph locally (no derived file needed)
  const sparksQuery = useQuery({
    queryKey: ['sparks', { sort: 'createdAt', order: 'desc', limit: 200 }],
    queryFn: () => listSparks({ sort: 'createdAt', order: 'desc', limit: 200 }),
  });

  const conceptsQuery = useQuery({
    queryKey: ['concepts'],
    queryFn: listConcepts,
  });

  const isLoading = sparksQuery.isLoading || conceptsQuery.isLoading;
  const isError = sparksQuery.isError || conceptsQuery.isError;

  // Build graph data from fetched items
  function buildGraphData(sparks: Spark[], concepts: Concept[]): GraphArtefact {
    const nodes: GraphArtefact['nodes'] = [];
    const edges: GraphArtefact['edges'] = [];
    const edgeSet = new Set<string>();
    const nodeSet = new Set<string>();

    for (const concept of concepts) {
      nodes.push({ data: { id: concept.id, label: concept.name, type: 'concept' } });
      nodeSet.add(concept.id);
    }

    for (const spark of sparks) {
      nodes.push({
        data: {
          id: spark.id,
          label: spark.title,
          type: 'spark',
          status: spark.status,
          contentType: spark.contentType,
        },
      });
      nodeSet.add(spark.id);

      for (const conceptId of spark.conceptIds) {
        if (!nodeSet.has(conceptId)) continue;
        const eid = `${spark.id}__${conceptId}__belongs_to`;
        if (!edgeSet.has(eid)) {
          edgeSet.add(eid);
          edges.push({ data: { id: eid, source: spark.id, target: conceptId, type: 'belongs_to' } });
        }
      }

      for (const link of spark.links) {
        const eid = `${spark.id}__${link.targetId}__${link.type}`;
        if (!edgeSet.has(eid) && nodeSet.has(link.targetId)) {
          edgeSet.add(eid);
          edges.push({ data: { id: eid, source: spark.id, target: link.targetId, type: link.type } });
        }
      }
    }

    return { generatedAt: new Date().toISOString(), nodes, edges };
  }

  useEffect(() => {
    if (!cyRef.current || isLoading || isError) return;

    const sparks = sparksQuery.data?.items ?? [];
    const concepts = conceptsQuery.data?.items ?? [];
    const graph = buildGraphData(sparks, concepts);

    // Filter nodes by type
    const filteredNodes =
      filterType === 'all'
        ? graph.nodes
        : graph.nodes.filter((n) => n.data.type === filterType);

    const filteredIds = new Set(filteredNodes.map((n) => n.data.id));
    const filteredEdges = graph.edges.filter(
      (e) => filteredIds.has(e.data.source) && filteredIds.has(e.data.target),
    );

    const elements = [
      ...filteredNodes.map((n) => ({ data: n.data })),
      ...filteredEdges.map((e) => ({ data: e.data })),
    ];

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        // ── Base node ────────────────────────────────────────────────────
        {
          selector: 'node',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style: {
            label: 'data(label)',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'background-color': (ele: any) => NODE_COLORS[ele.data('type')] ?? '#888',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'border-color': (ele: any) => NODE_BORDER[ele.data('type')] ?? '#555',
            'border-width': 2,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            opacity: (ele: any) => STATUS_OPACITY[ele.data('status') ?? 'inbox'] ?? 1,
            color: '#ffffff',
            'font-size': '10px',
            'font-weight': 600 as unknown as string,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'ellipsis',
            'text-max-width': '70px',
            'text-overflow-wrap': 'anywhere',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            width: (ele: any) => {
              const type = ele.data('type');
              if (type === 'concept') return 52;
              if (type === 'area') return 44;
              return 32;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            height: (ele: any) => {
              const type = ele.data('type');
              if (type === 'concept') return 52;
              if (type === 'area') return 44;
              return 32;
            },
            'shadow-blur': 12 as unknown as string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'shadow-color': ((ele: any) => NODE_COLORS[ele.data('type')] ?? '#888') as unknown as string,
            'shadow-opacity': 0.5 as unknown as string,
            'shadow-offset-x': 0 as unknown as string,
            'shadow-offset-y': 0 as unknown as string,
            'transition-property': 'border-width, border-color, shadow-blur, opacity',
            'transition-duration': 150,
          } as unknown as cytoscape.Css.Node,
        },
        // ── Concept nodes — larger, pill-ish ─────────────────────────────
        {
          selector: 'node[type = "concept"]',
          style: {
            'border-width': 3,
            'font-size': '11px',
            'font-weight': 700 as unknown as string,
          } as unknown as cytoscape.Css.Node,
        },
        // ── Spark nodes — label hidden; shown via hover tooltip ───────────
        {
          selector: 'node[type = "spark"]',
          style: {
            'text-opacity': 0,
          },
        },
        // ── Tag nodes — smaller, faint ───────────────────────────────────
        {
          selector: 'node[type = "tag"]',
          style: {
            'font-size': '9px',
            opacity: 0.6,
          },
        },
        // ── Hover ────────────────────────────────────────────────────────
        {
          selector: 'node:active',
          style: {
            'border-width': 4,
            'shadow-blur': 24 as unknown as string,
            'shadow-opacity': 0.9 as unknown as string,
            opacity: 1,
          } as unknown as cytoscape.Css.Node,
        },
        // ── Selected node ────────────────────────────────────────────────
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
            'shadow-blur': 28 as unknown as string,
            'shadow-opacity': 1 as unknown as string,
            opacity: 1,
          } as unknown as cytoscape.Css.Node,
        },
        // ── Dimmed (neighbour-highlight) ─────────────────────────────────
        {
          selector: 'node.dimmed',
          style: { opacity: 0.15 },
        },
        {
          selector: 'edge.dimmed',
          style: { opacity: 0.05 },
        },
        // ── Base edge ────────────────────────────────────────────────────
        {
          selector: 'edge',
          style: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'line-color': (ele: any) => EDGE_COLORS[ele.data('type')] ?? '#8d8d8d',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'target-arrow-color': (ele: any) => EDGE_COLORS[ele.data('type')] ?? '#8d8d8d',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.8,
            'curve-style': 'bezier',
            width: 1.5,
            opacity: 0.5,
            'line-style': 'solid',
            'transition-property': 'opacity, width, line-color',
            'transition-duration': 150,
          },
        },
        // ── Selected / highlighted edge ───────────────────────────────────
        {
          selector: 'edge:selected',
          style: {
            width: 3,
            opacity: 1,
            'line-style': 'solid',
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            width: 2.5,
            opacity: 0.9,
          },
        },
      ],
      layout: {
        name: layout,
        animate: true,
        animationDuration: 600,
        animationEasing: 'ease-out',
        // fcose-specific: give nodes more breathing room
        ...(layout === 'fcose' ? {
          idealEdgeLength: 120,
          nodeRepulsion: 8500,
          gravity: 0.15,
          numIter: 2500,
          padding: 40,
        } : {}),
        padding: 40,
      } as Parameters<Core['layout']>[0],
    });

    cyInstance.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.id(),
        label: node.data('label'),
        type: node.data('type'),
      });
    });

    // Neighbour highlight + tooltip on mouseover
    cyInstance.current.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const oe = (evt as any).originalEvent as MouseEvent;
      setTooltip({
        x: oe.clientX,
        y: oe.clientY,
        label: node.data('label'),
        type: node.data('type'),
      });
      const cy = cyInstance.current!;
      const connected = node.closedNeighborhood();
      cy.elements().difference(connected).addClass('dimmed');
      connected.edges().addClass('highlighted');
      node.removeClass('dimmed');
    });

    cyInstance.current.on('mouseout', 'node', () => {
      setTooltip(null);
      const cy = cyInstance.current!;
      cy.elements().removeClass('dimmed').removeClass('highlighted');
    });

    cyInstance.current.on('tap', (evt) => {
      if (evt.target === cyInstance.current) {
        setSelectedNode(null);
      }
    });

    return () => {
      cyInstance.current?.destroy();
      cyInstance.current = null;
    };
  }, [sparksQuery.data, conceptsQuery.data, layout, filterType, isLoading]);

  function runLayout() {
    cyInstance.current?.layout({
      name: layout,
      animate: true,
      animationDuration: 600,
      padding: 40,
      ...(layout === 'fcose' ? {
        idealEdgeLength: 120,
        nodeRepulsion: 8500,
        gravity: 0.15,
        numIter: 2500,
      } : {}),
    } as Parameters<Core['layout']>[0]).run();
  }

  return (
    <>
    <Grid condensed style={{ height: '100vh' }}>
      <Column sm={4} md={8} lg={16}>
        <div style={{ paddingTop: '1rem', paddingBottom: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Graph
          </h1>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
            {sparksQuery.data?.total ?? '…'} sparks ·{' '}
            {conceptsQuery.data?.total ?? '…'} concepts
          </p>
        </div>
      </Column>

      {/* Toolbar */}
      <Column sm={4} md={8} lg={16}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ flex: '0 1 160px' }}>
            <Select
              id="graph-layout"
              labelText="Layout"
              value={layout}
              onChange={(e) => setLayout(e.target.value as LayoutName)}
              size="sm"
            >
              <SelectItem value="fcose" text="Force-directed (fCoSE)" />
              <SelectItem value="cose" text="CoSE" />
              <SelectItem value="breadthfirst" text="Tree" />
              <SelectItem value="circle" text="Circle" />
            </Select>
          </div>
          <div style={{ flex: '0 1 140px' }}>
            <Select
              id="graph-filter"
              labelText="Show"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              size="sm"
            >
              <SelectItem value="all" text="All nodes" />
              <SelectItem value="spark" text="Sparks only" />
              <SelectItem value="concept" text="Concepts only" />
            </Select>
          </div>
          <Button size="sm" kind="secondary" onClick={runLayout} renderIcon={Reset}>
            Re-layout
          </Button>
          <Button
            size="sm"
            kind={chatOpen ? 'primary' : 'tertiary'}
            renderIcon={Chat}
            onClick={() => setChatOpen((o) => !o)}
          >
            Chat with graph
          </Button>
          <Button
            size="sm"
            kind="ghost"
            onClick={() => cyInstance.current?.zoom(cyInstance.current.zoom() * 1.2)}
            renderIcon={ZoomIn}
            hasIconOnly
            iconDescription="Zoom in"
          />
          <Button
            size="sm"
            kind="ghost"
            onClick={() => cyInstance.current?.zoom(cyInstance.current.zoom() * 0.8)}
            renderIcon={ZoomOut}
            hasIconOnly
            iconDescription="Zoom out"
          />
          <Button
            size="sm"
            kind="ghost"
            onClick={() => cyInstance.current?.fit(undefined, 32)}
            renderIcon={Maximize}
            hasIconOnly
            iconDescription="Fit to screen"
          />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 6px 2px ${color}88`,
                  border: `1.5px solid ${NODE_BORDER[type]}`,
                }}
              />
              <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--cds-text-secondary)' }}>{type}</span>
            </div>
          ))}
        </div>
      </Column>

      {/* Graph canvas */}
      <Column sm={4} md={8} lg={16} style={{ position: 'relative' }}>
        {isLoading && (
          <SkeletonPlaceholder style={{ height: '600px', width: '100%' }} />
        )}
        {isError && (
          <InlineNotification
            kind="error"
            title="Could not load graph data"
          />
        )}
        {!isLoading && !isError && (
          <>
            <div ref={cyRef} className="cy-container" />
            {tooltip && (
              <div
                style={{
                  position: 'fixed',
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(-50%, calc(-100% - 12px))',
                  maxWidth: '240px',
                  background: 'rgba(13,17,23,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${NODE_BORDER[tooltip.type] ?? '#393939'}`,
                  borderRadius: '4px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: '#f4f4f4',
                  lineHeight: 1.4,
                  pointerEvents: 'none',
                  zIndex: 9999,
                  boxShadow: `0 4px 20px ${NODE_COLORS[tooltip.type] ?? '#4589ff'}44`,
                  whiteSpace: 'normal',
                }}
              >
                {tooltip.label}
              </div>
            )}
            {selectedNode && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '232px',
                  zIndex: 10,
                  background: 'rgba(13,17,23,0.90)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${NODE_BORDER[selectedNode.type] ?? '#393939'}`,
                  borderRadius: '4px',
                  padding: '1rem',
                  boxShadow: `0 0 20px 2px ${NODE_COLORS[selectedNode.type] ?? '#4589ff'}44`,
                }}
              >
                <p style={{ fontSize: '0.6875rem', color: 'var(--cds-text-secondary)', margin: '0 0 0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selected
                </p>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 0.5rem', color: '#f4f4f4', lineHeight: 1.3 }}>
                  {selectedNode.label}
                </p>
                <Tag
                  type={selectedNode.type === 'concept' ? 'green' : selectedNode.type === 'area' ? 'magenta' : selectedNode.type === 'tag' ? 'purple' : 'blue'}
                  size="sm"
                >
                  {selectedNode.type}
                </Tag>
                {selectedNode.type === 'spark' && (
                  <Button
                    kind="ghost"
                    size="sm"
                    style={{ marginTop: '0.5rem', padding: 0, color: NODE_COLORS['spark'] }}
                    onClick={() => navigate(`/sparks/${selectedNode.id}`)}
                  >
                    Open →
                  </Button>
                )}
                {selectedNode.type === 'concept' && (
                  <Button
                    kind="ghost"
                    size="sm"
                    style={{ marginTop: '0.5rem', padding: 0, color: NODE_COLORS['concept'] }}
                    onClick={() => navigate(`/concepts?id=${selectedNode.id}`)}
                  >
                    Open →
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </Column>
    </Grid>
    <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
