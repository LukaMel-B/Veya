import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { CollectionItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateDDmmmYY, formatDateRangeDDmmmYY } from '../../utils/dateUtils';
import { getCategoryBadge, getCountryFlag } from '../../utils/countryUtils';
import { getCollectionItemTripAssociation } from '../../utils/collectionAssociation';
import { SaveItemModal } from './SaveItemModal';
import { AssignTripModal } from './AssignTripModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  ChevronLeft,
  Calendar,
  Globe,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  Tag,
  Luggage,
  MapPin,
  FileText,
  Copy,
  Check,
  Share2,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface CollectionItemDetailViewProps {
  itemId: string;
  onBack: () => void;
}

export const CollectionItemDetailView: React.FC<CollectionItemDetailViewProps> = ({
  itemId,
  onBack,
}) => {
  const { showToast, setActiveTripId, setActiveTab } = useApp();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignTripModalOpen, setIsAssignTripModalOpen] = useState(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);
  const [hasCopiedNotes, setHasCopiedNotes] = useState(false);

  // Live query for the collection item / field note
  const item = useLiveQuery(
    () => db.collectionItems.get(itemId),
    [itemId]
  );

  // Live query for all trips to authoritatively resolve trip association
  const allTrips = useLiveQuery(() => db.trips.toArray(), []) || [];

  // Authoritative single source of truth for trip association
  const association = item ? getCollectionItemTripAssociation(item, allTrips) : null;

  // Live query for linked place if attached
  const linkedPlace = useLiveQuery(
    async () => (item?.placeId ? await db.places.get(item.placeId) : undefined),
    [item?.placeId]
  );

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            padding: '6px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.88rem',
            fontWeight: 600,
            alignSelf: 'flex-start',
            color: 'var(--primary)',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2} />
          <span>Back</span>
        </button>

        <div
          className="travelnest-card"
          style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--surface-neutral-1)', margin: 0 }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Field Note Not Found</h3>
          <p style={{ color: 'var(--secondary)', fontSize: '0.84rem', marginTop: '6px' }}>
            This saved collection item may have been removed or archived.
          </p>
          <button
            onClick={onBack}
            className="btn btn-primary"
            style={{ marginTop: '16px', minHeight: '42px', borderRadius: '9999px' }}
          >
            Return to Overview
          </button>
        </div>
      </div>
    );
  }

  const categoryBadge = getCategoryBadge(item.category || 'place');
  const countryFlag = getCountryFlag(item.country);
  const displayCountry = item.country?.trim() || 'General';
  const itemTags = (Array.isArray(item.tags) ? item.tags : [])
    .filter((t): t is string => typeof t === 'string' && Boolean(t.trim()));

  // Delete Item
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await db.collectionItems.delete(item.id);
      showToast('Field note deleted.', 'success');
      setShowDeleteConfirm(false);
      onBack();
    } catch (err) {
      console.error('Delete collection item error:', err);
      showToast('Failed to delete note', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Unlink item from trip safely preserving all data and collection membership
  const handleUnlinkTrip = async () => {
    if (!item) return;
    setIsUnlinking(true);
    try {
      await db.collectionItems.update(item.id, {
        tripId: undefined,
        status: item.status === 'archived' ? 'archived' : 'inbox',
        isPlanned: false,
      });
      showToast(`Removed from trip. Kept in ${displayCountry} finds.`, 'info');
      setShowUnlinkConfirm(false);
    } catch (err: any) {
      showToast('Failed to unlink from trip: ' + err.message, 'error');
    } finally {
      setIsUnlinking(false);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    if (!item.url) return;
    try {
      await navigator.clipboard.writeText(item.url);
      setHasCopiedUrl(true);
      showToast('Link copied to clipboard', 'success');
      setTimeout(() => setHasCopiedUrl(false), 2000);
    } catch {
      showToast('Unable to copy link', 'error');
    }
  };

  // Copy notes to clipboard
  const handleCopyNotes = async () => {
    if (!item.notes) return;
    try {
      await navigator.clipboard.writeText(item.notes);
      setHasCopiedNotes(true);
      showToast('Field notes copied', 'success');
      setTimeout(() => setHasCopiedNotes(false), 2000);
    } catch {
      showToast('Unable to copy notes', 'error');
    }
  };

  // Share note via native Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.notes || item.title,
          url: item.url || window.location.href,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopyNotes();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' }}>
      {/* Top Cupertino Page Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '2px',
          minHeight: '40px',
        }}
      >
        <button
          onClick={onBack}
          className="btn btn-ghost"
          style={{
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--primary)',
          }}
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
          <span>Finds</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleShare}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9999px', color: 'var(--primary)' }}
            title="Share field note"
          >
            <Share2 size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9999px', color: 'var(--primary)' }}
            title="Edit field note"
          >
            <Edit2 size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-ghost"
            style={{ padding: '7px', borderRadius: '9999px', color: '#D9383A' }}
            title="Delete field note"
          >
            <Trash2 size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Hero Media or Editorial Category Header */}
      {item.imageUrl ? (
        <div
          className="travelnest-card"
          style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: '#111111',
            margin: 0,
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '240px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)',
              }}
            />

            {/* Overlaid Badges */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  backgroundColor: 'rgba(17, 17, 17, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <span>{categoryBadge.icon}</span>
                <span>{categoryBadge.label}</span>
              </span>

              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  color: '#111111',
                  borderRadius: '9999px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {countryFlag ? `${countryFlag} ` : ''}{displayCountry}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Editorial Header for notes without cover image */
        <div
          className="travelnest-card"
          style={{
            padding: '20px',
            margin: 0,
            backgroundColor: 'var(--surface-neutral-1)',
            borderRadius: '20px',
            border: '1px solid var(--stroke)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '1.4rem',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--stroke)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {categoryBadge.icon}
            </span>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {categoryBadge.label}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>
                {displayCountry}
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--stroke)',
              color: 'var(--primary)',
            }}
          >
            {item.type ? item.type.toUpperCase() : 'NOTE'}
          </span>
        </div>
      )}

      {/* Main Title & Metadata Card */}
      <div
        className="travelnest-card"
        style={{
          padding: '20px',
          margin: 0,
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.25,
            color: 'var(--primary)',
            margin: 0,
          }}
        >
          {item.title || 'Untitled Field Note'}
        </h1>

        {/* Metadata Chips Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              color: 'var(--secondary)',
              fontWeight: 500,
            }}
          >
            <Calendar size={13} strokeWidth={2} />
            <span>Saved {formatDateDDmmmYY(item.createdAt)}</span>
          </span>

          <span style={{ color: 'var(--stroke)' }}>•</span>

          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: association?.isAssigned ? 'rgba(34, 197, 94, 0.1)' : 'var(--surface-neutral-1)',
              color: association?.isAssigned ? '#16a34a' : 'var(--secondary)',
              border: association?.isAssigned ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid var(--stroke)',
              fontWeight: 600,
            }}
          >
            {association?.isAssigned
              ? '🎒 Assigned to Trip'
              : item.status === 'archived'
              ? '📦 Archived'
              : '📥 Global Spot'}
          </span>

          {item.isPlanned && (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#2563eb',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontWeight: 600,
              }}
            >
              🗓️ In Itinerary
            </span>
          )}
        </div>
      </div>

      {/* Field Notes Section */}
      <div className="travelnest-card" style={{ padding: '20px', margin: 0, backgroundColor: '#ffffff', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} strokeWidth={2} color="var(--primary)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              Field Notes & Observations
            </h3>
          </div>
          {item.notes && (
            <button
              onClick={handleCopyNotes}
              className="btn btn-ghost"
              style={{ padding: '2px 6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '3px' }}
              title="Copy notes"
            >
              {hasCopiedNotes ? <Check size={12} strokeWidth={2} color="#16a34a" /> : <Copy size={12} strokeWidth={2} />}
              <span>{hasCopiedNotes ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {item.notes ? (
          <div
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.65,
              color: 'var(--primary)',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
          >
            {item.notes}
          </div>
        ) : (
          <div
            style={{
              padding: '20px 12px',
              textAlign: 'center',
              backgroundColor: 'var(--surface-neutral-1)',
              borderRadius: '12px',
              border: '1px dashed var(--stroke)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--secondary)' }}>
              No notes recorded yet.
            </p>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-ghost"
              style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)' }}
            >
              + Add notes & impressions
            </button>
          </div>
        )}
      </div>

      {/* External Link Card (if URL exists) */}
      {item.url && (
        <div className="travelnest-card" style={{ padding: '18px 20px', margin: 0, backgroundColor: '#ffffff', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Globe size={15} strokeWidth={2} color="var(--primary)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              Web Reference & Source
            </h3>
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-neutral-1)',
              border: '1px solid var(--stroke)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--primary)',
                fontWeight: 500,
                wordBreak: 'break-all',
                lineHeight: 1.4,
              }}
            >
              🔗 {item.url}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  flex: 1,
                  minHeight: '38px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <span>Visit Source</span>
                <ExternalLink size={13} strokeWidth={2} />
              </a>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="btn btn-secondary"
                style={{
                  padding: '0 14px',
                  minHeight: '38px',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {hasCopiedUrl ? <Check size={13} strokeWidth={2} color="#16a34a" /> : <Copy size={13} strokeWidth={2} />}
                <span>{hasCopiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Section */}
      {itemTags.length > 0 && (
        <div className="travelnest-card" style={{ padding: '18px 20px', margin: 0, backgroundColor: '#ffffff', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Tag size={15} strokeWidth={2} color="var(--primary)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              Tags & Labels
            </h3>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {itemTags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--surface-neutral-1)',
                  border: '1px solid var(--stroke)',
                  color: 'var(--primary)',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Linked Trip Association */}
      <div className="travelnest-card" style={{ padding: '18px 20px', margin: 0, backgroundColor: '#ffffff', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Luggage size={15} strokeWidth={2} color="var(--primary)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              Trip Association
            </h3>
          </div>
          {association?.isAssigned && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#16a34a',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(34, 197, 94, 0.2)',
              }}
            >
              Linked Journey
            </span>
          )}
        </div>

        {association?.isAssigned && association.linkedTrip ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              onClick={() => {
                setActiveTripId(association.linkedTrip!.id);
                setActiveTab('trips');
                onBack();
              }}
              className="cupertino-row"
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--surface-neutral-1)',
                border: '1px solid var(--stroke)',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#111111',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '1.1rem',
                  }}
                >
                  {getCountryFlag(association.linkedTrip.country || association.linkedTrip.destination) || '✈️'}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {association.linkedTrip.name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '2px' }}>
                    {association.linkedTrip.destination} · {formatDateRangeDDmmmYY(association.linkedTrip.startDate, association.linkedTrip.endDate)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600 }}>
                <span>View</span>
                <ArrowRight size={14} strokeWidth={2} />
              </div>
            </div>

            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--secondary)',
                backgroundColor: '#f8fafc',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--stroke)',
                lineHeight: 1.4,
              }}
            >
              Stored in your <strong>{displayCountry}</strong> collection · Explicitly associated with journey <strong>{association.linkedTrip.name}</strong>.
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => setIsAssignTripModalOpen(true)}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  fontSize: '0.76rem',
                  padding: '7px 12px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Luggage size={13} strokeWidth={2} />
                <span>Change Trip</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUnlinkConfirm(true)}
                className="btn btn-ghost"
                style={{
                  fontSize: '0.76rem',
                  padding: '7px 12px',
                  borderRadius: '9999px',
                  color: '#dc2626',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>Remove from Trip</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '16px 14px',
              backgroundColor: 'var(--surface-neutral-1)',
              borderRadius: '12px',
              border: '1px dashed var(--stroke)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                Global Field Note
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--secondary)', marginTop: '2px' }}>
                Stored in your {displayCountry} collection. Not associated with any trip.
              </div>
            </div>

            <button
              onClick={() => setIsAssignTripModalOpen(true)}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '6px 14px', borderRadius: '9999px', flexShrink: 0 }}
            >
              Assign to Trip
            </button>
          </div>
        )}
      </div>

      {/* Linked Place (if applicable) */}
      {linkedPlace && (
        <div className="travelnest-card" style={{ padding: '18px 20px', margin: 0, backgroundColor: '#ffffff', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <MapPin size={15} strokeWidth={2} color="var(--primary)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              Linked Saved Place
            </h3>
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-neutral-1)',
              border: '1px solid var(--stroke)',
              borderRadius: '12px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--primary)' }}>
              {linkedPlace.name}
            </div>
            {linkedPlace.address && (
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '3px' }}>
                {linkedPlace.address}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <SaveItemModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          itemToEdit={item}
          preselectedCountry={item.country}
          preselectedTripId={item.tripId}
        />
      )}

      {/* Assign Trip Modal */}
      {isAssignTripModalOpen && (
        <AssignTripModal
          isOpen={isAssignTripModalOpen}
          onClose={() => setIsAssignTripModalOpen(false)}
          item={item}
        />
      )}

      {/* Unlink from Trip Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUnlinkConfirm}
        title="Remove from trip?"
        kicker="DETACH FROM TRIP"
        message={`This will detach this spot from ${association?.tripName || 'the trip'}. It will remain safely saved in your ${displayCountry} collection.`}
        confirmText="Remove from Trip"
        cancelText="Keep Linked"
        variant="warning"
        icon="alert"
        isLoading={isUnlinking}
        onConfirm={handleUnlinkTrip}
        onCancel={() => setShowUnlinkConfirm(false)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this field note?"
        kicker="IRREVERSIBLE"
        message="This will remove this item from your saved collection. Associated itinerary items and trips will remain intact."
        confirmText="Delete"
        cancelText="Keep Note"
        variant="destructive"
        icon="trash"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
