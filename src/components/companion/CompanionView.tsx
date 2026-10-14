import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../../context/AppContext';
import type {
  Trip,
  ItineraryEvent,
  Booking,
  Expense,
  Place,
  TransportLeg,
  TripMealPlan,
  Recipe,
} from '../../types';
import { formatDateRangeDDmmmYY } from '../../utils/dateUtils';
import { haversineDistanceKm, formatDistance, calculateBearing, formatCoordinates } from '../../utils/geoUtils';
import { calculateRecipeCost } from '../../utils/recipeUtils';

import { EditTransportLegModal } from './EditTransportLegModal';
import { GtfsImportModal } from './GtfsImportModal';
import { MealPlanModal } from './MealPlanModal';
import { RecipeLibraryModal } from '../recipes/RecipeLibraryModal';
import { RecipeDetailModal } from '../recipes/RecipeDetailModal';
import { PlaceDirectionsModal } from '../map/PlaceDirectionsModal';

import {
  Calendar,
  Clock,
  MapPin,
  Plane,
  Train,
  Bus,
  Car,
  Footprints,
  Ship,
  Navigation,
  Utensils,
  Plus,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Coffee,
  Sun,
  Moon,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';

interface CompanionViewProps {
  tripId: string;
}

export const CompanionView: React.FC<CompanionViewProps> = ({ tripId }) => {
  const { openQuickAdd, openJournalModal } = useApp();

  const trip = useLiveQuery(() => db.trips.get(tripId), [tripId]);
  const events = useLiveQuery(() => db.itineraryEvents.where('tripId').equals(tripId).toArray(), [tripId]);
  const bookings = useLiveQuery(() => db.bookings.where('tripId').equals(tripId).toArray(), [tripId]);
  const expenses = useLiveQuery(() => db.expenses.where('tripId').equals(tripId).toArray(), [tripId]);
  const places = useLiveQuery(() => db.places.where('tripId').equals(tripId).toArray(), [tripId]);
  const transportLegs = useLiveQuery(() => db.transportLegs.where('tripId').equals(tripId).toArray(), [tripId]);
  const mealPlans = useLiveQuery(() => db.tripMealPlans.where('tripId').equals(tripId).toArray(), [tripId]);
  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const basePrices = useLiveQuery(() => db.baseIngredientPrices.toArray(), []);
  const tripOverrides = useLiveQuery(
    () => db.tripIngredientOverrides.where('tripId').equals(tripId).toArray(),
    [tripId]
  );

  // Determine current active day based on today's date vs trip startDate
  const todayStr = new Date().toISOString().split('T')[0];
  const tripStartDate = trip?.startDate || todayStr;
  const tripEndDate = trip?.endDate || todayStr;

  const getDayNumberFromDate = (dStr: string) => {
    const diff = Math.floor(
      (new Date(dStr).getTime() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, diff + 1);
  };

  const totalTripDays = Math.max(
    1,
    Math.floor(
      (new Date(tripEndDate).getTime() - new Date(tripStartDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  const initialDay = Math.min(
    totalTripDays,
    Math.max(1, getDayNumberFromDate(todayStr))
  );

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  // Compute selected day date string
  const selectedDayDate = React.useMemo(() => {
    const d = new Date(tripStartDate);
    d.setDate(d.getDate() + (selectedDay - 1));
    return d.toISOString().split('T')[0];
  }, [tripStartDate, selectedDay]);

  // Sub-modal states
  const [isEditLegOpen, setIsEditLegOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState<Partial<TransportLeg> | null>(null);
  const [isGtfsOpen, setIsGtfsOpen] = useState(false);
  const [isMealPlanOpen, setIsMealPlanOpen] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<Partial<TripMealPlan> | null>(null);
  const [isRecipeLibOpen, setIsRecipeLibOpen] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [directionsPlace, setDirectionsPlace] = useState<Place | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!trip) return null;

  // Filter day-specific items
  const dayEvents = (events || [])
    .filter((e) => e.dayNumber === selectedDay || e.date === selectedDayDate)
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const dayLegs = (transportLegs || [])
    .filter((l) => l.dayNumber === selectedDay || l.date === selectedDayDate)
    .sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));

  const dayBookings = (bookings || []).filter((b) => {
    if (b.startDate && b.endDate) {
      return selectedDayDate >= b.startDate && selectedDayDate <= b.endDate;
    }
    return true;
  });

  const dayExpenses = (expenses || []).filter((e) => e.date === selectedDayDate);
  const totalDaySpend = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const dayMealPlans = (mealPlans || []).filter(
    (m) => m.dayNumber === selectedDay || m.date === selectedDayDate
  );

  const copyBookingCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'flight': return <Plane size={16} />;
      case 'train': return <Train size={16} />;
      case 'subway': return <Train size={16} />;
      case 'bus': return <Bus size={16} />;
      case 'ferry': return <Ship size={16} />;
      case 'car': return <Car size={16} />;
      case 'walk': return <Footprints size={16} />;
      default: return <Navigation size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '30px' }}>
      {/* Day Selector Pill Carousel */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: totalTripDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const isSelected = dayNum === selectedDay;
          const d = new Date(tripStartDate);
          d.setDate(d.getDate() + idx);
          const isToday = d.toISOString().split('T')[0] === todayStr;

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDay(dayNum)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 14px',
                borderRadius: '16px',
                minWidth: '68px',
                border: isSelected ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                backgroundColor: isSelected ? '#111111' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#333333',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
                DAY {dayNum}
              </span>
              <span style={{ fontSize: '0.74rem', opacity: isSelected ? 0.9 : 0.6, marginTop: '2px' }}>
                {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              {isToday && (
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    marginTop: '3px',
                    backgroundColor: isSelected ? '#FFFFFF' : '#111111',
                    color: isSelected ? '#111111' : '#FFFFFF',
                    borderRadius: '9999px',
                    padding: '1px 5px',
                  }}
                >
                  TODAY
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Daily Briefing Banner Card */}
      <div
        className="travelnest-card"
        style={{
          padding: '16px',
          backgroundColor: '#F5F5F7',
          border: '1px solid var(--border-subtle)',
          margin: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="label-micro">
              DAILY COMPANION · DAY {selectedDay} OF {totalTripDays}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              {trip.destination}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '2px' }}>
              {new Date(selectedDayDate).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openJournalModal({ tripId, date: selectedDayDate, title: `Day ${selectedDay} in ${trip.destination}` })}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <BookOpen size={13} />
            <span>Log Memory</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Multi-Leg Transport Planner */}
      <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Train size={17} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Multi-Leg Transport</span>
            <span className="badge" style={{ fontSize: '10px' }}>{dayLegs.length}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsGtfsOpen(true)}
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: '0.76rem', color: 'var(--secondary)' }}
            >
              Import GTFS
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingLeg({ dayNumber: selectedDay, date: selectedDayDate });
                setIsEditLegOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} />
              <span>Add Leg</span>
            </button>
          </div>
        </div>

        {dayLegs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--secondary)', fontSize: '0.82rem' }}>
            No transport legs planned for Day {selectedDay}. Add multi-leg flights, trains, or import official GTFS timetables.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dayLegs.map((leg, idx) => {
              // Calculate layover to next leg if any
              let layoverText: string | null = null;
              if (idx < dayLegs.length - 1 && leg.arrivalTime && dayLegs[idx + 1].departureTime) {
                const [arrH, arrM] = leg.arrivalTime.split(':').map(Number);
                const [depH, depM] = dayLegs[idx + 1].departureTime!.split(':').map(Number);
                const diffMins = depH * 60 + depM - (arrH * 60 + arrM);
                if (diffMins > 0) {
                  layoverText = `Layover: ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
                }
              }

              return (
                <div key={leg.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: '#FBFBFB',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: '#111111',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getTransportIcon(leg.mode)}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {leg.lineOrFlightNumber || leg.carrier || leg.mode.toUpperCase()}
                          </div>
                          {leg.carrier && leg.lineOrFlightNumber && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>{leg.carrier}</div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {leg.bookingRef && (
                          <button
                            type="button"
                            onClick={() => copyBookingCode(leg.bookingRef!)}
                            className="btn btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {copiedCode === leg.bookingRef ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                            <span>{leg.bookingRef}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLeg(leg);
                            setIsEditLegOpen(true);
                          }}
                          className="btn-icon"
                          style={{ width: '26px', height: '26px' }}
                        >
                          <Pencil size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Timeline stops */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{leg.departureTime || '--:--'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>{leg.departureLocation}</div>
                      </div>
                      <ArrowRight size={16} color="var(--secondary)" />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{leg.arrivalTime || '--:--'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>{leg.arrivalLocation}</div>
                      </div>
                    </div>

                    {(leg.platformOrGate || leg.seatOrCabin) && (
                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', color: '#555555', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px' }}>
                        {leg.platformOrGate && <span>Platform/Gate: <strong>{leg.platformOrGate}</strong></span>}
                        {leg.seatOrCabin && <span>Seat: <strong>{leg.seatOrCabin}</strong></span>}
                      </div>
                    )}
                  </div>

                  {layoverText && (
                    <div
                      style={{
                        alignSelf: 'center',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--secondary)',
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        backgroundColor: '#EEEEEE',
                      }}
                    >
                      ⏳ {layoverText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Daily Itinerary Timeline */}
      <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={17} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Day Schedule</span>
            <span className="badge" style={{ fontSize: '10px' }}>{dayEvents.length}</span>
          </div>
          <button
            type="button"
            onClick={() => openQuickAdd(tripId)}
            className="btn btn-ghost"
            style={{ padding: '3px 8px', fontSize: '0.76rem', color: '#111111', fontWeight: 600 }}
          >
            + Add Activity
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--secondary)', fontSize: '0.82rem' }}>
            No activities scheduled for this day yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#F9F9FA',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    {ev.startTime ? `${ev.startTime} ${ev.endTime ? `→ ${ev.endTime}` : ''}` : 'All Day'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '2px' }}>{ev.title}</div>
                  {ev.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--secondary)', marginTop: '2px' }}>
                      <MapPin size={12} />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openJournalModal({ tripId, itineraryEventId: ev.id, locationName: ev.location, title: ev.title })}
                  className="btn btn-ghost"
                  style={{ padding: '4px 6px', fontSize: '0.74rem', color: 'var(--secondary)' }}
                  title="Log memory for this activity"
                >
                  <BookOpen size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Meal Planning & Reusable Recipes */}
      <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={17} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Daily Meals & Cooking</span>
            <span className="badge" style={{ fontSize: '10px' }}>{dayMealPlans.length}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsRecipeLibOpen(true)}
              className="btn btn-ghost"
              style={{ padding: '3px 8px', fontSize: '0.76rem', color: 'var(--secondary)' }}
            >
              Recipe Library
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingMealPlan({ dayNumber: selectedDay, date: selectedDayDate });
                setIsMealPlanOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} />
              <span>Plan Meal</span>
            </button>
          </div>
        </div>

        {dayMealPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--secondary)', fontSize: '0.82rem' }}>
            No meals planned for Day {selectedDay}. Link a recipe from your reusable cookbook or plan where to eat.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayMealPlans.map((plan) => {
              const linkedRecipe = (recipes || []).find((r) => r.id === plan.recipeId);

              return (
                <div
                  key={plan.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: '#F9F9FA',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {plan.mealType === 'breakfast' ? '☕' : plan.mealType === 'lunch' ? '🥪' : '🍲'}
                    </span>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary)' }}>
                        {plan.mealType} · {plan.servings} Servings
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                        {linkedRecipe?.title || plan.customMealName}
                      </div>
                      {plan.estimatedCost && (
                        <div style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600 }}>
                          Est: {plan.currency} {plan.estimatedCost}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {linkedRecipe && (
                      <button
                        type="button"
                        onClick={() => setViewingRecipe(linkedRecipe)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      >
                        Recipe
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        await db.tripMealPlans.delete(plan.id);
                      }}
                      className="btn-icon"
                      style={{ width: '26px', height: '26px', color: '#dc2626' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: Today's Expenses & Spend Tracker */}
      <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={17} />
            <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Today's Expenses</span>
          </div>
          <button
            type="button"
            onClick={() => openQuickAdd(tripId)}
            className="btn btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={14} />
            <span>Log Spend</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F5F5F7', borderRadius: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>SPENT ON DAY {selectedDay}</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111111' }}>
              {trip.defaultCurrency} {totalDaySpend.toLocaleString()}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
            {dayExpenses.length} {dayExpenses.length === 1 ? 'receipt' : 'receipts'} logged
          </div>
        </div>
      </div>

      {/* SECTION 5: Saved Places & Offline Directions */}
      {(places && places.length > 0) && (
        <div className="travelnest-card" style={{ padding: '16px', margin: 0, backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Navigation size={17} />
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>Offline Places & Coordinates</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {places.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => setDirectionsPlace(p)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#F9F9FA',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                  {p.lat && p.lng ? (
                    <div style={{ fontSize: '0.76rem', color: 'var(--secondary)' }}>
                      📍 {formatCoordinates(p.lat, p.lng)}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.76rem', color: 'var(--secondary)' }}>
                      {p.address || p.category}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                >
                  Directions
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-modals */}
      {isEditLegOpen && (
        <EditTransportLegModal
          tripId={tripId}
          initialLeg={editingLeg}
          dayNumber={selectedDay}
          date={selectedDayDate}
          existingBookings={bookings}
          onClose={() => {
            setIsEditLegOpen(false);
            setEditingLeg(null);
          }}
        />
      )}

      {isGtfsOpen && (
        <GtfsImportModal
          tripId={tripId}
          dayNumber={selectedDay}
          date={selectedDayDate}
          onClose={() => setIsGtfsOpen(false)}
        />
      )}

      {isMealPlanOpen && (
        <MealPlanModal
          tripId={tripId}
          dayNumber={selectedDay}
          date={selectedDayDate}
          initialPlan={editingMealPlan}
          onClose={() => {
            setIsMealPlanOpen(false);
            setEditingMealPlan(null);
          }}
          onOpenRecipeLibrary={() => setIsRecipeLibOpen(true)}
        />
      )}

      {isRecipeLibOpen && (
        <RecipeLibraryModal
          tripId={tripId}
          defaultCurrency={trip.defaultCurrency}
          onClose={() => setIsRecipeLibOpen(false)}
          onSelectRecipeForTrip={(rec, servings) => {
            setIsRecipeLibOpen(false);
            setEditingMealPlan({
              tripId,
              dayNumber: selectedDay,
              date: selectedDayDate,
              recipeId: rec.id,
              servings,
              mealType: 'dinner',
            });
            setIsMealPlanOpen(true);
          }}
        />
      )}

      {viewingRecipe && (
        <RecipeDetailModal
          recipe={viewingRecipe}
          tripId={tripId}
          onClose={() => setViewingRecipe(null)}
          onEdit={() => {}}
          onAddToMealPlan={(rec, servings) => {
            setViewingRecipe(null);
            setEditingMealPlan({
              tripId,
              dayNumber: selectedDay,
              date: selectedDayDate,
              recipeId: rec.id,
              servings,
              mealType: 'dinner',
            });
            setIsMealPlanOpen(true);
          }}
        />
      )}

      {directionsPlace && (
        <PlaceDirectionsModal
          place={directionsPlace}
          referenceOrigin={
            dayLegs.length > 0 && dayLegs[0].departureCoordinates
              ? {
                  name: dayLegs[0].departureLocation,
                  lat: dayLegs[0].departureCoordinates.lat,
                  lng: dayLegs[0].departureCoordinates.lng,
                }
              : undefined
          }
          onClose={() => setDirectionsPlace(null)}
        />
      )}
    </div>
  );
};
