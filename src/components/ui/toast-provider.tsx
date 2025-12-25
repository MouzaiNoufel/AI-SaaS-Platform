'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Bell,
} from 'lucide-react';

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Icons
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

// Toast Colors
const toastColors = {
  success: {
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    border: 'border-green-500/20',
    icon: 'text-green-500',
    title: 'text-green-700 dark:text-green-400',
  },
  error: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    border: 'border-red-500/20',
    icon: 'text-red-500',
    title: 'text-red-700 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    border: 'border-amber-500/20',
    icon: 'text-amber-500',
    title: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    border: 'border-blue-500/20',
    icon: 'text-blue-500',
    title: 'text-blue-700 dark:text-blue-400',
  },
};

// Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = toastIcons[toast.type];
  const colors = toastColors[toast.type];

  React.useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(onRemove, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-lg shadow-lg max-w-md ${colors.bg} ${colors.border}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${colors.icon}`} />
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium ${colors.title}`}>{toast.title}</h4>
        {toast.message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      {/* Progress bar */}
      {toast.duration !== 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-1 rounded-b-xl ${colors.icon.replace('text-', 'bg-')}`}
        />
      )}
    </motion.div>
  );
}

// Toast Container
function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {context.toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => context.removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'success', title, message });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'error', title, message });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'warning', title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'info', title, message });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Standalone toast function for non-component use
let toastHandler: ToastContextType | null = null;

export function setToastHandler(handler: ToastContextType) {
  toastHandler = handler;
}

export const toast = {
  success: (title: string, message?: string) => toastHandler?.success(title, message),
  error: (title: string, message?: string) => toastHandler?.error(title, message),
  warning: (title: string, message?: string) => toastHandler?.warning(title, message),
  info: (title: string, message?: string) => toastHandler?.info(title, message),
};
