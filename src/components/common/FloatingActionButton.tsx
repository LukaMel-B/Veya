import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingActionButtonProps {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  className = '',
  style = {},
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const target = typeof document !== 'undefined' ? document.getElementById('fab-root') : null;

  if (!mounted || !target) return null;

  return createPortal(
    <button
      id="fab-quick-add"
      data-tour-target="fab-quick-add"
      onClick={onClick}
      className={`cupertino-fab ${className}`}
      aria-label={label}
      title={label}
      style={style}
    >
      {icon}
    </button>,
    target
  );
};
