import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import {
  inspectDummyDataForRemoval,
  removeDummyData,
  type DummyRemovalPreview,
} from '../../db/provenance';
import {
  Trash2,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Luggage,
  Bookmark,
  Calendar,
  CreditCard,
  FileCheck,
  BookOpen,
  MapPin,
  FileText,
  Check,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface RemoveSampleDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemoveSampleDataModal: React.FC<RemoveSampleDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast, activeTripId, setActiveTripId } = useApp();
  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(true);
  const [preview, setPreview] = useState<DummyRemovalPreview | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInspecting(true);
      inspectDummyDataForRemoval()
        .then((res) => {
          setPreview(res);
          setInspecting(false);
        })
        .catch((err) => {
          console.warn('Inspection error:', err);
          setInspecting(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmRemoval = async () => {
    if (!preview || preview.totalRemovable === 0) return;

    setLoading(true);
    try {
      const result = await removeDummyData();
      if (activeTripId) {
        const stillExists = await db.trips.get(activeTripId);
        if (!stillExists) {
          setActiveTripId(null);
        }
      }
      showToast(
        `Successfully removed ${result.removedTotal} dummy records. Your personal data is intact.`,
        'success'
      );
      onClose();
    } catch (err: any) {
      showToast('Error removing dummy data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99990,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(16px, env(safe-area-inset-top, 16px)) max(16px, env(safe-area-inset-right, 16px)) max(16px, env(safe-area-inset-bottom, 16px)) max(16px, env(safe-area-inset-left, 16px))',
          colorScheme: 'light',
        }}
      >
        <div
          className="travelnest-card"
          onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '490px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--stroke)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--stroke)',
            backgroundColor: 'var(--surface-neutral-1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--error)',
              }}
            >
              <Trash2 size={16} strokeWidth={2.2} />
            </div>
            <div>
              <span className="label-micro" style={{ margin: 0 }}>CLEAN WORKSPACE</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                Remove Dummy Data
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '9999px', color: 'var(--secondary)' }}
            disabled={loading}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Explanation Banner */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--surface-neutral-1)',
              border: '1px solid var(--stroke)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--primary)', lineHeight: 1.45 }}>
              <strong>Safe Removal Guarantee:</strong> Deletes only unedited sample records generated by the Add Dummy Data feature. Personal trips, custom items, and modified records will <strong>never</strong> be deleted.
            </div>
          </div>

          {/* Loading / Inspection State */}
          {inspecting ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.86rem', margin: 0 }}>Scanning database records...</p>
            </div>
          ) : preview && preview.hasRemovableData ? (
            <>
              {/* Preview Summary Card */}
              <div
                style={{
                  border: '1px solid var(--stroke)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="label-micro" style={{ margin: 0 }}>RECORDS SLATED FOR REMOVAL</span>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      backgroundColor: '#fee2e2',
                      color: 'var(--error)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                    }}
                  >
                    {preview.totalRemovable} Items
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                    <Luggage size={14} color="var(--primary)" />
                    <span>Trips: <strong style={{ color: 'var(--primary)' }}>{preview.removableCounts.trips}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                    <Bookmark size={14} color="var(--primary)" />
                    <span>Collection Items: <strong style={{ color: 'var(--primary)' }}>{preview.removableCounts.collectionItems}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                    <BookOpen size={14} color="var(--primary)" />
                    <span>Memories: <strong style={{ color: 'var(--primary)' }}>{preview.removableCounts.journalEntries}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                    <Calendar size={14} color="var(--primary)" />
                    <span>Activities: <strong style={{ color: 'var(--primary)' }}>{preview.removableCounts.itineraryEvents}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                    <CreditCard size={14} color="var(--primary)" />
                    <span>Bookings & Bills: <strong style={{ color: 'var(--primary)' }}>{preview.removableCounts.bookings + preview.removableCounts.expenses}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)' }}>
                    <FileCheck size={14} color="var(--primary)" />
                    <span>Essentials & Docs: <strong style={{ color: 'var(--primary)' }}>{preview.removableCounts.essentials + preview.removableCounts.documents}</strong></span>
                  </div>
                </div>

                {preview.removableTripNames.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--stroke)' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--secondary)', display: 'block', marginBottom: '4px' }}>
                      Sample journeys to be removed:
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--primary)' }}>
                      {preview.removableTripNames.map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Preserved Records Protection Box */}
              <div
                style={{
                  border: '1px solid #bbf7d0',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  backgroundColor: '#f0fdf4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#15803d' }}>
                    Personal Data Preserved Intact
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#166534', lineHeight: 1.45 }}>
                  {preview.preservedUserCounts.trips} personal trip(s), {preview.preservedUserCounts.collectionItems} collection item(s), and {preview.preservedUserCounts.journalEntries} personal memory journal(s) will be completely preserved.
                </p>
                {preview.editedSampleRecords.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0', fontSize: '0.76rem', color: '#166534' }}>
                    <strong>Edited sample records preserved:</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                      {preview.editedSampleRecords.map((r, i) => (
                        <li key={i}>
                          {r.type}: <em>{r.title}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Clean State: No dummy data to remove */
            <div
              style={{
                border: '1px solid var(--stroke)',
                borderRadius: '16px',
                padding: '24px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--surface-neutral-1)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <Check size={22} strokeWidth={2.5} />
              </div>
              <h4 style={{ margin: '0 0 4px', fontSize: '0.98rem', fontWeight: 700, color: 'var(--primary)' }}>
                No Dummy Data Found
              </h4>
              <p style={{ margin: 0, fontSize: '0.80rem', color: 'var(--secondary)', lineHeight: 1.45 }}>
                Your database is already clean of unedited sample records. All existing records are your own personal data and will remain untouched.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--stroke)',
            backgroundColor: 'var(--surface-neutral-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '8px 16px', borderRadius: '10px' }}
            disabled={loading}
          >
            Cancel
          </button>
          {preview && preview.hasRemovableData && (
            <button
              onClick={handleConfirmRemoval}
              className="btn"
              disabled={loading}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 18px',
                fontWeight: 600,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Trash2 size={15} />
              <span>{loading ? 'Removing...' : `Remove ${preview.totalRemovable} Dummy Records`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
