import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-11/12 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-money-pos shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-money-neg shrink-0" />,
    info: <Info className="w-5 h-5 text-accent shrink-0" />,
  };

  const borders = {
    success: 'border-money-pos/30 bg-bg-card/95',
    error: 'border-money-neg/30 bg-bg-card/95',
    info: 'border-accent/30 bg-bg-card/95',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border ${borders[toast.type]} shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        {icons[toast.type]}
        <p className="text-sm font-medium text-text-main truncate">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted hover:text-text-main p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
