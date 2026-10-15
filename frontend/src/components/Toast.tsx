import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const value = {
    toast: addToast,
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-lg border shadow-xl backdrop-blur-md transition-all text-xs text-[#F3F5F8] ${
              t.type === 'error'
                ? 'bg-[#171C26]/95 border-[#FF3B4E]/50 text-red-100 shadow-red-950/20'
                : t.type === 'success'
                ? 'bg-[#171C26]/95 border-[#34D399]/50 text-emerald-100 shadow-emerald-950/20'
                : t.type === 'warning'
                ? 'bg-[#171C26]/95 border-[#FF8A4C]/50 text-amber-100 shadow-amber-950/20'
                : 'bg-[#171C26]/95 border-[#293140] text-slate-100 shadow-slate-950/20'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {t.type === 'error' && <AlertCircle size={15} className="text-[#FF3B4E]" />}
              {t.type === 'success' && <CheckCircle2 size={15} className="text-[#34D399]" />}
              {t.type === 'warning' && <AlertTriangle size={15} className="text-[#FF8A4C]" />}
              {t.type === 'info' && <Info size={15} className="text-[#60A5FA]" />}
            </div>
            <div className="flex-1 font-medium leading-relaxed">{t.message}</div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[#9BA5B5] hover:text-[#F3F5F8] p-0.5 rounded transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
