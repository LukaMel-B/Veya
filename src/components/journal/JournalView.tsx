import React, { useState, useMemo } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { JournalEntry, Trip } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import {
  BookOpen,
  Plus,
  Search,
  MapPin,
  Luggage,
  Star,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

type ViewMode = 'all' | 'by_trip' | 'favorites';

export const JournalView: React.FC = () => {
  const { openJournalModal, showToast, setActiveJournalId } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Queries
  const allEntries = useLiveQuery(() => db.journalEntries.toArray(), []) || [];
  const trips = useLiveQuery(() => db.trips.toArray(), []) || [];
  const tripsMap = useMemo(() => new Map(trips.map((t) => [t.id, t])), [trips]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [allEntries]);

  // Filter & Search Logic
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      // View Mode Filter
      if (viewMode === 'favorites' && !entry.isFavorite) return false;

      // Tag Filter
      if (selectedTag && (!entry.tags || !entry.tags.includes(selectedTag))) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const query = search.toLowerCase();
        const trip = entry.tripId ? tripsMap.get(entry.tripId) : undefined;
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesContent = entry.content.toLowerCase().includes(query);
        const matchesLocation = entry.locationName?.toLowerCase().includes(query);
        const matchesTrip = trip && (trip.name.toLowerCase().includes(query) || trip.destination.toLowerCase().includes(query));
        const matchesTag = entry.tags?.some((t) => t.toLowerCase().includes(query));

        if (!matchesTitle && !matchesContent && !matchesLocation && !matchesTrip && !matchesTag) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort chronologically by entry date!
      const timeA = new Date(a.date + (a.time ? `T${a.time}` : 'T00:00:00')).getTime();
      const timeB = new Date(b.date + (b.time ? `T${b.time}` : 'T00:00:00')).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [allEntries, viewMode, selectedTag, search, sortOrder, tripsMap]);

  // Group by Trip for "by_trip" mode
  const groupedByTrip = useMemo(() => {
    const map = new Map<string, { trip?: Trip; entries: JournalEntry[] }>();

    // Bucket entries
    filteredEntries.forEach((entry) => {
      const key = entry.tripId || 'standalone';
      if (!map.has(key)) {
        map.set(key, {
          trip: entry.tripId ? tripsMap.get(entry.tripId) : undefined,
          entries: [],
        });
      }
      map.get(key)!.entries.push(entry);
    });

    return Array.from(map.entries());
  }, [filteredEntries, tripsMap]);

  // Toggle favorite helper
  const handleToggleFavorite = async (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = !entry.isFavorite;
      await db.journalEntries.update(entry.id, { isFavorite: updated, isEdited: true, updatedAt: new Date().toISOString() });
      showToast(updated ? 'Saved to favourites' : 'Removed from favourites', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetail = (entry: JournalEntry) => {
    setActiveJournalId(entry.id);
  };

  const favoritesCount = allEntries.filter((e) => e.isFavorite).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div id="journal-header" data-tour-target="journal-header">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--primary)', margin: 0 }}>
          Travel Journal
        </h2>
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search memories, locations, stories, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{
            width: '100%',
            paddingLeft: '38px',
            paddingRight: search ? '36px' : '12px',
            fontSize: '0.86rem',
            borderRadius: '9999px',
            height: '42px',
            backgroundColor: '#ffffff',
          }}
        />
        <Search
          size={16}
          strokeWidth={1.8}
          color="var(--secondary)"
          style={{ position: 'absolute', left: '13px', top: '13px' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: '12px',
              top: '11px',
              border: 'none',
              background: 'none',
              color: 'var(--secondary)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Segmented Filter Bar: All Memories, By Trip, Favourites */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div className="filter-chips-scroll" style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {/* All Memories Chip */}
          <button
            onClick={() => setViewMode('all')}
            className={`filter-chip ${viewMode === 'all' ? 'active' : ''}`}
            style={{
              backgroundColor: viewMode === 'all' ? '#111111' : 'var(--surface-neutral-1)',
              color: viewMode === 'all' ? '#ffffff' : 'var(--primary)',
              border: viewMode === 'all' ? '1px solid #111111' : '1px solid var(--stroke)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>All Memories</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: viewMode === 'all' ? '#ffffff' : 'var(--surface-neutral-2)',
                color: viewMode === 'all' ? '#111111' : 'var(--secondary)',
                fontWeight: 600,
              }}
            >
              {allEntries.length}
            </span>
          </button>

          {/* By Trip Chip */}
          <button
            onClick={() => setViewMode('by_trip')}
            className={`filter-chip ${viewMode === 'by_trip' ? 'active' : ''}`}
            style={{
              backgroundColor: viewMode === 'by_trip' ? '#111111' : 'var(--surface-neutral-1)',
              color: viewMode === 'by_trip' ? '#ffffff' : 'var(--primary)',
              border: viewMode === 'by_trip' ? '1px solid #111111' : '1px solid var(--stroke)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '9999px',
            }}
          >
            <span>By Trip</span>
          </button>

          {/* Favourites Chip */}
          <button
            onClick={() => setViewMode('favorites')}
            className={`filter-chip ${viewMode === 'favorites' ? 'active' : ''}`}
            style={{
              backgroundColor: viewMode === 'favorites' ? '#111111' : 'var(--surface-neutral-1)',
              color: viewMode === 'favorites' ? '#ffffff' : 'var(--primary)',
              border: viewMode === 'favorites' ? '1px solid #111111' : '1px solid var(--stroke)',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Star size={13} fill={viewMode === 'favorites' ? '#ffffff' : 'none'} strokeWidth={1.8} />
            <span>Favourites</span>
            {favoritesCount > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  backgroundColor: viewMode === 'favorites' ? '#ffffff' : 'var(--surface-neutral-2)',
                  color: viewMode === 'favorites' ? '#111111' : 'var(--secondary)',
                  fontWeight: 600,
                }}
              >
                {favoritesCount}
              </span>
            )}
          </button>
        </div>

        {/* Sort Chronological Button */}
        <button
          onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
          className="btn btn-ghost"
          style={{
            padding: '6px 10px',
            fontSize: '0.78rem',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
          title={sortOrder === 'desc' ? 'Newest memories first' : 'Oldest memories first'}
        >
          <ArrowUpDown size={13} />
          <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
        </button>
      </div>

      {/* Tag Filters Row (if any tags exist) */}
      {allTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
          }}
        >
          <button
            onClick={() => setSelectedTag(null)}
            className="filter-chip"
            style={{
              backgroundColor: selectedTag === null ? '#111111' : 'var(--surface-neutral-1)',
              color: selectedTag === null ? '#ffffff' : 'var(--secondary)',
              border: selectedTag === null ? '1px solid #111111' : '1px solid var(--stroke)',
              padding: '4px 10px',
              fontSize: '0.74rem',
              borderRadius: '9999px',
              flexShrink: 0,
            }}
          >
            All Tags
          </button>
          {allTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className="filter-chip"
                style={{
                  backgroundColor: isSelected ? '#111111' : 'var(--surface-neutral-1)',
                  color: isSelected ? '#ffffff' : 'var(--primary)',
                  border: isSelected ? '1px solid #111111' : '1px solid var(--stroke)',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  borderRadius: '9999px',
                  flexShrink: 0,
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN ENTRIES FEED */}
      {viewMode === 'by_trip' ? (
        /* Grouped By Trip View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupedByTrip.length > 0 ? (
            groupedByTrip.map(([key, group]) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {group.trip ? (
                      <Luggage size={14} color="var(--primary)" />
                    ) : (
                      <Sparkles size={14} color="var(--primary)" />
                    )}
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary)' }}>
                      {group.trip ? group.trip.name : 'Standalone Memories'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                    {group.entries.length} {group.entries.length === 1 ? 'memory' : 'memories'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.entries.map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      trip={entry.tripId ? tripsMap.get(entry.tripId) : undefined}
                      onClick={() => handleOpenDetail(entry)}
                      onToggleFavorite={(e) => handleToggleFavorite(entry, e)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyJournalState onAdd={() => openJournalModal()} isFiltered={Boolean(search || selectedTag)} />
          )}
        </div>
      ) : (
        /* All Memories & Favourites Feed */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                trip={entry.tripId ? tripsMap.get(entry.tripId) : undefined}
                onClick={() => handleOpenDetail(entry)}
                onToggleFavorite={(e) => handleToggleFavorite(entry, e)}
              />
            ))
          ) : (
            <EmptyJournalState
              onAdd={() => openJournalModal()}
              isFiltered={Boolean(search || selectedTag || viewMode === 'favorites')}
            />
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => openJournalModal()}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Record Memory"
      />

    </div>
  );
};

// ==========================================
// Reusable Journal Entry Card Component
// ==========================================
interface JournalEntryCardProps {
  entry: JournalEntry;
  trip?: Trip;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = React.memo(({
  entry,
  trip,
  onClick,
  onToggleFavorite,
}) => {
  const hasPhoto = entry.photos && entry.photos.length > 0;
  const coverPhoto = hasPhoto ? entry.photos![0] : null;

  return (
    <div
      onClick={onClick}
      className="travelnest-card"
      style={{
        padding: '14px 16px',
        backgroundColor: '#FFFFFF',
        margin: 0,
        cursor: 'pointer',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        borderRadius: '16px',
        border: '1px solid var(--stroke)',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 120ms ease, box-shadow 120ms ease',
      }}
    >
      {/* Thumbnail or Intentional Placeholder */}
      <div
        style={{
          width: '74px',
          height: '74px',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'var(--surface-neutral-1)',
          border: '1px solid var(--stroke)',
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={entry.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '6px' }}>
            <Sparkles size={20} strokeWidth={1.6} color="var(--secondary)" />
          </div>
        )}

        {/* Photo count indicator if multiple */}
        {entry.photos && entry.photos.length > 1 && (
          <span
            style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '9999px',
            }}
          >
            +{entry.photos.length - 1}
          </span>
        )}
      </div>

      {/* Content & Metadata */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--secondary)',
                fontWeight: 600,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              {formatDateDDmmmYY(entry.date)}
              {entry.time && ` · ${entry.time}`}
            </span>
            <h4
              style={{
                fontSize: '0.98rem',
                fontWeight: 700,
                color: 'var(--primary)',
                margin: '2px 0 0',
                letterSpacing: '-0.015em',
                lineHeight: '1.3',
              }}
            >
              {entry.title}
            </h4>
          </div>

          <button
            type="button"
            onClick={onToggleFavorite}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: entry.isFavorite ? '#E5A100' : 'var(--stroke)',
              flexShrink: 0,
            }}
            title={entry.isFavorite ? 'Favourited' : 'Add to favourites'}
          >
            <Star size={16} fill={entry.isFavorite ? '#E5A100' : 'none'} strokeWidth={1.8} />
          </button>
        </div>

        {/* Short Text Preview (2 lines clamp) */}
        {entry.content && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--secondary)',
              margin: '2px 0 4px',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {entry.content}
          </p>
        )}

        {/* Badges Row: Trip / Place / Mood / Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          {/* Linked Trip Badge */}
          {trip && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: 'var(--surface-neutral-2)',
                color: 'var(--primary)',
                padding: '2px 7px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Luggage size={10} />
              <span>{trip.name}</span>
            </span>
          )}

          {/* Location Badge */}
          {entry.locationName && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <MapPin size={10} />
              <span>{entry.locationName}</span>
            </span>
          )}

          {/* Mood Badge */}
          {entry.mood && (
            <span
              style={{
                fontSize: '10px',
                backgroundColor: 'var(--surface-neutral-1)',
                border: '1px solid var(--stroke)',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontWeight: 500,
              }}
            >
              {entry.mood}
            </span>
          )}

          {/* First tag */}
          {entry.tags && entry.tags.length > 0 && (
            <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 500 }}>
              #{entry.tags[0]}
              {entry.tags.length > 1 && ` +${entry.tags.length - 1}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ==========================================
// Empty Journal State Component
// ==========================================
interface EmptyJournalStateProps {
  onAdd: () => void;
  isFiltered: boolean;
}

const EmptyJournalState: React.FC<EmptyJournalStateProps> = ({ onAdd, isFiltered }) => {
  return (
    <div
      className="travelnest-card"
      style={{
        textAlign: 'center',
        padding: '44px 20px',
        backgroundColor: 'var(--surface-neutral-1)',
        margin: 0,
        borderRadius: '20px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '9999px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--stroke)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <BookOpen size={24} strokeWidth={1.8} color="var(--primary)" />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.015em' }}>
        {isFiltered ? 'No matching memories' : 'Your Journal is Empty'}
      </h3>

      <p
        style={{
          color: 'var(--secondary)',
          fontSize: '0.84rem',
          margin: '6px auto 20px',
          maxWidth: '290px',
          lineHeight: '1.45',
        }}
      >
        {isFiltered
          ? 'Try adjusting your search query, clearing filters, or switching view modes.'
          : 'Record a memory from years ago, an everyday highlight, or a trip adventure. Photos are optional!'}
      </p>

      <button
        onClick={onAdd}
        className="btn btn-primary"
        style={{ minHeight: '44px', padding: '0 20px', borderRadius: '9999px' }}
      >
        <Plus size={16} strokeWidth={2.2} />
        <span>Add First Journal Entry</span>
      </button>
    </div>
  );
};
