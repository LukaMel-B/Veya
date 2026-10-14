import React from 'react';
import { useApp } from '../../context/AppContext';
import { ConfirmDialog } from './ConfirmDialog';
import { DialogFrame } from './DialogFrame';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const GlobalDialog: React.FC = () => {
  const { activeDialog, closeActiveDialog } = useApp();

  if (!activeDialog) return null;

  if (activeDialog.type === 'alert') {
    const { title, message, description, kicker, categoryKicker, icon, iconName, buttonText = 'Got it', detailBox, detailCard, resolve } = activeDialog;

    const effIcon = icon || iconName;
    const renderIcon = () => {
      if (React.isValidElement(effIcon)) return effIcon;
      if (effIcon === 'check') return <CheckCircle2 size={20} strokeWidth={2} />;
      if (effIcon === 'alert') return <AlertTriangle size={20} strokeWidth={2} />;
      return <Info size={20} strokeWidth={2} />;
    };

    const handleDismiss = () => {
      closeActiveDialog();
      resolve();
    };

    return (
      <DialogFrame
        isOpen={true}
        onClose={handleDismiss}
        icon={renderIcon()}
        iconVariant={effIcon === 'check' ? 'success' : effIcon === 'alert' ? 'warning' : 'info'}
        kicker={kicker || categoryKicker || 'INFORMATIVE'}
        title={title}
        description={message || description}
        detailBox={detailBox || detailCard}
        actions={
          <button
            type="button"
            onClick={handleDismiss}
            className="btn-dialog-primary"
            style={{ width: '100%' }}
          >
            {buttonText}
          </button>
        }
      />
    );
  }

  // Confirm dialog type
  const {
    title,
    message,
    description,
    kicker,
    categoryKicker,
    icon,
    iconName,
    variant = 'default',
    confirmText,
    cancelText,
    warning,
    warningMessage,
    detailBox,
    detailCard,
    resolve,
  } = activeDialog;

  const handleConfirm = () => {
    closeActiveDialog();
    resolve(true);
  };

  const handleCancel = () => {
    closeActiveDialog();
    resolve(false);
  };

  return (
    <ConfirmDialog
      isOpen={true}
      title={title}
      kicker={kicker || categoryKicker}
      message={message || description}
      warning={warning || warningMessage}
      detailBox={detailBox || detailCard}
      variant={variant}
      icon={icon || iconName}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};
