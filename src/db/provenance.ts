import { db } from './database';
import type {
  Trip,
  Place,
  CollectionItem,
  ItineraryEvent,
  Booking,
  Expense,
  EssentialItem,
  VaultDocument,
  JournalEntry,
  Recipe,
  TransportLeg,
  CountryDossier,
  BaseIngredientPrice,
} from '../types';
import { detectCountry, getCountryFlag, getCountryCover } from '../utils/countryUtils';
import { getStoredUserProfile } from '../utils/profileUtils';

// ============================================================================
// RELIABLE PROVENANCE REGISTRY: HARDCODED SAMPLE ENTITY IDS
// ============================================================================
// Never guess based on record names!
// Sample data created by Add Dummy Data uses these deterministic IDs.

export const SAMPLE_TRIP_IDS = new Set([
  'trip-tokyo-2026',
  'trip-swiss-2026',
  'trip-kazakhstan-2026',
]);

export const SAMPLE_PLACE_IDS = new Set([
  'place-shinjuku-gyoen',
  'place-teamlab-planets',
  'place-sensoji',
  'place-shibuya-crossing',
  'place-tsukiji-market',
  'place-interlaken-lake',
]);

// All 15 active sample collection items created by seedData.ts getSampleCollectionItems()
export const SAMPLE_COLLECTION_IDS = new Set([
  'col-1',
  'col-jp-food-2',
  'col-jp-place-1',
  'col-jp-act-1',
  'col-jp-stay-1',
  'col-jp-shop-1',
  'col-2',
  'col-3',
  'col-ch-food-1',
  'col-ch-stay-1',
  'col-ch-place-1',
  'col-inbox-1',
  'col-inbox-2',
  'col-kz-1',
  'col-inbox-3',
]);

// Legacy sample collection IDs for backwards-compatibility
export const LEGACY_SAMPLE_COLLECTION_IDS = new Set([
  'col-ch-act-1',
  'col-kz-place-1',
  'col-kz-place-2',
  'col-kz-act-1',
  'col-kz-stay-1',
  'col-kz-food-1',
]);

export const SAMPLE_EVENT_IDS = new Set([
  'event-1',
  'event-2',
  'event-3',
  'event-4',
  'event-5',
  'event-6',
  'ev-kz-1',
  'ev-kz-2',
  'ev-kz-3',
  'ev-kz-4',
  'ev-kz-5',
  'ev-kz-6',
  'ev-kz-7',
  'ev-kz-8',
]);

export const SAMPLE_BOOKING_IDS = new Set([
  'bk-hotel-1',
  'bk-flight-1',
  'bk-train-1',
  'bk-act-1',
]);

export const SAMPLE_EXPENSE_IDS = new Set([
  'exp-payment-flight',
  'exp-payment-act',
  'exp-indep-1',
  'exp-indep-2',
  'exp-indep-3',
]);

export const SAMPLE_ESSENTIAL_IDS = new Set([
  'ess-1',
  'ess-2',
  'ess-3',
  'ess-4',
  'ess-5',
  'ess-6',
  'ess-7',
  'ess-8',
]);

export const SAMPLE_DOCUMENT_IDS = new Set([
  'doc-ana-boarding-pass',
  'doc-hotel-voucher',
]);

export const SAMPLE_JOURNAL_IDS = new Set([
  'journal-standalone-1',
  'journal-standalone-2',
  'journal-trip-1',
  'journal-trip-2',
]);

export const SAMPLE_TRANSPORT_LEG_IDS = new Set([
  'leg-ana-flight',
  'leg-monorail',
  'leg-yamanote',
  'leg-shinkansen',
]);

export const SAMPLE_RECIPE_IDS = new Set([
  'recipe-shakshuka',
  'recipe-garlic-butter-pasta',
  'recipe-tokyo-curry',
]);

export const SAMPLE_BASE_INGREDIENT_PRICE_IDS = new Set([
  'eggs',
  'canned-tomatoes',
  'bell-pepper',
  'onion',
  'garlic',
  'olive-oil',
  'feta-cheese',
  'pasta',
  'butter',
  'parmesan-cheese',
  'rice',
  'potatoes',
  'carrots',
  'japanese-curry-roux',
]);

export const SAMPLE_COUNTRY_IDS = new Set([
  'japan',
  'switzerland',
  'kazakhstan',
  'country-japan',
  'country-switzerland',
  'country-kazakhstan',
]);

export const SAMPLE_COUNTRY_NAMES = new Set([
  'japan',
  'switzerland',
  'kazakhstan',
]);

// Map of baseline sample trips for pristine comparison
const BASELINE_SAMPLE_TRIPS: Record<string, Partial<Trip>> = {
  'trip-tokyo-2026': {
    name: 'Tokyo Sakura & Neon Odyssey',
    destination: 'Tokyo & Kyoto, Japan',
    plannedBudget: 185000,
    travelers: ['Alex (Me)', 'Mia', 'Kenji'],
  },
  'trip-swiss-2026': {
    name: 'Swiss Alps Hiking Expedition',
    destination: 'Interlaken & Zermatt, Switzerland',
    plannedBudget: 150000,
    travelers: ['Alex (Me)', 'Sarah'],
  },
  'trip-kazakhstan-2026': {
    name: '8-Day Kazakhstan Itinerary',
    destination: 'Almaty & Almaty Region, Kazakhstan',
    plannedBudget: 95000,
    travelers: ['Alex (Me)', 'Travel Crew'],
  },
};

const BASELINE_SAMPLE_JOURNALS: Record<string, Partial<JournalEntry>> = {
  'journal-standalone-1': {
    title: 'Sunset at Gokarna Om Beach',
    date: '2023-04-18',
  },
  'journal-standalone-2': {
    title: 'Midnight Vinyl & Chicory Coffee',
    date: '2024-09-05',
  },
  'journal-trip-1': {
    title: 'Crossing the Electric Tide at Shibuya',
  },
  'journal-trip-2': {
    title: 'Morning Glass at Lake Brienz',
  },
};

const BASELINE_SAMPLE_COLLECTIONS: Record<string, { title: string; titles?: string[] }> = {
  'col-1': { title: 'Secret Omoide Yokocho Yakitori Alley', titles: ['Secret Omoide Yokocho Yakitori Alley'] },
  'col-jp-food-2': { title: 'Tsukiji Outer Market Fresh Uni & Wagyu Skewers', titles: ['Tsukiji Outer Market Fresh Uni & Wagyu Skewers'] },
  'col-jp-place-1': { title: 'Shibuya Sky 360 Open-Air Observatory', titles: ['Shibuya Sky 360 Open-Air Observatory'] },
  'col-jp-act-1': { title: 'teamLab Planets Digital Art Immersion', titles: ['teamLab Planets Digital Art Immersion'] },
  'col-jp-stay-1': { title: 'Hoshinoya Kyoto Traditional Riverside Ryokan', titles: ['Hoshinoya Kyoto Traditional Riverside Ryokan'] },
  'col-jp-shop-1': { title: 'Ginza Six & Akihabara Electronics Alley', titles: ['Ginza Six & Akihabara Electronics Alley'] },
  'col-2': { title: '7-Day JR Pass vs Regional Shinkansen IC Card Comparison', titles: ['7-Day JR Pass vs Regional Shinkansen IC Card Comparison'] },
  'col-3': { title: 'Lauterbrunnen Valley 72 Waterfalls Bike Trail', titles: ['Lauterbrunnen Valley 72 Waterfalls Bike Trail'] },
  'col-ch-place-1': {
    title: 'Grindelwald First Cliff Walk & Tissot Bridge',
    titles: [
      'Grindelwald First Cliff Walk & Tissot Bridge',
      'Jungfraujoch – Top of Europe High Alpine Sphinx',
    ],
  },
  'col-ch-act-1': { title: 'Lake Brienz Kayak Point', titles: ['Lake Brienz Kayak Point'] },
  'col-ch-stay-1': {
    title: 'The Chedi Andermatt Alpine Haven',
    titles: [
      'The Chedi Andermatt Alpine Haven',
      'Victoria-Jungfrau Grand Hotel & Spa',
    ],
  },
  'col-ch-food-1': {
    title: 'Fondue Chalet Ferdinand with Matterhorn Panorama',
    titles: [
      'Fondue Chalet Ferdinand with Matterhorn Panorama',
      'Restaurant Taverne Traditional Swiss Fondue',
    ],
  },
  'col-inbox-1': { title: 'Reykjavik Geothermal Sky Lagoon & 7-Step Ocean Ritual', titles: ['Reykjavik Geothermal Sky Lagoon & 7-Step Ocean Ritual'] },
  'col-inbox-2': { title: 'Lisbon Pastéis de Belém Original Century Bakery & Tram 28', titles: ['Lisbon Pastéis de Belém Original Century Bakery & Tram 28'] },
  'col-kz-1': { title: 'Kaindy Lake Sunken Birch Forest & Kolsai Lakes', titles: ['Kaindy Lake Sunken Birch Forest & Kolsai Lakes'] },
  'col-inbox-3': { title: 'Ultra-light packing gear checklist for 3-week carry-on trips', titles: ['Ultra-light packing gear checklist for 3-week carry-on trips'] },
  'col-kz-place-1': { title: 'Charyn Canyon – Valley of Castles', titles: ['Charyn Canyon – Valley of Castles'] },
  'col-kz-place-2': { title: 'Kaindy Lake – Submerged Spruce Tree Forest', titles: ['Kaindy Lake – Submerged Spruce Tree Forest'] },
  'col-kz-act-1': { title: 'Kok Tobe Cable Car & Panoramic City Sunset', titles: ['Kok Tobe Cable Car & Panoramic City Sunset'] },
  'col-kz-stay-1': { title: 'The Ritz-Carlton Almaty', titles: ['The Ritz-Carlton Almaty'] },
  'col-kz-food-1': { title: 'Navat Teahouse – Traditional Beshbarmak & Baursaks', titles: ['Navat Teahouse – Traditional Beshbarmak & Baursaks'] },
};

const BASELINE_SAMPLE_RECIPES: Record<string, { title: string }> = {
  'recipe-shakshuka': { title: 'Campfire Mediterranean Shakshuka' },
  'recipe-garlic-butter-pasta': { title: 'Alpine Garlic Butter & Herb Pasta' },
  'recipe-tokyo-curry': { title: 'Tokyo Comfort Golden Curry Rice' },
};

// ============================================================================
// PROVENANCE & EDIT DETECTION HELPERS
// ============================================================================

/**
 * Checks if a trip originated from sample data.
 */
export function isSampleTrip(trip: Trip): boolean {
  return trip.isSample === true || SAMPLE_TRIP_IDS.has(trip.id);
}

/**
 * Checks if a sample trip was subsequently edited by the user.
 * Preserves user customizations!
 */
export function isTripEdited(trip: Trip): boolean {
  if (trip.isEdited === true) return true;
  const baseline = BASELINE_SAMPLE_TRIPS[trip.id];
  if (!baseline) return false;
  if (trip.name !== baseline.name) return true;
  if (trip.destination !== baseline.destination) return true;
  if (trip.plannedBudget !== baseline.plannedBudget) return true;
  if (baseline.travelers && trip.travelers) {
    if (trip.travelers.length !== baseline.travelers.length) return true;
    if (trip.travelers.some((t, i) => t !== baseline.travelers![i])) return true;
  }
  return false;
}

/**
 * Checks if a journal entry originated from sample data.
 */
export function isSampleJournal(entry: JournalEntry): boolean {
  return entry.isSample === true || SAMPLE_JOURNAL_IDS.has(entry.id);
}

/**
 * Checks if a sample journal entry was subsequently edited by the user.
 */
export function isJournalEdited(entry: JournalEntry): boolean {
  if (entry.isEdited === true) return true;
  const baseline = BASELINE_SAMPLE_JOURNALS[entry.id];
  if (!baseline) return false;
  if (entry.title !== baseline.title) return true;
  if (baseline.date && entry.date !== baseline.date) return true;
  return false;
}

/**
 * Checks if a collection item originated from sample data.
 */
export function isSampleCollectionItem(item: CollectionItem): boolean {
  return (
    item.isSample === true ||
    SAMPLE_COLLECTION_IDS.has(item.id) ||
    LEGACY_SAMPLE_COLLECTION_IDS.has(item.id)
  );
}

/**
 * Checks if a sample collection item was subsequently edited by the user.
 */
export function isCollectionItemEdited(item: CollectionItem): boolean {
  if (item.isEdited === true) return true;
  const baseline = BASELINE_SAMPLE_COLLECTIONS[item.id];
  if (!baseline) return false;
  if (baseline.titles && baseline.titles.includes(item.title)) {
    return false;
  }
  if (baseline.title && item.title === baseline.title) {
    return false;
  }
  return true;
}

/**
 * Checks if a recipe originated from sample data.
 */
export function isSampleRecipe(recipe: Recipe): boolean {
  return recipe.isSample === true || SAMPLE_RECIPE_IDS.has(recipe.id);
}

/**
 * Checks if a sample recipe was subsequently edited by the user.
 */
export function isRecipeEdited(recipe: Recipe): boolean {
  if (recipe.isEdited === true) return true;
  const baseline = BASELINE_SAMPLE_RECIPES[recipe.id];
  if (!baseline) return false;
  return recipe.title !== baseline.title;
}

/**
 * Generic check for whether a record in any table is unedited sample data.
 * If origin cannot be reliably identified without guessing, returns false (preserving data).
 */
export function isUneditedDummyRecord(
  record: any,
  sampleIdSet: Set<string>,
  editCheck?: (rec: any) => boolean
): boolean {
  const isSample = record.isSample === true || sampleIdSet.has(record.id);
  if (!isSample) return false; // Personal user-created record: preserve!

  if (record.isEdited === true) return false; // Explicit user edit: preserve!
  if (editCheck && editCheck(record)) return false; // Subsequent edit detected: preserve!

  return true;
}

// ============================================================================
// INSPECTION & PREVIEW INTERFACES
// ============================================================================

export interface DummyRemovalPreview {
  totalRemovable: number;
  removableCounts: {
    trips: number;
    places: number;
    collectionItems: number;
    itineraryEvents: number;
    bookings: number;
    expenses: number;
    essentials: number;
    documents: number;
    journalEntries: number;
    countries?: number;
    transportLegs?: number;
    recipes?: number;
    baseIngredientPrices?: number;
  };
  preservedUserCounts: {
    trips: number;
    places: number;
    collectionItems: number;
    journalEntries: number;
    other: number;
  };
  editedSampleRecords: Array<{
    type: string;
    id: string;
    title: string;
  }>;
  removableTripNames: string[];
  hasRemovableData: boolean;
}

async function safeGetTableRecords<T>(table: any): Promise<T[]> {
  try {
    if (table && typeof table.toArray === 'function') {
      return await table.toArray();
    }
  } catch {
    // Graceful fallback for mocked / test environments
  }
  return [];
}

/**
 * Inspects all database tables and generates an exact, non-destructive preview
 * of what would be removed and what is preserved.
 */
export async function inspectDummyDataForRemoval(): Promise<DummyRemovalPreview> {
  const [
    trips,
    places,
    collectionItems,
    itineraryEvents,
    bookings,
    expenses,
    essentials,
    documents,
    journalEntries,
    countries,
  ] = await Promise.all([
    safeGetTableRecords<Trip>(db.trips),
    safeGetTableRecords<Place>(db.places),
    safeGetTableRecords<CollectionItem>(db.collectionItems),
    safeGetTableRecords<ItineraryEvent>(db.itineraryEvents),
    safeGetTableRecords<Booking>(db.bookings),
    safeGetTableRecords<Expense>(db.expenses),
    safeGetTableRecords<EssentialItem>(db.essentials),
    safeGetTableRecords<VaultDocument>(db.documents),
    safeGetTableRecords<JournalEntry>(db.journalEntries),
    safeGetTableRecords<CountryDossier>(db.countries),
  ]);

  const transportLegs = await safeGetTableRecords<TransportLeg>(db.transportLegs);
  const recipes = await safeGetTableRecords<Recipe>(db.recipes);
  const baseIngredientPrices = await safeGetTableRecords<BaseIngredientPrice>(db.baseIngredientPrices);

  const editedSampleRecords: Array<{ type: string; id: string; title: string }> = [];

  // 1. Trips
  const removableTrips = trips.filter((t) => {
    if (!isSampleTrip(t)) return false;
    if (isTripEdited(t)) {
      editedSampleRecords.push({ type: 'Trip', id: t.id, title: t.name });
      return false;
    }
    return true;
  });
  const removableTripIds = new Set(removableTrips.map((t) => t.id));
  const userTrips = trips.filter((t) => !isSampleTrip(t) || isTripEdited(t));

  // 2. Places
  const removablePlaces = places.filter((p) => {
    if (p.isEdited === true) return false;
    return p.isSample === true || SAMPLE_PLACE_IDS.has(p.id);
  });
  const userPlaces = places.filter((p) => !(p.isSample === true || SAMPLE_PLACE_IDS.has(p.id)));

  // 3. Collection Items (Finds)
  const removableCollectionItems = collectionItems.filter((i) => {
    if (!isSampleCollectionItem(i)) return false;
    if (isCollectionItemEdited(i)) {
      editedSampleRecords.push({ type: 'Collection Item', id: i.id, title: i.title });
      return false;
    }
    return true;
  });
  const removableColIds = new Set(removableCollectionItems.map((i) => i.id));
  const userCollections = collectionItems.filter(
    (i) => !isSampleCollectionItem(i) || isCollectionItemEdited(i)
  );

  // 4. Itinerary Events
  const removableEvents = itineraryEvents.filter((e) => {
    if (e.isEdited === true) return false;
    return e.isSample === true || SAMPLE_EVENT_IDS.has(e.id) || (Boolean(e.tripId) && removableTripIds.has(e.tripId));
  });

  // 5. Bookings
  const removableBookings = bookings.filter((b) => {
    if (b.isEdited === true) return false;
    return b.isSample === true || SAMPLE_BOOKING_IDS.has(b.id) || (Boolean(b.tripId) && removableTripIds.has(b.tripId));
  });

  // 6. Expenses
  const removableExpenses = expenses.filter((e) => {
    if (e.isEdited === true) return false;
    return e.isSample === true || SAMPLE_EXPENSE_IDS.has(e.id) || (Boolean(e.tripId) && removableTripIds.has(e.tripId));
  });

  // 7. Essentials
  const removableEssentials = essentials.filter((ess) => {
    if (ess.isEdited === true) return false;
    return ess.isSample === true || SAMPLE_ESSENTIAL_IDS.has(ess.id) || Boolean(ess.tripId && removableTripIds.has(ess.tripId));
  });

  // 8. Documents
  const removableDocuments = documents.filter((doc) => {
    if (doc.isEdited === true) return false;
    return doc.isSample === true || SAMPLE_DOCUMENT_IDS.has(doc.id) || Boolean(doc.tripId && removableTripIds.has(doc.tripId));
  });

  // 9. Journal Entries
  const removableJournals = journalEntries.filter((j) => {
    if (!isSampleJournal(j)) return false;
    if (isJournalEdited(j)) {
      editedSampleRecords.push({ type: 'Journal Entry', id: j.id, title: j.title });
      return false;
    }
    return true;
  });
  const userJournals = journalEntries.filter(
    (j) => !isSampleJournal(j) || isJournalEdited(j)
  );

  // 10. Transport Legs
  const removableTransportLegs = transportLegs.filter((leg) => {
    if (leg.isEdited === true) return false;
    return leg.isSample === true || SAMPLE_TRANSPORT_LEG_IDS.has(leg.id) || (Boolean(leg.tripId) && removableTripIds.has(leg.tripId));
  });

  // 11. Recipes
  const removableRecipes = recipes.filter((r) => {
    if (!isSampleRecipe(r)) return false;
    if (isRecipeEdited(r)) {
      editedSampleRecords.push({ type: 'Recipe', id: r.id, title: r.title });
      return false;
    }
    return true;
  });

  // 12. Country Folders
  const userProfile = getStoredUserProfile();
  const preservedCountryNames = new Set<string>();
  if (userProfile.dreamCountry && userProfile.dreamCountry.trim()) {
    preservedCountryNames.add(userProfile.dreamCountry.trim().toLowerCase());
  }
  if (userProfile.homeCountry && userProfile.homeCountry.trim()) {
    preservedCountryNames.add(userProfile.homeCountry.trim().toLowerCase());
  }
  for (const t of userTrips) {
    if (t.country && t.country.trim()) preservedCountryNames.add(t.country.trim().toLowerCase());
    const detected = detectCountry(t.destination);
    if (detected && detected.toLowerCase() !== 'general') {
      preservedCountryNames.add(detected.trim().toLowerCase());
    }
  }
  for (const c of userCollections) {
    if (c.country && c.country.trim().toLowerCase() !== 'general') {
      preservedCountryNames.add(c.country.trim().toLowerCase());
    }
  }

  const removableCountries = countries.filter((c) => {
    const normName = (c.name || '').trim().toLowerCase();
    const normId = (c.id || '').trim().toLowerCase();
    if (preservedCountryNames.has(normName) || preservedCountryNames.has(normId)) {
      return false;
    }
    if (c.isEdited === true) {
      return false;
    }
    return (
      c.isSample === true ||
      SAMPLE_COUNTRY_IDS.has(normId) ||
      SAMPLE_COUNTRY_NAMES.has(normName)
    );
  });

  // 13. Base Ingredient Prices
  const removableBasePrices = baseIngredientPrices.filter(
    (p) => (p.isSample === true || SAMPLE_BASE_INGREDIENT_PRICE_IDS.has(p.id)) && p.isEdited !== true
  );

  const totalRemovable =
    removableTrips.length +
    removablePlaces.length +
    removableCollectionItems.length +
    removableEvents.length +
    removableBookings.length +
    removableExpenses.length +
    removableEssentials.length +
    removableDocuments.length +
    removableJournals.length +
    removableCountries.length +
    removableTransportLegs.length +
    removableRecipes.length +
    removableBasePrices.length;

  return {
    totalRemovable,
    removableCounts: {
      trips: removableTrips.length,
      places: removablePlaces.length,
      collectionItems: removableCollectionItems.length,
      itineraryEvents: removableEvents.length,
      bookings: removableBookings.length,
      expenses: removableExpenses.length,
      essentials: removableEssentials.length,
      documents: removableDocuments.length,
      journalEntries: removableJournals.length,
      countries: removableCountries.length,
      transportLegs: removableTransportLegs.length,
      recipes: removableRecipes.length,
      baseIngredientPrices: removableBasePrices.length,
    },
    preservedUserCounts: {
      trips: userTrips.length,
      places: userPlaces.length,
      collectionItems: userCollections.length,
      journalEntries: userJournals.length,
      other:
        bookings.length -
        removableBookings.length +
        (expenses.length - removableExpenses.length) +
        (essentials.length - removableEssentials.length),
    },
    editedSampleRecords,
    removableTripNames: removableTrips.map((t) => t.name),
    hasRemovableData: totalRemovable > 0,
  };
}

// ============================================================================
// SAFE DUMMY DATA REMOVAL EXECUTION
// ============================================================================

export interface DummyRemovalResult {
  removedTotal: number;
  removedCounts: {
    trips: number;
    places: number;
    collectionItems: number;
    itineraryEvents: number;
    bookings: number;
    expenses: number;
    essentials: number;
    documents: number;
    journalEntries: number;
    countries?: number;
    transportLegs?: number;
    recipes?: number;
    baseIngredientPrices?: number;
  };
  preservedEditedCount: number;
  preservedUserCount: number;
}

/**
 * Removes ONLY unedited dummy records in a single safe, atomic Dexie transaction.
 * Any personal user records or subsequent edits are strictly preserved.
 * Any preserved records linked to a deleted dummy trip are detached safely.
 */
export async function removeDummyData(): Promise<DummyRemovalResult> {
  const allTables = [
    db.trips,
    db.places,
    db.collectionItems,
    db.itineraryEvents,
    db.bookings,
    db.expenses,
    db.essentials,
    db.documents,
    db.journalEntries,
    db.countries,
    db.transportLegs,
    db.recipes,
    db.baseIngredientPrices,
    db.tripMealPlans,
    db.tripGroceryItems,
    db.tripIngredientOverrides,
  ].filter(Boolean);

  return db.transaction('rw', allTables, async () => {
    // 1. Fetch all records across stores
    const [
      allTrips,
      allPlaces,
      allCollectionItems,
      allEvents,
      allBookings,
      allExpenses,
      allEssentials,
      allDocuments,
      allJournals,
      allCountries,
    ] = await Promise.all([
      safeGetTableRecords<Trip>(db.trips),
      safeGetTableRecords<Place>(db.places),
      safeGetTableRecords<CollectionItem>(db.collectionItems),
      safeGetTableRecords<ItineraryEvent>(db.itineraryEvents),
      safeGetTableRecords<Booking>(db.bookings),
      safeGetTableRecords<Expense>(db.expenses),
      safeGetTableRecords<EssentialItem>(db.essentials),
      safeGetTableRecords<VaultDocument>(db.documents),
      safeGetTableRecords<JournalEntry>(db.journalEntries),
      safeGetTableRecords<CountryDossier>(db.countries),
    ]);

    const allTransportLegs = await safeGetTableRecords<TransportLeg>(db.transportLegs);
    const allRecipes = await safeGetTableRecords<Recipe>(db.recipes);
    const allBasePrices = await safeGetTableRecords<BaseIngredientPrice>(db.baseIngredientPrices);
    const allMealPlans = await safeGetTableRecords<any>(db.tripMealPlans);
    const allGroceryItems = await safeGetTableRecords<any>(db.tripGroceryItems);
    const allOverrides = await safeGetTableRecords<any>(db.tripIngredientOverrides);

    const editedSampleRecords: Array<{ type: string; id: string; title: string }> = [];

    // 2. Identify removable records (must have sample provenance AND be unedited)
    const removableTrips = allTrips.filter((t) => {
      if (!isSampleTrip(t)) return false;
      if (isTripEdited(t)) {
        editedSampleRecords.push({ type: 'Trip', id: t.id, title: t.name });
        return false;
      }
      return true;
    });
    const removableTripIds = new Set(removableTrips.map((t) => t.id));
    const userTrips = allTrips.filter((t) => !isSampleTrip(t) || isTripEdited(t));

    const removablePlaces = allPlaces.filter(
      (p) => (p.isSample === true || SAMPLE_PLACE_IDS.has(p.id)) && p.isEdited !== true
    );
    const removablePlaceIds = new Set(removablePlaces.map((p) => p.id));
    const userPlaces = allPlaces.filter((p) => !(p.isSample === true || SAMPLE_PLACE_IDS.has(p.id)));

    const removableCollections = allCollectionItems.filter((i) => {
      if (!isSampleCollectionItem(i)) return false;
      if (isCollectionItemEdited(i)) {
        editedSampleRecords.push({ type: 'Collection Item', id: i.id, title: i.title });
        return false;
      }
      return true;
    });
    const removableColIds = new Set(removableCollections.map((c) => c.id));
    const userCollections = allCollectionItems.filter(
      (c) => !isSampleCollectionItem(c) || isCollectionItemEdited(c)
    );

    const removableEvents = allEvents.filter(
      (e) => (e.isSample === true || SAMPLE_EVENT_IDS.has(e.id) || (Boolean(e.tripId) && removableTripIds.has(e.tripId))) && e.isEdited !== true
    );
    const removableEventIds = new Set(removableEvents.map((e) => e.id));

    const removableBookings = allBookings.filter(
      (b) => (b.isSample === true || SAMPLE_BOOKING_IDS.has(b.id) || (Boolean(b.tripId) && removableTripIds.has(b.tripId))) && b.isEdited !== true
    );
    const removableBookingIds = new Set(removableBookings.map((b) => b.id));

    const removableExpenses = allExpenses.filter(
      (e) => (e.isSample === true || SAMPLE_EXPENSE_IDS.has(e.id) || (Boolean(e.tripId) && removableTripIds.has(e.tripId))) && e.isEdited !== true
    );
    const removableExpenseIds = new Set(removableExpenses.map((e) => e.id));

    const removableEssentials = allEssentials.filter(
      (ess) => (ess.isSample === true || SAMPLE_ESSENTIAL_IDS.has(ess.id) || Boolean(ess.tripId && removableTripIds.has(ess.tripId))) && ess.isEdited !== true
    );
    const removableEssentialIds = new Set(removableEssentials.map((ess) => ess.id));

    const removableDocuments = allDocuments.filter(
      (d) => (d.isSample === true || SAMPLE_DOCUMENT_IDS.has(d.id) || Boolean(d.tripId && removableTripIds.has(d.tripId))) && d.isEdited !== true
    );
    const removableDocIds = new Set(removableDocuments.map((d) => d.id));

    const removableJournals = allJournals.filter((j) => {
      if (!isSampleJournal(j)) return false;
      if (isJournalEdited(j)) {
        editedSampleRecords.push({ type: 'Journal Entry', id: j.id, title: j.title });
        return false;
      }
      return true;
    });
    const removableJournalIds = new Set(removableJournals.map((j) => j.id));
    const userJournals = allJournals.filter((j) => !removableJournalIds.has(j.id));

    const removableTransportLegs = allTransportLegs.filter(
      (leg) => (leg.isSample === true || SAMPLE_TRANSPORT_LEG_IDS.has(leg.id) || (Boolean(leg.tripId) && removableTripIds.has(leg.tripId))) && leg.isEdited !== true
    );
    const removableLegIds = new Set(removableTransportLegs.map((leg) => leg.id));

    const removableRecipes = allRecipes.filter((r) => {
      if (!isSampleRecipe(r)) return false;
      if (isRecipeEdited(r)) {
        editedSampleRecords.push({ type: 'Recipe', id: r.id, title: r.title });
        return false;
      }
      return true;
    });
    const removableRecipeIds = new Set(removableRecipes.map((r) => r.id));

    const removableMealPlans = allMealPlans.filter((mp) => mp.tripId && removableTripIds.has(mp.tripId));
    const removableMealPlanIds = new Set(removableMealPlans.map((mp) => mp.id));

    const removableGroceryItems = allGroceryItems.filter((g) => g.tripId && removableTripIds.has(g.tripId));
    const removableGroceryIds = new Set(removableGroceryItems.map((g) => g.id));

    const removableOverrides = allOverrides.filter((o) => o.tripId && removableTripIds.has(o.tripId));
    const removableOverrideIds = new Set(removableOverrides.map((o) => o.id));

    const removableBasePrices = allBasePrices.filter(
      (p) => (p.isSample === true || SAMPLE_BASE_INGREDIENT_PRICE_IDS.has(p.id)) && p.isEdited !== true
    );
    const removableBasePriceIds = new Set(removableBasePrices.map((p) => p.id));

    // 3. For any PRESERVED items linked to a removable trip:
    // Safely detach them from the deleted trip, exactly as in trip deletion!
    const tripCountryMap = new Map(
      removableTrips.map((t) => [
        t.id,
        t.country || (t.destination ? detectCountry(t.destination) : '') || 'General',
      ])
    );

    // Track detached countries to ensure they remain preserved
    const detachedCountryNames = new Set<string>();

    // Preserved collection items linked to a deleted dummy trip:
    const preservedCollectionsToDetach = allCollectionItems.filter(
      (item) => !removableColIds.has(item.id) && item.tripId && removableTripIds.has(item.tripId)
    );
    for (const item of preservedCollectionsToDetach) {
      const tripCountry = tripCountryMap.get(item.tripId!) || 'General';
      const needsCountry = !item.country || item.country.trim().toLowerCase() === 'general';
      const targetCountry = needsCountry && tripCountry.toLowerCase() !== 'general' ? tripCountry : (item.country || 'General');

      if (targetCountry.toLowerCase() !== 'general') {
        detachedCountryNames.add(targetCountry.trim().toLowerCase());
        // Ensure country exists in db.countries
        if (db.countries?.where) {
          const existingCountry = await db.countries.where('name').equalsIgnoreCase(targetCountry).first();
          if (!existingCountry && db.countries.add) {
            await db.countries.add({
              id: 'country-' + targetCountry.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              name: targetCountry,
              flag: getCountryFlag(targetCountry),
              coverImage: getCountryCover(targetCountry),
              createdAt: new Date().toISOString(),
            });
          }
        }
      }

      if (db.collectionItems?.update) {
        await db.collectionItems.update(item.id, {
          tripId: undefined,
          status: 'inbox',
          country: targetCountry,
          isPlanned: false,
        });
      }
    }

    // Preserved journal entries linked to a deleted dummy trip:
    const preservedJournalsToDetach = allJournals.filter(
      (j) => !removableJournalIds.has(j.id) && j.tripId && removableTripIds.has(j.tripId)
    );
    for (const j of preservedJournalsToDetach) {
      const trip = removableTrips.find((t) => t.id === j.tripId);
      let fallbackLocation = j.locationName;
      if (!fallbackLocation && trip?.destination) {
        fallbackLocation = trip.destination;
      }
      if (db.journalEntries?.update) {
        await db.journalEntries.update(j.id, {
          tripId: undefined,
          itineraryEventId: undefined,
          locationName: fallbackLocation,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Preserved places linked to a deleted dummy trip:
    const preservedPlacesToDetach = allPlaces.filter(
      (p) => !removablePlaceIds.has(p.id) && p.tripId && removableTripIds.has(p.tripId)
    );
    for (const p of preservedPlacesToDetach) {
      if (db.places?.update) {
        await db.places.update(p.id, { tripId: undefined });
      }
    }

    // Preserved bookings/expenses linked to a deleted dummy trip:
    const preservedBookingsToDetach = allBookings.filter(
      (b) => !removableBookingIds.has(b.id) && b.tripId && removableTripIds.has(b.tripId)
    );
    for (const b of preservedBookingsToDetach) {
      if (db.bookings?.update) {
        await db.bookings.update(b.id, { tripId: '' });
      }
    }

    const preservedExpensesToDetach = allExpenses.filter(
      (e) => !removableExpenseIds.has(e.id) && e.tripId && removableTripIds.has(e.tripId)
    );
    for (const e of preservedExpensesToDetach) {
      if (db.expenses?.update) {
        await db.expenses.update(e.id, { tripId: '' });
      }
    }

    // 4. Determine Removable Countries
    const userProfile = getStoredUserProfile();
    const preservedCountryNames = new Set<string>(detachedCountryNames);
    if (userProfile.dreamCountry && userProfile.dreamCountry.trim()) {
      preservedCountryNames.add(userProfile.dreamCountry.trim().toLowerCase());
    }
    if (userProfile.homeCountry && userProfile.homeCountry.trim()) {
      preservedCountryNames.add(userProfile.homeCountry.trim().toLowerCase());
    }
    for (const t of userTrips) {
      if (t.country && t.country.trim()) preservedCountryNames.add(t.country.trim().toLowerCase());
      const detected = detectCountry(t.destination);
      if (detected && detected.toLowerCase() !== 'general') {
        preservedCountryNames.add(detected.trim().toLowerCase());
      }
    }
    for (const c of userCollections) {
      if (c.country && c.country.trim().toLowerCase() !== 'general') {
        preservedCountryNames.add(c.country.trim().toLowerCase());
      }
    }

    const removableCountries = allCountries.filter((c) => {
      const normName = (c.name || '').trim().toLowerCase();
      const normId = (c.id || '').trim().toLowerCase();
      if (preservedCountryNames.has(normName) || preservedCountryNames.has(normId)) {
        return false;
      }
      if (c.isEdited === true) {
        return false;
      }
      return (
        c.isSample === true ||
        SAMPLE_COUNTRY_IDS.has(normId) ||
        SAMPLE_COUNTRY_NAMES.has(normName)
      );
    });

    // 5. Perform atomic bulk deletes of unedited dummy data across all stores
    if (removableTripIds.size > 0 && db.trips?.bulkDelete) await db.trips.bulkDelete(Array.from(removableTripIds));
    if (removablePlaceIds.size > 0 && db.places?.bulkDelete) await db.places.bulkDelete(Array.from(removablePlaceIds));
    if (removableColIds.size > 0 && db.collectionItems?.bulkDelete) await db.collectionItems.bulkDelete(Array.from(removableColIds));
    if (removableEventIds.size > 0 && db.itineraryEvents?.bulkDelete) await db.itineraryEvents.bulkDelete(Array.from(removableEventIds));
    if (removableBookingIds.size > 0 && db.bookings?.bulkDelete) await db.bookings.bulkDelete(Array.from(removableBookingIds));
    if (removableExpenseIds.size > 0 && db.expenses?.bulkDelete) await db.expenses.bulkDelete(Array.from(removableExpenseIds));
    if (removableEssentialIds.size > 0 && db.essentials?.bulkDelete) await db.essentials.bulkDelete(Array.from(removableEssentialIds));
    if (removableDocIds.size > 0 && db.documents?.bulkDelete) await db.documents.bulkDelete(Array.from(removableDocIds));
    if (removableJournalIds.size > 0 && db.journalEntries?.bulkDelete) await db.journalEntries.bulkDelete(Array.from(removableJournalIds));
    if (removableLegIds.size > 0 && db.transportLegs?.bulkDelete) await db.transportLegs.bulkDelete(Array.from(removableLegIds));
    if (removableRecipeIds.size > 0 && db.recipes?.bulkDelete) await db.recipes.bulkDelete(Array.from(removableRecipeIds));
    if (removableMealPlanIds.size > 0 && db.tripMealPlans?.bulkDelete) await db.tripMealPlans.bulkDelete(Array.from(removableMealPlanIds));
    if (removableGroceryIds.size > 0 && db.tripGroceryItems?.bulkDelete) await db.tripGroceryItems.bulkDelete(Array.from(removableGroceryIds));
    if (removableOverrideIds.size > 0 && db.tripIngredientOverrides?.bulkDelete) await db.tripIngredientOverrides.bulkDelete(Array.from(removableOverrideIds));
    if (removableBasePriceIds.size > 0 && db.baseIngredientPrices?.bulkDelete) await db.baseIngredientPrices.bulkDelete(Array.from(removableBasePriceIds));

    // Delete removable countries safely
    if (removableCountries.length > 0 && db.countries) {
      for (const c of removableCountries) {
        if (db.countries.delete) await db.countries.delete(c.id);
        if (c.name && db.countries.where) {
          try {
            await db.countries.where('name').equalsIgnoreCase(c.name).delete();
          } catch {}
        }
      }
    }

    const totalRemoved =
      removableTripIds.size +
      removablePlaceIds.size +
      removableColIds.size +
      removableEventIds.size +
      removableBookingIds.size +
      removableExpenseIds.size +
      removableEssentialIds.size +
      removableDocIds.size +
      removableJournalIds.size +
      removableCountries.length +
      removableLegIds.size +
      removableRecipeIds.size +
      removableMealPlanIds.size +
      removableGroceryIds.size +
      removableOverrideIds.size +
      removableBasePriceIds.size;

    return {
      removedTotal: totalRemoved,
      removedCounts: {
        trips: removableTripIds.size,
        places: removablePlaceIds.size,
        collectionItems: removableColIds.size,
        itineraryEvents: removableEventIds.size,
        bookings: removableBookingIds.size,
        expenses: removableExpenseIds.size,
        essentials: removableEssentialIds.size,
        documents: removableDocIds.size,
        journalEntries: removableJournalIds.size,
        countries: removableCountries.length,
        transportLegs: removableLegIds.size,
        recipes: removableRecipeIds.size,
        baseIngredientPrices: removableBasePriceIds.size,
      },
      preservedEditedCount: editedSampleRecords.length,
      preservedUserCount:
        userTrips.length +
        userPlaces.length +
        userCollections.length +
        userJournals.length,
    };
  });
}
