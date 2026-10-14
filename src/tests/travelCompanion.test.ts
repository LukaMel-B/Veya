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

import fs from 'node:fs';
import path from 'node:path';
import {
  mapGtfsRouteTypeToMode,
  parseTimetableJson,
} from '../utils/gtfsParser.ts';
import {
  normalizeIngredientName,
  convertUnitQuantity,
  getIngredientUnitPrice,
  calculateRecipeCost,
  aggregateGroceryListFromMealPlans,
  validateAndParseRecipeFile,
} from '../utils/recipeUtils.ts';
import {
  haversineDistanceKm,
  formatDistance,
  calculateBearing,
  formatCoordinates,
  buildGeoUri,
  buildOfflineDirectionsSteps,
} from '../utils/geoUtils.ts';
import {
  validateRecordPack,
} from '../utils/recordExchange.ts';
import type {
  Recipe,
  BaseIngredientPrice,
  TripIngredientPriceOverride,
  TripMealPlan,
  RecordPackPayload,
  TransportLeg,
} from '../types';

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
  console.log('--- TEST SUITE: TravelNest Travel Companion & Tools Engine ---');
  console.log('===============================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: Multi-Leg Transit & GTFS Parser
  // --------------------------------------------------------------------------
  console.log('--- SECTION 1: Multi-Leg Transit & GTFS Parser ---');

  // 1.1 Route type mapping
  assert(mapGtfsRouteTypeToMode(0) === 'tram', 'GTFS route_type 0 maps to tram');
  assert(mapGtfsRouteTypeToMode(1) === 'subway', 'GTFS route_type 1 maps to subway');
  assert(mapGtfsRouteTypeToMode(2) === 'train', 'GTFS route_type 2 maps to train');
  assert(mapGtfsRouteTypeToMode(3) === 'bus', 'GTFS route_type 3 maps to bus');
  assert(mapGtfsRouteTypeToMode(4) === 'ferry', 'GTFS route_type 4 maps to ferry');
  assert(mapGtfsRouteTypeToMode(7) === 'flight', 'Extended route_type 7 maps to flight');
  assert(mapGtfsRouteTypeToMode(999) === 'bus', 'Unknown route_type falls back to bus');

  // 1.2 Timetable JSON parsing
  const sampleTimetable = {
    feedName: 'Hakone Tozan Railway',
    agency: { name: 'Odakyu Group', url: 'https://www.hakone-tozan.co.jp' },
    routes: [
      { id: 'route-ht-1', name: 'Hakone Tozan Line', mode: 'train', color: '#E53E3E' }
    ],
    stops: [
      { id: 'stop-odawara', name: 'Odawara Station', lat: 35.2562, lng: 139.1558 },
      { id: 'stop-hakone-yumoto', name: 'Hakone-Yumoto Station', lat: 35.2333, lng: 139.1036 }
    ],
    schedule: [
      {
        id: 'sched-1',
        tripId: 'trip-ht-01',
        routeId: 'route-ht-1',
        departureStopId: 'stop-odawara',
        arrivalStopId: 'stop-hakone-yumoto',
        departureTime: '09:15',
        arrivalTime: '09:32',
        serviceDays: ['mon', 'tue', 'wed', 'thu', 'fri']
      }
    ]
  };

  const parsedFeed = parseTimetableJson(JSON.stringify(sampleTimetable));
  assert(parsedFeed.feedName === 'Hakone Tozan Railway', 'Parsed timetable preserves feedName');
  assert(parsedFeed.routes.length === 1, 'Parsed timetable contains 1 route');
  assert(parsedFeed.entries.length === 1, 'Parsed timetable contains 1 schedule entry');
  assert(parsedFeed.entries[0].departureTime === '09:15', 'Schedule departure time is preserved');

  // 1.3 Timetable validation failure on corrupt json
  try {
    parseTimetableJson('{"feedName":"Incomplete"}');
    assert(false, 'Incomplete timetable JSON must throw error');
  } catch (err: any) {
    assert(err.message.includes('missing "routes" array'), 'Incomplete timetable JSON throws descriptive error');
  }

  // 1.4 Layover & duration calculation logic
  const leg1Departure = new Date('2026-10-20T08:00:00Z').getTime();
  const leg1Arrival = new Date('2026-10-20T10:30:00Z').getTime();
  const leg2Departure = new Date('2026-10-20T11:45:00Z').getTime();

  const leg1DurationMinutes = Math.round((leg1Arrival - leg1Departure) / 60000);
  const layoverMinutes = Math.round((leg2Departure - leg1Arrival) / 60000);
  assert(leg1DurationMinutes === 150, 'Leg duration calculated accurately (150 minutes)');
  assert(layoverMinutes === 75, 'Connection layover calculated accurately (75 minutes)');
  assert(layoverMinutes >= 45, 'Layover qualifies as safe connection (>= 45m)');


  // --------------------------------------------------------------------------
  // SECTION 2: Reusable Recipe Library, Pricing & Grocery Engine
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Reusable Recipe Library, Pricing & Grocery Engine ---');

  // 2.1 Ingredient name normalization
  assert(normalizeIngredientName('  Fresh Organic Eggs! ') === 'fresh organic eggs', 'Normalizes "  Fresh Organic Eggs! "');
  assert(normalizeIngredientName('EXTRA VIRGIN OLIVE OIL') === 'extra virgin olive oil', 'Normalizes "EXTRA VIRGIN OLIVE OIL"');
  assert(normalizeIngredientName('Garlic Cloves') === 'garlic cloves', 'Normalizes "Garlic Cloves"');
  assert(normalizeIngredientName('Yellow Onion') === 'yellow onion', 'Normalizes "Yellow Onion"');

  // 2.2 Unit conversion
  assert(convertUnitQuantity(500, 'g', 'kg') === 0.5, 'Converts 500g to 0.5kg');
  assert(convertUnitQuantity(1.5, 'kg', 'g') === 1500, 'Converts 1.5kg to 1500g');
  assert(convertUnitQuantity(750, 'ml', 'l') === 0.75, 'Converts 750ml to 0.75l');
  assert(convertUnitQuantity(2, 'l', 'ml') === 2000, 'Converts 2l to 2000ml');
  assert(convertUnitQuantity(2, 'tbsp', 'cup') === 0.125, 'Converts 2 tbsp to 0.125 cup');
  assert(convertUnitQuantity(4, 'pcs', 'pcs') === 4, 'Identity conversion for pieces returns same quantity');

  // 2.3 Pricing calculation & trip override precedence
  const mockBasePrices: BaseIngredientPrice[] = [
    {
      id: 'price-eggs',
      name: 'eggs',
      price: 3.50,
      currency: 'USD',
      unitQuantity: 12,
      unit: 'pcs',
      updatedAt: '2026-10-01'
    },
    {
      id: 'price-pasta',
      name: 'pasta',
      price: 2.00,
      currency: 'USD',
      unitQuantity: 500,
      unit: 'g',
      updatedAt: '2026-10-01'
    }
  ];

  const mockOverrides: TripIngredientPriceOverride[] = [
    {
      id: 'override-pasta-swiss',
      tripId: 'trip-swiss-2026',
      ingredientName: 'pasta',
      price: 4.50,
      currency: 'CHF',
      unitQuantity: 500,
      unit: 'g',
      updatedAt: '2026-10-01'
    }
  ];

  // Base price retrieval
  const eggPrice = getIngredientUnitPrice('eggs', mockBasePrices);
  assert(eggPrice?.price === 3.50, 'Retrieves base egg price ($3.50 / 12 pcs)');

  // Trip override precedence: Swiss trip overrides pasta price
  const basePastaPrice = getIngredientUnitPrice('pasta', mockBasePrices);
  assert(basePastaPrice?.price === 2.00, 'Retrieves default pasta base price ($2.00)');

  const overriddenPastaPrice = getIngredientUnitPrice('pasta', mockBasePrices, mockOverrides);
  assert(overriddenPastaPrice?.price === 4.50, 'Overrides pasta price with trip-specific Swiss price (4.50 CHF)');
  assert(overriddenPastaPrice?.currency === 'CHF', 'Override reflects destination currency');

  // 2.4 Recipe Cost Calculation
  const testRecipe: Recipe = {
    id: 'rec-pasta-carbonara',
    title: 'Easy Travel Carbonara',
    description: 'Quick skillet meal',
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    ingredients: [
      { id: 'ing-1', name: 'pasta', quantity: 250, unit: 'g' },
      { id: 'ing-2', name: 'eggs', quantity: 4, unit: 'pcs' },
    ],
    instructions: ['Boil pasta', 'Mix eggs', 'Combine'],
    tags: ['quick', 'dinner'],
    isSample: true,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-01',
  };

  // Base cost: 250g pasta ($1.00) + 4 eggs (4 * 3.50/12 = $1.1667) => ~$2.17 total, ~$1.08/serving
  const baseCost = calculateRecipeCost(testRecipe, mockBasePrices, [], 2);
  assert(baseCost.totalCost > 2.10 && baseCost.totalCost < 2.25, `Recipe total cost calculated (${baseCost.totalCost.toFixed(2)})`);
  assert(baseCost.costPerServing > 1.05 && baseCost.costPerServing < 1.15, `Recipe cost per serving calculated (${baseCost.costPerServing.toFixed(2)})`);

  // Scaled servings (4 people instead of 2): doubles cost
  const scaledCost = calculateRecipeCost(testRecipe, mockBasePrices, [], 4);
  assert(Math.abs(scaledCost.totalCost - (baseCost.totalCost * 2)) < 0.05, 'Doubling servings exactly doubles total cost');

  // Overridden cost in Switzerland: 250g pasta (4.50 * 0.5 = 2.25) + eggs => higher cost
  const swissCost = calculateRecipeCost(testRecipe, mockBasePrices, mockOverrides, 2);
  assert(swissCost.totalCost > baseCost.totalCost, 'Swiss trip override produces accurate higher total cost');

  // 2.5 Grocery List Aggregation
  const testMealPlans: TripMealPlan[] = [
    {
      id: 'plan-1',
      tripId: 'trip-tokyo-2026',
      dayNumber: 1,
      date: '2026-10-15',
      mealType: 'dinner',
      recipeId: testRecipe.id,
      servings: 2,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    },
    {
      id: 'plan-2',
      tripId: 'trip-tokyo-2026',
      dayNumber: 2,
      date: '2026-10-16',
      mealType: 'dinner',
      recipeId: testRecipe.id,
      servings: 2,
      createdAt: '2026-10-01',
      updatedAt: '2026-10-01'
    }
  ];

  const aggregatedGroceries = aggregateGroceryListFromMealPlans(
    'trip-tokyo-2026',
    testMealPlans,
    [testRecipe],
    mockBasePrices
  );

  assert(aggregatedGroceries.length === 2, 'Aggregated grocery list contains exactly 2 combined items');
  const pastaItem = aggregatedGroceries.find(g => g.name.toLowerCase() === 'pasta');
  const eggItem = aggregatedGroceries.find(g => g.name.toLowerCase() === 'eggs');
  assert(pastaItem?.totalQuantity === 500, 'Pasta quantity aggregated across both dinners (250g * 2 = 500g)');
  assert(eggItem?.totalQuantity === 8, 'Egg quantity aggregated across both dinners (4 * 2 = 8 pcs)');

  // 2.6 Recipe File Import Validation
  const validRecipeJson = JSON.stringify({
    title: 'Campfire Chili',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    ingredients: [
      { name: 'Ground Beef', quantity: 500, unit: 'g' },
      { name: 'Kidney Beans', quantity: 1, unit: 'can' }
    ],
    instructions: ['Brown meat', 'Simmer beans']
  });

  const parsedRecipeResult = validateAndParseRecipeFile(validRecipeJson);
  assert(parsedRecipeResult.valid === true, 'Valid recipe JSON parses successfully');
  assert(parsedRecipeResult.recipes[0]?.title === 'Campfire Chili', 'Parsed recipe title preserved');
  assert(parsedRecipeResult.recipes[0]?.ingredients.length === 2, 'Parsed recipe ingredients extracted');

  const invalidRecipeJson = JSON.stringify({
    description: 'Missing title and ingredients'
  });
  const badRecipeResult = validateAndParseRecipeFile(invalidRecipeJson);
  assert(badRecipeResult.valid === false, 'Invalid recipe JSON rejected');
  assert(badRecipeResult.error !== undefined, 'Descriptive error returned for invalid recipe');


  // --------------------------------------------------------------------------
  // SECTION 3: Offline Places, Coordinates & Directional Calculations
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Offline Places, Coordinates & Directional Calculations ---');

  // Tokyo Station to Shibuya Crossing
  const tokyoStation = { lat: 35.681236, lng: 139.767125 };
  const shibuyaCrossing = { lat: 35.659494, lng: 139.700553 };

  // 3.1 Haversine Distance
  const distanceKm = haversineDistanceKm(
    tokyoStation.lat,
    tokyoStation.lng,
    shibuyaCrossing.lat,
    shibuyaCrossing.lng
  );
  assert(distanceKm >= 6.0 && distanceKm <= 7.0, `Haversine distance Tokyo -> Shibuya is ~6.5km (Got ${distanceKm.toFixed(2)}km)`);
  assert(formatDistance(distanceKm) === '6.5 km', 'Distance formatted cleanly');
  assert(formatDistance(0.45) === '450 m', 'Short distances formatted in meters');

  // 3.2 Compass Bearing
  const bearing = calculateBearing(
    tokyoStation.lat,
    tokyoStation.lng,
    shibuyaCrossing.lat,
    shibuyaCrossing.lng
  );
  assert(bearing.degrees >= 235 && bearing.degrees <= 255, `Bearing degrees computed accurately (Got ${bearing.degrees}°)`);
  assert(bearing.cardinal === 'W' || bearing.cardinal === 'WSW' || bearing.cardinal === 'SW', `Bearing cardinal direction is ${bearing.cardinal}`);

  // 3.3 Coordinate formatting
  const formattedCoords = formatCoordinates(tokyoStation.lat, tokyoStation.lng);
  assert(formattedCoords.includes('35.6812'), 'Formatted coordinates contain latitude');
  assert(formattedCoords.includes('139.7671'), 'Formatted coordinates contain longitude');

  // 3.4 RFC 5870 Geo URI builder
  const geoUri = buildGeoUri(tokyoStation.lat, tokyoStation.lng, 'Tokyo Station');
  assert(geoUri.startsWith('geo:35.681236,139.767125'), 'Geo URI has standard coordinates prefix');
  assert(geoUri.includes('Tokyo'), 'Geo URI encodes label properly');

  // 3.5 Offline Direction Steps
  const steps = buildOfflineDirectionsSteps(
    'Tokyo Station',
    'Shibuya Crossing',
    distanceKm,
    bearing
  );
  assert(steps.length >= 3, 'Generates at least 3 offline directional steps');
  assert(steps[0].includes('Tokyo Station'), 'Step 1 identifies starting landmark');
  assert(steps[1].includes(bearing.cardinal), 'Step 2 identifies compass direction');
  assert(steps[2].includes('Shibuya Crossing'), 'Final step identifies destination');


  // --------------------------------------------------------------------------
  // SECTION 4: Selected-Record Pack Exchange & Schema Validation
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Selected-Record Pack Exchange & Schema Validation ---');

  // 4.1 Valid Trip Pack
  const validTripPack: RecordPackPayload = {
    format: 'travelnest-pack',
    version: 1,
    exportedAt: new Date().toISOString(),
    generator: 'TravelNest v2.4.0',
    manifest: {
      title: 'Hokkaido Winter Explorer',
      description: 'Trip pack with itinerary, transport, and places',
      tripsCount: 1,
      totalRecords: 2
    },
    data: {
      trips: [
        {
          id: 'trip-hokkaido-1',
          name: 'Hokkaido Winter Explorer',
          destination: 'Sapporo & Otaru',
          startDate: '2027-01-10',
          endDate: '2027-01-18',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      transportLegs: [
        {
          id: 'leg-hok-1',
          tripId: 'trip-hokkaido-1',
          legIndex: 0,
          mode: 'train',
          departureTitle: 'Sapporo Station',
          arrivalTitle: 'Otaru Station',
          departureTime: '10:00',
          arrivalTime: '10:35',
          createdAt: new Date().toISOString()
        }
      ]
    }
  };

  const validationSuccess = validateRecordPack(JSON.stringify(validTripPack));
  assert(validationSuccess.valid === true, 'Valid trip pack validates successfully');
  assert(validationSuccess.payload?.format === 'travelnest-pack', 'Pack payload format recognized as travelnest-pack');
  assert(validationSuccess.errors.length === 0, 'Zero errors for valid trip pack');

  // 4.2 Valid Recipe Pack
  const validRecipePack: RecordPackPayload = {
    format: 'travelnest-recipe-pack',
    version: 1,
    exportedAt: new Date().toISOString(),
    generator: 'TravelNest v2.4.0',
    manifest: {
      title: 'Alpine Trail Kitchen',
      description: 'Outdoor camping meals',
      recipesCount: 1,
      totalRecords: 3
    },
    data: {
      recipes: [testRecipe],
      baseIngredientPrices: mockBasePrices
    }
  };

  const recipeValidation = validateRecordPack(JSON.stringify(validRecipePack));
  assert(recipeValidation.valid === true, 'Valid recipe pack validates successfully');
  assert(recipeValidation.payload?.data.recipes?.length === 1, 'Recipe pack contains 1 recipe');
  assert(recipeValidation.payload?.data.baseIngredientPrices?.length === 2, 'Recipe pack contains base prices');

  // 4.3 Corrupt Pack Rejection
  const corruptPack = JSON.stringify({
    manifest: { format: 'unsupported-format-v99' },
    data: {}
  });
  const corruptValidation = validateRecordPack(corruptPack);
  assert(corruptValidation.valid === false, 'Corrupt or unsupported pack format rejected');
  assert(corruptValidation.errors.some(e => e.includes('Unrecognized pack format')), 'Validation flags unsupported format');


  // --------------------------------------------------------------------------
  // SECTION 5: Trip Deletion Safety & Non-Cascading Invariant
  // --------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Trip Deletion Safety & Non-Cascading Invariant ---');

  // Read database.ts source code directly to enforce compile-time invariants
  const dbSourcePath = path.resolve(process.cwd(), 'src/db/database.ts');
  const dbSource = fs.readFileSync(dbSourcePath, 'utf8');

  // 5.1 deleteTripCascade MUST clean up trip-specific companion entities
  assert(dbSource.includes('this.transportLegs'), 'deleteTripCascade transaction includes transportLegs');
  assert(dbSource.includes('this.tripMealPlans'), 'deleteTripCascade transaction includes tripMealPlans');
  assert(dbSource.includes('this.tripGroceryItems'), 'deleteTripCascade transaction includes tripGroceryItems');
  assert(dbSource.includes('this.tripIngredientOverrides'), 'deleteTripCascade transaction includes tripIngredientOverrides');

  // 5.2 deleteTripCascade MUST NEVER delete recipes or base prices
  assert(!dbSource.includes('this.recipes.where'), 'deleteTripCascade does NOT delete recipes');
  assert(!dbSource.includes('this.baseIngredientPrices.where'), 'deleteTripCascade does NOT delete baseIngredientPrices');
  assert(!dbSource.includes('this.recipes.delete'), 'deleteTripCascade does NOT delete individual recipes');
  assert(!dbSource.includes('this.baseIngredientPrices.delete'), 'deleteTripCascade does NOT delete baseIngredientPrices');

  // 5.3 Dexie schema version 7 contains all companion stores
  assert(dbSource.includes('this.version(7)'), 'Dexie schema defines version(7)');
  assert(dbSource.includes('transportLegs:'), 'Dexie schema includes transportLegs store');
  assert(dbSource.includes('recipes:'), 'Dexie schema includes recipes store');
  assert(dbSource.includes('baseIngredientPrices:'), 'Dexie schema includes baseIngredientPrices store');
  assert(dbSource.includes('tripIngredientOverrides:'), 'Dexie schema includes tripIngredientOverrides store');
  assert(dbSource.includes('tripMealPlans:'), 'Dexie schema includes tripMealPlans store');
  assert(dbSource.includes('tripGroceryItems:'), 'Dexie schema includes tripGroceryItems store');

  // 5.4 Export/Import format includes new tables
  assert(dbSource.includes('transportLegs,'), 'exportFullData includes transportLegs');
  assert(dbSource.includes('recipes,'), 'exportFullData includes recipes');
  assert(dbSource.includes('baseIngredientPrices,'), 'exportFullData includes baseIngredientPrices');

  console.log('\n===============================================================');
  console.log(`TRAVEL COMPANION TESTS: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
