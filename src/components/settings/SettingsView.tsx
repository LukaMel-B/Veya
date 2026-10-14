import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useApp } from '../../context/AppContext';
import { EditProfileModal } from './EditProfileModal';
import { AddSampleDataModal } from './AddSampleDataModal';
import { RemoveSampleDataModal } from './RemoveSampleDataModal';
import { AppResetModal } from './AppResetModal';
import { RecipeLibraryModal } from '../recipes/RecipeLibraryModal';
import { RecordExchangeModal } from './RecordExchangeModal';
import { AVATAR_OPTIONS } from '../../utils/profileUtils';
import {
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Wifi,
  WifiOff,
  User,
  Sparkles,
  Globe,
  Coins,
  Compass,
  FolderMinus,
  Layers,
  Smartphone,
  ChevronDown,
  Utensils,
  FolderSync,
  BookOpen,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

export const SettingsView: React.FC = () => {
  const { showToast, showConfirm, showAlert, isOnline, userProfile, startTour } = useApp();
  const [storageUsedMB, setStorageUsedMB] = useState<string>('0');
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState(false);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddSampleOpen, setIsAddSampleOpen] = useState(false);
  const [isRemoveSampleOpen, setIsRemoveSampleOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [isRecipeLibOpen, setIsRecipeLibOpen] = useState(false);
  const [isRecordExchangeOpen, setIsRecordExchangeOpen] = useState(false);

  // Sandbox demo trigger handlers (Sketch Alert & Dialog Library)
  const handleSandboxStandardConfirm = async () => {
    const res = await showConfirm({
      categoryKicker: 'CONFIRMATION',
      title: 'Export WhatsApp Itinerary Schedule?',
      description:
        'We will compile Day 1 through Day 7 interactions bulleted for easy summary formatted with emojis for your group chat.',
      detailCard: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Enclosure: <strong>Tokyo Trip Group (12)</strong>
          </span>
          <span className="badge-status badge-active" style={{ fontSize: '10px' }}>
            7 Days
          </span>
        </div>
      ),
      confirmText: 'Export Schedule',
      cancelText: 'Cancel',
      variant: 'default',
      iconName: 'fileText',
    });
    if (res) showToast('Schedule exported to clipboard!', 'success');
  };

  const handleSandboxDestructive = async () => {
    const res = await showConfirm({
      categoryKicker: 'DESTRUCTIVE ACTION',
      title: 'Delete Trip "Swiss Alps Hiking"?',
      description:
        'This permanently removes all 14 saved itinerary slots, trail maps, and expense tallies. This action cannot be undone.',
      warningMessage: '3 hotel booking vouchers are currently linked to this itinerary',
      confirmText: 'Delete Trip',
      cancelText: 'Keep Trip',
      variant: 'destructive',
      iconName: 'trash',
    });
    if (res) showToast('Demo trip deleted from sandbox.', 'info');
  };

  const handleSandboxForm = async () => {
    const res = await showConfirm({
      categoryKicker: 'FIELD ENTRY',
      title: 'Edit Collection Name',
      description: 'Refine your curated bookmarks, cafes, and spots.',
      detailCard: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--secondary)' }}>COLLECTION TITLE</label>
          <input
            defaultValue="Tokyo Ramen & Coffee"
            readOnly
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--stroke)',
              backgroundColor: 'var(--surface-neutral-1)',
              fontSize: '13px',
              color: 'var(--primary)',
            }}
          />
        </div>
      ),
      confirmText: 'Save Changes',
      cancelText: 'Cancel',
      variant: 'default',
      iconName: 'edit',
    });
    if (res) showToast('Collection title saved!', 'success');
  };

  const handleSandboxConflict = async () => {
    const res = await showConfirm({
      categoryKicker: 'WARNING',
      title: 'Overlapping Itinerary Slot',
      description:
        '"TeamLab Planets" ends at 15:30 in Toyosu, but your booked "Shinjuku Tea Tasting" starts at 15:45 (35 min transit time).',
      warningMessage: 'Estimated transit: 35m (-20m buffer)',
      confirmText: 'Review Schedule',
      cancelText: 'Adjust Later',
      variant: 'warning',
      iconName: 'alertTriangle',
    });
    if (res) showToast('Opened itinerary review.', 'info');
  };

  const handleSandboxProgress = async () => {
    const res = await showConfirm({
      categoryKicker: 'ASYNC PROGRESS',
      title: 'Syncing Kyoto Metro Maps...',
      description:
        'Downloading high-resolution vectors and transit connection graphs for offline routing.',
      detailCard: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Station 12 of 38</span>
          <span style={{ fontSize: '11px', color: 'var(--secondary)' }}>~6 sec remaining</span>
        </div>
      ),
      confirmText: 'View Status',
      cancelText: 'Run in Background',
      variant: 'default',
      iconName: 'refresh',
    });
    if (res) showToast('Viewing offline map cache status.', 'info');
  };

  useEffect(() => {
    const checkStorage = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const used = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
          setStorageUsedMB(used);
        } catch (e) {
          console.warn('Storage estimate failed:', e);
        }
      }

      if (navigator.storage && navigator.storage.persisted) {
        try {
          const persisted = await navigator.storage.persisted();
          setIsPersisted(persisted);
        } catch (e) {
          console.warn('Persisted check failed:', e);
        }
      }
    };

    checkStorage();
  }, []);

  const handleRequestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const granted = await navigator.storage.persist();
        setIsPersisted(granted);
        if (granted) {
          showToast('Persistent storage granted!', 'success');
        } else {
          showToast('Storage retained standard lifecycle.', 'info');
        }
      } catch (err: any) {
        showToast('Storage persist error: ' + err.message, 'error');
      }
    } else {
      showToast('Storage persistence not supported.', 'info');
    }
  };

  const handleExportBackup = async () => {
    try {
      const backupData = await db.exportFullData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `Veya_Backup_${new Date().toISOString().split('T')[0]}.veya.json`;
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Full backup file exported!', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await showConfirm({
      title: 'Restore Database Backup?',
      kicker: 'DATABASE RESTORE',
      message: 'Restoring this backup will replace current local database records with the backup file data.',
      warning: 'Existing trips, memories, and preferences not present in the backup will be overwritten. We recommend exporting a backup snapshot first.',
      confirmText: 'Restore & Overwrite',
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: 'database',
    });

    if (!confirmed) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      await db.importFullData(payload, 'overwrite');
      showToast('Backup restored successfully!', 'success');
      setIsImporting(false);
      window.location.reload();
    } catch (err: any) {
      showToast('Import error: ' + err.message, 'error');
      setIsImporting(false);
    }
  };

  const currentAvatarIcon = AVATAR_OPTIONS.find((a) => a.id === userProfile.avatar)?.icon || '🧭';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Editorial Header */}
      <div>
        <span className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
          SYSTEM & STORAGE
        </span>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--primary)' }}>
          Settings & Vault
        </h2>
        <p style={{ color: 'var(--secondary)', fontSize: '0.84rem', margin: '4px 0 0' }}>
          Profile preferences, local database lifecycle, and device privacy controls
        </p>
      </div>

      {/* Group 0: Local Profile & Preferences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          EXPLORER PROFILE & PREFERENCES
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            margin: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          {/* Profile Overview Card */}
          <div
            onClick={() => setIsEditProfileOpen(true)}
            style={{
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--stroke)',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                }}
              >
                {currentAvatarIcon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {userProfile.displayName || 'Traveler'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '1px' }}>
                  Base: {userProfile.homeCountry || 'Global'} · Currency: {userProfile.preferredCurrency || 'INR'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--primary)' }}>Edit</span>
              <ChevronRight size={15} color="var(--secondary)" />
            </div>
          </div>

          {/* Travel Styles Chips Preview */}
          {userProfile.travelStyles && userProfile.travelStyles.length > 0 && (
            <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '5px', backgroundColor: 'var(--surface-neutral-1)' }}>
              {userProfile.travelStyles.map((style) => (
                <span
                  key={style}
                  style={{
                    fontSize: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--stroke)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                  }}
                >
                  {style}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Group 0.5: Guided App Tour */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          APPLICATION TOUR
        </span>
        <div
          id="settings-tour-card"
          data-tour-target="settings-tour-card"
          className="travelnest-card"
          style={{
            padding: 0,
            margin: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          <div
            onClick={startTour}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              minHeight: '56px',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={16} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>
                  Take a Tour Again
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Re-explore Veya's interface, tabs, and quick capture actions
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--secondary)" />
          </div>
        </div>
      </div>

      {/* Group: iPhone & Web App Installation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          IPHONE & WEB APP INSTALLATION
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            margin: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          <div
            onClick={() => setIsInstallGuideOpen(!isInstallGuideOpen)}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              minHeight: '56px',
              backgroundColor: isInstallGuideOpen ? 'var(--surface-neutral-1)' : '#ffffff',
              transition: 'background-color 140ms ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <Smartphone size={17} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>
                  Install App on iPhone
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  How to add Veya to Home Screen via Chrome or Safari
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: '#111111',
                  color: '#ffffff',
                }}
              >
                PWA
              </span>
              {isInstallGuideOpen ? (
                <ChevronDown size={16} color="var(--secondary)" />
              ) : (
                <ChevronRight size={16} color="var(--secondary)" />
              )}
            </div>
          </div>

          {isInstallGuideOpen && (
            <div
              style={{
                padding: '16px',
                borderTop: '1px solid var(--stroke)',
                backgroundColor: 'var(--surface-neutral-1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                fontSize: '0.8rem',
                lineHeight: 1.5,
              }}
            >
              {/* Chrome Instructions */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--stroke)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Google Chrome on iPhone</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--on-surface-variant)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Tap the <strong>Share icon</strong> in the address bar (or tap <strong>...</strong> in the bottom right).</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                  <li>Tap <strong>Add</strong> in the top right corner.</li>
                </ol>
              </div>

              {/* Safari Instructions */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--stroke)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Apple Safari on iPhone</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--on-surface-variant)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Tap the <strong>Share</strong> button at the bottom of the screen (square with arrow).</li>
                  <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                  <li>Confirm by tapping <strong>Add</strong>.</li>
                </ol>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                ✨ Once added, Veya opens fullscreen without browser toolbars, handles offline journeys with IndexedDB, and matches Apple's native safe-area layout.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group 1: Storage & Offline Infrastructure */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          STORAGE & OFFLINE INFRASTRUCTURE
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            margin: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          {/* Row 1: Offline Database */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderBottom: '1px solid var(--stroke)',
              minHeight: '56px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <HardDrive size={17} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Offline Database
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Local IndexedDB footprint on this device
                </div>
              </div>
            </div>
            <span
              style={{
                color: 'var(--primary)',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                backgroundColor: 'var(--surface-neutral-1)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--stroke)',
                flexShrink: 0,
              }}
            >
              {storageUsedMB} MB
            </span>
          </div>

          {/* Row 2: Persistence Protection */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              borderBottom: '1px solid var(--stroke)',
              minHeight: '56px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={17} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Persistence Protection
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Prevent browser eviction under low device disk space
                </div>
              </div>
            </div>
            {isPersisted ? (
              <span
                style={{
                  backgroundColor: 'var(--surface-neutral-2)',
                  color: 'var(--primary)',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  border: '1px solid var(--stroke)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
              >
                Protected
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPersistence}
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.76rem',
                  padding: '0 14px',
                  height: '32px',
                  minHeight: '32px',
                  borderRadius: '9999px',
                  flexShrink: 0,
                }}
              >
                Enable
              </button>
            )}
          </div>

          {/* Row 3: Network Connectivity */}
          <div
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              minHeight: '56px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                {isOnline ? <Wifi size={17} strokeWidth={2} /> : <WifiOff size={17} strokeWidth={2} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Network Connectivity
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  PWA offline service worker and cache state
                </div>
              </div>
            </div>
            <span
              style={{
                backgroundColor: isOnline ? '#111111' : 'var(--surface-neutral-2)',
                color: isOnline ? '#ffffff' : 'var(--secondary)',
                borderRadius: '9999px',
                padding: '4px 12px',
                fontWeight: 600,
                fontSize: '0.74rem',
                flexShrink: 0,
              }}
            >
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Group 2: Backup & Restoration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          LOCAL BACKUP & RESTORATION
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            margin: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          {/* Row 1: Export JSON */}
          <div
            onClick={handleExportBackup}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--stroke)',
              minHeight: '56px',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <Download size={17} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', display: 'block' }}>
                  Export JSON Backup
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Download complete snapshot of trips, receipts, and checklists
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span className="btn btn-secondary btn-sm" style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '0.74rem', pointerEvents: 'none' }}>
                Export
              </span>
              <ChevronRight size={16} color="var(--secondary)" />
            </div>
          </div>

          {/* Row 2: Restore Backup */}
          <label
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              margin: 0,
              minHeight: '56px',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <Upload size={17} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--primary)', display: 'block' }}>
                  Restore Backup File
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Import a previous Veya JSON archive into local store
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span className="btn btn-secondary btn-sm" style={{ height: '30px', minHeight: '30px', padding: '0 12px', fontSize: '0.74rem', pointerEvents: 'none' }}>
                Restore
              </span>
              <ChevronRight size={16} color="var(--secondary)" />
            </div>
            <input
              type="file"
              accept=".json,.travelnest"
              onChange={handleImportBackup}
              disabled={isImporting}
              style={{ display: 'none' }}
            />
          </label>

          {/* Release & Update Safety Note */}
          <div style={{ padding: '10px 16px', backgroundColor: 'var(--surface-neutral-1)', borderTop: '1px solid var(--stroke)', fontSize: '0.74rem', color: 'var(--secondary)', lineHeight: 1.45 }}>
            💡 <strong>Update Safety Tip:</strong> Export a JSON backup before major APK updates so you always maintain a complete, portable archive of your trips, receipts, and memory journals.
          </div>
        </div>
      </div>

      {/* Group: Travel Companion, Recipes & Record Exchange */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          TRAVEL COMPANION & EXCHANGE
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            margin: 0,
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          {/* Row 1: Recipe Library */}
          <div
            onClick={() => setIsRecipeLibOpen(true)}
            className="cupertino-row"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <Utensils size={17} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>
                  Recipe Library & Ingredient Pricing
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Reusable cookbook, unit prices, and meal planning
                </div>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} color="var(--secondary)" />
          </div>

          {/* Row 2: Selected Record Pack Exchange */}
          <div
            onClick={() => setIsRecordExchangeOpen(true)}
            className="cupertino-row"
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderBottom: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                <FolderSync size={17} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>
                  Selected Record Pack Exchange
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Export/import trip packs with conflict resolution
                </div>
              </div>
            </div>
            <ChevronRight size={16} strokeWidth={2} color="var(--secondary)" />
          </div>
        </div>
      </div>

      {/* Group 3: Privacy & Local Architecture */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          PRIVACY & LOCAL ARCHITECTURE
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: '16px 18px',
            margin: 0,
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
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
              <ShieldCheck size={18} strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--primary)' }}>
              100% Client-Side Private Storage
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--secondary)', margin: 0, lineHeight: 1.5 }}>
            Veya operates without external telemetry or tracking databases. All itineraries, receipts, checklists, and documents remain securely on this device within Dexie IndexedDB.
          </p>
        </div>
      </div>

      {/* Group 4: Database Maintenance */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="label-micro" style={{ padding: '0 4px', margin: 0 }}>
          DATABASE OPERATIONS
        </span>
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            margin: 0,
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          {/* Row 1: Add Dummy Data */}
          <div
            onClick={() => setIsAddSampleOpen(true)}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--stroke)',
              minHeight: '56px',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <RefreshCw size={16} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>
                  Add Dummy Data
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Populate demo journeys (Tokyo, Swiss Alps & Kazakhstan)
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--secondary)" />
          </div>

          {/* Row 2: Remove Dummy Data */}
          <div
            onClick={() => setIsRemoveSampleOpen(true)}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--stroke)',
              minHeight: '56px',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-neutral-2)',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <FolderMinus size={16} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>
                  Remove Dummy Data
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Safely delete unedited demo records (preserves personal data)
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--secondary)" />
          </div>

          {/* Row 3: Reset Application Data */}
          <div
            onClick={() => setIsResetOpen(true)}
            style={{
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              minHeight: '56px',
              transition: 'background-color 140ms ease',
            }}
            className="settings-interactive-row"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--error)',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={16} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>
                  Reset Application Data
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                  Clear travel records, reset onboarding, or factory wipe
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--secondary)" />
          </div>
        </div>
      </div>

      {/* Group 5: Interactive Modal Trigger Sandbox (Sketch Component Library) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <span className="label-micro" style={{ margin: 0 }}>
            DESIGN SYSTEM & COMPONENT LIBRARY
          </span>
          <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600 }}>
            v2.4 · Monochrome Voyage
          </span>
        </div>
        <div
          className="travelnest-card"
          style={{
            padding: '16px 18px',
            margin: 0,
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--stroke)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
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
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--primary)' }}>
                Interactive Modal Trigger Sandbox
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--secondary)' }}>
                Preview native-feel dialogs with blur scrim, tap-to-dismiss & Android back-button
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--stroke)' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--secondary)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Open Dialog Demo
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={handleSandboxStandardConfirm}
                className="btn btn-primary btn-sm"
                style={{ borderRadius: '9999px', fontSize: '12px', padding: '6px 14px' }}
              >
                Standard Confirm
              </button>
              <button
                type="button"
                onClick={handleSandboxDestructive}
                className="btn btn-sm"
                style={{
                  borderRadius: '9999px',
                  fontSize: '12px',
                  padding: '6px 14px',
                  backgroundColor: '#DC2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Destructive Delete
              </button>
              <button
                type="button"
                onClick={handleSandboxForm}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '9999px', fontSize: '12px', padding: '6px 14px' }}
              >
                Create / Edit Form
              </button>
              <button
                type="button"
                onClick={handleSandboxConflict}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '9999px', fontSize: '12px', padding: '6px 14px' }}
              >
                Schedule Conflict
              </button>
              <button
                type="button"
                onClick={handleSandboxProgress}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '9999px', fontSize: '12px', padding: '6px 14px' }}
              >
                Progress State
              </button>
            </div>
          </div>
        </div>
      </div>

      <FloatingActionButton
        onClick={handleExportBackup}
        icon={<Download size={24} strokeWidth={2.4} />}
        label="Export Backup"
      />

      {/* Settings Sub-Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <AddSampleDataModal
        isOpen={isAddSampleOpen}
        onClose={() => setIsAddSampleOpen(false)}
      />

      <RemoveSampleDataModal
        isOpen={isRemoveSampleOpen}
        onClose={() => setIsRemoveSampleOpen(false)}
      />

      <AppResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
      />

      {isRecipeLibOpen && (
        <RecipeLibraryModal
          defaultCurrency={userProfile.preferredCurrency}
          onClose={() => setIsRecipeLibOpen(false)}
        />
      )}

      {isRecordExchangeOpen && (
        <RecordExchangeModal
          onClose={() => setIsRecordExchangeOpen(false)}
          onImportComplete={() => showToast('Record pack imported successfully!', 'success')}
        />
      )}
    </div>
  );
};
