import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import { JournalEntryModal } from './JournalEntryModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  Luggage,
  Compass,
  Star,
  Edit2,
  Trash2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface JournalDetailViewProps {
  journalId: string;
  onBack: () => void;
}

export const JournalDetailView: React.FC<JournalDetailViewProps> = ({
  journalId,
  onBack,
}) => {
  const { showToast, setActiveTripId, setActiveTab } = useApp();
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Live query for the entry
  const entry = useLiveQuery(
    () => db.journalEntries.get(journalId),
    [journalId]
  );

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

  if (!entry) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            padding: '6px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.88rem',
            fontWeight: 600,
            alignSelf: 'flex-start',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} />
          <span>Back</span>
        </button>

        <div
          className="travelnest-card"
          style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--surface-neutral-1)', margin: 0 }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Memory Not Found</h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.84rem', marginTop: '6px' }}>
            This journal entry may have been removed or deleted.
          </p>
          <button
            onClick={onBack}
            className="btn btn-primary"
            style={{ marginTop: '16px', minHeight: '42px', borderRadius: '9999px' }}
          >
            Return to Journal
          </button>
        </div>
      </div>
    );
  }

  const hasPhotos = entry.photos && entry.photos.length > 0;
  const currentPhoto = hasPhotos ? entry.photos![activePhotoIndex] || entry.photos![0] : null;

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    try {
      const updatedFav = !entry.isFavorite;
      await db.journalEntries.update(entry.id, {
        isFavorite: updatedFav,
        isEdited: true,
        updatedAt: new Date().toISOString(),
      });
      showToast(updatedFav ? 'Saved to favourites' : 'Removed from favourites', 'info');
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  // Delete Entry
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await db.journalEntries.delete(entry.id);
      showToast('Journal memory removed.', 'success');
      setShowDeleteConfirm(false);
      onBack();
    } catch (err) {
      console.error('Delete journal entry error:', err);
      showToast('Failed to delete memory', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      {/* Top Cupertino Page Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '2px',
          minHeight: '40px',
        }}
      >
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--primary)',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="btn btn-ghost"
            style={{
              padding: '7px',
              borderRadius: '9999px',
              color: entry.isFavorite ? '#E5A100' : 'var(--secondary)',
            }}
            title={entry.isFavorite ? 'Favourited' : 'Add to favourites'}
          >
            <Star size={19} fill={entry.isFavorite ? '#E5A100' : 'none'} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9999px', color: 'var(--primary)' }}
            title="Edit memory"
          >
            <Edit2 size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9999px', color: '#D9383A' }}
            title="Delete memory"
          >
            <Trash2 size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* HERO MEDIA OR EDITORIAL INTENTIONAL PLACEHOLDER */}
      {hasPhotos ? (
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#111111',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '280px',
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
                background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)',
              }}
            />
          </div>

          {/* Multiple Photos Thumbnails Carousel */}
          {entry.photos!.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 16px',
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: activePhotoIndex === index ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                    padding: 0,
                    cursor: 'pointer',
                    flexShrink: 0,
                    opacity: activePhotoIndex === index ? 1 : 0.6,
                    transition: 'all 120ms ease',
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
        /* Intentional Non-Photo Editorial Card */
        <div
          className="travelnest-card"
          style={{
            padding: '24px 20px',
            backgroundColor: 'var(--surface-neutral-1)',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--stroke)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} strokeWidth={1.8} color="var(--primary)" />
          </div>
          <div>
            <span className="label-micro" style={{ margin: 0, color: 'var(--secondary)' }}>
              Personal Reflection Note
            </span>
            <div style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
              Analog Story · No Camera Attached
            </div>
          </div>
        </div>
      )}

      {/* Memory Title & Primary Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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

        <h2
          style={{
            fontSize: '1.65rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: '1.25',
            color: 'var(--primary)',
            margin: 0,
          }}
        >
          {entry.title}
        </h2>

        {/* Metadata Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '14px',
            fontSize: '0.82rem',
            color: 'var(--secondary)',
            marginTop: '10px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={14} strokeWidth={1.8} />
            {formatDateDDmmmYY(entry.date)}
          </span>

          {entry.time && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} strokeWidth={1.8} />
              {entry.time}
            </span>
          )}

          {entry.locationName && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} strokeWidth={1.8} />
              {entry.locationName}
            </span>
          )}
        </div>
      </div>

      {/* Written Story & Reflection Card */}
      {entry.content && (
        <div
          className="travelnest-card"
          style={{
            padding: '20px',
            margin: 0,
            borderRadius: '20px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--stroke)',
          }}
        >
          <span className="label-micro" style={{ marginBottom: '10px' }}>
            The Story
          </span>
          <div
            style={{
              fontSize: '0.98rem',
              lineHeight: '1.7',
              color: 'var(--primary)',
              whiteSpace: 'pre-line',
              letterSpacing: '-0.01em',
            }}
          >
            {entry.content}
          </div>
        </div>
      )}

      {/* Tags Carousel */}
      {entry.tags && entry.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.78rem',
                backgroundColor: 'var(--surface-neutral-2)',
                border: '1px solid var(--stroke)',
                color: 'var(--primary)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontWeight: 500,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* CONDITIONAL RELATIONSHIP BLOCKS */}

      {/* 1. Linked Itinerary Activity */}
      {linkedEvent && (
        <div
          className="travelnest-card"
          style={{
            padding: '16px',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Compass size={14} color="var(--primary)" />
            <span className="label-micro" style={{ margin: 0 }}>
              Linked Itinerary Activity
            </span>
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--primary)' }}>
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

      {/* 2. Linked Trip */}
      {linkedTrip && (
        <div
          className="travelnest-card"
          style={{
            padding: '16px',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Luggage size={14} color="var(--primary)" />
              <span className="label-micro" style={{ margin: 0 }}>
                Linked Trip
              </span>
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--primary)' }}>
              {linkedTrip.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', marginTop: '2px' }}>
              {linkedTrip.destination} ({linkedTrip.country || 'Global'})
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTripId(linkedTrip.id);
              setActiveTab('trips');
              onBack();
            }}
            className="btn btn-ghost"
            style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
          >
            <span>View Trip</span>
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* 3. Linked Saved Place */}
      {linkedPlace && (
        <div
          className="travelnest-card"
          style={{
            padding: '16px',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <MapPin size={14} color="var(--primary)" />
            <span className="label-micro" style={{ margin: 0 }}>
              Linked Saved Place
            </span>
          </div>

          <div style={{ fontWeight: 600, fontSize: '0.94rem', color: 'var(--primary)' }}>
            {linkedPlace.name}
          </div>
          {linkedPlace.address && (
            <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', marginTop: '2px' }}>
              {linkedPlace.address}
            </div>
          )}
        </div>
      )}

      {/* Edit Entry Modal */}
      <JournalEntryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editingEntry={entry}
      />

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
    </div>
  );
};
