import React from 'react';
import { Compass, Sparkles, ArrowRight, X } from 'lucide-react';

interface TourWelcomeModalProps {
  onStartTour: () => void;
  onSkipTour: () => void;
}

export const TourWelcomeModal: React.FC<TourWelcomeModalProps> = ({
  onStartTour,
  onSkipTour,
}) => {
  return (
    <div
      className="dialog-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 12, 14, 0.70)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 180ms ease-out',
      }}
    >
      <div
        className="dialog-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-welcome-title"
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '24px 22px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--stroke)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          animation: 'tourCardSlideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Dismiss Button */}
        <button
          onClick={onSkipTour}
          className="btn btn-ghost"
          aria-label="Close and explore myself"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '6px',
            borderRadius: '9999px',
            color: 'var(--secondary)',
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Icon Pill */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          <Compass size={24} strokeWidth={2.2} />
        </div>

        {/* Title & Description */}
        <div>
          <span
            className="label-micro"
            style={{
              color: 'var(--secondary)',
              letterSpacing: '0.06em',
              fontWeight: 700,
              marginBottom: '4px',
              display: 'block',
            }}
          >
            GETTING STARTED
          </span>
          <h2
            id="tour-welcome-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
              lineHeight: 1.25,
            }}
          >
            Let's get your travel organised.
          </h2>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--secondary)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Veya keeps your plans, places, bookings and memories together in one place. Let me show you around your new travel workspace with a live Tokyo demo journey (automatically cleared when you finish!).
          </p>
        </div>

        {/* Highlights List */}
        <div
          style={{
            backgroundColor: 'var(--surface-neutral-1)',
            borderRadius: '14px',
            padding: '12px 14px',
            border: '1px solid var(--stroke)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗺️</span>
            <span><strong>Trip Hub:</strong> Day-by-day itineraries, budgets, and bookings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔖</span>
            <span><strong>Country Finds:</strong> Save ideas from Instagram & blogs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📖</span>
            <span><strong>Memory Journal:</strong> Independent stories and photos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '0.72rem', borderTop: '1px solid var(--stroke)', paddingTop: '6px' }}>
            <span>💡</span>
            <span><strong>Tour Purpose:</strong> Temporary demo data is loaded for demonstration and deleted immediately when you exit.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onStartTour}
            className="btn btn-primary"
            style={{
              width: '100%',
              minHeight: '44px',
              borderRadius: '9999px',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={16} strokeWidth={2.2} />
            <span>Show Me Around</span>
            <ArrowRight size={15} strokeWidth={2.2} />
          </button>

          <button
            onClick={onSkipTour}
            className="btn btn-secondary"
            style={{
              width: '100%',
              minHeight: '40px',
              borderRadius: '9999px',
              fontSize: '0.82rem',
              color: 'var(--secondary)',
            }}
          >
            <span>I'll Explore Myself</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--secondary)', opacity: 0.85 }}>
          Works 100% offline · No cloud account required
        </div>
      </div>
    </div>
  );
};
