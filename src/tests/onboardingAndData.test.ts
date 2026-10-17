declare const process: any;

// Mock browser environment before imports
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => { storageMap.set(key, value); },
  removeItem: (key: string) => { storageMap.delete(key); },
  clear: () => { storageMap.clear(); }
};
(globalThis as any).localStorage = mockLocalStorage;

// Mock Dexie db for node test run
let mockTripCount = 0;
let mockJournalCount = 0;
let mockColCount = 0;
let mockCountryCount = 0;
let mockAllTrips: any[] = [];

(globalThis as any).indexedDB = {
  open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null })
};

import { 
  determineInitialOnboardingStatus, 
  getStoredUserProfile, 
  saveStoredUserProfile, 
  DEFAULT_USER_PROFILE,
  POPULAR_CURRENCIES,
  POPULAR_COUNTRIES,
  TRAVEL_INTERESTS_OPTIONS,
  AVATAR_OPTIONS,
  ONBOARDING_COMPLETED_KEY,
  TOUR_COMPLETED_KEY,
  USER_PROFILE_STORAGE_KEY
} from '../utils/profileUtils.ts';
import { 
  getSampleCollectionItems,
  getSampleJournalEntries,
  hasSampleData
} from '../db/seedData.ts';
import { db } from '../db/database.ts';

// Override db methods for testing
(db.trips as any).count = async () => mockTripCount;
(db.trips as any).toArray = async () => mockAllTrips;
(db.journalEntries as any).count = async () => mockJournalCount;
(db.collectionItems as any).count = async () => mockColCount;
(db.countries as any).count = async () => mockCountryCount;

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- TEST SUITE 1: Profile & Preferences Storage ---');

  // 1. Initial State
  mockLocalStorage.clear();
  const initialProfile = getStoredUserProfile();
  assert(initialProfile.onboardingCompleted === false, 'Fresh profile has onboardingCompleted = false');
  assert(initialProfile.preferredCurrency === 'INR', 'Default preferred currency is INR');
  assert(initialProfile.homeCountry === 'India', 'Default homeCountry is India');
  assert(initialProfile.displayName === 'Traveler', 'Default displayName is Traveler');
  assert(initialProfile.tourCompleted === false, 'Default tourCompleted is false');

  // 2. Saving and Loading Profile
  saveStoredUserProfile({
    displayName: 'Luka',
    preferredCurrency: 'EUR',
    homeCountry: 'Kazakhstan',
    travelStyles: ['Nature & Hiking', 'Photography'],
    onboardingCompleted: true,
    tourCompleted: true,
  });
  const updatedProfile = getStoredUserProfile();
  assert(updatedProfile.displayName === 'Luka', 'DisplayName saved & loaded');
  assert(updatedProfile.preferredCurrency === 'EUR', 'Currency saved & loaded');
  assert(updatedProfile.homeCountry === 'Kazakhstan', 'Home country saved & loaded');
  assert(updatedProfile.travelStyles.includes('Photography'), 'Travel styles saved & loaded');
  assert(updatedProfile.onboardingCompleted === true, 'OnboardingCompleted saved & loaded');
  assert(updatedProfile.tourCompleted === true, 'TourCompleted saved & loaded');
  assert(mockLocalStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true', 'ONBOARDING_COMPLETED_KEY in localStorage');
  assert(mockLocalStorage.getItem(TOUR_COMPLETED_KEY) === 'true', 'TOUR_COMPLETED_KEY in localStorage');

  console.log('\n--- TEST SUITE 2: Existing-User vs Fresh-Install Detection ---');

  // 3. Fresh installation with empty database
  mockLocalStorage.clear();
  mockTripCount = 0;
  mockJournalCount = 0;
  mockColCount = 0;
  const freshResult = await determineInitialOnboardingStatus();
  assert(freshResult.shouldShowOnboarding === true, 'Genuinely new installation (0 records, no storage) requires onboarding');
  assert(freshResult.isExistingUser === false, 'Genuinely new installation is marked isExistingUser = false');

  // 4. Returning user with existing data but missing onboarding flag (e.g. upgraded app)
  mockLocalStorage.clear();
  mockTripCount = 3;
  mockJournalCount = 0;
  mockColCount = 0;
  const returningTripsResult = await determineInitialOnboardingStatus();
  assert(returningTripsResult.shouldShowOnboarding === false, 'Existing user with saved trips is spared from onboarding');
  assert(returningTripsResult.isExistingUser === true, 'Existing user with saved trips marked isExistingUser = true');
  assert(mockLocalStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true', 'Onboarding flag automatically set for existing user to protect data');

  mockLocalStorage.clear();
  mockTripCount = 0;
  mockJournalCount = 4;
  mockColCount = 0;
  const returningJournalsResult = await determineInitialOnboardingStatus();
  assert(returningJournalsResult.shouldShowOnboarding === false, 'Existing user with journals spared from onboarding');

  mockLocalStorage.clear();
  mockTripCount = 0;
  mockJournalCount = 0;
  mockColCount = 7;
  mockCountryCount = 0;
  const returningItemsResult = await determineInitialOnboardingStatus();
  assert(returningItemsResult.shouldShowOnboarding === false, 'Existing user with collection items spared from onboarding');

  mockLocalStorage.clear();
  mockTripCount = 0;
  mockJournalCount = 0;
  mockColCount = 0;
  mockCountryCount = 2;
  const returningCountriesResult = await determineInitialOnboardingStatus();
  assert(returningCountriesResult.shouldShowOnboarding === false, 'Existing user with country folders spared from onboarding');
  assert(returningCountriesResult.isExistingUser === true, 'Existing user with country folders marked isExistingUser = true');

  // 5. User who already completed onboarding
  mockLocalStorage.clear();
  mockLocalStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  mockTripCount = 0;
  mockCountryCount = 0;
  const completedResult = await determineInitialOnboardingStatus();
  assert(completedResult.shouldShowOnboarding === false, 'User with onboarding flag does not repeat onboarding');

  console.log('\n--- TEST SUITE 3: hasSampleData & Sample Datasets ---');

  // 6. Test hasSampleData when no trips exist
  mockAllTrips = [];
  const sampleCheckEmpty = await hasSampleData();
  assert(sampleCheckEmpty.hasSampleTrips === false, 'hasSampleData returns false when no trips exist');
  assert(sampleCheckEmpty.totalTripCount === 0, 'totalTripCount is 0');

  // 7. Test hasSampleData when user has only custom trips
  mockAllTrips = [{ id: 'my-custom-trip-1', name: 'My Own Trip' }];
  const sampleCheckCustom = await hasSampleData();
  assert(sampleCheckCustom.hasSampleTrips === false, 'hasSampleData returns false when only custom trips exist');
  assert(sampleCheckCustom.totalTripCount === 1, 'totalTripCount is 1');

  // 8. Test hasSampleData when sample trips are present
  mockAllTrips = [
    { id: 'trip-tokyo-2026', name: 'Tokyo Sakura' },
    { id: 'trip-swiss-2026', name: 'Swiss Alps' },
    { id: 'my-custom-trip', name: 'Personal Journey' }
  ];
  const sampleCheckWithSamples = await hasSampleData();
  assert(sampleCheckWithSamples.hasSampleTrips === true, 'hasSampleData detects sample trips correctly');
  assert(sampleCheckWithSamples.sampleTripCount === 2, 'sampleTripCount correctly reports 2 sample trips');
  assert(sampleCheckWithSamples.totalTripCount === 3, 'totalTripCount correctly reports 3 total trips');

  // 9. Verify getSampleCollectionItems
  const sampleCols = getSampleCollectionItems('trip-tokyo-2026', 'trip-swiss-2026');
  assert(sampleCols.length >= 8, `Sample collection items generated (found ${sampleCols.length})`);
  assert(sampleCols.some(c => c.country === 'Japan'), 'Collection items include Japan');
  assert(sampleCols.some(c => c.country === 'Switzerland'), 'Collection items include Switzerland');
  assert(sampleCols.some(c => c.country === 'Kazakhstan'), 'Collection items include Kazakhstan');

  // 10. Verify getSampleJournalEntries
  const sampleJournals = getSampleJournalEntries('trip-tokyo-2026', 'trip-swiss-2026');
  assert(sampleJournals.length >= 2, `Sample journal entries generated (found ${sampleJournals.length})`);
  assert(sampleJournals.every(j => !!j.title && !!j.content), 'Every sample journal entry has title and content');

  console.log('\n--- TEST SUITE 4: Preserved Constants & Options ---');
  assert(POPULAR_CURRENCIES.length >= 10, `Currencies supported: ${POPULAR_CURRENCIES.length}`);
  assert(POPULAR_COUNTRIES.length >= 20, `Countries supported: ${POPULAR_COUNTRIES.length}`);
  assert(TRAVEL_INTERESTS_OPTIONS.length >= 8, `Travel styles available: ${TRAVEL_INTERESTS_OPTIONS.length}`);
  assert(AVATAR_OPTIONS.length >= 6, `Avatar choices available: ${AVATAR_OPTIONS.length}`);

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL TESTS PASSED SUCCESSFULLY! ✓');
  }
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
