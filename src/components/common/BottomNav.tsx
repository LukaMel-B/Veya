import React from 'react';
import { useApp, type MainNavTab } from '../../context/AppContext';
import {
  Compass,
  Luggage,
  Bookmark,
  BookOpen,
  Settings,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeTripId,
    setActiveTripId,
    activeJournalId,
    setActiveJournalId,
    activeCollectionItemId,
    setActiveCollectionItemId,
  } = useApp();

  const navItems: { id: MainNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Compass size={20} strokeWidth={1.8} /> },
    { id: 'trips', label: 'My Trips', icon: <Luggage size={20} strokeWidth={1.8} /> },
    { id: 'collection', label: 'Collection', icon: <Bookmark size={20} strokeWidth={1.8} /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen size={20} strokeWidth={1.8} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} strokeWidth={1.8} /> },
  ];

  const handleTabClick = (tabId: MainNavTab) => {
    setActiveTab(tabId);
    if (activeJournalId) {
      setActiveJournalId(null);
    }
    if (activeCollectionItemId) {
      setActiveCollectionItemId(null);
    }
    if (tabId !== 'trips' && activeTripId) {
      setActiveTripId(null);
    }
  };

  return (
    <nav className="cupertino-tab-bar" aria-label="Monochrome Voyage Navigation">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            data-tour-target={`nav-${item.id}`}
            onClick={() => handleTabClick(item.id)}
            className={`cupertino-tab-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'var(--surface-neutral-2)' : 'transparent',
                transition: 'all 130ms ease',
              }}
            >
              {item.icon}
            </div>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.01em' }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
