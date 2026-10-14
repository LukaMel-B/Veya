import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { JournalEntry } from '../../types';
import { formatDateDDmmmYY, formatDateRangeDDmmmYY } from '../../utils/dateUtils';
import {
  Calendar,
  ChevronRight,
  BookmarkCheck,
  CheckCircle2,
  Plus,
  Luggage,
  Sparkles,
  TrendingUp,
  MapPin,
  ArrowUpRight,
  BookOpen,
  Compass,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';
import { getCountryFlag, getCategoryBadge } from '../../utils/countryUtils';

export const HomeView: React.FC = () => {
  const {
  setActiveTripId,
  setActiveTab,
  setTripSubTab,
  openQuickAdd,
  openJournalModal,
  setActiveJournalId,
  setActiveCollectionItemId,
} = useApp();

  const trips = useLiveQuery(() => db.trips.toArray(), []);
  const savedItemsCount = useLiveQuery(() => db.collectionItems.count(), []) || 0;
  const recentSavedItems = useLiveQuery(
    () => db.collectionItems.orderBy('createdAt').reverse().limit(3).toArray(),
    []
  ) || [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray(), []);
  const allBookings = useLiveQuery(() => db.bookings.toArray(), []);
  const allEssentials = useLiveQuery(() => db.essentials.toArray(), []);
  const journalCount = useLiveQuery(() => db.journalEntries.count(), []) || 0;
  const recentJournals = useLiveQuery(
    () => db.journalEntries.orderBy('date').reverse().limit(3).toArray(),
    []
  ) || [];

  // Find next upcoming or ongoing trip
  const nowStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const upcomingTrips = useMemo(() => {
    return (trips || [])
      .filter((t) => t.status === 'upcoming' || t.status === 'ongoing' || t.status === 'planning')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [trips]);

  const featuredTrip = upcomingTrips.length > 0 ? upcomingTrips[0] : null;

  // Calculate days until trip
  const daysUntil = useMemo(() => {
    if (!featuredTrip?.startDate) return 0;
    const diffTime = new Date(featuredTrip.startDate).getTime() - new Date(nowStr).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [featuredTrip?.startDate, nowStr]);

  // Budget calculations
  const totalPlanned = useMemo(() => {
    return trips?.reduce((acc, t) => acc + (t.plannedBudget || 0), 0) || 0;
  }, [trips]);

  const totalCommittedAndActual = useMemo(() => {
    const independentExpenseSum = (allExpenses || [])
      .filter((e) => !e.bookingId)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const bookingsSum = (allBookings || []).reduce((sum, b) => sum + (b.cost || 0), 0);
    return independentExpenseSum + bookingsSum;
  }, [allExpenses, allBookings]);

  // Packing essentials progress
  const { packedCount, totalEssentials, packedPercent } = useMemo(() => {
    const packed = allEssentials?.filter((e) => e.packed).length || 0;
    const total = allEssentials?.length || 0;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { packedCount: packed, totalEssentials: total, packedPercent: percent };
  }, [allEssentials]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div id="home-header" data-tour-target="home-header">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--primary)', margin: 0 }}>
          Travel Workspace
        </h2>
      </div>

      {/* Featured Next Trip Card (Notebook / Editorial Style) */}
      {featuredTrip ? (
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            margin: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              height: '190px',
              backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 17, 0.2), rgba(17, 17, 17, 0.85)), url(${
                featuredTrip.coverImage ||
                'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'
              })`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px',
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
                  padding: '4px 12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {daysUntil > 0
                  ? `${daysUntil} Days Remaining`
                  : daysUntil === 0
                  ? 'Departing Today'
                  : 'Trip Active'}
              </span>

              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  color: '#111111',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {featuredTrip.status}
              </span>
            </div>

            <div>
              <span className="label-micro" style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2px' }}>
                Next Destination
              </span>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                {featuredTrip.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', opacity: 0.95 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} strokeWidth={2} />
                  {featuredTrip.destination}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} strokeWidth={2} />
                  {formatDateRangeDDmmmYY(featuredTrip.startDate, featuredTrip.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-neutral-1)',
              borderTop: '1px solid var(--stroke)',
            }}
          >
            <div>
              <span className="label-micro" style={{ marginBottom: '2px' }}>
                Budget Allocation
              </span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', letterSpacing: '-0.01em' }}>
                ₹{featuredTrip.plannedBudget.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setActiveTripId(featuredTrip.id);
                  setTripSubTab('companion');
                  setActiveTab('trips');
                }}
                className="btn btn-secondary btn-sm"
                style={{ minHeight: '38px', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Companion</span>
              </button>
              <button
                onClick={() => {
                  setActiveTripId(featuredTrip.id);
                  setTripSubTab('itinerary');
                  setActiveTab('trips');
                }}
                className="btn btn-primary btn-sm"
                style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Itinerary</span>
                <ChevronRight size={14} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="travelnest-card"
          style={{
            textAlign: 'center',
            padding: '36px 20px',
            backgroundColor: 'var(--surface-neutral-1)',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--stroke)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Compass size={26} strokeWidth={1.8} color="var(--primary)" />
          </div>
          <span className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
            PRIVATE TRAVEL WORKSPACE
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--primary)' }}>
            Welcome to Veya
          </h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '6px auto 18px', maxWidth: '320px', lineHeight: '1.45' }}>
            Plan offline itineraries, organize country finds, track budgets, and write memory journals — 100% stored on this device.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('trips')}
              className="btn btn-primary"
              style={{ minHeight: '42px', padding: '0 18px', borderRadius: '9999px', fontSize: '0.84rem' }}
            >
              <Plus size={15} strokeWidth={2.2} />
              <span>Plan First Trip</span>
            </button>
            <button
              onClick={() => openQuickAdd()}
              className="btn btn-secondary"
              style={{ minHeight: '42px', padding: '0 16px', borderRadius: '9999px', fontSize: '0.84rem' }}
            >
              <span>+ Quick Capture</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row (2 Nested Data Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {/* Metric 1: Budget Outlay */}
        <div
          className="travelnest-card"
          style={{
            padding: '14px 16px',
            margin: 0,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="label-micro" style={{ margin: 0 }}>
              Total Outlay
            </span>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '9999px',
                backgroundColor: 'var(--surface-neutral-2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--stroke)',
              }}
            >
              <TrendingUp size={13} strokeWidth={2} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)' }}>
              ₹{totalCommittedAndActual.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px' }}>
              Planned: ₹{totalPlanned.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metric 2: Packing Checklist Progress */}
        <div
          className="travelnest-card"
          style={{
            padding: '14px 16px',
            margin: 0,
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="label-micro" style={{ margin: 0 }}>
              Packing Status
            </span>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '9999px',
                backgroundColor: 'var(--surface-neutral-2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--stroke)',
              }}
            >
              <CheckCircle2 size={13} strokeWidth={2} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)' }}>
              {packedPercent}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px' }}>
              {packedCount}/{totalEssentials} items checked
            </div>
          </div>
        </div>
      </div>

      {/* Saved Collections Inset Group */}
      <div className="cupertino-section" style={{ margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookmarkCheck size={15} strokeWidth={2} color="var(--primary)" />
            <span className="label-micro" style={{ margin: 0 }}>
              Saved Finds ({savedItemsCount})
            </span>
          </div>
          <button
            onClick={() => setActiveTab('collection')}
            className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '2px 6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <span>View All</span>
            <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="travelnest-card" style={{ padding: 0, margin: 0, backgroundColor: '#ffffff' }}>
          {recentSavedItems.length > 0 ? (
            <div>
              {recentSavedItems.map((item, idx) => {
                const badge = getCategoryBadge(item.category || 'place');
                const isLast = idx === recentSavedItems.length - 1;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveCollectionItemId(item.id)}
                    className="cupertino-row"
                    style={{
                      cursor: 'pointer',
                      borderBottom: isLast ? 'none' : '1px solid var(--stroke)',
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          backgroundColor: 'var(--surface-neutral-1)',
                          border: '1px solid var(--stroke)',
                          fontSize: '0.85rem',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {badge.icon}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--primary)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '1px' }}>
                          {item.country || 'General'} · {badge.label}
                        </div>
                      </div>
                    </div>

                    <ChevronRight size={15} strokeWidth={1.8} color="var(--secondary)" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.84rem' }}>
              <div style={{ marginBottom: '4px', fontWeight: 600, color: 'var(--primary)' }}>Your field notes inbox is clear</div>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--secondary)' }}>
                Save restaurant recommendations, secret spots, or links directly on your device.
              </p>
              <button
                onClick={() => openQuickAdd()}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '9999px', padding: '6px 16px', fontSize: '0.78rem' }}
              >
                + Add Field Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Memories Section */}
      <div className="cupertino-section" style={{ margin: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BookOpen size={15} strokeWidth={2} color="var(--primary)" />
            <span className="label-micro" style={{ margin: 0 }}>
              Recent Journal Memories ({journalCount})
            </span>
          </div>
          <button
            onClick={() => setActiveTab('journal')}
            className="btn btn-ghost"
            style={{ fontSize: '0.78rem', padding: '2px 6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}
          >
            <span>View All</span>
            <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>

        <div className="travelnest-card" style={{ padding: 0, margin: 0, backgroundColor: '#ffffff' }}>
          {recentJournals.length > 0 ? (
            <div>
              {recentJournals.map((entry, idx) => {
                const isLast = idx === recentJournals.length - 1;
                const hasPhoto = entry.photos && entry.photos.length > 0;
                return (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setActiveJournalId(entry.id);
                    }}
                      className="cupertino-row"
                      style={{
                        cursor: 'pointer',
                        borderBottom: isLast ? 'none' : '1px solid var(--stroke)',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            backgroundColor: 'var(--surface-neutral-1)',
                            border: '1px solid var(--stroke)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {hasPhoto ? (
                            <img
                              src={entry.photos![0]}
                              alt={entry.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Sparkles size={18} strokeWidth={1.8} color="var(--secondary)" />
                          )}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.88rem',
                              color: 'var(--primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {entry.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '1px' }}>
                            {formatDateDDmmmYY(entry.date)} {entry.locationName ? `· ${entry.locationName}` : ''}
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={15} strokeWidth={1.8} color="var(--secondary)" />
                    </div>
                  );
                })}
            </div>
          ) : (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.84rem' }}>
              <div style={{ marginBottom: '4px', fontWeight: 600, color: 'var(--primary)' }}>No memories recorded yet</div>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: 'var(--secondary)' }}>
                Preserve travel reflections and photos. Standalone memories require no active trip!
              </p>
              <button
                onClick={() => openJournalModal()}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '9999px', padding: '6px 16px', fontSize: '0.78rem' }}
              >
                + Record First Memory
              </button>
            </div>
          )}
        </div>
      </div>

      <FloatingActionButton
        onClick={() => openQuickAdd(featuredTrip?.id)}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Quick Capture"
      />
    </div>
  );
};
