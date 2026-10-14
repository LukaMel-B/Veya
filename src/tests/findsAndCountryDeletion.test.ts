declare const process: any;

// Mock browser environment before imports
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => { storageMap.set(key, value); },
  removeItem: (key: string) => { storageMap.delete(key); },
  clear: () => { storageMap.clear(); },
};
(globalThis as any).localStorage = mockLocalStorage;

(globalThis as any).indexedDB = {
  open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null }),
};

import { db } from '../db/database.ts';
import { seedInitialDataIfEmpty } from '../db/seedData.ts';
import { getStoredUserProfile, saveStoredUserProfile } from '../utils/profileUtils.ts';
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
  console.log('\n===============================================================');
  console.log('--- TEST SUITE: Finds Rename, Country Deletion & Blank Onboarding ---');
  console.log('===============================================================\n');

  // Test 1: Navigation and UI Strings are Renamed to "Finds"
  console.log('Test 1: Navigation and UI Strings Rename');
  const bottomNavPath = path.resolve(process.cwd(), 'src/components/common/BottomNav.tsx');
  const bottomNavContent = fs.readFileSync(bottomNavPath, 'utf-8');
  assert(bottomNavContent.includes("label: 'Finds'"), "BottomNav has tab labeled 'Finds'");
  assert(!bottomNavContent.includes("label: 'Collection'"), "BottomNav no longer has 'Collection'");

  const collectionViewPath = path.resolve(process.cwd(), 'src/components/collection/CollectionView.tsx');
  const collectionViewContent = fs.readFileSync(collectionViewPath, 'utf-8');
  assert(collectionViewContent.includes('<h2 style={{ fontSize: \'1.45rem\', fontWeight: 700, letterSpacing: \'-0.025em\', color: \'var(--primary)\', margin: 0 }}>\n                Finds'), "CollectionView title is 'Finds'");
  assert(collectionViewContent.includes('Your Finds are Empty'), "Empty state says 'Your Finds are Empty'");
  assert(collectionViewContent.includes('Save First Find'), "Empty state CTA says 'Save First Find'");
  assert(collectionViewContent.includes('All Saved Finds'), "All Saved Finds card title is used");
  assert(collectionViewContent.includes('handleDeleteCountry'), 'CollectionView contains handleDeleteCountry handler');

  // Test 2: Genuinely New Installations Have No Preset Country Folders
  console.log('\nTest 2: seedInitialDataIfEmpty Leaves Country Table Blank');
  const countriesAdded: string[] = [];
  const origSaveCountry = db.saveCountry;
  (db as any).saveCountry = async (name: string) => {
    countriesAdded.push(name);
    return { id: name.toLowerCase(), name, createdAt: new Date().toISOString() };
  };

  mockLocalStorage.clear();
  await seedInitialDataIfEmpty();
  assert(countriesAdded.length === 0, `seedInitialDataIfEmpty does NOT seed any preset countries (added: ${countriesAdded.length})`);

  // Restore saveCountry
  db.saveCountry = origSaveCountry;

  // Test 3: Onboarding Profile Captures Dream Country
  console.log('\nTest 3: Onboarding Profile & Dream Country');
  mockLocalStorage.clear();
  const initial = getStoredUserProfile();
  assert(initial.dreamCountry === '', 'Default profile has empty dreamCountry');

  const updated = saveStoredUserProfile({
    displayName: 'Aria',
    homeCountry: 'Canada',
    dreamCountry: 'Switzerland',
    onboardingCompleted: true,
  });
  assert(updated.dreamCountry === 'Switzerland', 'Dream country saved in stored profile');

  const reloaded = getStoredUserProfile();
  assert(reloaded.dreamCountry === 'Switzerland', 'Dream country preserved across storage reads');

  // Test 4: Database deleteCountry Implementation
  console.log('\nTest 4: db.deleteCountry Safe Detachment & Deletion');
  const mockCountryStore = new Map<string, any>();
  const mockItemStore = new Map<string, any>();

  (db.countries as any).delete = async (id: string) => {
    mockCountryStore.delete(id.toLowerCase());
  };
  (db.countries as any).where = (field: string) => ({
    equalsIgnoreCase: (val: string) => ({
      delete: async () => {
        for (const [k, v] of mockCountryStore.entries()) {
          if (v.name?.toLowerCase() === val.toLowerCase()) {
            mockCountryStore.delete(k);
          }
        }
      },
    }),
  });

  (db.collectionItems as any).filter = (fn: any) => ({
    toArray: async () => Array.from(mockItemStore.values()).filter(fn),
  });
  (db.collectionItems as any).update = async (id: string, changes: any) => {
    const cur = mockItemStore.get(id);
    if (cur) mockItemStore.set(id, { ...cur, ...changes });
  };
  (db.collectionItems as any).delete = async (id: string) => {
    mockItemStore.delete(id);
  };
  (db as any).transaction = async (_mode: string, _tables: any, cb: any) => cb();

  // Populate mock data: 1 country folder, 2 items in that country
  mockCountryStore.set('iceland', { id: 'iceland', name: 'Iceland' });
  mockItemStore.set('item-1', { id: 'item-1', title: 'Blue Lagoon', country: 'Iceland', notes: 'Relaxing hot springs' });
  mockItemStore.set('item-2', { id: 'item-2', title: 'Skogafoss', country: 'Iceland', notes: 'Huge waterfall' });

  assert(mockCountryStore.has('iceland'), 'Iceland country exists before delete');
  assert(mockItemStore.size === 2, '2 items exist in mock items');

  // Perform deleteCountry with safe detachment (default)
  await db.deleteCountry('Iceland');

  assert(!mockCountryStore.has('iceland'), 'Iceland country folder successfully deleted from db.countries');
  const item1 = mockItemStore.get('item-1');
  const item2 = mockItemStore.get('item-2');
  assert(item1 && item1.country === 'General', 'Item 1 safely detached to General (no data lost)');
  assert(item1 && item1.notes === 'Relaxing hot springs', 'Item 1 notes and content 100% preserved');
  assert(item2 && item2.country === 'General', 'Item 2 safely detached to General (no data lost)');

  // Test 5: Delete Country with deleteItems: true
  mockCountryStore.set('norway', { id: 'norway', name: 'Norway' });
  mockItemStore.set('item-3', { id: 'item-3', title: 'Geirangerfjord', country: 'Norway' });
  await db.deleteCountry('Norway', { deleteItems: true });
  assert(!mockCountryStore.has('norway'), 'Norway country deleted');
  assert(!mockItemStore.has('item-3'), 'Item 3 deleted when deleteItems is true');

  console.log(`\n===============================================================`);
  console.log(`FINDS & COUNTRY DELETION TESTS: ${passed} Passed, ${failed} Failed`);
  console.log(`===============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
