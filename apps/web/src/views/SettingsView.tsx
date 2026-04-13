import { useState } from 'react';
import {
  Grid,
  Column,
  Button,
  Tile,
  InlineNotification,
  InlineLoading,
} from '@carbon/react';
import { Export, Renew, DocumentExport } from '@carbon/icons-react';
import { useMutation } from '@tanstack/react-query';
import { rebuildIndex, rebuildGraph, triggerExport } from '../api/client';

export default function SettingsView() {
  const [indexResult, setIndexResult] = useState<{ count: number } | null>(null);
  const [graphResult, setGraphResult] = useState<{
    nodeCount: number;
    edgeCount: number;
  } | null>(null);
  const [exportResult, setExportResult] = useState<{
    exportId: string;
    sparks: number;
    concepts: number;
  } | null>(null);

  const indexMutation = useMutation({
    mutationFn: rebuildIndex,
    onSuccess: setIndexResult,
  });

  const graphMutation = useMutation({
    mutationFn: rebuildGraph,
    onSuccess: setGraphResult,
  });

  const exportMutation = useMutation({
    mutationFn: triggerExport,
    onSuccess: setExportResult,
  });

  return (
    <Grid condensed>
      <Column sm={4} md={8} lg={12}>
        <div style={{ paddingTop: '1rem', paddingBottom: '1.5rem' }}>
          <h1 className="page-heading">Settings &amp; Admin</h1>
          <p className="page-subheading">Derived artefact management and data export.</p>
        </div>

        {/* Derived artefacts */}
        <Tile style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Derived artefacts
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
            Rebuild index.json and graph.json from canonical item files. Run after bulk
            changes or if data seems stale.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              renderIcon={indexMutation.isPending ? undefined : Renew}
              size="sm"
              kind="secondary"
              onClick={() => {
                setIndexResult(null);
                indexMutation.mutate();
              }}
              disabled={indexMutation.isPending}
            >
              {indexMutation.isPending ? (
                <InlineLoading description="Rebuilding index…" />
              ) : (
                'Rebuild index'
              )}
            </Button>
            <Button
              renderIcon={graphMutation.isPending ? undefined : Renew}
              size="sm"
              kind="secondary"
              onClick={() => {
                setGraphResult(null);
                graphMutation.mutate();
              }}
              disabled={graphMutation.isPending}
            >
              {graphMutation.isPending ? (
                <InlineLoading description="Rebuilding graph…" />
              ) : (
                'Rebuild graph'
              )}
            </Button>
          </div>
          {indexMutation.isError && (
            <InlineNotification
              kind="error"
              title="Index rebuild failed"
              subtitle={indexMutation.error?.message}
              style={{ marginTop: '0.75rem' }}
            />
          )}
          {indexResult && (
            <InlineNotification
              kind="success"
              title="Index rebuilt"
              subtitle={`${indexResult.count} items indexed`}
              style={{ marginTop: '0.75rem' }}
            />
          )}
          {graphMutation.isError && (
            <InlineNotification
              kind="error"
              title="Graph rebuild failed"
              subtitle={graphMutation.error?.message}
              style={{ marginTop: '0.75rem' }}
            />
          )}
          {graphResult && (
            <InlineNotification
              kind="success"
              title="Graph rebuilt"
              subtitle={`${graphResult.nodeCount} nodes, ${graphResult.edgeCount} edges`}
              style={{ marginTop: '0.75rem' }}
            />
          )}
        </Tile>

        {/* Export */}
        <Tile style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Export
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
            Create a versioned bundle of all your sparks, concepts, and areas in the
            exports container. Download directly from Azure Blob Storage afterwards.
          </p>
          <Button
            renderIcon={exportMutation.isPending ? undefined : DocumentExport}
            size="sm"
            onClick={() => {
              setExportResult(null);
              exportMutation.mutate();
            }}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <InlineLoading description="Exporting…" />
            ) : (
              'Create export bundle'
            )}
          </Button>
          {exportMutation.isError && (
            <InlineNotification
              kind="error"
              title="Export failed"
              subtitle={exportMutation.error?.message}
              style={{ marginTop: '0.75rem' }}
            />
          )}
          {exportResult && (
            <InlineNotification
              kind="success"
              title="Export complete"
              subtitle={`Export ID: ${exportResult.exportId} · ${exportResult.sparks} sparks, ${exportResult.concepts} concepts`}
              style={{ marginTop: '0.75rem' }}
            />
          )}
        </Tile>

        {/* Storage layout reference */}
        <Tile>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Storage layout
          </h2>
          <pre
            style={{
              fontSize: '0.75rem',
              background: 'var(--cds-layer-02)',
              padding: '1rem',
              overflow: 'auto',
              borderRadius: '4px',
            }}
          >
{`cortexyou-items/
  sparks/{id}.json
  concepts/{id}.json
  areas/{id}.json
cortexyou-raw/
  {yyyy}/{mm}/{id}_{filename}
cortexyou-derived/
  index.json
  graph.json
cortexyou-logs/
  events/{yyyy}/{mm}/{dd}.jsonl
cortexyou-exports/
  {exportId}/
    items/
    manifest.json`}
          </pre>
        </Tile>
      </Column>
    </Grid>
  );
}
