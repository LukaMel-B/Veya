import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

let activeScrollLocks = 0;
let savedBodyOverflow = '';
let savedBodyTouchAction = '';

export function acquireScrollLock() {
  if (typeof document === 'undefined') return;
  if (activeScrollLocks === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedBodyTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
  activeScrollLocks++;
}

export function releaseScrollLock() {
  if (typeof document === 'undefined') return;
  activeScrollLocks = Math.max(0, activeScrollLocks - 1);
  if (activeScrollLocks === 0) {
    document.body.style.overflow = savedBodyOverflow;
    document.body.style.touchAction = savedBodyTouchAction;
  }
}

export function useVisualViewport() {
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;
    const handleViewportChange = () => {
      setViewport({
        height: vv.height,
        top: vv.offsetTop,
      });
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  return viewport;
}

export interface ModalPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children, isOpen = true }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    acquireScrollLock();
    return () => {
      releaseScrollLock();
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="veya-modal-portal-root" style={{ colorScheme: 'light' }}>
      {children}
    </div>,
    document.body
  );
};
