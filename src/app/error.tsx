"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-red-500/40 bg-slate-900/80 p-8 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
          An error occurred
        </p>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Something went wrong.
        </h1>

        <p className="text-base text-slate-300">
          The application encountered an error and could not complete the
          request. Try refreshing the page or returning to the home page.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-600 px-4 py-2 font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Home page
          </Link>
        </div>
      </div>
    </main>
  );
}
