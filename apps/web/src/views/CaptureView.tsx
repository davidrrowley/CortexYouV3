import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Button,
  InlineNotification,
  Form,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import { createSpark, uploadFileDirect } from '../api/client';
import SparkForm, { DEFAULT_SPARK_FORM_VALUES } from '../components/SparkForm';
import type { SparkFormValues } from '../components/SparkForm';

export default function CaptureView() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [values, setValues] = useState<SparkFormValues>(DEFAULT_SPARK_FORM_VALUES);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(patch: Partial<SparkFormValues>) {
    setValues((v) => ({ ...v, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    const parsedTags = values.tagsInput
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

      const spark = await createSpark({
        title: values.title.trim(),
        summary: '',
        whyItMatters: values.whyItMatters,
        contentType: values.contentType,
        bodyMarkdown: values.bodyMarkdown,
        sourceUrl: values.sourceUrl || null,
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
      setValues(DEFAULT_SPARK_FORM_VALUES);

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
          <h1 className="page-heading">Capture</h1>
          <p className="page-subheading">Record something that sparked your interest.</p>
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
          <SparkForm
            values={values}
            onChange={handleChange}
            idPrefix="capture"
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button
              type="submit"
              renderIcon={Save}
              disabled={saving || !values.title.trim()}
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
        </Form>
      </Column>
    </Grid>
  );
}

