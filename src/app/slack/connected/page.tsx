"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { buildAuthHeaders } from "../../../lib/auth";
import { buildBackendUrl } from "../../../lib/backend";

type AuthState = "loading" | "authenticated" | "unauthenticated";

export default function SlackConnectedPage() {
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>("loading");

  const status = searchParams.get("status");
  const messageFromQuery = searchParams.get("message");

  const isError = status === "error";

  const message = useMemo(() => {
    if (isError) {
      return (
        messageFromQuery ??
        "Połączenie ze Slackiem nie zostało zakończone. Spróbuj ponownie."
      );
    }
    return "Twoja aplikacja została poprawnie połączona ze Slackiem.";
  }, [isError, messageFromQuery]);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        const response = await fetch(buildBackendUrl("/users/me"), {
          headers: buildAuthHeaders(),
        });

        if (!mounted) {
          return;
        }

        if (response.ok) {
          setAuthState("authenticated");
          return;
        }

        setAuthState("unauthenticated");
      } catch {
        if (mounted) {
          setAuthState("unauthenticated");
        }
      }
    };

    void verify();

    return () => {
      mounted = false;
    };
  }, []);

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-white/70">Sprawdzanie dostępu użytkownika...</p>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-semibold">Strona tylko dla zalogowanych</h1>
          <p className="mt-3 text-sm text-white/70">
            Zaloguj się, aby zobaczyć status połączenia ze Slackiem.
          </p>
          <Link
            href="/auth?mode=login"
            className="mt-6 inline-flex rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
            Przejdź do logowania
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold">
          {isError ? "Nie udało się połączyć Slacka" : "Slack został połączony"}
        </h1>
        <p className="mt-4 text-sm text-white/75">{message}</p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">
            Wróć do panelu
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
            Strona główna
          </Link>
        </div>
      </div>
    </div>
  );
}
