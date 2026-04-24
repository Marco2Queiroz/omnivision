"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Erro raiz (incl. layout): o Next exige html/body neste ficheiro.
 */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[OmniVision] global", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          background: "#060e20",
          color: "#dee5ff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", color: "#91abff" }}>
          OmniVision — erro crítico
        </h1>
        <p style={{ textAlign: "center", maxWidth: "28rem", fontSize: "0.875rem" }}>
          {error.message || "Falha ao iniciar a aplicação."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid #40485d",
            background: "#141f38",
            color: "#dee5ff",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
