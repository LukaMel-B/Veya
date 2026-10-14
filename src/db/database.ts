import Dexie, { type Table } from 'dexie';
import type {
  Trip,
  Place,
  CollectionItem,
  ItineraryEvent,
  Booking,
  Expense,
  EssentialItem,
  VaultDocument,
  CountryDossier,
  CustomCategory,
  CategoryScope,
  JournalEntry,
  TransportLeg,
  Recipe,
  BaseIngredientPrice,
  TripIngredientPriceOverride,
  TripMealPlan,
  TripGroceryItem,
} from '../types';
import { getCountryFlag, getCountryCover, detectCountry } from '../utils/countryUtils';

export class TravelNestDatabase extends Dexie {
  trips!: Table<Trip, string>;
  places!: Table<Place, string>;
  collectionItems!: Table<CollectionItem, string>;
  itineraryEvents!: Table<ItineraryEvent, string>;
  bookings!: Table<Booking, string>;
  expenses!: Table<Expense, string>;
  essentials!: Table<EssentialItem, string>;
  documents!: Table<VaultDocument, string>;
  countries!: Table<CountryDossier, string>;
  categories!: Table<CustomCategory, string>;
  journalEntries!: Table<JournalEntry, string>;
  transportLegs!: Table<TransportLeg, string>;
  recipes!: Table<Recipe, string>;
  baseIngredientPrices!: Table<BaseIngredientPrice, string>;
  tripIngredientOverrides!: Table<TripIngredientPriceOverride, string>;
  tripMealPlans!: Table<TripMealPlan, string>;
  tripGroceryItems!: Table<TripGroceryItem, string>;

  constructor() {
    super('TravelNestDB');
    this.version(1).stores({
      trips: 'id, status, startDate, endDate, createdAt',
      places: 'id, tripId, category, name, createdAt',
      collectionItems: 'id, tripId, type, status, *tags, createdAt',
      itineraryEvents: 'id, tripId, date, dayNumber, orderIndex, placeId, createdAt',
      bookings: 'id, tripId, type, status, createdAt',
      expenses: 'id, tripId, bookingId, category, date, paidBy, createdAt',
      essentials: 'id, tripId, type, category, packed',
      documents: 'id, tripId, bookingId, filename, *tags, createdAt',
    });
    this.version(2).stores({
      trips: 'id, status, country, startDate, endDate, createdAt',
      collectionItems: 'id, tripId, country, category, type, status, *tags, createdAt',
    }).upgrade(async (tx) => {
      // Backward-aware migration: ensure existing trips have a country field
      await tx.table('trips').toCollection().modify((trip) => {
        if (!trip.country) {
          trip.country = trip.destination ? detectCountry(trip.destination) : 'General';
        }
      });
      // Backward-aware migration: ensure existing collection items have country and category
      await tx.table('collectionItems').toCollection().modify((item) => {
        if (!item.country) {
          item.country = 'General';
        }
        if (!item.category) {
          item.category = 'tips';
        }
      });
    });
    this.version(3).stores({
      countries: 'id, name, createdAt',
    });
    this.version(4).stores({
      categories: 'id, label, scope, createdAt',
    });
    this.version(5).stores({
      journalEntries: 'id, tripId, itineraryEventId, placeId, date, isFavorite, *tags, createdAt',
    }).upgrade(async (tx) => {
      // Backward-aware migration: ensure existing journals have safe defaults
      await tx.table('journalEntries').toCollection().modify((j) => {
        if (!j.date) j.date = new Date().toISOString().split('T')[0];
        if (j.isFavorite === undefined) j.isFavorite = false;
        if (!j.tags) j.tags = [];
        if (!j.photos) j.photos = [];
      });
    });
    this.version(6).stores({
      trips: 'id, status, country, startDate, endDate, isSample, createdAt',
      places: 'id, tripId, category, name, isSample, createdAt',
      collectionItems: 'id, tripId, country, category, type, status, *tags, isSample, createdAt',
      itineraryEvents: 'id, tripId, date, dayNumber, orderIndex, placeId, isSample, createdAt',
      bookings: 'id, tripId, type, status, isSample, createdAt',
      expenses: 'id, tripId, bookingId, category, date, paidBy, isSample, createdAt',
      essentials: 'id, tripId, type, category, packed, isSample',
      documents: 'id, tripId, bookingId, filename, *tags, isSample, createdAt',
      journalEntries: 'id, tripId, itineraryEventId, placeId, date, isFavorite, *tags, isSample, createdAt',
    }).upgrade(async (tx) => {
      // Backward-aware migration: safely tag legacy known sample trips and journals
      const sampleTripIds = ['trip-tokyo-2026', 'trip-swiss-2026', 'trip-kazakhstan-2026'];
      await tx.table('trips').toCollection().modify((t) => {
        if (sampleTripIds.includes(t.id) && t.isSample === undefined) {
          t.isSample = true;
        }
      });
      const sampleJournalIds = ['journal-standalone-1', 'journal-standalone-2', 'journal-trip-1', 'journal-trip-2'];
      await tx.table('journalEntries').toCollection().modify((j) => {
        if (sampleJournalIds.includes(j.id) && j.isSample === undefined) {
          j.isSample = true;
        }
      });
    });
    this.version(7).stores({
      trips: 'id, status, country, startDate, endDate, isSample, createdAt',
      places: 'id, tripId, category, name, isSample, createdAt',
      collectionItems: 'id, tripId, country, category, type, status, *tags, isSample, createdAt',
      itineraryEvents: 'id, tripId, date, dayNumber, orderIndex, placeId, isSample, createdAt',
      bookings: 'id, tripId, type, status, isSample, createdAt',
      expenses: 'id, tripId, bookingId, category, date, paidBy, isSample, createdAt',
      essentials: 'id, tripId, type, category, packed, isSample',
      documents: 'id, tripId, bookingId, filename, *tags, isSample, createdAt',
      journalEntries: 'id, tripId, itineraryEventId, placeId, date, isFavorite, *tags, isSample, createdAt',
      transportLegs: 'id, tripId, dayNumber, date, mode, bookingId, createdAt',
      recipes: 'id, category, *tags, isSample, createdAt',
      baseIngredientPrices: 'id, name, country, currency',
      tripIngredientOverrides: 'id, tripId, ingredientName',
      tripMealPlans: 'id, tripId, dayNumber, date, mealType, recipeId, createdAt',
      tripGroceryItems: 'id, tripId, name, category, bought',
    }).upgrade(async () => {
      // Version 7 adds Travel Companion tables with backward-compatible defaults
    });
  }

  /**
   * Ensure and persist a category in IndexedDB
   */
  async saveCategory(label: string, icon: string = '🏷️', scope: CategoryScope = 'collection'): Promise<CustomCategory> {
    const trimmed = label.trim();
    if (!trimmed) throw new Error('Category name is required');
    const id = trimmed.toLowerCase().replace(/\s+/g, '-');

    const existing = await this.categories.get(id);
    if (existing) {
      if (icon && icon !== existing.icon) {
        await this.categories.update(id, { icon, scope });
        return { ...existing, icon, scope };
      }
      return existing;
    }

    const cat: CustomCategory = {
      id,
      label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
      icon: icon.trim() || '🏷️',
      scope,
      createdAt: new Date().toISOString(),
    };
    await this.categories.add(cat);
    return cat;
  }

  /**
   * Ensure and persist a country dossier in IndexedDB (No automatic flags)
   */
  async saveCountry(countryName: string, coverImage?: string): Promise<CountryDossier> {
    const trimmed = countryName.trim();
    if (!trimmed) throw new Error('Country name is required');
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const id = formatted.toLowerCase();

    const existing = await this.countries.get(id);
    if (existing) {
      if (coverImage && coverImage !== existing.coverImage) {
        await this.countries.update(id, { coverImage });
        return { ...existing, coverImage };
      }
      return existing;
    }

    const dossier: CountryDossier = {
      id,
      name: formatted,
      coverImage: coverImage || getCountryCover(formatted),
      createdAt: new Date().toISOString(),
    };
    await this.countries.add(dossier);
    return dossier;
  }

  /**
   * Safe cascading delete: Deletes a trip and its trip-specific records (itinerary events,
   * bookings, expenses, essentials, documents).
   *
   * CRITICAL PROJECT REQUIREMENT:
   * Deleting a trip MUST NEVER delete saved/collection items or journal entries!
   * - Saved/collection items: detached, moved to appropriate country/general collection,
   *   with all photos, notes, tags, URL, and place linkages 100% preserved.
   * - Journal entries: detached (tripId: undefined, itineraryEventId: undefined) with
   *   location context, photos, story, tags, and moods 100% preserved in Journal.
   * - Places: detached from tripId, remaining accessible as global places.
   */
  async deleteTripCascade(tripId: string) {
    return this.transaction('rw', [
      this.trips,
      this.itineraryEvents,
      this.bookings,
      this.expenses,
      this.essentials,
      this.documents,
      this.collectionItems,
      this.places,
      this.journalEntries,
      this.countries,
      this.transportLegs,
      this.tripMealPlans,
      this.tripGroceryItems,
      this.tripIngredientOverrides,
    ], async () => {
      const trip = await this.trips.get(tripId);
      if (!trip) return;

      const fallbackCountry = trip.country || (trip.destination ? detectCountry(trip.destination) : '') || 'General';

      // Ensure the destination country exists in this.countries so the dossier remains accessible
      if (fallbackCountry.toLowerCase() !== 'general') {
        const existingCountry = await this.countries.where('name').equalsIgnoreCase(fallbackCountry).first();
        if (!existingCountry) {
          await this.countries.add({
            id: 'country-' + fallbackCountry.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: fallbackCountry,
            flag: getCountryFlag(fallbackCountry),
            coverImage: getCountryCover(fallbackCountry),
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Detach collection items: move to appropriate country/general collection, preserve photos & notes
      const linkedItems = await this.collectionItems.where('tripId').equals(tripId).toArray();
      for (const item of linkedItems) {
        const needsCountry = !item.country || item.country.trim().toLowerCase() === 'general';
        const targetCountry = needsCountry && fallbackCountry.toLowerCase() !== 'general' ? fallbackCountry : (item.country || 'General');
        await this.collectionItems.update(item.id, {
          tripId: undefined,
          status: 'inbox',
          country: targetCountry,
          isPlanned: false,
        });
      }

      // Detach places so they remain accessible as global places
      const linkedPlaces = await this.places.where('tripId').equals(tripId).toArray();
      for (const place of linkedPlaces) {
        await this.places.update(place.id, { tripId: undefined });
      }

      // Detach journal entries: preserve story, photos, tags, and location context
      const linkedJournals = await this.journalEntries.where('tripId').equals(tripId).toArray();
      for (const j of linkedJournals) {
        let fallbackLocation = j.locationName;
        if (!fallbackLocation) {
          if (j.itineraryEventId) {
            const ev = await this.itineraryEvents.get(j.itineraryEventId);
            if (ev?.location) fallbackLocation = ev.location;
            else if (ev?.title) fallbackLocation = ev.title;
          }
          if (!fallbackLocation && trip.destination) {
            fallbackLocation = trip.destination;
          }
        }
        await this.journalEntries.update(j.id, {
          tripId: undefined,
          itineraryEventId: undefined,
          locationName: fallbackLocation,
          updatedAt: new Date().toISOString(),
        });
      }

      // Safely delete trip-specific records to avoid orphaned data
      await this.itineraryEvents.where('tripId').equals(tripId).delete();
      await this.bookings.where('tripId').equals(tripId).delete();
      await this.expenses.where('tripId').equals(tripId).delete();
      await this.essentials.where('tripId').equals(tripId).delete();
      await this.documents.where('tripId').equals(tripId).delete();
      try {
        if (this.transportLegs?.where) await this.transportLegs.where('tripId').equals(tripId).delete();
      } catch {
        // Safe for test environments
      }
      try {
        if (this.tripMealPlans?.where) await this.tripMealPlans.where('tripId').equals(tripId).delete();
      } catch {
        // Safe for test environments
      }
      try {
        if (this.tripGroceryItems?.where) await this.tripGroceryItems.where('tripId').equals(tripId).delete();
      } catch {
        // Safe for test environments
      }
      try {
        if (this.tripIngredientOverrides?.where) await this.tripIngredientOverrides.where('tripId').equals(tripId).delete();
      } catch {
        // Safe for test environments
      }

      // Finally delete the trip itself
      await this.trips.delete(tripId);
    });
  }

  /**
   * Export all tables as a JSON-serializable object (includes profile/preferences)
   */
  async exportFullData() {
    const [
      trips,
      places,
      collectionItems,
      itineraryEvents,
      bookings,
      expenses,
      essentials,
      documents,
      countries,
      categories,
      journalEntries,
    ] = await Promise.all([
      this.trips.toArray(),
      this.places.toArray(),
      this.collectionItems.toArray(),
      this.itineraryEvents.toArray(),
      this.bookings.toArray(),
      this.expenses.toArray(),
      this.essentials.toArray(),
      this.documents.toArray(),
      this.countries.toArray(),
      this.categories.toArray(),
      this.journalEntries.toArray(),
    ]);

    let transportLegs: any[] = [];
    let recipes: any[] = [];
    let baseIngredientPrices: any[] = [];
    let tripIngredientOverrides: any[] = [];
    let tripMealPlans: any[] = [];
    let tripGroceryItems: any[] = [];

    try {
      if (this.transportLegs?.toArray) transportLegs = await this.transportLegs.toArray();
    } catch {}
    try {
      if (this.recipes?.toArray) recipes = await this.recipes.toArray();
    } catch {}
    try {
      if (this.baseIngredientPrices?.toArray) baseIngredientPrices = await this.baseIngredientPrices.toArray();
    } catch {}
    try {
      if (this.tripIngredientOverrides?.toArray) tripIngredientOverrides = await this.tripIngredientOverrides.toArray();
    } catch {}
    try {
      if (this.tripMealPlans?.toArray) tripMealPlans = await this.tripMealPlans.toArray();
    } catch {}
    try {
      if (this.tripGroceryItems?.toArray) tripGroceryItems = await this.tripGroceryItems.toArray();
    } catch {}

    let userProfile: any = null;
    try {
      const stored = localStorage.getItem('travelnest_user_profile');
      if (stored) {
        userProfile = JSON.parse(stored);
      }
    } catch {
      // Ignored
    }

    return {
      version: 4,
      appName: 'TravelNest',
      exportedAt: new Date().toISOString(),
      userProfile,
      data: {
        trips,
        places,
        collectionItems,
        itineraryEvents,
        bookings,
        expenses,
        essentials,
        documents,
        countries,
        categories,
        journalEntries,
        transportLegs,
        recipes,
        baseIngredientPrices,
        tripIngredientOverrides,
        tripMealPlans,
        tripGroceryItems,
      },
    };
  }

  /**
   * Import data with merge or overwrite option
   */
  async importFullData(payload: any, mode: 'merge' | 'overwrite' = 'overwrite') {
    if (!payload?.data || payload.appName !== 'TravelNest') {
      throw new Error('Invalid TravelNest backup file format.');
    }

    const {
      trips,
      places,
      collectionItems,
      itineraryEvents,
      bookings,
      expenses,
      essentials,
      documents,
      countries,
      categories,
      journalEntries,
      transportLegs,
      recipes,
      baseIngredientPrices,
      tripIngredientOverrides,
      tripMealPlans,
      tripGroceryItems,
    } = payload.data;

    // Restore user profile if present
    if (payload.userProfile) {
      try {
        if (mode === 'overwrite') {
          localStorage.setItem('travelnest_user_profile', JSON.stringify(payload.userProfile));
          if (payload.userProfile.onboardingCompleted) {
            localStorage.setItem('travelnest_onboarding_completed', 'true');
          }
        } else {
          // Merge with current profile
          const currentRaw = localStorage.getItem('travelnest_user_profile');
          const current = currentRaw ? JSON.parse(currentRaw) : {};
          const merged = { ...current, ...payload.userProfile };
          localStorage.setItem('travelnest_user_profile', JSON.stringify(merged));
        }
      } catch (err) {
        console.warn('Could not restore user profile from backup:', err);
      }
    }

    return this.transaction('rw', [
      this.trips,
      this.places,
      this.collectionItems,
      this.itineraryEvents,
      this.bookings,
      this.expenses,
      this.essentials,
      this.documents,
      this.countries,
      this.categories,
      this.journalEntries,
    ], async () => {
      if (mode === 'overwrite') {
        await Promise.all([
          this.trips.clear(),
          this.places.clear(),
          this.collectionItems.clear(),
          this.itineraryEvents.clear(),
          this.bookings.clear(),
          this.expenses.clear(),
          this.essentials.clear(),
          this.documents.clear(),
          this.countries.clear(),
          this.categories.clear(),
          this.journalEntries.clear(),
        ]);
        try { if (this.transportLegs?.clear) await this.transportLegs.clear(); } catch {}
        try { if (this.recipes?.clear) await this.recipes.clear(); } catch {}
        try { if (this.baseIngredientPrices?.clear) await this.baseIngredientPrices.clear(); } catch {}
        try { if (this.tripIngredientOverrides?.clear) await this.tripIngredientOverrides.clear(); } catch {}
        try { if (this.tripMealPlans?.clear) await this.tripMealPlans.clear(); } catch {}
        try { if (this.tripGroceryItems?.clear) await this.tripGroceryItems.clear(); } catch {}
      }

      if (trips?.length) await this.trips.bulkPut(trips);
      if (places?.length) await this.places.bulkPut(places);
      if (collectionItems?.length) await this.collectionItems.bulkPut(collectionItems);
      if (itineraryEvents?.length) await this.itineraryEvents.bulkPut(itineraryEvents);
      if (bookings?.length) await this.bookings.bulkPut(bookings);
      if (expenses?.length) await this.expenses.bulkPut(expenses);
      if (essentials?.length) await this.essentials.bulkPut(essentials);
      if (documents?.length) await this.documents.bulkPut(documents);
      if (countries?.length) await this.countries.bulkPut(countries);
      if (categories?.length) await this.categories.bulkPut(categories);
      if (journalEntries?.length) await this.journalEntries.bulkPut(journalEntries);
      try { if (transportLegs?.length && this.transportLegs?.bulkPut) await this.transportLegs.bulkPut(transportLegs); } catch {}
      try { if (recipes?.length && this.recipes?.bulkPut) await this.recipes.bulkPut(recipes); } catch {}
      try { if (baseIngredientPrices?.length && this.baseIngredientPrices?.bulkPut) await this.baseIngredientPrices.bulkPut(baseIngredientPrices); } catch {}
      try { if (tripIngredientOverrides?.length && this.tripIngredientOverrides?.bulkPut) await this.tripIngredientOverrides.bulkPut(tripIngredientOverrides); } catch {}
      try { if (tripMealPlans?.length && this.tripMealPlans?.bulkPut) await this.tripMealPlans.bulkPut(tripMealPlans); } catch {}
      try { if (tripGroceryItems?.length && this.tripGroceryItems?.bulkPut) await this.tripGroceryItems.bulkPut(tripGroceryItems); } catch {}
    });
  }

  /**
   * Clear all local tables
   */
  async clearAll() {
    await Promise.all([
      this.trips.clear(),
      this.places.clear(),
      this.collectionItems.clear(),
      this.itineraryEvents.clear(),
      this.bookings.clear(),
      this.expenses.clear(),
      this.essentials.clear(),
      this.documents.clear(),
      this.countries.clear(),
      this.categories.clear(),
      this.journalEntries.clear(),
    ]);
    try { if (this.transportLegs?.clear) await this.transportLegs.clear(); } catch {}
    try { if (this.recipes?.clear) await this.recipes.clear(); } catch {}
    try { if (this.baseIngredientPrices?.clear) await this.baseIngredientPrices.clear(); } catch {}
    try { if (this.tripIngredientOverrides?.clear) await this.tripIngredientOverrides.clear(); } catch {}
    try { if (this.tripMealPlans?.clear) await this.tripMealPlans.clear(); } catch {}
    try { if (this.tripGroceryItems?.clear) await this.tripGroceryItems.clear(); } catch {}
  }

  /**
   * Reconciles inconsistent collection item trip associations:
   * - Resets status to 'inbox' if tripId is missing
   * - Clears orphaned tripId references if trip was deleted
   * - Preserves 100% of user data, notes, photos, and collection folders
   */
  async reconcileCollectionAssociations(): Promise<{ totalInspected: number; repairedCount: number }> {
    try {
      const [items, trips] = await Promise.all([
        this.collectionItems.toArray(),
        this.trips.toArray(),
      ]);

      const validTripIds = new Set(trips.map((t) => t.id));
      let repairedCount = 0;

      for (const item of items) {
        const hasTripId = typeof item.tripId === 'string' && item.tripId.trim().length > 0;
        const tripExists = hasTripId && validTripIds.has(item.tripId!.trim());

        let needsUpdate = false;
        const updates: Partial<CollectionItem> = {};

        if (!hasTripId && item.status === 'assigned') {
          updates.status = 'inbox';
          needsUpdate = true;
        } else if (hasTripId && !tripExists) {
          updates.tripId = undefined;
          updates.status = item.status === 'archived' ? 'archived' : 'inbox';
          updates.isPlanned = false;
          needsUpdate = true;
        } else if (hasTripId && tripExists && item.status === 'inbox') {
          updates.status = 'assigned';
          needsUpdate = true;
        }

        if (needsUpdate) {
          await this.collectionItems.update(item.id, updates);
          repairedCount++;
        }
      }

      return { totalInspected: items.length, repairedCount };
    } catch (err) {
      console.warn('Collection item association reconciliation skipped or failed:', err);
      return { totalInspected: 0, repairedCount: 0 };
    }
  }
}

export const db = new TravelNestDatabase();

/**
 * Safely initializes and tests opening the local database.
 * Returns { success: true } or an informative error object if Dexie fails to open.
 */
export async function initializeDatabaseSafely(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!db.isOpen()) {
      await db.open();
    }
    // Reconcile collection item trip associations safely on startup
    await db.reconcileCollectionAssociations();
    return { success: true };
  } catch (err: any) {
    console.error('CRITICAL: TravelNest database open/migration failed:', err);
    return { success: false, error: err?.message || String(err) };
  }
}
