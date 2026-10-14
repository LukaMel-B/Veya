import React, { useState } from 'react';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Trip } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatDateRangeDDmmmYY } from '../../utils/dateUtils';
import {
  Copy,
  Check,
  Shield,
  Share2,
} from 'lucide-react';
import { FloatingActionButton } from '../common/FloatingActionButton';

interface ShareViewProps {
  trip: Trip;
}

export const ShareView: React.FC<ShareViewProps> = ({ trip }) => {
  const { showToast } = useApp();

  const [includeRefNumbers, setIncludeRefNumbers] = useState(false);
  const [includeBudgets, setIncludeBudgets] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [copied, setCopied] = useState(false);

  const events = useLiveQuery(
    () => db.itineraryEvents.where('tripId').equals(trip.id).sortBy('orderIndex'),
    [trip.id]
  );

  const bookings = useLiveQuery(
    () => db.bookings.where('tripId').equals(trip.id).toArray(),
    [trip.id]
  );

  const generateWhatsAppText = () => {
    let text = `✈️ *${trip.name.toUpperCase()}*\n`;
    text += `📍 Destination: ${trip.destination}\n`;
    text += `📅 Dates: ${formatDateRangeDDmmmYY(trip.startDate, trip.endDate)}\n`;
    text += `👥 Travelers: ${trip.travelers.join(', ')}\n\n`;

    if (includeBudgets) {
      text += `💰 Planned Budget: ₹${trip.plannedBudget.toLocaleString()} INR\n\n`;
    }

    if (bookings && bookings.length > 0) {
      text += `🏨 *KEY BOOKINGS*\n`;
      bookings.forEach((b) => {
        text += `• ${b.title} (${b.provider})`;
        if (includeRefNumbers) {
          text += ` [Ref: ${b.refNumber}]`;
        }
        text += `\n`;
      });
      text += `\n`;
    }

    text += `🗓️ *ITINERARY*\n\n`;

    const eventsByDay: Record<number, typeof events> = {};
    (events || []).forEach((ev) => {
      if (!eventsByDay[ev.dayNumber]) eventsByDay[ev.dayNumber] = [];
      eventsByDay[ev.dayNumber]!.push(ev);
    });

    const sortedDays = Object.keys(eventsByDay).map(Number).sort((a, b) => a - b);

    if (sortedDays.length > 0) {
      sortedDays.forEach((dayNum) => {
        const dayEvents = eventsByDay[dayNum] || [];
        const dayTitles = dayEvents.map((ev) => {
          let str = ev.title;
          if (includeNotes && ev.notes && !ev.title.includes(ev.notes)) {
            str += ` – ${ev.notes}`;
          }
          return str;
        });

        text += `📍 Day ${dayNum}: ${dayTitles.join(', ')}\n\n`;
      });
    } else {
      text += `_No activities scheduled._\n\n`;
    }

    return text.trimEnd();
  };

  const plainText = generateWhatsAppText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      showToast('Copied to clipboard for WhatsApp', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Clipboard access unavailable.', 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: plainText,
        });
        showToast('Shared successfully!', 'success');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Editorial Header */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--primary)' }}>
          WhatsApp Share
        </h3>
      </div>

      {/* Sharing Preferences */}
      <div className="travelnest-card" style={{ padding: '18px 20px' }}>
        <span className="label-micro" style={{ marginBottom: '12px', display: 'block' }}>
          SHARING PARAMETERS
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            className="notion-checklist-row"
            onClick={() => setIncludeRefNumbers(!includeRefNumbers)}
            style={{ padding: '8px 4px' }}
          >
            <div className={`notion-checkbox ${includeRefNumbers ? 'checked' : ''}`}>
              {includeRefNumbers && <Check size={12} color="#ffffff" strokeWidth={3} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <Shield size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--primary)' }}>
                Include Booking Confirmation Codes
              </span>
            </div>
          </div>

          <div
            className="notion-checklist-row"
            onClick={() => setIncludeBudgets(!includeBudgets)}
            style={{ padding: '8px 4px' }}
          >
            <div className={`notion-checkbox ${includeBudgets ? 'checked' : ''}`}>
              {includeBudgets && <Check size={12} color="#ffffff" strokeWidth={3} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <Shield size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--primary)' }}>
                Include Total Planned Budget
              </span>
            </div>
          </div>

          <div
            className="notion-checklist-row"
            onClick={() => setIncludeNotes(!includeNotes)}
            style={{ padding: '8px 4px' }}
          >
            <div className={`notion-checkbox ${includeNotes ? 'checked' : ''}`}>
              {includeNotes && <Check size={12} color="#ffffff" strokeWidth={3} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <Shield size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--primary)' }}>
                Include Activity Notes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleShare} className="btn btn-primary" style={{ flex: 1 }}>
          <Share2 size={16} />
          <span>Share Schedule</span>
        </button>

        <button onClick={handleCopy} className="btn btn-secondary" style={{ minWidth: '110px' }}>
          {copied ? <Check size={16} color="var(--primary)" /> : <Copy size={16} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Preview Box */}
      <div className="travelnest-card" style={{ padding: '18px 20px' }}>
        <span className="label-micro" style={{ marginBottom: '10px', display: 'block' }}>
          EXPORT PREVIEW
        </span>

        <pre
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            whiteSpace: 'pre-wrap',
            backgroundColor: 'var(--surface-neutral-1)',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            lineHeight: 1.5,
            maxHeight: '340px',
            overflowY: 'auto',
            margin: 0,
            color: 'var(--primary)',
          }}
        >
          {plainText}
        </pre>
      </div>

      <FloatingActionButton
        onClick={handleShare}
        icon={<Share2 size={24} strokeWidth={2.4} />}
        label="Share Schedule"
      />
    </div>
  );
};
