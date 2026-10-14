import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, EssentialItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Luggage,
  FileCheck,
  Plus,
  Trash2,
  Check,
  CheckSquare,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface EssentialsViewProps {
  trip: Trip;
}

export const EssentialsView: React.FC<EssentialsViewProps> = ({ trip }) => {
  const { showToast, showConfirm } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'packing' | 'document'>('all');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // New item inputs
  const [itemType, setItemType] = useState<'packing' | 'document'>('packing');
  const [category, setCategory] = useState('Clothing');
  const [newItemText, setNewItemText] = useState('');
  const [notes, setNotes] = useState('');

  // New category creation state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🎒');

  const items = useLiveQuery(
    () => db.essentials.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  const customCategories = useLiveQuery(
    () => db.categories.where('scope').equals('essential').toArray(),
    []
  );

  const defaultCategoryList = [
    { label: 'Clothing', icon: '👕' },
    { label: 'Electronics', icon: '🔌' },
    { label: 'Toiletries', icon: '🧴' },
    { label: 'Documents', icon: '🛂' },
    { label: 'Finance', icon: '💳' },
    { label: 'Medical', icon: '💊' },
    { label: 'Gear', icon: '🎒' },
    { label: 'Other', icon: '✨' },
  ];

  const allCategories = [
    ...defaultCategoryList,
    ...(customCategories || [])
      .filter((c) => !defaultCategoryList.some((d) => d.label.toLowerCase() === c.label.toLowerCase()))
      .map((c) => ({ label: c.label, icon: c.icon })),
  ];

  const handleToggle = async (id: string, current: boolean) => {
    await db.essentials.update(id, { packed: !current });
  };

  const handleSaveNewCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatLabel.trim();
    if (!trimmed) {
      showToast('Please enter a category name', 'error');
      return;
    }
    try {
      const saved = await db.saveCategory(trimmed, newCatIcon || '🎒', 'essential');
      setCategory(saved.label);
      setIsCreatingCategory(false);
      setNewCatLabel('');
      showToast(`Category "${saved.label}" added!`, 'success');
    } catch (err: any) {
      showToast('Failed to add category: ' + err.message, 'error');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    try {
      const newItem: EssentialItem = {
        id: 'ess-' + Date.now(),
        tripId: trip.id,
        type: itemType,
        category,
        item: newItemText.trim(),
        packed: false,
        notes: notes.trim() || undefined,
      };

      await db.essentials.add(newItem);
      showToast(`Added "${newItem.item}"`, 'success');
      setIsAddItemModalOpen(false);
      setNewItemText('');
      setNotes('');
    } catch (err: any) {
      showToast('Error adding item: ' + err.message, 'error');
    }
  };

  const handleDeleteItem = async (id: string, itemName?: string) => {
    const confirmed = await showConfirm({
      title: itemName ? `Delete "${itemName}"?` : 'Delete this item?',
      kicker: 'IRREVERSIBLE',
      message: 'This item will be removed from your packing checklist.',
      confirmText: 'Delete Item',
      cancelText: 'Keep Item',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.essentials.delete(id);
        showToast('Item deleted.', 'info');
      } catch (err: any) {
        showToast('Error deleting item: ' + err.message, 'error');
      }
    }
  };

  const filteredItems = (items || []).filter((item) => {
    if (activeFilter === 'packing') return item.type === 'packing';
    if (activeFilter === 'document') return item.type === 'document';
    return true;
  });

  const totalCount = items?.length || 0;
  const packedCount = items?.filter((i) => i.packed).length || 0;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const packingCount = items?.filter((i) => i.type === 'packing').length || 0;
  const documentCount = items?.filter((i) => i.type === 'document').length || 0;

  const displayedCategories = Array.from(new Set(filteredItems.map((i) => i.category)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>
          Trip Essentials
        </h3>
      </div>

      {/* Progress Card - Clean progress bar only, templates removed */}
      <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="label-micro" style={{ margin: 0 }}>Pack Progress</span>
            {progressPercent === 100 && totalCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                100% Ready
              </span>
            )}
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
            {packedCount}/{totalCount} ({progressPercent}%)
          </span>
        </div>

        <div className="minimal-progress-track">
          <div
            className="minimal-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="cupertino-segmented">
        <button
          onClick={() => setActiveFilter('all')}
          className={`cupertino-segment-item ${activeFilter === 'all' ? 'active' : ''}`}
        >
          <span>All</span>
          <span className="chip-count-bubble">{totalCount}</span>
        </button>
        <button
          onClick={() => setActiveFilter('packing')}
          className={`cupertino-segment-item ${activeFilter === 'packing' ? 'active' : ''}`}
        >
          <Luggage size={13} strokeWidth={2} />
          <span>Packing</span>
          <span className="chip-count-bubble">{packingCount}</span>
        </button>
        <button
          onClick={() => setActiveFilter('document')}
          className={`cupertino-segment-item ${activeFilter === 'document' ? 'active' : ''}`}
        >
          <FileCheck size={13} strokeWidth={2} />
          <span>Documents</span>
          <span className="chip-count-bubble">{documentCount}</span>
        </button>
      </div>

      {/* Category Groupings */}
      {displayedCategories.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayedCategories.map((cat) => {
            const catItems = filteredItems.filter((i) => i.category === cat);
            const catPacked = catItems.filter((i) => i.packed).length;
            const matchingCat = allCategories.find((c) => c.label.toLowerCase() === cat.toLowerCase());
            const catIcon = matchingCat ? matchingCat.icon : '🏷️';

            return (
              <div key={cat} className="cupertino-section" style={{ margin: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 4px',
                    marginBottom: '6px',
                  }}
                >
                  <span className="label-micro" style={{ margin: 0 }}>
                    {catIcon} {cat}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: 600 }}>
                    {catPacked}/{catItems.length}
                  </span>
                </div>

                <div className="travelnest-card" style={{ padding: 0, margin: 0, backgroundColor: '#ffffff' }}>
                {catItems.map((item, index) => {
                  const isLast = index === catItems.length - 1;

                  return (
                    <div
                      key={item.id}
                      className="cupertino-row"
                      style={{
                        padding: '12px 14px',
                        borderBottom: isLast ? 'none' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div
                        onClick={() => handleToggle(item.id, item.packed)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: item.packed ? '1px solid var(--primary)' : '1.5px solid var(--border-dark)',
                            backgroundColor: item.packed ? 'var(--primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {item.packed && <Check size={13} color="#ffffff" strokeWidth={3} />}
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 500,
                              color: item.packed ? 'var(--secondary)' : 'var(--primary)',
                              textDecoration: item.packed ? 'line-through' : 'none',
                              transition: 'color 0.15s ease',
                            }}
                          >
                            {item.item}
                          </div>
                          {item.notes && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px' }}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id, item.item)}
                        className="btn-icon"
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        aria-label={`Delete ${item.item}`}
                      >
                        <Trash2 size={13} color="var(--secondary)" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="travelnest-card" style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#ffffff' }}>
          <CheckSquare size={36} color="var(--secondary)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', margin: 0 }}>
            {totalCount === 0
              ? 'No checklist items yet. Tap + to add items!'
              : 'No items matching this filter.'}
          </p>
        </div>
      )}

      {/* Add Item Bottom Sheet */}
      {isAddItemModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddItemModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-drag-handle" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 18px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>Add Item</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
              >
                Add
              </button>
            </div>

            <form onSubmit={handleAddItem} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Type</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as any)}
                    className="select"
                  >
                    <option value="packing">🧳 Packing</option>
                    <option value="document">📄 Document</option>
                  </select>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="label-micro">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      {isCreatingCategory ? 'Use Existing' : '+ New'}
                    </button>
                  </div>
                  {!isCreatingCategory ? (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingCategory(true);
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="select"
                    >
                      {allCategories.map((c) => (
                        <option key={c.label} value={c.label}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                      <option value="__NEW__">+ Add New Category...</option>
                    </select>
                  ) : null}
                </div>
              </div>

              {/* Inline New Category Creator */}
              {isCreatingCategory && (
                <div
                  style={{
                    backgroundColor: 'var(--surface-neutral-1)',
                    border: '1px solid var(--stroke)',
                    borderRadius: '12px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <span className="label-micro" style={{ margin: 0 }}>Create New Category</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Icon / Emoji"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="input"
                      style={{ width: '80px', textAlign: 'center', fontSize: '1.1rem' }}
                    />
                    <input
                      type="text"
                      placeholder="Category Name (e.g. Hiking Gear)"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      className="input"
                      style={{ flex: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNewCategory();
                        }
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveNewCategory()}
                      className="btn btn-primary btn-sm"
                    >
                      Save Category
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="label-micro">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Universal power adapter or passport"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label-micro">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. In carry-on backpack"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                <span>Add to Checklist</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        onClick={() => setIsAddItemModalOpen(true)}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Add Essential Item"
      />
    </div>
  );
};
