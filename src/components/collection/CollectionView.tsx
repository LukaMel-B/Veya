import React, { useState, useMemo } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CollectionItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_SAVED_CATEGORIES,
  getCountryFlag,
  getCountryCover,
  getCategoryBadge,
  detectCountry,
  getItemEffectiveCountry,
  normalizeCategory,
} from '../../utils/countryUtils';
import { SaveItemModal } from './SaveItemModal';
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit2,
  Tag,
  FolderPlus,
  X,
  Compass,
  Bookmark,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

export const CollectionView: React.FC = () => {
  const { showToast, showConfirm, searchQuery, setSearchQuery, setActiveTripId, setTripSubTab, setActiveCollectionItemId } = useApp();

  // Navigation State: null = Main Collections Grid, string = inside that Country
  const [openedCountry, setOpenedCountry] = useState<string | null>(null);

  // Filters inside Country Collection
  const [countryCategoryFilter, setCountryCategoryFilter] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<CollectionItem | null>(null);
  const [isCreateCountryModalOpen, setIsCreateCountryModalOpen] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');

  // Live Queries
  const allItems = useLiveQuery(() => db.collectionItems.toArray(), []);
  const allTrips = useLiveQuery(() => db.trips.toArray(), []);
  const allCountries = useLiveQuery(() => db.countries.toArray(), []);

  // Group items by country
  const countryCollections = useMemo(() => {
    const map = new Map<string, CollectionItem[]>();
    const tripsMap = new Map((allTrips || []).map((t) => [t.id, t]));

    // Include explicitly created countries from db.countries
    (allCountries || []).forEach((c) => {
      if (c.name && !map.has(c.name)) {
        map.set(c.name, []);
      }
    });

    (allItems || []).forEach((item) => {
      const country = getItemEffectiveCountry(item, tripsMap);
      if (country && country.toLowerCase() !== 'general') {
        if (!map.has(country)) {
          map.set(country, []);
        }
        map.get(country)!.push(item);
      }
    });

    return Array.from(map.entries()).map(([country, items]) => {
      const dbCountry = (allCountries || []).find(
        (c) => c.name.toLowerCase() === country.toLowerCase()
      );
      const itemWithImage = items.find((i) => i.imageUrl);
      const cover = itemWithImage?.imageUrl || dbCountry?.coverImage || getCountryCover(country);

      const categoryCounts: Record<string, number> = {};
      items.forEach((i) => {
        const cat = normalizeCategory(i.category);
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      return {
        country,
        items,
        count: items.length,
        cover,
        flag: dbCountry?.flag || getCountryFlag(country),
        categoryCounts,
      };
    });
  }, [allItems, allTrips, allCountries]);

  // Current Country items
  const currentCountryItems = useMemo(() => {
    if (!openedCountry) return [];
    if (openedCountry === '__all__') return allItems || [];
    const tripsMap = new Map((allTrips || []).map((t) => [t.id, t]));
    return (allItems || []).filter((i) => {
      const itemCountry = getItemEffectiveCountry(i, tripsMap);
      return itemCountry.toLowerCase() === openedCountry.trim().toLowerCase();
    });
  }, [openedCountry, allItems, allTrips]);

  // Extract all unique tags
  const currentCountryTags = useMemo(() => {
    const tagsSet = new Set<string>();
    currentCountryItems.forEach((i) => {
      if (Array.isArray(i.tags)) {
        i.tags.forEach((t) => {
          if (t && typeof t === 'string' && t.trim()) {
            tagsSet.add(t.trim());
          }
        });
      }
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  }, [currentCountryItems]);

  // Extract all categories available
  const currentCountryCategories = useMemo(() => {
    const catsSet = new Set<string>();
    currentCountryItems.forEach((i) => {
      const cat = normalizeCategory(i.category);
      catsSet.add(cat);
    });
    return Array.from(catsSet);
  }, [currentCountryItems]);

  // Filter items in current country
  const filteredCountryItems = useMemo(() => {
    return currentCountryItems.filter((item) => {
      const itemCategory = normalizeCategory(item.category);

      // Category filter
      if (countryCategoryFilter !== 'all' && itemCategory !== countryCategoryFilter.trim().toLowerCase()) {
        return false;
      }

      // Multi-selected tags filter
      if (selectedTags.length > 0) {
        const itemTags = (Array.isArray(item.tags) ? item.tags : [])
          .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()))
          .map((t) => t.trim().toLowerCase());
        const hasAllTags = selectedTags.every((t) => itemTags.includes(t.trim().toLowerCase()));
        if (!hasAllTags) return false;
      }

      // Search keyword filter
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
  }, [currentCountryItems, countryCategoryFilter, selectedTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCreateCountryCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCountryName.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    await db.saveCountry(formatted);
    setIsCreateCountryModalOpen(false);
    setNewCountryName('');
    setOpenedCountry(formatted);
    showToast(`Created finds folder for ${formatted}!`, 'success');
  };

  const handleDeleteCountry = async (e: React.MouseEvent, countryName: string, count: number) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: `Delete "${countryName}" folder?`,
      kicker: 'DELETE FINDS FOLDER',
      message: count > 0
        ? `This will remove the ${countryName} folder from your Finds. Your ${count} saved find${count > 1 ? 's' : ''} will be kept safely in All Saved Finds.`
        : `This will remove the ${countryName} folder from your Finds.`,
      confirmText: 'Delete Folder',
      cancelText: 'Keep Folder',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.deleteCountry(countryName);
        if (openedCountry?.toLowerCase() === countryName.toLowerCase()) {
          setOpenedCountry(null);
        }
        showToast(`Deleted ${countryName} folder.`, 'info');
      } catch (err: any) {
        showToast('Error deleting country folder: ' + err.message, 'error');
      }
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const item = (allItems || []).find((i) => i.id === id);
    const confirmed = await showConfirm({
      title: item?.title ? `Delete "${item.title}"?` : 'Delete this saved spot?',
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

  const handleEditItem = (e: React.MouseEvent, item: CollectionItem) => {
    e.stopPropagation();
    setItemToEdit(item);
    setIsSaveModalOpen(true);
  };

  // Quick action: jump to matching trip dashboard
  const matchingTrip = (allTrips || []).find((t) => {
    if (!openedCountry || openedCountry === '__all__') return false;
    const tripCountry = t.country || detectCountry(t.destination);
    return tripCountry.toLowerCase() === openedCountry.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* ========================================================
          VIEW 1: COLLECTIONS GALLERY OVERVIEW
         ======================================================== */}
      {!openedCountry && (
        <>
          {/* Header */}
          <div
            id="collection-header"
            data-tour-target="collection-header"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div>
              <div className="label-micro">Library & Research</div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--primary)', margin: 0 }}>
                Finds
              </h2>
              <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                {countryCollections.length} country folders · {allItems?.length || 0} saved finds
              </p>
            </div>

            <button
              onClick={() => setIsCreateCountryModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <FolderPlus size={13} strokeWidth={2} />
              <span>+ Folder</span>
            </button>
          </div>

          {/* 2-Column Collections Grid or Empty State */}
          {(allItems?.length || 0) === 0 && countryCollections.length === 0 ? (
            <div
              className="travelnest-card"
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                backgroundColor: 'var(--surface-neutral-1)',
                margin: 0,
                borderRadius: '20px',
                border: '1px solid var(--stroke)',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Bookmark size={24} color="var(--primary)" strokeWidth={1.8} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--primary)' }}>
                Your Finds are Empty
              </h4>
              <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '0 auto 18px', maxWidth: '300px', lineHeight: 1.45 }}>
                Save restaurant recommendations, secret viewpoints, cultural sights, and travel links organized by country.
              </p>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="btn btn-primary"
                style={{ margin: '0 auto', fontSize: '0.84rem', borderRadius: '9999px', padding: '0 20px' }}
              >
                <Plus size={15} strokeWidth={2.2} />
                <span>Save First Find</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              {/* "All Saved" Card */}
              <div
                onClick={() => setOpenedCountry('__all__')}
                className="travelnest-card"
                style={{
                  padding: 0,
                  cursor: 'pointer',
                  margin: 0,
                  overflow: 'hidden',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 140ms ease',
                }}
              >
              <div
                style={{
                  height: '135px',
                  position: 'relative',
                  backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 17, 0.25), rgba(17, 17, 17, 0.85)), url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: '#111111',
                      borderRadius: '9999px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {allItems?.length || 0}
                  </span>
                </div>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                    All Saved Finds
                  </div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.72rem' }}>
                    All Finds
                  </span>
                </div>
              </div>
            </div>

            {/* Country Collection Cards */}
            {countryCollections.map((col) => (
              <div
                key={col.country}
                onClick={() => setOpenedCountry(col.country)}
                className="travelnest-card"
                style={{
                  padding: 0,
                  cursor: 'pointer',
                  margin: 0,
                  overflow: 'hidden',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 140ms ease',
                }}
              >
                <div
                  style={{
                    height: '135px',
                    position: 'relative',
                    backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 17, 0.2), rgba(17, 17, 17, 0.85)), url(${col.cover})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCountry(e, col.country, col.count)}
                      title={`Delete ${col.country} folder`}
                      aria-label={`Delete ${col.country} folder`}
                      style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <Trash2 size={11} strokeWidth={2.2} />
                    </button>
                    <span
                      style={{
                        backgroundColor: '#111111',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 700,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {col.count}
                    </span>
                  </div>

                  <div>
                    <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', margin: 0, letterSpacing: '-0.01em' }}>
                      {col.country}
                    </h4>

                    {/* Category preview icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', opacity: 0.9 }}>
                      {Object.entries(col.categoryCounts)
                        .slice(0, 3)
                        .map(([cat, count]) => {
                          const badge = getCategoryBadge(cat);
                          return (
                            <span key={cat} style={{ fontSize: '0.66rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>{badge.icon}</span>
                              <span style={{ fontWeight: 600 }}>{count}</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          <FloatingActionButton
            onClick={() => setIsSaveModalOpen(true)}
            icon={<Plus size={24} strokeWidth={2.4} />}
            label="Save Find"
          />
        </>
      )}

      {/* ========================================================
          VIEW 2: INSIDE A COUNTRY COLLECTION FOLDER
         ======================================================== */}
      {openedCountry && (
        <>
          {/* Top Back Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '2px' }}>
            <button
              onClick={() => {
                setOpenedCountry(null);
                setSelectedTags([]);
                setCountryCategoryFilter('all');
                setSearchQuery('');
              }}
              className="btn btn-ghost"
              style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <ChevronLeft size={18} color="var(--primary)" strokeWidth={2.2} />
              <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                Finds
              </span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {openedCountry !== '__all__' && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteCountry(e, openedCountry, currentCountryItems.length)}
                  className="btn btn-ghost btn-sm"
                  style={{ minHeight: '34px', padding: '4px 10px', fontSize: '0.78rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title={`Delete ${openedCountry} folder`}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  <span>Delete Folder</span>
                </button>
              )}

              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ minHeight: '34px', padding: '4px 14px', fontSize: '0.78rem' }}
              >
                <Plus size={13} strokeWidth={2.2} />
                <span>Add Find</span>
              </button>
            </div>
          </div>

          {/* Collection Title Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>
                  {openedCountry === '__all__' ? 'All Saved Finds' : `${openedCountry} Finds`}
                </h2>
              </div>
              <p style={{ color: 'var(--secondary)', fontSize: '0.78rem', marginTop: '2px' }}>
                {filteredCountryItems.length} of {currentCountryItems.length} finds shown
              </p>
            </div>

            {matchingTrip && (
              <button
                onClick={() => {
                  setActiveTripId(matchingTrip.id);
                  setTripSubTab('saved');
                }}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.74rem', padding: '4px 10px', minHeight: '32px' }}
                title="Open in Trip Dashboard"
              >
                <span>Plan in Trip</span>
                <ChevronRight size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              strokeWidth={2}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--secondary)',
              }}
            />
            <input
              type="text"
              placeholder={`Search ${openedCountry === '__all__' ? 'all spots' : openedCountry} by title, notes, tags or URL...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ height: '38px', paddingLeft: '34px', paddingRight: searchQuery ? '32px' : '12px', fontSize: '0.82rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-ghost"
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', padding: '2px', color: 'var(--secondary)' }}
              >
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Tag Choice Bar (Pill shapes) */}
          {currentCountryTags.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="label-micro" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={10} strokeWidth={2} />
                  <span>Filter Tags</span>
                  {selectedTags.length > 0 && (
                    <span style={{ backgroundColor: 'var(--primary)', color: '#ffffff', borderRadius: '9999px', padding: '0 5px', fontSize: '9px' }}>
                      {selectedTags.length}
                    </span>
                  )}
                </span>

                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, padding: 0 }}
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
                  paddingBottom: '3px',
                  scrollbarWidth: 'none',
                }}
              >
                {currentCountryTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const tagCount = currentCountryItems.filter((i) => i.tags?.includes(tag)).length;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`filter-chip ${isSelected ? 'active' : ''}`}
                    >
                      <span>#{tag}</span>
                      <span className="chip-count-bubble">{tagCount}</span>
                      {isSelected && <X size={11} strokeWidth={2} style={{ marginLeft: '2px' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Filter Segmented Bar */}
          <div className="cupertino-segmented" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setCountryCategoryFilter('all')}
              className={`cupertino-segment-item ${countryCategoryFilter === 'all' ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <span>All</span>
              <span className="chip-count-bubble">{currentCountryItems.length}</span>
            </button>
            {DEFAULT_SAVED_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const count = currentCountryItems.filter((i) => normalizeCategory(i.category) === cat.id).length;
              if (count === 0 && !currentCountryCategories.includes(cat.id)) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCountryCategoryFilter(cat.id)}
                  className={`cupertino-segment-item ${countryCategoryFilter === cat.id ? 'active' : ''}`}
                  style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label.split(' ')[0]}</span>
                  <span className="chip-count-bubble">{count}</span>
                </button>
              );
            })}
            {/* Custom categories if present */}
            {currentCountryCategories
              .filter((catId) => !DEFAULT_SAVED_CATEGORIES.some((c) => c.id === catId))
              .map((customCatId) => {
                const count = currentCountryItems.filter((i) => normalizeCategory(i.category) === customCatId).length;
                const badge = getCategoryBadge(customCatId);
                return (
                  <button
                    key={customCatId}
                    onClick={() => setCountryCategoryFilter(customCatId)}
                    className={`cupertino-segment-item ${countryCategoryFilter === customCatId ? 'active' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                    <span className="chip-count-bubble">{count}</span>
                  </button>
                );
              })}
          </div>

          {/* Saved Items List */}
          {filteredCountryItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredCountryItems.map((item) => {
                const categoryBadge = getCategoryBadge(item.category || 'place');
                const displayCountry = (item.country && typeof item.country === 'string' && item.country.trim())
                  ? item.country.trim()
                  : (openedCountry === '__all__' ? 'General' : openedCountry) || 'General';
                const itemTags = (Array.isArray(item.tags) ? item.tags : [])
                  .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()));

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveCollectionItemId(item.id)}
                    className="travelnest-card"
                    style={{
                      padding: 0,
                      margin: 0,
                      overflow: 'hidden',
                      borderRadius: '16px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Optional Image Cover Header */}
                    {item.imageUrl && (
                      <div
                        style={{
                          height: '130px',
                          backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 17, 0.15), rgba(17, 17, 17, 0.75)), url(${item.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: '#111111',
                            color: '#ffffff',
                            borderRadius: '9999px',
                            padding: '3px 10px',
                            fontSize: '10px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                          }}
                        >
                          <span>{categoryBadge.icon}</span>
                          <span>{categoryBadge.label}</span>
                        </span>

                        <span
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            color: '#111111',
                            borderRadius: '9999px',
                            padding: '3px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {displayCountry}
                        </span>
                      </div>
                    )}

                    {/* Card Content Body */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {!item.imageUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span
                            style={{
                              backgroundColor: 'var(--surface-neutral-1)',
                              color: 'var(--primary)',
                              borderRadius: '9999px',
                              padding: '2px 8px',
                              fontSize: '10px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid var(--stroke)',
                            }}
                          >
                            <span>{categoryBadge.icon}</span>
                            <span>{categoryBadge.label}</span>
                          </span>

                          <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>
                            {displayCountry}
                          </span>
                        </div>
                      )}

                      <div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, margin: 0, color: 'var(--primary)', lineHeight: 1.3 }}>
                          {item.title || 'Untitled Spot'}
                        </h4>

                        {item.notes && (
                          <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', margin: '4px 0 0', lineHeight: 1.4 }}>
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Clickable URL Preview */}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: '8px 12px',
                            margin: '2px 0',
                            backgroundColor: 'var(--surface-neutral-1)',
                            border: '1px solid var(--stroke)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.76rem',
                            fontWeight: 500,
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                            🔗 {item.url}
                          </span>
                          <ExternalLink size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
                        </a>
                      )}

                      {/* Hashtag Badges */}
                      {itemTags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {itemTags.map((t) => (
                            <span
                              key={t}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(t);
                              }}
                              style={{
                                fontSize: '10px',
                                color: selectedTags.includes(t) ? '#ffffff' : 'var(--secondary)',
                                backgroundColor: selectedTags.includes(t) ? 'var(--primary)' : 'var(--surface-neutral-1)',
                                border: '1px solid var(--stroke)',
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

                      {/* Footer Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '6px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--stroke)',
                        }}
                      >
                        <button
                          onClick={(e) => handleEditItem(e, item)}
                          className="btn btn-ghost"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', color: 'var(--primary)' }}
                        >
                          <Edit2 size={12} strokeWidth={2} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className="btn btn-ghost"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', color: 'var(--secondary)' }}
                        >
                          <Trash2 size={12} strokeWidth={1.8} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="travelnest-card" style={{ padding: '36px 16px', textAlign: 'center', backgroundColor: 'var(--surface-neutral-1)' }}>
              <Compass size={36} strokeWidth={1.5} color="var(--secondary)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>No saved spots matched</h4>
              <p style={{ color: 'var(--secondary)', fontSize: '0.8rem', margin: '4px auto 14px' }}>
                Try adjusting your search query or tag filters.
              </p>
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setCountryCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ margin: '0 auto' }}
              >
                Clear all filters
              </button>
            </div>
          )}

          <FloatingActionButton
            onClick={() => setIsSaveModalOpen(true)}
            icon={<Plus size={24} strokeWidth={2.4} />}
            label="Save Find"
          />
        </>
      )}

      {/* Sheet Modal for creating a new Country Finds Folder */}
      {isCreateCountryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateCountryModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 18px 12px',
                borderBottom: '1px solid var(--stroke)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsCreateCountryModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>New Country Finds Folder</h3>
              <button
                type="button"
                onClick={handleCreateCountryCollection}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
              >
                Create
              </button>
            </div>

            <form onSubmit={handleCreateCountryCollection} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="label-micro">Country Name</label>
                <input
                  type="text"
                  placeholder="e.g. Greece, Norway, New Zealand, Vietnam..."
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  className="input"
                  required
                  autoFocus
                />
              </div>

              <p style={{ fontSize: '0.74rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.4 }}>
                Creates a folder for organizing field notes, attractions, food, and stays for this destination.
              </p>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }}>
                <span>Create Folder</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Save Item Sheet Modal */}
      <SaveItemModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setItemToEdit(null);
        }}
        preselectedCountry={openedCountry && openedCountry !== '__all__' ? openedCountry : (allCountries?.[0]?.name || '')}
        preselectedTripId={matchingTrip?.id}
        itemToEdit={itemToEdit}
      />
    </div>
  );
};
