import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, Booking, BookingType, BookingStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY, formatDateRangeDDmmmYY } from '../../utils/dateUtils';
import {
  Plane,
  Building,
  Train,
  Car,
  Ticket,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  ChevronLeft
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface BookingsViewProps {
  trip: Trip;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ trip }) => {
  const { showToast, showConfirm, setTripSubTab } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<BookingType>('hotel');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<BookingStatus>('confirmed');
  const [startDate, setStartDate] = useState(trip.startDate);
  const [notes, setNotes] = useState('');

  const bookings = useLiveQuery(
    () => db.bookings.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  const expenses = useLiveQuery(
    () => db.expenses.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  const getBookingIcon = (bType: BookingType) => {
    switch (bType) {
      case 'flight':
        return <Plane size={14} strokeWidth={2} />;
      case 'hotel':
        return <Building size={14} strokeWidth={2} />;
      case 'train':
        return <Train size={14} strokeWidth={2} />;
      case 'car_rental':
        return <Car size={14} strokeWidth={2} />;
      default:
        return <Ticket size={14} strokeWidth={2} />;
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCost = parseFloat(cost) || 0;
    if (!title.trim() || !refNumber.trim()) {
      showToast('Please enter title and reference number.', 'error');
      return;
    }

    try {
      const newBooking: Booking = {
        id: 'bk-' + Date.now(),
        tripId: trip.id,
        type,
        title: title.trim(),
        provider: provider.trim() || 'Direct Booking',
        refNumber: refNumber.trim(),
        cost: parsedCost,
        currency: 'INR',
        status,
        startDate: startDate || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await db.bookings.add(newBooking);
      showToast(`Booking "${newBooking.title}" added!`, 'success');
      setIsAddModalOpen(false);
      setTitle('');
      setProvider('');
      setRefNumber('');
      setCost('');
      setNotes('');
    } catch (err: any) {
      showToast('Error saving booking: ' + err.message, 'error');
    }
  };

  const handleDeleteBooking = async (id: string, bookingTitle?: string) => {
    const confirmed = await showConfirm({
      title: bookingTitle ? `Delete "${bookingTitle}"?` : 'Delete this booking?',
      kicker: 'IRREVERSIBLE',
      message: 'This booking reservation and its reference details will be permanently removed from this trip.',
      confirmText: 'Delete Booking',
      cancelText: 'Keep Booking',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.bookings.delete(id);
        showToast('Booking removed.', 'info');
      } catch (err: any) {
        showToast('Error deleting booking: ' + err.message, 'error');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>
          Trip Bookings
        </h3>
      </div>

      {/* Bookings List */}
      {bookings && bookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookings.map((booking) => {
            const payments = (expenses || []).filter((e) => e.bookingId === booking.id);
            const paidAmount = payments.reduce((sum, e) => sum + e.amount, 0);
            const outstanding = Math.max(0, booking.cost - paidAmount);

            return (
              <div
                key={booking.id}
                className="travelnest-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '16px',
                  margin: 0,
                  backgroundColor: '#ffffff',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--surface-neutral-1)',
                          border: '1px solid var(--stroke)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getBookingIcon(booking.type)}
                      </div>
                      <span
                        style={{
                          backgroundColor: 'var(--surface-neutral-1)',
                          border: '1px solid var(--stroke)',
                          color: 'var(--secondary)',
                          fontSize: '10px',
                          fontWeight: 600,
                          borderRadius: '9999px',
                          padding: '2px 8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {booking.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          backgroundColor: booking.status === 'confirmed' ? 'var(--primary)' : 'var(--surface-neutral-1)',
                          color: booking.status === 'confirmed' ? '#ffffff' : 'var(--secondary)',
                          border: '1px solid var(--stroke)',
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {booking.status}
                      </span>
                      <button
                        onClick={() => handleDeleteBooking(booking.id, booking.title)}
                        className="btn btn-ghost"
                        style={{ padding: '2px', color: 'var(--secondary)' }}
                        aria-label={`Delete ${booking.title}`}
                      >
                        <Trash2 size={13} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px', letterSpacing: '-0.01em' }}>
                    {booking.title}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                    Provider: <strong style={{ color: 'var(--primary)' }}>{booking.provider}</strong>
                  </div>

                  {/* Ref Code Box */}
                  <div
                    style={{
                      margin: '10px 0',
                      padding: '8px 12px',
                      backgroundColor: 'var(--surface-neutral-1)',
                      borderRadius: '10px',
                      border: '1px solid var(--stroke)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span className="label-micro" style={{ margin: 0 }}>Reference Code:</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: 'var(--primary)',
                      }}
                    >
                      {booking.refNumber}
                    </span>
                  </div>

                  {booking.startDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--secondary)', marginTop: '2px' }}>
                      <Calendar size={12} strokeWidth={1.8} />
                      <span>Date: {booking.endDate ? formatDateRangeDDmmmYY(booking.startDate, booking.endDate) : formatDateDDmmmYY(booking.startDate)}</span>
                    </div>
                  )}

                  {booking.notes && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--secondary)', margin: '6px 0 0', lineHeight: 1.4 }}>
                      {booking.notes}
                    </p>
                  )}
                </div>

                {/* Ledger Status */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--stroke)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>Cost:</span>
                    <span style={{ fontWeight: 700, marginLeft: '6px', fontSize: '0.92rem', color: 'var(--primary)' }}>
                      ₹{booking.cost.toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <CreditCard size={12} strokeWidth={2} color="var(--primary)" />
                    {outstanding <= 0 ? (
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Settled in Full</span>
                    ) : (
                      <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                        ₹{outstanding.toFixed(2)} Due
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="travelnest-card" style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--secondary)', fontSize: '0.84rem', backgroundColor: 'var(--surface-neutral-1)' }}>
          No bookings recorded yet. Tap <strong>+</strong> to save flights, hotel vouchers, or train confirmations.
        </div>
      )}

      {/* Add Booking Sheet Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
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
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>Add Booking</h3>
              <button
                type="button"
                onClick={handleCreateBooking}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
              >
                Save
              </button>
            </div>

            <form onSubmit={handleCreateBooking} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as BookingType)}
                    className="select"
                  >
                    <option value="hotel">🏨 Hotel</option>
                    <option value="flight">✈️ Flight</option>
                    <option value="train">🚆 Train</option>
                    <option value="activity">🎟️ Activity</option>
                    <option value="car_rental">🚗 Car Rental</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
                <div>
                  <label className="label-micro">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BookingStatus)}
                    className="select"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-micro">Booking Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Shinjuku Granbell Suite"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. Booking.com, ANA"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label-micro">Confirmation / PNR #</label>
                  <input
                    type="text"
                    placeholder="e.g. BK-98214"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Total Cost (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label-micro">Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label-micro">Notes (Optional)</label>
                <textarea
                  placeholder="Baggage allowances, check-in instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                <span>Save Booking</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        onClick={() => setIsAddModalOpen(true)}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Add Booking"
      />
    </div>
  );
};
