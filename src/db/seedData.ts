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
  BaseIngredientPrice,
  TransportLeg,
  TripMealPlan,
} from '../types';
import { detectCountry, getItemEffectiveCountry, normalizeCategory, getCountryCover } from '../utils/countryUtils';
import { isTripEdited, isJournalEdited, isCollectionItemEdited } from './provenance';

export function getSampleCollectionItems(trip1Id: string = 'trip-tokyo-2026', trip2Id: string = 'trip-swiss-2026'): CollectionItem[] {
  const items: CollectionItem[] = [
    // Japan Country Collection Items
    {
      id: 'col-1',
      title: 'Secret Omoide Yokocho Yakitori Alley',
      type: 'place',
      status: 'assigned',
      country: 'Japan',
      category: 'food',
      tripId: trip1Id,
      placeId: 'place-shibuya-crossing',
      url: 'https://instagram.com/reel/tokyo-foodie-hidden-gems',
      imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80',
      notes: 'Tiniest yakitori stalls under the train tracks. Cash only! Order the negima & tsukune skewers.',
      tags: ['Food', 'Nightlife', 'Tokyo', 'Must-Try'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-jp-food-2',
      title: 'Tsukiji Outer Market Fresh Uni & Wagyu Skewers',
      type: 'place',
      status: 'assigned',
      country: 'Japan',
      category: 'food',
      tripId: trip1Id,
      url: 'https://www.tsukiji.or.jp/english/',
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
      notes: 'Best tamagoyaki egg omelets and fresh sashimi bowls. Arrive around 8:30 AM before crowds.',
      tags: ['Food', 'Breakfast', 'Tsukiji', 'Seafood'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-jp-place-1',
      title: 'Shibuya Sky 360 Open-Air Observatory',
      type: 'place',
      status: 'assigned',
      country: 'Japan',
      category: 'place',
      tripId: trip1Id,
      url: 'https://www.shibuya-scramble-square.com/sky/',
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
      notes: 'Glass sky edge corner over Shibuya crossing. Reserve online 4 weeks early for sunset slot (17:20).',
      tags: ['Sightseeing', 'Shibuya', 'Sunset', 'Views'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-jp-act-1',
      title: 'teamLab Planets Digital Art Immersion',
      type: 'activity',
      status: 'assigned',
      country: 'Japan',
      category: 'activity',
      tripId: trip1Id,
      url: 'https://planets.teamlab.art/tokyo/',
      imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80',
      notes: 'Barefoot sensory digital art experience. Roll up pants above knees for the warm koi water pond room.',
      tags: ['Art', 'Interactive', 'Tokyo', 'Must-Do'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-jp-stay-1',
      title: 'Hoshinoya Kyoto Traditional Riverside Ryokan',
      type: 'place',
      status: 'assigned',
      country: 'Japan',
      category: 'stay',
      tripId: trip1Id,
      url: 'https://hoshinoresorts.com/en/hotels/hoshinoyakyoto/',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80',
      notes: 'Arrive via private wooden riverboat on Oi River. Kaiseki dinner served in private tatami room.',
      tags: ['Ryokan', 'Kyoto', 'Luxury', 'Arashiyama'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-jp-shop-1',
      title: 'Ginza Six & Akihabara Electronics Alley',
      type: 'place',
      status: 'assigned',
      country: 'Japan',
      category: 'shopping',
      tripId: trip1Id,
      url: 'https://ginza6.tokyo/',
      notes: 'Tsutaya Books rooftop garden, tax-free shopping on 2nd floor, and retro camera shops in Akiba.',
      tags: ['Shopping', 'Gadgets', 'Ginza', 'Souvenirs'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-2',
      title: '7-Day JR Pass vs Regional Shinkansen IC Card Comparison',
      type: 'link',
      status: 'assigned',
      country: 'Japan',
      category: 'transport',
      tripId: trip1Id,
      url: 'https://www.japan-guide.com/e/e2361.html',
      notes: 'Calculated: individual Shinkansen tickets + Suica app on iPhone is 30% cheaper since price hike.',
      tags: ['Transport', 'Budget Tip', 'Shinkansen'],
      createdAt: new Date().toISOString(),
    },

    // Switzerland Country Collection Items
    {
      id: 'col-3',
      title: 'Lauterbrunnen Valley 72 Waterfalls Bike Trail',
      type: 'place',
      status: 'assigned',
      country: 'Switzerland',
      category: 'activity',
      tripId: trip2Id,
      placeId: 'place-interlaken-lake',
      url: 'https://alltrails.com/trail/switzerland/lauterbrunnen-valley',
      imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=400&q=80',
      notes: 'Rent e-bikes from Lauterbrunnen station and ride to Trümmelbach Falls inside the mountain.',
      tags: ['Hiking', 'Scenic', 'Must-Do', 'Alps'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-ch-food-1',
      title: 'Fondue Chalet Ferdinand with Matterhorn Panorama',
      type: 'place',
      status: 'assigned',
      country: 'Switzerland',
      category: 'food',
      tripId: trip2Id,
      url: 'https://cervo.swiss/en/eat-drink/ferdinand',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
      notes: '100% Swiss Valais cheese fondue and truffle raclette by fireplace in Zermatt.',
      tags: ['Food', 'Fondue', 'Zermatt', 'Dinner'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-ch-stay-1',
      title: 'The Chedi Andermatt Alpine Haven',
      type: 'place',
      status: 'assigned',
      country: 'Switzerland',
      category: 'stay',
      tripId: trip2Id,
      url: 'https://www.thechediandermatt.com/',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80',
      notes: 'Stunning indoor-outdoor heated pool surrounded by snow peaks and 5-meter cheese humidor.',
      tags: ['Hotel', 'Spa', 'Luxury', 'Alps'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-ch-place-1',
      title: 'Grindelwald First Cliff Walk & Tissot Bridge',
      type: 'place',
      status: 'assigned',
      country: 'Switzerland',
      category: 'place',
      tripId: trip2Id,
      url: 'https://www.jungfrau.ch/en-gb/grindelwaldfirst/first-cliff-walk-by-tissot/',
      notes: 'Suspension bridge walk cantilevered over 2,000m drop. Ride First Glider zip-rider down.',
      tags: ['Adventure', 'Mountains', 'Scenic', 'Jungfrau'],
      createdAt: new Date().toISOString(),
    },

    // Other Country Collections
    {
      id: 'col-inbox-1',
      title: 'Reykjavik Geothermal Sky Lagoon & 7-Step Ocean Ritual',
      type: 'place',
      status: 'inbox',
      country: 'Iceland',
      category: 'activity',
      url: 'https://visitreykjavik.is/sky-lagoon',
      imageUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=400&q=80',
      notes: 'Sky Lagoon 7-step ritual ocean cliff view. Great for winter northern lights trip.',
      tags: ['Nordic', 'Spa', 'Lagoon', 'Must-Do'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-inbox-2',
      title: 'Lisbon Pastéis de Belém Original Century Bakery & Tram 28',
      type: 'place',
      status: 'inbox',
      country: 'Portugal',
      category: 'food',
      imageUrl: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=400&q=80',
      notes: 'Warm custard tarts with cinnamon. Go early around 8:30 AM before tourist coaches.',
      tags: ['Pastry', 'Portugal', 'Lisbon', 'Breakfast'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-kz-1',
      title: 'Kaindy Lake Sunken Birch Forest & Kolsai Lakes',
      type: 'place',
      status: 'assigned',
      country: 'Kazakhstan',
      category: 'nature',
      tripId: 'trip-kazakhstan-2026',
      imageUrl: 'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=400&q=80',
      notes: 'Submerged spruce trees preserved in crystalline mountain water. Saty village guesthouses nearby.',
      tags: ['Tien Shan', 'Nature', 'Lakes', 'Hiking'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'col-inbox-3',
      title: 'Ultra-light packing gear checklist for 3-week carry-on trips',
      type: 'note',
      status: 'inbox',
      country: 'General',
      category: 'tips',
      notes: 'Merino wool base layers, Matador toiletry bottles, compact USB-C 65W GaN charger.',
      tags: ['Gear', 'Minimalist', 'Checklist'],
      createdAt: new Date().toISOString(),
    },
  ];
  return items.map((i) => ({ ...i, isSample: true }));
}

export function getSampleJournalEntries(trip1Id: string = 'trip-tokyo-2026', trip2Id: string = 'trip-swiss-2026'): JournalEntry[] {
  const entries: JournalEntry[] = [
    {
      id: 'journal-standalone-1',
      title: 'Sunset at Gokarna Om Beach',
      content: 'Sat on the warm granite rocks watching the Arabian sea turn into molten gold. The sound of waves crashing and fishermen packing their nets. An impromptu detour that turned into one of my most peaceful evenings years ago.',
      date: '2023-04-18', // Standalone memory from 3 years ago!
      time: '18:45',
      locationName: 'Om Beach, Gokarna',
      photos: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['Sunset', 'Coast', 'Serene', 'Solo Walk'],
      mood: '🌅 Serene',
      isFavorite: true,
      createdAt: '2023-04-18T18:45:00Z',
      updatedAt: '2023-04-18T18:45:00Z',
    },
    {
      id: 'journal-standalone-2',
      title: 'Midnight Vinyl & Chicory Coffee',
      content: 'Rain poured over the cobblestone lane while the turntable played jazz classics. No flight to catch, no itinerary alarms—just warm conversation and hot filter coffee until 2 AM.',
      date: '2024-09-05',
      time: '23:30',
      locationName: 'Old Quarter Attic Cafe',
      photos: [], // Text-only memory with no photos
      tags: ['Everyday', 'Music', 'Rainy Night'],
      mood: '☕ Nostalgic',
      isFavorite: false,
      createdAt: '2024-09-05T23:30:00Z',
      updatedAt: '2024-09-05T23:30:00Z',
    },
    {
      id: 'journal-trip-1',
      tripId: trip1Id,
      itineraryEventId: 'ev-1',
      placeId: 'place-shibuya-crossing',
      title: 'Crossing the Electric Tide at Shibuya',
      content: 'Stepping out of the Hachiko exit into the neon downpour. A thousand umbrella canopies colliding without a single apology or bump. It felt like walking straight through a cyberpunk cinematic sequence.',
      date: '2026-03-24',
      time: '19:30',
      locationName: 'Shibuya Crossing, Tokyo',
      photos: [
        'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['Tokyo', 'Neon', 'Night Walk', 'Arrival'],
      mood: '⚡ Electric',
      isFavorite: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'journal-trip-2',
      tripId: trip2Id,
      title: 'Morning Glass at Lake Brienz',
      content: 'Woke up at 6 AM before the village woke up. The turquoise water looked like liquid glass with morning mist drifting between the alpine pines.',
      date: '2026-05-26',
      time: '06:45',
      locationName: 'Lake Brienz, Switzerland',
      photos: [
        'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      ],
      tags: ['Alps', 'Lakes', 'Morning Walk'],
      mood: '🏔️ Adventure',
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  return entries.map((e) => ({ ...e, isSample: true }));
}

export async function seedSampleJournals() {
  const journals = getSampleJournalEntries();
  await db.journalEntries.bulkPut(journals);
}

/**
 * Checks if the demo/test sample dataset is currently present in the database.
 */
export async function hasSampleData(): Promise<{
  hasSampleTrips: boolean;
  sampleTripCount: number;
  totalTripCount: number;
}> {
  const sampleTripIds = ['trip-tokyo-2026', 'trip-swiss-2026', 'trip-kazakhstan-2026'];
  const allTrips = await db.trips.toArray();
  const sampleTrips = allTrips.filter((t) => sampleTripIds.includes(t.id));
  return {
    hasSampleTrips: sampleTrips.length > 0,
    sampleTripCount: sampleTrips.length,
    totalTripCount: allTrips.length,
  };
}

export const DEFAULT_CATEGORIES: Array<{ label: string; icon: string; scope: 'collection' | 'expense' | 'essential' }> = [
  { label: 'Food & Cafes', icon: '🍽️', scope: 'collection' },
  { label: 'Places & Sights', icon: '📍', scope: 'collection' },
  { label: 'Stays & Hotels', icon: '🏨', scope: 'collection' },
  { label: 'Activities & Fun', icon: '🎟️', scope: 'collection' },
  { label: 'Shopping & Markets', icon: '🛍️', scope: 'collection' },
  { label: 'Transport & Passes', icon: '🚆', scope: 'collection' },
  { label: 'Tips & Notes', icon: '📝', scope: 'collection' },
  { label: 'Flights', icon: '✈️', scope: 'expense' },
  { label: 'Stay', icon: '🏨', scope: 'expense' },
  { label: 'Food', icon: '🍽️', scope: 'expense' },
  { label: 'Transit', icon: '🚆', scope: 'expense' },
  { label: 'Activity', icon: '🎟️', scope: 'expense' },
  { label: 'Shopping', icon: '🛍️', scope: 'expense' },
  { label: 'Insurance', icon: '📄', scope: 'expense' },
  { label: 'Other', icon: '✨', scope: 'expense' },
  { label: 'Clothing', icon: '👕', scope: 'essential' },
  { label: 'Electronics', icon: '🔌', scope: 'essential' },
  { label: 'Toiletries', icon: '🧴', scope: 'essential' },
  { label: 'Documents', icon: '🛂', scope: 'essential' },
  { label: 'Health', icon: '💊', scope: 'essential' },
  { label: 'Money', icon: '💳', scope: 'essential' },
  { label: 'General', icon: '🎒', scope: 'essential' },
];

/**
 * Startup initialization: Ensures default categories and countries exist.
 * NEVER seeds sample trips, events, expenses, or journals automatically.
 * Genuinely new installations will open with an empty database.
 */
export async function seedInitialDataIfEmpty() {
  // If already migrated and initialized, skip redundant background DB writes
  try {
    if (localStorage.getItem('travelnest_v5_migrated') === 'true') {
      return;
    }
  } catch {
    // Ignored
  }

  try {
    // 1. Genuinely new installations start with a blank Finds library.
    // The user's chosen dream country will be initialized during onboarding.
    // (No pre-populated countries are seeded)

    // 1a. For existing installations, ensure existing trips have country populated
    const allTrips = await db.trips.toArray();
    for (const trip of allTrips) {
      if (!trip.country) {
        const country =
          trip.id === 'trip-tokyo-2026'
            ? 'Japan'
            : trip.id === 'trip-swiss-2026'
            ? 'Switzerland'
            : trip.id === 'trip-kazakhstan-2026'
            ? 'Kazakhstan'
            : detectCountry(trip.destination);
        await db.trips.update(trip.id, { country });
      }
      if (trip.country) {
        await db.saveCountry(trip.country);
      }
    }

    // 1b. Ensure default categories exist in categories table
    for (const cat of DEFAULT_CATEGORIES) {
      await db.saveCategory(cat.label, cat.icon, cat.scope);
    }

    try {
      localStorage.setItem('travelnest_v5_migrated', 'true');
    } catch {
      // Ignored
    }
  } catch (err) {
    console.warn('Initial data seed check error:', err);
  }
}

/**
 * Deliberate sample data seeding triggered via Settings ("Add Dummy Data").
 * Supports 'replace' (fresh overwrite) or 'merge' (safe append without deleting user's custom records).
 */
export async function seedSampleData(mode: 'replace' | 'merge' = 'replace') {
  const now = new Date();
  const formatOffsetDate = (daysAhead: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const trip1Id = 'trip-tokyo-2026';
  const trip2Id = 'trip-swiss-2026';
  const trip3Id = 'trip-kazakhstan-2026';

  const trips: Trip[] = [
    {
      id: trip1Id,
      name: 'Tokyo Sakura & Neon Odyssey',
      destination: 'Tokyo & Kyoto, Japan',
      country: 'Japan',
      startDate: formatOffsetDate(12),
      endDate: formatOffsetDate(22),
      status: 'upcoming',
      coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      defaultCurrency: 'INR',
      plannedBudget: 185000,
      travelers: ['Alex (Me)', 'Mia', 'Kenji'],
      notes: 'Cherry blossom season walk in Ueno Park, teamLab Planets digital art, and bullet train to Kyoto Gion district.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: trip2Id,
      name: 'Swiss Alps Hiking Expedition',
      destination: 'Interlaken & Zermatt, Switzerland',
      country: 'Switzerland',
      startDate: formatOffsetDate(75),
      endDate: formatOffsetDate(84),
      status: 'planning',
      coverImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
      defaultCurrency: 'INR',
      plannedBudget: 150000,
      travelers: ['Alex (Me)', 'Sarah'],
      notes: 'Matterhorn sunrise photo spots, Jungfraujoch train pass, and alpine hut reservations.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: trip3Id,
      name: '8-Day Kazakhstan Itinerary',
      destination: 'Almaty & Almaty Region, Kazakhstan',
      country: 'Kazakhstan',
      startDate: formatOffsetDate(20),
      endDate: formatOffsetDate(27),
      status: 'planning',
      coverImage: 'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=1200&q=80',
      defaultCurrency: 'INR',
      plannedBudget: 95000,
      travelers: ['Alex (Me)', 'Travel Crew'],
      notes: 'Tien Shan peaks, Charyn Canyon, Kaindy Lake sunken forest, and Almaty city life.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const places: Place[] = [
    {
      id: 'place-shinjuku-gyoen',
      tripId: trip1Id,
      name: 'Shinjuku Gyoen National Garden',
      address: '11 Naitomachi, Shinjuku City, Tokyo',
      lat: 35.6852,
      lng: 139.7101,
      category: 'nature',
      sourceUrl: 'https://www.env.go.jp/garden/shinjukugyoen/english/',
      notes: 'Prime cherry blossom spot! Traditional Japanese garden tea house inside.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'place-teamlab-planets',
      tripId: trip1Id,
      name: 'teamLab Planets TOKYO',
      address: '6-1-16 Toyosu, Koto City, Tokyo',
      lat: 35.6491,
      lng: 139.7898,
      category: 'attraction',
      sourceUrl: 'https://planets.teamlab.art/tokyo/',
      notes: 'Barefoot immersive digital art museum. Book tickets 3 weeks ahead for morning slot.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'place-sensoji',
      tripId: trip1Id,
      name: 'Senso-ji Ancient Buddhist Temple',
      address: '2-3-1 Asakusa, Taito City, Tokyo',
      lat: 35.7148,
      lng: 139.7967,
      category: 'attraction',
      sourceUrl: 'https://www.senso-ji.jp',
      notes: 'Oldest temple in Tokyo. Nakamise-dori street food outside for melonpan.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'place-shibuya-crossing',
      tripId: trip1Id,
      name: 'Shibuya Crossing & Sky Observatory',
      address: 'Shibuya Scramble, Shibuya City, Tokyo',
      lat: 35.6595,
      lng: 139.7005,
      category: 'attraction',
      notes: 'Famous scramble crossing. Sunset view from Shibuya Sky roof terrace.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'place-tsukiji-market',
      tripId: trip1Id,
      name: 'Tsukiji Outer Seafood Market',
      address: '4 Chome Tsukiji, Chuo City, Tokyo',
      lat: 35.6655,
      lng: 139.7708,
      category: 'food',
      notes: 'Fresh uni bowls, tamagoyaki skewers, and wagyu beef bites.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'place-interlaken-lake',
      tripId: trip2Id,
      name: 'Lake Brienz Kayak Point',
      address: 'Bönigen, Interlaken, Switzerland',
      lat: 46.6917,
      lng: 7.8927,
      category: 'nature',
      notes: 'Turquoise glacial waters. Sunset kayak tours leave at 5:30 PM.',
      createdAt: new Date().toISOString(),
    },
  ];

  const collectionItems: CollectionItem[] = getSampleCollectionItems(trip1Id, trip2Id);

  const itineraryEvents: ItineraryEvent[] = [
    {
      id: 'event-1',
      tripId: trip1Id,
      dayNumber: 1,
      date: formatOffsetDate(12),
      startTime: '10:00',
      endTime: '12:30',
      title: 'Arrive & Check-in at Shinjuku Granbell Hotel',
      location: 'Kabukicho, Shinjuku',
      category: 'lodging',
      notes: 'Drop bags, pick up pocket Wi-Fi router and digital Suica cards.',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-2',
      tripId: trip1Id,
      dayNumber: 1,
      date: formatOffsetDate(12),
      startTime: '13:00',
      endTime: '16:00',
      title: 'Shinjuku Gyoen Sakura Walk & Picnic',
      location: 'Shinjuku Gyoen National Garden',
      placeId: 'place-shinjuku-gyoen',
      category: 'nature',
      notes: 'Grab onigiri and matcha from Lawson beforehand.',
      orderIndex: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-3',
      tripId: trip1Id,
      dayNumber: 1,
      date: formatOffsetDate(12),
      startTime: '18:00',
      endTime: '20:30',
      title: 'Tokyo Sky View & Shibuya Scramble Crossing',
      location: 'Shibuya Scramble',
      placeId: 'place-shibuya-crossing',
      category: 'sightseeing',
      notes: 'Rooftop golden hour reservation at 18:20 PM.',
      orderIndex: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-4',
      tripId: trip1Id,
      dayNumber: 2,
      date: formatOffsetDate(13),
      startTime: '08:30',
      endTime: '11:00',
      title: 'Tsukiji Market Breakfast Street Food Feast',
      location: 'Tsukiji Outer Market',
      placeId: 'place-tsukiji-market',
      category: 'food',
      notes: 'Arrive early to avoid queues. Fresh sashimi bowl for breakfast!',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-5',
      tripId: trip1Id,
      dayNumber: 2,
      date: formatOffsetDate(13),
      startTime: '12:00',
      endTime: '14:30',
      title: 'teamLab Planets Digital Art Immersion',
      location: 'Toyosu, Koto City',
      placeId: 'place-teamlab-planets',
      category: 'activity',
      notes: 'Wear pants that can be rolled up past knees for water exhibit.',
      orderIndex: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'event-6',
      tripId: trip1Id,
      dayNumber: 2,
      date: formatOffsetDate(13),
      startTime: '15:30',
      endTime: '18:00',
      title: 'Historic Senso-ji Temple & Asakusa Walking Tour',
      location: 'Asakusa',
      placeId: 'place-sensoji',
      category: 'sightseeing',
      notes: 'Draw Omikuji fortune sticks. Incense smoke blessings.',
      orderIndex: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-1',
      tripId: trip3Id,
      dayNumber: 1,
      date: formatOffsetDate(20),
      startTime: '09:30',
      endTime: '19:00',
      title: 'Almaty – Kok Tobe, Panfilov Park & Zenkov Cathedral',
      location: 'Almaty, Kazakhstan',
      category: 'sightseeing',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-2',
      tripId: trip3Id,
      dayNumber: 2,
      date: formatOffsetDate(21),
      startTime: '09:00',
      endTime: '19:30',
      title: 'Medeu & Shymbulak – Don’t miss ⭐ Level 3 for the best views! Arbat Street & Green Bazaar',
      location: 'Medeu & Shymbulak',
      category: 'nature',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-3',
      tripId: trip3Id,
      dayNumber: 3,
      date: formatOffsetDate(22),
      startTime: '08:30',
      endTime: '15:00',
      title: 'Big Almaty Lake – Take a Yandex Go and enjoy the stunning turquoise lake 🏔️💙',
      location: 'Big Almaty Lake (BAO)',
      category: 'nature',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-4',
      tripId: trip3Id,
      dayNumber: 4,
      date: formatOffsetDate(23),
      startTime: '06:30',
      endTime: '20:30',
      title: 'JoinMe Asia Tour – Saty Village, Kaindy Lake & Kolsai Lake (overnight stay)',
      location: 'Saty Village, Kaindy & Kolsai',
      category: 'travel',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-5',
      tripId: trip3Id,
      dayNumber: 5,
      date: formatOffsetDate(24),
      startTime: '08:00',
      endTime: '19:30',
      title: 'Black Canyon, Moon Canyon, Charyn Canyon & Charyn River → Return to Almaty',
      location: 'Charyn Canyon & Almaty',
      category: 'nature',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-6',
      tripId: trip3Id,
      dayNumber: 6,
      date: formatOffsetDate(25),
      startTime: '10:00',
      endTime: '23:30',
      title: 'Almaty Museum, local markets, cafés & nightlife 🏛️☕',
      location: 'Downtown Almaty',
      category: 'activity',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-7',
      tripId: trip3Id,
      dayNumber: 7,
      date: formatOffsetDate(26),
      startTime: '10:00',
      endTime: '21:00',
      title: 'Explore Almaty on a Whoosh scooter 🛴, discover hidden cafés & do your final shopping',
      location: 'Almaty City',
      category: 'activity',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev-kz-8',
      tripId: trip3Id,
      dayNumber: 8,
      date: formatOffsetDate(27),
      startTime: '10:00',
      endTime: '15:00',
      title: 'Departure ✈️',
      location: 'Almaty International Airport (ALA)',
      category: 'travel',
      orderIndex: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bk-hotel-1',
      tripId: trip1Id,
      type: 'hotel',
      title: 'Shinjuku Granbell Executive Suite',
      provider: 'Booking.com',
      refNumber: 'BK-TOKYO-882914',
      cost: 1450,
      currency: 'USD',
      status: 'confirmed',
      startDate: formatOffsetDate(12),
      endDate: formatOffsetDate(18),
      notes: 'Includes breakfast buffet & rooftop terrace access. Free cancellation until 48h before.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-flight-1',
      tripId: trip1Id,
      type: 'flight',
      title: 'All Nippon Airways (ANA) Roundtrip NH105',
      provider: 'ANA Airlines',
      refNumber: 'NH-774921X',
      cost: 45000,
      currency: 'INR',
      status: 'confirmed',
      startDate: formatOffsetDate(12),
      endDate: formatOffsetDate(22),
      notes: 'Terminal 3 Haneda arrival. 2 checked bags (23kg each) included per passenger.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-train-1',
      tripId: trip1Id,
      type: 'train',
      title: 'Tokaido Shinkansen Nozomi Bullet Train',
      provider: 'JR Central SmartEX',
      refNumber: 'SHK-55209B',
      cost: 9500,
      currency: 'INR',
      status: 'confirmed',
      startDate: formatOffsetDate(18),
      endDate: formatOffsetDate(18),
      notes: 'Tokyo Station -> Kyoto Station (2h 15m). Fuji-side window seats reserved.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'bk-act-1',
      tripId: trip1Id,
      type: 'activity',
      title: 'teamLab Planets VIP Early Access Tickets',
      provider: 'Klook Official',
      refNumber: 'KLK-491029',
      cost: 4500,
      currency: 'INR',
      status: 'confirmed',
      startDate: formatOffsetDate(13),
      notes: 'QR code barcode tickets stored in Veya document vault.',
      createdAt: new Date().toISOString(),
    },
  ];

  const expenses: Expense[] = [
    // Linked Booking Payment (Double Counting Rule test!)
    {
      id: 'exp-payment-flight',
      tripId: trip1Id,
      bookingId: 'bk-flight-1', // Linked to flight booking!
      title: 'Flight Downpayment (Card Statement)',
      amount: 45000,
      currency: 'INR',
      category: 'flights',
      paidBy: 'Alex (Me)',
      date: formatOffsetDate(-10),
      splitMode: 'equal',
      splitWith: ['Alex (Me)', 'Mia', 'Kenji'],
      notes: 'Alex booked flights for all 3. Mia and Kenji owe ₹15,000 each.',
      createdAt: new Date().toISOString(),
    },
    // Linked Booking Payment for Activity
    {
      id: 'exp-payment-act',
      tripId: trip1Id,
      bookingId: 'bk-act-1',
      title: 'teamLab Tickets Pre-paid',
      amount: 4500,
      currency: 'INR',
      category: 'activities',
      paidBy: 'Mia',
      date: formatOffsetDate(-5),
      splitMode: 'equal',
      splitWith: ['Alex (Me)', 'Mia', 'Kenji'],
      notes: 'Mia paid on her credit card.',
      createdAt: new Date().toISOString(),
    },
    // Independent Daily Expenses
    {
      id: 'exp-indep-1',
      tripId: trip1Id,
      title: 'Welcome Omakase Sushi Dinner at Ginza',
      amount: 6200,
      currency: 'INR',
      category: 'food',
      paidBy: 'Kenji',
      date: formatOffsetDate(12),
      splitMode: 'equal',
      splitWith: ['Alex (Me)', 'Mia', 'Kenji'],
      notes: 'Split equally 3 ways (₹2,066 each).',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-indep-2',
      tripId: trip1Id,
      title: 'Pasmo / Suica IC Metro Cards recharge',
      amount: 1800,
      currency: 'INR',
      category: 'transport',
      paidBy: 'Alex (Me)',
      date: formatOffsetDate(12),
      splitMode: 'equal',
      splitWith: ['Alex (Me)', 'Mia', 'Kenji'],
      notes: '₹600 per person initial balance.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-indep-3',
      tripId: trip1Id,
      title: 'Tokyo Skytree Souvenirs & Matcha treats',
      amount: 2400,
      currency: 'INR',
      category: 'shopping',
      paidBy: 'Mia',
      date: formatOffsetDate(13),
      splitMode: 'none',
      splitWith: ['Mia'],
      notes: 'Personal souvenir expense.',
      createdAt: new Date().toISOString(),
    },
  ];

  const essentials: EssentialItem[] = [
    {
      id: 'ess-1',
      tripId: trip1Id,
      type: 'document',
      category: 'Essentials',
      item: 'Passport (valid 6+ months)',
      packed: true,
      notes: 'Double check expiration date',
    },
    {
      id: 'ess-2',
      tripId: trip1Id,
      type: 'document',
      category: 'Essentials',
      item: 'Visit Japan Web QR Code saved offline',
      packed: true,
      notes: 'For express customs immigration lane',
    },
    {
      id: 'ess-3',
      tripId: trip1Id,
      type: 'document',
      category: 'Finance',
      item: 'Wise / Revolut Zero-FX fee cards',
      packed: true,
      notes: 'Loaded with JPY currency',
    },
    {
      id: 'ess-4',
      tripId: trip1Id,
      type: 'packing',
      category: 'Electronics',
      item: 'Universal Travel Adapter (Type A/B)',
      packed: true,
      notes: 'Japan uses 100V 2-flat pin',
    },
    {
      id: 'ess-5',
      tripId: trip1Id,
      type: 'packing',
      category: 'Electronics',
      item: '20,000mAh Anker Power Bank',
      packed: false,
      notes: 'Must be in carry-on bag!',
    },
    {
      id: 'ess-6',
      tripId: trip1Id,
      type: 'packing',
      category: 'Clothing',
      item: 'Comfortable walking sneakers (15k+ steps/day)',
      packed: true,
      notes: 'Slip-on style handy for shrines/restaurants',
    },
    {
      id: 'ess-7',
      tripId: trip1Id,
      type: 'packing',
      category: 'Clothing',
      item: 'Light waterproof jacket / windbreaker',
      packed: false,
      notes: 'Spring evenings can drop to 12°C',
    },
    {
      id: 'ess-8',
      tripId: trip1Id,
      type: 'packing',
      category: 'Toiletries',
      item: 'Pocket hand sanitizer & travel tissues',
      packed: false,
      notes: 'Public restrooms in Tokyo rarely have paper towels',
    },
  ];

  const documents: VaultDocument[] = [
    {
      id: 'doc-ana-boarding-pass',
      tripId: trip1Id,
      bookingId: 'bk-flight-1',
      filename: 'ANA_NH105_E-Ticket_Receipt.pdf',
      mimeType: 'application/pdf',
      fileSize: 245800,
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJVRyYXZlbE5lc3RfRW1iZWRkZWRfVGVzdF9Eb2N1bWVudF9TZWVk',
      tags: ['Flight', 'Booking Confirmation', 'ANA'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'doc-hotel-voucher',
      tripId: trip1Id,
      bookingId: 'bk-hotel-1',
      filename: 'Shinjuku_Granbell_CheckIn_Voucher.pdf',
      mimeType: 'application/pdf',
      fileSize: 189200,
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJVRyYXZlbE5lc3RfSG90ZWxfVm91Y2hlcl9TZWVk',
      tags: ['Hotel', 'Accommodation', 'Shinjuku'],
      createdAt: new Date().toISOString(),
    },
  ];

  const journals = getSampleJournalEntries(trip1Id, trip2Id);

  const allTables = [
    db.trips,
    db.places,
    db.collectionItems,
    db.itineraryEvents,
    db.bookings,
    db.expenses,
    db.essentials,
    db.documents,
    db.countries,
    db.categories,
    db.journalEntries,
    db.transportLegs,
    db.recipes,
    db.baseIngredientPrices,
    db.tripIngredientOverrides,
    db.tripMealPlans,
    db.tripGroceryItems,
  ].filter(Boolean);

  await db.transaction('rw', allTables, async () => {
    if (mode === 'replace') {
      await db.clearAll();

      const taggedTrips = trips.map((t) => ({ ...t, isSample: true }));
      const taggedPlaces = places.map((p) => ({ ...p, isSample: true }));
      const taggedCollectionItems = collectionItems.map((c) => ({ ...c, isSample: true }));
      const taggedEvents = itineraryEvents.map((e) => ({ ...e, isSample: true }));
      const taggedBookings = bookings.map((b) => ({ ...b, isSample: true }));
      const taggedExpenses = expenses.map((e) => ({ ...e, isSample: true }));
      const taggedEssentials = essentials.map((ess) => ({ ...ess, isSample: true }));
      const taggedDocuments = documents.map((d) => ({ ...d, isSample: true }));
      const taggedJournals = journals.map((j) => ({ ...j, isSample: true }));

      await db.trips.bulkPut(taggedTrips);
      await db.places.bulkPut(taggedPlaces);
      await db.collectionItems.bulkPut(taggedCollectionItems);
      await db.itineraryEvents.bulkPut(taggedEvents);
      await db.bookings.bulkPut(taggedBookings);
      await db.expenses.bulkPut(taggedExpenses);
      await db.essentials.bulkPut(taggedEssentials);
      await db.documents.bulkPut(taggedDocuments);
      await db.journalEntries.bulkPut(taggedJournals);

      if (db.recipes) await db.recipes.bulkPut(getSampleRecipes());
      if (db.baseIngredientPrices) await db.baseIngredientPrices.bulkPut(getSampleBaseIngredientPrices());
      if (db.transportLegs) await db.transportLegs.bulkPut(getSampleTransportLegs(trip1Id));

      // Re-populate country dossiers for sample trips
      const sampleCountries = [
        { id: 'japan', name: 'Japan', coverImage: getCountryCover('Japan'), createdAt: new Date().toISOString() },
        { id: 'switzerland', name: 'Switzerland', coverImage: getCountryCover('Switzerland'), createdAt: new Date().toISOString() },
        { id: 'kazakhstan', name: 'Kazakhstan', coverImage: getCountryCover('Kazakhstan'), createdAt: new Date().toISOString() },
      ];
      await db.countries.bulkPut(sampleCountries);

      // Re-populate default categories
      for (const cat of DEFAULT_CATEGORIES) {
        const id = cat.label.trim().toLowerCase().replace(/\s+/g, '-');
        await db.categories.put({
          id,
          label: cat.label,
          icon: cat.icon,
          scope: cat.scope,
          createdAt: new Date().toISOString(),
        });
      }
    } else {
      // mode === 'merge'
      // Deduplicate sample records & strictly preserve user modifications

      // 1. Trips: Check if trip exists. If edited by user, KEEP user version. If missing, insert sample.
      const existingTrips = await db.trips.toArray();
      const existingTripMap = new Map(existingTrips.map((t) => [t.id, t]));
      const tripsToPut: Trip[] = [];
      for (const t of trips) {
        const existing = existingTripMap.get(t.id);
        if (!existing) {
          tripsToPut.push({ ...t, isSample: true });
        } else if (isTripEdited(existing) || existing.isEdited === true) {
          // Keep user modifications
          continue;
        }
      }
      if (tripsToPut.length > 0) {
        await db.trips.bulkPut(tripsToPut);
      }

      // 2. Places: Deduplicate by ID
      const existingPlaces = await db.places.toArray();
      const existingPlaceIds = new Set(existingPlaces.map((p) => p.id));
      const placesToPut = places.filter((p) => !existingPlaceIds.has(p.id)).map((p) => ({ ...p, isSample: true }));
      if (placesToPut.length > 0) {
        await db.places.bulkPut(placesToPut);
      }

      // 3. Collection Items (Finds): Deduplicate & preserve user modifications
      const existingItems = await db.collectionItems.toArray();
      const existingItemMap = new Map(existingItems.map((c) => [c.id, c]));
      const itemsToPut: CollectionItem[] = [];
      for (const c of collectionItems) {
        const existing = existingItemMap.get(c.id);
        if (!existing) {
          itemsToPut.push({ ...c, isSample: true });
        } else if (isCollectionItemEdited(existing) || existing.isEdited === true) {
          // Keep user modifications
          continue;
        }
      }
      if (itemsToPut.length > 0) {
        await db.collectionItems.bulkPut(itemsToPut);
      }

      // 4. Itinerary Events: Deduplicate by ID
      const existingEvents = await db.itineraryEvents.toArray();
      const existingEventIds = new Set(existingEvents.map((e) => e.id));
      const eventsToPut = itineraryEvents.filter((e) => !existingEventIds.has(e.id)).map((e) => ({ ...e, isSample: true }));
      if (eventsToPut.length > 0) {
        await db.itineraryEvents.bulkPut(eventsToPut);
      }

      // 5. Bookings: Deduplicate by ID
      const existingBookings = await db.bookings.toArray();
      const existingBookingIds = new Set(existingBookings.map((b) => b.id));
      const bookingsToPut = bookings.filter((b) => !existingBookingIds.has(b.id)).map((b) => ({ ...b, isSample: true }));
      if (bookingsToPut.length > 0) {
        await db.bookings.bulkPut(bookingsToPut);
      }

      // 6. Expenses: Deduplicate by ID
      const existingExpenses = await db.expenses.toArray();
      const existingExpenseIds = new Set(existingExpenses.map((exp) => exp.id));
      const expensesToPut = expenses.filter((exp) => !existingExpenseIds.has(exp.id)).map((exp) => ({ ...exp, isSample: true }));
      if (expensesToPut.length > 0) {
        await db.expenses.bulkPut(expensesToPut);
      }

      // 7. Essentials: Deduplicate by ID
      const existingEssentials = await db.essentials.toArray();
      const existingEssentialIds = new Set(existingEssentials.map((ess) => ess.id));
      const essentialsToPut = essentials.filter((ess) => !existingEssentialIds.has(ess.id)).map((ess) => ({ ...ess, isSample: true }));
      if (essentialsToPut.length > 0) {
        await db.essentials.bulkPut(essentialsToPut);
      }

      // 8. Documents: Deduplicate by ID
      const existingDocuments = await db.documents.toArray();
      const existingDocIds = new Set(existingDocuments.map((d) => d.id));
      const docsToPut = documents.filter((d) => !existingDocIds.has(d.id)).map((d) => ({ ...d, isSample: true }));
      if (docsToPut.length > 0) {
        await db.documents.bulkPut(docsToPut);
      }

      // 9. Journals: Deduplicate & preserve user modifications
      const existingJournals = await db.journalEntries.toArray();
      const existingJournalMap = new Map(existingJournals.map((j) => [j.id, j]));
      const journalsToPut: JournalEntry[] = [];
      for (const j of journals) {
        const existing = existingJournalMap.get(j.id);
        if (!existing) {
          journalsToPut.push({ ...j, isSample: true });
        } else if (isJournalEdited(existing) || existing.isEdited === true) {
          // Keep user modifications
          continue;
        }
      }
      if (journalsToPut.length > 0) {
        await db.journalEntries.bulkPut(journalsToPut);
      }

      // 10. Companion tables (recipes, baseIngredientPrices, transportLegs): Deduplicate by ID
      if (db.recipes) {
        const existingRecipes = await db.recipes.toArray();
        const existingRecipeIds = new Set(existingRecipes.map((r) => r.id));
        const recipesToPut = getSampleRecipes().filter((r) => !existingRecipeIds.has(r.id));
        if (recipesToPut.length > 0) await db.recipes.bulkPut(recipesToPut);
      }
      if (db.baseIngredientPrices) {
        const existingPrices = await db.baseIngredientPrices.toArray();
        const existingPriceIds = new Set(existingPrices.map((p) => p.id));
        const pricesToPut = getSampleBaseIngredientPrices().filter((p) => !existingPriceIds.has(p.id));
        if (pricesToPut.length > 0) await db.baseIngredientPrices.bulkPut(pricesToPut);
      }
      if (db.transportLegs) {
        const existingLegs = await db.transportLegs.toArray();
        const existingLegIds = new Set(existingLegs.map((l) => l.id));
        const legsToPut = getSampleTransportLegs(trip1Id).filter((l) => !existingLegIds.has(l.id));
        if (legsToPut.length > 0) await db.transportLegs.bulkPut(legsToPut);
      }

      // Country folders: Ensure sample countries exist without overwriting
      for (const countryName of ['Japan', 'Switzerland', 'Kazakhstan']) {
        const cId = countryName.toLowerCase();
        const existingCountry = await db.countries.get(cId);
        if (!existingCountry) {
          await db.countries.put({
            id: cId,
            name: countryName,
            coverImage: getCountryCover(countryName),
            createdAt: new Date().toISOString(),
          });
        }
      }

      // Categories: Ensure default categories exist without overwriting
      for (const cat of DEFAULT_CATEGORIES) {
        const id = cat.label.trim().toLowerCase().replace(/\s+/g, '-');
        const existingCat = await db.categories.get(id);
        if (!existingCat) {
          await db.categories.put({
            id,
            label: cat.label,
            icon: cat.icon,
            scope: cat.scope,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  });
}

export function getSampleRecipes(): Recipe[] {
  return [
    {
      id: 'recipe-shakshuka',
      title: 'Campfire Mediterranean Shakshuka',
      description: 'Poached eggs in a hearty spiced tomato, garlic, and bell pepper reduction with crumbled feta.',
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      category: 'breakfast',
      tags: ['quick', 'vegetarian', 'pan-friendly', 'breakfast'],
      imageUrl: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=600&q=80',
      ingredients: [
        { id: 'ing-1', name: 'Eggs', quantity: 4, unit: 'pcs', category: 'dairy' },
        { id: 'ing-2', name: 'Canned Tomatoes', quantity: 400, unit: 'g', category: 'pantry' },
        { id: 'ing-3', name: 'Bell Pepper', quantity: 1, unit: 'pcs', category: 'produce' },
        { id: 'ing-4', name: 'Onion', quantity: 1, unit: 'pcs', category: 'produce' },
        { id: 'ing-5', name: 'Garlic', quantity: 2, unit: 'pcs', category: 'produce' },
        { id: 'ing-6', name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
        { id: 'ing-7', name: 'Feta Cheese', quantity: 80, unit: 'g', category: 'dairy' },
      ],
      instructions: [
        'Heat olive oil in a skillet over medium heat. Sauté diced onions and bell pepper until soft (5 mins).',
        'Add minced garlic and cumin, cook for 1 minute until fragrant.',
        'Pour in canned crushed tomatoes and simmer for 6 minutes until thickened.',
        'Create small wells with a spoon and crack eggs directly into the tomato sauce.',
        'Cover and simmer on low heat for 5-7 minutes until egg whites are set but yolks remain runny.',
        'Garnish with crumbled feta and fresh coriander. Serve hot with crusty sourdough bread.',
      ],
      isSample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'recipe-garlic-butter-pasta',
      title: 'Alpine Garlic Butter & Herb Pasta',
      description: 'Quick 15-minute traveler pasta tossed in browned butter, thinly sliced garlic, parmesan, and cracked pepper.',
      servings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      category: 'dinner',
      tags: ['budget', 'under-15-mins', 'easy', 'comfort'],
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=600&q=80',
      ingredients: [
        { id: 'ing-p-1', name: 'Pasta', quantity: 250, unit: 'g', category: 'pantry' },
        { id: 'ing-p-2', name: 'Butter', quantity: 50, unit: 'g', category: 'dairy' },
        { id: 'ing-p-3', name: 'Garlic', quantity: 4, unit: 'pcs', category: 'produce' },
        { id: 'ing-p-4', name: 'Parmesan Cheese', quantity: 40, unit: 'g', category: 'dairy' },
        { id: 'ing-p-5', name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
      ],
      instructions: [
        'Boil pasta in salted water until al dente (8-9 mins). Reserve 1/4 cup pasta water before draining.',
        'In a pan, melt butter with olive oil over low-medium heat. Add thinly sliced garlic and sauté until golden.',
        'Toss drained pasta and reserved pasta water into the garlic butter sauce.',
        'Remove from heat, fold in grated parmesan, and season with sea salt and cracked black pepper.',
      ],
      isSample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'recipe-tokyo-curry',
      title: 'Tokyo Comfort Golden Curry Rice',
      description: 'Classic Japanese-style mild comforting vegetable & potato curry served over fluffy steamed rice.',
      servings: 3,
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      category: 'dinner',
      tags: ['japan', 'hearty', 'one-pot', 'comfort'],
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      ingredients: [
        { id: 'ing-c-1', name: 'Rice', quantity: 300, unit: 'g', category: 'pantry' },
        { id: 'ing-c-2', name: 'Potatoes', quantity: 2, unit: 'pcs', category: 'produce' },
        { id: 'ing-c-3', name: 'Carrots', quantity: 2, unit: 'pcs', category: 'produce' },
        { id: 'ing-c-4', name: 'Onion', quantity: 2, unit: 'pcs', category: 'produce' },
        { id: 'ing-c-5', name: 'Japanese Curry Roux', quantity: 90, unit: 'g', category: 'pantry' },
      ],
      instructions: [
        'Chop onions, peel carrots and potatoes into bite-sized chunks.',
        'In a pot, sauté onions in a dash of oil until caramelized (7 mins). Add carrots and potatoes.',
        'Add 500ml water, bring to boil, and simmer covered for 15 minutes until vegetables are tender.',
        'Break curry roux cubes into the pot, stir until completely dissolved and thickened.',
        'Simmer on low for 5 minutes. Ladle over warm steamed rice.',
      ],
      isSample: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getSampleBaseIngredientPrices(): BaseIngredientPrice[] {
  return [
    { id: 'eggs', name: 'Eggs', unit: 'pcs', unitQuantity: 6, price: 90, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'canned-tomatoes', name: 'Canned Tomatoes', unit: 'g', unitQuantity: 400, price: 110, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'bell-pepper', name: 'Bell Pepper', unit: 'pcs', unitQuantity: 1, price: 40, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'onion', name: 'Onion', unit: 'pcs', unitQuantity: 1, price: 15, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'garlic', name: 'Garlic', unit: 'pcs', unitQuantity: 1, price: 10, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'olive-oil', name: 'Olive Oil', unit: 'ml', unitQuantity: 500, price: 550, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'feta-cheese', name: 'Feta Cheese', unit: 'g', unitQuantity: 200, price: 280, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'pasta', name: 'Pasta', unit: 'g', unitQuantity: 500, price: 120, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'butter', name: 'Butter', unit: 'g', unitQuantity: 100, price: 60, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'parmesan-cheese', name: 'Parmesan Cheese', unit: 'g', unitQuantity: 100, price: 320, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'rice', name: 'Rice', unit: 'g', unitQuantity: 1000, price: 110, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'potatoes', name: 'Potatoes', unit: 'pcs', unitQuantity: 1, price: 15, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'carrots', name: 'Carrots', unit: 'pcs', unitQuantity: 1, price: 20, currency: 'INR', updatedAt: new Date().toISOString() },
    { id: 'japanese-curry-roux', name: 'Japanese Curry Roux', unit: 'g', unitQuantity: 100, price: 240, currency: 'INR', updatedAt: new Date().toISOString() },
  ];
}

export function getSampleTransportLegs(tripId: string = 'trip-tokyo-2026'): TransportLeg[] {
  return [
    {
      id: 'leg-ana-flight',
      tripId,
      dayNumber: 1,
      date: '2026-04-10',
      mode: 'flight',
      carrier: 'All Nippon Airways',
      lineOrFlightNumber: 'Flight NH828',
      departureLocation: 'Delhi Indira Gandhi Intl (DEL)',
      departureTime: '01:15',
      arrivalLocation: 'Tokyo Haneda Airport (HND)',
      arrivalTime: '11:25',
      bookingId: 'bk-flight-1',
      bookingRef: 'NH-78291',
      seatOrCabin: '14A & 14B',
      platformOrGate: 'Terminal 3 / Gate 18',
      orderIndex: 0,
      notes: 'Direct red-eye flight. Tokyo Monorail transfer available after customs.',
      cost: 65000,
      currency: 'INR',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'leg-monorail',
      tripId,
      dayNumber: 1,
      date: '2026-04-10',
      mode: 'train',
      carrier: 'Tokyo Monorail',
      lineOrFlightNumber: 'Haneda Express Line',
      departureLocation: 'Haneda Airport Terminal 3 Station',
      departureTime: '12:45',
      arrivalLocation: 'Hamamatsucho Station',
      arrivalTime: '13:00',
      platformOrGate: 'Track 1',
      orderIndex: 1,
      notes: '15-minute direct monorail to Yamanote Line. Tap Apple Wallet Suica.',
      cost: 300,
      currency: 'INR',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'leg-yamanote',
      tripId,
      dayNumber: 1,
      date: '2026-04-10',
      mode: 'subway',
      carrier: 'JR East',
      lineOrFlightNumber: 'JR Yamanote Line (Inner Loop)',
      departureLocation: 'Hamamatsucho Station',
      departureTime: '13:10',
      arrivalLocation: 'Shinjuku Station (East Exit)',
      arrivalTime: '13:35',
      platformOrGate: 'Track 3',
      orderIndex: 2,
      notes: 'Walk 6 mins through Kabukicho to Shinjuku Granbell Hotel.',
      cost: 140,
      currency: 'INR',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'leg-shinkansen',
      tripId,
      dayNumber: 4,
      date: '2026-04-13',
      mode: 'train',
      carrier: 'JR Central',
      lineOrFlightNumber: 'Tokaido Shinkansen Nozomi 29',
      departureLocation: 'Tokyo Station',
      departureTime: '08:30',
      arrivalLocation: 'Kyoto Station',
      arrivalTime: '10:45',
      bookingRef: 'SHIN-KYOTO-44',
      seatOrCabin: 'Car 7, Seats 12D & 12E (Mt. Fuji side)',
      platformOrGate: 'Track 14',
      orderIndex: 3,
      notes: 'Clear view of Mount Fuji on the right side around Shin-Fuji station at 09:12 AM.',
      cost: 8500,
      currency: 'INR',
      isSample: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

// Re-export provenance engine helpers for convenient imports
export { inspectDummyDataForRemoval, removeDummyData } from './provenance';
