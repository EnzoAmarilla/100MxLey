"use client";

import { useEffect, useState } from "react";
import { PlayCircle, X } from "lucide-react";

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  sortOrder: number;
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function ThumbnailOrFallback({ url, title }: { url: string; title: string }) {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return (
      <img
        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-brand-surface">
      <PlayCircle className="h-12 w-12 text-neon-cyan/40" />
    </div>
  );
}

function VideoPlayer({ url }: { url: string }) {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
      <video src={url} controls autoPlay className="w-full h-full" />
    </div>
  );
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading]     = useState(true);
  const [active, setActive]       = useState<Tutorial | null>(null);

  useEffect(() => {
    fetch("/api/tutorials")
      .then((r) => r.json())
      .then((d) => setTutorials(d.tutorials ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tutoriales</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Videos explicativos para sacar el máximo provecho a la plataforma</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-brand-surface border border-brand-border animate-pulse h-48" />
          ))}
        </div>
      ) : tutorials.length === 0 ? (
        <div className="text-center py-20">
          <PlayCircle className="h-12 w-12 mx-auto mb-4 text-neon-cyan/20" />
          <p className="text-[var(--text-secondary)] text-sm">No hay tutoriales disponibles por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tutorials.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t)}
              className="group text-left rounded-xl border border-brand-border bg-brand-surface overflow-hidden hover:border-neon-cyan/30 hover:shadow-[0_0_20px_rgba(0,245,255,0.05)] transition-all duration-200"
            >
              <div className="relative h-44 overflow-hidden bg-black">
                <ThumbnailOrFallback url={t.videoUrl} title={t.title} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-14 w-14 rounded-full bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center">
                    <PlayCircle className="h-8 w-8 text-neon-cyan" />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-neon-cyan transition-colors">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{t.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setActive(null); }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-brand-border bg-brand-bg shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{active.title}</h2>
              <button
                onClick={() => setActive(null)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-brand-surface transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <VideoPlayer url={active.videoUrl} />
              {active.description && (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">{active.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
