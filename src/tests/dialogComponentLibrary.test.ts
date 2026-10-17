declare const process: any;

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

function getAllFiles(dirPath: string, extensions: string[]): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dirPath);
  list.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extensions));
    } else {
      if (extensions.some((ext) => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  });
  return results;
}

async function runTests() {
  console.log('--- TEST SUITE: Alert & Dialog Component Library (Monochrome Voyage v2.4) ---');

  const srcDir = path.resolve(process.cwd(), 'src');

  // TEST 1: Zero Native Alert/Confirm calls throughout src/
  console.log('\n[Section 1: Zero Native alert() / confirm() Invariant]');
  const allSrcFiles = getAllFiles(srcDir, ['.ts', '.tsx']);
  const forbiddenCallPattern = /\b(window\.)?(alert|confirm)\s*\(/;

  let nativeCallMatches: string[] = [];
  allSrcFiles.forEach((file) => {
    // Exclude this test file itself
    if (file.includes('dialogComponentLibrary.test.ts')) return;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Ignore comments
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;
      if (forbiddenCallPattern.test(line)) {
        nativeCallMatches.push(`${path.relative(process.cwd(), file)}:${idx + 1}: ${trimmed}`);
      }
    });
  });

  assert(
    nativeCallMatches.length === 0,
    `Zero native window.confirm() or alert() calls in src/ (Found ${nativeCallMatches.length})`
  );
  if (nativeCallMatches.length > 0) {
    console.error('Forbidden calls found:', nativeCallMatches);
  }

  // TEST 2: Core Dialog Component Files
  console.log('\n[Section 2: Master Component Anatomy & Files]');
  const dialogFramePath = path.resolve(srcDir, 'components/common/DialogFrame.tsx');
  assert(fs.existsSync(dialogFramePath), 'DialogFrame.tsx exists in components/common/');
  const dialogFrameContent = fs.readFileSync(dialogFramePath, 'utf8');
  assert(dialogFrameContent.includes('dialog-backdrop'), 'DialogFrame renders .dialog-backdrop scrim');
  assert(dialogFrameContent.includes('dialog-frame'), 'DialogFrame renders .dialog-frame container');
  assert(dialogFrameContent.includes('dialog-icon-pill'), 'DialogFrame supports .dialog-icon-pill');
  assert(dialogFrameContent.includes('dialog-kicker'), 'DialogFrame renders category kicker');
  assert(dialogFrameContent.includes('dialog-title'), 'DialogFrame renders dialog title');
  assert(dialogFrameContent.includes('dialog-body'), 'DialogFrame renders dialog body');
  assert(dialogFrameContent.includes('dialog-callout-warning'), 'DialogFrame supports warning callout slot');
  assert(dialogFrameContent.includes('dialog-callout-info'), 'DialogFrame supports detail card slot');
  assert(dialogFrameContent.includes('Escape'), 'DialogFrame handles keyboard Escape key dismissal');
  assert(dialogFrameContent.includes('createPortal'), 'DialogFrame uses createPortal to escape parent scroll containers');
  assert(dialogFrameContent.includes('useVisualViewport'), 'DialogFrame supports visualViewport dynamic keyboard and chrome adaptation');
  assert(dialogFrameContent.includes('acquireScrollLock'), 'DialogFrame locks background body scroll when opened');

  const confirmDialogPath = path.resolve(srcDir, 'components/common/ConfirmDialog.tsx');
  assert(fs.existsSync(confirmDialogPath), 'ConfirmDialog.tsx exists in components/common/');
  const confirmDialogContent = fs.readFileSync(confirmDialogPath, 'utf8');
  assert(confirmDialogContent.includes('DialogFrame'), 'ConfirmDialog reuses DialogFrame anatomy');
  assert(confirmDialogContent.includes('btn-dialog-primary'), 'ConfirmDialog renders .btn-dialog-primary');
  assert(confirmDialogContent.includes('btn-dialog-secondary'), 'ConfirmDialog renders .btn-dialog-secondary');
  assert(confirmDialogContent.includes('btn-dialog-destructive'), 'ConfirmDialog renders .btn-dialog-destructive');
  assert(confirmDialogContent.includes('tertiaryText'), 'ConfirmDialog supports 3rd action slot (e.g. Save & Close, Continue Editing, Discard Changes)');

  const globalDialogPath = path.resolve(srcDir, 'components/common/GlobalDialog.tsx');
  assert(fs.existsSync(globalDialogPath), 'GlobalDialog.tsx exists in components/common/');
  const globalDialogContent = fs.readFileSync(globalDialogPath, 'utf8');
  assert(globalDialogContent.includes('activeDialog'), 'GlobalDialog binds to activeDialog context');

  // TEST 3: Context & Bridge Architecture
  console.log('\n[Section 3: AppContext & Imperative Dialog Hooks]');
  const appContextPath = path.resolve(srcDir, 'context/AppContext.tsx');
  const appContextContent = fs.readFileSync(appContextPath, 'utf8');
  assert(appContextContent.includes('showConfirm:'), 'AppContext exports showConfirm imperative bridge');
  assert(appContextContent.includes('showAlert:'), 'AppContext exports showAlert imperative bridge');
  assert(appContextContent.includes('closeActiveDialog:'), 'AppContext exports closeActiveDialog controller');
  assert(appContextContent.includes('isDialogOpen:'), 'AppContext exports isDialogOpen state flag');
  assert(appContextContent.includes('export const useDialog ='), 'AppContext exports useDialog hook');
  assert(appContextContent.includes('export const useConfirm ='), 'AppContext exports useConfirm hook');

  // TEST 4: Android Native Back-Button Cascade
  console.log('\n[Section 4: Android Gesture / Hardware Back-Button Precedence]');
  const appTsxPath = path.resolve(srcDir, 'App.tsx');
  const appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
  assert(appTsxContent.includes('isDialogOpen'), 'App.tsx backButton listener inspects isDialogOpen');
  assert(appTsxContent.includes('closeActiveDialog()'), 'App.tsx backButton dismisses active dialog');
  assert(appTsxContent.includes('<GlobalDialog />'), 'App.tsx mounts <GlobalDialog /> in top-level AppModals');

  // Verify backButton hierarchy: isDialogOpen check comes before sheet closures or exit
  const backButtonBlock = appTsxContent.slice(appTsxContent.indexOf("addListener('backButton'"));
  const dialogIdx = backButtonBlock.indexOf('if (isDialogOpen)');
  const journalIdx = backButtonBlock.indexOf('isJournalModalOpen');
  const tourIdx = backButtonBlock.indexOf('isTourActive');
  const exitIdx = backButtonBlock.indexOf('CapApp.exitApp()');
  assert(dialogIdx > 0 && dialogIdx < journalIdx && dialogIdx < tourIdx && dialogIdx < exitIdx, 'isDialogOpen is prioritized first in backButton cascade');

  // TEST 5: CSS Design System Tokens
  console.log('\n[Section 5: CSS Design Tokens & Monochrome Voyage Styles]');
  const indexCssPath = path.resolve(srcDir, 'index.css');
  const indexCssContent = fs.readFileSync(indexCssPath, 'utf8');
  assert(indexCssContent.includes('.dialog-backdrop'), 'CSS defines .dialog-backdrop');
  assert(indexCssContent.includes('backdrop-filter: blur(4px)'), 'CSS uses blur(4px) on dialog backdrop');
  assert(indexCssContent.includes('.dialog-frame'), 'CSS defines .dialog-frame container');
  assert(indexCssContent.includes('border-radius: 24px'), 'CSS uses 24px (rounded-3xl) radius on dialog frame');
  assert(indexCssContent.includes('.dialog-icon-pill'), 'CSS defines .dialog-icon-pill (40px)');
  assert(indexCssContent.includes('.btn-dialog-destructive'), 'CSS defines .btn-dialog-destructive (#DC2626)');
  assert(!indexCssContent.includes('[data-theme="dark"] .dialog-frame'), 'CSS does NOT have dark theme overrides for dialog-frame (Veya light theme invariant)');
  assert(indexCssContent.includes('color-scheme: light'), 'CSS strictly enforces color-scheme: light on dialogs and overlays');
  assert(indexCssContent.includes('position: fixed'), 'CSS specifies position: fixed on dialog-backdrop and modal-overlay');
  assert(!indexCssContent.includes('transform: translateZ(0)'), 'CSS removes transform translateZ from scroll-views to prevent clipping fixed dialogs');

  // TEST 6: Views Destructive Actions Migration
  console.log('\n[Section 6: Destructive Action Handlers in Views]');
  const tripsViewContent = fs.readFileSync(path.resolve(srcDir, 'components/trips/TripsView.tsx'), 'utf8');
  assert(tripsViewContent.includes('showConfirm'), 'TripsView uses showConfirm for trip deletion');
  assert(tripsViewContent.includes("variant: 'destructive'"), 'TripsView sets variant: "destructive"');
  assert(tripsViewContent.includes("kicker: 'IRREVERSIBLE'") || tripsViewContent.includes("categoryKicker: 'IRREVERSIBLE'"), 'TripsView specifies IRREVERSIBLE kicker');

  const collectionViewContent = fs.readFileSync(path.resolve(srcDir, 'components/collection/CollectionView.tsx'), 'utf8');
  assert(collectionViewContent.includes('showConfirm'), 'CollectionView uses showConfirm for spot deletion');

  const collectionDetailContent = fs.readFileSync(path.resolve(srcDir, 'components/collection/CollectionItemDetailView.tsx'), 'utf8');
  assert(collectionDetailContent.includes('<ConfirmDialog'), 'CollectionItemDetailView uses <ConfirmDialog />');

  const journalDetailContent = fs.readFileSync(path.resolve(srcDir, 'components/journal/JournalDetailView.tsx'), 'utf8');
  assert(journalDetailContent.includes('<ConfirmDialog'), 'JournalDetailView uses <ConfirmDialog />');

  const itineraryViewContent = fs.readFileSync(path.resolve(srcDir, 'components/itinerary/ItineraryView.tsx'), 'utf8');
  assert(itineraryViewContent.includes('showConfirm'), 'ItineraryView uses showConfirm for event deletion');

  const bookingsViewContent = fs.readFileSync(path.resolve(srcDir, 'components/bookings/BookingsView.tsx'), 'utf8');
  assert(bookingsViewContent.includes('showConfirm'), 'BookingsView uses showConfirm for booking deletion');

  const budgetViewContent = fs.readFileSync(path.resolve(srcDir, 'components/budget/BudgetView.tsx'), 'utf8');
  assert(budgetViewContent.includes('showConfirm'), 'BudgetView uses showConfirm for expense deletion');

  const essentialsViewContent = fs.readFileSync(path.resolve(srcDir, 'components/essentials/EssentialsView.tsx'), 'utf8');
  assert(essentialsViewContent.includes('showConfirm'), 'EssentialsView uses showConfirm for packing deletion');

  const documentsViewContent = fs.readFileSync(path.resolve(srcDir, 'components/documents/DocumentsView.tsx'), 'utf8');
  assert(documentsViewContent.includes('showConfirm'), 'DocumentsView uses showConfirm for vault document deletion');

  // TEST 7: Discard Changes Guard Sheets
  console.log('\n[Section 7: Discard Changes Guard Sheets in Modals]');
  const editTripModalContent = fs.readFileSync(path.resolve(srcDir, 'components/trips/EditTripModal.tsx'), 'utf8');
  assert(editTripModalContent.includes('isDirty'), 'EditTripModal tracks isDirty input state');
  assert(editTripModalContent.includes('Discard Unsaved Trip Edits?'), 'EditTripModal prompts before discarding unsaved edits');
  assert(editTripModalContent.includes("categoryKicker: 'GUARD SHEET'"), 'EditTripModal uses GUARD SHEET kicker');

  const saveItemModalContent = fs.readFileSync(path.resolve(srcDir, 'components/collection/SaveItemModal.tsx'), 'utf8');
  assert(saveItemModalContent.includes('isDirty'), 'SaveItemModal tracks isDirty input state');
  assert(saveItemModalContent.includes('Discard Unsaved Spot'), 'SaveItemModal prompts before discarding unsaved edits');

  const journalEntryModalContent = fs.readFileSync(path.resolve(srcDir, 'components/journal/JournalEntryModal.tsx'), 'utf8');
  assert(journalEntryModalContent.includes('isDirty'), 'JournalEntryModal tracks isDirty input state');
  assert(journalEntryModalContent.includes('Discard Unsaved Journal'), 'JournalEntryModal prompts before discarding unsaved entries');

  // TEST 8: Sandbox Removal and Clean Settings Invariant
  console.log('\n[Section 8: Unwanted Modal Sandbox Clean Removal]');
  const settingsViewContent = fs.readFileSync(path.resolve(srcDir, 'components/settings/SettingsView.tsx'), 'utf8');
  assert(!settingsViewContent.includes('Interactive Modal Trigger Sandbox'), 'SettingsView does NOT include unwanted Sandbox');
  assert(!settingsViewContent.includes('handleSandboxStandardConfirm'), 'SettingsView does NOT have handleSandboxStandardConfirm');
  assert(!settingsViewContent.includes('handleSandboxDestructive'), 'SettingsView does NOT have handleSandboxDestructive');
  assert(!settingsViewContent.includes('handleSandboxForm'), 'SettingsView does NOT have handleSandboxForm');
  assert(!settingsViewContent.includes('handleSandboxConflict'), 'SettingsView does NOT have handleSandboxConflict');
  assert(!settingsViewContent.includes('handleSandboxProgress'), 'SettingsView does NOT have handleSandboxProgress');
  assert(settingsViewContent.includes('RemoveSampleDataModal'), 'SettingsView preserves RemoveSampleDataModal');
  assert(settingsViewContent.includes('AppResetModal'), 'SettingsView preserves AppResetModal');
  assert(settingsViewContent.includes('EditProfileModal'), 'SettingsView preserves EditProfileModal');

  console.log(`\n==================================================`);
  console.log(`DIALOG COMPONENT LIBRARY TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`==================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
