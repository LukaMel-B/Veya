import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../../context/AppContext';
import type { RecordPackPayload, ConflictStrategy, Trip } from '../../types';
import {
  exportSelectedTripPack,
  exportSelectedRecipesPack,
  validateRecordPack,
  importRecordPackWithStrategy,
} from '../../utils/recordExchange';
import {
  X,
  Download,
  Upload,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  FolderSync,
} from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface RecordExchangeModalProps {
  currentTripId?: string;
  onClose: () => void;
  onImportComplete?: () => void;
}

export const RecordExchangeModal: React.FC<RecordExchangeModalProps> = ({
  currentTripId,
  onClose,
  onImportComplete,
}) => {
  const { showToast, showConfirm } = useApp();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Export states
  const trips = useLiveQuery(() => db.trips.toArray(), []);
  const [selectedTripId, setSelectedTripId] = useState<string>(currentTripId || '');
  const [exportType, setExportType] = useState<'trip' | 'recipes'>('trip');
  const [isExporting, setIsExporting] = useState(false);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [candidatePack, setCandidatePack] = useState<RecordPackPayload | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedCount: number;
    overwrittenCount: number;
    copiedCount: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Set default selected trip
  React.useEffect(() => {
    if (!selectedTripId && trips && trips.length > 0) {
      setSelectedTripId(trips[0].id);
    }
  }, [trips, selectedTripId]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let pack: RecordPackPayload;
      let filename = 'travelnest-export.json';

      if (exportType === 'trip') {
        if (!selectedTripId) return;
        pack = await exportSelectedTripPack(selectedTripId);
        filename = `${pack.manifest.title.toLowerCase().replace(/\s+/g, '-')}.travelnest-pack.json`;
      } else {
        pack = await exportSelectedRecipesPack();
        filename = 'travelnest-recipes.travelnest-pack.json';
      }

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pack, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Pack exported successfully!', 'success');
    } catch (err: any) {
      showToast('Export failed: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setValidationErrors([]);
    setCandidatePack(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const validation = validateRecordPack(text);
      if (!validation.valid || !validation.payload) {
        setValidationErrors(validation.errors);
      } else {
        setCandidatePack(validation.payload);
      }
    } catch (err: any) {
      setValidationErrors([err?.message || 'Error parsing pack file.']);
    }
  };

  const handleExecuteImport = async () => {
    if (!candidatePack) return;

    if (conflictStrategy === 'overwrite') {
      const confirmed = await showConfirm({
        title: 'Overwrite Conflicting Records?',
        categoryKicker: 'DATA IMPORT',
        description: 'Records in this pack with matching IDs will overwrite your existing data. Unmatched records will be created normally.',
        warningMessage: 'Existing record modifications may be replaced.',
        confirmText: 'Overwrite Records',
        cancelText: 'Cancel',
        variant: 'destructive',
        iconName: 'alert',
      });
      if (!confirmed) return;
    }

    setIsImporting(true);
    try {
      const result = await importRecordPackWithStrategy(candidatePack, conflictStrategy);
      setImportResult(result);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setValidationErrors(['Import transaction failed: ' + err?.message]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ModalPortal>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 99990,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 0,
          colorScheme: 'light',
        }}
      >
        <div
          className="travelnest-card animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="label-micro">PORTABLE RECORD PACKS</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              Selected Record Exchange
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className="btn"
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'export' ? '#111111' : '#F5F5F7',
              color: activeTab === 'export' ? '#FFFFFF' : '#333333',
              border: 'none',
              borderRadius: '12px',
            }}
          >
            Export Record Pack
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className="btn"
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'import' ? '#111111' : '#F5F5F7',
              color: activeTab === 'import' ? '#FFFFFF' : '#333333',
              border: 'none',
              borderRadius: '12px',
            }}
          >
            Import Record Pack
          </button>
        </div>

        {activeTab === 'export' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: 1.5 }}>
              Export an individual trip (with its multi-leg transport, meal plans, grocery list, bookings, and itinerary)
              or your reusable cookbook as a portable JSON pack.
            </p>

            {/* Type selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setExportType('trip')}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: exportType === 'trip' ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                  backgroundColor: exportType === 'trip' ? '#F9F9FA' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🎒 Single Trip Pack</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--secondary)', marginTop: '2px' }}>
                  Full trip workspace with transport & meals
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('recipes')}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: exportType === 'recipes' ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                  backgroundColor: exportType === 'recipes' ? '#F9F9FA' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🍳 Recipe Cookbook</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--secondary)', marginTop: '2px' }}>
                  Reusable recipes & ingredient pricing
                </div>
              </button>
            </div>

            {/* Trip picker if trip pack */}
            {exportType === 'trip' && (
              <div>
                <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                  SELECT TRIP TO EXPORT
                </label>
                <select
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  {(trips || []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.destination})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              disabled={isExporting || (exportType === 'trip' && !selectedTripId)}
              onClick={handleExport}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px' }}
            >
              <Download size={16} />
              <span>{isExporting ? 'Generating Pack...' : 'Download Record Pack'}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: 1.5 }}>
              Import a validated Veya pack. Review record contents and select how duplicate or conflicting items should be resolved.
            </p>

            {/* File upload */}
            <label
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#FBFBFB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <input type="file" accept=".json" onChange={handleFileSelect} style={{ display: 'none' }} />
              <Upload size={22} color="var(--primary)" />
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                {importFile ? importFile.name : 'Select .travelnest-pack.json'}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--secondary)' }}>
                Offline validation and local import
              </div>
            </label>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.82rem',
                }}
              >
                {validationErrors.map((err, idx) => (
                  <div key={idx}>⚠️ {err}</div>
                ))}
              </div>
            )}

            {/* Candidate Pack Preview */}
            {candidatePack && (
              <div
                style={{
                  backgroundColor: '#F5F5F7',
                  borderRadius: '16px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{candidatePack.manifest.title}</div>
                {candidatePack.manifest.description && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                    {candidatePack.manifest.description}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {candidatePack.data.trips && (
                    <span className="badge" style={{ fontSize: '11px', backgroundColor: '#FFFFFF' }}>
                      {candidatePack.data.trips.length} Trip
                    </span>
                  )}
                  {candidatePack.data.recipes && (
                    <span className="badge" style={{ fontSize: '11px', backgroundColor: '#FFFFFF' }}>
                      {candidatePack.data.recipes.length} Recipes
                    </span>
                  )}
                  {candidatePack.data.transportLegs && (
                    <span className="badge" style={{ fontSize: '11px', backgroundColor: '#FFFFFF' }}>
                      {candidatePack.data.transportLegs.length} Transport Legs
                    </span>
                  )}
                  {candidatePack.data.itineraryEvents && (
                    <span className="badge" style={{ fontSize: '11px', backgroundColor: '#FFFFFF' }}>
                      {candidatePack.data.itineraryEvents.length} Activities
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Conflict Strategy Selector */}
            {candidatePack && (
              <div>
                <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                  CONFLICT RESOLUTION STRATEGY
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(
                    [
                      {
                        id: 'skip',
                        title: 'Skip Existing Records',
                        desc: 'Preserves your current records untouched; imports only non-conflicting items.',
                      },
                      {
                        id: 'overwrite',
                        title: 'Overwrite Matching Records',
                        desc: 'Updates matching items in-place with the imported version.',
                      },
                      {
                        id: 'copy',
                        title: 'Create Clean Copy',
                        desc: 'Generates brand-new IDs so you keep both the original and imported copy.',
                      },
                    ] as const
                  ).map((strat) => (
                    <label
                      key={strat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: conflictStrategy === strat.id ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                        backgroundColor: conflictStrategy === strat.id ? '#F9F9FA' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="conflict"
                        checked={conflictStrategy === strat.id}
                        onChange={() => setConflictStrategy(strat.id)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{strat.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--secondary)' }}>{strat.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Success Results Banner */}
            {importResult && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '14px',
                  color: '#15803d',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} />
                  <span>Import Completed Successfully</span>
                </div>
                <div>
                  • {importResult.importedCount} new items imported
                  {importResult.copiedCount > 0 && ` · ${importResult.copiedCount} copied`}
                  {importResult.overwrittenCount > 0 && ` · ${importResult.overwrittenCount} updated`}
                  {importResult.skippedCount > 0 && ` · ${importResult.skippedCount} skipped`}
                </div>
              </div>
            )}

            {/* Import Button */}
            {candidatePack && !importResult && (
              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <FolderSync size={16} />
                <span>{isImporting ? 'Importing Records...' : 'Execute Import'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};
