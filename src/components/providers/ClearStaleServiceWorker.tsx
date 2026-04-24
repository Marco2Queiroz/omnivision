"use client";

import { useEffect } from "react";

/**
 * Desregista service workers antigos (ex.: de builds com PWA) que serviam
 * documentos vazios ou bundles corrompidos — sintoma típico: página em branco
 * após deploy ou em dev.
 */
export function ClearStaleServiceWorker() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const r of regs) {
        void r.unregister();
      }
    });
  }, []);

  return null;
}
