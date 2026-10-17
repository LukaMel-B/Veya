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

  // Test 6: Worldwide ISO 3166-1 Alpha-2 Dataset & Search
  console.log('\nTest 6: ISO 3166-1 Alpha-2 Dataset Coverage & Offline Search');
  const { 
    COUNTRIES_DATA, 
    searchCountries, 
    findCountryByNameOrCode, 
    normalizeCountryName 
  } = await import('../data/countriesData.ts');

  assert(COUNTRIES_DATA.length >= 240, `Complete worldwide coverage: ${COUNTRIES_DATA.length} countries/territories bundled`);
  
  const japanFound = findCountryByNameOrCode('Japan');
  assert(japanFound?.code === 'JP', 'Japan resolved to ISO code JP');
  assert(japanFound?.flag === '🇯🇵', 'Japan has correct flag emoji');

  // Search queries
  const searchSwitz = searchCountries('switz');
  assert(searchSwitz.some((c) => c.name === 'Switzerland'), 'Search "switz" finds Switzerland');

  // Alternate spellings & aliases
  const usaSearch = findCountryByNameOrCode('USA');
  assert(usaSearch?.name === 'United States', 'Alternate spelling "USA" resolves to United States');
  assert(usaSearch?.code === 'US', 'USA resolves to ISO code US');

  const ukSearch = findCountryByNameOrCode('UK');
  assert(ukSearch?.name === 'United Kingdom', 'Alternate spelling "UK" resolves to United Kingdom');

  const hollandSearch = findCountryByNameOrCode('Holland');
  assert(hollandSearch?.name === 'Netherlands', 'Alternate spelling "Holland" resolves to Netherlands');

  const uaeSearch = findCountryByNameOrCode('UAE');
  assert(uaeSearch?.name === 'United Arab Emirates', 'Alternate spelling "UAE" resolves to United Arab Emirates');

  const normalized = normalizeCountryName('united states of america');
  assert(normalized === 'United States', 'normalizeCountryName normalizes full aliases to canonical display name');

  // Test 7: Duplicate Folder Prevention with Alternate Spellings
  console.log('\nTest 7: Duplicate Prevention in saveCountry');
  const dbCountriesMap = new Map<string, any>();
  (db.countries as any).get = async (id: string) => dbCountriesMap.get(id.toLowerCase());
  (db.countries as any).put = async (dossier: any) => { dbCountriesMap.set(dossier.id.toLowerCase(), dossier); };
  (db.countries as any).update = async (id: string, updates: any) => {
    const cur = dbCountriesMap.get(id.toLowerCase());
    if (cur) dbCountriesMap.set(id.toLowerCase(), { ...cur, ...updates });
  };
  (db.countries as any).where = (field: string) => ({
    equalsIgnoreCase: (val: string) => ({
      first: async () => {
        for (const v of dbCountriesMap.values()) {
          if (v[field]?.toLowerCase() === val.toLowerCase()) return v;
        }
        return undefined;
      },
      delete: async () => {
        for (const [k, v] of dbCountriesMap.entries()) {
          if (v[field]?.toLowerCase() === val.toLowerCase()) dbCountriesMap.delete(k);
        }
      },
    }),
  });

  // Save via alias 'USA'
  await db.saveCountry('USA');
  assert(dbCountriesMap.has('united states'), 'Saving "USA" creates canonical "united states" folder');
  assert(dbCountriesMap.size === 1, 'Exactly 1 country folder exists');

  // Attempt duplicate save via 'United States'
  await db.saveCountry('United States');
  assert(dbCountriesMap.size === 1, 'Duplicate save via "United States" does not create second folder');

  // Attempt duplicate save via lowercase 'us'
  await db.saveCountry('US');
  assert(dbCountriesMap.size === 1, 'Duplicate save via code "US" does not create second folder');

  // Test 8: Country Folder Detail Editing
  console.log('\nTest 8: Country Folder Detail Editing');
  const customCover = 'https://images.unsplash.com/custom-swiss-photo';
  const customNotes = 'Must visit Lauterbrunnen and ride the Glacier Express';
  
  await db.saveCountry('Switzerland', customCover, 'CH', customNotes);
  const swissDossier = dbCountriesMap.get('switzerland');
  assert(swissDossier && swissDossier.name === 'Switzerland', 'Switzerland dossier created');
  assert(swissDossier && swissDossier.coverImage === customCover, 'Custom cover image saved');
  assert(swissDossier && swissDossier.notes === customNotes, 'Custom destination notes saved');
  assert(swissDossier && swissDossier.code === 'CH', 'ISO code CH attached');

  // Update Swiss notes
  const updatedNotes = 'Updated: Lauterbrunnen, Zermatt, and Jungfraujoch';
  await db.saveCountry('Switzerland', undefined, undefined, updatedNotes);
  const updatedSwiss = dbCountriesMap.get('switzerland');
  assert(updatedSwiss.notes === updatedNotes, 'Notes updated without modifying folder identity');
  assert(updatedSwiss.coverImage === customCover, 'Cover image retained across partial update');

  // Test 9: UI Components & Touch Optimizations
  console.log('\nTest 9: CountryPicker & EditCountryModal UI Invariants');
  const countryPickerPath = path.resolve(process.cwd(), 'src/components/common/CountryPicker.tsx');
  const countryPickerContent = fs.readFileSync(countryPickerPath, 'utf-8');
  assert(countryPickerContent.includes('touchMoved'), 'CountryPicker includes touch scroll disambiguation');
  assert(countryPickerContent.includes("minHeight: '44px'"), 'CountryPicker options adhere to 44px touch target');
  assert(countryPickerContent.includes('country.code'), 'CountryPicker displays ISO 3166-1 alpha-2 code badge');

  const editCountryModalPath = path.resolve(process.cwd(), 'src/components/collection/EditCountryModal.tsx');
  assert(fs.existsSync(editCountryModalPath), 'EditCountryModal component exists');
  const editModalContent = fs.readFileSync(editCountryModalPath, 'utf-8');
  assert(editModalContent.includes('Cover Photo URL'), 'EditCountryModal supports cover photo URL');
  assert(editModalContent.includes('Curated Photo Presets'), 'EditCountryModal provides curated photo presets');
  assert(editModalContent.includes('Destination Vision & Notes'), 'EditCountryModal supports destination notes');

  const collectionContent = fs.readFileSync(collectionViewPath, 'utf-8');
  assert(collectionContent.includes('EditCountryModal'), 'CollectionView imports and renders EditCountryModal');
  assert(collectionContent.includes('CountryPicker'), 'CollectionView imports and uses CountryPicker');
  assert(collectionContent.includes('ModalPortal'), 'CollectionView wraps create modal in ModalPortal');

  const onboardingPath = path.resolve(process.cwd(), 'src/components/onboarding/OnboardingModal.tsx');
  const onboardingContent = fs.readFileSync(onboardingPath, 'utf-8');
  assert(onboardingContent.includes('CountryPicker'), 'OnboardingModal uses CountryPicker for country selection');
  assert(onboardingContent.includes("useState(userProfile.dreamCountry || '')"), 'OnboardingModal defaults dreamCountry to empty on fresh install');

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
