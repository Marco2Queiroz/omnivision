"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Props = {
  variant?: "default" | "midnight";
};

export function ThemeToggle({ variant = "default" }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const midnight = variant === "midnight";

  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center",
          midnight
            ? "h-9 w-9 rounded-lg"
            : "h-9 w-9 rounded-lg border border-line-field bg-surface-container-high/50",
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center text-primary transition-colors",
        midnight
          ? "rounded-lg p-2 hover:bg-surface-bright/60"
          : "h-9 w-9 rounded-lg border border-line-field bg-surface-container-high/80 hover:border-primary/50 hover:bg-surface-container-highest",
      )}
      aria-label={isDark ? "Tema claro" : "Tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      {isDark ? (
        <Sun className={midnight ? "h-5 w-5" : "h-4 w-4"} />
      ) : (
        <Moon className={midnight ? "h-5 w-5" : "h-4 w-4"} />
      )}
    </button>
  );
}
