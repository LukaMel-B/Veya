import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BottomNav } from './components/common/BottomNav';
import { QuickAddModal } from './components/common/QuickAddModal';
import { Toast } from './components/common/Toast';
import { HomeView } from './components/home/HomeView';
import { TripsView } from './components/trips/TripsView';
import { TripDetailView } from './components/trips/TripDetailView';
import { CollectionView } from './components/collection/CollectionView';
import { CollectionItemDetailView } from './components/collection/CollectionItemDetailView';
import { JournalView } from './components/journal/JournalView';
import { JournalDetailView } from './components/journal/JournalDetailView';
import { JournalEntryModal } from './components/journal/JournalEntryModal';
import { SettingsView } from './components/settings/SettingsView';

import { SplashScreen } from './components/onboarding/SplashScreen';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { GuidedTour } from './components/tour/GuidedTour';
import { GlobalDialog } from './components/common/GlobalDialog';

const AndroidNativeBridge: React.FC = () => {
  const {
    isDialogOpen,
    closeActiveDialog,
    activeJournalId,
    setActiveJournalId,
    activeCollectionItemId,
    setActiveCollectionItemId,
    activeTripId,
    setActiveTripId,
    isJournalModalOpen,
    closeJournalModal,
    isQuickAddOpen,
    setIsQuickAddOpen,
    isTourActive,
    endTour,
    activeTab,
    setActiveTab,
  } = useApp();

  // Configure Android Status Bar
  useEffect(() => {
    const initStatusBar = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      } catch {
        // Ignored on standard web
      }
    };
    initStatusBar();
  }, []);

  // Listen for Android Physical / Gesture Back Button
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const initBackButton = async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app');
        const listener = await CapApp.addListener('backButton', () => {
          if (isDialogOpen) {
            closeActiveDialog();
          } else if (isJournalModalOpen) {
            closeJournalModal();
          } else if (isQuickAddOpen) {
            setIsQuickAddOpen(false);
          } else if (isTourActive) {
            endTour(false);
          } else if (activeJournalId) {
            setActiveJournalId(null);
          } else if (activeCollectionItemId) {
            setActiveCollectionItemId(null);
          } else if (activeTripId) {
            setActiveTripId(null);
          } else if (activeTab !== 'home') {
            setActiveTab('home');
          } else {
            CapApp.exitApp();
          }
        });
        removeListener = () => listener.remove();
      } catch {
        // Ignored on standard web
      }
    };

    initBackButton();

    return () => {
      if (removeListener) removeListener();
    };
  }, [
    isDialogOpen,
    closeActiveDialog,
    activeJournalId,
    setActiveJournalId,
    activeCollectionItemId,
    setActiveCollectionItemId,
    activeTripId,
    setActiveTripId,
    isJournalModalOpen,
    closeJournalModal,
    isQuickAddOpen,
    setIsQuickAddOpen,
    isTourActive,
    endTour,
    activeTab,
    setActiveTab,
  ]);

  return null;
};

const MainContent: React.FC = () => {
  const {
    activeTab,
    activeTripId,
    activeJournalId,
    setActiveJournalId,
    activeCollectionItemId,
    setActiveCollectionItemId,
    dbError,
  } = useApp();

  if (activeJournalId) {
    return (
      <main className="travelnest-scroll-view" role="main">
        <JournalDetailView
          journalId={activeJournalId}
          onBack={() => setActiveJournalId(null)}
        />
      </main>
    );
  }

  if (activeCollectionItemId) {
    return (
      <main className="travelnest-scroll-view" role="main">
        <CollectionItemDetailView
          itemId={activeCollectionItemId}
          onBack={() => setActiveCollectionItemId(null)}
        />
      </main>
    );
  }

  return (
    <main className="travelnest-scroll-view" role="main">
      {dbError && (
        <div
          style={{
            margin: '12px 16px',
            padding: '12px 16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '14px',
            color: '#856404',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Database Access Notice</div>
            <div>
              Local database reported an issue: {dbError}. Your saved records have <strong>NOT</strong> been cleared. Restarting the application or restoring an export from Settings can resolve transient storage locks.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'home' && <HomeView />}

      {activeTab === 'trips' && (
        activeTripId ? <TripDetailView tripId={activeTripId} /> : <TripsView />
      )}

      {activeTab === 'collection' && <CollectionView />}

      {(activeTab === 'journal' || activeTab === 'map') && <JournalView />}

      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

const AppModals: React.FC = () => {
  const {
    isQuickAddOpen,
    isJournalModalOpen,
    closeJournalModal,
    journalModalData,
    isOnboardingOpen,
    isTourActive,
    isAppReady,
  } = useApp();

  return (
    <>
      <SplashScreen isReady={isAppReady} />
      {isOnboardingOpen && <OnboardingModal />}
      {isTourActive && <GuidedTour />}
      {isQuickAddOpen && <QuickAddModal />}
      {isJournalModalOpen && (
        <JournalEntryModal
          isOpen={isJournalModalOpen}
          onClose={closeJournalModal}
          initialData={journalModalData}
        />
      )}
      <GlobalDialog />
      <Toast />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="app-container iphone-frame">
        <div className="app-top-spacer ios-top-spacer" />
        <AndroidNativeBridge />
        <MainContent />
        <div id="fab-root" />
        <BottomNav />
        <AppModals />
      </div>
    </AppProvider>
  );
};

export default App;
