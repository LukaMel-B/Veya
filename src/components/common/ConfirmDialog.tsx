import React from 'react';
import { DialogFrame, type DialogVariant } from './DialogFrame';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Edit3, 
  Database, 
  HelpCircle,
  AlertOctagon,
  Calendar,
  Share2
} from 'lucide-react';

export type ConfirmDialogIconType = 
  | 'trash' 
  | 'alert' 
  | 'check' 
  | 'info' 
  | 'edit' 
  | 'database' 
  | 'help' 
  | 'conflict'
  | 'share'
  | React.ReactNode;

export interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  title: string;
  kicker?: string;
  message?: React.ReactNode;
  warning?: React.ReactNode;
  detailBox?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default' | 'warning' | 'info';
  icon?: ConfirmDialogIconType;
  isLoading?: boolean;
  showCloseButton?: boolean;
  thirdActionText?: string;
  onThirdAction?: () => void | Promise<void>;
  thirdActionVariant?: 'destructive' | 'default' | 'secondary';
  tertiaryText?: string;
  onTertiary?: () => void | Promise<void>;
  tertiaryVariant?: 'destructive' | 'default' | 'secondary';
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  kicker,
  message,
  warning,
  detailBox,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon,
  isLoading = false,
  showCloseButton = true,
  thirdActionText,
  onThirdAction,
  thirdActionVariant = 'destructive',
  tertiaryText,
  onTertiary,
  tertiaryVariant,
  children,
}) => {
  const effectiveThirdText = thirdActionText || tertiaryText;
  const effectiveOnThird = onThirdAction || onTertiary;
  const effectiveThirdVariant = thirdActionVariant || tertiaryVariant || 'destructive';
  // Map variant to DialogFrame variant & default kicker
  const resolvedVariant: DialogVariant = 
    variant === 'destructive' ? 'destructive' :
    variant === 'warning' ? 'warning' :
    variant === 'info' ? 'info' : 'neutral';

  const defaultKicker = 
    variant === 'destructive' ? 'IRREVERSIBLE' :
    variant === 'warning' ? 'WARNING' :
    variant === 'info' ? 'INFORMATIVE' : 'TWO-WAY DECISION';

  const resolvedKicker = kicker || defaultKicker;

  // Resolve icon
  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;

    switch (icon) {
      case 'trash':
        return <Trash2 size={20} strokeWidth={2} />;
      case 'alert':
        return <AlertTriangle size={20} strokeWidth={2} />;
      case 'check':
        return <CheckCircle2 size={20} strokeWidth={2} />;
      case 'info':
        return <Info size={20} strokeWidth={2} />;
      case 'edit':
        return <Edit3 size={20} strokeWidth={2} />;
      case 'database':
        return <Database size={20} strokeWidth={2} />;
      case 'conflict':
        return <Calendar size={20} strokeWidth={2} />;
      case 'share':
        return <Share2 size={20} strokeWidth={2} />;
      case 'help':
        return <HelpCircle size={20} strokeWidth={2} />;
      default:
        if (variant === 'destructive') return <Trash2 size={20} strokeWidth={2} />;
        if (variant === 'warning') return <AlertTriangle size={20} strokeWidth={2} />;
        if (variant === 'info') return <Info size={20} strokeWidth={2} />;
        return <AlertOctagon size={20} strokeWidth={2} />;
    }
  };

  const actionButtons = effectiveThirdText ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="btn-dialog-secondary"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="btn-dialog-primary"
        >
          {confirmText}
        </button>
      </div>
      <button
        type="button"
        onClick={effectiveOnThird}
        disabled={isLoading}
        className={effectiveThirdVariant === 'destructive' ? 'btn-dialog-destructive' : 'btn-dialog-secondary'}
      >
        {effectiveThirdText}
      </button>
    </div>
  ) : (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="btn-dialog-secondary"
      >
        {cancelText}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isLoading}
        className={variant === 'destructive' ? 'btn-dialog-destructive' : 'btn-dialog-primary'}
      >
        {isLoading ? 'Processing...' : confirmText}
      </button>
    </>
  );

  return (
    <DialogFrame
      isOpen={isOpen}
      onClose={onCancel}
      icon={renderIcon()}
      iconVariant={resolvedVariant}
      kicker={resolvedKicker}
      title={title}
      description={message}
      warning={warning}
      detailBox={detailBox}
      showCloseButton={showCloseButton}
      actions={actionButtons}
    >
      {children}
    </DialogFrame>
  );
};
