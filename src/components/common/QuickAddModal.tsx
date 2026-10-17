import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CollectionItemType, Expense } from '../../types';
import {
  DEFAULT_SAVED_CATEGORIES,
  detectCountry,
} from '../../utils/countryUtils';
import {
  MapPin,
  Link2,
  IndianRupee,
  FileText,
  Globe,
  FolderPlus,
  X,
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export const QuickAddModal: React.FC = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddPreselectedTripId,
    showToast,
    showConfirm,
  } = useApp();

  const [activeType, setActiveType] = useState<CollectionItemType | 'expense'>('place');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  // Country & Category fields for Finds
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [isCreatingNewCountry, setIsCreatingNewCountry] = useState(false);
  const [newCountryInput, setNewCountryInput] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string>('place');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🏷️');

  // Expense-specific fields
  const [amount, setAmount] = useState('');
  const [currency] = useState('INR');
  const [expenseCategory, setExpenseCategory] = useState<string>('food');
  const [paidBy] = useState('Me');
  const [isCreatingExpenseCategory, setIsCreatingExpenseCategory] = useState(false);
  const [newExpenseCatInput, setNewExpenseCatInput] = useState('');
  const [newExpenseCatIcon, setNewExpenseCatIcon] = useState('🏷️');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const trips = useLiveQuery(() => db.trips.toArray(), []);
  const allCollectionItems = useLiveQuery(() => db.collectionItems.toArray(), []);
  const allCountries = useLiveQuery(() => db.countries.toArray(), []);

  useEffect(() => {
    if (!selectedCountry && allCountries && allCountries.length > 0) {
      setSelectedCountry(allCountries[0].name);
    }
  }, [allCountries, selectedCountry]);

  // Custom categories from DB
  const dbCollectionCategories = useLiveQuery(
    () => db.categories.where('scope').equals('collection').toArray(),
    []
  );

  const dbExpenseCategories = useLiveQuery(
    () => db.categories.where('scope').equals('expense').toArray(),
    []
  );

  // Collect all known countries from db and records
  const knownCountries = Array.from(
    new Set([
      ...(allCountries || []).map((c) => c.name).filter(Boolean),
      ...(allCollectionItems || []).map((i) => i.country).filter(Boolean),
      ...(trips || []).map((t) => t.country || detectCountry(t.destination)).filter(Boolean),
    ])
  ).sort();

  // Combine default and DB collection categories
  const defaultCollectionList = DEFAULT_SAVED_CATEGORIES.filter((c) => c.id !== 'all');
  const allAvailableCategories = [
    ...defaultCollectionList,
    ...(dbCollectionCategories || [])
      .filter((c) => !defaultCollectionList.some((d) => d.id === c.id || d.label.toLowerCase() === c.label.toLowerCase()))
      .map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ];

  // Default + DB expense categories
  const defaultExpenseList = [
    { id: 'food', label: 'Food & Dining', icon: '🍽️' },
    { id: 'transport', label: 'Transit & Passes', icon: '🚆' },
    { id: 'stay', label: 'Lodging / Stays', icon: '🏨' },
    { id: 'activities', label: 'Activities & Tours', icon: '🎟️' },
    { id: 'flights', label: 'Flights', icon: '✈️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'other', label: 'Other', icon: '📦' },
  ];
  const allAvailableExpenseCategories = [
    ...defaultExpenseList,
    ...(dbExpenseCategories || [])
      .filter((c) => !defaultExpenseList.some((d) => d.id === c.id || d.label.toLowerCase() === c.label.toLowerCase()))
      .map((c) => ({ id: c.id, label: c.label, icon: c.icon })),
  ];

  useEffect(() => {
    if (isQuickAddOpen) {
      setSelectedTripId(quickAddPreselectedTripId || '');
      setTitle('');
      setUrl('');
      setAddress('');
      setNotes('');
      setTags('');
      setAmount('');
      setIsCreatingNewCountry(false);
      setNewCountryInput('');
      setIsCreatingNewCategory(false);
      setNewCategoryInput('');
      setNewCategoryIcon('🏷️');
      setIsCreatingExpenseCategory(false);
      setNewExpenseCatInput('');
      setNewExpenseCatIcon('🏷️');

      // Pre-select country based on active trip
      if (quickAddPreselectedTripId && trips) {
        const matched = trips.find((t) => t.id === quickAddPreselectedTripId);
        if (matched) {
          const detected = matched.country || detectCountry(matched.destination);
          if (detected) setSelectedCountry(detected);
        }
      }

      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isQuickAddOpen, quickAddPreselectedTripId, trips]);

  if (!isQuickAddOpen) return null;

  const handleAddNewCountry = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCountryInput.trim();
    if (!trimmed) {
      showToast('Please enter a country name', 'error');
      return;
    }
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    try {
      await db.saveCountry(formatted);
      setSelectedCountry(formatted);
      setIsCreatingNewCountry(false);
      setNewCountryInput('');
      showToast(`Added country ${formatted}`, 'success');
    } catch (err: any) {
      showToast('Error saving country: ' + err.message, 'error');
    }
  };

  const handleAddNewCategory = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      showToast('Please enter category name', 'error');
      return;
    }
    try {
      const saved = await db.saveCategory(trimmed, newCategoryIcon || '🏷️', 'collection');
      setSelectedCategory(saved.id);
      setIsCreatingNewCategory(false);
      setNewCategoryInput('');
      showToast(`Category "${saved.label}" added`, 'success');
    } catch (err: any) {
      showToast('Error adding category: ' + err.message, 'error');
    }
  };

  const handleAddNewExpenseCategory = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newExpenseCatInput.trim();
    if (!trimmed) {
      showToast('Please enter expense category name', 'error');
      return;
    }
    try {
      const saved = await db.saveCategory(trimmed, newExpenseCatIcon || '🏷️', 'expense');
      setExpenseCategory(saved.id);
      setIsCreatingExpenseCategory(false);
      setNewExpenseCatInput('');
      showToast(`Expense Category "${saved.label}" added`, 'success');
    } catch (err: any) {
      showToast('Error adding expense category: ' + err.message, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeType === 'link') {
      if (!title.trim()) {
        showToast('Please enter a title for this link.', 'error');
        return;
      }
      if (!url.trim()) {
        showToast('Please enter a link URL (*required).', 'error');
        return;
      }
    } else if (activeType !== 'expense' && !title.trim()) {
      showToast('Please enter a title or name.', 'error');
      return;
    }

    try {
      if (activeType === 'expense') {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          showToast('Please enter a valid expense amount.', 'error');
          return;
        }

        const newExpense: Expense = {
          id: 'exp-' + Date.now(),
          tripId: selectedTripId || (trips && trips.length > 0 ? trips[0].id : 'global-expense'),
          title: title.trim() || 'Quick Expense',
          amount: parsedAmount,
          currency: currency,
          category: expenseCategory,
          paidBy: paidBy.trim() || 'Me',
          date: new Date().toISOString().split('T')[0],
          splitMode: 'none',
          splitWith: [paidBy.trim() || 'Me'],
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        await db.expenses.add(newExpense);
        showToast(`Expense ₹${parsedAmount.toFixed(2)} recorded`, 'success');
      } else {
        const itemTags = tags
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean);

        let placeId: string | undefined = undefined;

        if (activeType === 'place') {
          placeId = 'place-' + Date.now();
          await db.places.add({
            id: placeId,
            name: title.trim(),
            address: address.trim() || undefined,
            category: 'attraction',
            sourceUrl: url.trim() || undefined,
            notes: notes.trim() || undefined,
            tripId: selectedTripId || undefined,
            createdAt: new Date().toISOString(),
          });
        }

        await db.saveCountry(selectedCountry);
        const hasTrip = Boolean(selectedTripId && selectedTripId.trim().length > 0);
        await db.collectionItems.add({
          id: 'col-' + Date.now(),
          title: title.trim(),
          type: activeType,
          status: hasTrip ? 'assigned' : 'inbox',
          country: selectedCountry,
          category: selectedCategory,
          url: url.trim() || undefined,
          notes: notes.trim() || undefined,
          placeId,
          tripId: hasTrip ? selectedTripId : undefined,
          tags: itemTags,
          createdAt: new Date().toISOString(),
        });

        showToast(`Saved to ${selectedCountry} Collection`, 'success');
      }

      setIsQuickAddOpen(false);
    } catch (err: any) {
      showToast('Error saving: ' + err.message, 'error');
    }
  };

  const isDirty = Boolean(
    title.trim() ||
    url.trim() ||
    address.trim() ||
    notes.trim() ||
    tags.trim() ||
    amount.trim() ||
    newCountryInput.trim() ||
    newCategoryInput.trim() ||
    newExpenseCatInput.trim()
  );

  const handleRequestClose = async () => {
    if (isDirty) {
      const confirmed = await showConfirm({
        title: 'Discard Unsaved Entry?',
        categoryKicker: 'GUARD SHEET',
        description: 'You have entered details that have not been saved. Are you sure you want to discard them?',
        warningMessage: 'Unsaved inputs will be lost.',
        confirmText: 'Discard Changes',
        cancelText: 'Keep Editing',
        variant: 'destructive',
        iconName: 'edit',
      });
      if (!confirmed) return;
    }
    setIsQuickAddOpen(false);
  };

  return (
    <ModalPortal isOpen={isQuickAddOpen}>
      <div className="modal-overlay" onClick={handleRequestClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        {/* Modal Navigation Header */}
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
            onClick={handleRequestClose}
            className="btn-ghost btn-sm"
          >
            Cancel
          </button>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
            Quick Capture
          </h3>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-sm"
          >
            Save
          </button>
        </div>

        {/* Type Segmented Control */}
        <div style={{ padding: '16px 20px 6px' }}>
          <div className="cupertino-segmented">
            <button
              type="button"
              onClick={() => setActiveType('place')}
              className={`cupertino-segment-item ${activeType === 'place' ? 'active' : ''}`}
            >
              <MapPin size={14} />
              <span>Place</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType('link')}
              className={`cupertino-segment-item ${activeType === 'link' ? 'active' : ''}`}
            >
              <Link2 size={14} />
              <span>Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType('expense')}
              className={`cupertino-segment-item ${activeType === 'expense' ? 'active' : ''}`}
            >
              <IndianRupee size={14} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveType('note')}
              className={`cupertino-segment-item ${activeType === 'note' ? 'active' : ''}`}
            >
              <FileText size={14} />
              <span>Note</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* SECTION: Country Collection Assignment */}
          {activeType !== 'expense' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="label-micro" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Globe size={11} />
                  <span>ASSIGN COUNTRY DOSSIER</span>
                </label>
                {!isCreatingNewCountry && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewCountry(true)}
                    className="btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto' }}
                  >
                    + New Country
                  </button>
                )}
              </div>

              {isCreatingNewCountry && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter country name (e.g. Greece, Norway)..."
                    value={newCountryInput}
                    onChange={(e) => setNewCountryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCountry(e);
                      }
                    }}
                    className="input"
                    style={{ height: '36px', minHeight: '36px', fontSize: '0.84rem' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddNewCountry(e)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0 14px', height: '36px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewCountry(false)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                }}
              >
                {knownCountries.map((c) => {
                  const isSelected = selectedCountry.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCountry(c)}
                      className={`filter-chip ${isSelected ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION: Category Selector */}
          {activeType !== 'expense' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="label-micro" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FolderPlus size={11} />
                  <span>CATEGORY</span>
                </label>
                {!isCreatingNewCategory && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewCategory(true)}
                    className="btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', padding: '2px 8px', height: 'auto' }}
                  >
                    + New Category
                  </button>
                )}
              </div>

              {isCreatingNewCategory && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Icon"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                    className="input"
                    style={{ width: '60px', height: '36px', minHeight: '36px', textAlign: 'center', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. Photography, Nightlife..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory(e);
                      }
                    }}
                    className="input"
                    style={{ height: '36px', minHeight: '36px', fontSize: '0.84rem', flex: 1 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddNewCategory(e)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0 14px', height: '36px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewCategory(false)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Trip Linking */}
          {trips && trips.length > 0 && (
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                TRIP LINK (OPTIONAL)
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="select"
              >
                <option value="">None (Saved across {selectedCountry})</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    ✈️ {trip.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
              {activeType === 'place'
                ? 'SPOT OR PLACE NAME'
                : activeType === 'link'
                ? 'LINK TITLE *REQUIRED'
                : activeType === 'expense'
                ? 'EXPENSE DESCRIPTION'
                : 'NOTE TITLE'}
            </label>
            <input
              ref={titleInputRef}
              type="text"
              placeholder={
                activeType === 'place'
                  ? 'e.g. Blue Lagoon Geothermal Spa'
                  : activeType === 'link'
                  ? 'e.g. Best Ramen in Shibuya Guide'
                  : activeType === 'expense'
                  ? 'e.g. Airport Express Train Tickets'
                  : 'e.g. Metro Pass Passcode Reminder'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required={activeType !== 'expense'}
            />
          </div>

          {/* URL field for Links (*Required) and Places (Optional) */}
          {activeType === 'link' && (
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                LINK URL *REQUIRED
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/reel/... or https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input"
                required
              />
            </div>
          )}

          {activeType === 'place' && (
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                WEB OR MAPS LINK (OPTIONAL)
              </label>
              <input
                type="url"
                placeholder="https://maps.google.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="input"
              />
            </div>
          )}

          {/* Address for Places */}
          {activeType === 'place' && (
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                ADDRESS / LANDMARK (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. Norðurljósavegur 9, Grindavík"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
              />
            </div>
          )}

          {/* Expense Fields */}
          {activeType === 'expense' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                    AMOUNT (₹ INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="label-micro" style={{ margin: 0 }}>CATEGORY</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingExpenseCategory(!isCreatingExpenseCategory)}
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
                      {isCreatingExpenseCategory ? 'Select' : '+ New'}
                    </button>
                  </div>
                  {!isCreatingExpenseCategory && (
                    <select
                      value={expenseCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingExpenseCategory(true);
                        } else {
                          setExpenseCategory(e.target.value);
                        }
                      }}
                      className="select"
                    >
                      {allAvailableExpenseCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                      <option value="__NEW__">+ Add New Category...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Inline Expense Category Creator */}
              {isCreatingExpenseCategory && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="Icon"
                    value={newExpenseCatIcon}
                    onChange={(e) => setNewExpenseCatIcon(e.target.value)}
                    className="input"
                    style={{ width: '60px', height: '36px', minHeight: '36px', textAlign: 'center', fontSize: '1rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Category name (e.g. Souvenirs)..."
                    value={newExpenseCatInput}
                    onChange={(e) => setNewExpenseCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewExpenseCategory(e);
                      }
                    }}
                    className="input"
                    style={{ height: '36px', minHeight: '36px', fontSize: '0.84rem', flex: 1 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddNewExpenseCategory(e)}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0 14px', height: '36px', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingExpenseCategory(false)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
              NOTES & DETAILS (OPTIONAL)
            </label>
            <textarea
              placeholder="Tips, recommendations, opening hours..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea"
              rows={2}
            />
          </div>

          {/* Tags (for collection items) */}
          {activeType !== 'expense' && (
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                TAGS (COMMA SEPARATED)
              </label>
              <input
                type="text"
                placeholder="Must-try, Nightlife, Coffee, Viewpoint"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="input"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '4px' }}
          >
            Save to {activeType === 'expense' ? 'Expenses' : `${selectedCountry} Collection`}
          </button>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
};
