/** Skeleton enquanto a rota do dashboard resolve (cache + RSC). */
export default function DashboardTabLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div>
        <div className="h-7 w-48 rounded bg-surface-container-high" />
      </div>
      <div className="h-40 rounded-xl bg-surface-container/40" />
      <div className="h-64 rounded-xl bg-surface-container/30" />
    </div>
  );
}
