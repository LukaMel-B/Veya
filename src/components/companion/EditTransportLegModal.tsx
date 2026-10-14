import React, { useState } from 'react';
import { db } from '../../db/database';
import type { TransportLeg, TransportMode, Booking } from '../../types';
import { X, Plane, Train, Bus, Navigation, Car, Bike, Footprints, Ship } from 'lucide-react';

interface EditTransportLegModalProps {
  tripId: string;
  initialLeg?: Partial<TransportLeg> | null;
  dayNumber?: number;
  date?: string;
  existingBookings?: Booking[];
  onClose: () => void;
  onSave?: (leg: TransportLeg) => void;
}

const TRANSPORT_MODES: { mode: TransportMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'flight', label: 'Flight', icon: <Plane size={15} /> },
  { mode: 'train', label: 'Train', icon: <Train size={15} /> },
  { mode: 'subway', label: 'Metro', icon: <Train size={15} /> },
  { mode: 'bus', label: 'Bus', icon: <Bus size={15} /> },
  { mode: 'ferry', label: 'Ferry', icon: <Ship size={15} /> },
  { mode: 'car', label: 'Car', icon: <Car size={15} /> },
  { mode: 'taxi', label: 'Taxi', icon: <Car size={15} /> },
  { mode: 'walk', label: 'Walk', icon: <Footprints size={15} /> },
  { mode: 'bicycle', label: 'Bike', icon: <Bike size={15} /> },
  { mode: 'other', label: 'Other', icon: <Navigation size={15} /> },
];

export const EditTransportLegModal: React.FC<EditTransportLegModalProps> = ({
  tripId,
  initialLeg,
  dayNumber = 1,
  date,
  existingBookings = [],
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<TransportMode>(initialLeg?.mode || 'train');
  const [carrier, setCarrier] = useState(initialLeg?.carrier || '');
  const [lineOrFlightNumber, setLineOrFlightNumber] = useState(initialLeg?.lineOrFlightNumber || '');
  const [departureLocation, setDepartureLocation] = useState(initialLeg?.departureLocation || '');
  const [departureTime, setDepartureTime] = useState(initialLeg?.departureTime || '09:00');
  const [arrivalLocation, setArrivalLocation] = useState(initialLeg?.arrivalLocation || '');
  const [arrivalTime, setArrivalTime] = useState(initialLeg?.arrivalTime || '10:30');
  const [seatOrCabin, setSeatOrCabin] = useState(initialLeg?.seatOrCabin || '');
  const [platformOrGate, setPlatformOrGate] = useState(initialLeg?.platformOrGate || '');
  const [bookingRef, setBookingRef] = useState(initialLeg?.bookingRef || '');
  const [bookingId, setBookingId] = useState(initialLeg?.bookingId || '');
  const [cost, setCost] = useState(initialLeg?.cost ? String(initialLeg.cost) : '');
  const [currency, setCurrency] = useState(initialLeg?.currency || 'INR');
  const [notes, setNotes] = useState(initialLeg?.notes || '');
  const [selectedDay, setSelectedDay] = useState(initialLeg?.dayNumber || dayNumber);
  const [selectedDate, setSelectedDate] = useState(initialLeg?.date || date || new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureLocation.trim() || !arrivalLocation.trim()) return;

    const legData: TransportLeg = {
      id: initialLeg?.id || `leg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tripId,
      dayNumber: selectedDay,
      date: selectedDate,
      mode,
      carrier: carrier.trim() || undefined,
      lineOrFlightNumber: lineOrFlightNumber.trim() || undefined,
      departureLocation: departureLocation.trim(),
      departureTime: departureTime.trim() || undefined,
      arrivalLocation: arrivalLocation.trim(),
      arrivalTime: arrivalTime.trim() || undefined,
      seatOrCabin: seatOrCabin.trim() || undefined,
      platformOrGate: platformOrGate.trim() || undefined,
      bookingRef: bookingRef.trim() || undefined,
      bookingId: bookingId || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      currency,
      notes: notes.trim() || undefined,
      orderIndex: initialLeg?.orderIndex ?? 0,
      isEdited: true,
      createdAt: initialLeg?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.transportLegs.put(legData);
    if (onSave) onSave(legData);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        className="travelnest-card animate-slide-up"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: '20px',
          margin: 0,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <span className="label-micro">MULTI-LEG TRANSPORT PLAN</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              {initialLeg?.id ? 'Edit Transport Leg' : 'Add Journey Leg'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: '32px', height: '32px' }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Mode Selector */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
              TRANSPORT MODE
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {TRANSPORT_MODES.map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setMode(item.mode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: mode === item.mode ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                    backgroundColor: mode === item.mode ? '#111111' : '#F7F7F7',
                    color: mode === item.mode ? '#FFFFFF' : '#333333',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Departure & Arrival */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                FROM (STATION / AIRPORT) *
              </label>
              <input
                type="text"
                required
                value={departureLocation}
                onChange={(e) => setDepartureLocation(e.target.value)}
                placeholder="e.g. Haneda Airport (HND)"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                DEPARTURE TIME
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                TO (STATION / HOTEL) *
              </label>
              <input
                type="text"
                required
                value={arrivalLocation}
                onChange={(e) => setArrivalLocation(e.target.value)}
                placeholder="e.g. Shinjuku Station"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                ARRIVAL TIME
              </label>
              <input
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Carrier & Line/Flight */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                CARRIER / OPERATOR
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. JR East, All Nippon Airways"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                LINE / FLIGHT / TRAIN #
              </label>
              <input
                type="text"
                value={lineOrFlightNumber}
                onChange={(e) => setLineOrFlightNumber(e.target.value)}
                placeholder="e.g. Haruka 19, NH828"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Platform & Seat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                PLATFORM / TRACK / GATE
              </label>
              <input
                type="text"
                value={platformOrGate}
                onChange={(e) => setPlatformOrGate(e.target.value)}
                placeholder="e.g. Track 4, Gate 18"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                SEAT / BERTH / CAR
              </label>
              <input
                type="text"
                value={seatOrCabin}
                onChange={(e) => setSeatOrCabin(e.target.value)}
                placeholder="e.g. Car 7, Seat 14A"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Booking Link / Reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                BOOKING REFERENCE / PNR
              </label>
              <input
                type="text"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
                placeholder="e.g. NH-78291"
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                LINK TO EXISTING BOOKING
              </label>
              <select
                value={bookingId}
                onChange={(e) => {
                  setBookingId(e.target.value);
                  const bk = existingBookings.find((b) => b.id === e.target.value);
                  if (bk) {
                    if (bk.refNumber && !bookingRef) setBookingRef(bk.refNumber);
                    if (bk.provider && !carrier) setCarrier(bk.provider);
                  }
                }}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value="">None / Manual</option>
                {existingBookings.map((bk) => (
                  <option key={bk.id} value={bk.id}>
                    {bk.title} ({bk.refNumber || bk.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
              TRANSIT NOTES / TRANSFER DIRECTIONS
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tap Suica card at gate. Transfer to JR Yamanote line at Hamamatsucho."
              className="input-field"
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save Transport Leg
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
