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

(globalThis as any).indexedDB = {
  open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null })
};

import { db, initializeDatabaseSafely } from '../db/database.ts';
import { 
  getStoredUserProfile, 
  saveStoredUserProfile, 
  determineInitialOnboardingStatus,
  ONBOARDING_COMPLETED_KEY,
  USER_PROFILE_STORAGE_KEY
} from '../utils/profileUtils.ts';
import { seedInitialDataIfEmpty } from '../db/seedData.ts';
import fs from 'node:fs';
import path from 'node:path';

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
  console.log('--- TEST SUITE 1: Android Application Identity & Versioning Safety ---');

  // Read capacitor.config.ts
  const capacitorConfigPath = path.resolve(process.cwd(), 'capacitor.config.ts');
  const capacitorContent = fs.readFileSync(capacitorConfigPath, 'utf8');
  
  assert(capacitorContent.includes("appId: 'com.travelnest.app'"), "Capacitor appId is locked to 'com.travelnest.app'");
  assert(capacitorContent.includes("appName: 'Veya'"), "Capacitor appName is 'Veya'");
  assert(capacitorContent.includes("androidScheme: 'https'"), "Capacitor androidScheme is locked to 'https' (maintains https://localhost IndexedDB origin)");

  // Read android/app/build.gradle
  const buildGradlePath = path.resolve(process.cwd(), 'android/app/build.gradle');
  const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

  assert(buildGradleContent.includes('applicationId "com.travelnest.app"'), 'build.gradle applicationId matches "com.travelnest.app"');
  const vcMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
  const vnMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);
  assert(Boolean(vcMatch && parseInt(vcMatch[1], 10) >= 2), 'build.gradle versionCode is incremented (>= 2) for APK update');
  assert(Boolean(vnMatch && vnMatch[1].length > 0), `build.gradle versionName is present: "${vnMatch ? vnMatch[1] : ''}"`);

  // Read package.json
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert(Boolean(packageJson.version), `package.json version matches release ${packageJson.version}`);

  console.log('\n--- TEST SUITE 2: Database Initialization & Safe Open ---');

  // Test successful db.open
  const origOpen = db.open.bind(db);
  const origIsOpen = db.isOpen.bind(db);

  (db as any).isOpen = () => false;
  (db as any).open = async () => db;

  const initResult = await initializeDatabaseSafely();
  assert(initResult.success === true, 'initializeDatabaseSafely() reports success when db opens cleanly');

  // Test error handling on db.open failure
  (db as any).isOpen = () => false;
  (db as any).open = async () => { throw new Error('IndexedDB storage quota exceeded or disk locked'); };

  const failResult = await initializeDatabaseSafely();
  assert(failResult.success === false, 'initializeDatabaseSafely() reports success = false when db fails');
  assert(Boolean(failResult.error?.includes('quota exceeded')), 'initializeDatabaseSafely() returns detailed error description');

  // Restore mock db.isOpen to true
  (db as any).isOpen = () => true;
  (db as any).open = async () => db;

  // Verify Dexie database name is permanent
  assert(db.name === 'TravelNestDB', "Database name is locked to 'TravelNestDB'");

  // Verify all 11 tables exist on database instance
  const expectedTables = [
    'trips',
    'places',
    'collectionItems',
    'itineraryEvents',
    'bookings',
    'expenses',
    'essentials',
    'documents',
    'countries',
    'categories',
    'journalEntries'
  ];
  for (const tableName of expectedTables) {
    assert((db as any)[tableName] !== undefined, `Table '${tableName}' is defined on db instance`);
  }

  console.log('\n--- TEST SUITE 3: Backup Export & Restoration Integrity (v3 & v4) ---');

  // Mock table contents for export/import testing
  const mockTrips = [
    {
      id: 'trip-user-1',
      name: 'Autumn in Kyoto',
      destination: 'Kyoto, Japan',
      country: 'Japan',
      startDate: '2026-11-01',
      endDate: '2026-11-10',
      status: 'planning',
      defaultCurrency: 'JPY',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z'
    }
  ];
  const mockJournals = [
    {
      id: 'journal-1',
      title: 'First Sighting of Mount Fuji',
      content: 'Clear skies from the shinkansen window.',
      date: '2026-11-02',
      tripId: 'trip-user-1',
      photos: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
      tags: ['Fuji', 'Shinkansen'],
      isFavorite: true,
      createdAt: '2026-11-02T12:00:00.000Z',
      updatedAt: '2026-11-02T12:00:00.000Z'
    }
  ];

  (db.trips as any).toArray = async () => mockTrips;
  (db.places as any).toArray = async () => [];
  (db.collectionItems as any).toArray = async () => [];
  (db.itineraryEvents as any).toArray = async () => [];
  (db.bookings as any).toArray = async () => [];
  (db.expenses as any).toArray = async () => [];
  (db.essentials as any).toArray = async () => [];
  (db.documents as any).toArray = async () => [];
  (db.countries as any).toArray = async () => [];
  (db.categories as any).toArray = async () => [];
  (db.journalEntries as any).toArray = async () => mockJournals;

  // Set mock profile
  mockLocalStorage.clear();
  saveStoredUserProfile({
    displayName: 'Alex Traveler',
    homeCountry: 'Switzerland',
    preferredCurrency: 'CHF',
    travelStyles: ['Nature & Hiking'],
    onboardingCompleted: true
  });

  const exportResult = await db.exportFullData();
  assert(exportResult.appName === 'Veya', 'Export has appName = Veya');
  assert(exportResult.version === 4, 'Export schema version is 4 (includes user profile)');
  assert(exportResult.userProfile?.displayName === 'Alex Traveler', 'Export includes userProfile.displayName');
  assert(exportResult.userProfile?.preferredCurrency === 'CHF', 'Export includes userProfile.preferredCurrency');
  assert(exportResult.data.trips.length === 1, 'Export includes user trips');
  assert(exportResult.data.journalEntries.length === 1, 'Export includes user journals and photos');

  // Test Importing Legacy v3 Payload (without userProfile)
  let bulkPutTrips: any[] = [];
  for (const tableName of expectedTables) {
    (db as any)[tableName].clear = async () => {};
    (db as any)[tableName].bulkPut = async (items: any[]) => {
      if (tableName === 'trips') bulkPutTrips = items;
      return items;
    };
  }
  (db.transaction as any) = async (_mode: string, _tables: any[], callback: () => Promise<void>) => {
    await callback();
  };

  const legacyV3Payload = {
    version: 3,
    appName: 'TravelNest',
    exportedAt: '2026-10-12T00:00:00.000Z',
    data: {
      trips: mockTrips,
      places: [],
      collectionItems: [],
      itineraryEvents: [],
      bookings: [],
      expenses: [],
      essentials: [],
      documents: [],
      countries: [],
      categories: [],
      journalEntries: []
    }
  };

  await db.importFullData(legacyV3Payload, 'merge');
  assert(bulkPutTrips.length === 1, 'Legacy v3 backup imported without crashing or failing');

  // Test Importing v4 Payload with User Profile
  const v4Payload = {
    version: 4,
    appName: 'TravelNest',
    exportedAt: '2026-10-13T00:00:00.000Z',
    userProfile: {
      displayName: 'Restored Explorer',
      homeCountry: 'Japan',
      preferredCurrency: 'JPY',
      travelStyles: ['Food & Dining'],
      onboardingCompleted: true
    },
    data: {
      trips: mockTrips,
      places: [],
      collectionItems: [],
      itineraryEvents: [],
      bookings: [],
      expenses: [],
      essentials: [],
      documents: [],
      countries: [],
      categories: [],
      journalEntries: mockJournals
    }
  };

  await db.importFullData(v4Payload, 'overwrite');
  const importedProfile = getStoredUserProfile();
  assert(importedProfile.displayName === 'Restored Explorer', 'v4 Import successfully restored userProfile.displayName');
  assert(importedProfile.preferredCurrency === 'JPY', 'v4 Import successfully restored userProfile.preferredCurrency');
  assert(importedProfile.homeCountry === 'Japan', 'v4 Import successfully restored userProfile.homeCountry');

  console.log('\n--- TEST SUITE 4: Non-Destructive Startup & Onboarding Protection ---');

  // Test that seedInitialDataIfEmpty does not wipe user records
  let tripCleared = false;
  (db.trips as any).clear = async () => { tripCleared = true; };
  (db.saveCountry as any) = async () => {};
  (db.saveCategory as any) = async () => {};
  (db.trips as any).toArray = async () => mockTrips;

  await seedInitialDataIfEmpty();
  assert(tripCleared === false, 'seedInitialDataIfEmpty() NEVER calls clear() on trips');

  // Test existing user detection protects user records and flags
  (db.trips as any).count = async () => 1;
  (db.journalEntries as any).count = async () => 0;
  (db.collectionItems as any).count = async () => 0;
  mockLocalStorage.removeItem(ONBOARDING_COMPLETED_KEY);

  const status = await determineInitialOnboardingStatus();
  assert(status.shouldShowOnboarding === false, 'Existing user with saved trips is protected from onboarding');
  assert(status.isExistingUser === true, 'Existing user detected');
  assert(mockLocalStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true', 'Onboarding flag set for existing user to protect on future launches');

  console.log(`\n========================================`);
  console.log(`Safe Update & Migration Tests: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL SAFE UPDATE & MIGRATION TESTS PASSED! ✓');
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
