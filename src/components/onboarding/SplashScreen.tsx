import React, { useState, useEffect } from 'react';
import { Compass } from 'lucide-react';

interface SplashScreenProps {
  isReady: boolean;
  onFinished?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isReady, onFinished }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Show splash for at least 600ms so it doesn't flicker, then fade out once app is ready
    const minTimer = setTimeout(() => {
      if (isReady) {
        setFading(true);
        const fadeTimer = setTimeout(() => {
          setVisible(false);
          if (onFinished) onFinished();
        }, 280);
        return () => clearTimeout(fadeTimer);
      }
    }, 600);

    return () => clearTimeout(minTimer);
  }, [isReady, onFinished]);

  // Also trigger fade out if isReady became true after minTimer
  useEffect(() => {
    if (isReady && !fading) {
      const delay = setTimeout(() => {
        setFading(true);
        const fadeTimer = setTimeout(() => {
          setVisible(false);
          if (onFinished) onFinished();
        }, 280);
        return () => clearTimeout(fadeTimer);
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [isReady, fading, onFinished]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        opacity: fading ? 0 : 1,
        transition: 'opacity 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          textAlign: 'center',
          maxWidth: '320px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          <Compass size={32} strokeWidth={2.2} />
        </div>

        <div>
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#111111',
              margin: '0 0 4px',
            }}
          >
            TRAVELNEST
          </h1>
          <p
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#666666',
              margin: 0,
            }}
          >
            Private Local-First Workspace
          </p>
        </div>

        {/* Minimalist Loading Indicator */}
        <div
          style={{
            marginTop: '24px',
            width: '48px',
            height: '3px',
            borderRadius: '9999px',
            backgroundColor: '#EEEEEE',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '100%',
              backgroundColor: '#111111',
              borderRadius: '9999px',
              animation: 'splashPulse 1.1s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes splashPulse {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};
