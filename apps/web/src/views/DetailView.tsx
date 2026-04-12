import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Button,
  Tag,
  Tile,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Modal,
  InlineNotification,
  Breadcrumb,
  BreadcrumbItem,
  SkeletonPlaceholder,
  Link,
} from '@carbon/react';
import { Edit, Save, TrashCan, ArrowLeft, Link as LinkIcon, Add } from '@carbon/icons-react';
import { getSpark, updateSpark, deleteSpark, listConcepts, createRelationship, deleteRelationship } from '../api/client';
import type { Spark, SparkStatus, EdgeType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'dompurify';

export default function DetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editWhy, setEditWhy] = useState('');
  const [editStatus, setEditStatus] = useState<SparkStatus>('inbox');
  const [editTags, setEditTags] = useState('');

  // Link modal state
  const [linkTarget, setLinkTarget] = useState('');
  const [linkType, setLinkType] = useState<EdgeType>('relates_to');

  const { data: spark, isLoading, isError } = useQuery({
    queryKey: ['spark', id],
    queryFn: () => getSpark(id!),
    enabled: !!id,
  });

  const { data: concepts } = useQuery({
    queryKey: ['concepts'],
    queryFn: listConcepts,
  });

  const saveMutation = useMutation({
    mutationFn: (updates: Partial<Spark>) => updateSpark(id!, updates),
    onSuccess: (updated) => {
      qc.setQueryData(['spark', id], updated);
      qc.invalidateQueries({ queryKey: ['sparks'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSpark(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sparks'] });
      navigate('/browse');
    },
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      createRelationship({ sourceId: id!, targetId: linkTarget, type: linkType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spark', id] });
      setLinkModalOpen(false);
      setLinkTarget('');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: ({
      targetId,
      type,
    }: {
      targetId: string;
      type: EdgeType;
    }) => deleteRelationship({ sourceId: id!, targetId, type }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spark', id] }),
  });

  function startEdit(spark: Spark) {
    setEditTitle(spark.title);
    setEditSummary(spark.summary);
    setEditBody(spark.bodyMarkdown);
    setEditWhy(spark.whyItMatters);
    setEditStatus(spark.status);
    setEditTags(spark.tags.join(', '));
    setEditing(true);
  }

  function handleSave() {
    saveMutation.mutate({
      title: editTitle.trim(),
      summary: editSummary,
      bodyMarkdown: editBody,
      whyItMatters: editWhy,
      status: editStatus,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  }

  if (isLoading) {
    return (
      <Grid condensed>
        <Column sm={4} md={8} lg={12}>
          <SkeletonPlaceholder style={{ height: '400px', width: '100%', marginTop: '1rem' }} />
        </Column>
      </Grid>
    );
  }

  if (isError || !spark) {
    return (
      <Grid condensed>
        <Column sm={4} md={8} lg={12}>
          <InlineNotification kind="error" title="Spark not found" />
        </Column>
      </Grid>
    );
  }

  const linkedConcepts = (concepts?.items ?? []).filter((c) =>
    spark.conceptIds.includes(c.id),
  );

  const sanitisedBody = spark.bodyMarkdown
    ? DOMPurify.sanitize(spark.bodyMarkdown)
    : '';

  return (
    <Grid condensed>
      <Column sm={4} md={8} lg={12}>
        <div style={{ paddingTop: '1rem' }}>
          <Breadcrumb style={{ marginBottom: '1rem' }}>
            <BreadcrumbItem onClick={() => navigate('/browse')}>Browse</BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>{spark.title}</BreadcrumbItem>
          </Breadcrumb>

          {!editing ? (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  {spark.title}
                </h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <Button renderIcon={Edit} size="sm" kind="ghost" onClick={() => startEdit(spark)}>
                    Edit
                  </Button>
                  <Button
                    renderIcon={TrashCan}
                    size="sm"
                    kind="danger--ghost"
                    onClick={() => {
                      if (confirm('Delete this spark?')) deleteMutation.mutate();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <Tag type="blue" size="sm">{spark.contentType}</Tag>
                <Tag type="outline" size="sm">{spark.status}</Tag>
                {spark.tags.map((tag) => (
                  <Tag key={tag} type="cool-gray" size="sm">{tag}</Tag>
                ))}
              </div>

              <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                Captured {formatDistanceToNow(new Date(spark.capturedAt), { addSuffix: true })}
                {spark.sourceUrl && (
                  <>
                    {' · '}
                    <Link href={spark.sourceUrl} target="_blank" rel="noopener noreferrer">
                      Source <LinkIcon size={12} />
                    </Link>
                  </>
                )}
              </p>

              {spark.whyItMatters && (
                <Tile style={{ marginBottom: '1rem', borderLeft: '4px solid var(--cds-interactive)' }}>
                  <p style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                    {spark.whyItMatters}
                  </p>
                </Tile>
              )}

              {spark.bodyMarkdown && (
                <Tile style={{ marginBottom: '1rem' }}>
                  <div
                    style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: sanitisedBody }}
                  />
                </Tile>
              )}

              {/* Linked concepts */}
              <div style={{ marginBottom: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                    Linked concepts
                  </h2>
                  <Button
                    renderIcon={Add}
                    kind="ghost"
                    size="sm"
                    onClick={() => setLinkModalOpen(true)}
                  >
                    Link
                  </Button>
                </div>
                {linkedConcepts.length === 0 ? (
                  <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.75rem' }}>
                    No concepts linked yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {linkedConcepts.map((c) => (
                      <Tag
                        key={c.id}
                        type="teal"
                        filter
                        onClose={() =>
                          unlinkMutation.mutate({ targetId: c.id, type: 'belongs_to' })
                        }
                      >
                        {c.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              {/* Relationships */}
              {spark.links.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Relationships
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {spark.links.map((link) => (
                      <Tile key={`${link.targetId}__${link.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag type="warm-gray" size="sm">{link.type}</Tag>
                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', flex: 1 }}>
                          {link.targetId}
                        </span>
                        <Button
                          kind="ghost"
                          size="sm"
                          onClick={() => unlinkMutation.mutate({ targetId: link.targetId, type: link.type })}
                        >
                          Remove
                        </Button>
                      </Tile>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Edit mode */
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                Editing spark
              </h1>
              {saveMutation.isError && (
                <InlineNotification
                  kind="error"
                  title="Save failed"
                  subtitle={saveMutation.error?.message}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextInput
                  id="edit-title"
                  labelText="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <TextInput
                  id="edit-summary"
                  labelText="Summary"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                />
                <TextArea
                  id="edit-body"
                  labelText="Content"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={6}
                />
                <TextInput
                  id="edit-why"
                  labelText="Why it matters"
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                />
                <Select
                  id="edit-status"
                  labelText="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as SparkStatus)}
                >
                  <SelectItem value="inbox" text="Inbox" />
                  <SelectItem value="reviewed" text="Reviewed" />
                  <SelectItem value="distilled" text="Distilled" />
                  <SelectItem value="archived" text="Archived" />
                </Select>
                <TextInput
                  id="edit-tags"
                  labelText="Tags (comma-separated)"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    renderIcon={Save}
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    kind="ghost"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Column>

      {/* Link modal */}
      <Modal
        open={linkModalOpen}
        modalHeading="Link to concept or spark"
        primaryButtonText="Link"
        secondaryButtonText="Cancel"
        onRequestSubmit={() => linkMutation.mutate()}
        onRequestClose={() => setLinkModalOpen(false)}
        onSecondarySubmit={() => setLinkModalOpen(false)}
        primaryButtonDisabled={!linkTarget || linkMutation.isPending}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '1rem' }}>
          <Select
            id="link-type"
            labelText="Relationship type"
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as EdgeType)}
          >
            <SelectItem value="relates_to" text="Relates to" />
            <SelectItem value="supports" text="Supports" />
            <SelectItem value="examples" text="Is an example of" />
            <SelectItem value="inspired_by" text="Inspired by" />
            <SelectItem value="belongs_to" text="Belongs to (concept)" />
          </Select>

          {linkType === 'belongs_to' ? (
            <Select
              id="link-target-concept"
              labelText="Concept"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
            >
              <SelectItem value="" text="Select a concept…" />
              {(concepts?.items ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id} text={c.name} />
              ))}
            </Select>
          ) : (
            <TextInput
              id="link-target"
              labelText="Target ID (spark_… or concept_…)"
              placeholder="spark_01HXYZ… or concept_01HXYZ…"
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
            />
          )}
        </div>
      </Modal>
    </Grid>
  );
}
