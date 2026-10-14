import React, { useMemo, useState, useEffect } from 'react';
import type { TourStep } from './tourSteps';
import type { SpotlightRect } from './SpotlightOverlay';
import { ChevronLeft, ChevronRight, Check, X, Sparkles } from 'lucide-react';

interface TourDialogueCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: SpotlightRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TourDialogueCard: React.FC<TourDialogueCardProps> = ({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}) => {
  const isLast = stepIndex === totalSteps - 1;

  // Window dimensions tracking for responsive placement
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute position relative to spotlight target
  const layout = useMemo(() => {
    const cardWidth = Math.min(380, windowSize.width - 32);

    if (!targetRect) {
      // Fallback: center in viewport
      return {
        isFallback: true,
        style: {
          position: 'fixed' as const,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${cardWidth}px`,
        },
        placement: 'center' as const,
        arrowOffset: 0,
      };
    }

    const targetCenterX = targetRect.x + targetRect.width / 2;
    const spaceAbove = targetRect.y;
    const spaceBelow = windowSize.height - (targetRect.y + targetRect.height);

    let placement: 'above' | 'below' = 'below';
    if (step.placementPreference === 'top') {
      placement = 'above';
    } else if (step.placementPreference === 'bottom') {
      placement = 'below';
    } else {
      // Auto placement: pick whichever side has more room
      if (spaceBelow < 230 && spaceAbove >= 200) {
        placement = 'above';
      } else {
        placement = 'below';
      }
    }

    // Horizontal clamping within screen boundaries
    const rawLeft = targetCenterX - cardWidth / 2;
    const clampedLeft = Math.max(16, Math.min(rawLeft, windowSize.width - cardWidth - 16));

    // Calculate pointer arrow offset relative to the card's left edge
    const arrowOffset = Math.max(24, Math.min(targetCenterX - clampedLeft, cardWidth - 24));

    const style: React.CSSProperties = {
      position: 'fixed',
      left: `${clampedLeft}px`,
      width: `${cardWidth}px`,
      zIndex: 99990,
    };

    if (placement === 'above') {
      style.bottom = `${windowSize.height - targetRect.y + 14}px`;
    } else {
      style.top = `${targetRect.y + targetRect.height + 14}px`;
    }

    return {
      isFallback: false,
      style,
      placement,
      arrowOffset,
    };
  }, [targetRect, step.placementPreference, windowSize]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      className="tour-dialogue-card"
      style={{
        ...layout.style,
        backgroundColor: '#FFFFFF',
        borderRadius: '22px',
        padding: '18px 20px',
        boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28)',
        border: '1px solid var(--stroke)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'tourCardSlideUp 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
      }}
    >
      {/* Speech-Bubble Pointer Tail */}
      {!layout.isFallback && (
        <div
          style={{
            position: 'absolute',
            width: '14px',
            height: '14px',
            backgroundColor: '#FFFFFF',
            transform: 'translateX(-50%) rotate(45deg)',
            left: `${layout.arrowOffset}px`,
            ...(layout.placement === 'above'
              ? {
                  bottom: '-7px',
                  borderRight: '1px solid var(--stroke)',
                  borderBottom: '1px solid var(--stroke)',
                }
              : {
                  top: '-7px',
                  borderLeft: '1px solid var(--stroke)',
                  borderTop: '1px solid var(--stroke)',
                }),
          }}
          aria-hidden="true"
        />
      )}

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: '#111111',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '3px 9px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {step.badge}
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--secondary)', fontWeight: 600 }}>
            {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        <button
          onClick={onSkip}
          className="btn btn-ghost"
          style={{
            padding: '4px',
            borderRadius: '9999px',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Skip tour"
          aria-label="Skip tour"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Title & Description */}
      <div>
        <h3
          style={{
            fontSize: '1.08rem',
            fontWeight: 700,
            color: 'var(--primary)',
            letterSpacing: '-0.015em',
            margin: '0 0 6px',
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            fontSize: '0.84rem',
            color: 'var(--secondary)',
            lineHeight: 1.48,
            margin: 0,
          }}
        >
          {step.description}
        </p>
      </div>

      {/* Helper Cue (if provided) */}
      {step.helperCue && (
        <div
          style={{
            backgroundColor: 'var(--surface-neutral-1)',
            borderRadius: '10px',
            padding: '8px 10px',
            fontSize: '0.74rem',
            color: 'var(--primary)',
            border: '1px solid var(--stroke)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            lineHeight: 1.35,
          }}
        >
          <Sparkles size={13} strokeWidth={2} style={{ flexShrink: 0, color: 'var(--primary)' }} />
          <span>{step.helperCue}</span>
        </div>
      )}

      {/* Footer Controls: Dots & Navigation Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px solid var(--stroke)',
          marginTop: '2px',
        }}
      >
        {/* Progress Dots Track */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: stepIndex === idx ? '16px' : '5px',
                height: '5px',
                borderRadius: '9999px',
                backgroundColor: stepIndex === idx ? 'var(--primary)' : 'var(--stroke)',
                transition: 'all 180ms ease',
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {stepIndex > 0 && (
            <button
              onClick={onPrev}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '4px 12px',
                minHeight: '34px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={onNext}
            className="btn btn-primary"
            style={{
              fontSize: '0.78rem',
              padding: '4px 14px',
              minHeight: '34px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            <span>{isLast ? 'Finish Tour' : 'Next'}</span>
            {isLast ? <Check size={14} strokeWidth={2.4} /> : <ChevronRight size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
};
