import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Search,
  Select,
  SelectItem,
  Tag,
  Button,
  Tile,
  SkeletonPlaceholder,
  InlineNotification,
} from '@carbon/react';
import { Close } from '@carbon/icons-react';
import { listSparks } from '../api/client';
import SparkCard from '../components/SparkCard';
import type { SparkListParams } from '../types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'distilled', label: 'Distilled' },
  { value: 'archived', label: 'Archived' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'image', label: 'Image' },
  { value: 'quote', label: 'Quote' },
  { value: 'mixed', label: 'Mixed' },
];

export default function BrowseView() {
  const [params, setParams] = useState<SparkListParams>({
    sort: 'createdAt',
    order: 'desc',
    limit: 50,
  });
  const [searchInput, setSearchInput] = useState('');

  function applySearch(value: string) {
    setParams((p) => ({ ...p, q: value || undefined }));
  }

  function clearFilters() {
    setParams({ sort: 'createdAt', order: 'desc', limit: 50 });
    setSearchInput('');
  }

  const hasFilters =
    !!params.q || !!params.status || !!params.contentType || !!params.tag;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sparks', params],
    queryFn: () => listSparks(params),
  });

  return (
    <Grid condensed>
      <Column sm={4} md={8} lg={16}>
        <div style={{ paddingTop: '1rem', paddingBottom: '1rem' }}>
          <h1 className="page-heading">Browse</h1>
          <p className="page-subheading">
            {data ? `${data.total} captures` : 'Your captured sparks'}
          </p>
        </div>
      </Column>

      {/* Filter bar */}
      <Column sm={4} md={8} lg={16}>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <Search
              id="search"
              labelText="Search"
              placeholder="Search title, tags, content…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') applySearch(searchInput);
              }}
              onClear={() => {
                setSearchInput('');
                applySearch('');
              }}
              size="lg"
            />
          </div>
          <div style={{ flex: '0 1 160px', minWidth: '140px' }}>
            <Select
              id="filter-status"
              labelText="Status"
              value={params.status ?? ''}
              onChange={(e) =>
                setParams((p) => ({ ...p, status: e.target.value || undefined }))
              }
            >
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} text={o.label} />
              ))}
            </Select>
          </div>
          <div style={{ flex: '0 1 160px', minWidth: '140px' }}>
            <Select
              id="filter-type"
              labelText="Type"
              value={params.contentType ?? ''}
              onChange={(e) =>
                setParams((p) => ({ ...p, contentType: e.target.value || undefined }))
              }
            >
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} text={o.label} />
              ))}
            </Select>
          </div>
          {hasFilters && (
            <Button
              kind="ghost"
              renderIcon={Close}
              size="md"
              onClick={clearFilters}
              style={{ alignSelf: 'flex-end', marginBottom: '1px' }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {params.q && (
              <Tag
                type="blue"
                size="sm"
                filter
                onClose={() => {
                  setSearchInput('');
                  setParams((p) => ({ ...p, q: undefined }));
                }}
              >
                {`Search: ${params.q}`}
              </Tag>
            )}
            {params.status && (
              <Tag
                type="green"
                size="sm"
                filter
                onClose={() => setParams((p) => ({ ...p, status: undefined }))}
              >
                {params.status}
              </Tag>
            )}
            {params.contentType && (
              <Tag
                type="purple"
                size="sm"
                filter
                onClose={() => setParams((p) => ({ ...p, contentType: undefined }))}
              >
                {params.contentType}
              </Tag>
            )}
          </div>
        )}
      </Column>

      {/* Results */}
      <Column sm={4} md={8} lg={16}>
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonPlaceholder key={i} style={{ height: '80px', width: '100%' }} />
            ))}
          </div>
        )}

        {isError && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error?.message}
          />
        )}

        {data?.items.map((spark) => (
          <SparkCard key={spark.id} spark={spark} />
        ))}

        {data?.items.length === 0 && !isLoading && (
          <Tile>
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              {hasFilters ? (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No results</p>
                  <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Try adjusting your search or filters.
                  </p>
                  <Button kind="ghost" renderIcon={Close} onClick={clearFilters}>Clear filters</Button>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No sparks yet</p>
                  <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                    Head to Capture to record your first idea.
                  </p>
                </>
              )}
            </div>
          </Tile>
        )}
      </Column>
    </Grid>
  );
}
