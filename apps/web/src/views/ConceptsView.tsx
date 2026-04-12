import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Button,
  Tag,
  Tile,
  Modal,
  TextInput,
  TextArea,
  InlineNotification,
  SkeletonPlaceholder,
  Search,
} from '@carbon/react';
import { Add, Edit, TrashCan } from '@carbon/icons-react';
import { listConcepts, createConcept, updateConcept, deleteConcept, listSparks } from '../api/client';
import type { Concept } from '../types';
import SparkCard from '../components/SparkCard';

export default function ConceptsView() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Concept | null>(null);
  const [conceptSearch, setConceptSearch] = useState('');

  // Create form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');

  const { data: concepts, isLoading } = useQuery({
    queryKey: ['concepts'],
    queryFn: listConcepts,
  });

  const selectedConcept = concepts?.items.find((c) => c.id === selectedId);

  const { data: linkedSparks } = useQuery({
    queryKey: ['sparks', { conceptId: selectedId }],
    queryFn: () => listSparks({ conceptId: selectedId! }),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createConcept({
        name: newName.trim(),
        description: newDesc,
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concepts'] });
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      setNewTags('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateConcept(editTarget!.id, {
        name: editTarget!.name,
        description: editTarget!.description,
        tags: editTarget!.tags,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concepts'] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConcept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concepts'] });
      if (selectedId) setSearchParams({});
    },
  });

  const filteredConcepts = (concepts?.items ?? []).filter((c) =>
    !conceptSearch || c.name.toLowerCase().includes(conceptSearch.toLowerCase()),
  );

  return (
    <Grid condensed>
      {/* Left panel: concept list */}
      <Column sm={4} md={3} lg={5}>
        <div style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Concepts
            </h1>
            <Button
              renderIcon={Add}
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              New
            </Button>
          </div>

          <Search
            id="concept-search"
            labelText="Search concepts"
            placeholder="Filter…"
            value={conceptSearch}
            onChange={(e) => setConceptSearch(e.target.value)}
            size="sm"
            style={{ marginBottom: '0.75rem' }}
          />

          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[1, 2, 3].map((i) => (
                <SkeletonPlaceholder key={i} style={{ height: '60px', width: '100%' }} />
              ))}
            </div>
          )}

          {filteredConcepts.map((concept) => (
            <Tile
              key={concept.id}
              style={{
                marginBottom: '1px',
                cursor: 'pointer',
                borderLeft:
                  selectedId === concept.id
                    ? '3px solid var(--cds-interactive)'
                    : '3px solid transparent',
              }}
              onClick={() => setSearchParams({ id: concept.id })}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: 0 }}>
                    {concept.name}
                  </p>
                  {concept.tags.length > 0 && (
                    <div
                      style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}
                    >
                      {concept.tags.slice(0, 3).map((tag) => (
                        <Tag key={tag} type="teal" size="sm">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={Edit}
                    iconDescription="Edit"
                    hasIconOnly
                    onClick={() => {
                      setEditTarget({ ...concept });
                      setEditOpen(true);
                    }}
                  />
                  <Button
                    kind="danger--ghost"
                    size="sm"
                    renderIcon={TrashCan}
                    iconDescription="Delete"
                    hasIconOnly
                    onClick={() => {
                      if (confirm(`Delete concept "${concept.name}"?`)) {
                        deleteMutation.mutate(concept.id);
                      }
                    }}
                  />
                </div>
              </div>
            </Tile>
          ))}

          {filteredConcepts.length === 0 && !isLoading && (
            <p
              style={{
                color: 'var(--cds-text-secondary)',
                fontSize: '0.75rem',
                textAlign: 'center',
                padding: '2rem 0',
              }}
            >
              No concepts yet.
            </p>
          )}
        </div>
      </Column>

      {/* Right panel: concept detail + linked sparks */}
      <Column sm={4} md={5} lg={11}>
        <div style={{ paddingTop: '1rem' }}>
          {!selectedConcept ? (
            <Tile>
              <p
                style={{
                  color: 'var(--cds-text-secondary)',
                  textAlign: 'center',
                  padding: '4rem 0',
                }}
              >
                Select a concept to see its connected sparks.
              </p>
            </Tile>
          ) : (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                {selectedConcept.name}
              </h2>
              {selectedConcept.description && (
                <p
                  style={{
                    color: 'var(--cds-text-secondary)',
                    fontSize: '0.875rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {selectedConcept.description}
                </p>
              )}
              {selectedConcept.tags.length > 0 && (
                <div
                  style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap' }}
                >
                  {selectedConcept.tags.map((tag) => (
                    <Tag key={tag} type="teal" size="sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}

              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Linked sparks ({linkedSparks?.total ?? '…'})
              </h3>
              {linkedSparks?.items.map((spark) => (
                <SparkCard key={spark.id} spark={spark} />
              ))}
              {linkedSparks?.items.length === 0 && (
                <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem' }}>
                  No sparks linked to this concept yet.
                </p>
              )}
            </>
          )}
        </div>
      </Column>

      {/* Create modal */}
      <Modal
        open={createOpen}
        modalHeading="New concept"
        primaryButtonText={createMutation.isPending ? 'Creating…' : 'Create'}
        secondaryButtonText="Cancel"
        onRequestSubmit={() => createMutation.mutate()}
        onRequestClose={() => setCreateOpen(false)}
        onSecondarySubmit={() => setCreateOpen(false)}
        primaryButtonDisabled={createMutation.isPending || !newName.trim()}
      >
        {createMutation.isError && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={createMutation.error?.message}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
          <TextInput
            id="new-concept-name"
            labelText="Name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <TextArea
            id="new-concept-desc"
            labelText="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
          />
          <TextInput
            id="new-concept-tags"
            labelText="Tags (comma-separated)"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        modalHeading="Edit concept"
        primaryButtonText={updateMutation.isPending ? 'Saving…' : 'Save'}
        secondaryButtonText="Cancel"
        onRequestSubmit={() => updateMutation.mutate()}
        onRequestClose={() => setEditOpen(false)}
        onSecondarySubmit={() => setEditOpen(false)}
        primaryButtonDisabled={updateMutation.isPending || !editTarget?.name?.trim()}
      >
        {editTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
            <TextInput
              id="edit-concept-name"
              labelText="Name"
              value={editTarget.name}
              onChange={(e) =>
                setEditTarget((t) => (t ? { ...t, name: e.target.value } : t))
              }
            />
            <TextArea
              id="edit-concept-desc"
              labelText="Description"
              value={editTarget.description}
              onChange={(e) =>
                setEditTarget((t) => (t ? { ...t, description: e.target.value } : t))
              }
              rows={3}
            />
            <TextInput
              id="edit-concept-tags"
              labelText="Tags (comma-separated)"
              value={editTarget.tags.join(', ')}
              onChange={(e) =>
                setEditTarget((t) =>
                  t
                    ? {
                        ...t,
                        tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                      }
                    : t,
                )
              }
            />
          </div>
        )}
      </Modal>
    </Grid>
  );
}
