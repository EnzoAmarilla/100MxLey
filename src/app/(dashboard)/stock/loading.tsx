export default function StockLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 rounded-lg bg-brand-surface" />
          <div className="h-3 w-48 rounded bg-brand-surface" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-lg bg-brand-surface" />
          <div className="h-8 w-36 rounded-lg bg-brand-surface" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-brand-border bg-brand-card p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-brand-surface" />
            <div className="h-8 w-20 rounded bg-brand-surface" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-brand-border bg-brand-card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <div className="h-8 w-64 rounded-lg bg-brand-surface" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-brand-border flex gap-6">
            {[12, 32, 20, 14, 10, 16, 18, 12, 10, 14].map((w, j) => (
              <div key={j} className={`h-3 w-${w} rounded bg-brand-surface`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
