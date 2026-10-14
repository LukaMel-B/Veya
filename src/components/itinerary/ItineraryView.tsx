import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, ItineraryEvent, EventCategory } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import {
  Clock,
  MapPin,
  AlertTriangle,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Utensils,
  Camera,
  Car,
  Home,
  Compass,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface ItineraryViewProps {
  trip: Trip;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ trip }) => {
  const { showToast, showConfirm, setTripSubTab, openJournalModal } = useApp();
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);

  // Form states
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [eventDate, setEventDate] = useState<string>(trip.startDate);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [category, setCategory] = useState<EventCategory>('sightseeing');
  const [notes, setNotes] = useState<string>('');

  const events = useLiveQuery(
    () => db.itineraryEvents.where('tripId').equals(trip.id).sortBy('orderIndex'),
    [trip.id]
  );

  const places = useLiveQuery(() => db.places.toArray(), []);

  // Calculate day count
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysList = Array.from({ length: diffDays }, (_, i) => i + 1);

  // Group events by dayNumber
  const eventsByDay: Record<number, ItineraryEvent[]> = {};
  daysList.forEach((d) => {
    eventsByDay[d] = [];
  });

  (events || []).forEach((ev) => {
    if (!eventsByDay[ev.dayNumber]) {
      eventsByDay[ev.dayNumber] = [];
    }
    eventsByDay[ev.dayNumber].push(ev);
  });

  // Sort events in each day
  Object.keys(eventsByDay).forEach((key) => {
    const day = Number(key);
    eventsByDay[day].sort((a, b) => {
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });
  });

  // Conflict advisory
  const hasConflict = (currentEvent: ItineraryEvent, dayEvents: ItineraryEvent[]) => {
    if (!currentEvent.startTime || !currentEvent.endTime) return false;
    return dayEvents.some((other) => {
      if (other.id === currentEvent.id) return false;
      if (!other.startTime || !other.endTime) return false;
      return currentEvent.startTime < other.endTime && currentEvent.endTime > other.startTime;
    });
  };

  const handleOpenCreateModal = (day?: number) => {
    const targetDay = day || (selectedDay === 'all' ? 1 : selectedDay);
    setEditingEvent(null);
    setDayNumber(targetDay);
    
    const d = new Date(trip.startDate);
    d.setDate(d.getDate() + (targetDay - 1));
    setEventDate(d.toISOString().split('T')[0]);
    
    setStartTime('10:00');
    setEndTime('12:00');
    setTitle('');
    setLocation('');
    setCategory('sightseeing');
    setNotes('');
    setIsEventModalOpen(true);
  };

  const handleOpenEditModal = (ev: ItineraryEvent) => {
    setEditingEvent(ev);
    setDayNumber(ev.dayNumber);
    setEventDate(ev.date);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setTitle(ev.title);
    setLocation(ev.location || '');
    setCategory(ev.category);
    setNotes(ev.notes || '');
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter an activity title.', 'error');
      return;
    }

    try {
      if (editingEvent) {
        await db.itineraryEvents.update(editingEvent.id, {
          dayNumber,
          date: eventDate,
          startTime,
          endTime,
          title: title.trim(),
          location: location.trim() || undefined,
          category,
          notes: notes.trim() || undefined,
        });
        showToast('Activity updated!', 'success');
      } else {
        const dayEvents = eventsByDay[dayNumber] || [];
        const nextOrder = dayEvents.length;

        const newEvent: ItineraryEvent = {
          id: 'ev-' + Date.now(),
          tripId: trip.id,
          dayNumber,
          date: eventDate,
          startTime,
          endTime,
          title: title.trim(),
          location: location.trim() || undefined,
          category,
          orderIndex: nextOrder,
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        await db.itineraryEvents.add(newEvent);
        showToast('Activity added to Day ' + dayNumber, 'success');
      }

      setIsEventModalOpen(false);
    } catch (err: any) {
      showToast('Error saving activity: ' + err.message, 'error');
    }
  };

  const handleDeleteEvent = async (id: string, eventTitle?: string) => {
    const confirmed = await showConfirm({
      title: eventTitle ? `Delete "${eventTitle}"?` : 'Delete this activity?',
      kicker: 'IRREVERSIBLE',
      message: 'This activity will be permanently removed from this day\'s itinerary schedule.',
      confirmText: 'Delete Activity',
      cancelText: 'Keep Activity',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.itineraryEvents.delete(id);
        showToast('Activity removed.', 'info');
      } catch (err: any) {
        showToast('Error deleting activity: ' + err.message, 'error');
      }
    }
  };

  const handleMoveOrder = async (ev: ItineraryEvent, direction: 'up' | 'down') => {
    const dayEvents = eventsByDay[ev.dayNumber] || [];
    const currentIndex = dayEvents.findIndex((x) => x.id === ev.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= dayEvents.length) return;

    const swapTarget = dayEvents[targetIndex];

    const tempTime = ev.startTime;
    const tempEnd = ev.endTime;

    await db.transaction('rw', db.itineraryEvents, async () => {
      await db.itineraryEvents.update(ev.id, {
        startTime: swapTarget.startTime,
        endTime: swapTarget.endTime,
        orderIndex: targetIndex,
      });
      await db.itineraryEvents.update(swapTarget.id, {
        startTime: tempTime,
        endTime: tempEnd,
        orderIndex: currentIndex,
      });
    });
  };

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case 'food':
        return <Utensils size={12} strokeWidth={2} />;
      case 'travel':
        return <Car size={12} strokeWidth={2} />;
      case 'lodging':
        return <Home size={12} strokeWidth={2} />;
      case 'sightseeing':
        return <Camera size={12} strokeWidth={2} />;
      default:
        return <Compass size={12} strokeWidth={2} />;
    }
  };

  const displayDays = selectedDay === 'all' ? daysList : [selectedDay];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--primary)', margin: 0 }}>
          Itinerary Timeline
        </h3>
      </div>

      {/* Segmented Day Selector */}
      <div
        className="cupertino-segmented"
        style={{
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '3px',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setSelectedDay('all')}
          className={`cupertino-segment-item ${selectedDay === 'all' ? 'active' : ''}`}
        >
          <span>All Days</span>
          <span className="chip-count-bubble">{events?.length || 0}</span>
        </button>
        {daysList.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`cupertino-segment-item ${selectedDay === d ? 'active' : ''}`}
          >
            <span>Day {d}</span>
            <span className="chip-count-bubble">{eventsByDay[d]?.length || 0}</span>
          </button>
        ))}
      </div>

      {/* Timeline Days List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {displayDays.map((dayNum) => {
          const dayDateObj = new Date(trip.startDate);
          dayDateObj.setDate(dayDateObj.getDate() + (dayNum - 1));
          const formattedDate = formatDateDDmmmYY(dayDateObj);

          const dayEvents = eventsByDay[dayNum] || [];

          return (
            <div key={dayNum} className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#ffffff' }}>
              {/* Day Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--stroke)',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '2px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Day {dayNum}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{formattedDate}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                    ({dayEvents.length})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => openJournalModal({ tripId: trip.id, date: dayDateObj.toISOString().split('T')[0] })}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.76rem', color: 'var(--secondary)' }}
                    title="Record memory for this day"
                  >
                    <BookOpen size={12} strokeWidth={2} />
                    <span>Journal</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateModal(dayNum)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.78rem', color: 'var(--primary)' }}
                  >
                    <Plus size={12} strokeWidth={2.2} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Event Cards */}
              {dayEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dayEvents.map((ev, index) => {
                    const conflict = hasConflict(ev, dayEvents);

                    return (
                      <div
                        key={ev.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '12px 14px',
                          backgroundColor: conflict ? '#fff8f8' : 'var(--surface-neutral-1)',
                          border: conflict ? '1px solid var(--error)' : '1px solid var(--stroke)',
                          borderRadius: '14px',
                          transition: 'all 130ms ease',
                        }}
                      >
                        {/* Time & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                color: 'var(--primary)',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--stroke)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              <Clock size={11} strokeWidth={2} />
                              {ev.startTime} – {ev.endTime}
                            </span>

                            <span
                              style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--stroke)',
                                color: 'var(--secondary)',
                                borderRadius: '9999px',
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                textTransform: 'capitalize',
                              }}
                            >
                              {getCategoryIcon(ev.category)}
                              <span>{ev.category}</span>
                            </span>

                            {conflict && (
                              <span
                                style={{
                                  backgroundColor: '#ffdad6',
                                  color: 'var(--error)',
                                  borderRadius: '9999px',
                                  padding: '2px 8px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <AlertTriangle size={11} strokeWidth={2} /> Overlap
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <button
                              onClick={() => handleMoveOrder(ev, 'up')}
                              disabled={index === 0}
                              className="btn btn-ghost"
                              style={{ padding: '2px 4px', color: 'var(--secondary)', opacity: index === 0 ? 0.3 : 1 }}
                              aria-label="Up"
                            >
                              <ArrowUp size={13} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(ev, 'down')}
                              disabled={index === dayEvents.length - 1}
                              className="btn btn-ghost"
                              style={{ padding: '2px 4px', color: 'var(--secondary)', opacity: index === dayEvents.length - 1 ? 0.3 : 1 }}
                              aria-label="Down"
                            >
                              <ArrowDown size={13} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => openJournalModal({
                                tripId: trip.id,
                                itineraryEventId: ev.id,
                                date: ev.date,
                                time: ev.startTime,
                                title: ev.title,
                                locationName: ev.location,
                                placeId: ev.placeId,
                              })}
                              className="btn btn-ghost"
                              style={{ padding: '2px 4px', color: 'var(--primary)' }}
                              title="Record memory for this activity"
                              aria-label="Journal"
                            >
                              <BookOpen size={12} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(ev)}
                              className="btn btn-ghost"
                              style={{ padding: '2px 4px', color: 'var(--primary)' }}
                              aria-label="Edit"
                            >
                              <Edit2 size={12} strokeWidth={2} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id, ev.title)}
                              className="btn btn-ghost"
                              style={{ padding: '2px 4px', color: 'var(--secondary)' }}
                              aria-label="Delete"
                            >
                              <Trash2 size={12} strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--primary)', marginTop: '2px' }}>
                          {ev.title}
                        </div>

                        {/* Location */}
                        {ev.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--secondary)' }}>
                            <MapPin size={12} strokeWidth={1.8} />
                            <span>{ev.location}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {ev.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', lineHeight: 1.4, marginTop: '2px' }}>
                            {ev.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    color: 'var(--secondary)',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '14px',
                    border: '1px dashed var(--stroke)',
                  }}
                >
                  <p style={{ fontSize: '0.82rem', marginBottom: '10px' }}>No activities scheduled for Day {dayNum}.</p>
                  <button
                    onClick={() => handleOpenCreateModal(dayNum)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={12} strokeWidth={2.2} />
                    <span>Add First Activity</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Activity Sheet Modal */}
      {isEventModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEventModalOpen(false)}>
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
                onClick={() => setIsEventModalOpen(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
              >
                Cancel
              </button>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {editingEvent ? 'Edit Activity' : `Add to Day ${dayNumber}`}
              </h3>
              <button
                type="button"
                onClick={handleSaveEvent}
                className="btn btn-ghost"
                style={{ fontSize: '0.88rem', fontWeight: 700, padding: '0 4px', color: 'var(--primary)' }}
              >
                Done
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Day</label>
                  <select
                    value={dayNumber}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setDayNumber(d);
                      const newD = new Date(trip.startDate);
                      newD.setDate(newD.getDate() + (d - 1));
                      setEventDate(newD.toISOString().split('T')[0]);
                    }}
                    className="select"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-micro">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="select"
                  >
                    <option value="sightseeing">📸 Sightseeing</option>
                    <option value="activity">🎟️ Activity / Tour</option>
                    <option value="food">🍽️ Food & Dining</option>
                    <option value="travel">🚗 Transit</option>
                    <option value="lodging">🏨 Hotel / Stay</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="label-micro">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label-micro">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-micro">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Tsukiji Market Morning Food Tour"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label-micro">Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 4 Chome Tsukiji, Tokyo"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input"
                  list="places-datalist"
                />
                <datalist id="places-datalist">
                  {places?.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="label-micro">Notes (Optional)</label>
                <textarea
                  placeholder="Details, reservation notes, confirmation numbers..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea"
                  rows={2}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                <span>{editingEvent ? 'Save Changes' : `Add to Day ${dayNumber}`}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        onClick={() => handleOpenCreateModal()}
        icon={<Plus size={24} strokeWidth={2.4} />}
        label="Add Activity"
      />
    </div>
  );
};
