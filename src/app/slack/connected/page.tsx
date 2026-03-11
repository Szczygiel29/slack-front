"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "../../../lib/api";

type AuthState = "loading" | "authenticated" | "unauthenticated";
type SlackOauthErrorCode =
  | "invalid_state"
  | "backend_rejected"
  | "backend_unavailable";

const slackOauthMessages: Record<SlackOauthErrorCode, string> = {
  invalid_state:
    "Slack authorization could not be verified. Start the connection flow again.",
  backend_rejected:
    "Slack rejected or did not complete the connection request. Try again.",
  backend_unavailable:
    "Slack connection is temporarily unavailable. Try again in a moment.",
};

export default function SlackConnectedPage() {
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>("loading");

  const status = searchParams.get("status");
  const errorCode = searchParams.get("code") as SlackOauthErrorCode | null;

  const isError = status === "error";

  const message = useMemo(() => {
    if (isError) {
      if (errorCode && errorCode in slackOauthMessages) {
        return slackOauthMessages[errorCode];
      }
      return "Slack connection was not completed. Please try again.";
    }
    return "Your app has been successfully connected to Slack.";
  }, [errorCode, isError]);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      try {
        const response = await apiFetch("/users/me");

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
        <p className="text-sm text-white/70">Checking user access...</p>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-semibold">Sign-in required page</h1>
          <p className="mt-3 text-sm text-white/70">
            Sign in to view the Slack connection status.
          </p>
          <Link
            href="/auth?mode=login"
            className="mt-6 inline-flex rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-semibold">
          {isError ? "Failed to connect Slack" : "Slack connected"}
        </h1>
        <p className="mt-4 text-sm text-white/75">{message}</p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400">
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
            Home page
          </Link>
        </div>
      </div>
    </div>
  );
}
