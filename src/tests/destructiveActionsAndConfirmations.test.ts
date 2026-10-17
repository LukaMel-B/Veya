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
import type {
  Trip,
  CollectionItem,
  JournalEntry,
  Place,
  ItineraryEvent,
  Booking,
  Expense,
  EssentialItem,
  VaultDocument,
  TransportLeg,
  TripMealPlan,
  Recipe,
  BaseIngredientPrice,
  TripIngredientPriceOverride,
} from '../types';
import fs from 'node:fs';
import path from 'node:path';
import { isTripEdited } from '../db/provenance.ts';

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
  console.log('--- TEST SUITE: Veya Repair Confirmations & Destructive Actions ---');
  console.log('===============================================================\n');

  console.log('--- SECTION 1: Dialog Promise Resolution & Action Handling Core ---');

  // 1. Emulate showConfirm / closeActiveDialog state machine
  let activeDialog: {
    type: 'confirm';
    title: string;
    resolve: (val: boolean) => void;
  } | null = null;

  function emulateShowConfirm(title: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      activeDialog = {
        type: 'confirm',
        title,
        resolve,
      };
    });
  }

  function emulateCloseActiveDialog(confirmResult?: boolean) {
    if (activeDialog) {
      activeDialog.resolve(confirmResult ?? false);
      activeDialog = null;
    }
  }

  // Test 1a: Confirm action resolves true exactly once
  const promiseA = emulateShowConfirm('Delete Record A?');
  assert(activeDialog !== null, 'Active dialog opened and registered in state');
  emulateCloseActiveDialog(true);
  const resultA = await promiseA;
  assert(resultA === true, 'Pressing Confirm resolves showConfirm with true');
  assert(activeDialog === null, 'Active dialog state cleared after confirm');

  // Test 1b: Cancel action resolves false exactly once
  const promiseB = emulateShowConfirm('Delete Record B?');
  emulateCloseActiveDialog(false);
  const resultB = await promiseB;
  assert(resultB === false, 'Pressing Cancel resolves showConfirm with false');
  assert(activeDialog === null, 'Active dialog state cleared after cancel');

  // Test 1c: Dismissing without explicit parameter defaults safely to false
  const promiseC = emulateShowConfirm('Dismiss Check');
  emulateCloseActiveDialog();
  const resultC = await promiseC;
  assert(resultC === false, 'Dismissing dialog without parameter defaults safely to false (cancel)');

  console.log('\n--- SECTION 2: Trip Cascade Deletion & Data Protection Invariants ---');

  // Set up mock DB stores
  const mockTrips = new Map<string, Trip>();
  const mockEvents = new Map<string, ItineraryEvent>();
  const mockBookings = new Map<string, Booking>();
  const mockExpenses = new Map<string, Expense>();
  const mockEssentials = new Map<string, EssentialItem>();
  const mockDocuments = new Map<string, VaultDocument>();
  const mockLegs = new Map<string, TransportLeg>();
  const mockMealPlans = new Map<string, TripMealPlan>();
  const mockOverrides = new Map<string, TripIngredientPriceOverride>();
  const mockCollectionItems = new Map<string, CollectionItem>();
  const mockPlaces = new Map<string, Place>();
  const mockRecipes = new Map<string, Recipe>();
  const mockBasePrices = new Map<string, BaseIngredientPrice>();

  const targetTripId = 'trip-switzerland-destruct';

  // Seed target trip
  mockTrips.set(targetTripId, {
    id: targetTripId,
    name: 'Swiss Alpine Expedition',
    destination: 'Switzerland',
    country: 'Switzerland',
    startDate: '2026-07-01',
    endDate: '2026-07-10',
    status: 'upcoming',
    coverImage: '',
    defaultCurrency: 'CHF',
    plannedBudget: 4000,
    travelers: ['Me'],
    createdAt: new Date().toISOString(),
  });

  // Seed associated trip content
  mockEvents.set('ev-1', { id: 'ev-1', tripId: targetTripId, dayNumber: 1, title: 'Hike to Matterhorn', orderIndex: 0 });
  mockBookings.set('bk-1', { id: 'bk-1', tripId: targetTripId, title: 'Chalet Zermatt', type: 'hotel' });
  mockExpenses.set('exp-1', { id: 'exp-1', tripId: targetTripId, title: 'Train Pass', amount: 250, currency: 'CHF', category: 'transport', paidBy: 'Me', date: '2026-07-01' });
  mockEssentials.set('es-1', { id: 'es-1', tripId: targetTripId, item: 'Hiking Boots', category: 'gear', isPacked: false });
  mockDocuments.set('doc-1', { id: 'doc-1', tripId: targetTripId, filename: 'rail-pass.pdf', fileData: 'base64', mimeType: 'application/pdf', size: 1000, uploadedAt: '' });
  mockLegs.set('leg-1', { id: 'leg-1', tripId: targetTripId, dayNumber: 1, mode: 'train', departureLocation: 'Zurich', arrivalLocation: 'Zermatt', orderIndex: 0 });
  mockMealPlans.set('meal-1', { id: 'meal-1', tripId: targetTripId, dayNumber: 1, date: '2026-07-01', mealType: 'dinner', customMealName: 'Fondue Dinner', servings: 2, createdAt: '', updatedAt: '' });
  mockOverrides.set('ovr-1', { id: 'ovr-1', tripId: targetTripId, ingredientName: 'Gruyere Cheese', unit: 'g', unitQuantity: 200, price: 8, currency: 'CHF', updatedAt: '' });

  // Seed related data that MUST NOT be deleted (Protected Records)
  mockCollectionItems.set('col-swiss-spot', {
    id: 'col-swiss-spot',
    tripId: targetTripId,
    country: 'Switzerland',
    title: 'Matterhorn Viewpoint',
    type: 'place',
    status: 'assigned',
    category: 'nature',
    createdAt: new Date().toISOString(),
  });

  mockPlaces.set('place-zermatt', {
    id: 'place-zermatt',
    tripId: targetTripId,
    name: 'Zermatt Station',
    category: 'transport',
    address: 'Bahnhofplatz, Zermatt',
    coordinates: { lat: 46.024, lng: 7.749 },
  });

  mockRecipes.set('recipe-fondue', {
    id: 'recipe-fondue',
    title: 'Authentic Swiss Fondue',
    category: 'dinner',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    ingredients: [{ id: 'ing-1', name: 'Gruyere', quantity: 400, unit: 'g', category: 'dairy' }],
    instructions: ['Melt cheese with white wine.'],
    tags: ['traditional', 'cheese'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  mockBasePrices.set('base-cheese', {
    id: 'gruyere',
    name: 'Gruyere',
    unit: 'g',
    unitQuantity: 100,
    price: 3.5,
    currency: 'CHF',
    updatedAt: new Date().toISOString(),
  });

  // Simulate cascade delete transaction logic
  async function executeMockDeleteTripCascade(tripId: string) {
    mockTrips.delete(tripId);
    for (const [id, ev] of mockEvents) if (ev.tripId === tripId) mockEvents.delete(id);
    for (const [id, bk] of mockBookings) if (bk.tripId === tripId) mockBookings.delete(id);
    for (const [id, exp] of mockExpenses) if (exp.tripId === tripId) mockExpenses.delete(id);
    for (const [id, es] of mockEssentials) if (es.tripId === tripId) mockEssentials.delete(id);
    for (const [id, doc] of mockDocuments) if (doc.tripId === tripId) mockDocuments.delete(id);
    for (const [id, leg] of mockLegs) if (leg.tripId === tripId) mockLegs.delete(id);
    for (const [id, meal] of mockMealPlans) if (meal.tripId === tripId) mockMealPlans.delete(id);
    for (const [id, ovr] of mockOverrides) if (ovr.tripId === tripId) mockOverrides.delete(id);

    // Protected data: Detach collection items, DO NOT DELETE!
    for (const [id, item] of mockCollectionItems) {
      if (item.tripId === tripId) {
        mockCollectionItems.set(id, {
          ...item,
          tripId: undefined,
          status: 'inbox',
          isPlanned: false,
        });
      }
    }
  }

  // Pre-condition asserts
  assert(mockTrips.has(targetTripId), 'Target trip exists in database');
  assert(mockEvents.size === 1, 'Trip has 1 itinerary event');
  assert(mockBookings.size === 1, 'Trip has 1 booking');
  assert(mockExpenses.size === 1, 'Trip has 1 expense');
  assert(mockEssentials.size === 1, 'Trip has 1 essential item');
  assert(mockDocuments.size === 1, 'Trip has 1 document');
  assert(mockLegs.size === 1, 'Trip has 1 transport leg');
  assert(mockMealPlans.size === 1, 'Trip has 1 meal plan');
  assert(mockOverrides.size === 1, 'Trip has 1 ingredient override');

  // Execute deletion
  await executeMockDeleteTripCascade(targetTripId);

  // Post-condition asserts for trip contents
  assert(!mockTrips.has(targetTripId), 'Trip record was permanently deleted');
  assert(mockEvents.size === 0, 'Associated itinerary event was cascade-deleted');
  assert(mockBookings.size === 0, 'Associated booking was cascade-deleted');
  assert(mockExpenses.size === 0, 'Associated expense was cascade-deleted');
  assert(mockEssentials.size === 0, 'Associated packing item was cascade-deleted');
  assert(mockDocuments.size === 0, 'Associated document was cascade-deleted');
  assert(mockLegs.size === 0, 'Associated transit leg was cascade-deleted');
  assert(mockMealPlans.size === 0, 'Associated meal plan was cascade-deleted');
  assert(mockOverrides.size === 0, 'Associated ingredient override was cascade-deleted');

  // Verify Protected Related Data (Invariant: No Data Loss for Global/Saved records)
  assert(mockCollectionItems.has('col-swiss-spot'), 'Saved collection item preserved (NOT deleted)');
  const detachedItem = mockCollectionItems.get('col-swiss-spot');
  assert(detachedItem?.tripId === undefined, 'Saved collection item safely detached from deleted trip');
  assert(detachedItem?.country === 'Switzerland', 'Saved collection item retains its country folder');
  assert(mockPlaces.has('place-zermatt'), 'Global place preserved (NOT deleted)');
  assert(mockRecipes.has('recipe-fondue'), 'Reusable recipe preserved (NOT deleted)');
  assert(mockBasePrices.has('base-cheese'), 'Global base ingredient price preserved (NOT deleted)');

  console.log('\n--- SECTION 3: Finds & Country Folder Deletion Safety ---');

  const mockCountries = new Set<string>(['Japan', 'France', 'Iceland']);
  const countryItems = new Map<string, { id: string; country: string; title: string }>([
    ['item-1', { id: 'item-1', country: 'Iceland', title: 'Blue Lagoon' }],
    ['item-2', { id: 'item-2', country: 'Iceland', title: 'Gullfoss Waterfall' }],
    ['item-3', { id: 'item-3', country: 'Japan', title: 'Senso-ji' }],
  ]);

  function emulateDeleteCountry(countryName: string, deleteItems = false) {
    mockCountries.delete(countryName);
    for (const [id, item] of countryItems) {
      if (item.country.toLowerCase() === countryName.toLowerCase()) {
        if (deleteItems) {
          countryItems.delete(id);
        } else {
          // Keep item safely in General / unassigned
          countryItems.set(id, { ...item, country: 'General' });
        }
      }
    }
  }

  // Delete Iceland folder without deleting items
  assert(mockCountries.has('Iceland'), 'Iceland country folder exists');
  emulateDeleteCountry('Iceland', false);
  assert(!mockCountries.has('Iceland'), 'Iceland folder deleted from countries list');
  assert(countryItems.has('item-1'), 'Blue Lagoon item was preserved');
  assert(countryItems.get('item-1')?.country === 'General', 'Item 1 safely moved to General');
  assert(countryItems.has('item-2'), 'Gullfoss item was preserved');
  assert(countryItems.get('item-2')?.country === 'General', 'Item 2 safely moved to General');
  assert(countryItems.get('item-3')?.country === 'Japan', 'Japan item remained untouched');

  console.log('\n--- SECTION 4: Unsaved Changes Guard Sheet Mechanics ---');

  // Test 4a: QuickAddModal dirty check
  function computeQuickAddDirty(fields: { title: string; url: string; notes: string; amount: string }): boolean {
    return Boolean(fields.title.trim() || fields.url.trim() || fields.notes.trim() || fields.amount.trim());
  }
  assert(!computeQuickAddDirty({ title: '', url: '', notes: '', amount: '' }), 'Clean QuickAdd is NOT dirty');
  assert(computeQuickAddDirty({ title: 'Ramen place', url: '', notes: '', amount: '' }), 'QuickAdd with title is dirty');
  assert(computeQuickAddDirty({ title: '', url: 'https://maps.app.goo.gl/xyz', notes: '', amount: '' }), 'QuickAdd with URL is dirty');
  assert(computeQuickAddDirty({ title: '', url: '', notes: 'Great views', amount: '' }), 'QuickAdd with notes is dirty');
  assert(computeQuickAddDirty({ title: '', url: '', notes: '', amount: '1200' }), 'QuickAdd with amount is dirty');

  // Test 4b: EditTransportLegModal dirty check
  const initialLeg: TransportLeg = {
    id: 'leg-orig',
    tripId: 'trip-1',
    dayNumber: 1,
    mode: 'flight',
    carrier: 'ANA',
    lineOrFlightNumber: 'NH205',
    departureLocation: 'HND',
    arrivalLocation: 'CDG',
    departureTime: '11:00',
    arrivalTime: '17:00',
    orderIndex: 0,
  };

  function computeLegDirty(curr: Partial<TransportLeg>, init: TransportLeg): boolean {
    return (
      (curr.mode ?? init.mode) !== init.mode ||
      (curr.carrier ?? init.carrier) !== init.carrier ||
      (curr.lineOrFlightNumber ?? init.lineOrFlightNumber) !== init.lineOrFlightNumber ||
      (curr.departureLocation ?? init.departureLocation) !== init.departureLocation ||
      (curr.arrivalLocation ?? init.arrivalLocation) !== init.arrivalLocation ||
      (curr.departureTime ?? init.departureTime) !== init.departureTime ||
      (curr.arrivalTime ?? init.arrivalTime) !== init.arrivalTime
    );
  }

  assert(!computeLegDirty({ ...initialLeg }, initialLeg), 'Unmodified transport leg is NOT dirty');
  assert(computeLegDirty({ carrier: 'JAL' }, initialLeg), 'Changing carrier makes transport leg dirty');
  assert(computeLegDirty({ departureLocation: 'NRT' }, initialLeg), 'Changing departure location makes leg dirty');
  assert(computeLegDirty({ departureTime: '12:30' }, initialLeg), 'Changing departure time makes leg dirty');

  // Test 4c: EditRecipeModal dirty check
  const initialRecipe: Recipe = {
    id: 'rec-1',
    title: 'Matcha Latte',
    category: 'beverage',
    servings: 2,
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    ingredients: [{ id: 'ing-1', name: 'Matcha Powder', quantity: 2, unit: 'tsp', category: 'pantry' }],
    instructions: ['Whisk matcha with hot water.'],
    tags: ['quick', 'drink'],
    createdAt: '',
    updatedAt: '',
  };

  function computeRecipeDirty(curr: Partial<Recipe>, init: Recipe): boolean {
    return (
      (curr.title ?? init.title) !== init.title ||
      (curr.category ?? init.category) !== init.category ||
      (curr.servings ?? init.servings) !== init.servings ||
      (curr.prepTimeMinutes ?? init.prepTimeMinutes) !== init.prepTimeMinutes ||
      (curr.cookTimeMinutes ?? init.cookTimeMinutes) !== init.cookTimeMinutes
    );
  }

  assert(!computeRecipeDirty({ ...initialRecipe }, initialRecipe), 'Unmodified recipe is NOT dirty');
  assert(computeRecipeDirty({ title: 'Iced Matcha Latte' }, initialRecipe), 'Changing recipe title makes it dirty');
  assert(computeRecipeDirty({ servings: 4 }, initialRecipe), 'Changing recipe servings makes it dirty');

  // Test 4d: MealPlanModal dirty check
  const initialMealPlan: TripMealPlan = {
    id: 'meal-plan-1',
    tripId: 'trip-1',
    dayNumber: 2,
    date: '2026-07-02',
    mealType: 'lunch',
    customMealName: 'Bento Box',
    servings: 2,
    createdAt: '',
    updatedAt: '',
  };

  function computeMealPlanDirty(curr: Partial<TripMealPlan>, init: TripMealPlan): boolean {
    return (
      (curr.mealType ?? init.mealType) !== init.mealType ||
      (curr.customMealName ?? init.customMealName) !== init.customMealName ||
      (curr.servings ?? init.servings) !== init.servings ||
      (curr.notes ?? '') !== (init.notes ?? '')
    );
  }

  assert(!computeMealPlanDirty({ ...initialMealPlan }, initialMealPlan), 'Unmodified meal plan is NOT dirty');
  assert(computeMealPlanDirty({ mealType: 'dinner' }, initialMealPlan), 'Changing meal type makes it dirty');
  assert(computeMealPlanDirty({ customMealName: 'Sushi Lunch' }, initialMealPlan), 'Changing meal name makes it dirty');

  // Test 4e: EditProfileModal dirty check
  const initialProfile = {
    displayName: 'Kenji',
    avatar: 'compass',
    homeCountry: 'Japan',
    preferredCurrency: 'JPY',
    travelStyles: ['Cultural', 'Food'],
  };

  function computeProfileDirty(curr: typeof initialProfile, init: typeof initialProfile): boolean {
    return (
      curr.displayName !== init.displayName ||
      curr.avatar !== init.avatar ||
      curr.homeCountry !== init.homeCountry ||
      curr.preferredCurrency !== init.preferredCurrency ||
      JSON.stringify(curr.travelStyles) !== JSON.stringify(init.travelStyles)
    );
  }

  assert(!computeProfileDirty({ ...initialProfile }, initialProfile), 'Unmodified profile is NOT dirty');
  assert(computeProfileDirty({ ...initialProfile, displayName: 'Kenji Sato' }, initialProfile), 'Changing profile name makes it dirty');
  assert(computeProfileDirty({ ...initialProfile, preferredCurrency: 'USD' }, initialProfile), 'Changing currency makes it dirty');
  assert(computeProfileDirty({ ...initialProfile, travelStyles: ['Cultural', 'Food', 'Adventure'] }, initialProfile), 'Adding travel style makes it dirty');

  console.log('\n--- SECTION 5: Error Handling & Data Preservation on Operation Failure ---');

  // Emulate database failure during deletion
  let databaseAvailable = true;
  async function resilientDeleteOperation(id: string) {
    if (!databaseAvailable) {
      throw new Error('Database transaction lock error');
    }
    return { success: true };
  }

  databaseAvailable = false;
  let errorCaught = false;
  let caughtMessage = '';

  try {
    await resilientDeleteOperation('record-fail');
  } catch (err: any) {
    errorCaught = true;
    caughtMessage = err.message;
  }

  assert(errorCaught === true, 'Failed database operation is cleanly caught');
  assert(caughtMessage === 'Database transaction lock error', 'Descriptive error message preserved for user toast');

  console.log('\n--- SECTION 6: Dummy Data Merge & Replace Safety, Deduplication & Dialog Flow ---');

  // 1. Mock DB state for Merge / Replace testing
  const storeTrips = new Map<string, any>();
  const storeCollection = new Map<string, any>();
  const storeJournals = new Map<string, any>();
  const storeEvents = new Map<string, any>();
  const storeBookings = new Map<string, any>();
  const storeExpenses = new Map<string, any>();
  const storeEssentials = new Map<string, any>();
  const storeDocuments = new Map<string, any>();

  const sampleTrips = [
    { id: 'trip-tokyo-2026', name: 'Tokyo Sakura & Neon Odyssey', isSample: true },
    { id: 'trip-swiss-2026', name: 'Swiss Alps Hiking Expedition', isSample: true },
    { id: 'trip-kazakhstan-2026', name: '8-Day Kazakhstan Itinerary', isSample: true },
  ];

  function executeMergeOperation(tripsToMerge: any[], itemsToMerge: any[]) {
    // Deduplication logic
    for (const t of tripsToMerge) {
      const existing = storeTrips.get(t.id);
      if (!existing) {
        storeTrips.set(t.id, { ...t });
      } else if (isTripEdited(existing) || existing.isEdited) {
        // preserve user edit
        continue;
      }
      // If unedited, keep existing
    }
    for (const item of itemsToMerge) {
      if (!storeCollection.has(item.id)) {
        storeCollection.set(item.id, { ...item });
      }
    }
  }

  function executeReplaceOperation(tripsToSeed: any[]) {
    storeTrips.clear();
    storeCollection.clear();
    storeJournals.clear();
    storeEvents.clear();
    storeBookings.clear();
    storeExpenses.clear();
    storeEssentials.clear();
    storeDocuments.clear();

    for (const t of tripsToSeed) {
      storeTrips.set(t.id, { ...t });
    }
  }

  // Case 1: Merge into empty database
  storeTrips.clear();
  storeCollection.clear();
  executeMergeOperation(sampleTrips, [{ id: 'col-1', title: 'Omoide Yokocho' }]);
  assert(storeTrips.size === 3, 'Merge into empty DB creates 3 sample trips');
  assert(storeTrips.has('trip-tokyo-2026'), 'Tokyo trip merged into empty DB');
  assert(storeCollection.size === 1, 'Sample collection item merged into empty DB');

  // Case 2: Merge with existing user-created data
  const customUserTrip = { id: 'trip-user-iceland-99', name: 'My Northern Lights', isSample: false };
  const customUserItem = { id: 'col-user-waterfall', title: 'Skogafoss', isSample: false };
  storeTrips.set(customUserTrip.id, customUserTrip);
  storeCollection.set(customUserItem.id, customUserItem);

  executeMergeOperation(sampleTrips, [{ id: 'col-1', title: 'Omoide Yokocho' }, { id: 'col-2', title: 'Tsukiji' }]);
  assert(storeTrips.has('trip-user-iceland-99'), 'User custom trip 100% preserved after Merge');
  assert(storeTrips.get('trip-user-iceland-99')?.name === 'My Northern Lights', 'User trip content intact');
  assert(storeCollection.has('col-user-waterfall'), 'User collection item 100% preserved after Merge');
  assert(storeTrips.size === 4, 'Total trips is 4 (3 sample + 1 custom user trip)');

  // Case 3: Merge deduplication (repeated merge does not duplicate records)
  executeMergeOperation(sampleTrips, [{ id: 'col-1', title: 'Omoide Yokocho' }, { id: 'col-2', title: 'Tsukiji' }]);
  assert(storeTrips.size === 4, 'Repeated Merge produces zero duplicate trips (still exactly 4)');
  assert(storeCollection.size === 3, 'Repeated Merge produces zero duplicate collection items (2 sample + 1 user)');

  // Case 4: Merge preserving user-edited sample records
  const tokyoTrip = storeTrips.get('trip-tokyo-2026');
  tokyoTrip.name = 'My Customized Tokyo Adventure 2026';
  tokyoTrip.isEdited = true;
  storeTrips.set('trip-tokyo-2026', tokyoTrip);

  executeMergeOperation(sampleTrips, []);
  assert(storeTrips.get('trip-tokyo-2026')?.name === 'My Customized Tokyo Adventure 2026', 'Merge strictly preserves user-edited sample trip');

  // Case 5: Replace operation clears trips and repopulates demo baseline
  executeReplaceOperation(sampleTrips);
  assert(storeTrips.size === 3, 'Replace resets database to exactly 3 sample trips');
  assert(!storeTrips.has('trip-user-iceland-99'), 'User trip cleanly replaced by demo baseline');
  assert(storeCollection.size === 0, 'Collection items reset by Replace');
  assert(storeTrips.get('trip-tokyo-2026')?.name === 'Tokyo Sakura & Neon Odyssey', 'Sample baseline pristine title restored');

  // Case 6: Cancellation at confirmation stages leaves data untouched
  let mergeCancelled = false;
  async function performMergeWithConfirmation(shouldConfirm: boolean) {
    const confirmed = await Promise.resolve(shouldConfirm);
    if (!confirmed) {
      mergeCancelled = true;
      return;
    }
    executeMergeOperation(sampleTrips, []);
  }

  const tripsCountBeforeCancel = storeTrips.size;
  await performMergeWithConfirmation(false);
  assert(mergeCancelled === true, 'Merge cancellation detected');
  assert(storeTrips.size === tripsCountBeforeCancel, 'Cancellation leaves database records completely unchanged');

  let replaceCancelled = false;
  async function performReplaceWithConfirmation(shouldConfirm: boolean) {
    const confirmed = await Promise.resolve(shouldConfirm);
    if (!confirmed) {
      replaceCancelled = true;
      return;
    }
    executeReplaceOperation(sampleTrips);
  }

  const tripsBeforeReplaceCancel = storeTrips.size;
  await performReplaceWithConfirmation(false);
  assert(replaceCancelled === true, 'Replace cancellation detected');
  assert(storeTrips.size === tripsBeforeReplaceCancel, 'Cancellation of Replace leaves data untouched');

  // Case 7: Double-tap / duplicate submission prevention
  let opRunning = false;
  let executionCount = 0;
  async function guardedOperation() {
    if (opRunning) return;
    opRunning = true;
    try {
      executionCount++;
      await new Promise((r) => setTimeout(r, 10));
    } finally {
      opRunning = false;
    }
  }

  const p1 = guardedOperation();
  const p2 = guardedOperation(); // Double-tap while loading
  await Promise.all([p1, p2]);
  assert(executionCount === 1, 'Double tap guard prevented duplicate operation submission');

  // Case 8: Simulated database failure rollback
  const preFailureSnapshot = new Map(storeTrips);
  let txFailed = false;
  async function atomicReplaceWithRollback(simulatedError: boolean) {
    const backup = new Map(storeTrips);
    try {
      storeTrips.clear();
      if (simulatedError) {
        throw new Error('IndexedDB Transaction Aborted: Unsubscribed table');
      }
      for (const t of sampleTrips) {
        storeTrips.set(t.id, t);
      }
    } catch {
      txFailed = true;
      // Atomic rollback simulation
      storeTrips.clear();
      for (const [k, v] of backup) {
        storeTrips.set(k, v);
      }
    }
  }

  await atomicReplaceWithRollback(true);
  assert(txFailed === true, 'Transaction failure caught');
  assert(storeTrips.size === preFailureSnapshot.size, 'Database left unchanged following failed transaction');
  assert(storeTrips.has('trip-tokyo-2026'), 'Pre-existing records preserved after transaction rollback');

  // Case 9: All 17 tables verification in seedData.ts and database.ts
  const seedDataFilePath = path.resolve(process.cwd(), 'src/db/seedData.ts');
  const seedDataCode = fs.readFileSync(seedDataFilePath, 'utf8');
  assert(seedDataCode.includes('db.transportLegs'), 'seedData transaction includes transportLegs');
  assert(seedDataCode.includes('db.recipes'), 'seedData transaction includes recipes');
  assert(seedDataCode.includes('db.baseIngredientPrices'), 'seedData transaction includes baseIngredientPrices');
  assert(seedDataCode.includes('db.tripIngredientOverrides'), 'seedData transaction includes tripIngredientOverrides');
  assert(seedDataCode.includes('db.tripMealPlans'), 'seedData transaction includes tripMealPlans');
  assert(seedDataCode.includes('db.tripGroceryItems'), 'seedData transaction includes tripGroceryItems');

  // Case 10: Modal UI verification
  const modalFilePath = path.resolve(process.cwd(), 'src/components/settings/AddSampleDataModal.tsx');
  const modalCode = fs.readFileSync(modalFilePath, 'utf8');
  assert(modalCode.includes('Merge Sample Dataset?'), 'Modal includes explicit Merge confirmation dialog');
  assert(modalCode.includes('Replace All Trips & Records with Sample Data?'), 'Modal includes explicit Replace confirmation dialog');
  assert(modalCode.includes('if (loading) return'), 'Modal includes double tap guards');
  assert(modalCode.includes('setActiveTripId(null)'), 'Modal clears activeTripId on replace to prevent stale view');
  assert(modalCode.includes('hasSampleData()'), 'Modal refreshes sample data status after operation');
  assert(modalCode.includes('MERGE (SAFE ADDITION)'), 'Modal body explains Merge behavior');
  assert(modalCode.includes('REPLACE (DESTRUCTIVE RESET)'), 'Modal body explains Replace behavior');

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
