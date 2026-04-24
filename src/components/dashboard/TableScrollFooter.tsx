"use client";

import { useSidebarCollapse } from "@/components/layout/SidebarCollapseContext";
import { cn } from "@/lib/utils";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

type Props = {
  targetRef: RefObject<HTMLDivElement | null>;
};

/**
 * Barra de scroll horizontal fixa no rodapé, espelhando a rolagem da tabela
 * (área alvo) para melhorar a navegação em telas com muitas colunas.
 */
export function TableScrollFooter({ targetRef }: Props) {
  const { collapsed } = useSidebarCollapse();
  const railRef = useRef<HTMLDivElement>(null);
  const [trackW, setTrackW] = useState(0);
  const [showBar, setShowBar] = useState(false);

  useLayoutEffect(() => {
    const el = targetRef.current;
    const rail = railRef.current;
    if (!el || !rail) return;

    const updateMetrics = () => {
      setTrackW(el.scrollWidth);
      setShowBar(el.scrollWidth > el.clientWidth + 2);
    };

    const onTargetScroll = () => {
      rail.scrollLeft = el.scrollLeft;
    };

    const onRailScroll = () => {
      el.scrollLeft = rail.scrollLeft;
    };

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateMetrics);
    });
    ro.observe(el);

    el.addEventListener("scroll", onTargetScroll, { passive: true });
    rail.addEventListener("scroll", onRailScroll, { passive: true });
    updateMetrics();
    onTargetScroll();

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onTargetScroll);
      rail.removeEventListener("scroll", onRailScroll);
    };
  }, [targetRef]);

  return (
    <div
      className={cn(
        "pointer-events-auto fixed bottom-0 z-40 border-t border-line-field/80",
        "bg-surface-dim/95 py-0 shadow-[0_-2px_8px_-1px_rgba(0,0,0,0.14)]",
        "backdrop-blur supports-[backdrop-filter]:bg-surface-dim/80",
        "box-border px-2.5 py-0 md:px-5",
        "left-0 w-full",
        collapsed ? "lg:left-16 lg:w-[calc(100%-4rem)]" : "lg:left-64 lg:w-[calc(100%-16rem)]",
        "pb-[env(safe-area-inset-bottom,0px)]",
        !showBar && "pointer-events-none h-0 overflow-hidden border-0 p-0 opacity-0",
      )}
      aria-hidden={!showBar}
      role="presentation"
    >
      <div
        ref={railRef}
        className="min-h-7 w-full min-w-0 cursor-ew-resize overflow-x-auto overflow-y-hidden [scrollbar-gutter:stable] py-0 [scrollbar-width:auto] [&::-webkit-scrollbar]:h-[25px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-on-background/35 [&::-webkit-scrollbar-track]:bg-on-background/5"
        tabIndex={showBar ? 0 : -1}
        onKeyDown={(e) => {
          const t = targetRef.current;
          if (!t) return;
          const step = 100;
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            t.scrollBy({ left: -step, behavior: "smooth" });
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            t.scrollBy({ left: step, behavior: "smooth" });
          }
        }}
        aria-label="Rolagem horizontal da tabela (rodapé fixo)"
      >
        <div
          className="pointer-events-none h-px"
          style={{ width: Math.max(trackW, 1), minWidth: "100%" }}
          aria-hidden
        />
      </div>
    </div>
  );
}
