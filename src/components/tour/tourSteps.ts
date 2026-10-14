import type { MainNavTab } from '../../context/AppContext';

export interface TourStep {
  id: string;
  tab: MainNavTab;
  targetId: string;
  badge: string;
  title: string;
  description: string;
  helperCue?: string;
  interactive?: boolean;
  placementPreference?: 'top' | 'bottom' | 'auto';
}

export const SPOTLIGHT_TOUR_STEPS: TourStep[] = [
  {
    id: 'workspace-home',
    tab: 'home',
    targetId: 'nav-home',
    badge: 'HOME WORKSPACE',
    title: 'Your Travel Workspace',
    description:
      'This is your daily command center. When you have an active journey, your departure countdown, packing readiness, and budget spending will appear right here at a glance.',
    helperCue: 'Everything in Veya is saved locally on your phone and works 100% offline.',
    placementPreference: 'top',
  },
  {
    id: 'trips-hub',
    tab: 'trips',
    targetId: 'nav-trips',
    badge: 'JOURNEYS',
    title: 'My Trips Hub',
    description:
      'This is where all your journeys live. Each trip gets its own dedicated workspace for day-by-day itineraries, flight & hotel bookings, category budgets, packing checklists, and vault documents.',
    helperCue: 'Filter easily between upcoming, planning, and completed journeys.',
    placementPreference: 'top',
  },
  {
    id: 'create-trip',
    tab: 'trips',
    targetId: 'btn-create-trip',
    badge: 'START PLANNING',
    title: 'Create a New Journey',
    description:
      'Whenever inspiration strikes, tap New Trip to name your journey, choose a destination country, and set your dates. You can plan vacations months in advance or log spontaneous getaways.',
    helperCue: 'Inside every trip, Veya unlocks day-by-day timelines, reservations, and split expenses.',
    interactive: true,
    placementPreference: 'bottom',
  },
  {
    id: 'saved-collections',
    tab: 'collection',
    targetId: 'nav-collection',
    badge: 'IDEAS & DOSSIERS',
    title: 'Country Collections & Ideas',
    description:
      'Found a restaurant reel on Instagram or a scenic lookout in a blog? Save it to your country collection (like Japan or Kazakhstan) even before you have fixed dates. You can assign it to a trip later.',
    helperCue: 'Curation stays organized by country folders with custom tags.',
    placementPreference: 'top',
  },
  {
    id: 'travel-journal',
    tab: 'journal',
    targetId: 'nav-journal',
    badge: 'TRAVEL MEMORIES',
    title: 'Independent Memory Journal',
    description:
      'Archive your personal travel impressions, stories, and photos. You can record memories from years ago or everyday reflections, completely independent of any planned trip.',
    helperCue: 'Memories can be linked to an active trip or kept standalone.',
    placementPreference: 'top',
  },
  {
    id: 'quick-capture',
    tab: 'home',
    targetId: 'fab-quick-add',
    badge: 'QUICK CAPTURE',
    title: 'Instant Quick Capture (+)',
    description:
      'Always within thumb\'s reach anywhere in the app. Tap this (+) button anytime to quickly log a saved spot, web link, trip expense, or spontaneous memory in seconds.',
    helperCue: 'One tap opens quick input without interrupting what you\'re doing.',
    interactive: true,
    placementPreference: 'top',
  },
  {
    id: 'settings-vault',
    tab: 'settings',
    targetId: 'nav-settings',
    badge: 'PRIVACY & BACKUPS',
    title: 'Settings & Offline Privacy',
    description:
      'Everything stays 100% on this device—no remote servers, no cloud accounts, and zero tracking. Export full JSON backup archives anytime, customize your currency, or replay this tour whenever you want.',
    helperCue: 'You can replay this tour anytime from "Application Tour" in Settings.',
    placementPreference: 'top',
  },
];

/**
 * Safely locates a DOM element by id, data-tour-target attribute, or selector.
 */
export function findTourTargetElement(targetId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  // 1. Direct ID match
  const byId = document.getElementById(targetId);
  if (byId && isElementVisible(byId)) return byId;

  // 2. data-tour-target attribute match
  const byDataAttr = document.querySelector<HTMLElement>(`[data-tour-target="${targetId}"]`);
  if (byDataAttr && isElementVisible(byDataAttr)) return byDataAttr;

  // 3. CSS query selector fallback
  try {
    const byQuery = document.querySelector<HTMLElement>(targetId);
    if (byQuery && isElementVisible(byQuery)) return byQuery;
  } catch {
    // Ignore invalid selector syntax
  }

  return null;
}

function isElementVisible(el: HTMLElement): boolean {
  if (typeof el.getBoundingClientRect !== 'function') return true;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
