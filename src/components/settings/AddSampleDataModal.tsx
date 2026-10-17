import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { seedSampleData, hasSampleData } from '../../db/seedData';
import {
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Luggage,
  Bookmark,
  Calendar,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface AddSampleDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSampleDataModal: React.FC<AddSampleDataModalProps> = ({ isOpen, onClose }) => {
  const { showToast, showConfirm } = useApp();
  const [loading, setLoading] = useState(false);
  const [sampleStatus, setSampleStatus] = useState<{
    hasSampleTrips: boolean;
    sampleTripCount: number;
    totalTripCount: number;
  }>({ hasSampleTrips: false, sampleTripCount: 0, totalTripCount: 0 });

  useEffect(() => {
    if (isOpen) {
      hasSampleData().then(setSampleStatus).catch(console.warn);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMerge = async () => {
    setLoading(true);
    try {
      await seedSampleData('merge');
      showToast('Sample dataset loaded! (Your custom records are preserved)', 'success');
      onClose();
    } catch (err: any) {
      showToast('Error seeding demo data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReplace = async () => {
    const confirmed = await showConfirm({
      title: 'Replace Current Data with Demo Dataset?',
      categoryKicker: 'DESTRUCTIVE RESET',
      description:
        'Are you sure you want to replace existing data with the demo dataset? Any custom trips or memories will be overwritten.',
      warningMessage: 'This action will reset your active trips to the curated demo collection.',
      confirmText: 'Replace Data',
      cancelText: 'Keep Existing',
      variant: 'destructive',
      iconName: 'trash',
    });
    if (!confirmed) {
      return;
    }
    setLoading(true);
    try {
      await seedSampleData('replace');
      showToast('Database reset and repopulated with sample dataset.', 'success');
      onClose();
    } catch (err: any) {
      showToast('Error resetting demo data: ' + err.message, 'error');
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
          maxWidth: '480px',
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
                backgroundColor: 'var(--surface-neutral-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <RefreshCw size={16} strokeWidth={2.2} />
            </div>
            <div>
              <span className="label-micro" style={{ margin: 0 }}>TEST & DEMO DATA</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                Add Sample Data
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

        {/* Body Content */}
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
          {/* Current Status Banner */}
          {sampleStatus.hasSampleTrips ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
              }}
            >
              <AlertCircle size={20} color="#ca8a04" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: '#854d0e', lineHeight: 1.4 }}>
                <strong>Demo data already present:</strong> Found {sampleStatus.sampleTripCount} sample trips in your library. You can re-merge or refresh them safely.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '14px',
                backgroundColor: 'var(--surface-neutral-1)',
                border: '1px solid var(--stroke)',
              }}
            >
              <CheckCircle2 size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: 'var(--primary)', lineHeight: 1.4 }}>
                <strong>No demo trips currently loaded.</strong> You have {sampleStatus.totalTripCount} custom trips in your database.
              </div>
            </div>
          )}

          {/* Dataset Inclusions Overview */}
          <div>
            <span className="label-micro" style={{ marginBottom: '8px', display: 'block' }}>
              COMPLETE SAMPLE DATASET INCLUDES:
            </span>
            <div
              style={{
                backgroundColor: 'var(--surface-neutral-1)',
                borderRadius: '14px',
                border: '1px solid var(--stroke)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Luggage size={15} color="var(--primary)" />
                <span>
                  <strong>3 Detailed Trips:</strong> Tokyo Sakura (10d), Swiss Alps (10d), Kazakhstan (8d)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="var(--primary)" />
                <span>
                  <strong>14+ Itinerary Events:</strong> Shinjuku Gyoen, teamLab Planets, Medeu, Charyn Canyon
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bookmark size={15} color="var(--primary)" />
                <span>
                  <strong>10+ Country Collection Spots:</strong> Yakitori alley, Tsukiji market, alpine chalets
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={15} color="var(--primary)" />
                <span>
                  <strong>Bookings & Documents:</strong> Flight tickets (ANA), hotel vouchers, packing essentials
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={15} color="var(--primary)" />
                <span>
                  <strong>Memory Journal Entries:</strong> Shibuya sunset reflections and Brienz alpine lake memories
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.45 }}>
            Choose how you want to add this dataset: <strong>Merge</strong> keeps your custom records safe, while <strong>Replace</strong> resets all tables back to the demo baseline.
          </p>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--stroke)',
            backgroundColor: 'var(--surface-neutral-1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <button
            onClick={handleMerge}
            disabled={loading}
            className="btn btn-primary"
            style={{ minHeight: '44px', borderRadius: '9999px', fontSize: '0.86rem' }}
          >
            {loading ? 'Populating...' : 'Merge Demo Data (Keep My Records)'}
          </button>

          <button
            onClick={handleReplace}
            disabled={loading}
            className="btn btn-ghost"
            style={{
              minHeight: '38px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              color: 'var(--secondary)',
            }}
          >
            Replace All With Demo Dataset
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
