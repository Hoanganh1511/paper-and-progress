"use client";

import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../provider/AuthContext";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
