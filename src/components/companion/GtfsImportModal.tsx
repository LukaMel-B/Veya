import React, { useState } from 'react';
import { db } from '../../db/database';
import { parseGtfsZip, parseTimetableJson, convertTransitEntryToLeg } from '../../utils/gtfsParser';
import type { ParsedTimetableFeed, TransitRoute, TransitScheduleEntry, TransportLeg } from '../../types';
import { X, Upload, Train, FileText, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface GtfsImportModalProps {
  tripId: string;
  dayNumber?: number;
  date?: string;
  onClose: () => void;
  onImportComplete?: (importedLegsCount: number) => void;
}

export const GtfsImportModal: React.FC<GtfsImportModalProps> = ({
  tripId,
  dayNumber = 1,
  date,
  onClose,
  onImportComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<ParsedTimetableFeed | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('all');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        const parsed = await parseGtfsZip(buffer, file.name.replace(/\.zip$/i, ''));
        setFeed(parsed);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = parseTimetableJson(text);
        setFeed(parsed);
      } else {
        throw new Error('Please upload a valid GTFS (.zip) file or timetable (.json) file.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to parse transit feed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectEntry = (entryKey: string) => {
    const next = new Set(selectedEntries);
    if (next.has(entryKey)) {
      next.delete(entryKey);
    } else {
      next.add(entryKey);
    }
    setSelectedEntries(next);
  };

  const filteredEntries = (feed?.entries || []).filter((entry) => {
    if (selectedRouteId === 'all') return true;
    return entry.routeId === selectedRouteId;
  });

  const handleImportSelected = async () => {
    if (!feed || selectedEntries.size === 0) return;

    const routeMap = new Map<string, TransitRoute>(feed.routes.map((r) => [r.id, r]));
    const legsToImport: TransportLeg[] = [];

    let order = 0;
    for (const entry of feed.entries) {
      const key = `${entry.tripId}_${entry.fromStopId}_${entry.toStopId}`;
      if (selectedEntries.has(key)) {
        const route = routeMap.get(entry.routeId);
        const leg = convertTransitEntryToLeg(entry, route, tripId, {
          dayNumber,
          date,
          orderIndex: order++,
        });
        legsToImport.push(leg);
      }
    }

    if (legsToImport.length > 0) {
      await db.transportLegs.bulkAdd(legsToImport);
      if (onImportComplete) onImportComplete(legsToImport.length);
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div
        className="modal-overlay"
        onClick={onClose}
      >
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '560px',
            backgroundColor: '#FFFFFF',
            padding: '20px',
          }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="label-micro">OFFICIAL TIMETABLE & GTFS</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '2px 0 0 0' }}>
              Import Transit Timetable
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {!feed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.86rem', color: 'var(--secondary)', lineHeight: 1.5, margin: 0 }}>
              Import official transit schedules directly into your trip without backend servers. Upload a standard
              GTFS Static ZIP package (e.g. from regional rail / bus authorities) or a timetable JSON file.
            </p>

            <label
              style={{
                border: '2px dashed var(--border-subtle)',
                borderRadius: '16px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: loading ? 'wait' : 'pointer',
                backgroundColor: '#FBFBFB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="file"
                accept=".zip,.json"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Upload size={20} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {loading ? 'Parsing GTFS CSV files...' : 'Select GTFS ZIP or JSON'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                Processed 100% offline and locally on your device
              </div>
            </label>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '0.84rem',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Feed Header */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#F5F5F7',
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{feed.feedName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                  {feed.routes.length} Routes · {feed.stops.length} Stops · {feed.entries.length} Departures
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeed(null)}
                className="btn btn-ghost"
                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              >
                Change File
              </button>
            </div>

            {/* Route Filter */}
            {feed.routes.length > 0 && (
              <div>
                <label className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                  FILTER BY ROUTE
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  <option value="all">All Lines ({feed.routes.length})</option>
                  {feed.routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shortName}: {r.longName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Timetable Entries List */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEntries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                  No schedule entries found for this route.
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const key = `${entry.tripId}_${entry.fromStopId}_${entry.toStopId}`;
                  const isChecked = selectedEntries.has(key);

                  return (
                    <div
                      key={key}
                      onClick={() => toggleSelectEntry(key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isChecked ? '1.5px solid #111111' : '1px solid var(--border-subtle)',
                        backgroundColor: isChecked ? '#F8F9FA' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: isChecked ? 'none' : '1.5px solid #BBBBBB',
                            backgroundColor: isChecked ? '#111111' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                          }}
                        >
                          {isChecked && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 600 }}>
                            <span>{entry.fromStopName}</span>
                            <ArrowRight size={13} color="var(--secondary)" />
                            <span>{entry.toStopName}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                            {entry.departureTime} → {entry.arrivalTime}
                            {entry.headsign ? ` · ${entry.headsign}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedEntries.size === 0}
                onClick={handleImportSelected}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Import {selectedEntries.size} Selected {selectedEntries.size === 1 ? 'Leg' : 'Legs'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </ModalPortal>
  );
};
