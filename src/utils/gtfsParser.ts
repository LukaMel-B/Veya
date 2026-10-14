import JSZip from 'jszip';
import type {
  ParsedTimetableFeed,
  TransitRoute,
  TransitStop,
  TransitScheduleEntry,
  TransportLeg,
  TransportMode,
} from '../types';

/**
 * Parses simple CSV content with quotes support.
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j].trim()] = values[j].trim();
      }
      rows.push(row);
    }
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Maps GTFS route_type code to internal TransportMode
 */
export function mapGtfsRouteTypeToMode(routeType: string | number): TransportMode {
  const code = typeof routeType === 'string' ? parseInt(routeType, 10) : routeType;
  switch (code) {
    case 0: // Tram, Streetcar, Light rail
      return 'tram';
    case 1: // Subway, Metro
      return 'subway';
    case 2: // Rail, Intercity train
      return 'train';
    case 3: // Bus
      return 'bus';
    case 4: // Ferry
      return 'ferry';
    case 7: // Air / Extended
    case 1100: // Air
      return 'flight';
    default:
      return 'bus';
  }
}

/**
 * Client-side GTFS .zip parser using JSZip
 * Reads stops.txt, routes.txt, trips.txt, stop_times.txt, agency.txt
 */
export async function parseGtfsZip(zipBuffer: ArrayBuffer | File, feedName: string = 'Imported GTFS Feed'): Promise<ParsedTimetableFeed> {
  const zip = await JSZip.loadAsync(zipBuffer);

  // 1. Agency
  let agencyName = 'Transit Operator';
  const agencyFile = zip.file('agency.txt') || zip.file(/^.*\/agency\.txt$/)[0];
  if (agencyFile) {
    const text = await agencyFile.async('text');
    const rows = parseCsv(text);
    if (rows.length > 0 && (rows[0].agency_name || rows[0].agency_id)) {
      agencyName = rows[0].agency_name || rows[0].agency_id;
    }
  }

  // 2. Stops
  const stops: TransitStop[] = [];
  const stopsMap = new Map<string, TransitStop>();
  const stopsFile = zip.file('stops.txt') || zip.file(/^.*\/stops\.txt$/)[0];
  if (stopsFile) {
    const text = await stopsFile.async('text');
    const rows = parseCsv(text);
    for (const r of rows) {
      if (r.stop_id && r.stop_name) {
        const stop: TransitStop = {
          id: r.stop_id,
          name: r.stop_name,
          lat: r.stop_lat ? parseFloat(r.stop_lat) : undefined,
          lng: r.stop_lon ? parseFloat(r.stop_lon) : undefined,
          code: r.stop_code,
        };
        stops.push(stop);
        stopsMap.set(stop.id, stop);
      }
    }
  }

  // 3. Routes
  const routes: TransitRoute[] = [];
  const routesMap = new Map<string, TransitRoute>();
  const routesFile = zip.file('routes.txt') || zip.file(/^.*\/routes\.txt$/)[0];
  if (routesFile) {
    const text = await routesFile.async('text');
    const rows = parseCsv(text);
    for (const r of rows) {
      if (r.route_id) {
        const route: TransitRoute = {
          id: r.route_id,
          shortName: r.route_short_name || r.route_id,
          longName: r.route_long_name || r.route_short_name || 'Route ' + r.route_id,
          type: r.route_type || '2',
          color: r.route_color ? '#' + r.route_color : undefined,
          agencyName: agencyName,
        };
        routes.push(route);
        routesMap.set(route.id, route);
      }
    }
  }

  // 4. Trips
  const tripHeadsigns = new Map<string, { routeId: string; headsign?: string }>();
  const tripsFile = zip.file('trips.txt') || zip.file(/^.*\/trips\.txt$/)[0];
  if (tripsFile) {
    const text = await tripsFile.async('text');
    const rows = parseCsv(text);
    for (const r of rows) {
      if (r.trip_id && r.route_id) {
        tripHeadsigns.set(r.trip_id, {
          routeId: r.route_id,
          headsign: r.trip_headsign,
        });
      }
    }
  }

  // 5. Stop Times
  const entries: TransitScheduleEntry[] = [];
  const stopTimesFile = zip.file('stop_times.txt') || zip.file(/^.*\/stop_times\.txt$/)[0];
  if (stopTimesFile) {
    const text = await stopTimesFile.async('text');
    const rows = parseCsv(text);

    // Group stop_times by trip_id, sorted by stop_sequence
    const tripStops = new Map<string, Array<{ stopId: string; arrivalTime: string; departureTime: string; seq: number }>>();

    for (const r of rows) {
      if (r.trip_id && r.stop_id) {
        if (!tripStops.has(r.trip_id)) {
          tripStops.set(r.trip_id, []);
        }
        tripStops.get(r.trip_id)!.push({
          stopId: r.stop_id,
          arrivalTime: (r.arrival_time || '').slice(0, 5),
          departureTime: (r.departure_time || '').slice(0, 5),
          seq: parseInt(r.stop_sequence || '0', 10),
        });
      }
    }

    // Build schedule entries for each trip's consecutive or start-to-end stops
    for (const [tripId, stopList] of tripStops.entries()) {
      stopList.sort((a, b) => a.seq - b.seq);
      if (stopList.length < 2) continue;

      const tripInfo = tripHeadsigns.get(tripId);
      const firstStop = stopList[0];
      const lastStop = stopList[stopList.length - 1];

      const fromStop = stopsMap.get(firstStop.stopId);
      const toStop = stopsMap.get(lastStop.stopId);

      if (fromStop && toStop) {
        entries.push({
          tripId,
          routeId: tripInfo?.routeId || 'unknown',
          headsign: tripInfo?.headsign || toStop.name,
          departureTime: firstStop.departureTime,
          arrivalTime: lastStop.arrivalTime,
          fromStopId: firstStop.stopId,
          toStopId: lastStop.stopId,
          fromStopName: fromStop.name,
          toStopName: toStop.name,
        });
      }

      // Limit entries to 500 for snappy local rendering
      if (entries.length >= 500) break;
    }
  }

  return {
    feedName,
    importedAt: new Date().toISOString(),
    routes,
    stops,
    entries,
  };
}

/**
 * Parses a simplified JSON timetable feed format
 */
export function parseTimetableJson(jsonStr: string): ParsedTimetableFeed {
  const parsed = JSON.parse(jsonStr);
  if (!parsed.routes || !Array.isArray(parsed.routes)) {
    throw new Error('Invalid timetable format: missing "routes" array.');
  }

  return {
    feedName: parsed.feedName || 'Custom Timetable',
    importedAt: new Date().toISOString(),
    routes: parsed.routes || [],
    stops: parsed.stops || [],
    entries: parsed.entries || parsed.schedule || [],
  };
}

/**
 * Converts a selected transit schedule entry into a TransportLeg entity for a Trip
 */
export function convertTransitEntryToLeg(
  entry: TransitScheduleEntry,
  route: TransitRoute | undefined,
  tripId: string,
  options?: {
    dayNumber?: number;
    date?: string;
    orderIndex?: number;
    cost?: number;
    currency?: string;
  }
): TransportLeg {
  const mode = route ? mapGtfsRouteTypeToMode(route.type) : 'train';
  const carrier = route?.agencyName || 'Local Transit';
  const lineOrFlightNumber = route ? `${route.shortName} - ${route.longName}` : entry.headsign || 'Transit Line';

  return {
    id: `leg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    tripId,
    dayNumber: options?.dayNumber || 1,
    date: options?.date || new Date().toISOString().split('T')[0],
    mode,
    carrier,
    lineOrFlightNumber,
    departureLocation: entry.fromStopName,
    departureTime: entry.departureTime,
    arrivalLocation: entry.toStopName,
    arrivalTime: entry.arrivalTime,
    orderIndex: options?.orderIndex ?? 0,
    cost: options?.cost,
    currency: options?.currency,
    isEdited: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
