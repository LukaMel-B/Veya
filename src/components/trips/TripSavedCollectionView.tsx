import React, { useState, useMemo } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, CollectionItem, ItineraryEvent, EventCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_SAVED_CATEGORIES,
  detectCountry,
  getCategoryBadge,
  getItemEffectiveCountry,
  normalizeCategory,
} from '../../utils/countryUtils';
import { SaveItemModal } from '../collection/SaveItemModal';
import {
  CalendarPlus,
  Plus,
  ExternalLink,
  CheckCircle2,
  Search,
  Tag,
  Compass,
  X,
  Trash2,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface TripSavedCollectionViewProps {
  trip: Trip;
}

export const TripSavedCollectionView: React.FC<TripSavedCollectionViewProps> = ({ trip }) => {
  const { showToast, showConfirm, setActiveCollectionItemId } = useApp();

  // Country detection for this trip
  const tripCountry = trip.country || detectCountry(trip.destination);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Itinerary Day Picker Modal State
  const [schedulingItem, setSchedulingItem] = useState<CollectionItem | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('12:00');
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('13:30');

  // Add new item to this country modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Queries
  const allItems = useLiveQuery(() => db.collectionItems.toArray(), []);
  const allTrips = useLiveQuery(() => db.trips.toArray(), []);
  const events = useLiveQuery(
    () => db.itineraryEvents.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  // Filter items that belong to this trip's country
  const countryItems = useMemo(() => {
    const tripsMap = new Map((allTrips || []).map((t) => [t.id, t]));
    return (allItems || []).filter((item) => {
      const effCountry = getItemEffectiveCountry(item, tripsMap);
      return (
        effCountry.toLowerCase() === tripCountry.trim().toLowerCase() ||
        item.tripId === trip.id
      );
    });
  }, [allItems, tripCountry, trip.id, allTrips]);

  // Calculate total days for this trip
  const totalTripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return 5;
    const start = new Date(trip.startDate).getTime();
    const end = new Date(trip.endDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, [trip.startDate, trip.endDate]);

  // Extract all tags across this country's items
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    countryItems.forEach((i) => {
      if (Array.isArray(i.tags)) {
        i.tags.forEach((t) => {
          if (t && typeof t === 'string' && t.trim()) {
            set.add(t.trim());
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [countryItems]);

  // Check if an item is already scheduled in this trip's itinerary
  const getItemScheduledDay = (item: CollectionItem): number | null => {
    const itemTitle = (item.title || '').toLowerCase().trim();
    const matchedEvent = (events || []).find((ev) => {
      const evTitle = (ev.title || '').toLowerCase().trim();
      return (
        (itemTitle.length > 0 && evTitle === itemTitle) ||
        (item.placeId && ev.placeId === item.placeId)
      );
    });
    return matchedEvent ? matchedEvent.dayNumber : null;
  };

  // Filtered items based on Category, Multi-selected Tags, and Search
  const filteredItems = useMemo(() => {
    return countryItems.filter((item) => {
      const itemCategory = normalizeCategory(item.category);

      // Category
      if (selectedCategory !== 'all' && itemCategory !== selectedCategory.trim().toLowerCase()) {
        return false;
      }

      // Multi-selected tags
      if (selectedTags.length > 0) {
        const itemTags = (Array.isArray(item.tags) ? item.tags : [])
          .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
          .map((t) => t.trim().toLowerCase());
        const hasAll = selectedTags.every((t) => itemTags.includes(t.trim().toLowerCase()));
        if (!hasAll) return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = (item.title || '').toLowerCase().includes(query);
        const matchesNotes = (item.notes || '').toLowerCase().includes(query);
        const matchesUrl = (item.url || '').toLowerCase().includes(query);
        const matchesCat = itemCategory.includes(query);
        const matchesTag = (Array.isArray(item.tags) ? item.tags : [])
          .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
          .some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesNotes && !matchesUrl && !matchesCat && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [countryItems, selectedCategory, selectedTags, searchQuery]);

  // Group filtered items by category
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, CollectionItem[]>();
    filteredItems.forEach((item) => {
      const cat = normalizeCategory(item.category);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return map;
  }, [filteredItems]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Map collection category to Itinerary event category
  const mapToEventCategory = (cat: string): EventCategory => {
    switch (cat) {
      case 'food':
        return 'food';
      case 'stay':
        return 'lodging';
      case 'activity':
        return 'activity';
      case 'transport':
        return 'travel';
      default:
        return 'sightseeing';
    }
  };

  const handleScheduleInItinerary = async () => {
    if (!schedulingItem) return;

    try {
      const dateObj = new Date(trip.startDate);
      dateObj.setDate(dateObj.getDate() + (selectedDayNumber - 1));
      const dateStr = dateObj.toISOString().split('T')[0];

      const newEvent: ItineraryEvent = {
        id: 'ev-' + Date.now(),
        tripId: trip.id,
        dayNumber: selectedDayNumber,
        date: dateStr,
        startTime: scheduledStartTime,
        endTime: scheduledEndTime,
        title: schedulingItem.title,
        location: schedulingItem.title,
        category: mapToEventCategory(schedulingItem.category),
        placeId: schedulingItem.placeId,
        notes: schedulingItem.notes,
        orderIndex: (events || []).filter((e) => e.dayNumber === selectedDayNumber).length,
        createdAt: new Date().toISOString(),
      };

      await db.itineraryEvents.add(newEvent);

      await db.collectionItems.update(schedulingItem.id, {
        tripId: trip.id,
        status: 'assigned',
        isPlanned: true,
      });

      showToast(`Added to Day ${selectedDayNumber} Itinerary`, 'success');
      setSchedulingItem(null);
    } catch (err: any) {
      showToast('Error scheduling item: ' + err.message, 'error');
    }
  };

  const handleDeleteSavedItem = async (id: string, itemTitle?: string) => {
    const confirmed = await showConfirm({
      title: itemTitle ? `Delete "${itemTitle}"?` : 'Delete this spot?',
      kicker: 'IRREVERSIBLE',
      message: 'This will remove this item from your saved collection. Associated itinerary items and trips will remain intact.',
      confirmText: 'Delete Spot',
      cancelText: 'Keep Spot',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.collectionItems.delete(id);
        showToast('Saved item removed.', 'info');
      } catch (err: any) {
        showToast('Error deleting item: ' + err.message, 'error');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Country Header Card */}
      <div
        className="travelnest-card"
        style={{
          margin: 0,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-neutral-1)',
        }}
      >
        <div>
          <span className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
            REGIONAL DOSSIER
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--primary)' }}>
            Saved for {tripCountry}
          </h3>
          <p style={{ color: 'var(--neutral-carbon)', fontSize: '0.8rem', margin: '4px 0 0' }}>
            {countryItems.length} curated spots ready to incorporate into daily plan
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--neutral-carbon)',
          }}
        />
        <input
          type="text"
          placeholder={`Search ${tripCountry} food, places, stays...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{
            height: '42px',
            minHeight: '42px',
            paddingLeft: '38px',
            paddingRight: searchQuery ? '38px' : '14px',
            fontSize: '0.84rem',
            borderRadius: '9999px',
            background: 'var(--surface-neutral-1)',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="btn-icon"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '26px',
              height: '26px',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Multi-Selectable Tag Choice Bar */}
      {availableTags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={10} />
              <span>FILTER BY TAGS</span>
              {selectedTags.length > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '0 6px',
                    fontSize: '0.62rem',
                  }}
                >
                  {selectedTags.length}
                </span>
              )}
            </span>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto' }}
              >
                Clear tags
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {availableTags.map((t) => {
              const isSelected = selectedTags.includes(t);
              const tagCount = countryItems.filter((i) => i.tags?.includes(t)).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`filter-chip ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>#{t}</span>
                  <span className="chip-count-bubble">{tagCount}</span>
                  {isSelected && <X size={11} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Segmented Controls */}
      <div className="cupertino-segmented" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`cupertino-segment-item ${selectedCategory === 'all' ? 'active' : ''}`}
          style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span>All</span>
          <span className="chip-count-bubble">{countryItems.length}</span>
        </button>
        {DEFAULT_SAVED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
          const count = countryItems.filter((i) => normalizeCategory(i.category) === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`cupertino-segment-item ${selectedCategory === cat.id ? 'active' : ''}`}
              style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label.split(' ')[0]}</span>
              <span className="chip-count-bubble">{count}</span>
            </button>
          );
        })}
        {Array.from(groupedByCategory.keys())
          .filter((catId) => !DEFAULT_SAVED_CATEGORIES.some((c) => c.id === catId))
          .map((customCatId) => {
            const count = countryItems.filter((i) => normalizeCategory(i.category) === customCatId).length;
            const badge = getCategoryBadge(customCatId);
            return (
              <button
                key={customCatId}
                onClick={() => setSelectedCategory(customCatId)}
                className={`cupertino-segment-item ${selectedCategory === customCatId ? 'active' : ''}`}
                style={{ fontSize: '0.76rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
                <span className="chip-count-bubble">{count}</span>
              </button>
            );
          })}
      </div>

      {/* Well-Sorted Category Sections / Feed */}
      {filteredItems.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Array.from(groupedByCategory.entries()).map(([catId, itemsInCat]) => {
            const catBadge = getCategoryBadge(catId);

            return (
              <div key={catId} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Category Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1rem' }}>{catBadge.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--primary)' }}>
                      {catBadge.label}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'var(--surface-neutral-2)',
                        color: 'var(--neutral-carbon)',
                        borderRadius: '9999px',
                        padding: '1px 8px',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                      }}
                    >
                      {itemsInCat.length}
                    </span>
                  </div>
                </div>

                {/* Items in this category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {itemsInCat.map((item) => {
                    const scheduledDay = getItemScheduledDay(item);
                    const itemTags = (Array.isArray(item.tags) ? item.tags : [])
                      .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()));

                    return (
                      <div
                        key={item.id}
                        className="travelnest-card"
                        style={{
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          border: scheduledDay ? '1px solid var(--primary)' : '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4
                                onClick={() => setActiveCollectionItemId(item.id)}
                                style={{
                                  fontSize: '0.98rem',
                                  fontWeight: 700,
                                  margin: 0,
                                  lineHeight: 1.3,
                                  color: 'var(--primary)',
                                  cursor: 'pointer',
                                }}
                              >
                                {item.title || 'Untitled Spot'}
                              </h4>
                            </div>

                            {item.notes && (
                              <p style={{ color: 'var(--neutral-carbon)', fontSize: '0.82rem', margin: '6px 0 0', lineHeight: 1.4 }}>
                                {item.notes}
                              </p>
                            )}
                          </div>

                          {/* Cover Thumbnail if present */}
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title || 'Spot thumbnail'}
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                objectFit: 'cover',
                                marginLeft: '12px',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>

                        {/* URL Link Button */}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.76rem',
                              color: 'var(--primary)',
                              textDecoration: 'none',
                              fontWeight: 600,
                              maxWidth: 'fit-content',
                            }}
                          >
                            <span>Open Link / Instagram</span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {/* Tags */}
                        {itemTags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {itemTags.map((t) => (
                              <span
                                key={t}
                                onClick={() => toggleTag(t)}
                                style={{
                                  fontSize: '0.7rem',
                                  color: selectedTags.includes(t) ? '#ffffff' : 'var(--neutral-carbon)',
                                  backgroundColor: selectedTags.includes(t) ? 'var(--primary)' : 'var(--surface-neutral-2)',
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  cursor: 'pointer',
                                  fontWeight: 500,
                                }}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Toolbar */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          {scheduledDay ? (
                            <span
                              style={{
                                backgroundColor: '#111111',
                                color: '#ffffff',
                                borderRadius: '9999px',
                                padding: '0 12px',
                                height: '28px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Scheduled for Day {scheduledDay}</span>
                            </span>
                          ) : (
                            <div />
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Don't add a schedule button on a note (Req 9) */}
                            {item.type !== 'note' && (
                              <button
                                onClick={() => {
                                  setSchedulingItem(item);
                                  setSelectedDayNumber(scheduledDay || 1);
                                }}
                                className={`btn ${scheduledDay ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  height: '32px',
                                  minHeight: '32px',
                                  padding: '0 12px',
                                  borderRadius: '9999px',
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                }}
                              >
                                <CalendarPlus size={13} />
                                <span>{scheduledDay ? 'Reschedule' : 'Add to Schedule'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteSavedItem(item.id, item.title)}
                              className="btn-icon"
                              style={{
                                width: '32px',
                                height: '32px',
                                minHeight: '32px',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                              }}
                              title="Delete"
                              aria-label="Delete saved spot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="travelnest-card" style={{ padding: '40px 20px', textAlign: 'center', margin: 0 }}>
          <Compass size={36} color="var(--neutral-carbon)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>No saved spots found</h4>
          <p style={{ color: 'var(--neutral-carbon)', fontSize: '0.84rem', margin: '6px auto 0', maxWidth: '320px' }}>
            {countryItems.length === 0
              ? `You don't have any spots saved for ${tripCountry} yet.`
              : 'No items match your active search or tag filters.'}
          </p>
        </div>
      )}

      {/* Modal: Day Picker to Add to Itinerary */}
      {schedulingItem && (
        <div className="modal-overlay" onClick={() => setSchedulingItem(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setSchedulingItem(null)}
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                Add to Itinerary
              </h3>
              <button
                type="button"
                onClick={handleScheduleInItinerary}
                className="btn btn-primary btn-sm"
              >
                Save
              </button>
            </div>

            <div style={{ padding: '18px 20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                }}
              >
                <span className="label-micro" style={{ marginBottom: '2px', display: 'block' }}>
                  SELECTED SPOT
                </span>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {schedulingItem.title}
                </div>
              </div>

              {/* Day Selector */}
              <div>
                <label className="label-micro" style={{ marginBottom: '8px', display: 'block' }}>
                  SELECT TRIP DAY
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                  }}
                >
                  {Array.from({ length: totalTripDays }).map((_, index) => {
                    const dayNum = index + 1;
                    const isSelected = selectedDayNumber === dayNum;
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setSelectedDayNumber(dayNum)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '12px',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-neutral-1)',
                          color: isSelected ? '#ffffff' : 'var(--primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Day {dayNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                    START TIME
                  </label>
                  <input
                    type="time"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                    END TIME
                  </label>
                  <input
                    type="time"
                    value={scheduledEndTime}
                    onChange={(e) => setScheduledEndTime(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleScheduleInItinerary}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                <span>Add to Day {selectedDayNumber} Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save New Item Modal */}
      <SaveItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        preselectedCountry={tripCountry}
        preselectedTripId={trip.id}
      />

      <FloatingActionButton
        onClick={() => setIsAddModalOpen(true)}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Save Spot"
      />
    </div>
  );
};
