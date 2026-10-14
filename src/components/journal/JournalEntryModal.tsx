import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { JournalEntry, Trip, ItineraryEvent, Place } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Calendar,
  Clock,
  Camera,
  MapPin,
  Luggage,
  Sparkles,
  Star,
  Plus,
  Compass,
  Tag,
} from 'lucide-react';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<JournalEntry>;
  editingEntry?: JournalEntry | null;
  onSaved?: (entry: JournalEntry) => void;
}

const MOOD_OPTIONS = [
  '🌅 Serene',
  '⚡ Electric',
  '🏔️ Adventure',
  '🍜 Culinary',
  '🎉 Celebration',
  '☕ Nostalgic',
  '✨ Spontaneous',
  '🚶 Walk',
  '💫 Reflection',
];

export const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  isOpen,
  onClose,
  initialData,
  editingEntry,
  onSaved,
}) => {
  const { showToast, showConfirm } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [mood, setMood] = useState<string | undefined>();
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [locationName, setLocationName] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const trips = useLiveQuery(() => db.trips.toArray(), []) || [];
  const events = useLiveQuery<ItineraryEvent[]>(
    async () => (selectedTripId ? await db.itineraryEvents.where('tripId').equals(selectedTripId).sortBy('orderIndex') : []),
    [selectedTripId]
  ) || [];

  // Reset or initialize on open
  useEffect(() => {
    if (!isOpen) return;

    if (editingEntry) {
      setTitle(editingEntry.title || '');
      setContent(editingEntry.content || '');
      setDate(editingEntry.date || new Date().toISOString().split('T')[0]);
      setTime(editingEntry.time || '');
      setMood(editingEntry.mood);
      setSelectedTripId(editingEntry.tripId);
      setSelectedEventId(editingEntry.itineraryEventId);
      setSelectedPlaceId(editingEntry.placeId);
      setLocationName(editingEntry.locationName || '');
      setPhotos(editingEntry.photos || []);
      setTags(editingEntry.tags || []);
      setTagInput('');
      setIsFavorite(Boolean(editingEntry.isFavorite));
    } else if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setTime(initialData.time || '');
      setMood(initialData.mood);
      setSelectedTripId(initialData.tripId);
      setSelectedEventId(initialData.itineraryEventId);
      setSelectedPlaceId(initialData.placeId);
      setLocationName(initialData.locationName || '');
      setPhotos(initialData.photos || []);
      setTags(initialData.tags || []);
      setTagInput('');
      setIsFavorite(Boolean(initialData.isFavorite));
    } else {
      // Clean blank standalone memory
      setTitle('');
      setContent('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('');
      setMood(undefined);
      setSelectedTripId(undefined);
      setSelectedEventId(undefined);
      setSelectedPlaceId(undefined);
      setLocationName('');
      setPhotos([]);
      setTags([]);
      setTagInput('');
      setIsFavorite(false);
    }
  }, [isOpen, editingEntry, initialData]);

  // When selected event changes, auto-populate location if available and not set
  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const ev = events.find((e) => e.id === selectedEventId);
      if (ev) {
        if (!locationName && ev.location) {
          setLocationName(ev.location);
        }
        if (ev.placeId && !selectedPlaceId) {
          setSelectedPlaceId(ev.placeId);
        }
      }
    }
  }, [selectedEventId, events]);

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          setPhotos((prev) => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Tag helpers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle && !cleanContent) {
      showToast('Please provide a title or write something about the memory.', 'error');
      return;
    }

    if (!date) {
      showToast('Please specify the date of this memory.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const finalTitle = cleanTitle || 'Untitled Memory';

      const entryPayload: JournalEntry = {
        id: editingEntry?.id || `journal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: finalTitle,
        content: cleanContent,
        date: date,
        time: time.trim() || undefined,
        tripId: selectedTripId || undefined,
        itineraryEventId: selectedEventId || undefined,
        placeId: selectedPlaceId || undefined,
        locationName: locationName.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
        tags: tags.length > 0 ? tags : undefined,
        mood: mood || undefined,
        isFavorite: isFavorite,
        isEdited: editingEntry ? true : undefined,
        createdAt: editingEntry?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      if (editingEntry) {
        await db.journalEntries.put(entryPayload);
        showToast('Memory updated successfully', 'success');
      } else {
        await db.journalEntries.add(entryPayload);
        showToast('Memory recorded in your journal', 'success');
      }

      if (onSaved) onSaved(entryPayload);
      onClose();
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      showToast('Could not save memory. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const isDirty = editingEntry
    ? title !== (editingEntry.title || '') ||
      content !== (editingEntry.content || '') ||
      date !== (editingEntry.date || new Date().toISOString().split('T')[0]) ||
      time !== (editingEntry.time || '') ||
      mood !== editingEntry.mood ||
      selectedTripId !== editingEntry.tripId ||
      selectedEventId !== editingEntry.itineraryEventId ||
      locationName !== (editingEntry.locationName || '') ||
      photos.length !== (editingEntry.photos || []).length ||
      tags.length !== (editingEntry.tags || []).length ||
      isFavorite !== Boolean(editingEntry.isFavorite)
    : Boolean(title.trim() || content.trim() || photos.length > 0 || locationName.trim());

  const handleRequestClose = async () => {
    if (isDirty) {
      const confirmed = await showConfirm({
        title: editingEntry ? 'Discard Unsaved Journal Edits?' : 'Discard Unsaved Journal Entry?',
        categoryKicker: 'GUARD SHEET',
        description: 'You have unsaved changes in this journal entry. Navigating away will lose these inputs.',
        warningMessage: 'Unsaved journal reflections and photos will not be archived.',
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
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={handleRequestClose}
    >
      <div
        className="modal-sheet"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--stroke)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            <span className="label-micro" style={{ margin: 0 }}>
              {editingEntry ? 'Edit Record' : 'Field Note & Archive'}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0', letterSpacing: '-0.02em' }}>
              {editingEntry ? 'Edit Journal Entry' : 'Add Journal Entry'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className="btn btn-ghost"
              style={{
                padding: '6px',
                borderRadius: '9999px',
                color: isFavorite ? '#E5A100' : 'var(--secondary)',
              }}
              title={isFavorite ? 'Remove from favourites' : 'Mark as favourite'}
            >
              <Star size={20} fill={isFavorite ? '#E5A100' : 'none'} strokeWidth={1.8} />
            </button>

            <button
              type="button"
              onClick={handleRequestClose}
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: '9999px' }}
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            flex: 1,
          }}
        >
          {/* Date & Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} />
                <span>When did this happen? *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  fontSize: '0.88rem',
                  padding: '10px 12px',
                  borderRadius: '12px',
                }}
              />
            </div>

            <div>
              <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                <span>Time (Optional)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input"
                style={{
                  width: '100%',
                  fontSize: '0.88rem',
                  padding: '10px 12px',
                  borderRadius: '12px',
                }}
              />
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label className="label-micro">Give this memory a title</label>
            <input
              type="text"
              placeholder="e.g. Sunset at Gokarna, Midnight street food..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              style={{
                width: '100%',
                fontSize: '0.96rem',
                fontWeight: 600,
                padding: '12px 14px',
                borderRadius: '12px',
              }}
            />
          </div>

          {/* Mood Selector Chips */}
          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} />
              <span>Mood / Atmosphere (Optional)</span>
            </label>
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'none',
              }}
            >
              {MOOD_OPTIONS.map((m) => {
                const isSelected = mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(isSelected ? undefined : m)}
                    className="filter-chip"
                    style={{
                      backgroundColor: isSelected ? '#111111' : 'var(--surface-neutral-1)',
                      color: isSelected ? '#ffffff' : 'var(--primary)',
                      border: isSelected ? '1px solid #111111' : '1px solid var(--stroke)',
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content / Story Textarea */}
          <div>
            <label className="label-micro">Write about the experience</label>
            <textarea
              placeholder="What made this moment unforgettable? Describe the smells, sights, conversations, and reflections..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="textarea"
              style={{
                width: '100%',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                padding: '12px 14px',
                borderRadius: '12px',
              }}
            />
          </div>

          {/* Photos Upload & Gallery */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                <Camera size={12} />
                <span>Photos ({photos.length})</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-ghost"
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={14} />
                <span>Add Photos</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {photos.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--stroke)',
                      backgroundColor: 'var(--surface-neutral-1)',
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Memory photo ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove image"
                    >
                      <X size={13} strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1px dashed var(--stroke)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--surface-neutral-1)',
                  transition: 'background-color 150ms ease',
                }}
              >
                <Camera size={20} strokeWidth={1.6} color="var(--secondary)" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Attach photographs
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px' }}>
                  Tap to upload from device. Completely optional!
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC RELATIONSHIPS SECTION */}
          <div
            className="travelnest-card"
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--surface-neutral-1)',
              border: '1px solid var(--stroke)',
              borderRadius: '16px',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Luggage size={14} color="var(--primary)" />
                <span className="label-micro" style={{ margin: 0 }}>
                  Trip & Itinerary Link (Optional)
                </span>
              </div>
              {selectedTripId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTripId(undefined);
                    setSelectedEventId(undefined);
                  }}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.72rem', color: '#D9383A', padding: '2px 6px', fontWeight: 600 }}
                >
                  Unlink Trip
                </button>
              )}
            </div>

            {/* Trip Picker */}
            <div>
              <select
                value={selectedTripId || ''}
                onChange={(e) => {
                  const val = e.target.value || undefined;
                  setSelectedTripId(val);
                  setSelectedEventId(undefined);
                }}
                className="input"
                style={{
                  width: '100%',
                  fontSize: '0.86rem',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">No trip (Standalone memory)</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.name} ({trip.destination})
                  </option>
                ))}
              </select>
            </div>

            {/* Itinerary Activity Picker (Only when Trip is selected!) */}
            {selectedTrip && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="label-micro" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Compass size={11} />
                    <span>Linked Itinerary Activity</span>
                  </label>
                  {selectedEventId && (
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(undefined)}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.72rem', color: '#D9383A', padding: '2px 4px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <select
                  value={selectedEventId || ''}
                  onChange={(e) => setSelectedEventId(e.target.value || undefined)}
                  className="input"
                  style={{
                    width: '100%',
                    fontSize: '0.86rem',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">No specific activity (Trip-wide memory)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      Day {ev.dayNumber}: {ev.title} {ev.startTime ? `(${ev.startTime})` : ''}
                    </option>
                  ))}
                </select>

                {selectedEvent && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--stroke)',
                      fontSize: '0.76rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedEvent.title}</div>
                    <div style={{ color: 'var(--secondary)', marginTop: '2px' }}>
                      Day {selectedEvent.dayNumber} · {selectedEvent.startTime} – {selectedEvent.endTime}
                      {selectedEvent.location && ` · 📍 ${selectedEvent.location}`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location & Saved Place */}
          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} />
              <span>Location / Spot (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Om Beach, Gokarna / Shibuya Crossing"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="input"
              style={{
                width: '100%',
                fontSize: '0.88rem',
                padding: '10px 12px',
                borderRadius: '12px',
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="label-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={12} />
              <span>Tags (Optional)</span>
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="input"
                style={{
                  flex: 1,
                  fontSize: '0.88rem',
                  padding: '10px 12px',
                  borderRadius: '12px',
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-secondary"
                style={{
                  minHeight: '42px',
                  padding: '0 14px',
                  fontSize: '0.82rem',
                  borderRadius: '12px',
                }}
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--surface-neutral-2)',
                      border: '1px solid var(--stroke)',
                      color: 'var(--primary)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.76rem',
                      fontWeight: 500,
                    }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--secondary)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid var(--stroke)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '46px', borderRadius: '9999px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ flex: 1.5, minHeight: '46px', borderRadius: '9999px' }}
            >
              {isSaving ? 'Saving...' : editingEntry ? 'Save Changes' : 'Record Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
