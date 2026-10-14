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

import { getCollectionItemTripAssociation } from '../utils/collectionAssociation.ts';
import type { CollectionItem, Trip } from '../types';
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
  console.log('--- TEST SUITE: Collection Item Trip Association & Reconciliation ---');
  console.log('===============================================================\n');

  // Test Fixtures
  const mockTrips: Trip[] = [
    {
      id: 'trip-kazakhstan-2026',
      name: 'Kazakhstan Odyssey',
      destination: 'Almaty & Astana, Kazakhstan',
      country: 'Kazakhstan',
      startDate: '2026-10-10',
      endDate: '2026-10-24',
      budget: 1800,
      currency: 'USD',
      coverImage: 'https://images.unsplash.com/kazakhstan',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
    {
      id: 'trip-japan-2026',
      name: 'Tokyo & Kyoto Autumn',
      destination: 'Tokyo, Japan',
      country: 'Japan',
      startDate: '2026-11-01',
      endDate: '2026-11-15',
      budget: 2500,
      currency: 'USD',
      coverImage: 'https://images.unsplash.com/japan',
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  // --------------------------------------------------------------------------
  // Scenario 1: A global collection item with no trip association
  // --------------------------------------------------------------------------
  console.log('--- SCENARIO 1: Global Collection Item with No Trip Association ---');
  {
    const globalItem: CollectionItem = {
      id: 'col-global-1',
      title: 'Besbarmak at Navat',
      country: 'Kazakhstan',
      category: 'food',
      status: 'inbox',
      notes: 'Traditional horse meat dish with flat noodles',
      tags: ['food', 'traditional'],
      createdAt: '2026-10-13T10:00:00.000Z',
    };

    const association = getCollectionItemTripAssociation(globalItem, mockTrips);

    assert(association.isAssigned === false, 'isAssigned is strictly false for global unassigned item');
    assert(association.isGlobal === true, 'isGlobal is true');
    assert(association.linkedTrip === undefined, 'linkedTrip is undefined');
    assert(association.tripId === undefined, 'tripId is undefined');
    assert(association.collectionCountry === 'Kazakhstan', 'collectionCountry is preserved as Kazakhstan');
    assert(association.displayStatus === 'inbox', 'displayStatus is inbox');
    assert(association.statusBadgeText === '📥 Global Spot', 'statusBadgeText is neutral "📥 Global Spot" (never "Assigned to Trip")');
    assert(association.isPlannedInItinerary === false, 'isPlannedInItinerary is false');
  }

  // --------------------------------------------------------------------------
  // Scenario 2: An item explicitly assigned to a trip
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 2: Explicitly Assigned Trip Association ---');
  {
    const assignedItem: CollectionItem = {
      id: 'col-assigned-1',
      title: 'Shymbulak Ski Resort',
      country: 'Kazakhstan',
      category: 'attraction',
      status: 'assigned',
      tripId: 'trip-kazakhstan-2026',
      isPlanned: true,
      notes: 'Cable car to highest point for mountain vistas',
      tags: ['mountains', 'views'],
      createdAt: '2026-10-13T11:00:00.000Z',
    };

    const association = getCollectionItemTripAssociation(assignedItem, mockTrips);

    assert(association.isAssigned === true, 'isAssigned is strictly true');
    assert(association.isGlobal === false, 'isGlobal is false');
    assert(association.linkedTrip !== undefined, 'linkedTrip is resolved');
    assert(association.linkedTrip?.id === 'trip-kazakhstan-2026', 'linkedTrip ID matches');
    assert(association.tripName === 'Kazakhstan Odyssey', 'tripName correctly resolved');
    assert(association.statusBadgeText === '🎒 Assigned to Trip', 'statusBadgeText is "🎒 Assigned to Trip"');
    assert(association.isPlannedInItinerary === true, 'isPlannedInItinerary is true');
  }

  // --------------------------------------------------------------------------
  // Scenario 3: Item assigned to a trip while remaining in a global country collection
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 3: Distinct Collection Folder vs Trip Linkage ---');
  {
    const itemInJapanCollectionForKazakhstanTrip: CollectionItem = {
      id: 'col-cross-1',
      title: 'Almaty Central Mosque',
      country: 'Kazakhstan', // Stored in Kazakhstan collection drawer
      category: 'place',
      status: 'assigned',
      tripId: 'trip-kazakhstan-2026', // Explicitly linked to Kazakhstan journey
      notes: 'Beautiful golden domes',
      createdAt: '2026-10-13T12:00:00.000Z',
    };

    const association = getCollectionItemTripAssociation(itemInJapanCollectionForKazakhstanTrip, mockTrips);

    assert(association.collectionCountry === 'Kazakhstan', 'Collection drawer remains Kazakhstan');
    assert(association.linkedTrip?.name === 'Kazakhstan Odyssey', 'Trip link is Kazakhstan Odyssey');
    assert(association.isAssigned === true, 'Item is assigned');
    assert(!association.isGlobal, 'Item is not global');
  }

  // --------------------------------------------------------------------------
  // Scenario 4: Dynamic State Transition (Assigning and immediate updates)
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 4: Dynamic Assignment State Transition ---');
  {
    // Step 1: Initial unassigned state
    let itemState: CollectionItem = {
      id: 'col-dynamic-1',
      title: 'Kolsai Lakes Day Trip',
      country: 'Kazakhstan',
      category: 'place',
      status: 'inbox',
      createdAt: '2026-10-13T13:00:00.000Z',
    };

    let assoc = getCollectionItemTripAssociation(itemState, mockTrips);
    assert(assoc.isAssigned === false, 'Initially unassigned');
    assert(assoc.statusBadgeText === '📥 Global Spot', 'Initial badge is 📥 Global Spot');

    // Step 2: User assigns to trip
    itemState = {
      ...itemState,
      tripId: 'trip-kazakhstan-2026',
      status: 'assigned',
    };

    assoc = getCollectionItemTripAssociation(itemState, mockTrips);
    assert(assoc.isAssigned === true, 'Immediately reflects isAssigned = true after linking');
    assert(assoc.statusBadgeText === '🎒 Assigned to Trip', 'Badge immediately transitions to 🎒 Assigned to Trip');
    assert(assoc.tripName === 'Kazakhstan Odyssey', 'Immediately provides linked trip name');
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Changing and Removing an Association
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 5: Changing and Removing Trip Association ---');
  {
    let itemState: CollectionItem = {
      id: 'col-change-1',
      title: 'Multi-Country Transit Note',
      country: 'General',
      category: 'link',
      url: 'https://example.com/transit',
      status: 'assigned',
      tripId: 'trip-kazakhstan-2026',
      notes: 'Visa information and customs requirements',
      tags: ['transit', 'visa'],
      createdAt: '2026-10-13T14:00:00.000Z',
    };

    // 1. Change trip to Japan
    itemState = {
      ...itemState,
      tripId: 'trip-japan-2026',
    };
    let assoc = getCollectionItemTripAssociation(itemState, mockTrips);
    assert(assoc.isAssigned === true, 'Assigned after change');
    assert(assoc.tripName === 'Tokyo & Kyoto Autumn', 'Trip changed to Tokyo & Kyoto Autumn');

    // 2. Remove from trip
    itemState = {
      ...itemState,
      tripId: undefined,
      status: 'inbox',
      isPlanned: false,
    };
    assoc = getCollectionItemTripAssociation(itemState, mockTrips);
    assert(assoc.isAssigned === false, 'isAssigned is false after removal');
    assert(assoc.statusBadgeText === '📥 Global Spot', 'Badge returned to neutral 📥 Global Spot');
    assert(assoc.isGlobal === true, 'isGlobal is true after removal');
    assert(itemState.notes === 'Visa information and customs requirements', 'Notes safely preserved after removal');
    assert(itemState.url === 'https://example.com/transit', 'URL safely preserved after removal');
    assert(itemState.country === 'General', 'Country collection folder preserved after removal');
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Reopening an Item After Restarting the App / In-Memory Cache Cleared
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 6: App Restart & Cold Re-Evaluation ---');
  {
    // Re-evaluating fresh object references (as happens on cold launch after dexie query)
    const freshQueriedItem: CollectionItem = JSON.parse(JSON.stringify({
      id: 'col-cold-1',
      title: 'Green Bazaar Dried Fruits',
      country: 'Kazakhstan',
      category: 'food',
      status: 'assigned',
      tripId: 'trip-kazakhstan-2026',
      createdAt: '2026-10-13T15:00:00.000Z',
    }));

    const freshQueriedTrips: Trip[] = JSON.parse(JSON.stringify(mockTrips));

    const assoc = getCollectionItemTripAssociation(freshQueriedItem, freshQueriedTrips);
    assert(assoc.isAssigned === true, 'Cold query correctly resolves trip association');
    assert(assoc.tripName === 'Kazakhstan Odyssey', 'Cold query derives correct trip name');
  }

  // --------------------------------------------------------------------------
  // Scenario 7: Legacy or Inconsistent Relationship Data
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 7: Legacy / Inconsistent Data Handling ---');
  {
    // Case 7a: Exact screenshot bug -> status: 'assigned' but NO tripId
    const screenshotBugItem: CollectionItem = {
      id: 'col-bug-screenshot',
      title: 'Foods to try',
      country: 'Kazakhstan',
      category: 'food',
      status: 'assigned', // Inconsistent legacy flag!
      tripId: undefined,   // No trip attached!
      notes: 'No notes recorded yet.',
      url: 'https://www.instagram.com/reel/DXOQAIBjXkz/?cplk=Z3RwdzdkbGt1cnQ4',
      tags: ['Food', 'almaty', 'cafes', 'restaurants'],
      createdAt: '2026-10-13T10:33:00.000Z',
    };

    const assoc = getCollectionItemTripAssociation(screenshotBugItem, mockTrips);

    assert(assoc.isAssigned === false, 'Authoritative selector overrides stale status="assigned" when tripId is missing');
    assert(assoc.statusBadgeText === '📥 Global Spot', 'Badge is "📥 Global Spot", preventing contradiction');
    assert(assoc.isGlobal === true, 'Item is marked global');
    assert(assoc.linkedTrip === undefined, 'No linked trip returned');

    // Case 7b: Item points to deleted/orphaned tripId
    const orphanedItem: CollectionItem = {
      id: 'col-orphaned-1',
      title: 'Ghost Trip Item',
      country: 'France',
      category: 'place',
      status: 'assigned',
      tripId: 'non-existent-trip-999',
      createdAt: '2026-10-13T16:00:00.000Z',
    };

    const orphanedAssoc = getCollectionItemTripAssociation(orphanedItem, mockTrips);
    assert(orphanedAssoc.isAssigned === false, 'Orphaned tripId yields isAssigned = false');
    assert(orphanedAssoc.linkedTrip === undefined, 'Orphaned trip yields undefined linkedTrip');
    assert(orphanedAssoc.statusBadgeText === '📥 Global Spot', 'Orphaned item badge is neutral 📥 Global Spot');

    // Case 7c: Archived item with missing or deleted tripId
    const archivedItem: CollectionItem = {
      id: 'col-archived-1',
      title: 'Old Museum Pass',
      country: 'Japan',
      category: 'ticket',
      status: 'archived',
      tripId: undefined,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const archivedAssoc = getCollectionItemTripAssociation(archivedItem, mockTrips);
    assert(archivedAssoc.isAssigned === false, 'Archived item is not assigned');
    assert(archivedAssoc.statusBadgeText === '📦 Archived', 'Archived badge text is 📦 Archived');
    assert(archivedAssoc.displayStatus === 'archived', 'Archived displayStatus is preserved');
  }

  // --------------------------------------------------------------------------
  // Scenario 8: Country and Collection Names Do NOT Create False Associations
  // --------------------------------------------------------------------------
  console.log('\n--- SCENARIO 8: Protection Against False Inferred Associations ---');
  {
    // Item is in Kazakhstan collection. A trip to Kazakhstan exists.
    // BUT the item was NOT explicitly assigned to that trip.
    const unassignedKazakhstanItem: CollectionItem = {
      id: 'col-kaz-unlinked',
      title: 'Kok Tobe Cable Car',
      country: 'Kazakhstan', // Matches trip country
      category: 'attraction',
      status: 'inbox',
      tripId: undefined, // NOT explicitly linked!
      createdAt: '2026-10-13T17:00:00.000Z',
    };

    const assoc = getCollectionItemTripAssociation(unassignedKazakhstanItem, mockTrips);

    assert(assoc.isAssigned === false, 'Matching country name ("Kazakhstan") does NOT create trip association');
    assert(assoc.linkedTrip === undefined, 'linkedTrip is strictly undefined');
    assert(assoc.statusBadgeText === '📥 Global Spot', 'Badge is 📥 Global Spot');
    assert(assoc.collectionCountry === 'Kazakhstan', 'Collection country is preserved');

    // Verify code inspects SaveItemModal to ensure no auto-matching by country remains
    const saveModalPath = path.resolve(process.cwd(), 'src/components/collection/SaveItemModal.tsx');
    const saveModalContent = fs.readFileSync(saveModalPath, 'utf8');
    assert(!saveModalContent.includes('matchingTrip'), 'SaveItemModal.tsx does NOT contain country-guessing matchingTrip heuristic');
    assert(!saveModalContent.includes("status: 'assigned'"), 'SaveItemModal.tsx does NOT hardcode status: "assigned" on creation');

    // Verify QuickAddModal to ensure no hardcoded status: 'assigned'
    const quickAddPath = path.resolve(process.cwd(), 'src/components/common/QuickAddModal.tsx');
    const quickAddContent = fs.readFileSync(quickAddPath, 'utf8');
    assert(!quickAddContent.includes("status: 'assigned',"), 'QuickAddModal.tsx does NOT hardcode status: "assigned" without tripId');

    // Verify CollectionItemDetailView uses authoritative association
    const detailViewPath = path.resolve(process.cwd(), 'src/components/collection/CollectionItemDetailView.tsx');
    const detailViewContent = fs.readFileSync(detailViewPath, 'utf8');
    assert(detailViewContent.includes('getCollectionItemTripAssociation'), 'CollectionItemDetailView uses getCollectionItemTripAssociation');
    assert(detailViewContent.includes('association?.isAssigned ?'), 'CollectionItemDetailView top badge checks association?.isAssigned');
    assert(detailViewContent.includes('AssignTripModal'), 'CollectionItemDetailView mounts AssignTripModal');

    // Verify database reconciliation routine exists
    const dbPath = path.resolve(process.cwd(), 'src/db/database.ts');
    const dbContent = fs.readFileSync(dbPath, 'utf8');
    assert(dbContent.includes('reconcileCollectionAssociations'), 'database.ts contains reconcileCollectionAssociations');
    assert(dbContent.includes('await db.reconcileCollectionAssociations()'), 'database.ts automatically calls reconcile on startup');
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`COLLECTION ITEM TRIP ASSOCIATION TESTS: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
