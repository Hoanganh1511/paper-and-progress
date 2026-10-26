"use client";

import { createContext, useContext } from "react";

export interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  isDisabled: boolean;
  onValueChange: (value: string) => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(
  null,
);

export function useRadioGroup() {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioItem must be used within a RadioGroup");
  }
  return context;
}
