"use client";

import { createContext, useContext } from "react";

export interface DialogContextValue {
  titleId: string;
  descriptionId: string;
  onClose: () => void;
  isDismissible: boolean;
  setHasDescription: (hasDescription: boolean) => void;
}

export const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog parts must be used within a Dialog");
  }
  return context;
}
