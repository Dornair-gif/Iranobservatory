"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary for /[lang]/* SSR/SSG pages.
 *
 * Triggered when api.listArticles / listStudies bubble up a backend error.
 * Showing this is INFINITELY better than showing "0 publications" on a
 * stale ISR cache: the user sees a clear "we'll be right back" + retry,
 * and Next.js will retry rendering on the next refresh.
 */
export default function LangError({ error, reset }) {
  useEffect(() => {
    // Soft log; useful in production telemetry later.
    // eslint-disable-next-line no-console
    console.error("[Iran Observatory] route error:", error?.message || error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="max-w-md text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3DB883] mb-3">
          Iran Observatory
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0f1e2e] mb-3">
          Un instant…
        </h1>
        <p className="text-zinc-600 mb-6 leading-relaxed">
          Le service de publication redémarre. Réessayez dans quelques secondes —
          aucun article n'est perdu.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 bg-[#1E3A5F] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#0f1e2e] transition-colors rounded"
            data-testid="error-retry-btn"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-zinc-300 text-zinc-700 font-mono text-xs uppercase tracking-wider hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors rounded"
          >
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
