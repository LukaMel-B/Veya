import React from 'react';
import { Check, Compass, ArrowRight } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface TourCompletionModalProps {
  onFinish: () => void;
}

export const TourCompletionModal: React.FC<TourCompletionModalProps> = ({ onFinish }) => {
  return (
    <ModalPortal>
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
          colorScheme: 'light',
          animation: 'fadeIn 180ms ease-out',
        }}
      >
      <div
        className="dialog-frame"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-complete-title"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '26px 22px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid var(--stroke)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          animation: 'tourCardSlideUp 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Animated Celebration Icon */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '18px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.16)',
          }}
        >
          <Compass size={28} strokeWidth={2.2} />
        </div>

        <div>
          <span
            className="label-micro"
            style={{
              color: '#16a34a',
              letterSpacing: '0.06em',
              fontWeight: 700,
              marginBottom: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check size={12} strokeWidth={2.4} />
            TOUR COMPLETED
          </span>

          <h2
            id="tour-complete-title"
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}
          >
            You're all set to explore!
          </h2>

          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--secondary)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '340px',
            }}
          >
            All tour demonstration data has been automatically cleared. Veya is ready for your next adventure. Start by planning your first journey or saving a place you love.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onFinish}
          className="btn btn-primary"
          style={{
            width: '100%',
            minHeight: '44px',
            borderRadius: '9999px',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '6px',
          }}
        >
          <span>Start Exploring</span>
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
    </ModalPortal>
  );
};
