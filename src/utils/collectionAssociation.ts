import type { CollectionItem, Trip, CollectionItemStatus } from '../types';
import { formatDateRangeDDmmmYY } from './dateUtils';
import { db } from '../db/database';

export interface ItemTripAssociation {
  /** Whether the item is authoritatively linked to an active, existing trip */
  isAssigned: boolean;
  /** The linked Trip object if resolved */
  linkedTrip?: Trip;
  /** The verified trip ID if resolved */
  tripId?: string;
  /** The name of the linked trip */
  tripName?: string;
  /** Destination of the linked trip */
  tripDestination?: string;
  /** Formatted date range of the linked trip */
  tripDates?: string;
  /** The country collection drawer where the item is stored */
  collectionCountry: string;
  /** The authoritative workflow status ('assigned' | 'inbox' | 'archived') */
  displayStatus: CollectionItemStatus;
  /** Safe human-readable status text for badges */
  statusBadgeText: string;
  /** Whether the item is scheduled in the trip itinerary */
  isPlannedInItinerary: boolean;
  /** True if this is a global field note without active trip linkage */
  isGlobal: boolean;
}

/**
 * Authoritative single source of truth for collection item trip associations.
 *
 * Rules:
 * 1. An item is ONLY considered assigned to a trip if its `tripId` is non-empty AND
 *    resolves to a valid, existing `Trip` record.
 * 2. Belonging to a country collection (e.g. `country: 'Kazakhstan'`) NEVER implies
 *    trip association, even if a trip in Kazakhstan exists.
 * 3. The `status` field alone cannot establish trip association without a verified trip.
 */
export function getCollectionItemTripAssociation(
  item: CollectionItem | undefined | null,
  trips: Trip[] | Map<string, Trip> | undefined | null
): ItemTripAssociation {
  const collectionCountry = (item?.country && typeof item.country === 'string' && item.country.trim())
    ? item.country.trim()
    : 'General';

  if (!item) {
    return {
      isAssigned: false,
      collectionCountry,
      displayStatus: 'inbox',
      statusBadgeText: '📥 Unassigned',
      isPlannedInItinerary: false,
      isGlobal: true,
    };
  }

  const rawTripId = item.tripId && typeof item.tripId === 'string' ? item.tripId.trim() : '';

  // Look up trip in provided map or array
  let resolvedTrip: Trip | undefined = undefined;
  if (rawTripId && trips) {
    if (trips instanceof Map) {
      resolvedTrip = trips.get(rawTripId);
    } else if (Array.isArray(trips)) {
      resolvedTrip = trips.find((t) => t.id === rawTripId);
    }
  }

  // Authoritative check: item has tripId AND trip exists
  if (rawTripId && resolvedTrip) {
    return {
      isAssigned: true,
      linkedTrip: resolvedTrip,
      tripId: resolvedTrip.id,
      tripName: resolvedTrip.name,
      tripDestination: resolvedTrip.destination,
      tripDates: formatDateRangeDDmmmYY(resolvedTrip.startDate, resolvedTrip.endDate),
      collectionCountry,
      displayStatus: 'assigned',
      statusBadgeText: `🎒 Assigned to Trip`,
      isPlannedInItinerary: Boolean(item.isPlanned),
      isGlobal: false,
    };
  }

  // Not assigned to an existing trip (either no tripId or orphaned reference)
  const isArchived = item.status === 'archived';
  return {
    isAssigned: false,
    collectionCountry,
    displayStatus: isArchived ? 'archived' : 'inbox',
    statusBadgeText: isArchived ? '📦 Archived' : '📥 Global Spot',
    isPlannedInItinerary: false,
    isGlobal: true,
  };
}

/**
 * Reconciles inconsistent legacy or corrupted collection item records in the database.
 * Calls the central database method on db.
 */
export async function reconcileCollectionItemAssociations(): Promise<{
  totalInspected: number;
  repairedCount: number;
}> {
  return db.reconcileCollectionAssociations();
}
