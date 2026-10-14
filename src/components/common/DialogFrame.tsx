import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export type DialogVariant = 'neutral' | 'destructive' | 'warning' | 'success' | 'info';

export interface DialogFrameProps {
  isOpen: boolean;
  onClose: () => void;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  icon?: React.ReactNode;
  iconVariant?: DialogVariant;
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  warning?: React.ReactNode;
  detailBox?: React.ReactNode;
  showCloseButton?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export const DialogFrame: React.FC<DialogFrameProps> = ({
  isOpen,
  onClose,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  icon,
  iconVariant = 'neutral',
  kicker,
  title,
  description,
  warning,
  detailBox,
  showCloseButton = true,
  children,
  actions,
}) => {
  // Listen for Escape key on PWA / Desktop
  useEffect(() => {
    if (!isOpen || !dismissOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissOnEscape, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={dismissOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="dialog-frame"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Slot: Icon Pill + Close Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          {icon ? (
            <div className={`dialog-icon-pill variant-${iconVariant}`}>
              {icon}
            </div>
          ) : <div />}

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Dismiss dialog"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--secondary)',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-neutral-2)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--secondary)';
              }}
            >
              <X size={18} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Kicker Category Label */}
        {kicker && (
          <div className="dialog-kicker">
            {kicker}
          </div>
        )}

        {/* Title Headline */}
        <h2 id="dialog-title" className="dialog-title">
          {title}
        </h2>

        {/* Supporting Copy */}
        {description && (
          <div className="dialog-body">
            {description}
          </div>
        )}

        {/* Optional Warning Callout */}
        {warning && (
          <div className="dialog-callout-warning">
            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{warning}</div>
          </div>
        )}

        {/* Optional Detail Box */}
        {detailBox && (
          <div className="dialog-callout-info">
            {detailBox}
          </div>
        )}

        {/* Custom Content Slot */}
        {children && (
          <div style={{ marginTop: '12px' }}>
            {children}
          </div>
        )}

        {/* Action Buttons Slot */}
        {actions && (
          <div className="dialog-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
