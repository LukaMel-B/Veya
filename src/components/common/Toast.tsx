import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <CheckCircle2 size={16} strokeWidth={2.2} color="#ffffff" />}
          {t.type === 'error' && <AlertCircle size={16} strokeWidth={2.2} color="#ffdad6" />}
          {t.type === 'info' && <Info size={16} strokeWidth={2.2} color="#ffffff" />}
          <span style={{ flex: 1, fontWeight: 500, fontSize: '0.82rem', letterSpacing: '-0.01em' }}>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Dismiss toast"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
};
