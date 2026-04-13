import { useNavigate } from 'react-router-dom';
import { ClickableTile, Tag, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteSpark } from '../api/client';
import type { Spark } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  spark: Spark;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  note: 'Note',
  link: 'Link',
  image: 'Image',
  quote: 'Quote',
  mixed: 'Mixed',
};

type TagColor = 'red' | 'magenta' | 'purple' | 'blue' | 'cyan' | 'teal' | 'green' | 'gray' | 'cool-gray' | 'warm-gray' | 'high-contrast' | 'outline';

const STATUS_TAG_TYPES: Record<string, TagColor> = {
  inbox: 'blue',
  reviewed: 'teal',
  distilled: 'green',
  archived: 'gray',
};

export default function SparkCard({ spark }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const del = useMutation({
    mutationFn: () => deleteSpark(spark.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sparks'] }),
  });

  return (
    <ClickableTile
      style={{
        position: 'relative',
        marginBottom: '1px',
      }}
      onClick={() => navigate(`/sparks/${spark.id}`)}
      aria-label={spark.title}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontWeight: 600,
              fontSize: '0.875rem',
              margin: '0 0 0.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {spark.title}
          </p>
          {spark.summary && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--cds-text-secondary)',
                margin: '0 0 0.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {spark.summary}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
            <Tag type="blue" size="sm">
              {CONTENT_TYPE_LABELS[spark.contentType] ?? spark.contentType}
            </Tag>
            <Tag type={STATUS_TAG_TYPES[spark.status] ?? 'outline'} size="sm">
              {spark.status}
            </Tag>
            {spark.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} type="cool-gray" size="sm">
                {tag}
              </Tag>
            ))}
            {spark.tags.length > 3 && (
              <Tag type="cool-gray" size="sm">
                +{spark.tags.length - 3}
              </Tag>
            )}
          </div>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: '0.625rem', color: 'var(--cds-text-secondary)', whiteSpace: 'nowrap' }}>
            {formatDistanceToNow(new Date(spark.createdAt), { addSuffix: true })}
          </span>
          <OverflowMenu size="sm" flipped>
            <OverflowMenuItem
              itemText="Open"
              onClick={() => navigate(`/sparks/${spark.id}`)}
            />
            <OverflowMenuItem
              itemText="Delete"
              isDelete
              hasDivider
              onClick={() => {
                if (confirm(`Delete "${spark.title}"?`)) del.mutate();
              }}
            />
          </OverflowMenu>
        </div>
      </div>
    </ClickableTile>
  );
}
