"use client";

import Link from "next/link";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Unhandled global error:", error);
  }, [error]);

  return (
    <html lang="pl">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
          <div className="rounded-2xl border border-red-500/40 bg-slate-900/80 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
              Błąd krytyczny
            </p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Nie udało się załadować aplikacji.
            </h1>
            <p className="mt-4 text-slate-300">
              Wystąpił nieoczekiwany problem. Spróbuj ponownie lub wróć do
              strony głównej.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-400"
              >
                Spróbuj ponownie
              </button>
              <Link
                href="/"
                className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-100 transition hover:bg-slate-800"
              >
                Strona główna
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
