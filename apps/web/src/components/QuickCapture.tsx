import { useState, useRef } from 'react';
import {
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Button,
  Tag,
  FileUploader,
  InlineNotification,
  Form,
  Stack,
} from '@carbon/react';
import { useQueryClient } from '@tanstack/react-query';
import { createSpark, uploadFileDirect } from '../api/client';
import type { ContentType } from '../types';

interface Props {
  onClose: () => void;
}

export default function QuickCapture({ onClose }: Props) {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

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

      await createSpark({
        title: title.trim(),
        summary: '',
        whyItMatters,
        contentType,
        bodyMarkdown,
        sourceUrl: sourceUrl || null,
        media,
        tags,
        conceptIds: [],
        areaIds: [],
        status: 'inbox',
        capturedAt: new Date().toISOString(),
        links: [],
        metadata: {
          device: navigator.userAgent,
          captureMethod: 'quick-add',
          sourceTitle: null,
        },
      });

      await qc.invalidateQueries({ queryKey: ['sparks'] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      modalHeading="Quick Capture"
      primaryButtonText={saving ? 'Saving…' : 'Save Spark'}
      secondaryButtonText="Cancel"
      onRequestSubmit={handleSubmit}
      onRequestClose={onClose}
      onSecondarySubmit={onClose}
      size="md"
      primaryButtonDisabled={saving || !title.trim()}
    >
      <Form onSubmit={handleSubmit}>
        <Stack gap={5}>
          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onClose={() => setError(null)}
            />
          )}

          <TextInput
            id="capture-title"
            labelText="Title *"
            placeholder="What caught your attention?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <Select
            id="capture-content-type"
            labelText="Content type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
          >
            <SelectItem value="note" text="Note" />
            <SelectItem value="link" text="Link" />
            <SelectItem value="image" text="Image" />
            <SelectItem value="quote" text="Quote" />
            <SelectItem value="mixed" text="Mixed" />
          </Select>

          <TextInput
            id="capture-url"
            labelText="URL"
            placeholder="https://…"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            type="url"
          />

          <TextArea
            id="capture-body"
            labelText="Notes"
            placeholder="Add any context, highlights, or raw text…"
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            rows={4}
          />

          <TextInput
            id="capture-why"
            labelText="Why it matters"
            placeholder="One sentence on why you captured this"
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
          />

          <TextInput
            id="capture-tags"
            labelText="Tags (comma-separated)"
            placeholder="ai, research, ideas"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />

          <FileUploader
            labelTitle="Attach images"
            labelDescription="Max 50 MB per file. JPEG, PNG, GIF, WEBP, HEIC."
            buttonLabel="Add images"
            filenameStatus="edit"
            accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']}
            multiple
            onChange={(e) => {
              const input = e.target as HTMLInputElement;
              if (input.files) setFiles(Array.from(input.files));
            }}
          />
        </Stack>
      </Form>
    </Modal>
  );
}
