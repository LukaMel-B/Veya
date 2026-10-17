import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { JournalEntry } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Luggage,
  Compass,
  Star,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface JournalDetailModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (entry: JournalEntry) => void;
  onDeleted?: () => void;
}

export const JournalDetailModal: React.FC<JournalDetailModalProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onDeleted,
}) => {
  const { showToast } = useApp();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Live queries for linked entities
  const linkedTrip = useLiveQuery(
    async () => (entry?.tripId ? await db.trips.get(entry.tripId) : undefined),
    [entry?.tripId]
  );

  const linkedEvent = useLiveQuery(
    async () => (entry?.itineraryEventId ? await db.itineraryEvents.get(entry.itineraryEventId) : undefined),
    [entry?.itineraryEventId]
  );

  const linkedPlace = useLiveQuery(
    async () => (entry?.placeId ? await db.places.get(entry.placeId) : undefined),
    [entry?.placeId]
  );

  if (!isOpen || !entry) return null;

  const hasPhotos = entry.photos && entry.photos.length > 0;
  const currentPhoto = hasPhotos ? entry.photos![activePhotoIndex] || entry.photos![0] : null;

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    try {
      const updatedFav = !entry.isFavorite;
      await db.journalEntries.update(entry.id, { isFavorite: updatedFav, updatedAt: new Date().toISOString() });
      entry.isFavorite = updatedFav;
      showToast(updatedFav ? 'Added to favourites' : 'Removed from favourites', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Entry
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await db.journalEntries.delete(entry.id);
      showToast('Journal memory removed.', 'success');
      setShowDeleteConfirm(false);
      onClose();
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error('Delete journal entry error:', err);
      showToast('Failed to delete memory', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="modal-overlay"
        onClick={onClose}
      >
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '520px',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Header Action Bar */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--stroke)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="label-micro" style={{ margin: 0 }}>
                {entry.date ? formatDateDDmmmYY(entry.date) : 'Memory'}
              </span>
              {entry.mood && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    backgroundColor: 'var(--surface-neutral-1)',
                    border: '1px solid var(--stroke)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 500,
                  }}
                >
                  {entry.mood}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="btn btn-ghost"
                style={{
                  padding: '6px',
                  borderRadius: '9999px',
                  color: entry.isFavorite ? '#E5A100' : 'var(--secondary)',
                }}
                title={entry.isFavorite ? 'Favourited' : 'Add to favourites'}
              >
                <Star size={19} fill={entry.isFavorite ? '#E5A100' : 'none'} strokeWidth={1.8} />
              </button>

              <button
                type="button"
                onClick={() => {
                  onEdit(entry);
                }}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '9999px', color: 'var(--primary)' }}
                title="Edit entry"
              >
                <Edit2 size={18} strokeWidth={1.8} />
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '9999px', color: '#D9383A' }}
                title="Delete memory"
              >
                <Trash2 size={18} strokeWidth={1.8} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: '9999px', marginLeft: '4px' }}
                title="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Scrollable Detail Body */}
          <div
            style={{
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {/* PHOTO HERO OR INTENTIONAL PLACEHOLDER */}
            {hasPhotos ? (
              <div style={{ position: 'relative', width: '100%', backgroundColor: '#111111' }}>
                <div
                  style={{
                    width: '100%',
                    height: '260px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={currentPhoto!}
                    alt={entry.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)',
                    }}
                  />
                </div>

                {/* Multiple Photos Thumbnails / Indicator */}
                {entry.photos!.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      padding: '10px 16px',
                      backgroundColor: 'rgba(17, 17, 17, 0.95)',
                      overflowX: 'auto',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {entry.photos!.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setActivePhotoIndex(index)}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: activePhotoIndex === index ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0,
                          opacity: activePhotoIndex === index ? 1 : 0.6,
                        }}
                      >
                        <img
                          src={photo}
                          alt={`thumbnail ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Polished Neutral Visual Treatment (Never broken image!) */
              <div
                style={{
                  padding: '24px 20px',
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderBottom: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--stroke)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={20} strokeWidth={1.8} color="var(--primary)" />
                </div>
                <div>
                  <span className="label-micro" style={{ margin: 0, color: 'var(--secondary)' }}>
                    Personal Written Reflection
                  </span>
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    Analog Note · No Camera Attached
                  </div>
                </div>
              </div>
            )}

            {/* Entry Content Area */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title & Metadata */}
              <div>
                <h2
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    letterSpacing: '-0.025em',
                    lineHeight: '1.25',
                    color: 'var(--primary)',
                    marginBottom: '8px',
                  }}
                >
                  {entry.title}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--secondary)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} strokeWidth={1.8} />
                    {formatDateDDmmmYY(entry.date)}
                  </span>

                  {entry.time && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} strokeWidth={1.8} />
                      {entry.time}
                    </span>
                  )}

                  {entry.locationName && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={13} strokeWidth={1.8} />
                      {entry.locationName}
                    </span>
                  )}
                </div>
              </div>

              {/* Written Memory Story */}
              {entry.content && (
                <div
                  style={{
                    fontSize: '0.94rem',
                    lineHeight: '1.65',
                    color: 'var(--primary)',
                    whiteSpace: 'pre-line',
                    backgroundColor: 'var(--surface-neutral-1)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid var(--stroke)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {entry.content}
                </div>
              )}

              {/* Tags */}
              {entry.tags && entry.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--surface-neutral-2)',
                        border: '1px solid var(--stroke)',
                        color: 'var(--primary)',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontWeight: 500,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CONDITIONAL RELATIONSHIP CARDS (Only show when available!) */}

              {/* 1. Linked Itinerary Activity */}
              {linkedEvent && (
                <div
                  className="travelnest-card"
                  style={{
                    padding: '14px 16px',
                    margin: 0,
                    borderRadius: '16px',
                    border: '1px solid var(--stroke)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Compass size={14} color="var(--primary)" />
                    <span className="label-micro" style={{ margin: 0 }}>
                      Linked Itinerary Activity
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary)' }}>
                    {linkedEvent.title}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', marginTop: '3px' }}>
                    Day {linkedEvent.dayNumber} · {linkedEvent.startTime} – {linkedEvent.endTime}
                    {linkedTrip && ` · ${linkedTrip.name}`}
                  </div>

                  {linkedEvent.location && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--primary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={12} />
                      <span>{linkedEvent.location}</span>
                    </div>
                  )}

                  {linkedEvent.notes && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                      "{linkedEvent.notes}"
                    </div>
                  )}
                </div>
              )}

              {/* 2. Linked Trip (Only when trip is linked and no activity card displayed) */}
              {linkedTrip && !linkedEvent && (
                <div
                  className="travelnest-card"
                  style={{
                    padding: '14px 16px',
                    margin: 0,
                    borderRadius: '16px',
                    border: '1px solid var(--stroke)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <Luggage size={14} color="var(--primary)" />
                    <span className="label-micro" style={{ margin: 0 }}>
                      Linked Trip
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary)' }}>
                    {linkedTrip.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', marginTop: '2px' }}>
                    {linkedTrip.destination} ({linkedTrip.country || 'Global'})
                  </div>
                </div>
              )}

              {/* 3. Linked Saved Place */}
              {linkedPlace && (
                <div
                  className="travelnest-card"
                  style={{
                    padding: '14px 16px',
                    margin: 0,
                    borderRadius: '16px',
                    border: '1px solid var(--stroke)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span className="label-micro" style={{ margin: 0 }}>
                      Linked Saved Place
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary)' }}>
                    {linkedPlace.name}
                  </div>
                  {linkedPlace.address && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', marginTop: '2px' }}>
                      {linkedPlace.address}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this memory?"
        kicker="IRREVERSIBLE"
        message="This will remove this journal entry and its attached photos from your device. Linked trips, itinerary activities, and saved places will remain completely safe."
        confirmText="Delete"
        cancelText="Keep Memory"
        variant="destructive"
        icon="trash"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </ModalPortal>
  );
};
