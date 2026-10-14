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
} from '../types';
import { detectCountry, getCountryFlag, getCountryCover } from '../utils/countryUtils';

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

export const SAMPLE_COLLECTION_IDS = new Set([
  'col-1',
  'col-jp-food-2',
  'col-jp-place-1',
  'col-jp-act-1',
  'col-jp-stay-1',
  'col-jp-shop-1',
  'col-ch-place-1',
  'col-ch-act-1',
  'col-ch-stay-1',
  'col-ch-food-1',
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

const BASELINE_SAMPLE_COLLECTIONS: Record<string, Partial<CollectionItem>> = {
  'col-1': { title: 'Secret Omoide Yokocho Yakitori Alley' },
  'col-jp-food-2': { title: 'Tsukiji Outer Market Fresh Uni & Wagyu Skewers' },
  'col-jp-place-1': { title: 'Shibuya Sky 360 Open-Air Observatory' },
  'col-jp-act-1': { title: 'teamLab Planets Digital Art Immersion' },
  'col-jp-stay-1': { title: 'Hoshinoya Kyoto Traditional Riverside Ryokan' },
  'col-jp-shop-1': { title: 'Ginza Six & Akihabara Electronics Alley' },
  'col-ch-place-1': { title: 'Jungfraujoch – Top of Europe High Alpine Sphinx' },
  'col-ch-act-1': { title: 'Lake Brienz Kayak Point' },
  'col-ch-stay-1': { title: 'Victoria-Jungfrau Grand Hotel & Spa' },
  'col-ch-food-1': { title: 'Restaurant Taverne Traditional Swiss Fondue' },
  'col-kz-place-1': { title: 'Charyn Canyon – Valley of Castles' },
  'col-kz-place-2': { title: 'Kaindy Lake – Submerged Spruce Tree Forest' },
  'col-kz-act-1': { title: 'Kok Tobe Cable Car & Panoramic City Sunset' },
  'col-kz-stay-1': { title: 'The Ritz-Carlton Almaty' },
  'col-kz-food-1': { title: 'Navat Teahouse – Traditional Beshbarmak & Baursaks' },
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
  return item.isSample === true || SAMPLE_COLLECTION_IDS.has(item.id);
}

/**
 * Checks if a sample collection item was subsequently edited by the user.
 */
export function isCollectionItemEdited(item: CollectionItem): boolean {
  if (item.isEdited === true) return true;
  const baseline = BASELINE_SAMPLE_COLLECTIONS[item.id];
  if (!baseline) return false;
  if (item.title !== baseline.title) return true;
  return false;
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
  ] = await Promise.all([
    db.trips.toArray(),
    db.places.toArray(),
    db.collectionItems.toArray(),
    db.itineraryEvents.toArray(),
    db.bookings.toArray(),
    db.expenses.toArray(),
    db.essentials.toArray(),
    db.documents.toArray(),
    db.journalEntries.toArray(),
  ]);

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
  const userTrips = trips.filter((t) => !isSampleTrip(t) || isTripEdited(t));

  // 2. Places
  const removablePlaces = places.filter((p) => {
    if (p.isEdited === true) return false;
    return p.isSample === true || SAMPLE_PLACE_IDS.has(p.id);
  });
  const userPlaces = places.filter((p) => !(p.isSample === true || SAMPLE_PLACE_IDS.has(p.id)));

  // 3. Collection Items
  const removableCollectionItems = collectionItems.filter((i) => {
    if (!isSampleCollectionItem(i)) return false;
    if (isCollectionItemEdited(i)) {
      editedSampleRecords.push({ type: 'Collection Item', id: i.id, title: i.title });
      return false;
    }
    return true;
  });
  const userCollections = collectionItems.filter(
    (i) => !isSampleCollectionItem(i) || isCollectionItemEdited(i)
  );

  // 4. Itinerary Events
  const removableEvents = itineraryEvents.filter((e) => {
    if (e.isEdited === true) return false;
    return e.isSample === true || SAMPLE_EVENT_IDS.has(e.id);
  });

  // 5. Bookings
  const removableBookings = bookings.filter((b) => {
    if (b.isEdited === true) return false;
    return b.isSample === true || SAMPLE_BOOKING_IDS.has(b.id);
  });

  // 6. Expenses
  const removableExpenses = expenses.filter((e) => {
    if (e.isEdited === true) return false;
    return e.isSample === true || SAMPLE_EXPENSE_IDS.has(e.id);
  });

  // 7. Essentials
  const removableEssentials = essentials.filter((ess) => {
    if (ess.isEdited === true) return false;
    return ess.isSample === true || SAMPLE_ESSENTIAL_IDS.has(ess.id);
  });

  // 8. Documents
  const removableDocuments = documents.filter((doc) => {
    if (doc.isEdited === true) return false;
    return doc.isSample === true || SAMPLE_DOCUMENT_IDS.has(doc.id);
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

  const totalRemovable =
    removableTrips.length +
    removablePlaces.length +
    removableCollectionItems.length +
    removableEvents.length +
    removableBookings.length +
    removableExpenses.length +
    removableEssentials.length +
    removableDocuments.length +
    removableJournals.length;

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
  return db.transaction('rw', [
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
  ], async () => {
    // 1. Fetch all records
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
    ] = await Promise.all([
      db.trips.toArray(),
      db.places.toArray(),
      db.collectionItems.toArray(),
      db.itineraryEvents.toArray(),
      db.bookings.toArray(),
      db.expenses.toArray(),
      db.essentials.toArray(),
      db.documents.toArray(),
      db.journalEntries.toArray(),
    ]);

    // 2. Identify removable records (must have sample provenance AND be unedited)
    const removableTrips = allTrips.filter((t) => isSampleTrip(t) && !isTripEdited(t));
    const removableTripIds = new Set(removableTrips.map((t) => t.id));

    const removablePlaces = allPlaces.filter(
      (p) => (p.isSample === true || SAMPLE_PLACE_IDS.has(p.id)) && p.isEdited !== true
    );
    const removablePlaceIds = new Set(removablePlaces.map((p) => p.id));

    const removableCollections = allCollectionItems.filter(
      (c) => isSampleCollectionItem(c) && !isCollectionItemEdited(c)
    );
    const removableColIds = new Set(removableCollections.map((c) => c.id));

    const removableEvents = allEvents.filter(
      (e) => (e.isSample === true || SAMPLE_EVENT_IDS.has(e.id)) && e.isEdited !== true
    );
    const removableEventIds = new Set(removableEvents.map((e) => e.id));

    const removableBookings = allBookings.filter(
      (b) => (b.isSample === true || SAMPLE_BOOKING_IDS.has(b.id)) && b.isEdited !== true
    );
    const removableBookingIds = new Set(removableBookings.map((b) => b.id));

    const removableExpenses = allExpenses.filter(
      (e) => (e.isSample === true || SAMPLE_EXPENSE_IDS.has(e.id)) && e.isEdited !== true
    );
    const removableExpenseIds = new Set(removableExpenses.map((e) => e.id));

    const removableEssentials = allEssentials.filter(
      (ess) => (ess.isSample === true || SAMPLE_ESSENTIAL_IDS.has(ess.id)) && ess.isEdited !== true
    );
    const removableEssentialIds = new Set(removableEssentials.map((ess) => ess.id));

    const removableDocuments = allDocuments.filter(
      (d) => (d.isSample === true || SAMPLE_DOCUMENT_IDS.has(d.id)) && d.isEdited !== true
    );
    const removableDocIds = new Set(removableDocuments.map((d) => d.id));

    const removableJournals = allJournals.filter(
      (j) => isSampleJournal(j) && !isJournalEdited(j)
    );
    const removableJournalIds = new Set(removableJournals.map((j) => j.id));

    // 3. For any PRESERVED items linked to a removable trip:
    // Safely detach them from the deleted trip, exactly as in trip deletion!
    const tripCountryMap = new Map(
      removableTrips.map((t) => [
        t.id,
        t.country || (t.destination ? detectCountry(t.destination) : '') || 'General',
      ])
    );

    // Preserved collection items linked to a deleted dummy trip:
    const preservedCollectionsToDetach = allCollectionItems.filter(
      (item) => !removableColIds.has(item.id) && item.tripId && removableTripIds.has(item.tripId)
    );
    for (const item of preservedCollectionsToDetach) {
      const tripCountry = tripCountryMap.get(item.tripId!) || 'General';
      const needsCountry = !item.country || item.country.trim().toLowerCase() === 'general';
      const targetCountry = needsCountry && tripCountry.toLowerCase() !== 'general' ? tripCountry : (item.country || 'General');

      // Ensure country exists in db.countries
      if (targetCountry.toLowerCase() !== 'general') {
        const existingCountry = await db.countries.where('name').equalsIgnoreCase(targetCountry).first();
        if (!existingCountry) {
          await db.countries.add({
            id: 'country-' + targetCountry.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: targetCountry,
            flag: getCountryFlag(targetCountry),
            coverImage: getCountryCover(targetCountry),
            createdAt: new Date().toISOString(),
          });
        }
      }

      await db.collectionItems.update(item.id, {
        tripId: undefined,
        status: 'inbox',
        country: targetCountry,
        isPlanned: false,
      });
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
      await db.journalEntries.update(j.id, {
        tripId: undefined,
        itineraryEventId: undefined,
        locationName: fallbackLocation,
        updatedAt: new Date().toISOString(),
      });
    }

    // Preserved places linked to a deleted dummy trip:
    const preservedPlacesToDetach = allPlaces.filter(
      (p) => !removablePlaceIds.has(p.id) && p.tripId && removableTripIds.has(p.tripId)
    );
    for (const p of preservedPlacesToDetach) {
      await db.places.update(p.id, { tripId: undefined });
    }

    // Preserved bookings/expenses/essentials/documents linked to a deleted dummy trip:
    const preservedBookingsToDetach = allBookings.filter(
      (b) => !removableBookingIds.has(b.id) && b.tripId && removableTripIds.has(b.tripId)
    );
    for (const b of preservedBookingsToDetach) {
      await db.bookings.update(b.id, { tripId: '' });
    }

    const preservedExpensesToDetach = allExpenses.filter(
      (e) => !removableExpenseIds.has(e.id) && e.tripId && removableTripIds.has(e.tripId)
    );
    for (const e of preservedExpensesToDetach) {
      await db.expenses.update(e.id, { tripId: '' });
    }

    // 4. Perform atomic bulk deletes of unedited dummy data
    if (removableTripIds.size > 0) await db.trips.bulkDelete(Array.from(removableTripIds));
    if (removablePlaceIds.size > 0) await db.places.bulkDelete(Array.from(removablePlaceIds));
    if (removableColIds.size > 0) await db.collectionItems.bulkDelete(Array.from(removableColIds));
    if (removableEventIds.size > 0) await db.itineraryEvents.bulkDelete(Array.from(removableEventIds));
    if (removableBookingIds.size > 0) await db.bookings.bulkDelete(Array.from(removableBookingIds));
    if (removableExpenseIds.size > 0) await db.expenses.bulkDelete(Array.from(removableExpenseIds));
    if (removableEssentialIds.size > 0) await db.essentials.bulkDelete(Array.from(removableEssentialIds));
    if (removableDocIds.size > 0) await db.documents.bulkDelete(Array.from(removableDocIds));
    if (removableJournalIds.size > 0) await db.journalEntries.bulkDelete(Array.from(removableJournalIds));

    const totalRemoved =
      removableTripIds.size +
      removablePlaceIds.size +
      removableColIds.size +
      removableEventIds.size +
      removableBookingIds.size +
      removableExpenseIds.size +
      removableEssentialIds.size +
      removableDocIds.size +
      removableJournalIds.size;

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
      },
      preservedEditedCount:
        (allTrips.length - removableTripIds.size - (allTrips.filter((t) => !isSampleTrip(t)).length)) +
        (allJournals.length - removableJournalIds.size - (allJournals.filter((j) => !isSampleJournal(j)).length)) +
        (allCollectionItems.length - removableColIds.size - (allCollectionItems.filter((c) => !isSampleCollectionItem(c)).length)),
      preservedUserCount:
        allTrips.filter((t) => !isSampleTrip(t)).length +
        allJournals.filter((j) => !isSampleJournal(j)).length +
        allCollectionItems.filter((c) => !isSampleCollectionItem(c)).length,
    };
  });
}
