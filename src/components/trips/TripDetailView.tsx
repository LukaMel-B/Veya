import React, { useState } from 'react';
import { useApp, type TripSubNavTab } from '../../context/AppContext';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { ItineraryView } from '../itinerary/ItineraryView';
import { BudgetView } from '../budget/BudgetView';
import { BookingsView } from '../bookings/BookingsView';
import { EssentialsView } from '../essentials/EssentialsView';
import { TripJournalView } from '../journal/TripJournalView';
import { DocumentsView } from '../documents/DocumentsView';
import { ShareView } from '../share/ShareView';
import {
  Calendar,
  MapPin,
  Clock,
  FileCheck,
  Luggage,
  ChevronRight,
  ChevronLeft,
  Plus,
  Pencil,
  Bookmark,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';
import { EditTripModal } from './EditTripModal';
import { TripSavedCollectionView } from './TripSavedCollectionView';
import { CompanionView } from '../companion/CompanionView';
import { detectCountry, getItemEffectiveCountry } from '../../utils/countryUtils';
import { formatDateRangeDDmmmYY } from '../../utils/dateUtils';

interface TripDetailViewProps {
  tripId: string;
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({ tripId }) => {
  const { tripSubTab, setTripSubTab, openQuickAdd, setActiveTripId } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId]);
  const events = useLiveQuery(() => db.itineraryEvents.where('tripId').equals(tripId).toArray(), [tripId]);
  const bookings = useLiveQuery(() => db.bookings.where('tripId').equals(tripId).toArray(), [tripId]);
  const expenses = useLiveQuery(() => db.expenses.where('tripId').equals(tripId).toArray(), [tripId]);
  const essentials = useLiveQuery(() => db.essentials.where('tripId').equals(tripId).toArray(), [tripId]);
  const docsCount = useLiveQuery(() => db.documents.where('tripId').equals(tripId).count(), [tripId]);
  const journalsCount = useLiveQuery(() => db.journalEntries.where('tripId').equals(tripId).count(), [tripId]);
  const allSavedItems = useLiveQuery(() => db.collectionItems.toArray(), []);

  if (!trip) {
    return (
      <div className="travelnest-card" style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: 'var(--surface-neutral-1)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Trip not found</h3>
        <p style={{ color: 'var(--secondary)', marginTop: '6px', fontSize: '0.85rem' }}>
          This trip may have been removed.
        </p>
      </div>
    );
  }

  // Days until departure
  const nowStr = new Date().toISOString().split('T')[0];
  const diffTime = new Date(trip.startDate).getTime() - new Date(nowStr).getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Country & Saved spots for this trip
  const tripCountry = trip.country || detectCountry(trip.destination);
  const countrySavedCount = (allSavedItems || []).filter(
    (i) => {
      const effCountry = getItemEffectiveCountry(i);
      return (
        effCountry.toLowerCase() === tripCountry.trim().toLowerCase() ||
        i.tripId === trip.id
      );
    }
  ).length;

  const subTabs: { id: TripSubNavTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'companion', label: 'Companion' },
    { id: 'saved', label: 'Saved', count: countrySavedCount },
    { id: 'itinerary', label: 'Itinerary', count: events?.length },
    { id: 'budget', label: 'Budget', count: expenses?.length },
    { id: 'bookings', label: 'Bookings', count: bookings?.length },
    { id: 'essentials', label: 'Essentials', count: essentials?.length },
    { id: 'journal', label: 'Journal', count: journalsCount },
    { id: 'documents', label: 'Docs', count: docsCount },
    { id: 'share', label: 'Share' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '2px' }}>
        <button
          onClick={() => {
            if (tripSubTab !== 'overview') {
              setTripSubTab('overview');
            } else {
              setActiveTripId(null);
            }
          }}
          className="btn btn-ghost"
          style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronLeft size={18} strokeWidth={2.2} color="var(--primary)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
            {tripSubTab !== 'overview' ? 'Overview' : 'My Trips'}
          </span>
        </button>
      </div>

      {/* Trip Header Banner Card */}
      <div
        className="travelnest-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          margin: 0,
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            height: '145px',
            position: 'relative',
            backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 17, 0.2), rgba(17, 17, 17, 0.85)), url(${
              trip.coverImage ||
              'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'
            })`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '10px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {daysUntil > 0 ? `${daysUntil} Days Remaining` : 'Trip Active'}
            </span>

            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#111111',
                padding: '3px 9px',
                borderRadius: '9999px',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {trip.status}
            </span>
          </div>

          <div>
            <h2 style={{ color: '#FFFFFF', fontSize: '1.35rem', marginBottom: '4px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {trip.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', opacity: 0.95 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} strokeWidth={2} />
                {trip.destination}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} strokeWidth={2} />
                {formatDateRangeDDmmmYY(trip.startDate, trip.endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Navigation Control */}
      <div
        className="cupertino-segmented"
        style={{
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '3px',
          scrollbarWidth: 'none',
        }}
      >
        {subTabs.map((tab) => {
          const isActive = tripSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTripSubTab(tab.id)}
              className={`cupertino-segment-item ${isActive ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="chip-count-bubble">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-Views */}
      {tripSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div
              className="travelnest-card"
              onClick={() => setTripSubTab('itinerary')}
              style={{ cursor: 'pointer', padding: '12px 8px', textAlign: 'center', margin: 0, backgroundColor: '#ffffff' }}
            >
              <Clock size={16} strokeWidth={2} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                {events?.length || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Schedule
              </div>
            </div>

            <div
              className="travelnest-card"
              onClick={() => setTripSubTab('bookings')}
              style={{ cursor: 'pointer', padding: '12px 8px', textAlign: 'center', margin: 0, backgroundColor: '#ffffff' }}
            >
              <FileCheck size={16} strokeWidth={2} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                {bookings?.length || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bookings
              </div>
            </div>

            <div
              className="travelnest-card"
              onClick={() => setTripSubTab('essentials')}
              style={{ cursor: 'pointer', padding: '12px 8px', textAlign: 'center', margin: 0, backgroundColor: '#ffffff' }}
            >
              <Luggage size={16} strokeWidth={2} color="var(--primary)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
                {essentials?.filter((e) => e.packed).length || 0}/{essentials?.length || 0}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Packed
              </div>
            </div>
          </div>

          {/* Trip Details & Travelers Summary Card */}
          <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="label-micro" style={{ margin: 0 }}>Trip Details</span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn btn-ghost"
                style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', padding: 0 }}
              >
                <Pencil size={11} strokeWidth={2} />
                <span>Edit</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: 'var(--surface-neutral-1)', border: '1px solid var(--stroke)', borderRadius: '12px', padding: '10px 12px' }}>
                <span className="label-micro" style={{ marginBottom: '2px' }}>Planned Budget</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
                  ₹{trip.plannedBudget.toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface-neutral-1)', border: '1px solid var(--stroke)', borderRadius: '12px', padding: '10px 12px' }}>
                <span className="label-micro" style={{ marginBottom: '2px' }}>Travelers ({trip.travelers?.length || 1})</span>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={trip.travelers?.join(', ')}>
                  {trip.travelers?.join(', ') || 'Me'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '12px' }}>
              <Calendar size={13} strokeWidth={1.8} />
              <span>{formatDateRangeDDmmmYY(trip.startDate, trip.endDate)}</span>
            </div>
          </div>

          {/* Trip Notes Card */}
          {trip.notes && (
            <div className="travelnest-card" style={{ padding: '16px 18px', margin: 0, backgroundColor: '#ffffff', border: '1px solid var(--stroke)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#111111', letterSpacing: '-0.01em' }}>
                  Trip Highlights & Notes
                </span>
              </div>
              <p style={{ color: '#2a2a2a', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                {trip.notes}
              </p>
            </div>
          )}

          {/* Grouped Quick Actions */}
          <div className="cupertino-section" style={{ margin: 0 }}>
            <span className="label-micro" style={{ paddingLeft: '4px' }}>Quick Actions</span>
            <div className="travelnest-card" style={{ padding: 0, margin: '6px 0 0', backgroundColor: '#ffffff' }}>
              <div
                onClick={() => openQuickAdd(trip.id)}
                className="cupertino-row"
                style={{ cursor: 'pointer', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Plus size={15} strokeWidth={2.2} color="var(--primary)" />
                  <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>Capture Note, Place or Expense</span>
                </div>
                <ChevronRight size={15} strokeWidth={1.8} color="var(--secondary)" />
              </div>

              <div
                onClick={() => setTripSubTab('saved')}
                className="cupertino-row"
                style={{ cursor: 'pointer', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bookmark size={15} strokeWidth={2} color="var(--primary)" />
                  <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>Browse Saved {tripCountry} Spots ({countrySavedCount})</span>
                </div>
                <ChevronRight size={15} strokeWidth={1.8} color="var(--secondary)" />
              </div>

              <div
                onClick={() => setTripSubTab('itinerary')}
                className="cupertino-row"
                style={{ cursor: 'pointer', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={15} strokeWidth={2} color="var(--primary)" />
                  <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>Add Day-by-Day Activity</span>
                </div>
                <ChevronRight size={15} strokeWidth={1.8} color="var(--secondary)" />
              </div>

              <div
                onClick={() => setTripSubTab('share')}
                className="cupertino-row"
                style={{ cursor: 'pointer', borderBottom: 'none', padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCheck size={15} strokeWidth={2} color="var(--primary)" />
                  <span style={{ fontWeight: 500, fontSize: '0.88rem' }}>Export & Share Schedule</span>
                </div>
                <ChevronRight size={15} strokeWidth={1.8} color="var(--secondary)" />
              </div>
            </div>
          </div>

          <FloatingActionButton
            onClick={() => openQuickAdd(trip.id)}
            icon={<Plus size={24} strokeWidth={2.4} />}
            label="Capture"
          />
        </div>
      )}

      {tripSubTab === 'companion' && <CompanionView tripId={trip.id} />}
      {tripSubTab === 'saved' && <TripSavedCollectionView trip={trip} />}
      {tripSubTab === 'itinerary' && <ItineraryView trip={trip} />}
      {tripSubTab === 'budget' && <BudgetView trip={trip} />}
      {tripSubTab === 'bookings' && <BookingsView trip={trip} />}
      {tripSubTab === 'essentials' && <EssentialsView trip={trip} />}
      {(tripSubTab === 'journal' || tripSubTab === 'places') && <TripJournalView trip={trip} />}
      {tripSubTab === 'documents' && <DocumentsView trip={trip} />}
      {tripSubTab === 'share' && <ShareView trip={trip} />}

      <EditTripModal
        trip={trip}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
