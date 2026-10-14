/**
 * Offline Geolocation, Spatial Distance, Bearings, and Directions Utilities
 */

/**
 * Calculates Haversine great-circle distance between two GPS coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats distance cleanly (e.g. "450 m" or "3.2 km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Computes forward compass bearing and cardinal direction between two points
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { degrees: number; cardinal: string } {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const lambda = toRad(lon2 - lon1);

  const y = Math.sin(lambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda);
  const theta = Math.atan2(y, x);

  const degrees = Math.round(((theta * 180) / Math.PI + 360) % 360);
  const cardinals = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;

  return { degrees, cardinal: cardinals[index] };
}

/**
 * Formats coordinates for clean display (e.g. "35.6762° N, 139.6503° E")
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Generates an offline-safe Geo URI (supported on iOS & Android native apps)
 */
export function buildGeoUri(lat: number, lng: number, label?: string): string {
  const cleanLabel = encodeURIComponent(label || 'Saved Place');
  return `geo:${lat},${lng}?q=${lat},${lng}(${cleanLabel})`;
}

/**
 * Builds offline directions summary & cues
 */
export function buildOfflineDirectionsSteps(
  fromLabel: string,
  toLabel: string,
  distanceKm: number,
  bearing: { degrees: number; cardinal: string },
  customNotes?: string
): string[] {
  const steps: string[] = [];

  steps.push(`Start from ${fromLabel}.`);
  steps.push(`Head ${bearing.cardinal} (${bearing.degrees}°) towards ${toLabel} (~${formatDistance(distanceKm)}).`);

  if (customNotes && customNotes.trim().length > 0) {
    const lines = customNotes.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (const line of lines) {
      steps.push(line.trim());
    }
  }

  steps.push(`Arrive at ${toLabel}.`);
  return steps;
}
