import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { UserProfile } from '../../types';
import {
  POPULAR_CURRENCIES,
  POPULAR_COUNTRIES,
  TRAVEL_INTERESTS_OPTIONS,
  AVATAR_OPTIONS,
} from '../../utils/profileUtils';
import {
  Compass,
  Luggage,
  Bookmark,
  BookOpen,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  ArrowRight,
  Globe,
  Coins,
  X,
} from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, completeOnboarding, userProfile } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form state initialized with existing profile or defaults
  const [displayName, setDisplayName] = useState(userProfile.displayName || 'Traveler');
  const [avatar, setAvatar] = useState(userProfile.avatar || 'compass');
  const [homeCountry, setHomeCountry] = useState(userProfile.homeCountry || 'India');
  const [dreamCountry, setDreamCountry] = useState(userProfile.dreamCountry || 'Japan');
  const [preferredCurrency, setPreferredCurrency] = useState(userProfile.preferredCurrency || 'INR');
  const [travelStyles, setTravelStyles] = useState<string[]>(
    userProfile.travelStyles?.length ? userProfile.travelStyles : ['Cultural & Heritage', 'Food & Dining']
  );
  const [startTourAfter, setStartTourAfter] = useState(true);

  if (!isOnboardingOpen) return null;

  const toggleTravelStyle = (styleLabel: string) => {
    setTravelStyles((prev) =>
      prev.includes(styleLabel)
        ? prev.filter((s) => s !== styleLabel)
        : [...prev, styleLabel]
    );
  };

  const handleSkip = () => {
    // Complete with sensible defaults
    completeOnboarding(
      {
        displayName: displayName.trim() || 'Traveler',
        avatar,
        homeCountry,
        dreamCountry: dreamCountry.trim() || 'Japan',
        preferredCurrency,
        travelStyles,
      },
      false
    );
  };

  const handleFinish = () => {
    completeOnboarding(
      {
        displayName: displayName.trim() || 'Traveler',
        avatar,
        homeCountry,
        dreamCountry: dreamCountry.trim(),
        preferredCurrency,
        travelStyles,
      },
      startTourAfter
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="travelnest-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: 0,
          margin: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--stroke)',
        }}
      >
        {/* Top Header Bar with Step Indicators & Skip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--stroke)',
            backgroundColor: 'var(--surface-neutral-1)',
          }}
        >
          {/* Step Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  width: step === s ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  backgroundColor: step === s ? 'var(--primary)' : 'var(--stroke)',
                  transition: 'all 200ms ease',
                }}
              />
            ))}
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--secondary)', marginLeft: '6px' }}>
              Step {step} of 4
            </span>
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="btn btn-ghost"
            style={{
              fontSize: '0.78rem',
              color: 'var(--secondary)',
              fontWeight: 600,
              padding: '4px 8px',
            }}
          >
            Skip
          </button>
        </div>

        {/* Scrollable Step Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* ====================================================
              STEP 1: WELCOME & EDITORIAL PHILOSOPHY
             ==================================================== */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <Compass size={28} strokeWidth={2.2} />
                </div>
                <span className="label-micro" style={{ marginBottom: '4px', display: 'block' }}>
                  WELCOME TO VEYA
                </span>
                <h2
                  style={{
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    color: 'var(--primary)',
                    margin: 0,
                  }}
                >
                  Your Private Travel Workspace
                </h2>
                <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', margin: '8px auto 0', maxWidth: '380px', lineHeight: 1.5 }}>
                  A local-first digital notebook for planning journeys, tracking offline bookings, and capturing enduring memory reflections.
                </p>
              </div>

              {/* 4 Pillars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '14px',
                    border: '1px solid var(--stroke)',
                  }}
                >
                  <Luggage size={18} color="var(--primary)" strokeWidth={2.2} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--primary)' }}>
                    My Trips
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', lineHeight: 1.4 }}>
                    Day-by-day itineraries, flight PNRs, and budgets.
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '14px',
                    border: '1px solid var(--stroke)',
                  }}
                >
                  <Bookmark size={18} color="var(--primary)" strokeWidth={2.2} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--primary)' }}>
                    Finds
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', lineHeight: 1.4 }}>
                    Curate spots, food stalls, and tips by country.
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '14px',
                    border: '1px solid var(--stroke)',
                  }}
                >
                  <BookOpen size={18} color="var(--primary)" strokeWidth={2.2} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--primary)' }}>
                    Memory Journal
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', lineHeight: 1.4 }}>
                    Write reflections and photos with zero cloud lock-in.
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--surface-neutral-1)',
                    borderRadius: '14px',
                    border: '1px solid var(--stroke)',
                  }}
                >
                  <ShieldCheck size={18} color="var(--primary)" strokeWidth={2.2} />
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, margin: '6px 0 2px', color: 'var(--primary)' }}>
                    100% Offline
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', lineHeight: 1.4 }}>
                    Stored on this device. No account or cloud needed.
                  </div>
                </div>
              </div>

              {/* Privacy Callout Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8F8F8',
                  border: '1px solid var(--stroke)',
                }}
              >
                <ShieldCheck size={20} color="#16a34a" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.76rem', color: '#333333', lineHeight: 1.4 }}>
                  <strong>Client-Side Storage:</strong> Your passport scans, expenses, and notes never leave this device.
                </span>
              </div>
            </div>
          )}

          {/* ====================================================
              STEP 2: LOCAL PROFILE SETUP
             ==================================================== */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span className="label-micro">PROFILE SETUP</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--primary)' }}>
                  How should we address you?
                </h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                  This name will appear on itineraries, packing lists, and shared companion schedules.
                </p>
              </div>

              {/* Name Input */}
              <div>
                <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="input"
                  style={{
                    height: '46px',
                    fontSize: '0.94rem',
                    fontWeight: 600,
                    borderRadius: '14px',
                    padding: '0 16px',
                    backgroundColor: 'var(--surface-neutral-1)',
                  }}
                  autoFocus
                />
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="label-micro" style={{ marginBottom: '8px', display: 'block' }}>
                  Choose Your Explorer Icon
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = avatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatar(av.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '12px 8px',
                          borderRadius: '14px',
                          backgroundColor: isSelected ? 'var(--surface-neutral-2)' : 'var(--surface-neutral-1)',
                          border: isSelected ? '2px solid var(--primary)' : '1px solid var(--stroke)',
                          cursor: 'pointer',
                          transition: 'all 120ms ease',
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>{av.icon}</span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {av.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              STEP 3: TRAVEL STYLE & CURRENCY PREFERENCES
             ==================================================== */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <span className="label-micro">TRAVEL PREFERENCES</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 0', color: 'var(--primary)' }}>
                  Set your travel defaults
                </h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                  Used for financial budgets and country dossier suggestions. You can change these anytime in Settings.
                </p>
              </div>

              {/* Dream Country to Visit (Seeds First Finds Folder) */}
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderRadius: '16px',
                  border: '1px solid var(--stroke)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={15} color="var(--primary)" />
                  <span className="label-micro" style={{ margin: 0 }}>
                    YOUR DREAM DESTINATION
                  </span>
                </div>
                <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                  What is your dream country to visit?
                </label>
                <p style={{ color: 'var(--secondary)', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>
                  This will become your first and only <strong>Finds</strong> folder once you onboard, ready for saving spots and research.
                </p>

                <div style={{ position: 'relative', marginTop: '4px' }}>
                  <input
                    type="text"
                    value={dreamCountry}
                    onChange={(e) => setDreamCountry(e.target.value)}
                    placeholder="e.g. Japan, Switzerland, Iceland, Italy..."
                    className="input"
                    style={{
                      height: '44px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: '12px',
                      padding: '0 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--stroke)',
                    }}
                  />
                </div>

                {/* Popular Dream Country Quick-Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '2px' }}>
                  {['Japan', 'Switzerland', 'Italy', 'Iceland', 'France', 'Portugal', 'Thailand', 'Norway'].map((c) => {
                    const isSelected = dreamCountry.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDreamCountry(c)}
                        className={`filter-chip ${isSelected ? 'active' : ''}`}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Home Country & Preferred Currency Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label-micro" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={11} />
                    <span>Home Country</span>
                  </label>
                  <select
                    value={homeCountry}
                    onChange={(e) => setHomeCountry(e.target.value)}
                    className="input"
                    style={{
                      height: '44px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      borderRadius: '12px',
                      padding: '0 10px',
                      backgroundColor: 'var(--surface-neutral-1)',
                    }}
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-micro" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coins size={11} />
                    <span>Default Currency</span>
                  </label>
                  <select
                    value={preferredCurrency}
                    onChange={(e) => setPreferredCurrency(e.target.value)}
                    className="input"
                    style={{
                      height: '44px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      borderRadius: '12px',
                      padding: '0 10px',
                      backgroundColor: 'var(--surface-neutral-1)',
                    }}
                  >
                    {POPULAR_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Travel Interests Multi-Select Chips */}
              <div>
                <label className="label-micro" style={{ marginBottom: '8px', display: 'block' }}>
                  Travel Style & Interests (Optional)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {TRAVEL_INTERESTS_OPTIONS.map((style) => {
                    const isSelected = travelStyles.includes(style.label);
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => toggleTravelStyle(style.label)}
                        className={`filter-chip ${isSelected ? 'active' : ''}`}
                        style={{
                          fontSize: '0.76rem',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                        }}
                      >
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                        {isSelected && <Check size={12} strokeWidth={2.4} style={{ marginLeft: '3px' }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ====================================================
              STEP 4: SUMMARY & READY TO EXPLORE
             ==================================================== */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '9999px',
                    backgroundColor: '#111111',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Sparkles size={24} strokeWidth={2} />
                </div>
                <span className="label-micro">ALL SET</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0', color: 'var(--primary)' }}>
                  Ready to explore, {displayName}!
                </h3>
                <p style={{ color: 'var(--secondary)', fontSize: '0.82rem', margin: '4px 0 0' }}>
                  Here is a recap of your local traveler configuration:
                </p>
              </div>

              {/* Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--surface-neutral-1)',
                  borderRadius: '16px',
                  border: '1px solid var(--stroke)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--secondary)', fontWeight: 500 }}>Explorer</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {displayName}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--secondary)', fontWeight: 500 }}>Base & Currency</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {homeCountry} · {preferredCurrency}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--secondary)', fontWeight: 500 }}>Initial Finds Folder</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {dreamCountry.trim() || 'None selected'}
                  </span>
                </div>

                {travelStyles.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--secondary)', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
                      Focus
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {travelStyles.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: '10px',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--stroke)',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontWeight: 600,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Guided Tour Checkbox Choice */}
              <div
                onClick={() => setStartTourAfter(!startTourAfter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--stroke)',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--primary)',
                    backgroundColor: startTourAfter ? 'var(--primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    flexShrink: 0,
                  }}
                >
                  {startTourAfter && <Check size={14} strokeWidth={2.4} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Take a 1-Minute Guided Tour
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary)' }}>
                    Highlights the main sections, tabs, and quick capture actions.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Actions Bar */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--stroke)',
            backgroundColor: 'var(--surface-neutral-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.84rem',
                minHeight: '42px',
                padding: '0 16px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="btn btn-primary"
              style={{
                fontSize: '0.84rem',
                minHeight: '42px',
                padding: '0 20px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>Next</span>
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="btn btn-primary"
              style={{
                fontSize: '0.88rem',
                minHeight: '44px',
                padding: '0 24px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{startTourAfter ? 'Start Tour' : 'Get Started'}</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
