import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db/database';
import { useApp } from '../../context/AppContext';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, TripStatus } from '../../types';
import { getCountryFlag, getCountryCover, detectCountry } from '../../utils/countryUtils';
import { Globe, Upload, ImageIcon, X, Trash2 } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface EditTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedTrip: Trip) => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast, showConfirm, activeTripId, setActiveTripId } = useApp();

  const handleDeleteTrip = async () => {
    const confirmed = await showConfirm({
      title: `Delete Trip "${trip.name}"?`,
      categoryKicker: 'DESTRUCTIVE ACTION',
      description: `This will permanently delete "${trip.name}" and all its itinerary events, expenses, bookings, documents, transit legs, and packing lists.`,
      warningMessage: 'Saved finds, global places, and reusable recipes will not be deleted.',
      confirmText: 'Delete Trip',
      cancelText: 'Keep Trip',
      variant: 'destructive',
      iconName: 'trash',
    });
    if (confirmed) {
      try {
        await db.deleteTripCascade(trip.id);
        if (activeTripId === trip.id) {
          setActiveTripId(null);
        }
        showToast(`Trip "${trip.name}" deleted. Saved items & memories were preserved.`, 'info');
        onClose();
      } catch (err: any) {
        showToast('Error deleting trip: ' + err.message, 'error');
      }
    }
  };

  const [title, setTitle] = useState(trip.name);
  const [country, setCountry] = useState(trip.country || detectCountry(trip.destination));
  const [isCreatingNewCountry, setIsCreatingNewCountry] = useState(false);
  const [newCountryInput, setNewCountryInput] = useState('');
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [coverImage, setCoverImage] = useState(trip.coverImage || '');
  const [plannedBudget, setPlannedBudget] = useState(trip.plannedBudget.toString());
  const [travelers, setTravelers] = useState(trip.travelers?.join(', ') || '');
  const [notes, setNotes] = useState(trip.notes || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const dbCountries = useLiveQuery(() => db.countries.toArray(), []);
  const allTrips = useLiveQuery(() => db.trips.toArray(), []);

  // Compute available countries list
  const availableCountries = Array.from(
    new Set([
      'Japan',
      'Switzerland',
      'Kazakhstan',
      'Iceland',
      'Portugal',
      'Italy',
      'France',
      'India',
      ...(dbCountries || []).map((c) => c.name),
      ...(allTrips || []).map((t) => t.country).filter(Boolean) as string[],
    ])
  ).sort();

  // Reset form when trip or isOpen changes
  useEffect(() => {
    if (isOpen && trip) {
      setTitle(trip.name);
      setCountry(trip.country || detectCountry(trip.destination));
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setStatus(trip.status);
      setCoverImage(trip.coverImage || '');
      setPlannedBudget(trip.plannedBudget.toString());
      setTravelers(trip.travelers?.join(', ') || '');
      setNotes(trip.notes || '');
      setIsCreatingNewCountry(false);
      setNewCountryInput('');
    }
  }, [isOpen, trip]);

  if (!isOpen) return null;

  const handleAddNewCountry = async () => {
    const trimmed = newCountryInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    try {
      await db.saveCountry(formatted);
      setCountry(formatted);
      setIsCreatingNewCountry(false);
      setNewCountryInput('');
      showToast(`Country dossier for ${formatted} saved!`, 'success');
    } catch (err: any) {
      showToast('Error saving country: ' + err.message, 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
      showToast('Cover photo uploaded from device!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country.trim() || !title.trim()) {
      showToast('Please select a country and enter a title/trip name.', 'error');
      return;
    }

    try {
      const travelerList = travelers
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const parsedBudget = parseFloat(plannedBudget);
      const safeBudget = isNaN(parsedBudget) || parsedBudget < 0 ? 0 : parsedBudget;

      await db.saveCountry(country.trim());

      const chosenCover = coverImage.trim() || getCountryCover(country.trim());

      const updatedFields: Partial<Trip> = {
        name: title.trim(),
        destination: country.trim(),
        country: country.trim(),
        startDate: startDate || trip.startDate,
        endDate: endDate || trip.endDate,
        status,
        coverImage: chosenCover,
        defaultCurrency: 'INR',
        plannedBudget: safeBudget,
        travelers: travelerList.length > 0 ? travelerList : ['Me'],
        notes: notes.trim() || undefined,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      };

      await db.trips.update(trip.id, updatedFields);

      const completeUpdatedTrip: Trip = {
        ...trip,
        ...updatedFields,
      };

      showToast(`Trip "${completeUpdatedTrip.name}" updated!`, 'success');
      if (onSaved) {
        onSaved(completeUpdatedTrip);
      }
      onClose();
    } catch (err: any) {
      showToast('Error updating trip: ' + err.message, 'error');
    }
  };

  const isDirty =
    title !== trip.name ||
    country !== (trip.country || detectCountry(trip.destination)) ||
    startDate !== trip.startDate ||
    endDate !== trip.endDate ||
    status !== trip.status ||
    coverImage !== (trip.coverImage || '') ||
    plannedBudget !== trip.plannedBudget.toString() ||
    travelers !== (trip.travelers?.join(', ') || '') ||
    notes !== (trip.notes || '');

  const handleRequestClose = async () => {
    if (isDirty) {
      const confirmed = await showConfirm({
        title: 'Discard Unsaved Trip Edits?',
        categoryKicker: 'GUARD SHEET',
        description: `You modified details for "${trip.name}". Navigating away will lose these inputs.`,
        warningMessage: 'Changes will not be saved to your itinerary.',
        confirmText: 'Discard Changes',
        cancelText: 'Continue Editing',
        variant: 'destructive',
        iconName: 'edit',
      });
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="modal-overlay" onClick={handleRequestClose}>
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        {/* Modal Navigation Header */}
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
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Edit Trip</h3>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-ghost"
            style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
          >
            Save
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* SECTION: Country Dossier Selection */}
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
                  className="btn btn-ghost btn-sm"
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
                  border: '1px solid var(--stroke)',
                }}
              >
                <input
                  type="text"
                  placeholder="e.g. Kazakhstan, Norway, Vietnam..."
                  value={newCountryInput}
                  onChange={(e) => setNewCountryInput(e.target.value)}
                  className="input"
                  style={{ height: '36px', minHeight: '36px', fontSize: '0.84rem' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewCountry}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0 14px', height: '36px' }}
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
              {availableCountries.map((c) => {
                const isSelected = country.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCountry(c)}
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

          {/* Title / Trip Name */}
          <div>
            <label className="label-micro">TITLE / TRIP NAME</label>
            <input
              type="text"
              placeholder="e.g. 8-Day Kazakhstan Itinerary or Alpine Expedition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Cover Photo Upload from Device */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
              COVER PHOTO (FROM DEVICE)
            </label>

            {coverImage ? (
              <div
                style={{
                  position: 'relative',
                  height: '110px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--stroke)',
                }}
              >
                <img
                  src={coverImage}
                  alt="Trip cover preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  >
                    <Upload size={12} />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                  >
                    <X size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: '84px',
                  borderRadius: '16px',
                  border: '1.5px dashed var(--stroke)',
                  backgroundColor: 'var(--surface-neutral-1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                  <ImageIcon size={16} />
                  <span>Upload Photo from Device</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--secondary)' }}>
                  Supports JPG, PNG, WEBP (auto-defaults to country landscape if empty)
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro">START DATE</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label-micro">END DATE</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-micro">PLANNED BUDGET (₹ INR)</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  color: 'var(--primary)',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                step="100"
                placeholder="e.g. 50000"
                value={plannedBudget}
                onChange={(e) => setPlannedBudget(e.target.value)}
                className="input"
                style={{ paddingLeft: '32px' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-micro">TRIP STATUS</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TripStatus)}
              className="select"
            >
              <option value="planning">Planning (Drafting)</option>
              <option value="upcoming">Upcoming (Bookings set)</option>
              <option value="ongoing">Ongoing (Active)</option>
              <option value="researching">Researching (Inspiration)</option>
              <option value="completed">Completed (Archived)</option>
            </select>
          </div>

          <div>
            <label className="label-micro">TRAVELERS (COMMA-SEPARATED)</label>
            <input
              type="text"
              placeholder="e.g. Alex (Me), Mia, Kenji"
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label-micro">NOTES & FIELD NOTES (OPTIONAL)</label>
            <textarea
              placeholder="Highlights, itinerary notes, checklist..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea"
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleDeleteTrip}
              className="btn btn-secondary"
              style={{ color: '#dc2626', borderColor: '#fee2e2', padding: '0 14px' }}
              title="Delete Trip"
            >
              <Trash2 size={16} />
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
