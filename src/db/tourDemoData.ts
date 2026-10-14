import { db } from './database';
import type {
  Trip,
  ItineraryEvent,
  Booking,
  Expense,
  EssentialItem,
  CollectionItem,
  JournalEntry,
} from '../types';

export const TOUR_DEMO_TRIP_ID = 'trip-tour-demo-tokyo';

/**
 * Checks if the tour demo dataset is currently present in local database.
 */
export async function hasTourDemoData(): Promise<boolean> {
  try {
    const demoTrip = await db.trips.get(TOUR_DEMO_TRIP_ID);
    return Boolean(demoTrip);
  } catch {
    return false;
  }
}

/**
 * Seeds a single, rich sample journey with events, bookings, budget, collections,
 * and journal memories specifically for the interactive spotlight tour.
 * Only seeds if the user has 0 trips to preserve privacy and prevent clobbering.
 */
export async function loadTourDemoData(): Promise<boolean> {
  try {
    // Only load demo data if the user has no trips
    const existingTripCount = await db.trips.count();
    if (existingTripCount > 0) {
      return false;
    }

    const demoTrip: Trip = {
      id: TOUR_DEMO_TRIP_ID,
      name: 'Tokyo Sakura & Tech Odyssey',
      destination: 'Tokyo & Kyoto, Japan',
      country: 'Japan',
      startDate: '2026-04-10',
      endDate: '2026-04-18',
      status: 'planning',
      coverImage:
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      defaultCurrency: 'INR',
      plannedBudget: 180000,
      categoryBudgets: {
        Flights: 65000,
        Accommodation: 48000,
        Transit: 28000,
        Food: 25000,
        Activities: 14000,
      },
      travelers: ['Alex (Me)', 'Mia'],
      notes: 'Sample journey loaded for tour demonstration. Automatically removed when tour ends.',
      isSample: true,
      isTourPreview: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const demoEvents: ItineraryEvent[] = [
      {
        id: 'tour-ev-1',
        tripId: TOUR_DEMO_TRIP_ID,
        dayNumber: 1,
        date: '2026-04-10',
        title: 'Arrival at Haneda & Shinjuku Check-in',
        category: 'travel',
        startTime: '15:30',
        endTime: '17:30',
        location: 'Haneda Airport (HND) → Shinjuku',
        notes: 'Take Tokyo Monorail to Hamamatsucho, transfer to JR Yamanote Line.',
        orderIndex: 0,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-ev-2',
        tripId: TOUR_DEMO_TRIP_ID,
        dayNumber: 2,
        date: '2026-04-11',
        title: 'Shibuya Sky 360 Observatory & Sunset Drinks',
        category: 'activity',
        startTime: '17:00',
        endTime: '19:30',
        location: 'Shibuya Scramble Square',
        notes: 'Glass sky edge corner over Shibuya crossing. Sunset reservation at 17:20.',
        orderIndex: 1,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-ev-3',
        tripId: TOUR_DEMO_TRIP_ID,
        dayNumber: 3,
        date: '2026-04-12',
        title: 'Tsukiji Outer Market Tasting & TeamLab Planets',
        category: 'food',
        startTime: '09:00',
        endTime: '14:00',
        location: 'Tsukiji Outer Market → Toyosu',
        notes: 'Tamagoyaki egg omelets, fresh uni skewers, and digital art installation.',
        orderIndex: 2,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const demoBookings: Booking[] = [
      {
        id: 'tour-bk-1',
        tripId: TOUR_DEMO_TRIP_ID,
        type: 'flight',
        title: 'ANA Flight NH105 (Tokyo Haneda)',
        provider: 'All Nippon Airways',
        refNumber: 'NH-78291',
        cost: 65000,
        currency: 'INR',
        notes: 'Seat 14A & 14B (Window). 2x 23kg checked bags included.',
        status: 'confirmed',
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-bk-2',
        tripId: TOUR_DEMO_TRIP_ID,
        type: 'hotel',
        title: 'Shinjuku Granbell Hotel',
        provider: 'Granbell Hotels Tokyo',
        refNumber: 'SGH-4410',
        cost: 48000,
        currency: 'INR',
        notes: 'Premier Twin Room with city view. 6 nights.',
        status: 'confirmed',
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const demoExpenses: Expense[] = [
      {
        id: 'tour-exp-1',
        tripId: TOUR_DEMO_TRIP_ID,
        title: 'ANA Roundtrip Flight Tickets',
        category: 'flights',
        amount: 65000,
        currency: 'INR',
        paidBy: 'Alex (Me)',
        splitMode: 'none',
        splitWith: [],
        date: '2026-03-10',
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-exp-2',
        tripId: TOUR_DEMO_TRIP_ID,
        title: 'Shinjuku Granbell Hotel Deposit',
        category: 'lodging',
        amount: 48000,
        currency: 'INR',
        paidBy: 'Alex (Me)',
        splitMode: 'none',
        splitWith: [],
        date: '2026-03-12',
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-exp-3',
        tripId: TOUR_DEMO_TRIP_ID,
        title: '7-Day Whole Japan Rail Pass',
        category: 'transport',
        amount: 28000,
        currency: 'INR',
        paidBy: 'Mia',
        splitMode: 'none',
        splitWith: [],
        date: '2026-03-15',
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const demoEssentials: EssentialItem[] = [
      {
        id: 'tour-ess-1',
        tripId: TOUR_DEMO_TRIP_ID,
        type: 'packing',
        category: 'Documents',
        item: 'Passports & Visit Japan Web QR Code',
        packed: true,
        isTourPreview: true,
      },
      {
        id: 'tour-ess-2',
        tripId: TOUR_DEMO_TRIP_ID,
        type: 'packing',
        category: 'Electronics',
        item: 'Type-A Two-Pin Japan Power Adapter & Power Bank',
        packed: false,
        isTourPreview: true,
      },
      {
        id: 'tour-ess-3',
        tripId: TOUR_DEMO_TRIP_ID,
        type: 'packing',
        category: 'Transit',
        item: 'Digital Suica Transit Card on Apple Wallet',
        packed: true,
        isTourPreview: true,
      },
    ];

    const demoCollections: CollectionItem[] = [
      {
        id: 'tour-col-1',
        title: 'Shibuya Sky 360 Open-Air Observatory',
        type: 'place',
        status: 'assigned',
        country: 'Japan',
        category: 'place',
        tripId: TOUR_DEMO_TRIP_ID,
        url: 'https://www.shibuya-scramble-square.com/sky/',
        imageUrl:
          'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
        notes: 'Glass sky edge corner over Shibuya crossing. Reserved online for sunset slot.',
        tags: ['Sightseeing', 'Shibuya', 'Sunset', 'Views'],
        isSample: true,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-col-2',
        title: 'Secret Omoide Yokocho Yakitori Alley',
        type: 'place',
        status: 'assigned',
        country: 'Japan',
        category: 'food',
        tripId: TOUR_DEMO_TRIP_ID,
        url: 'https://instagram.com/reel/tokyo-foodie-hidden-gems',
        imageUrl:
          'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=80',
        notes: 'Tiniest yakitori stalls under the train tracks. Order negima & tsukune skewers.',
        tags: ['Food', 'Nightlife', 'Tokyo', 'Must-Try'],
        isSample: true,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tour-col-3',
        title: 'Fushimi Inari Thousand Vermilion Torii Path',
        type: 'place',
        status: 'inbox',
        country: 'Japan',
        category: 'place',
        imageUrl:
          'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80',
        notes: 'Early morning hike along mountain path before tour buses arrive.',
        tags: ['Culture', 'Kyoto', 'Shrines', 'Photography'],
        isSample: true,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const demoJournals: JournalEntry[] = [
      {
        id: 'tour-jn-1',
        tripId: TOUR_DEMO_TRIP_ID,
        title: 'First Sunset over Shinjuku Gyoen',
        content:
          'Arrived just as the cherry blossoms were catching the evening golden light. The contrast between ancient Japanese gardens and Tokyo high-rises in the distance is breathtaking.',
        date: '2026-04-11',
        locationName: 'Shinjuku Gyoen National Garden, Tokyo',
        tags: ['CherryBlossom', 'Tokyo', 'Sunset'],
        photos: [
          'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        ],
        isFavorite: true,
        isSample: true,
        isTourPreview: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await db.transaction(
      'rw',
      [
        db.trips,
        db.itineraryEvents,
        db.bookings,
        db.expenses,
        db.essentials,
        db.collectionItems,
        db.journalEntries,
        db.countries,
      ],
      async () => {
        await db.saveCountry('Japan');
        await db.trips.put(demoTrip);
        await db.itineraryEvents.bulkPut(demoEvents);
        await db.bookings.bulkPut(demoBookings);
        await db.expenses.bulkPut(demoExpenses);
        await db.essentials.bulkPut(demoEssentials);
        await db.collectionItems.bulkPut(demoCollections);
        await db.journalEntries.bulkPut(demoJournals);
      }
    );

    return true;
  } catch (err) {
    console.warn('Failed to load tour demo preview:', err);
    return false;
  }
}

/**
 * Cleanly removes all tour demo preview records from the database.
 * Completely immune to deleting real user trips or user records.
 */
export async function clearTourDemoData(): Promise<void> {
  try {
    const tourTripIds = [TOUR_DEMO_TRIP_ID];
    const tourPrefixes = ['tour-'];

    await db.transaction(
      'rw',
      [
        db.trips,
        db.collectionItems,
        db.itineraryEvents,
        db.bookings,
        db.expenses,
        db.essentials,
        db.documents,
        db.journalEntries,
      ],
      async () => {
        // Delete tour demo trip
        await db.trips.delete(TOUR_DEMO_TRIP_ID);

        // Helper to remove any item with tour prefix or isTourPreview flag
        const deleteMatching = async (table: any) => {
          const all = await table.toArray();
          const idsToDelete = all
            .filter(
              (item: any) =>
                item.isTourPreview === true ||
                tourTripIds.includes(item.tripId) ||
                tourPrefixes.some((p) => String(item.id).startsWith(p))
            )
            .map((item: any) => item.id);
          if (idsToDelete.length > 0) {
            await table.bulkDelete(idsToDelete);
          }
        };

        await deleteMatching(db.collectionItems);
        await deleteMatching(db.itineraryEvents);
        await deleteMatching(db.bookings);
        await deleteMatching(db.expenses);
        await deleteMatching(db.essentials);
        await deleteMatching(db.documents);
        await deleteMatching(db.journalEntries);
      }
    );
  } catch (err) {
    console.warn('Failed to clear tour demo preview:', err);
  }
}
