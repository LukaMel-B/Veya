import type { UserProfile } from '../types';
import { db } from '../db/database';

export const USER_PROFILE_STORAGE_KEY = 'travelnest_user_profile';
export const ONBOARDING_COMPLETED_KEY = 'travelnest_onboarding_completed';
export const TOUR_COMPLETED_KEY = 'travelnest_tour_completed';

export const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: 'Traveler',
  avatar: 'compass',
  homeCountry: 'India',
  preferredCurrency: 'INR',
  travelStyles: ['Cultural & Heritage', 'Food & Dining'],
  onboardingCompleted: false,
  tourCompleted: false,
};

export const POPULAR_CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR ₹)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD $)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR €)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP £)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (JPY ¥)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD A$)' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar (CAD C$)' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD S$)' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'THB', symbol: '฿', label: 'Thai Baht (THB ฿)' },
];

export const POPULAR_COUNTRIES = [
  'India',
  'Japan',
  'Switzerland',
  'Kazakhstan',
  'United States',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Portugal',
  'Iceland',
  'Thailand',
  'Singapore',
  'Canada',
  'United Arab Emirates',
  'Vietnam',
  'Indonesia',
  'Netherlands',
];

export const TRAVEL_INTERESTS_OPTIONS = [
  { id: 'cultural', label: 'Cultural & Heritage', icon: '🏛️' },
  { id: 'food', label: 'Food & Dining', icon: '🍜' },
  { id: 'nature', label: 'Nature & Hiking', icon: '🏔️' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'budget', label: 'Budget Backpacking', icon: '🎒' },
  { id: 'luxury', label: 'Luxury & Leisure', icon: '✨' },
  { id: 'solo', label: 'Solo Exploration', icon: '🧭' },
  { id: 'roadtrips', label: 'Road Trips', icon: '🚗' },
  { id: 'adventure', label: 'Adventure Sports', icon: '🧗' },
  { id: 'beaches', label: 'Coastlines & Islands', icon: '🏖️' },
];

export const AVATAR_OPTIONS = [
  { id: 'compass', label: 'Compass', icon: '🧭' },
  { id: 'mountain', label: 'Mountain', icon: '🏔️' },
  { id: 'plane', label: 'Airplane', icon: '✈️' },
  { id: 'camera', label: 'Camera', icon: '📷' },
  { id: 'palmtree', label: 'Coast', icon: '🌴' },
  { id: 'sparkles', label: 'Wanderer', icon: '✨' },
];

/**
 * Retrieve user profile from local storage, with graceful fallback.
 */
export function getStoredUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER_PROFILE,
        ...parsed,
        onboardingCompleted: localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true',
        tourCompleted: localStorage.getItem(TOUR_COMPLETED_KEY) === 'true',
      };
    }
  } catch (err) {
    console.warn('Error reading stored user profile:', err);
  }

  const isCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  const isTourDone = localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';

  return {
    ...DEFAULT_USER_PROFILE,
    onboardingCompleted: isCompleted,
    tourCompleted: isTourDone,
  };
}

/**
 * Persist user profile to local storage.
 */
export function saveStoredUserProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getStoredUserProfile();
  const updated: UserProfile = {
    ...current,
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated));
    if (updated.onboardingCompleted) {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    }
    if (updated.tourCompleted) {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    }
  } catch (err) {
    console.warn('Error saving user profile:', err);
  }

  return updated;
}

/**
 * Detects whether onboarding should be shown:
 * - If onboarding was explicitly completed -> false
 * - If missing flag, checks if database has existing user data (existing installation)
 *   If existing data is found -> marks onboarding as completed and returns false (never reset or prompt existing users)
 * - If database is genuinely empty and flag is missing -> returns true (new user)
 */
export async function determineInitialOnboardingStatus(): Promise<{
  shouldShowOnboarding: boolean;
  isExistingUser: boolean;
}> {
  const explicitlyCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  if (explicitlyCompleted) {
    return { shouldShowOnboarding: false, isExistingUser: true };
  }

  try {
    const [tripCount, journalCount, colCount] = await Promise.all([
      db.trips.count(),
      db.journalEntries.count(),
      db.collectionItems.count(),
    ]);

    const hasData = tripCount > 0 || journalCount > 0 || colCount > 0;
    if (hasData) {
      // Existing installation: preserve everything and mark onboarding as complete
      saveStoredUserProfile({ onboardingCompleted: true });
      return { shouldShowOnboarding: false, isExistingUser: true };
    }
  } catch (err) {
    console.warn('Error checking existing data for onboarding:', err);
  }

  // Brand new installation with empty database
  return { shouldShowOnboarding: true, isExistingUser: false };
}
