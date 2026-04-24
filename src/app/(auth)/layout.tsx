export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface-dim text-on-surface">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage:
            "radial-gradient(circle, rgba(64,72,93,0.35) 1px, transparent 1px)",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      {children}
    </div>
  );
}
