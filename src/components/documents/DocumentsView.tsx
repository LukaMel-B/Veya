import React, { useState, useRef, useMemo } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip, VaultDocument } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY } from '../../utils/dateUtils';
import {
  FileText,
  FileCheck,
  Upload,
  Trash2,
  Eye,
  Download,
  Image as ImageIcon,
  Search,
  Plus,
  X,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface DocumentsViewProps {
  trip: Trip;
}

interface PendingUpload {
  file: File;
  filename: string;
  dataUrl: string;
  tags: string[];
}

const QUICK_TAG_SUGGESTIONS = [
  'Flight',
  'Hotel',
  'Visa',
  'Insurance',
  'Ticket',
  'Voucher',
  'Passport',
  'Car Rental',
  'Activity',
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({ trip }) => {
  const { showToast, showConfirm } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);

  // Upload dialog state
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  const docs = useLiveQuery(
    () => db.documents.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  const allDocTags = useMemo(
    () => Array.from(new Set((docs || []).flatMap((d) => d.tags || []))),
    [docs]
  );

  const filteredDocs = useMemo(() => {
    return (docs || []).filter((doc) => {
      if (selectedTag && !doc.tags.includes(selectedTag)) return false;
      if (searchDocQuery && !doc.filename.toLowerCase().includes(searchDocQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [docs, selectedTag, searchDocQuery]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File exceeds 5MB offline storage limit.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only PDF, JPG, and PNG are supported for offline vault.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const initialTags: string[] = ['Document'];
      const lower = file.name.toLowerCase();
      if (lower.includes('flight') || lower.includes('boarding')) initialTags.push('Flight');
      if (lower.includes('hotel') || lower.includes('voucher')) initialTags.push('Hotel');
      if (lower.includes('visa')) initialTags.push('Visa');

      setPendingUpload({
        file,
        filename: file.name,
        dataUrl: base64Data,
        tags: initialTags,
      });
      setNewTagInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleAddTagToPending = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (!trimmed || !pendingUpload) return;
    if (!pendingUpload.tags.includes(trimmed)) {
      setPendingUpload({
        ...pendingUpload,
        tags: [...pendingUpload.tags, trimmed],
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTagFromPending = (tagToRemove: string) => {
    if (!pendingUpload) return;
    setPendingUpload({
      ...pendingUpload,
      tags: pendingUpload.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleConfirmUpload = async () => {
    if (!pendingUpload) return;
    try {
      const finalName = pendingUpload.filename.trim() || pendingUpload.file.name;
      const newDoc: VaultDocument = {
        id: 'doc-' + Date.now(),
        tripId: trip.id,
        filename: finalName,
        mimeType: pendingUpload.file.type,
        fileSize: pendingUpload.file.size,
        dataUrl: pendingUpload.dataUrl,
        tags: pendingUpload.tags.length > 0 ? pendingUpload.tags : ['Document'],
        createdAt: new Date().toISOString(),
      };

      await db.documents.add(newDoc);
      showToast(`Document "${finalName}" saved with ${newDoc.tags.length} tag(s)!`, 'success');
      setPendingUpload(null);
    } catch (err: any) {
      showToast('Upload error: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await showConfirm({
      title: `Delete "${name}"?`,
      kicker: 'IRREVERSIBLE',
      message: 'This document file will be permanently removed from your offline vault.',
      warning: 'This action cannot be undone. Make sure you have a local copy if needed.',
      confirmText: 'Delete Document',
      cancelText: 'Keep Document',
      variant: 'destructive',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        await db.documents.delete(id);
        showToast('Document deleted.', 'info');
      } catch (err: any) {
        showToast('Error deleting document: ' + err.message, 'error');
      }
    }
  };

  const getDocIcon = (mime: string) => {
    if (mime.includes('image')) return <ImageIcon size={20} color="var(--primary)" />;
    if (mime.includes('pdf')) return <FileText size={20} color="var(--primary)" />;
    return <FileCheck size={20} color="var(--primary)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--primary)' }}>
          Document Vault
        </h3>
      </div>

      {/* Pill Search Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--neutral-carbon)',
          }}
        />
        <input
          type="text"
          placeholder="Search documents by name..."
          value={searchDocQuery}
          onChange={(e) => setSearchDocQuery(e.target.value)}
          className="input"
          style={{
            height: '42px',
            minHeight: '42px',
            paddingLeft: '38px',
            fontSize: '0.84rem',
            borderRadius: '9999px',
            background: 'var(--surface-neutral-1)',
          }}
        />
      </div>

      {/* Tag Filters */}
      {allDocTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '4px',
            whiteSpace: 'nowrap',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {allDocTags.map((tag) => {
            const isSelected = selectedTag === tag;
            const tagCount = (docs || []).filter((d) => d.tags?.includes(tag)).length;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`filter-chip ${isSelected ? 'active' : ''}`}
                style={{
                  padding: '5px 14px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <span>#{tag}</span>
                <span className="chip-count-bubble">{tagCount}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Documents List */}
      {filteredDocs && filteredDocs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="travelnest-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 18px',
                gap: '12px',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-neutral-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  >
                    {getDocIcon(doc.mimeType)}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '0.94rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        margin: '0 0 3px',
                        color: 'var(--primary)',
                      }}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--neutral-carbon)' }}>
                      {(doc.fileSize / 1024).toFixed(0)} KB {doc.createdAt ? `• ${formatDateDDmmmYY(doc.createdAt)}` : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="btn btn-primary btn-sm"
                    style={{
                      height: '32px',
                      minHeight: '32px',
                      padding: '0 14px',
                      backgroundColor: '#111111',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    <Eye size={13} />
                    <span>View</span>
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id, doc.filename)}
                    className="btn-icon"
                    style={{
                      width: '32px',
                      height: '32px',
                      minHeight: '32px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--surface-neutral-1)',
                      border: '1px solid var(--stroke)',
                      color: 'var(--secondary)',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={`Delete ${doc.filename}`}
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Tag Badges - consistent light grey bg with black/grey text */}
              {doc.tags && doc.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                  {doc.tags.map((t) => (
                    <span
                      key={t}
                      onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: 'var(--surface-neutral-1)',
                        border: '1px solid var(--stroke)',
                        color: 'var(--primary)',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        padding: '2px 9px',
                        borderRadius: '9999px',
                        letterSpacing: '0.01em',
                        cursor: 'pointer',
                        transition: 'all 130ms ease',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="travelnest-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <FileText size={36} color="var(--neutral-carbon)" style={{ margin: '0 auto 10px', opacity: 0.5 }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--primary)' }}>
            No documents stored yet
          </h4>
          <p style={{ color: 'var(--neutral-carbon)', fontSize: '0.82rem', margin: 0 }}>
            Upload PDFs, tickets, and booking confirmations to keep them available offline.
          </p>
        </div>
      )}

      {/* Upload Details Modal with Tag Input */}
      {pendingUpload && (
        <div className="modal-overlay" onClick={() => setPendingUpload(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sheet-drag-handle" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
                Add Document Details & Tags
              </h3>
              <button onClick={() => setPendingUpload(null)} className="btn-ghost btn-sm">
                Cancel
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-micro" style={{ display: 'block', marginBottom: '6px' }}>Document Name</label>
                <input
                  type="text"
                  value={pendingUpload.filename}
                  onChange={(e) => setPendingUpload({ ...pendingUpload, filename: e.target.value })}
                  className="input"
                  placeholder="e.g. Flight_Ticket_ANA.pdf"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '4px', display: 'block' }}>
                  {(pendingUpload.file.size / 1024).toFixed(0)} KB • {pendingUpload.file.type}
                </span>
              </div>

              <div>
                <label className="label-micro" style={{ display: 'block', marginBottom: '6px' }}>Document Tags</label>
                
                {/* Active tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px', marginBottom: '10px' }}>
                  {pendingUpload.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: 'var(--surface-neutral-1)',
                        border: '1px solid var(--stroke)',
                        color: 'var(--primary)',
                        fontSize: '0.76rem',
                        fontWeight: 500,
                        padding: '3px 10px',
                        borderRadius: '9999px',
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTagFromPending(tag)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--secondary)',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Tag Input */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToPending(newTagInput);
                      }
                    }}
                    placeholder="Type tag (e.g. Boarding Pass) & Enter"
                    className="input"
                    style={{ flex: 1, fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTagToPending(newTagInput)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0 14px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {/* Suggested quick tags */}
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--secondary)', display: 'block', marginBottom: '6px' }}>
                    Quick suggestions:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {QUICK_TAG_SUGGESTIONS.map((sug) => {
                      const isAdded = pendingUpload.tags.includes(sug);
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              handleRemoveTagFromPending(sug);
                            } else {
                              handleAddTagToPending(sug);
                            }
                          }}
                          className={`btn ${isAdded ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                          style={{
                            padding: '3px 10px',
                            fontSize: '0.72rem',
                            borderRadius: '9999px',
                            minHeight: '26px',
                          }}
                        >
                          {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPendingUpload(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUpload}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  Save to Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Sheet Modal */}
      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-drag-handle" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px 14px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px', color: 'var(--primary)' }}>
                {previewDoc.filename}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="btn-ghost btn-sm"
              >
                Done
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px' }}>
              {previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.filename}
                  style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '16px', border: '1px solid var(--border)', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      backgroundColor: 'var(--surface-neutral-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <FileText size={32} color="var(--primary)" />
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem', margin: '0 0 4px', color: 'var(--primary)' }}>
                    PDF Document Ready
                  </h4>
                  <p style={{ color: 'var(--neutral-carbon)', fontSize: '0.82rem', margin: '0 0 20px' }}>
                    Stored securely in your browser's offline storage.
                  </p>
                  <a
                    href={previewDoc.dataUrl}
                    download={previewDoc.filename}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} />
                    <span>Download File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/png,image/jpeg,image/webp"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />

      <FloatingActionButton
        onClick={() => fileInputRef.current?.click()}
        icon={<Upload size={24} strokeWidth={2.4} />}
        label="Upload Document"
      />
    </div>
  );
};
