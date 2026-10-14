import React, { useState, useMemo } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, JournalEntry, ItineraryEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import { JournalEntryCard } from './JournalView';
import {
  BookOpen,
  Plus,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface TripJournalViewProps {
  trip: Trip;
}

export const TripJournalView: React.FC<TripJournalViewProps> = ({ trip }) => {
  const { openJournalModal, showToast, setActiveJournalId } = useApp();

  // Queries: strictly for this trip!
  const tripEntries = useLiveQuery(
    () => db.journalEntries.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  ) || [];

  // Sort chronologically (newest first)
  const sortedEntries = useMemo(() => {
    return [...tripEntries].sort((a, b) => {
      const timeA = new Date(a.date + (a.time ? `T${a.time}` : 'T00:00:00')).getTime();
      const timeB = new Date(b.date + (b.time ? `T${b.time}` : 'T00:00:00')).getTime();
      return timeB - timeA;
    });
  }, [tripEntries]);

  // Total photos count in this trip
  const totalPhotos = useMemo(() => {
    return tripEntries.reduce((acc, e) => acc + (e.photos?.length || 0), 0);
  }, [tripEntries]);

  const handleOpenDetail = (entry: JournalEntry) => {
    setActiveJournalId(entry.id);
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Stat Strip */}
      <div
        className="travelnest-card"
        style={{
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          margin: 0,
          borderRadius: '16px',
          border: '1px solid var(--stroke)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span className="label-micro" style={{ margin: 0 }}>
            Trip Field Log
          </span>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
            {tripEntries.length} {tripEntries.length === 1 ? 'Memory Logged' : 'Memories Logged'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '1px' }}>
            {totalPhotos} {totalPhotos === 1 ? 'photo' : 'photos'} attached
          </div>
        </div>

        <button
          onClick={() => openJournalModal({ tripId: trip.id, date: trip.startDate })}
          className="btn btn-primary btn-sm"
          style={{ minHeight: '38px', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.82rem' }}
        >
          <Plus size={15} strokeWidth={2.4} />
          <span>Add Memory</span>
        </button>
      </div>

      {/* Trip Timeline Entries */}
      {sortedEntries.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              trip={trip}
              onClick={() => handleOpenDetail(entry)}
              onToggleFavorite={(e) => handleToggleFavorite(entry, e)}
            />
          ))}
        </div>
      ) : (
        <div
          className="travelnest-card"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            backgroundColor: 'var(--surface-neutral-1)',
            margin: 0,
            borderRadius: '20px',
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
              margin: '0 auto 12px',
            }}
          >
            <BookOpen size={22} strokeWidth={1.8} color="var(--primary)" />
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.015em' }}>
            No Memories for this Trip Yet
          </h3>

          <p
            style={{
              color: 'var(--secondary)',
              fontSize: '0.82rem',
              margin: '6px auto 18px',
              maxWidth: '280px',
              lineHeight: '1.4',
            }}
          >
            Log highlights, reflections, and photos from your time in {trip.destination}.
          </p>

          <button
            onClick={() => openJournalModal({ tripId: trip.id, date: trip.startDate })}
            className="btn btn-primary"
            style={{ minHeight: '44px', padding: '0 20px', borderRadius: '9999px' }}
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>Add Trip Memory</span>
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onClick={() => openJournalModal({ tripId: trip.id, date: trip.startDate })}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Log Memory"
      />

    </div>
  );
};
