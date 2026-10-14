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

import { db } from '../db/database.ts';
import {
  SAMPLE_TRIP_IDS,
  SAMPLE_PLACE_IDS,
  SAMPLE_COLLECTION_IDS,
  SAMPLE_JOURNAL_IDS,
  isSampleTrip,
  isTripEdited,
  isSampleJournal,
  isJournalEdited,
  isSampleCollectionItem,
  isCollectionItemEdited,
  inspectDummyDataForRemoval,
  removeDummyData,
} from '../db/provenance.ts';
import { getSampleCollectionItems, getSampleJournalEntries } from '../db/seedData.ts';
import type { Trip, CollectionItem, JournalEntry, Place, ItineraryEvent, Booking, Expense, EssentialItem, VaultDocument } from '../types';

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
  console.log('--- TEST SUITE 1: Dummy-Data Provenance & Reliable Tracking (No Guessing on Names) ---');

  // 1. Verify known sample IDs registry
  assert(SAMPLE_TRIP_IDS.has('trip-tokyo-2026'), 'Tokyo sample trip ID registered');
  assert(SAMPLE_TRIP_IDS.has('trip-swiss-2026'), 'Swiss sample trip ID registered');
  assert(SAMPLE_TRIP_IDS.has('trip-kazakhstan-2026'), 'Kazakhstan sample trip ID registered');
  assert(SAMPLE_TRIP_IDS.size === 3, 'Sample trip IDs count is exactly 3');

  assert(SAMPLE_PLACE_IDS.has('place-shinjuku-gyoen'), 'Shinjuku Gyoen place ID registered');
  assert(SAMPLE_PLACE_IDS.size === 6, 'Sample place IDs count is 6');

  assert(SAMPLE_COLLECTION_IDS.has('col-1'), 'col-1 collection item ID registered');
  assert(SAMPLE_COLLECTION_IDS.size === 15, 'Sample collection item IDs count is 15');

  assert(SAMPLE_JOURNAL_IDS.has('journal-standalone-1'), 'Standalone journal ID registered');
  assert(SAMPLE_JOURNAL_IDS.has('journal-trip-1'), 'Trip journal ID registered');
  assert(SAMPLE_JOURNAL_IDS.size === 4, 'Sample journal IDs count is 4');

  // 2. Never guess based on record names!
  const userTripWithSampleName: Trip = {
    id: 'user-trip-custom-1',
    name: 'Tokyo Sakura & Neon Odyssey', // Same name, but custom ID and no isSample
    destination: 'Tokyo & Kyoto, Japan',
    startDate: '2027-04-01',
    endDate: '2027-04-10',
    status: 'planning',
    defaultCurrency: 'INR',
    plannedBudget: 200000,
    travelers: ['Me'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(!isSampleTrip(userTripWithSampleName), 'User trip with sample name is NOT identified as dummy data (never guesses based on names)');

  const userJournalWithSampleTitle: JournalEntry = {
    id: 'user-journal-custom-1',
    title: 'Sunset at Gokarna Om Beach', // Same title, but user created
    content: 'My own sunset experience years later...',
    date: '2026-05-10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(!isSampleJournal(userJournalWithSampleTitle), 'User journal with sample title is NOT identified as dummy data');

  const userColItemWithSampleTitle: CollectionItem = {
    id: 'user-col-custom-1',
    title: 'Secret Omoide Yokocho Yakitori Alley',
    type: 'place',
    status: 'inbox',
    country: 'Japan',
    category: 'food',
    tags: ['Food'],
    createdAt: new Date().toISOString(),
  };

  assert(!isSampleCollectionItem(userColItemWithSampleTitle), 'User collection item with sample title is NOT identified as dummy data');

  console.log('\n--- TEST SUITE 2: Subsequent Edits Detection & Preservation ---');

  // Untouched sample trip
  const untouchedTrip: Trip = {
    id: 'trip-tokyo-2026',
    name: 'Tokyo Sakura & Neon Odyssey',
    destination: 'Tokyo & Kyoto, Japan',
    country: 'Japan',
    startDate: '2026-04-01',
    endDate: '2026-04-10',
    status: 'upcoming',
    defaultCurrency: 'INR',
    plannedBudget: 185000,
    travelers: ['Alex (Me)', 'Mia', 'Kenji'],
    isSample: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert(!isTripEdited(untouchedTrip), 'Untouched sample trip reports isTripEdited = false');

  // Edited sample trip (renamed)
  const editedTripName: Trip = {
    ...untouchedTrip,
    name: 'Tokyo 2026 with My Family',
  };
  assert(isTripEdited(editedTripName), 'Sample trip with modified name reports isTripEdited = true');

  // Edited sample trip (budget changed)
  const editedTripBudget: Trip = {
    ...untouchedTrip,
    plannedBudget: 250000,
  };
  assert(isTripEdited(editedTripBudget), 'Sample trip with modified budget reports isTripEdited = true');

  // Explicitly marked isEdited
  const explicitEditedTrip: Trip = {
    ...untouchedTrip,
    isEdited: true,
  };
  assert(isTripEdited(explicitEditedTrip), 'Sample trip with isEdited = true reports isTripEdited = true');

  // Untouched sample journal
  const untouchedJournal: JournalEntry = {
    id: 'journal-standalone-1',
    title: 'Sunset at Gokarna Om Beach',
    content: 'Original content...',
    date: '2023-04-18',
    isSample: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert(!isJournalEdited(untouchedJournal), 'Untouched sample journal reports isJournalEdited = false');

  // Edited sample journal (title changed)
  const editedJournal: JournalEntry = {
    ...untouchedJournal,
    title: 'My Custom Gokarna Sunset Reflection',
  };
  assert(isJournalEdited(editedJournal), 'Sample journal with modified title reports isJournalEdited = true');

  // Edited sample collection item
  const untouchedCol: CollectionItem = {
    id: 'col-1',
    title: 'Secret Omoide Yokocho Yakitori Alley',
    type: 'place',
    status: 'assigned',
    country: 'Japan',
    category: 'food',
    tags: ['Food'],
    isSample: true,
    createdAt: new Date().toISOString(),
  };
  assert(!isCollectionItemEdited(untouchedCol), 'Untouched sample collection item reports isCollectionItemEdited = false');

  const editedCol: CollectionItem = {
    ...untouchedCol,
    title: 'My Favorite Yakitori Alley (Updated)',
  };
  assert(isCollectionItemEdited(editedCol), 'Sample collection item with modified title reports isCollectionItemEdited = true');

  console.log('\n--- TEST SUITE 3: Inspection & Preview Engine (inspectDummyDataForRemoval) ---');

  // Mock in-memory tables for inspection test
  const mockTripsTable: Trip[] = [
    { ...untouchedTrip }, // 1 removable sample trip
    { ...editedTripName }, // 1 edited sample trip (PRESERVED)
    { ...userTripWithSampleName }, // 1 user trip (PRESERVED)
  ];
  const mockPlacesTable: Place[] = [
    { id: 'place-shinjuku-gyoen', name: 'Shinjuku Gyoen', category: 'nature', isSample: true, createdAt: '' },
    { id: 'user-place-1', name: 'My Local Cafe', category: 'food', createdAt: '' },
  ];
  const mockColTable: CollectionItem[] = [
    { ...untouchedCol }, // 1 removable sample collection item
    { ...editedCol }, // 1 edited sample collection item (PRESERVED)
    { ...userColItemWithSampleTitle }, // 1 user collection item (PRESERVED)
  ];
  const mockJournalsTable: JournalEntry[] = [
    { ...untouchedJournal }, // 1 removable sample journal
    { ...editedJournal }, // 1 edited sample journal (PRESERVED)
    { ...userJournalWithSampleTitle }, // 1 user journal (PRESERVED)
  ];

  (db.trips as any).toArray = async () => mockTripsTable;
  (db.places as any).toArray = async () => mockPlacesTable;
  (db.collectionItems as any).toArray = async () => mockColTable;
  (db.itineraryEvents as any).toArray = async () => [];
  (db.bookings as any).toArray = async () => [];
  (db.expenses as any).toArray = async () => [];
  (db.essentials as any).toArray = async () => [];
  (db.documents as any).toArray = async () => [];
  (db.journalEntries as any).toArray = async () => mockJournalsTable;

  const preview = await inspectDummyDataForRemoval();

  assert(preview.hasRemovableData === true, 'Preview detects removable dummy data');
  assert(preview.removableCounts.trips === 1, 'Only 1 unedited trip marked for removal');
  assert(preview.removableCounts.places === 1, 'Only 1 unedited place marked for removal');
  assert(preview.removableCounts.collectionItems === 1, 'Only 1 unedited collection item marked for removal');
  assert(preview.removableCounts.journalEntries === 1, 'Only 1 unedited journal memory marked for removal');
  assert(preview.preservedUserCounts.trips === 2, '2 trips preserved (1 edited sample trip + 1 user trip)');
  assert(preview.preservedUserCounts.collectionItems === 2, '2 collection items preserved (1 edited + 1 user item)');
  assert(preview.preservedUserCounts.journalEntries === 2, '2 journals preserved (1 edited + 1 user memory)');
  assert(preview.editedSampleRecords.some(r => r.title === 'Tokyo 2026 with My Family'), 'Edited trip listed in preserved records');
  assert(preview.editedSampleRecords.some(r => r.title === 'My Custom Gokarna Sunset Reflection'), 'Edited journal listed in preserved records');

  console.log('\n--- TEST SUITE 4: Safe Removal Execution & Foreign Key Detachment (removeDummyData) ---');

  // Verify atomic removal with detachment
  const deletedTripIds: string[] = [];
  const updatedColItems: Record<string, any> = {};
  const updatedJournals: Record<string, any> = {};

  (db.trips as any).bulkDelete = async (ids: string[]) => { deletedTripIds.push(...ids); };
  (db.places as any).bulkDelete = async () => {};
  (db.collectionItems as any).bulkDelete = async () => {};
  (db.itineraryEvents as any).bulkDelete = async () => {};
  (db.bookings as any).bulkDelete = async () => {};
  (db.expenses as any).bulkDelete = async () => {};
  (db.essentials as any).bulkDelete = async () => {};
  (db.documents as any).bulkDelete = async () => {};
  (db.journalEntries as any).bulkDelete = async () => {};

  (db.collectionItems as any).update = async (id: string, updates: any) => {
    updatedColItems[id] = updates;
  };
  (db.journalEntries as any).update = async (id: string, updates: any) => {
    updatedJournals[id] = updates;
  };
  (db.places as any).update = async () => {};
  (db.bookings as any).update = async () => {};
  (db.expenses as any).update = async () => {};

  const mockTx = async (_mode: string, _tables: any[], callback: () => Promise<any>) => {
    return callback();
  };
  (db.transaction as any) = mockTx;
  (Object.getPrototypeOf(db) as any).transaction = mockTx;

  (db.countries as any).where = () => ({
    equalsIgnoreCase: () => ({
      first: async () => ({ id: 'country-japan', name: 'Japan' }),
    }),
  });
  (db.countries as any).add = async () => {};

  // Mock a user journal linked to the removable trip
  const userJournalLinkedToDummyTrip: JournalEntry = {
    id: 'user-journal-linked-1',
    title: 'My First Day in Tokyo Notes',
    content: 'Personal notes on Tokyo...',
    date: '2026-04-02',
    tripId: 'trip-tokyo-2026', // Linked to the dummy trip!
    photos: ['data:image/jpeg;base64,samplephoto123'],
    tags: ['Tokyo', 'Personal'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockJournalsTable.push(userJournalLinkedToDummyTrip);

  // Mock a user collection item linked to the removable trip
  const userColLinkedToDummyTrip: CollectionItem = {
    id: 'user-col-linked-1',
    title: 'Ramen Street Secret Stall',
    type: 'place',
    status: 'assigned',
    country: 'General',
    category: 'food',
    tripId: 'trip-tokyo-2026', // Linked to the dummy trip!
    tags: ['Food', 'Ramen'],
    imageUrl: 'https://example.com/ramen.jpg',
    createdAt: new Date().toISOString(),
  };

  mockColTable.push(userColLinkedToDummyTrip);

  const removalResult = await removeDummyData();

  assert(deletedTripIds.includes('trip-tokyo-2026'), 'Unedited dummy trip was deleted');
  assert(!deletedTripIds.includes('user-trip-custom-1'), 'User-created trip was NOT deleted');

  // Verify linked user journal was DETACHED, not deleted!
  assert(updatedJournals['user-journal-linked-1'] !== undefined, 'Linked user journal was updated');
  assert(updatedJournals['user-journal-linked-1'].tripId === undefined, 'Linked user journal tripId was safely cleared');
  assert(updatedJournals['user-journal-linked-1'].itineraryEventId === undefined, 'Linked user journal itineraryEventId was safely cleared');

  // Verify linked user collection item was DETACHED and moved to trip country!
  assert(updatedColItems['user-col-linked-1'] !== undefined, 'Linked user collection item was updated');
  assert(updatedColItems['user-col-linked-1'].tripId === undefined, 'Linked user collection item tripId was safely cleared');
  assert(updatedColItems['user-col-linked-1'].country === 'Japan', 'Linked collection item moved to trip country "Japan"');
  assert(updatedColItems['user-col-linked-1'].status === 'inbox', 'Linked collection item returned to inbox');

  console.log('\n--- TEST SUITE 5: Safe Trip Deletion (deleteTripCascade) ---');

  // Set up mock trip with linked items and journal memories
  const tripToDelete: Trip = {
    id: 'test-trip-delete-1',
    name: 'Kyoto Autumn Walk',
    destination: 'Kyoto, Japan',
    country: 'Japan',
    startDate: '2026-11-01',
    endDate: '2026-11-08',
    status: 'planning',
    defaultCurrency: 'INR',
    plannedBudget: 120000,
    travelers: ['Alex'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tripCollectionItem: CollectionItem = {
    id: 'col-kyoto-bamboo',
    title: 'Arashiyama Bamboo Grove at Dawn',
    type: 'place',
    status: 'assigned',
    country: 'General', // Needs resolution to Japan
    category: 'place',
    tripId: 'test-trip-delete-1',
    tags: ['Nature', 'Kyoto'],
    imageUrl: 'https://images.unsplash.com/bamboo.jpg',
    notes: 'Walk early at 6:30 AM before the tour buses arrive.',
    createdAt: new Date().toISOString(),
  };

  const tripJournalMemory: JournalEntry = {
    id: 'journal-kyoto-matcha',
    title: 'Matcha by the Kamo River',
    content: 'Warm tea with the autumn leaves floating down the river...',
    date: '2026-11-03',
    tripId: 'test-trip-delete-1',
    photos: ['data:image/png;base64,matchapic'],
    tags: ['Kyoto', 'Tea', 'Memory'],
    mood: '🍵 Peaceful',
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const cascadedDeletedTables: Record<string, string[]> = {};
  const cascadedUpdatedRecords: Record<string, any> = {};

  (db.trips as any).get = async (id: string) => (id === 'test-trip-delete-1' ? tripToDelete : undefined);
  (db.trips as any).delete = async (id: string) => {
    cascadedDeletedTables['trips'] = [id];
  };

  (db.collectionItems as any).where = () => ({
    equals: () => ({
      toArray: async () => [tripCollectionItem],
    }),
  });
  (db.collectionItems as any).update = async (id: string, updates: any) => {
    cascadedUpdatedRecords[id] = updates;
  };

  (db.places as any).where = () => ({
    equals: () => ({
      toArray: async () => [{ id: 'place-kyoto-1', tripId: 'test-trip-delete-1' }],
    }),
  });
  (db.places as any).update = async (id: string, updates: any) => {
    cascadedUpdatedRecords[id] = updates;
  };

  (db.journalEntries as any).where = () => ({
    equals: () => ({
      toArray: async () => [tripJournalMemory],
    }),
  });
  (db.journalEntries as any).update = async (id: string, updates: any) => {
    cascadedUpdatedRecords[id] = updates;
  };

  (db.itineraryEvents as any).where = () => ({
    equals: () => ({ delete: async () => { cascadedDeletedTables['itineraryEvents'] = ['test-trip-delete-1']; } }),
  });
  (db.bookings as any).where = () => ({
    equals: () => ({ delete: async () => { cascadedDeletedTables['bookings'] = ['test-trip-delete-1']; } }),
  });
  (db.expenses as any).where = () => ({
    equals: () => ({ delete: async () => { cascadedDeletedTables['expenses'] = ['test-trip-delete-1']; } }),
  });
  (db.essentials as any).where = () => ({
    equals: () => ({ delete: async () => { cascadedDeletedTables['essentials'] = ['test-trip-delete-1']; } }),
  });
  (db.documents as any).where = () => ({
    equals: () => ({ delete: async () => { cascadedDeletedTables['documents'] = ['test-trip-delete-1']; } }),
  });
  (db.countries as any).where = () => ({
    equalsIgnoreCase: () => ({ first: async () => ({ id: 'country-japan', name: 'Japan' }) }),
  });

  await db.deleteTripCascade('test-trip-delete-1');

  // Verify trip was deleted
  assert(cascadedDeletedTables['trips']?.includes('test-trip-delete-1'), 'Trip was deleted from trips table');
  assert(cascadedDeletedTables['itineraryEvents'] !== undefined, 'Itinerary events were deleted');
  assert(cascadedDeletedTables['bookings'] !== undefined, 'Bookings were deleted');
  assert(cascadedDeletedTables['expenses'] !== undefined, 'Expenses were deleted');
  assert(cascadedDeletedTables['essentials'] !== undefined, 'Essentials were deleted');
  assert(cascadedDeletedTables['documents'] !== undefined, 'Documents were deleted');

  // Verify collection item was DETACHED, not deleted!
  assert(cascadedUpdatedRecords['col-kyoto-bamboo'] !== undefined, 'Collection item was detached and updated');
  assert(cascadedUpdatedRecords['col-kyoto-bamboo'].tripId === undefined, 'Collection item tripId cleared');
  assert(cascadedUpdatedRecords['col-kyoto-bamboo'].country === 'Japan', 'Collection item assigned to trip country "Japan"');
  assert(cascadedUpdatedRecords['col-kyoto-bamboo'].status === 'inbox', 'Collection item status set to inbox');

  // Verify journal memory was DETACHED, not deleted!
  assert(cascadedUpdatedRecords['journal-kyoto-matcha'] !== undefined, 'Journal memory was detached and updated');
  assert(cascadedUpdatedRecords['journal-kyoto-matcha'].tripId === undefined, 'Journal memory tripId cleared');
  assert(cascadedUpdatedRecords['journal-kyoto-matcha'].locationName === 'Kyoto, Japan', 'Journal memory location context preserved from trip');

  // Verify place was unlinked, not deleted!
  assert(cascadedUpdatedRecords['place-kyoto-1'] !== undefined, 'Place was unlinked');
  assert(cascadedUpdatedRecords['place-kyoto-1'].tripId === undefined, 'Place tripId set to undefined');

  console.log('\n--- TEST SUITE 6: Seed Functions isSample Tagging ---');

  const sampleItems = getSampleCollectionItems();
  assert(sampleItems.length === 15, '15 sample collection items returned');
  assert(sampleItems.every(i => i.isSample === true), 'All sample collection items have isSample = true');

  const sampleJournals = getSampleJournalEntries();
  assert(sampleJournals.length === 4, '4 sample journal entries returned');
  assert(sampleJournals.every(j => j.isSample === true), 'All sample journal entries have isSample = true');

  console.log('\n========================================');
  console.log(`Dummy Removal & Trip Deletion Tests: ${passed} Passed, ${failed} Failed`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL DUMMY REMOVAL & TRIP DELETION TESTS PASSED! ✓\n');
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
