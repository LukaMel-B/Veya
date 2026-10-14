import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, TripStatus } from '../../types';
import {
  Plus,
  Calendar,
  MapPin,
  Trash2,
  Pencil,
  Users,
  Compass,
  ChevronRight,
  Search,
  Upload,
  ImageIcon,
  X,
  Globe,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';
import { EditTripModal } from './EditTripModal';
import { getCountryFlag, getCountryCover } from '../../utils/countryUtils';
import { formatDateRangeDDmmmYY } from '../../utils/dateUtils';

export const TripsView: React.FC = () => {
  const { setActiveTripId, showToast, showConfirm, searchQuery, setSearchQuery } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for new trip
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('Japan');
  const [isCreatingNewCountry, setIsCreatingNewCountry] = useState(false);
  const [newCountryInput, setNewCountryInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<TripStatus>('planning');
  const [coverImage, setCoverImage] = useState('');
  const [plannedBudget, setPlannedBudget] = useState('50000');
  const [travelers, setTravelers] = useState('Alex (Me), Mia');
  const [notes, setNotes] = useState('');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const trips = useLiveQuery(() => db.trips.toArray(), []);
  const dbCountries = useLiveQuery(() => db.countries.toArray(), []);

  // Compute available countries list
  const availableCountries = useMemo(
    () =>
      Array.from(
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
          ...(trips || []).map((t) => t.country).filter(Boolean) as string[],
        ])
      ).sort(),
    [dbCountries, trips]
  );

  // Filter trips
  const filteredTrips = useMemo(
    () =>
      trips?.filter((trip) => {
        const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
        const matchesSearch =
          !searchQuery ||
          trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (trip.country && trip.country.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [trips, statusFilter, searchQuery]
  );

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

  const handleCreateTrip = async (e: React.FormEvent) => {
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

      // Ensure country dossier is persisted in database
      await db.saveCountry(country.trim());

      const chosenCover = coverImage.trim() || getCountryCover(country.trim());

      const newTrip: Trip = {
        id: 'trip-' + Date.now(),
        name: title.trim(),
        destination: country.trim(),
        country: country.trim(),
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status,
        coverImage: chosenCover,
        defaultCurrency: 'INR',
        plannedBudget: parseFloat(plannedBudget) || 0,
        travelers: travelerList.length > 0 ? travelerList : ['Me'],
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.trips.add(newTrip);
      showToast(`Trip "${newTrip.name}" created!`, 'success');
      setIsCreateModalOpen(false);
      setTitle('');
      setCoverImage('');
      setActiveTripId(newTrip.id);
    } catch (err: any) {
      showToast('Error creating trip: ' + err.message, 'error');
    }
  };

  const handleDeleteTrip = async (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    const confirmed = await showConfirm({
      title: `Delete Trip "${trip.name}"?`,
      kicker: 'IRREVERSIBLE',
      message: 'Its itinerary activities, bookings, and expenses will be removed. All saved places, collection items, and memory journals will be safely preserved and detached.',
      warning: 'This action cannot be undone. Saved spots will be moved to the destination country collection.',
      confirmText: 'Delete Trip',
      cancelText: 'Keep Trip',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.deleteTripCascade(trip.id);
        showToast(`Trip "${trip.name}" deleted. Saved items & memories were preserved.`, 'info');
      } catch (err: any) {
        showToast('Error deleting trip: ' + err.message, 'error');
      }
    }
  };

  const statuses: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: trips?.length || 0 },
    { id: 'upcoming', label: 'Upcoming', count: trips?.filter((t) => t.status === 'upcoming').length || 0 },
    { id: 'planning', label: 'Planning', count: trips?.filter((t) => t.status === 'planning').length || 0 },
    { id: 'ongoing', label: 'Ongoing', count: trips?.filter((t) => t.status === 'ongoing').length || 0 },
    { id: 'completed', label: 'Completed', count: trips?.filter((t) => t.status === 'completed').length || 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--primary)', margin: 0 }}>
            My Trips
          </h2>
          <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
            {trips?.length || 0} journeys planned
          </p>
        </div>

        {(trips?.length || 0) > 0 && (
          <button
            id="btn-create-trip"
            data-tour-target="btn-create-trip"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{
              borderRadius: '9999px',
              fontSize: '0.8rem',
              padding: '7px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Plus size={14} strokeWidth={2.4} />
            <span>New Trip</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          strokeWidth={2}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--secondary)',
          }}
        />
        <input
          type="text"
          placeholder="Search country or trip titles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input"
          style={{ height: '40px', paddingLeft: '38px', fontSize: '0.84rem' }}
        />
      </div>

      {/* Segmented Filter Control */}
      <div className="cupertino-segmented" style={{ overflowX: 'auto' }}>
        {statuses.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`cupertino-segment-item ${statusFilter === s.id ? 'active' : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{s.label}</span>
            <span className="chip-count-bubble">{s.count}</span>
          </button>
        ))}
      </div>

      {/* Trips Cards Stack */}
      {filteredTrips && filteredTrips.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredTrips.map((trip) => {
            const displayCover = trip.coverImage || getCountryCover(trip.country || trip.destination);

            return (
              <div
                key={trip.id}
                onClick={() => setActiveTripId(trip.id)}
                className="travelnest-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  margin: 0,
                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                }}
              >
                {/* Hero Banner with Vignette */}
                <div
                  style={{
                    height: '140px',
                    position: 'relative',
                    background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%), url(${displayCover}) center/cover no-repeat`,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        backgroundColor: '#000000',
                        color: '#FFFFFF',
                        borderRadius: '9999px',
                        padding: '3px 10px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <span>{trip.status}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTrip(trip);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                        }}
                        title="Edit Trip"
                        aria-label="Edit Trip"
                      >
                        <Pencil size={12} strokeWidth={2} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteTrip(e, trip)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(0,0,0,0.4)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                        }}
                        title="Delete Trip"
                        aria-label="Delete Trip"
                      >
                        <Trash2 size={12} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', marginBottom: '4px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                      {trip.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: '#FFFFFF', opacity: 0.95 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} strokeWidth={2} />
                        {trip.country || trip.destination}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} strokeWidth={2} />
                        {formatDateRangeDDmmmYY(trip.startDate, trip.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trip Metadata Footer */}
                <div
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderTop: '1px solid var(--stroke)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--secondary)' }}>
                      <span>Budget:</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        ₹{trip.plannedBudget.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--secondary)' }}>
                      <Users size={12} strokeWidth={2} />
                      <span>{trip.travelers?.length || 1} {trip.travelers?.length === 1 ? 'traveler' : 'travelers'}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                    }}
                  >
                    <span>View Plan</span>
                    <ChevronRight size={14} strokeWidth={2.4} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="travelnest-card" style={{ padding: '40px 16px', textAlign: 'center', backgroundColor: 'var(--surface-neutral-1)', margin: 0, borderRadius: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--stroke)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Compass size={24} color="var(--primary)" strokeWidth={1.8} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--primary)' }}>
            {trips?.length === 0 ? 'No Trips Planned Yet' : 'No Matching Trips'}
          </h4>
          <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '0 auto 16px', maxWidth: '300px', lineHeight: 1.45 }}>
            {trips?.length === 0
              ? 'Start planning your next adventure with day-by-day itineraries, flight vouchers, and packing checklists stored offline.'
              : 'No journeys match the active status or search filter.'}
          </p>

          {searchQuery || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="btn btn-secondary"
              style={{ margin: '0 auto', fontSize: '0.82rem', borderRadius: '9999px', padding: '0 18px' }}
            >
              <span>Clear Filter</span>
            </button>
          ) : (
            <button
              id={(trips?.length || 0) === 0 ? 'btn-create-trip' : undefined}
              data-tour-target={(trips?.length || 0) === 0 ? 'btn-create-trip' : undefined}
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
              style={{
                margin: '0 auto',
                fontSize: '0.84rem',
                borderRadius: '9999px',
                padding: '8px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} strokeWidth={2.2} />
              <span>Create First Trip</span>
            </button>
          )}
        </div>
      )}

      {/* Modal for Create Trip */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
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
                onClick={() => setIsCreateModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>New Trip</h3>
              <button
                type="button"
                onClick={handleCreateTrip}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
              >
                Create
              </button>
            </div>

            <form onSubmit={handleCreateTrip} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  <option value="upcoming">Upcoming (Bookings confirmed)</option>
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
                  placeholder="Notes, route considerations, or packing focus..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
                <span>Create Trip</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        onClick={() => setIsCreateModalOpen(true)}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="New Trip"
      />

      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          isOpen={Boolean(editingTrip)}
          onClose={() => setEditingTrip(null)}
        />
      )}
    </div>
  );
};
