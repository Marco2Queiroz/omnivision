"use client";

import { account } from "@/lib/appwrite";
import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  appwriteConfigured: boolean;
};

export function DashboardHeader({ appwriteConfigured }: Props) {
  const router = useRouter();

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
    <header className="fixed left-0 right-0 top-0 z-20 flex h-20 items-center justify-between border-b border-cyan-900/20 bg-[#051522]/90 px-4 pl-14 shadow-[0_0_15px_rgba(0,242,255,0.05)] backdrop-blur-md md:pl-60">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-950">
          <span className="font-headline text-xs font-bold text-primary-container">
            OV
          </span>
        </div>
        <div>
          <h1 className="font-headline text-lg font-extrabold uppercase tracking-widest text-cyan-400">
            COMMAND CENTER
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-outline">
            OmniVision Executive Suite
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/strategy"
          className="hidden text-[10px] font-bold uppercase tracking-wider text-cyan-400 md:inline"
        >
          Strategy
        </Link>
        <button
          type="button"
          className="text-cyan-400 transition hover:text-cyan-300"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-1 rounded border border-outline-variant/30 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant transition hover:border-primary-container hover:text-primary-container"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </div>
    </header>
  );
}
