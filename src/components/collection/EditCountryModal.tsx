import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CountryDossier } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCountryCover, getCountryFlag } from '../../utils/countryUtils';
import { findCountryByNameOrCode } from '../../data/countriesData';
import { ModalPortal } from '../common/ModalPortal';
import { Image, FileText, Check, X, Sparkles } from 'lucide-react';

interface EditCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryName: string;
}

const PRESET_COVERS = [
  { label: 'Default', url: '' },
  { label: 'Alpine Peaks', url: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80' },
  { label: 'Historic Streets', url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80' },
  { label: 'Coastline', url: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=800&q=80' },
  { label: 'Serene Nature', url: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=800&q=80' },
  { label: 'Night Lights', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80' },
];

export const EditCountryModal: React.FC<EditCountryModalProps> = ({
  isOpen,
  onClose,
  countryName,
}) => {
  const { showToast } = useApp();

  const countryInfo = findCountryByNameOrCode(countryName);
  const canonicalName = countryInfo ? countryInfo.name : countryName;

  // Retrieve existing dossier from database
  const dossier = useLiveQuery(async () => {
    if (!canonicalName) return undefined;
    let found = await db.countries.get(canonicalName.toLowerCase());
    if (!found) {
      found = await db.countries.where('name').equalsIgnoreCase(canonicalName).first();
    }
    if (!found && countryName !== canonicalName) {
      found = await db.countries.where('name').equalsIgnoreCase(countryName).first();
    }
    return found;
  }, [canonicalName, countryName]);

  const [coverImage, setCoverImage] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialCover = dossier?.coverImage || getCountryCover(canonicalName);
      setCoverImage(initialCover);
      setNotes(dossier?.notes || '');
      setIsSubmitting(false);
    }
  }, [isOpen, dossier, canonicalName]);

  if (!isOpen) return null;

  const flag = countryInfo?.flag || dossier?.flag || getCountryFlag(canonicalName) || '🌍';
  const code = countryInfo?.code || dossier?.code;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const finalCover = coverImage.trim() || getCountryCover(canonicalName);
      await db.saveCountry(
        canonicalName,
        finalCover,
        code,
        notes.trim()
      );

      showToast(`Updated "${canonicalName}" folder!`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Error saving country details: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-sheet"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div className="sheet-drag-handle" />

          {/* Top Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: '1px solid var(--stroke)',
              backgroundColor: 'var(--surface-neutral-1)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-ghost"
              style={{ fontSize: '0.88rem', padding: '0 4px', color: 'var(--secondary)' }}
            >
              Cancel
            </button>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                Edit Country Folder
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--secondary)' }}>
                {canonicalName} {code ? `· [${code}]` : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="btn btn-ghost"
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                padding: '0 4px',
                color: 'var(--primary)',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form
            onSubmit={handleSave}
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto',
              flex: 1,
            }}
          >
            {/* Visual Cover Preview Card */}
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                Cover Preview
              </label>
              <div
                style={{
                  height: '140px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundImage: `linear-gradient(to bottom, rgba(17, 17, 17, 0.25), rgba(17, 17, 17, 0.85)), url(${coverImage || getCountryCover(canonicalName)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--stroke)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {code && (
                    <span
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        color: '#111111',
                        borderRadius: '6px',
                        padding: '2px 7px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {code}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.25rem' }}>{flag}</span>
                    <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.15rem', margin: 0 }}>
                      {canonicalName}
                    </h4>
                  </div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.74rem' }}>
                    Finds & Research Folder
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Cover Photo URL */}
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Image size={12} />
                <span>Cover Photo URL</span>
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="input"
                style={{
                  height: '42px',
                  fontSize: '0.85rem',
                  borderRadius: '12px',
                  padding: '0 12px',
                  backgroundColor: '#FFFFFF',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '4px', display: 'block' }}>
                Paste any high-resolution image link to personalize this folder.
              </span>
            </div>

            {/* Curated Preset Covers */}
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={12} />
                <span>Curated Photo Presets</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_COVERS.map((preset) => {
                  const targetUrl = preset.url || getCountryCover(canonicalName);
                  const isSelected = coverImage === targetUrl;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCoverImage(targetUrl)}
                      className={`filter-chip ${isSelected ? 'active' : ''}`}
                      style={{
                        fontSize: '0.74rem',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      <span>{preset.label}</span>
                      {isSelected && <Check size={11} strokeWidth={2.4} style={{ marginLeft: '3px' }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destination Notes / Vision */}
            <div>
              <label className="label-micro" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FileText size={12} />
                <span>Destination Vision & Notes</span>
              </label>
              <textarea
                placeholder="Notes for this country, must-try food, seasonal tips, transport passes, or wishlist spots..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="input"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '0.86rem',
                  lineHeight: 1.45,
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                height: '44px',
                borderRadius: '12px',
                marginTop: '6px',
                fontSize: '0.88rem',
                fontWeight: 700,
              }}
            >
              <span>{isSubmitting ? 'Saving...' : 'Save Folder Details'}</span>
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
