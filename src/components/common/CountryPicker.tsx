import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  searchCountries,
  findCountryByNameOrCode,
  type CountryData,
} from '../../data/countriesData';
import { Search, X, Check, Globe } from 'lucide-react';

export interface CountryPickerProps {
  value?: string;
  onChange: (country: CountryData) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  excludeCountries?: string[];
  label?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
  dropdownMaxHeight?: string;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
  value = '',
  onChange,
  placeholder = 'Search country (e.g. Japan, Switzerland, USA)...',
  disabled = false,
  autoFocus = false,
  excludeCountries = [],
  label,
  helperText,
  required = false,
  id = 'country-picker-input',
  dropdownMaxHeight = '240px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Touch scroll disambiguation for iPhone touchscreens
  const touchStartY = useRef<number>(0);
  const touchMoved = useRef<boolean>(false);

  // Synchronize internal query with external value when not actively searching
  const resolvedCountry = useMemo(() => {
    return findCountryByNameOrCode(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setQuery(resolvedCountry ? resolvedCountry.name : value);
    }
  }, [value, resolvedCountry, isOpen]);

  // Search results filtered by query
  const searchResults = useMemo(() => {
    const excludedSet = new Set(excludeCountries.map((c) => c.toLowerCase()));
    const results = searchCountries(query, 35);
    return results.filter((c) => !excludedSet.has(c.name.toLowerCase()) && !excludedSet.has(c.code.toLowerCase()));
  }, [query, excludeCountries]);

  // Outside click / tap listener to close dropdown cleanly on iOS and desktop
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query display to current selected value
        setQuery(resolvedCountry ? resolvedCountry.name : value);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen, resolvedCountry, value]);

  const handleSelectCountry = (country: CountryData) => {
    setQuery(country.name);
    setIsOpen(false);
    onChange(country);
    // Dismiss mobile keyboard on selection
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setHighlightedIndex(0);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      // Ensure input is visible within iOS viewport when on-screen keyboard shows
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < searchResults.length ? prev + 1 : 0));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : searchResults.length - 1));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[highlightedIndex]) {
        handleSelectCountry(searchResults[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setQuery(resolvedCountry ? resolvedCountry.name : value);
      inputRef.current?.blur();
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (listRef.current) {
      const items = listRef.current.children;
      if (items[index]) {
        (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        colorScheme: 'light',
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--secondary)',
            marginBottom: '6px',
          }}
        >
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
      )}

      {/* Input Field Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: 'var(--secondary)',
          }}
        >
          {resolvedCountry ? (
            <span style={{ fontSize: '1.15rem', lineHeight: 1 }} aria-hidden="true">
              {resolvedCountry.flag}
            </span>
          ) : (
            <Search size={16} strokeWidth={2.2} />
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          style={{
            width: '100%',
            height: '46px',
            paddingLeft: '38px',
            paddingRight: query ? '38px' : '12px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--primary)',
            backgroundColor: '#FFFFFF',
            border: isOpen ? '1.5px solid var(--primary)' : '1px solid var(--stroke)',
            borderRadius: '14px',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            boxShadow: isOpen ? '0 0 0 3px rgba(0, 0, 0, 0.04)' : 'none',
            touchAction: 'manipulation',
          }}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '9999px',
              border: 'none',
              background: 'var(--surface-neutral-2)',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Clear search"
          >
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {helperText && (
        <span
          style={{
            display: 'block',
            fontSize: '0.72rem',
            color: 'var(--secondary)',
            marginTop: '4px',
            lineHeight: 1.35,
          }}
        >
          {helperText}
        </span>
      )}

      {/* Search Results Dropdown List */}
      {isOpen && !disabled && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: dropdownMaxHeight,
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--stroke)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
            zIndex: 99999,
            padding: '4px',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {searchResults.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--secondary)',
                fontSize: '0.82rem',
              }}
            >
              <Globe size={18} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.5 }} />
              <span>No matching country found for "{query}"</span>
            </div>
          ) : (
            searchResults.map((country, index) => {
              const isSelected = resolvedCountry?.code === country.code;
              const isHighlighted = highlightedIndex === index;

              return (
                <div
                  key={country.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (!touchMoved.current) {
                      handleSelectCountry(country);
                    }
                  }}
                  onTouchStart={(e) => {
                    touchStartY.current = e.touches[0].clientY;
                    touchMoved.current = false;
                  }}
                  onTouchMove={(e) => {
                    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);
                    if (diffY > 6) {
                      touchMoved.current = true;
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '44px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'var(--surface-neutral-2)'
                      : isHighlighted
                      ? 'var(--surface-neutral-1)'
                      : 'transparent',
                    transition: 'background-color 100ms ease',
                    touchAction: 'manipulation',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{country.flag}</span>
                    <div>
                      <div
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: isSelected ? 700 : 500,
                          color: 'var(--primary)',
                          lineHeight: 1.25,
                        }}
                      >
                        {country.name}
                      </div>
                      {country.aliases.length > 0 && query && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary)' }}>
                          {country.aliases.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--secondary)',
                        backgroundColor: 'var(--surface-neutral-2)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {country.code}
                    </span>
                    {isSelected && <Check size={16} color="var(--primary)" strokeWidth={2.4} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
