import { db } from '../db/database';
import type {
  RecordPackPayload,
  ConflictStrategy,
  Trip,
  Place,
  CollectionItem,
  ItineraryEvent,
  Booking,
  Expense,
  EssentialItem,
  VaultDocument,
  Recipe,
  BaseIngredientPrice,
  TransportLeg,
  TripMealPlan,
  TripGroceryItem,
  TripIngredientPriceOverride,
} from '../types';

/**
 * Exports a single Trip and all its associated records as a portable RecordPackPayload
 */
export async function exportSelectedTripPack(tripId: string): Promise<RecordPackPayload> {
  const trip = await db.trips.get(tripId);
  if (!trip) throw new Error('Trip not found.');

  const [
    itineraryEvents,
    bookings,
    expenses,
    essentials,
    documents,
    collectionItems,
    places,
    transportLegs,
    tripMealPlans,
    tripGroceryItems,
    tripIngredientOverrides,
  ] = await Promise.all([
    db.itineraryEvents.where('tripId').equals(tripId).toArray(),
    db.bookings.where('tripId').equals(tripId).toArray(),
    db.expenses.where('tripId').equals(tripId).toArray(),
    db.essentials.where('tripId').equals(tripId).toArray(),
    db.documents.where('tripId').equals(tripId).toArray(),
    db.collectionItems.where('tripId').equals(tripId).toArray(),
    db.places.where('tripId').equals(tripId).toArray(),
    db.transportLegs.where('tripId').equals(tripId).toArray(),
    db.tripMealPlans.where('tripId').equals(tripId).toArray(),
    db.tripGroceryItems.where('tripId').equals(tripId).toArray(),
    db.tripIngredientOverrides.where('tripId').equals(tripId).toArray(),
  ]);

  // Also collect any recipes referenced in meal plans
  const referencedRecipeIds = Array.from(
    new Set(tripMealPlans.map((m) => m.recipeId).filter((id): id is string => Boolean(id)))
  );
  const referencedRecipes = referencedRecipeIds.length > 0
    ? await db.recipes.where('id').anyOf(referencedRecipeIds).toArray()
    : [];

  return {
    format: 'travelnest-pack',
    version: 1,
    exportedAt: new Date().toISOString(),
    generator: 'TravelNest v2.5 Companion',
    manifest: {
      title: trip.name,
      description: `${trip.destination} (${itineraryEvents.length} activities, ${bookings.length} bookings, ${transportLegs.length} transit legs)`,
      tripsCount: 1,
      recipesCount: referencedRecipes.length,
      placesCount: places.length,
      transportLegsCount: transportLegs.length,
      mealPlansCount: tripMealPlans.length,
    },
    data: {
      trips: [trip],
      places,
      collectionItems,
      itineraryEvents,
      bookings,
      expenses,
      essentials,
      documents,
      recipes: referencedRecipes,
      transportLegs,
      tripMealPlans,
      tripGroceryItems,
      tripIngredientOverrides,
    },
  };
}

/**
 * Exports selected recipes as a portable Recipe Pack
 */
export async function exportSelectedRecipesPack(recipeIds?: string[]): Promise<RecordPackPayload> {
  const recipes = recipeIds && recipeIds.length > 0
    ? await db.recipes.where('id').anyOf(recipeIds).toArray()
    : await db.recipes.toArray();

  const basePrices = await db.baseIngredientPrices.toArray();

  return {
    format: 'travelnest-recipe-pack',
    version: 1,
    exportedAt: new Date().toISOString(),
    generator: 'TravelNest v2.5 Companion',
    manifest: {
      title: `${recipes.length} Selected Recipes`,
      description: 'Cookbook export with ingredient prices and instructions',
      recipesCount: recipes.length,
    },
    data: {
      recipes,
      baseIngredientPrices: basePrices,
    },
  };
}

/**
 * Validates and inspects a JSON string as a candidate RecordPack
 */
export function validateRecordPack(jsonString: string): {
  valid: boolean;
  errors: string[];
  payload?: RecordPackPayload;
} {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, errors: ['Invalid JSON payload.'] };
    }

    if (parsed.format !== 'travelnest-pack' && parsed.format !== 'travelnest-recipe-pack') {
      errors.push('Unrecognized pack format (expected "travelnest-pack" or "travelnest-recipe-pack").');
    }

    if (!parsed.data || typeof parsed.data !== 'object') {
      errors.push('Missing "data" container in pack.');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, errors: [], payload: parsed as RecordPackPayload };
  } catch (err: any) {
    return { valid: false, errors: [err?.message || 'Malformed JSON.'] };
  }
}

/**
 * Imports a validated RecordPackPayload into Dexie with safe conflict resolution
 */
export async function importRecordPackWithStrategy(
  pack: RecordPackPayload,
  strategy: ConflictStrategy
): Promise<{
  importedCount: number;
  skippedCount: number;
  overwrittenCount: number;
  copiedCount: number;
}> {
  let importedCount = 0;
  let skippedCount = 0;
  let overwrittenCount = 0;
  let copiedCount = 0;

  const { data } = pack;

  // We will run this inside a safe Dexie read-write transaction
  await db.transaction(
    'rw',
    [
      db.trips,
      db.places,
      db.collectionItems,
      db.itineraryEvents,
      db.bookings,
      db.expenses,
      db.essentials,
      db.documents,
      db.recipes,
      db.baseIngredientPrices,
      db.transportLegs,
      db.tripMealPlans,
      db.tripGroceryItems,
      db.tripIngredientOverrides,
    ],
    async () => {
      // If strategy is 'copy', we build an ID remapping dictionary for trips & foreign keys
      const idMap = new Map<string, string>();
      const makeNewId = (oldId: string, prefix: string) => {
        const newId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        idMap.set(oldId, newId);
        return newId;
      };

      // 1. Process Trips
      if (data.trips && data.trips.length > 0) {
        for (const rawTrip of data.trips) {
          const existing = await db.trips.get(rawTrip.id);
          if (existing) {
            if (strategy === 'skip') {
              skippedCount++;
              continue;
            } else if (strategy === 'overwrite') {
              await db.trips.put({ ...rawTrip, updatedAt: new Date().toISOString() });
              overwrittenCount++;
            } else {
              // Copy
              const newTripId = makeNewId(rawTrip.id, 'trip');
              await db.trips.add({
                ...rawTrip,
                id: newTripId,
                name: `${rawTrip.name} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              copiedCount++;
            }
          } else {
            // New record
            await db.trips.add(rawTrip);
            importedCount++;
          }
        }
      }

      // Helper to process child records linked to trips
      const processChildRecords = async <T extends { id: string; tripId?: string; isEdited?: boolean }>(
        records: T[] | undefined,
        table: any,
        prefix: string
      ) => {
        if (!records || records.length === 0) return;
        for (const item of records) {
          let targetTripId = item.tripId;
          if (item.tripId && idMap.has(item.tripId)) {
            targetTripId = idMap.get(item.tripId);
          }

          const existing = await table.get(item.id);
          if (existing) {
            if (strategy === 'skip') {
              skippedCount++;
            } else if (strategy === 'overwrite') {
              await table.put({ ...item, tripId: targetTripId });
              overwrittenCount++;
            } else {
              // Copy
              const newId = makeNewId(item.id, prefix);
              await table.add({ ...item, id: newId, tripId: targetTripId });
              copiedCount++;
            }
          } else {
            await table.add({ ...item, tripId: targetTripId });
            importedCount++;
          }
        }
      };

      await processChildRecords(data.itineraryEvents, db.itineraryEvents, 'ev');
      await processChildRecords(data.bookings, db.bookings, 'bk');
      await processChildRecords(data.expenses, db.expenses, 'exp');
      await processChildRecords(data.essentials, db.essentials, 'ess');
      await processChildRecords(data.documents, db.documents, 'doc');
      await processChildRecords(data.places, db.places, 'pl');
      await processChildRecords(data.collectionItems, db.collectionItems, 'col');
      await processChildRecords(data.transportLegs, db.transportLegs, 'leg');
      await processChildRecords(data.tripMealPlans, db.tripMealPlans, 'meal');
      await processChildRecords(data.tripGroceryItems, db.tripGroceryItems, 'groc');
      await processChildRecords(data.tripIngredientOverrides, db.tripIngredientOverrides, 'ovr');

      // Process Reusable Recipes
      if (data.recipes && data.recipes.length > 0) {
        for (const recipe of data.recipes) {
          const existing = await db.recipes.get(recipe.id);
          if (existing) {
            if (strategy === 'skip') {
              skippedCount++;
            } else if (strategy === 'overwrite') {
              await db.recipes.put({ ...recipe, updatedAt: new Date().toISOString() });
              overwrittenCount++;
            } else {
              // Copy
              const newRecipeId = makeNewId(recipe.id, 'recipe');
              await db.recipes.add({
                ...recipe,
                id: newRecipeId,
                title: `${recipe.title} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              copiedCount++;
            }
          } else {
            await db.recipes.add(recipe);
            importedCount++;
          }
        }
      }

      // Process Base Ingredient Prices (always safe merge by name)
      if (data.baseIngredientPrices && data.baseIngredientPrices.length > 0) {
        for (const price of data.baseIngredientPrices) {
          const existing = await db.baseIngredientPrices.get(price.id);
          if (!existing || strategy === 'overwrite') {
            await db.baseIngredientPrices.put(price);
          }
        }
      }
    }
  );

  return { importedCount, skippedCount, overwrittenCount, copiedCount };
}
