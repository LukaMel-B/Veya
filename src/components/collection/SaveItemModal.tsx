import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useApp } from '../../context/AppContext';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CollectionItem, CollectionItemType } from '../../types';
import {
  DEFAULT_SAVED_CATEGORIES,
  getCountryFlag,
  detectCountry,
  type SavedCategory,
} from '../../utils/countryUtils';
import {
  X,
  Globe,
  Link2,
  Tag,
  FolderPlus,
  Image as ImageIcon,
  Luggage,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface SaveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCountry?: string;
  preselectedTripId?: string;
  itemToEdit?: CollectionItem | null;
  onSaved?: (item: CollectionItem) => void;
}

export const SaveItemModal: React.FC<SaveItemModalProps> = ({
  isOpen,
  onClose,
  preselectedCountry,
  preselectedTripId,
  itemToEdit,
  onSaved,
}) => {
  const { showToast, showConfirm } = useApp();

  const allItems = useLiveQuery(() => db.collectionItems.toArray(), []);
  const allTrips = useLiveQuery(() => db.trips.toArray(), []);
  const allCountries = useLiveQuery(() => db.countries.toArray(), []);

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<CollectionItemType>('link');
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(preselectedTripId || itemToEdit?.tripId);

  // Country Selection
  const [selectedCountry, setSelectedCountry] = useState<string>(preselectedCountry || '');
  const [isCreatingNewCountry, setIsCreatingNewCountry] = useState(false);
  const [newCountryInput, setNewCountryInput] = useState('');

  // Category Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('food');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState<SavedCategory[]>([]);

  // Collect all known countries from db and items
  const knownCountries = Array.from(
    new Set([
      ...(allCountries || []).map((c) => c.name).filter(Boolean),
      ...(allItems || []).map((i) => i.country).filter(Boolean),
      ...(allTrips || []).map((t) => t.country || detectCountry(t.destination)).filter(Boolean),
    ])
  ).sort();

  useEffect(() => {
    if (preselectedCountry) {
      setSelectedCountry(preselectedCountry);
    } else if (!selectedCountry && allCountries && allCountries.length > 0) {
      setSelectedCountry(allCountries[0].name);
    }
  }, [preselectedCountry, allCountries]);

  // Extract custom categories
  useEffect(() => {
    if (allItems) {
      const defaultIds = new Set(DEFAULT_SAVED_CATEGORIES.map((c) => c.id));
      const extraCategories: SavedCategory[] = [];
      const seen = new Set<string>();

      allItems.forEach((item) => {
        if (item.category && !defaultIds.has(item.category) && !seen.has(item.category)) {
          seen.add(item.category);
          extraCategories.push({
            id: item.category,
            label: item.category.charAt(0).toUpperCase() + item.category.slice(1),
            icon: '🏷️',
          });
        }
      });
      setCustomCategories(extraCategories);
    }
  }, [allItems]);

  // Reset or fill form on open
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setTitle(itemToEdit.title || '');
        setUrl(itemToEdit.url || '');
        setNotes(itemToEdit.notes || '');
        setTags(itemToEdit.tags?.join(', ') || '');
        setImageUrl(itemToEdit.imageUrl || '');
        setType(itemToEdit.type || 'link');
        setSelectedCountry(itemToEdit.country || 'Japan');
        setSelectedCategory(itemToEdit.category || 'place');
        setSelectedTripId(itemToEdit.tripId);
      } else {
        setTitle('');
        setUrl('');
        setNotes('');
        setTags('');
        setImageUrl('');
        setType('link');
        setSelectedCountry(preselectedCountry || 'Japan');
        setSelectedCategory('food');
        setSelectedTripId(preselectedTripId);
      }
      setIsCreatingNewCountry(false);
      setNewCountryInput('');
      setIsCreatingNewCategory(false);
      setNewCategoryInput('');
    }
  }, [isOpen, itemToEdit, preselectedCountry, preselectedTripId]);

  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️');

  const dbCategories = useLiveQuery(
    () => db.categories.where('scope').equals('collection').toArray(),
    []
  );

  const handleAddNewCountry = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCountryInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    await db.saveCountry(formatted);
    setSelectedCountry(formatted);
    setIsCreatingNewCountry(false);
    setNewCountryInput('');
    showToast(`Added collection for ${formatted}!`, 'info');
  };

  const handleAddNewCategory = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    try {
      const saved = await db.saveCategory(trimmed, newCategoryIcon || '🏷️', 'collection');
      setSelectedCategory(saved.id);
      setIsCreatingNewCategory(false);
      setNewCategoryInput('');
      showToast(`Category "${saved.label}" added!`, 'info');
    } catch (err: any) {
      showToast('Error saving category: ' + err.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a title or place name.', 'error');
      return;
    }

    if (type === 'link' && !url.trim()) {
      showToast('Please enter a link URL (*required).', 'error');
      return;
    }

    if (!selectedCountry) {
      showToast('Please assign a country collection.', 'error');
      return;
    }

    try {
      await db.saveCountry(selectedCountry);
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const itemType = type || (url.trim() ? 'link' : 'place');

      // Only assign if explicitly chosen by user and trip actually exists in DB
      const tripExists = selectedTripId ? (allTrips || []).some((t) => t.id === selectedTripId) : false;
      const finalTripId = tripExists ? selectedTripId : undefined;
      const finalStatus: 'assigned' | 'inbox' | 'archived' = itemToEdit
        ? (finalTripId ? 'assigned' : (itemToEdit.status === 'archived' ? 'archived' : 'inbox'))
        : (finalTripId ? 'assigned' : 'inbox');

      if (itemToEdit) {
        const updatedItem: CollectionItem = {
          ...itemToEdit,
          title: title.trim(),
          type: itemType,
          status: finalStatus,
          country: selectedCountry,
          category: selectedCategory,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined,
          tripId: finalTripId,
          tags: parsedTags,
          imageUrl: imageUrl.trim() || undefined,
          isEdited: true,
        };

        await db.collectionItems.put(updatedItem);
        showToast(`Saved changes to "${updatedItem.title}"!`, 'success');
        if (onSaved) onSaved(updatedItem);
      } else {
        const newItem: CollectionItem = {
          id: 'col-' + Date.now(),
          title: title.trim(),
          type: itemType,
          status: finalStatus,
          country: selectedCountry,
          category: selectedCategory,
          tripId: finalTripId,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: parsedTags,
          imageUrl: imageUrl.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        await db.collectionItems.add(newItem);
        showToast(`Saved to ${selectedCountry}!`, 'success');
        if (onSaved) onSaved(newItem);
      }

      onClose();
    } catch (err: any) {
      showToast('Error saving item: ' + err.message, 'error');
    }
  };

  const defaultColList = DEFAULT_SAVED_CATEGORIES.filter((c) => c.id !== 'all');
  const allAvailableCategories = [
    ...defaultColList,
    ...(dbCategories || [])
      .filter((c) => !defaultColList.some((d) => d.id === c.id || d.label.toLowerCase() === c.label.toLowerCase()))
      .map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ];

  const isDirty = itemToEdit
    ? title !== (itemToEdit.title || '') ||
      url !== (itemToEdit.url || '') ||
      notes !== (itemToEdit.notes || '') ||
      tags !== (itemToEdit.tags?.join(', ') || '') ||
      imageUrl !== (itemToEdit.imageUrl || '') ||
      type !== (itemToEdit.type || 'link') ||
      selectedCountry !== (itemToEdit.country || 'Japan') ||
      selectedCategory !== (itemToEdit.category || 'food')
    : Boolean(title.trim() || url.trim() || notes.trim() || tags.trim() || imageUrl.trim());

  const handleRequestClose = async () => {
    if (isDirty) {
      const confirmed = await showConfirm({
        title: itemToEdit ? 'Discard Unsaved Spot Edits?' : 'Discard Unsaved Spot?',
        categoryKicker: 'GUARD SHEET',
        description: 'You have unsaved changes. Navigating away will lose these inputs.',
        warningMessage: 'Changes will not be saved to your collection library.',
        confirmText: 'Discard Changes',
        cancelText: 'Continue Editing',
        variant: 'destructive',
        iconName: 'edit',
      });
      if (!confirmed) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="modal-overlay" onClick={handleRequestClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 20px) - 16px)' }}>
        <div className="sheet-drag-handle" />

        {/* Navigation Header */}
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
            onClick={handleRequestClose}
            className="btn btn-ghost"
            style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
          >
            Cancel
          </button>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
            {itemToEdit ? 'Edit Saved Spot' : 'Save to Library'}
          </h3>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-ghost"
            style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
          >
            Save
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          {/* SECTION 1: Country Collection Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="label-micro" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Globe size={11} strokeWidth={2} />
                <span>Destination Folder (Required)</span>
              </label>
              {!isCreatingNewCountry && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCountry(true)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                >
                  + New Folder
                </button>
              )}
            </div>

            {/* Inline New Country Creator */}
            {isCreatingNewCountry && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  padding: '8px 10px',
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderRadius: '12px',
                  border: '1px solid var(--stroke)',
                }}
              >
                <input
                  type="text"
                  placeholder="e.g. Greece, Norway, Vietnam..."
                  value={newCountryInput}
                  onChange={(e) => setNewCountryInput(e.target.value)}
                  className="input"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewCountry}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0 12px', height: '34px', fontSize: '0.78rem' }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCountry(false)}
                  className="btn btn-ghost"
                  style={{ padding: '4px', color: 'var(--secondary)' }}
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Country Cards Horizontal Scroll */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
              }}
            >
              {knownCountries.map((c) => {
                const isSelected = selectedCountry.toLowerCase() === c.toLowerCase();
                const count = (allItems || []).filter((i) => i.country?.toLowerCase() === c.toLowerCase()).length;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCountry(c)}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                    }}
                  >
                    <span>{c}</span>
                    <span
                      style={{
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--surface-neutral-2)',
                        color: isSelected ? '#ffffff' : 'var(--secondary)',
                        borderRadius: '9999px',
                        padding: '1px 6px',
                        fontSize: '9px',
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Category Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="label-micro" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FolderPlus size={11} strokeWidth={2} />
                <span>Category</span>
              </label>
              {!isCreatingNewCategory && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCategory(true)}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 600, padding: 0 }}
                >
                  + Custom
                </button>
              )}
            </div>

            {/* Inline New Category Creator */}
            {isCreatingNewCategory && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '10px',
                  padding: '8px 10px',
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderRadius: '12px',
                  border: '1px solid var(--stroke)',
                }}
              >
                <input
                  type="text"
                  placeholder="Icon"
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="input"
                  style={{ width: '50px', height: '34px', textAlign: 'center', fontSize: '1rem' }}
                />
                <input
                  type="text"
                  placeholder="e.g. Photography, Nightlife, Coffee, Architecture..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCategory(e);
                    }
                  }}
                  className="input"
                  style={{ height: '34px', fontSize: '0.82rem', flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={(e) => handleAddNewCategory(e)}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0 12px', height: '34px', fontSize: '0.78rem' }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewCategory(false)}
                  className="btn btn-ghost"
                  style={{ padding: '4px', color: 'var(--secondary)' }}
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Category Pills Wrap */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {allAvailableCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.76rem',
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Item Content Details */}
          <div>
            <label className="label-micro">Title / Spot Name</label>
            <input
              type="text"
              placeholder="e.g. Secret Omoide Yokocho Yakitori Alley"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Link2 size={11} strokeWidth={2} />
              <span>Link URL (Reels, TikTok, Maps, Article)</span>
            </label>
            <input
              type="url"
              placeholder="https://instagram.com/reel/... or https://maps.google.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label-micro">Field Notes & Recommendations</label>
            <textarea
              placeholder="e.g. Cash only, order negima skewers, go before 8 PM..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea"
              rows={2}
            />
          </div>

          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={11} strokeWidth={2} />
              <span>Tags (Comma-separated for multi-filtering)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Food, Nightlife, Tokyo, Streetfood"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ImageIcon size={11} strokeWidth={2} />
              <span>Cover Photo URL (Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Luggage size={11} strokeWidth={2} />
              <span>Trip Association (Optional)</span>
            </label>
            <select
              value={selectedTripId || ''}
              onChange={(e) => setSelectedTripId(e.target.value || undefined)}
              className="input"
              style={{ fontSize: '0.82rem' }}
            >
              <option value="">None (Global item in {selectedCountry})</option>
              {(allTrips || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.destination})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
            <span>Save to {selectedCountry} Collection</span>
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
