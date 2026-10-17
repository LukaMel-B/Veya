import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Trash2,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface AppResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResetChoice = 'data_only' | 'preferences_only' | 'full_factory';

export const AppResetModal: React.FC<AppResetModalProps> = ({ isOpen, onClose }) => {
  const { resetApplication } = useApp();

  const [selectedOption, setSelectedOption] = useState<ResetChoice>('data_only');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExecuteReset = async () => {
    if (!confirmed) return;
    setLoading(true);
    try {
      await resetApplication(selectedOption);
      onClose();
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
                backgroundColor: '#fee2e2',
                color: 'var(--error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={16} strokeWidth={2.2} />
            </div>
            <div>
              <span className="label-micro" style={{ margin: 0, color: 'var(--error)' }}>
                DANGER ZONE
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                App Reset & Data Clear
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
          <p style={{ fontSize: '0.82rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.45 }}>
            Choose which scope of data you wish to reset. Veya stores everything on this device, so deletions cannot be reversed without an exported JSON backup.
          </p>

          {/* 3 Distinct Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Option 1: Clear Data Only */}
            <div
              onClick={() => {
                setSelectedOption('data_only');
                setConfirmed(false);
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor:
                  selectedOption === 'data_only' ? 'var(--surface-neutral-2)' : 'var(--surface-neutral-1)',
                border:
                  selectedOption === 'data_only' ? '2px solid var(--primary)' : '1px solid var(--stroke)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Clear Travel Data Only
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--stroke)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    color: 'var(--secondary)',
                  }}
                >
                  Keeps Profile
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.4 }}>
                Deletes all trips, itineraries, bookings, expenses, collection items, documents, and memory journals. Your profile name, avatar, and currency preferences remain intact.
              </p>
            </div>

            {/* Option 2: Reset Preferences Only */}
            <div
              onClick={() => {
                setSelectedOption('preferences_only');
                setConfirmed(false);
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor:
                  selectedOption === 'preferences_only' ? 'var(--surface-neutral-2)' : 'var(--surface-neutral-1)',
                border:
                  selectedOption === 'preferences_only' ? '2px solid var(--primary)' : '1px solid var(--stroke)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                  Reset Onboarding & Preferences
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--stroke)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    color: 'var(--secondary)',
                  }}
                >
                  Keeps Data
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.4 }}>
                Resets your display name, home country, and currency defaults, and restarts the first-launch onboarding setup. All saved trips, itineraries, and journals are kept 100% safe.
              </p>
            </div>

            {/* Option 3: Full Factory Reset */}
            <div
              onClick={() => {
                setSelectedOption('full_factory');
                setConfirmed(false);
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                backgroundColor:
                  selectedOption === 'full_factory' ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-neutral-1)',
                border:
                  selectedOption === 'full_factory' ? '2px solid var(--error)' : '1px solid var(--stroke)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--error)' }}>
                  Full Factory Reset
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fca5a5',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    color: 'var(--error)',
                  }}
                >
                  Total Wipe
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.4 }}>
                Permanently wipes all IndexedDB records and all local preferences. Restores the application to a brand-new, fresh installation state.
              </p>
            </div>
          </div>

          {/* Explicit Confirmation Checkbox Guard */}
          <div
            onClick={() => setConfirmed(!confirmed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: '#FFF5F5',
              border: '1px solid #FED7D7',
              cursor: 'pointer',
              marginTop: '4px',
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--error)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.78rem', color: '#9B2C2C', fontWeight: 600, lineHeight: 1.35 }}>
              I understand this action will execute the selected reset.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--stroke)',
            backgroundColor: 'var(--surface-neutral-1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ flex: 1, minHeight: '42px', borderRadius: '9999px' }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteReset}
            disabled={!confirmed || loading}
            className="btn"
            style={{
              flex: 1,
              minHeight: '42px',
              borderRadius: '9999px',
              backgroundColor: confirmed ? 'var(--error)' : 'var(--stroke)',
              color: '#FFFFFF',
              fontWeight: 700,
              cursor: confirmed ? 'pointer' : 'not-allowed',
              opacity: confirmed ? 1 : 0.6,
            }}
          >
            {loading ? 'Resetting...' : 'Confirm Reset'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
