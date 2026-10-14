export interface SavedCategory {
  id: string;
  label: string;
  icon: string;
}

export const DEFAULT_SAVED_CATEGORIES: SavedCategory[] = [
  { id: 'all', label: 'All Items', icon: '✨' },
  { id: 'food', label: 'Food & Cafes', icon: '🍽️' },
  { id: 'place', label: 'Places & Sights', icon: '📍' },
  { id: 'stay', label: 'Stays & Hotels', icon: '🏨' },
  { id: 'activity', label: 'Activities & Fun', icon: '🎟️' },
  { id: 'shopping', label: 'Shopping & Markets', icon: '🛍️' },
  { id: 'transport', label: 'Transport & Passes', icon: '🚆' },
  { id: 'tips', label: 'Tips & Notes', icon: '📝' },
];

const COUNTRY_FLAGS: Record<string, string> = {
  japan: '🇯🇵',
  switzerland: '🇨🇭',
  iceland: '🇮🇸',
  portugal: '🇵🇹',
  italy: '🇮🇹',
  france: '🇫🇷',
  india: '🇮🇳',
  thailand: '🇹🇭',
  spain: '🇪🇸',
  germany: '🇩🇪',
  usa: '🇺🇸',
  'united states': '🇺🇸',
  uk: '🇬🇧',
  'united kingdom': '🇬🇧',
  greece: '🇬🇷',
  norway: '🇳🇴',
  indonesia: '🇮🇩',
  vietnam: '🇻🇳',
  australia: '🇦🇺',
  canada: '🇨🇦',
  mexico: '🇲🇽',
  turkey: '🇹🇷',
  singapore: '🇸🇬',
  malaysia: '🇲🇾',
  austria: '🇦🇹',
  netherlands: '🇳🇱',
  peru: '🇵🇪',
  egypt: '🇪🇬',
  morocco: '🇲🇦',
  kazakhstan: '🇰🇿',
  general: '🌍',
};

const COUNTRY_COVERS: Record<string, string> = {
  japan: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
  switzerland: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80',
  kazakhstan: 'https://images.unsplash.com/photo-1558588942-930faae5a389?auto=format&fit=crop&w=600&q=80',
  iceland: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=600&q=80',
  portugal: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=600&q=80',
  italy: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80',
  france: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
  india: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
  thailand: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=600&q=80',
  spain: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=600&q=80',
  general: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80',
};

export function getCountryFlag(_country?: string): string {
  return '';
}

export function getCountryCover(country?: string): string {
  if (!country || typeof country !== 'string') return COUNTRY_COVERS.general;
  const clean = country.trim().toLowerCase();
  return COUNTRY_COVERS[clean] || COUNTRY_COVERS.general;
}

/**
 * Detects country name from destination string (e.g. "Tokyo & Kyoto, Japan" -> "Japan")
 */
export function detectCountry(destinationOrName?: string): string {
  if (!destinationOrName || typeof destinationOrName !== 'string') return 'General';
  const trimmed = destinationOrName.trim();
  if (!trimmed) return 'General';

  // Check known country keys
  for (const countryKey of Object.keys(COUNTRY_FLAGS)) {
    if (countryKey === 'general' || countryKey === 'usa' || countryKey === 'uk') continue;
    const regex = new RegExp(`\\b${countryKey}\\b`, 'i');
    if (regex.test(trimmed)) {
      return countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
    }
  }

  // If comma separated, check last token (e.g. "Reykjavik, Iceland" -> "Iceland")
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',');
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart.length > 1) {
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
    }
  }

  return trimmed;
}

export function getCategoryBadge(categoryId?: string, customCategories?: SavedCategory[]): { label: string; icon: string } {
  if (!categoryId || typeof categoryId !== 'string') {
    return { label: 'Place', icon: '📍' };
  }
  const clean = categoryId.trim().toLowerCase();
  const all = [...DEFAULT_SAVED_CATEGORIES, ...(customCategories || [])];
  const found = all.find((c) => c.id && c.id.toLowerCase() === clean);
  if (found) return { label: found.label, icon: found.icon };

  // Default fallback for custom category
  return {
    label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
    icon: '🏷️',
  };
}

/**
 * Normalizes any category string to lowercase standard or custom key, defaulting to 'place'
 */
export function normalizeCategory(categoryId?: string): string {
  if (!categoryId || typeof categoryId !== 'string') return 'place';
  const clean = categoryId.trim().toLowerCase();
  return clean || 'place';
}

/**
 * Resolves the effective country for a collection item:
 * 1. Checks direct item.country (if non-empty and not 'General')
 * 2. If missing or 'General' and item.tripId exists, looks up trip's country or destination
 * 3. Falls back to item.country || 'General'
 */
export function getItemEffectiveCountry(
  item: { country?: string; tripId?: string },
  tripsMap?: Map<string, { country?: string; destination?: string }>
): string {
  const direct = item.country && typeof item.country === 'string' ? item.country.trim() : '';
  if (direct && direct.toLowerCase() !== 'general') {
    return direct;
  }
  if (item.tripId && tripsMap && tripsMap.has(item.tripId)) {
    const trip = tripsMap.get(item.tripId)!;
    const tripCountry = trip.country || detectCountry(trip.destination);
    if (tripCountry && tripCountry.toLowerCase() !== 'general') {
      return tripCountry;
    }
  }
  return direct || 'General';
}

