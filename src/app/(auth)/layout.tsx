export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#050A0E" }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-neon-cyan/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-neon-purple/[0.04] blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="relative h-11 w-11 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
              <svg className="h-6 w-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                100<span className="text-neon-cyan" style={{ textShadow: "0 0 12px rgba(0,245,255,0.6)" }}>Mx</span>ley
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] tracking-widest uppercase">Gestión de envíos</div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
