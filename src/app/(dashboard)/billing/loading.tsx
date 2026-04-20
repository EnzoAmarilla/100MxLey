export default function BillingLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-brand-surface" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 rounded-xl border border-brand-border bg-brand-card" />
        <div className="space-y-4">
          <div className="h-44 rounded-xl border border-brand-border bg-brand-card" />
          <div className="h-44 rounded-xl border border-brand-border bg-brand-card" />
        </div>
      </div>
      <div className="h-48 rounded-xl border border-brand-border bg-brand-card" />
    </div>
  );
}
