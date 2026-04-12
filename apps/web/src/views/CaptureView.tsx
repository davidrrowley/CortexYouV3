import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Button,
  FileUploader,
  InlineNotification,
  Form,
  Stack,
  Tag,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { createSpark, uploadFileDirect } from '../api/client';
import type { ContentType } from '../types';

export default function CaptureView() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [contentType, setContentType] = useState<ContentType>('note');
  const [tagsInput, setTagsInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const media = [];
      for (const file of files) {
        const { blobPath } = await uploadFileDirect(file);
        media.push({
          kind: 'image' as const,
          blobPath,
          mimeType: file.type,
          filename: file.name,
          sizeBytes: file.size,
        });
      }

      const spark = await createSpark({
        title: title.trim(),
        summary: '',
        whyItMatters,
        contentType,
        bodyMarkdown,
        sourceUrl: sourceUrl || null,
        media,
        tags: parsedTags,
        conceptIds: [],
        areaIds: [],
        status: 'inbox',
        capturedAt: new Date().toISOString(),
        links: [],
        metadata: {
          device: navigator.userAgent,
          captureMethod: 'manual',
          sourceTitle: null,
        },
      });

      await qc.invalidateQueries({ queryKey: ['sparks'] });
      setSuccess(true);
      // Reset form
      setTitle('');
      setSourceUrl('');
      setBodyMarkdown('');
      setWhyItMatters('');
      setTagsInput('');
      setFiles([]);

      // Navigate to the new spark after a moment
      setTimeout(() => navigate(`/sparks/${spark.id}`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Grid condensed>
      <Column sm={4} md={8} lg={12}>
        <div style={{ paddingTop: '1rem', paddingBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Capture
          </h1>
          <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
            Record something that sparked your interest.
          </p>
        </div>

        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            onClose={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}
        {success && (
          <InlineNotification
            kind="success"
            title="Saved!"
            subtitle="Your spark was captured. Redirecting…"
            style={{ marginBottom: '1rem' }}
          />
        )}

        <Form onSubmit={handleSubmit}>
          <Stack gap={6}>
            <TextInput
              id="title"
              labelText="Title *"
              placeholder="What caught your attention?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />

            <Select
              id="content-type"
              labelText="Content type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
            >
              <SelectItem value="note" text="Note" />
              <SelectItem value="link" text="Link / URL" />
              <SelectItem value="image" text="Image" />
              <SelectItem value="quote" text="Quote" />
              <SelectItem value="mixed" text="Mixed" />
            </Select>

            <TextInput
              id="source-url"
              labelText="Source URL"
              helperText="Paste the URL this came from, if any"
              placeholder="https://…"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              type="url"
            />

            <TextArea
              id="body"
              labelText="Content / Notes"
              helperText="Markdown supported"
              placeholder="Paste an excerpt, write your notes…"
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              rows={6}
            />

            <TextInput
              id="why"
              labelText="Why it matters"
              helperText="One sentence — helps you rediscover this later"
              placeholder="e.g. Shows how X connects to Y"
              value={whyItMatters}
              onChange={(e) => setWhyItMatters(e.target.value)}
            />

            <div>
              <TextInput
                id="tags"
                labelText="Tags (comma-separated)"
                placeholder="ai, research, design"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              {parsedTags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {parsedTags.map((tag) => (
                    <Tag key={tag} type="cool-gray" size="sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            <FileUploader
              labelTitle="Attach images"
              labelDescription="Max 50 MB per file. Supported: JPEG, PNG, GIF, WEBP, HEIC"
              buttonLabel="Select files"
              filenameStatus="edit"
              accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']}
              multiple
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                if (input.files) setFiles(Array.from(input.files));
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                type="submit"
                renderIcon={Save}
                disabled={saving || !title.trim()}
              >
                {saving ? 'Saving…' : 'Save Spark'}
              </Button>
              <Button
                kind="ghost"
                renderIcon={Close}
                onClick={() => navigate('/browse')}
              >
                Cancel
              </Button>
            </div>
          </Stack>
        </Form>
      </Column>
    </Grid>
  );
}
