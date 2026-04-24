"use client";

import { account } from "@/lib/appwrite";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  appwriteConfigured: boolean;
  variant?: "default" | "midnight";
};

export function UserMenu({ appwriteConfigured, variant = "default" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    if (!appwriteConfigured) {
      router.push("/login");
      return;
    }
    try {
      await account.deleteSession({ sessionId: "current" });
    } catch {
      /* ignore */
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center justify-center text-primary transition-colors",
          variant === "midnight"
            ? "h-8 w-8 rounded-full border border-line-subtle hover:bg-surface-bright/50"
            : "h-9 w-9 rounded-lg border border-line-field bg-surface-container-high/80 hover:border-primary/50",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu do usuário"
      >
        <User className="h-4 w-4" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-lg border border-outline-variant/30 bg-surface-container-high py-1 shadow-xl">
            <Link
              href="/dashboard/profile/dados"
              className="block px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low"
              onClick={() => setOpen(false)}
            >
              Perfil
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-error"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
