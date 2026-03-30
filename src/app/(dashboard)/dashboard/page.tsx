import Link from "next/link";
import { Crosshair, Gauge, LayoutGrid, Radar, Target } from "lucide-react";

const tiles = [
  {
    href: "/dashboard/strategy",
    title: "Holistic Strategy",
    desc: "ROI, épicos e marcos estratégicos.",
    icon: Target,
  },
  {
    href: "/dashboard/tactical",
    title: "Tactical Alignment",
    desc: "Lead Time e squads.",
    icon: Radar,
  },
  {
    href: "/dashboard/operational",
    title: "Granular Operational",
    desc: "Impedimentos e bugs críticos.",
    icon: Gauge,
  },
  {
    href: "/dashboard/geo",
    title: "Crisis — Geo",
    desc: "War Room e planos de contingência.",
    icon: Crosshair,
  },
];

export default function PortalPage() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="mb-4 inline-flex justify-center">
          <LayoutGrid className="h-10 w-10 text-primary-container" />
        </div>
        <h2 className="font-headline text-3xl font-extrabold tracking-tight text-white">
          Portal de acesso
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Selecione uma vertical para inteligência consolidada.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {tiles.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="scanner-hover group relative overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container/60 p-8 transition hover:border-primary-container/40"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg border border-primary-container/30 bg-primary-container/10 p-3 text-primary-container">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-primary">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">{desc}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-primary-container group-hover:underline">
                  Abrir visão →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
