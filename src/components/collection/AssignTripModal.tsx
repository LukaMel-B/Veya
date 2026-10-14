import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CollectionItem, Trip } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateRangeDDmmmYY } from '../../utils/dateUtils';
import { getCountryFlag } from '../../utils/countryUtils';
import { X, Luggage, Globe, Check, AlertCircle } from 'lucide-react';

interface AssignTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CollectionItem;
  onSaved?: (updatedTripId?: string) => void;
}

export const AssignTripModal: React.FC<AssignTripModalProps> = ({
  isOpen,
  onClose,
  item,
  onSaved,
}) => {
  const { showToast } = useApp();
  const allTrips = useLiveQuery(() => db.trips.toArray(), []) || [];
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(item.tripId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTripId(item.tripId);
    }
  }, [isOpen, item.tripId]);

  if (!isOpen) return null;

  const currentTrip = allTrips.find((t) => t.id === selectedTripId);
  const isCurrentlyAssigned = Boolean(item.tripId && allTrips.some((t) => t.id === item.tripId));

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const isAssigned = Boolean(selectedTripId && selectedTripId.trim().length > 0);
      const newStatus = isAssigned ? 'assigned' : (item.status === 'archived' ? 'archived' : 'inbox');

      await db.collectionItems.update(item.id, {
        tripId: isAssigned ? selectedTripId : undefined,
        status: newStatus,
        isPlanned: isAssigned ? item.isPlanned : false,
      });

      if (isAssigned && currentTrip) {
        showToast(`Assigned "${item.title}" to ${currentTrip.name}!`, 'success');
      } else {
        showToast(`Item set as Global Note in your ${item.country || 'General'} collection.`, 'info');
      }

      if (onSaved) onSaved(selectedTripId);
      onClose();
    } catch (err: any) {
      showToast('Error updating trip assignment: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="dialog-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="dialog-frame"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--stroke)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 22px 14px',
            borderBottom: '1px solid var(--stroke)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <span className="label-micro" style={{ margin: 0 }}>
              TRIP SELECTION
            </span>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                margin: '2px 0 0',
                color: 'var(--primary)',
              }}
            >
              {isCurrentlyAssigned ? 'Change Trip Assignment' : 'Assign Spot to Trip'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>
              Choose which journey should include "{item.title}".
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '9999px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary)',
              flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Trips Radio List */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Option 1: None / Global Item */}
          <div
            onClick={() => setSelectedTripId(undefined)}
            style={{
              padding: '12px 14px',
              borderRadius: '14px',
              border: !selectedTripId ? '2px solid var(--primary)' : '1px solid var(--stroke)',
              backgroundColor: !selectedTripId ? 'var(--surface-neutral-1)' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'border-color 140ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--primary)',
                }}
              >
                <Globe size={18} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
                  None (Global Collection Item)
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '2px' }}>
                  Stored in your {item.country || 'General'} collection without trip linkage
                </div>
              </div>
            </div>

            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '9999px',
                border: !selectedTripId ? '5px solid var(--primary)' : '1.5px solid var(--stroke)',
                backgroundColor: '#ffffff',
                flexShrink: 0,
              }}
            />
          </div>

          {/* Section Divider if trips exist */}
          {allTrips.length > 0 && (
            <div style={{ margin: '8px 2px 2px' }}>
              <span className="label-micro" style={{ margin: 0 }}>
                ACTIVE JOURNEYS ({allTrips.length})
              </span>
            </div>
          )}

          {/* Trip Options */}
          {allTrips.map((trip) => {
            const isSelected = selectedTripId === trip.id;
            const flag = getCountryFlag(trip.country || trip.destination) || '✈️';

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTripId(trip.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--stroke)',
                  backgroundColor: isSelected ? 'var(--surface-neutral-1)' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'border-color 140ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '1rem',
                    }}
                  >
                    {flag}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: 'var(--primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {trip.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '2px' }}>
                      {trip.destination} · {formatDateRangeDDmmmYY(trip.startDate, trip.endDate)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '9999px',
                    border: isSelected ? '5px solid var(--primary)' : '1.5px solid var(--stroke)',
                    backgroundColor: '#ffffff',
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}

          {allTrips.length === 0 && (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                backgroundColor: 'var(--surface-neutral-1)',
                borderRadius: '14px',
                border: '1px dashed var(--stroke)',
              }}
            >
              <AlertCircle size={28} color="var(--secondary)" style={{ margin: '0 auto 6px', opacity: 0.6 }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--primary)' }}>
                No active journeys available
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', margin: '4px 0 0' }}>
                Create a trip in the My Trips tab before assigning collection items.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px 18px',
            borderTop: '1px solid var(--stroke)',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--surface-neutral-1)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-dialog-secondary"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="btn-dialog-primary"
            style={{ flex: 1 }}
          >
            {isSubmitting ? 'Saving...' : 'Save Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};
