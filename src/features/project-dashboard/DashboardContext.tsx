"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAdminQuery, type AdminQuery } from "@/features/admin/useAdminQuery";
import { getCategories, getStats } from "./projectDashboardApi";
import type { Category, DashboardFilter, DashboardStats } from "./types";

export interface DashboardContextValue {
  filter: DashboardFilter;
  setFilter: (filter: DashboardFilter) => void;
  search: string;
  setSearch: (search: string) => void;
  /** Id of the criterion shown in the detail panel, if any. */
  openedCriterionId?: string;
  openCriterion: (id: string) => void;
  closeCriterion: () => void;
  /**
   * Bumped by `refresh`. Every module puts it in its query key, so one change
   * (a status edit, an add, a delete) updates the stats, the issues, the
   * category list and the activity feed together.
   */
  version: number;
  refresh: () => void;
  stats: AdminQuery<DashboardStats>;
  categories: AdminQuery<Category[]>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined,
);

export function useDashboard(): DashboardContextValue {
  const value = useContext(DashboardContext);
  if (!value) {
    throw new Error("useDashboard must be used inside <DashboardProvider>");
  }
  return value;
}

/** Holds what the four dashboard modules share: the filter, the search, the open criterion and the stats / category data. */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<DashboardFilter>({ kind: "all" });
  const [search, setSearch] = useState("");
  const [openedCriterionId, setOpenedCriterionId] = useState<string>();
  const [version, setVersion] = useState(0);

  const stats = useAdminQuery(getStats, `stats-${version}`);
  const categories = useAdminQuery(getCategories, `categories-${version}`);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const closeCriterion = useCallback(() => setOpenedCriterionId(undefined), []);

  const value = useMemo<DashboardContextValue>(
    () => ({
      filter,
      setFilter,
      search,
      setSearch,
      openedCriterionId,
      openCriterion: setOpenedCriterionId,
      closeCriterion,
      version,
      refresh,
      stats,
      categories,
    }),
    [
      filter,
      search,
      openedCriterionId,
      closeCriterion,
      version,
      refresh,
      stats,
      categories,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
