import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { seedInitialDataIfEmpty } from '../db/seedData';
import { loadTourDemoData, clearTourDemoData } from '../db/tourDemoData';
import { db, initializeDatabaseSafely } from '../db/database';
import type { JournalEntry, UserProfile } from '../types';
import {
  getStoredUserProfile,
  saveStoredUserProfile,
  determineInitialOnboardingStatus,
  DEFAULT_USER_PROFILE,
  USER_PROFILE_STORAGE_KEY,
  ONBOARDING_COMPLETED_KEY,
  TOUR_COMPLETED_KEY,
} from '../utils/profileUtils';

export type MainNavTab = 'home' | 'trips' | 'collection' | 'journal' | 'settings' | 'map';
export type TripSubNavTab = 'overview' | 'companion' | 'saved' | 'itinerary' | 'budget' | 'bookings' | 'essentials' | 'journal' | 'documents' | 'share' | 'places';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmDialogOptions {
  title: string;
  message?: React.ReactNode;
  description?: React.ReactNode;
  kicker?: string;
  categoryKicker?: string;
  icon?: 'trash' | 'alert' | 'check' | 'info' | 'edit' | 'database' | 'help' | 'conflict' | 'share' | 'fileText' | 'refresh' | React.ReactNode;
  iconName?: string;
  variant?: 'destructive' | 'default' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  warning?: React.ReactNode;
  warningMessage?: React.ReactNode;
  detailBox?: React.ReactNode;
  detailCard?: React.ReactNode;
  showCloseButton?: boolean;
}

export interface AlertDialogOptions {
  title: string;
  message?: React.ReactNode;
  description?: React.ReactNode;
  kicker?: string;
  categoryKicker?: string;
  icon?: 'info' | 'check' | 'alert' | React.ReactNode;
  iconName?: string;
  buttonText?: string;
  detailBox?: React.ReactNode;
  detailCard?: React.ReactNode;
}

export type ActiveDialogState =
  | ({ type: 'confirm'; resolve: (val: boolean) => void } & ConfirmDialogOptions)
  | ({ type: 'alert'; resolve: () => void } & AlertDialogOptions);

interface AppContextType {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  activeTripId: string | null;
  setActiveTripId: (tripId: string | null) => void;
  activeJournalId: string | null;
  setActiveJournalId: (id: string | null) => void;
  activeCollectionItemId: string | null;
  setActiveCollectionItemId: (id: string | null) => void;
  tripSubTab: TripSubNavTab;
  setTripSubTab: (subTab: TripSubNavTab) => void;
  isQuickAddOpen: boolean;
  setIsQuickAddOpen: (open: boolean) => void;
  quickAddPreselectedTripId?: string;
  openQuickAdd: (tripId?: string) => void;
  isJournalModalOpen: boolean;
  setIsJournalModalOpen: (open: boolean) => void;
  journalModalData?: Partial<JournalEntry>;
  openJournalModal: (initialData?: Partial<JournalEntry>) => void;
  closeJournalModal: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isOnline: boolean;
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Dialog Component Library System
  activeDialog: ActiveDialogState | null;
  isDialogOpen: boolean;
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  showAlert: (options: AlertDialogOptions) => Promise<void>;
  closeActiveDialog: (confirmResult?: boolean) => void;
 
   // Profile & Onboarding & Tour
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  completeOnboarding: (profile: Partial<UserProfile>, startTourAfter?: boolean) => void;
  isTourActive: boolean;
  tourStep: number;
  setTourStep: (step: number) => void;
  startTour: () => void;
  endTour: (markedCompleted?: boolean) => void;
  isAppReady: boolean;
  dbError: string | null;
  setDbError: (err: string | null) => void;
  resetApplication: (mode: 'data_only' | 'preferences_only' | 'full_factory') => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [activeJournalId, setActiveJournalId] = useState<string | null>(null);
  const [activeCollectionItemId, setActiveCollectionItemId] = useState<string | null>(null);
  const [tripSubTab, setTripSubTab] = useState<TripSubNavTab>('overview');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddPreselectedTripId, setQuickAddPreselectedTripId] = useState<string | undefined>();
  const [isJournalModalOpen, setIsJournalModalOpen] = useState<boolean>(false);
  const [journalModalData, setJournalModalData] = useState<Partial<JournalEntry> | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Profile, Onboarding & Tour State
  const [userProfile, setUserProfile] = useState<UserProfile>(getStoredUserProfile);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('travelnest_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('travelnest_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Alert & Dialog Component Library System
  const [activeDialog, setActiveDialog] = useState<ActiveDialogState | null>(null);

  const closeActiveDialog = useCallback((confirmResult?: boolean) => {
    if (activeDialog) {
      if (activeDialog.type === 'confirm') {
        activeDialog.resolve(confirmResult ?? false);
      } else {
        activeDialog.resolve();
      }
      setActiveDialog(null);
    }
  }, [activeDialog]);

  const showConfirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setActiveDialog({
        type: 'confirm',
        ...options,
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback((options: AlertDialogOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      setActiveDialog({
        type: 'alert',
        ...options,
        resolve,
      });
    });
  }, []);

  // Online / Offline tracking & App Initialization
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('You are back online. Maps and assets ready.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: All core data is safely stored on your device.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let isMounted = true;

    // Initial Database & Onboarding check
    const initApp = async () => {
      try {
        const dbInit = await initializeDatabaseSafely();
        if (!dbInit.success) {
          if (isMounted) {
            setDbError(dbInit.error || 'Failed to open local database.');
            setIsAppReady(true);
          }
          return;
        }

        await seedInitialDataIfEmpty();
        await clearTourDemoData();
        const { shouldShowOnboarding } = await determineInitialOnboardingStatus();
        if (isMounted) {
          if (shouldShowOnboarding) {
            setIsOnboardingOpen(true);
          }
          setUserProfile(getStoredUserProfile());
          setIsAppReady(true);
        }
      } catch (err: any) {
        console.warn('Initial data seed check error:', err);
        if (isMounted) {
          setDbError(err?.message || 'Database initialisation encountered an unexpected error.');
          setIsAppReady(true);
        }
      }
    };

    initApp();

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openQuickAdd = (tripId?: string) => {
    setQuickAddPreselectedTripId(tripId || activeTripId || undefined);
    setIsQuickAddOpen(true);
  };

  const openJournalModal = (initialData?: Partial<JournalEntry>) => {
    setJournalModalData(initialData);
    setIsJournalModalOpen(true);
  };

  const closeJournalModal = () => {
    setIsJournalModalOpen(false);
    setJournalModalData(undefined);
  };

  // Profile management
  const updateUserProfile = (profile: Partial<UserProfile>) => {
    const updated = saveStoredUserProfile(profile);
    setUserProfile(updated);
    showToast('Preferences updated.', 'success');
  };

  const completeOnboarding = (profile: Partial<UserProfile>, startTourAfter: boolean = false) => {
    const updated = saveStoredUserProfile({
      ...profile,
      onboardingCompleted: true,
    });
    setUserProfile(updated);
    setIsOnboardingOpen(false);

    // Seed the user's dream country as the first and only initial Finds folder
    if (profile.dreamCountry && profile.dreamCountry.trim()) {
      db.saveCountry(profile.dreamCountry.trim()).catch((err) => {
        console.warn('Failed to seed dream country folder:', err);
      });
    }

    showToast(`Welcome to Veya, ${updated.displayName}!`, 'success');
    if (startTourAfter) {
      setTimeout(() => {
        startTour();
      }, 350);
    }
  };

  // Guided Tour
  const startTour = () => {
    setActiveTab('home');
    setActiveTripId(null);
    setActiveJournalId(null);
    setActiveCollectionItemId(null);
    setTourStep(0);
    loadTourDemoData().catch(console.warn);
    setIsTourActive(true);
  };

  const endTour = (markedCompleted: boolean = true) => {
    setIsTourActive(false);
    setTourStep(0);
    clearTourDemoData().catch(console.warn);
    if (markedCompleted) {
      const updated = saveStoredUserProfile({ tourCompleted: true });
      setUserProfile(updated);
      showToast('Tour completed! Demo data cleared. You are ready to explore.', 'success');
    }
  };

  // App Reset
  const resetApplication = async (mode: 'data_only' | 'preferences_only' | 'full_factory') => {
    try {
      if (mode === 'data_only') {
        await db.clearAll();
        await seedInitialDataIfEmpty();
        setActiveTripId(null);
        setActiveJournalId(null);
        setActiveCollectionItemId(null);
        setActiveTab('home');
        showToast('All travel data cleared. Profile and preferences preserved.', 'info');
      } else if (mode === 'preferences_only') {
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
        localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
        localStorage.removeItem(TOUR_COMPLETED_KEY);
        const resetProfile = { ...DEFAULT_USER_PROFILE };
        setUserProfile(resetProfile);
        setIsOnboardingOpen(true);
        showToast('Profile and onboarding preferences reset.', 'info');
      } else if (mode === 'full_factory') {
        await db.clearAll();
        localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
        localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
        localStorage.removeItem(TOUR_COMPLETED_KEY);
        localStorage.removeItem('travelnest_v5_migrated');
        await seedInitialDataIfEmpty();
        const resetProfile = { ...DEFAULT_USER_PROFILE };
        setUserProfile(resetProfile);
        setActiveTripId(null);
        setActiveJournalId(null);
        setActiveCollectionItemId(null);
        setActiveTab('home');
        setIsOnboardingOpen(true);
        showToast('Application restored to factory state.', 'info');
      }
    } catch (err: any) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeTripId,
        setActiveTripId,
        activeJournalId,
        setActiveJournalId,
        activeCollectionItemId,
        setActiveCollectionItemId,
        tripSubTab,
        setTripSubTab,
        isQuickAddOpen,
        setIsQuickAddOpen,
        quickAddPreselectedTripId,
        openQuickAdd,
        isJournalModalOpen,
        setIsJournalModalOpen,
        journalModalData,
        openJournalModal,
        closeJournalModal,
        theme,
        toggleTheme,
        isOnline,
        toasts,
        showToast,
        removeToast,
        searchQuery,
        setSearchQuery,
        userProfile,
        updateUserProfile,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding,
        isTourActive,
        tourStep,
        setTourStep,
        startTour,
        endTour,
        isAppReady,
        dbError,
        setDbError,
        resetApplication,

        // Dialog Component Library System
        activeDialog,
        isDialogOpen: Boolean(activeDialog),
        showConfirm,
        showAlert,
        closeActiveDialog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useDialog = () => {
  const { showConfirm, showAlert, closeActiveDialog, isDialogOpen } = useApp();
  return { showConfirm, showAlert, closeActiveDialog, isDialogOpen };
};

export const useConfirm = () => {
  const { showConfirm } = useApp();
  return showConfirm;
};

