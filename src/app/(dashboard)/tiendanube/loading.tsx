export default function TiendanubeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 rounded-lg bg-brand-surface" />

      {/* Filters skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-36 rounded-lg bg-brand-surface" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-brand-border bg-brand-card overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border flex items-center gap-4">
          <div className="h-4 w-24 rounded bg-brand-surface" />
          <div className="ml-auto h-8 w-36 rounded-lg bg-brand-surface" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-border bg-brand-surface">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-5 py-3">
                  <div className="h-3 w-16 rounded bg-brand-bg" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-brand-border">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-5 py-4">
                    <div className="h-3 rounded bg-brand-surface" style={{ width: `${40 + (i * j * 7) % 50}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
