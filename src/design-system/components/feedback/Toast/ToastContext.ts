"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ToastVariant } from "./Toast";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Milliseconds before it goes away; 0 keeps it until dismissed. Defaults to 5000. */
  duration?: number;
}

export interface ToastContextValue {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** `{ toast, dismiss, dismissAll }` from the nearest ToastProvider. */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
