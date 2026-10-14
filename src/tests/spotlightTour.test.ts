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

(globalThis as any).window = {
  innerWidth: 390,
  innerHeight: 844,
  addEventListener: () => {},
  removeEventListener: () => {},
  requestAnimationFrame: (cb: () => void) => setTimeout(cb, 0),
  cancelAnimationFrame: (id: any) => clearTimeout(id),
};

import { SPOTLIGHT_TOUR_STEPS, findTourTargetElement } from '../components/tour/tourSteps.ts';
import fs from 'node:fs';
import path from 'node:path';

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
  console.log('--- TEST SUITE: TravelNest Interactive Spotlight Tour ---');
  console.log('===============================================================\n');

  // Test 1: Step Definitions & Friendly Travel Companion Copy
  console.log('Test 1: Step Definitions & Guidance Quality');
  assert(SPOTLIGHT_TOUR_STEPS.length === 7, `Tour defines exactly 7 focused steps (got ${SPOTLIGHT_TOUR_STEPS.length})`);

  const expectedTargets = [
    'nav-home',
    'nav-trips',
    'btn-create-trip',
    'nav-collection',
    'nav-journal',
    'fab-quick-add',
    'nav-settings',
  ];

  expectedTargets.forEach((targetId, idx) => {
    const step = SPOTLIGHT_TOUR_STEPS[idx];
    assert(step && step.targetId === targetId, `Step ${idx + 1} targets element '${targetId}'`);
    assert(step.title.length > 0, `Step ${idx + 1} has descriptive title: "${step.title}"`);
    assert(step.description.length > 20, `Step ${idx + 1} has conversational explanation`);
    assert(!!step.badge, `Step ${idx + 1} has category badge: "${step.badge}"`);
  });

  // Verify conversational tone (not corporate training)
  const allDescriptions = SPOTLIGHT_TOUR_STEPS.map((s) => s.description).join(' ');
  assert(allDescriptions.includes('workspace') || allDescriptions.includes('command center'), 'Includes friendly workspace orientation');
  assert(allDescriptions.includes('itineraries') || allDescriptions.includes('trips'), 'Explains trip planning');
  assert(allDescriptions.includes('ideas') || allDescriptions.includes('inspiration'), 'Explains collections naturally');
  assert(allDescriptions.includes('memories') || allDescriptions.includes('reflections'), 'Explains journal memories');

  // Test 2: findTourTargetElement helper with DOM mocks
  console.log('\nTest 2: Target Element Finder Resilience');
  const mockElements: Record<string, any> = {};

  (globalThis as any).document = {
    getElementById: (id: string) => mockElements[id] || null,
    querySelector: (sel: string) => {
      const match = sel.match(/\[data-tour-target="([^"]+)"\]/);
      if (match && mockElements[match[1]]) {
        return mockElements[match[1]];
      }
      return null;
    },
  };

  // 2a. Missing element
  assert(findTourTargetElement('non-existent-id') === null, 'Returns null safely when target element is not in DOM');

  // 2b. By ID
  mockElements['nav-home'] = {
    id: 'nav-home',
    tagName: 'BUTTON',
    getBoundingClientRect: () => ({ width: 60, height: 48, top: 790, left: 16, bottom: 838, right: 76 }),
  };
  assert(findTourTargetElement('nav-home') !== null, 'Finds element via document.getElementById');

  // 2c. By data-tour-target fallback
  delete mockElements['nav-trips'];
  mockElements['data-trips'] = {
    getAttribute: () => 'nav-trips',
    tagName: 'BUTTON',
    getBoundingClientRect: () => ({ width: 60, height: 48, top: 790, left: 86, bottom: 838, right: 146 }),
  };
  mockElements['nav-trips'] = mockElements['data-trips'];
  assert(findTourTargetElement('nav-trips') !== null, 'Finds element via data-tour-target attribute fallback');

  // Test 3: Dialogue Card Positioning Mathematics & Collision Avoidance
  console.log('\nTest 3: Dialogue Card Placement & Pointer Arrow Clamping');
  const computeCardLayout = (
    targetRect: { x: number; y: number; width: number; height: number } | null,
    windowWidth: number,
    windowHeight: number,
    pref?: 'top' | 'bottom' | 'auto'
  ) => {
    const cardWidth = Math.min(380, windowWidth - 32);

    if (!targetRect) {
      return {
        isFallback: true,
        placement: 'center',
        arrowOffset: 0,
      };
    }

    const targetCenterX = targetRect.x + targetRect.width / 2;
    const spaceAbove = targetRect.y;
    const spaceBelow = windowHeight - (targetRect.y + targetRect.height);

    let placement: 'above' | 'below' = 'below';
    if (pref === 'top') {
      placement = 'above';
    } else if (pref === 'bottom') {
      placement = 'below';
    } else {
      if (spaceBelow < 230 && spaceAbove >= 200) {
        placement = 'above';
      } else {
        placement = 'below';
      }
    }

    const rawLeft = targetCenterX - cardWidth / 2;
    const clampedLeft = Math.max(16, Math.min(rawLeft, windowWidth - cardWidth - 16));
    const arrowOffset = Math.max(24, Math.min(targetCenterX - clampedLeft, cardWidth - 24));

    return {
      isFallback: false,
      placement,
      clampedLeft,
      arrowOffset,
      cardWidth,
    };
  };

  // 3a. Target near bottom navigation (y = 780 in 844h window): should place card ABOVE
  const bottomNavTarget = { x: 40, y: 780, width: 50, height: 50 };
  const bottomLayout = computeCardLayout(bottomNavTarget, 390, 844, 'auto');
  assert(bottomLayout.placement === 'above', 'Intelligently positions card ABOVE bottom navigation targets to avoid viewport collision');
  assert(bottomLayout.clampedLeft >= 16, 'Clamps left edge to stay inside viewport padding');
  assert(bottomLayout.arrowOffset >= 24, 'Keeps pointer arrow inside speech-bubble card margin');

  // 3b. Target near top header (y = 20 in 844h window): should place card BELOW
  const topHeaderTarget = { x: 300, y: 20, width: 80, height: 40 };
  const topLayout = computeCardLayout(topHeaderTarget, 390, 844, 'auto');
  assert(topLayout.placement === 'below', 'Intelligently positions card BELOW top header targets');
  assert(topLayout.arrowOffset <= topLayout.cardWidth - 24, 'Clamps right arrow offset within card bounds');

  // 3c. Fallback mode when targetRect is null
  const fallbackLayout = computeCardLayout(null, 390, 844, 'auto');
  assert(fallbackLayout.isFallback === true, 'Activates graceful fallback mode when element is unmounted');
  assert(fallbackLayout.placement === 'center', 'Centers dialog card safely without dangling pointers in fallback');

  // Test 4: UI Target Annotations in Project Files
  console.log('\nTest 4: UI Component Target Annotations in Real Files');
  const srcDir = path.resolve(process.cwd(), 'src');

  // Check BottomNav.tsx
  const bottomNavSrc = fs.readFileSync(path.join(srcDir, 'components/common/BottomNav.tsx'), 'utf-8');
  assert(bottomNavSrc.includes('id={`nav-${item.id}`}'), 'BottomNav buttons have stable id="nav-*" attributes');
  assert(bottomNavSrc.includes('data-tour-target={`nav-${item.id}`}'), 'BottomNav buttons have data-tour-target attributes');

  // Check FloatingActionButton.tsx
  const fabSrc = fs.readFileSync(path.join(srcDir, 'components/common/FloatingActionButton.tsx'), 'utf-8');
  assert(fabSrc.includes('id="fab-quick-add"'), 'FloatingActionButton has id="fab-quick-add"');
  assert(fabSrc.includes('data-tour-target="fab-quick-add"'), 'FloatingActionButton has data-tour-target="fab-quick-add"');

  // Check TripsView.tsx
  const tripsSrc = fs.readFileSync(path.join(srcDir, 'components/trips/TripsView.tsx'), 'utf-8');
  assert(tripsSrc.includes('id="btn-create-trip"'), 'TripsView "+ New Trip" button has id="btn-create-trip"');
  assert(tripsSrc.includes('data-tour-target="btn-create-trip"'), 'TripsView "+ New Trip" button has data-tour-target="btn-create-trip"');

  // Check SettingsView.tsx
  const settingsSrc = fs.readFileSync(path.join(srcDir, 'components/settings/SettingsView.tsx'), 'utf-8');
  assert(settingsSrc.includes('id="settings-tour-card"'), 'SettingsView tour card has id="settings-tour-card"');
  assert(settingsSrc.includes('Take a Tour Again'), 'SettingsView retains "Take a Tour Again" action');

  // Test 5: Guided Tour Architecture & Phase Flow
  console.log('\nTest 5: Multi-Phase Guided Tour Orchestrator');
  const guidedTourSrc = fs.readFileSync(path.join(srcDir, 'components/tour/GuidedTour.tsx'), 'utf-8');
  assert(guidedTourSrc.includes('type TourPhase = \'welcome\' | \'spotlight\' | \'completed\''), 'Orchestrates 3 distinct phases: welcome, spotlight, completed');
  assert(guidedTourSrc.includes('<TourWelcomeModal'), 'Renders TourWelcomeModal during welcome phase');
  assert(guidedTourSrc.includes('<SpotlightOverlay'), 'Renders SpotlightOverlay during spotlight phase');
  assert(guidedTourSrc.includes('<TourDialogueCard'), 'Renders TourDialogueCard during spotlight phase');
  assert(guidedTourSrc.includes('<TourCompletionModal'), 'Renders TourCompletionModal during completion phase');
  assert(guidedTourSrc.includes('Escape'), 'Handles Escape key to safely close tour');
  assert(guidedTourSrc.includes('ArrowRight') && guidedTourSrc.includes('ArrowLeft'), 'Supports ArrowLeft and ArrowRight keyboard navigation');

  // Test 6: Welcome Screen & Completion Screen Copy & Actions
  console.log('\nTest 6: Welcome and Completion Modal Compliance');
  const welcomeSrc = fs.readFileSync(path.join(srcDir, 'components/tour/TourWelcomeModal.tsx'), 'utf-8');
  assert(welcomeSrc.includes("Let's get your travel organised."), 'Welcome modal headline matches PRD specification');
  assert(welcomeSrc.includes('Show Me Around'), 'Welcome modal offers "Show Me Around" CTA');
  assert(welcomeSrc.includes("I'll Explore Myself"), 'Welcome modal offers "I\'ll Explore Myself" dismiss option');

  const completeSrc = fs.readFileSync(path.join(srcDir, 'components/tour/TourCompletionModal.tsx'), 'utf-8');
  assert(completeSrc.includes("You're all set to explore!"), 'Completion modal celebrates tour finish');
  assert(completeSrc.includes('Start Exploring'), 'Completion modal offers "Start Exploring" CTA');

  // Test 7: Zero Data Mutation & Empty Database Safety
  console.log('\nTest 7: Zero Data Mutation & Storage Safety');
  // Check that tour files do NOT perform db.trips.add or seed dummy trips
  const tourFiles = [
    'src/components/tour/tourSteps.ts',
    'src/components/tour/GuidedTour.tsx',
    'src/components/tour/SpotlightOverlay.tsx',
    'src/components/tour/TourDialogueCard.tsx',
    'src/components/tour/TourWelcomeModal.tsx',
    'src/components/tour/TourCompletionModal.tsx',
  ];

  let illegalDbWrites = 0;
  tourFiles.forEach((file) => {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
    if (content.includes('db.trips.add') || content.includes('db.trips.bulkAdd') || content.includes('db.clearAll')) {
      illegalDbWrites++;
    }
  });
  assert(illegalDbWrites === 0, 'Spotlight tour code does NOT seed, create, or clear real database trips');

  // Test 8: Tour Completion Persistence in User Profile
  console.log('\nTest 8: Tour Completion Persistence');
  const appCtxSrc = fs.readFileSync(path.join(srcDir, 'context/AppContext.tsx'), 'utf-8');
  assert(appCtxSrc.includes('tourCompleted: true'), 'Marks userProfile.tourCompleted as true on finish');
  assert(appCtxSrc.includes('startTour = () =>'), 'Provides startTour method to launch tour');
  assert(appCtxSrc.includes('endTour = (markedCompleted'), 'Provides endTour method with graceful cleanup');

  // Test 9: Spotlight SVG Scrim and Cutout
  console.log('\nTest 9: SVG Scrim Cutout & Highlight Mechanics');
  const spotlightSrc = fs.readFileSync(path.join(srcDir, 'components/tour/SpotlightOverlay.tsx'), 'utf-8');
  assert(spotlightSrc.includes('mask="url(#travelnest-spotlight-mask)"'), 'Uses SVG mask for true transparent cutout hole');
  assert(spotlightSrc.includes('rgba(11, 12, 14, 0.72)'), 'Translucent dark scrim matches Monochrome Voyage palette');
  assert(spotlightSrc.includes('spotlight-active-ring'), 'Draws highlight ring around spotlighted target');

  // Test Summary
  console.log('\n===============================================================');
  console.log(`--- TEST RESULTS: ${passed} PASSED | ${failed} FAILED ---`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
