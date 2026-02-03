"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { buildBackendUrl } from "../../lib/backend";
import { buildAuthHeaders } from "../../lib/auth";

type SlackUserVM = {
  id: string;
  email: string;
  handledEmails: string[];
  defaultLanguage: string | null;
  subscriptionStartedAt: string | null;
  nextBillingAt: string | null;
  currentWorkspaceCount: number | null;
  stripeSubscription: {
    subscriptionActive: boolean;
  } | null;
  createdAt: string | null;
};

type LanguageOption = {
  value: string;
  label: string;
};

const normalizeLanguages = (data: unknown): LanguageOption[] => {
  const rawItems: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { languages?: unknown[] })?.languages)
      ? (data as { languages: unknown[] }).languages
      : Array.isArray((data as { items?: unknown[] })?.items)
        ? (data as { items: unknown[] }).items
        : [];

  return rawItems
    .map((item) => {
      if (typeof item === "string") {
        return { value: item, label: item };
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const value =
          (typeof record.code === "string" && record.code) ||
          (typeof record.value === "string" && record.value) ||
          (typeof record.id === "string" && record.id) ||
          (typeof record.name === "string" && record.name) ||
          (typeof record.label === "string" && record.label) ||
          "";
        const label =
          (typeof record.label === "string" && record.label) ||
          (typeof record.name === "string" && record.name) ||
          (typeof record.code === "string" && record.code) ||
          (typeof record.value === "string" && record.value) ||
          (typeof record.id === "string" && record.id) ||
          value;
        if (value) {
          return { value, label };
        }
      }
      return null;
    })
    .filter((item): item is LanguageOption => Boolean(item));
};

const formatValue = (value: string | number | null) => {
  if (value === null || value === "") {
    return "—";
  }
  return String(value);
};

export default function AdminPage() {
  const [user, setUser] = useState<SlackUserVM | null>(null);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [handledEmailsInput, setHandledEmailsInput] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [billingNotice, setBillingNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      setRequiresAuth(false);
      setBillingNotice("");
      try {
        const userResponse = await fetch(buildBackendUrl("/users/me"), {
          headers: buildAuthHeaders(),
        });

        if (userResponse.status === 401 || userResponse.status === 403) {
          if (isMounted) {
            setRequiresAuth(true);
          }
          return;
        }

        if (!userResponse.ok) {
          throw new Error("Unable to load admin profile.");
        }

        const userData = (await userResponse.json()) as SlackUserVM;
        const languageResponse = await fetch(
          buildBackendUrl("/meta/aws-translate-languages"),
          {
            headers: buildAuthHeaders(),
          }
        );

        if (!languageResponse.ok) {
          throw new Error("Unable to load language options.");
        }

        const languageData = await languageResponse.json();

        if (isMounted) {
          setUser(userData);
          setLanguages(normalizeLanguages(languageData));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load admin data."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const subscriptionActive = Boolean(
    user?.stripeSubscription?.subscriptionActive
  );
  const hasBillingRoute = false;

  const handleBillingClick = () => {
    if (!hasBillingRoute) {
      setBillingNotice("Billing page not configured yet.");
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    setHandledEmailsInput((user.handledEmails ?? []).join("\n"));
    setDefaultLanguage(user.defaultLanguage ?? "");
  }, [user]);

  const details = useMemo(() => {
    if (!user) {
      return [];
    }
    return [
      { label: "User ID", value: user.id },
      { label: "Email", value: user.email },
      { label: "Subscription started", value: user.subscriptionStartedAt },
      { label: "Next billing", value: user.nextBillingAt },
      { label: "Workspace count", value: user.currentWorkspaceCount },
      {
        label: "Stripe subscription",
        value: user.stripeSubscription
          ? subscriptionActive
            ? "Active"
            : "Inactive"
          : null,
      },
      { label: "Created at", value: user.createdAt },
    ];
  }, [subscriptionActive, user]);

  const handleSave = async () => {
    setIsSaving(true);
    setNotice("");
    setError("");
    try {
      const payload = {
        handledEmails: handledEmailsInput
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        defaultLanguage,
      };

      const response = await fetch(buildBackendUrl("/admin/me"), {
        method: "PUT",
        headers: buildAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to save admin settings.");
      }

      setNotice("Saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save admin settings."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (requiresAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/10 bg-slate-950/80">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40">
                S
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Slackmate
              </span>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Back to home
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <h1 className="text-2xl font-semibold text-white">
              Admin access requires sign in
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Sign in to view your admin profile and settings.
            </p>
            <Link
              href="/auth?mode=login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              Go to sign in
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">Slackmate</span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14">
        {user ? (
          <section className="space-y-3">
            {subscriptionActive ? (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-80"
              >
                Subscription active
              </button>
            ) : hasBillingRoute ? (
              <Link
                href="/billing"
                className="flex w-full items-center justify-center rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
              >
                Purchase subscription
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBillingClick}
                className="flex w-full items-center justify-center rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
              >
                Purchase subscription
              </button>
            )}
            {billingNotice ? (
              <p className="text-sm text-rose-100">{billingNotice}</p>
            ) : null}
          </section>
        ) : null}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Admin settings
          </div>
          <h1 className="text-3xl font-semibold text-white">Admin profile</h1>
          <p className="text-sm text-white/70">
            Review your Slackmate admin details and update your default language
            preferences.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Profile overview</h2>
            <p className="mt-2 text-sm text-white/60">
              All fields are read-only except handled emails and default language.
            </p>
            {isLoading ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-white/60">
                Loading admin profile...
              </div>
            ) : error ? (
              <div className="mt-6 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                {error}
              </div>
            ) : (
              <dl className="mt-6 space-y-4 text-sm">
                {details.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <dt className="text-xs uppercase tracking-wide text-white/60">
                      {item.label}
                    </dt>
                    <dd className="text-white">
                      {formatValue(item.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Editable settings</h2>
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-white">
                  Handled emails
                </label>
                <p className="mt-1 text-xs text-white/60">
                  Enter one email address per line.
                </p>
                <textarea
                  rows={6}
                  value={handledEmailsInput}
                  onChange={(event) => setHandledEmailsInput(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                  placeholder="ops@company.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white">
                  Default language
                </label>
                <p className="mt-1 text-xs text-white/60">
                  Choose the default AWS Translate language.
                </p>
                <select
                  value={defaultLanguage}
                  onChange={(event) => setDefaultLanguage(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
                >
                  <option value="">Select a language</option>
                  {languages.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex w-full items-center justify-center rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              {notice ? (
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                  {notice}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
