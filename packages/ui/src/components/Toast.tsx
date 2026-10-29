'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextType {
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = 'info', title, description, durationMs = 5000 }: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description, durationMs }]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <aside
        aria-label="Notifications"
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const Icon = isError ? AlertCircle : t.type === 'success' ? CheckCircle2 : Info;
          const iconColor = isError ? 'text-red-600' : t.type === 'success' ? 'text-emerald' : 'text-sea';

          return (
            <div
              key={t.id}
              role={isError ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-card border bg-white shadow-subtle text-navy select-none transition-all duration-200 animate-in fade-in slide-in-from-bottom-2',
                isError ? 'border-red-200' : 'border-line'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColor)} strokeWidth={1.5} aria-hidden="true" />
              <div className="flex-1 text-start pe-2">
                <div className="text-sm font-sans font-semibold text-navy leading-tight">{t.title}</div>
                {t.description && (
                  <div className="text-xs text-muted mt-1 leading-normal">{t.description}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className="text-muted hover:text-navy p-1 rounded min-w-[36px] min-h-[36px] flex items-center justify-center -me-1 -mt-1"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
