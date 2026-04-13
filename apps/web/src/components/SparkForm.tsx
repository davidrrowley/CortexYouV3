import {
  TextInput,
  TextArea,
  Select,
  SelectItem,
  FileUploader,
  Tag,
  Stack,
} from '@carbon/react';
import type { ContentType } from '../types';

export interface SparkFormValues {
  title: string;
  contentType: ContentType;
  sourceUrl: string;
  bodyMarkdown: string;
  whyItMatters: string;
  tagsInput: string;
  files: File[];
}

export const DEFAULT_SPARK_FORM_VALUES: SparkFormValues = {
  title: '',
  contentType: 'note',
  sourceUrl: '',
  bodyMarkdown: '',
  whyItMatters: '',
  tagsInput: '',
  files: [],
};

interface SparkFormProps {
  values: SparkFormValues;
  onChange: (patch: Partial<SparkFormValues>) => void;
  idPrefix?: string;
  bodyRows?: number;
  autoFocus?: boolean;
}

export default function SparkForm({
  values,
  onChange,
  idPrefix = 'spark',
  bodyRows = 6,
  autoFocus = false,
}: SparkFormProps) {
  const parsedTags = values.tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <Stack gap={6}>
      <TextInput
        id={`${idPrefix}-title`}
        labelText="Title *"
        placeholder="What caught your attention?"
        value={values.title}
        onChange={(e) => onChange({ title: e.target.value })}
        autoFocus={autoFocus}
        required
      />

      <Select
        id={`${idPrefix}-content-type`}
        labelText="Content type"
        value={values.contentType}
        onChange={(e) => onChange({ contentType: e.target.value as ContentType })}
      >
        <SelectItem value="note" text="Note" />
        <SelectItem value="link" text="Link / URL" />
        <SelectItem value="image" text="Image" />
        <SelectItem value="quote" text="Quote" />
        <SelectItem value="mixed" text="Mixed" />
      </Select>

      <TextInput
        id={`${idPrefix}-source-url`}
        labelText="Source URL"
        helperText="Paste the URL this came from, if any"
        placeholder="https://…"
        value={values.sourceUrl}
        onChange={(e) => onChange({ sourceUrl: e.target.value })}
        type="url"
      />

      <TextArea
        id={`${idPrefix}-body`}
        labelText="Content / Notes"
        helperText="Markdown supported"
        placeholder="Paste an excerpt, write your notes…"
        value={values.bodyMarkdown}
        onChange={(e) => onChange({ bodyMarkdown: e.target.value })}
        rows={bodyRows}
      />

      <TextInput
        id={`${idPrefix}-why`}
        labelText="Why it matters"
        helperText="One sentence — helps you rediscover this later"
        placeholder="e.g. Shows how X connects to Y"
        value={values.whyItMatters}
        onChange={(e) => onChange({ whyItMatters: e.target.value })}
      />

      <div>
        <TextInput
          id={`${idPrefix}-tags`}
          labelText="Tags (comma-separated)"
          placeholder="ai, research, design"
          value={values.tagsInput}
          onChange={(e) => onChange({ tagsInput: e.target.value })}
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
        labelDescription="Max 50 MB per file. JPEG, PNG, GIF, WEBP, HEIC."
        buttonLabel="Add images"
        filenameStatus="edit"
        accept={['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']}
        multiple
        onChange={(e) => {
          const input = e.target as HTMLInputElement;
          if (input.files) onChange({ files: Array.from(input.files) });
        }}
      />
    </Stack>
  );
}
