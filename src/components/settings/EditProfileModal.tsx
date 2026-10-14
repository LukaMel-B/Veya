import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  POPULAR_CURRENCIES,
  POPULAR_COUNTRIES,
  TRAVEL_INTERESTS_OPTIONS,
  AVATAR_OPTIONS,
} from '../../utils/profileUtils';
import { X, Check, Globe, Coins, User } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfile } = useApp();

  const [displayName, setDisplayName] = useState(userProfile.displayName || 'Traveler');
  const [avatar, setAvatar] = useState(userProfile.avatar || 'compass');
  const [homeCountry, setHomeCountry] = useState(userProfile.homeCountry || 'India');
  const [preferredCurrency, setPreferredCurrency] = useState(userProfile.preferredCurrency || 'INR');
  const [travelStyles, setTravelStyles] = useState<string[]>(
    userProfile.travelStyles?.length ? userProfile.travelStyles : ['Cultural & Heritage', 'Food & Dining']
  );

  if (!isOpen) return null;

  const toggleTravelStyle = (styleLabel: string) => {
    setTravelStyles((prev) =>
      prev.includes(styleLabel)
        ? prev.filter((s) => s !== styleLabel)
        : [...prev, styleLabel]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      displayName: displayName.trim() || 'Traveler',
      avatar,
      homeCountry,
      preferredCurrency,
      travelStyles,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          maxWidth: '460px',
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
        {/* Top Header */}
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
          <div>
            <span className="label-micro" style={{ margin: 0 }}>LOCAL PROFILE</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>
              Edit Profile & Preferences
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: '9999px', color: 'var(--secondary)' }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSave}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Display Name */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} />
              <span>Display Name</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              className="input"
              style={{
                height: '44px',
                fontSize: '0.9rem',
                fontWeight: 600,
                borderRadius: '12px',
                padding: '0 14px',
                backgroundColor: 'var(--surface-neutral-1)',
              }}
              required
            />
          </div>

          {/* Explorer Icon Selection */}
          <div>
            <label className="label-micro" style={{ marginBottom: '8px', display: 'block' }}>
              Explorer Icon
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
                      gap: '4px',
                      padding: '10px 6px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? 'var(--surface-neutral-2)' : 'var(--surface-neutral-1)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--stroke)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <span style={{ fontSize: '1.35rem' }}>{av.icon}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {av.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Home Country & Preferred Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  height: '42px',
                  fontSize: '0.82rem',
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
                <span>Currency</span>
              </label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="input"
                style={{
                  height: '42px',
                  fontSize: '0.82rem',
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

          {/* Travel Interests */}
          <div>
            <label className="label-micro" style={{ marginBottom: '6px', display: 'block' }}>
              Travel Interests & Style
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {TRAVEL_INTERESTS_OPTIONS.map((style) => {
                const isSelected = travelStyles.includes(style.label);
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => toggleTravelStyle(style.label)}
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    style={{ fontSize: '0.74rem', padding: '5px 10px' }}
                  >
                    <span>{style.icon}</span>
                    <span>{style.label}</span>
                    {isSelected && <Check size={11} strokeWidth={2.4} style={{ marginLeft: '2px' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Save Button */}
          <div style={{ paddingTop: '8px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '42px', borderRadius: '9999px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, minHeight: '42px', borderRadius: '9999px' }}
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
