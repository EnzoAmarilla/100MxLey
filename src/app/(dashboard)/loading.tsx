export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-lg bg-brand-surface" />
          <div className="h-3 w-40 rounded bg-brand-surface" />
        </div>
        <div className="h-7 w-28 rounded-lg bg-brand-surface" />
      </div>

      {/* Banner skeleton */}
      <div className="h-14 rounded-xl bg-brand-surface" />

      {/* Section label */}
      <div className="h-4 w-32 rounded bg-brand-surface" />

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-brand-surface" />
            <div className="h-8 w-20 rounded bg-brand-surface" />
          </div>
        ))}
      </div>

      {/* More cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
            <div className="h-3 w-28 rounded bg-brand-surface" />
            <div className="h-10 w-16 rounded bg-brand-surface" />
            <div className="h-3 w-20 rounded bg-brand-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
