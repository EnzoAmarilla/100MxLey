export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-accent flex items-center justify-center text-white font-bold text-sm">
              100
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              100Mxley
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Gestión de envíos para ecommerce
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
