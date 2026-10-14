import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { SPOTLIGHT_TOUR_STEPS, findTourTargetElement } from './tourSteps';
import { SpotlightOverlay, type SpotlightRect } from './SpotlightOverlay';
import { TourDialogueCard } from './TourDialogueCard';
import { TourWelcomeModal } from './TourWelcomeModal';
import { TourCompletionModal } from './TourCompletionModal';

type TourPhase = 'welcome' | 'spotlight' | 'completed';

export const GuidedTour: React.FC = () => {
  const {
    isTourActive,
    tourStep,
    setTourStep,
    endTour,
    setActiveTab,
    setActiveTripId,
    setActiveJournalId,
    setActiveCollectionItemId,
  } = useApp();

  const [tourPhase, setTourPhase] = useState<TourPhase>('welcome');
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);

  // Reset to welcome phase whenever tour is freshly started
  useEffect(() => {
    if (isTourActive) {
      setTourPhase('welcome');
    }
  }, [isTourActive]);

  // Measure active spotlight target rect
  const measureTarget = useCallback(() => {
    if (!isTourActive || tourPhase !== 'spotlight') return;
    const currentStep = SPOTLIGHT_TOUR_STEPS[tourStep];
    if (!currentStep) return;

    const el = findTourTargetElement(currentStep.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        return;
      }
    }
    // Target element not found or not rendered yet
    setTargetRect(null);
  }, [isTourActive, tourPhase, tourStep]);

  // Navigate app tab and poll-measure target when spotlight step changes
  useEffect(() => {
    if (!isTourActive || tourPhase !== 'spotlight') return;
    const currentStep = SPOTLIGHT_TOUR_STEPS[tourStep];
    if (!currentStep) return;

    // Switch to step's tab and close any open sub-modals/detail views
    setActiveTab(currentStep.tab);
    setActiveTripId(null);
    setActiveJournalId(null);
    setActiveCollectionItemId(null);

    let cancelled = false;
    const delays = [20, 80, 200, 450, 800];
    const timers: ReturnType<typeof setTimeout>[] = [];

    delays.forEach((delay) => {
      const t = setTimeout(() => {
        if (cancelled) return;
        const el = findTourTargetElement(currentStep.targetId);
        if (el) {
          const r = el.getBoundingClientRect();
          // Scroll target into view if offscreen
          if (r.top < 0 || r.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          measureTarget();
        }
      }, delay);
      timers.push(t);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [
    isTourActive,
    tourPhase,
    tourStep,
    setActiveTab,
    setActiveTripId,
    setActiveJournalId,
    setActiveCollectionItemId,
    measureTarget,
  ]);

  // Reposition on window resize or scroll
  useEffect(() => {
    if (!isTourActive || tourPhase !== 'spotlight') return;

    let rafId: number | null = null;
    const handleReposition = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        measureTarget();
      });
    };

    window.addEventListener('resize', handleReposition, { passive: true });
    window.addEventListener('scroll', handleReposition, { passive: true, capture: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isTourActive, tourPhase, measureTarget]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in form controls
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveTab('home');
        endTour(false);
      } else if (tourPhase === 'welcome') {
        if (e.key === 'Enter') {
          e.preventDefault();
          setTourPhase('spotlight');
        }
      } else if (tourPhase === 'completed') {
        if (e.key === 'Enter') {
          e.preventDefault();
          setActiveTab('home');
          endTour(true);
        }
      } else if (tourPhase === 'spotlight') {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          if (tourStep < SPOTLIGHT_TOUR_STEPS.length - 1) {
            setTourStep(tourStep + 1);
          } else {
            setTourPhase('completed');
          }
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (tourStep > 0) {
            setTourStep(tourStep - 1);
          } else {
            setTourPhase('welcome');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTourActive, tourPhase, tourStep, setTourStep, endTour, setActiveTab]);

  if (!isTourActive) return null;

  // Phase 1: Welcome Screen
  if (tourPhase === 'welcome') {
    return (
      <TourWelcomeModal
        onStartTour={() => {
          setTourStep(0);
          setTourPhase('spotlight');
        }}
        onSkipTour={() => {
          setActiveTab('home');
          endTour(true);
        }}
      />
    );
  }

  // Phase 3: Completion Celebration Screen
  if (tourPhase === 'completed') {
    return (
      <TourCompletionModal
        onFinish={() => {
          setActiveTab('home');
          endTour(true);
        }}
      />
    );
  }

  // Phase 2: Interactive Spotlight Experience
  const currentStep = SPOTLIGHT_TOUR_STEPS[tourStep] || SPOTLIGHT_TOUR_STEPS[0];
  const isLastStep = tourStep === SPOTLIGHT_TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setTourPhase('completed');
    } else {
      setTourStep(tourStep + 1);
    }
  };

  const handlePrev = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    } else {
      setTourPhase('welcome');
    }
  };

  const handleSkip = () => {
    setActiveTab('home');
    endTour(true);
  };

  return (
    <>
      {/* SVG Dimming Scrim with Real Hole Cutout & Highlight Ring */}
      <SpotlightOverlay
        targetRect={targetRect}
        interactive={currentStep.interactive}
      />

      {/* Ephemeral Tour Demonstration Notice */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(max(8px, env(safe-area-inset-top, 0px)) + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99995,
          backgroundColor: '#111111',
          color: '#FFFFFF',
          borderRadius: '9999px',
          padding: '6px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '0.74rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          maxWidth: '92vw',
        }}
      >
        <span>✨</span>
        <span>
          <strong>Tour Demo Mode</strong> · Sample Tokyo data active (auto-clears on exit)
        </span>
      </div>

      {/* Floating Dialogue Card with Speech-Bubble Pointer Tail */}
      <TourDialogueCard
        step={currentStep}
        stepIndex={tourStep}
        totalSteps={SPOTLIGHT_TOUR_STEPS.length}
        targetRect={targetRect}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
      />
    </>
  );
};
