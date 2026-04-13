import { useState } from 'react';
import {
  Modal,
  InlineNotification,
  Form,
} from '@carbon/react';
import { useQueryClient } from '@tanstack/react-query';
import { createSpark, uploadFileDirect } from '../api/client';
import SparkForm, { DEFAULT_SPARK_FORM_VALUES } from './SparkForm';
import type { SparkFormValues } from './SparkForm';

interface Props {
  onClose: () => void;
}

export default function QuickCapture({ onClose }: Props) {
  const qc = useQueryClient();
  const [values, setValues] = useState<SparkFormValues>(DEFAULT_SPARK_FORM_VALUES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(patch: Partial<SparkFormValues>) {
    setValues((v) => ({ ...v, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;

    setSaving(true);
    setError(null);

    const tags = values.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const media = [];
      for (const file of values.files) {
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
        title: values.title.trim(),
        summary: '',
        whyItMatters: values.whyItMatters,
        contentType: values.contentType,
        bodyMarkdown: values.bodyMarkdown,
        sourceUrl: values.sourceUrl || null,
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
      primaryButtonDisabled={saving || !values.title.trim()}
    >
      <Form onSubmit={handleSubmit}>
        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            onClose={() => setError(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}
        <SparkForm
          values={values}
          onChange={handleChange}
          idPrefix="quick-capture"
          bodyRows={4}
          autoFocus
        />
      </Form>
    </Modal>
  );
}

