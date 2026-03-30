"use client";

import { useFilterStore } from "@/stores/filter-store";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Hidrata o store de filtros a partir da query string. */
export function useFilterUrlSync() {
  const searchParams = useSearchParams();
  const setFilters = useFilterStore((s) => s.setFilters);

  useEffect(() => {
    setFilters({
      dateFrom: searchParams.get("from"),
      dateTo: searchParams.get("to"),
      projectKey: searchParams.get("project"),
      responsibleId: searchParams.get("assignee"),
    });
  }, [searchParams, setFilters]);
}
