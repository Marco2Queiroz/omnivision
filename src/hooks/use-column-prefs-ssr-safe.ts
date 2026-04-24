"use client";

import type { DashboardTabId } from "@/lib/dashboard-tabs";
import {
  defaultVisibleForTab,
  getVisibleFromState,
  migrateTabState,
  normalizeVisibleOrder,
  type ColumnId,
  useColumnStore,
} from "@/stores/column-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

/**
 * Após a montagem no cliente, passamos a usar o store persistido (localStorage).
 * No SSR, o baseline segue `defaultVisibleForTab` (sem a coluna interna Time).
 */
export function useColumnPrefsClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

/**
 * Inscreve-se em `byTab[tab]` (ordem + ocultas) para re-renderizar ao alterar colunas.
 */
export function useTabColumnPrefs(tab: DashboardTabId) {
  const clientReady = useColumnPrefsClientReady();

  useEffect(() => {
    if (!clientReady) return;
    useColumnStore.getState().ensureGanttLast(tab);
  }, [clientReady, tab]);

  const rawTab = useColumnStore(useShallow((s) => s.byTab[tab]));

  const migrated = useMemo(
    () => migrateTabState(rawTab ?? undefined),
    [rawTab],
  );

  const baseline = useMemo(() => defaultVisibleForTab(tab), [tab]);

  const isVisible = useCallback(
    (col: ColumnId) => {
      if (!clientReady) {
        return baseline.includes(col);
      }
      return (
        migrated.columnOrder.includes(col) && !migrated.hidden.includes(col)
      );
    },
    [clientReady, migrated, baseline],
  );

  const hiddenCount = clientReady ? migrated.hidden.length : 0;

  /** Ordem na UI: Gantt por último; ordem relativa preservada ao ocultar/reexibir. */
  const orderedVisible = useMemo(
    () =>
      clientReady
        ? getVisibleFromState(migrated)
        : normalizeVisibleOrder([...baseline]),
    [clientReady, migrated, baseline],
  );

  return { isVisible, hiddenCount, orderedVisible, clientReady };
}
