import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Tile,
  Button,
  SkeletonPlaceholder,
  InlineNotification,
  Tag,
} from '@carbon/react';
import { Add, Camera, ArrowRight } from '@carbon/icons-react';
import { listSparks, listConcepts } from '../api/client';
import SparkCard from '../components/SparkCard';
import { useAppStore } from '../store/useAppStore';

export default function DashboardView() {
  const navigate = useNavigate();
  const { openCapture } = useAppStore();

  const sparks = useQuery({
    queryKey: ['sparks', { limit: 10 }],
    queryFn: () => listSparks({ limit: 10, sort: 'createdAt', order: 'desc' }),
  });

  const concepts = useQuery({
    queryKey: ['concepts'],
    queryFn: listConcepts,
  });

  const totalSparks = sparks.data?.total ?? 0;
  const totalConcepts = concepts.data?.total ?? 0;

  return (
    <Grid condensed>
      {/* Header row */}
      <Column sm={4} md={8} lg={16}>
        <div style={{ paddingBottom: '1.5rem', paddingTop: '1rem' }}>
          <h1 className="page-heading">Dashboard</h1>
          <p className="page-subheading">Your knowledge base at a glance.</p>
        </div>
      </Column>

      {/* Stats */}
      <Column sm={2} md={2} lg={4}>
        <Tile>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totalSparks}</p>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>Sparks</p>
        </Tile>
      </Column>
      <Column sm={2} md={2} lg={4}>
        <Tile>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{totalConcepts}</p>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>Concepts</p>
        </Tile>
      </Column>

      {/* Quick actions */}
      <Column sm={4} md={4} lg={8}>
        <Tile>
          <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Quick actions</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              renderIcon={Add}
              size="sm"
              onClick={openCapture}
            >
              Add note
            </Button>
            <Button
              renderIcon={Camera}
              size="sm"
              kind="secondary"
              onClick={openCapture}
            >
              Capture image
            </Button>
            <Button
              size="sm"
              kind="ghost"
              renderIcon={ArrowRight}
              onClick={() => navigate('/graph')}
            >
              Open graph
            </Button>
          </div>
        </Tile>
      </Column>

      {/* Divider between stats and content */}
      <Column sm={4} md={8} lg={16}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--cds-border-subtle)', margin: '2rem 0 0' }} />
      </Column>

      {/* Recent sparks */}
      <Column sm={4} md={8} lg={10}>
        <div style={{ marginTop: '1.5rem', paddingRight: '2rem', borderRight: '1px solid var(--cds-border-subtle)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <h2 className="section-heading" style={{ margin: 0 }}>Recent Sparks</h2>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ArrowRight}
              onClick={() => navigate('/browse')}
            >
              View all
            </Button>
          </div>

          {sparks.isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[1, 2, 3].map((i) => (
                <SkeletonPlaceholder key={i} style={{ height: '80px', width: '100%' }} />
              ))}
            </div>
          )}

          {sparks.isError && (
            <InlineNotification
              kind="error"
              title="Could not load sparks"
              subtitle={sparks.error?.message}
            />
          )}

          {sparks.data?.items.map((spark) => (
            <SparkCard key={spark.id} spark={spark} />
          ))}

          {sparks.data?.items.length === 0 && (
            <Tile>
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Nothing here yet</p>
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Capture your first idea, link, or note to get started.
                </p>
                <Button renderIcon={Add} onClick={openCapture}>Add your first spark</Button>
              </div>
            </Tile>
          )}
        </div>
      </Column>

      {/* Recent concepts */}
      <Column sm={4} md={8} lg={6}>
        <div style={{ marginTop: '1.5rem', paddingLeft: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <h2 className="section-heading" style={{ margin: 0 }}>Concepts</h2>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ArrowRight}
              onClick={() => navigate('/concepts')}
            >
              Manage
            </Button>
          </div>
          {concepts.data?.items.slice(0, 6).map((concept) => (
            <Tile
              key={concept.id}
              style={{ marginBottom: '1px', cursor: 'pointer' }}
              onClick={() => navigate(`/concepts?id=${concept.id}`)}
            >
              <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{concept.name}</p>
              {concept.description && (
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                  {concept.description}
                </p>
              )}
              {concept.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {concept.tags.map((tag) => (
                    <Tag key={tag} type="teal" size="sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </Tile>
          ))}
        </div>
      </Column>
    </Grid>
  );
}
