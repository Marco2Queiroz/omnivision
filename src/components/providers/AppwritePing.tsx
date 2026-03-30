"use client";

import { client } from "@/lib/appwrite";
import { useEffect } from "react";

/**
 * Ao abrir o app, envia um ping ao backend Appwrite para validar endpoint/projeto.
 * Resultado aparece no console do navegador (F12 → Console).
 */
export function AppwritePing() {
  useEffect(() => {
    client
      .ping()
      .then((msg) => {
        console.info("[OmniVision] Appwrite ping OK:", msg);
      })
      .catch((err: unknown) => {
        console.warn("[OmniVision] Appwrite ping falhou:", err);
      });
  }, []);

  return null;
}
