"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

/* ─── Context ──────────────────────────────────────────────────── */
const Ctx = createContext<{ start: () => void }>({ start: () => {} });
export const useNavProgress = () => useContext(Ctx);

/* ─── Provider + bar ───────────────────────────────────────────── */
export function NavProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname          = usePathname();
  const [pct, setPct]     = useState(0);
  const [show, setShow]   = useState(false);
  const timers            = useRef<ReturnType<typeof setTimeout>[]>([]);
  const active            = useRef(false);

  function clear() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  const start = useCallback(() => {
    if (active.current) return;
    active.current = true;
    clear();
    setPct(0);
    setShow(true);

    // Trickle: 0 → 20 → 50 → 72 → 85 — stays there until navigation completes
    const steps: [number, number][] = [[20, 80], [50, 300], [72, 700], [85, 1500]];
    steps.forEach(([p, delay]) => {
      timers.current.push(setTimeout(() => setPct(p), delay));
    });
  }, []);

  // Complete when pathname changes (navigation finished)
  useEffect(() => {
    if (!active.current) return;
    clear();
    setPct(100);
    timers.current.push(
      setTimeout(() => {
        setShow(false);
        setPct(0);
        active.current = false;
      }, 350)
    );
  }, [pathname]);

  return (
    <Ctx.Provider value={{ start }}>
      {/* Progress bar */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 right-0 z-[9999] h-[2px]"
        style={{ opacity: show ? 1 : 0, transition: "opacity 200ms" }}
      >
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #00F5FF, #BD00FF)",
            boxShadow: "0 0 8px #00F5FF, 0 0 2px #00F5FF",
            transition: pct === 100 ? "width 180ms ease-out" : "width 600ms ease-out",
          }}
        />
        {/* Glow dot at leading edge */}
        {show && pct > 0 && pct < 100 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-neon-cyan"
            style={{
              left: `calc(${pct}% - 4px)`,
              boxShadow: "0 0 6px 2px #00F5FF",
            }}
          />
        )}
      </div>

      {children}
    </Ctx.Provider>
  );
}
