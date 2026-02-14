"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { buildBackendUrl } from "../../lib/backend";
import { buildAuthHeaders } from "../../lib/auth";

type SlackUserVM = {
  id: number;
  email: string;
  defaultLanguage: string | null;
  subscriptionStartedAt: string | null;
  nextBillingAt: string | null;
  workspaceUsed: number;
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

const formatDateTime = (value: string | null) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function AdminPage() {
  const [user, setUser] = useState<SlackUserVM | null>(null);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [reauthNotice, setReauthNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      setRequiresAuth(false);
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
          buildBackendUrl("/translate/languages"),
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

  useEffect(() => {
    if (!user) {
      return;
    }
    setDefaultLanguage(user.defaultLanguage ?? "");
  }, [user]);

  const canAddToSlack =
    (user?.currentWorkspaceCount ?? 0) > 0 &&
    user !== null &&
    user.workspaceUsed <= (user.currentWorkspaceCount ?? 0);

  const profileDetails = useMemo(() => {
    if (!user) {
      return [];
    }
    return [
      { label: "Email", value: user.email },
      { label: "Workspace used", value: user.workspaceUsed },
      { label: "Workspace count", value: user.currentWorkspaceCount },
      { label: "Created at", value: formatDateTime(user.createdAt) },
    ];
  }, [user]);

  const billingDetails = useMemo(() => {
    if (!user) {
      return [];
    }
    return [
      {
        label: "Subscription started",
        value: formatDateTime(user.subscriptionStartedAt),
      },
      { label: "Next billing", value: formatDateTime(user.nextBillingAt) },
      {
        label: "Stripe subscription",
        value: user.stripeSubscription
          ? subscriptionActive
            ? "Active"
            : "Inactive"
          : null,
      },
    ];
  }, [subscriptionActive, user]);

  const handleSave = async () => {
    setIsSaving(true);
    setNotice("");
    setError("");
    try {
      const payload = {
        defaultLanguage,
      };

      const response = await fetch(buildBackendUrl("/users/me"), {
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

  const handlePasswordSave = async () => {
    setIsSavingPassword(true);
    setPasswordNotice("");
    setPasswordError("");

    if (!password) {
      setPasswordError("Enter a new password.");
      setIsSavingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setIsSavingPassword(false);
      return;
    }

    try {
      const response = await fetch(buildBackendUrl("/users/me"), {
        method: "PUT",
        headers: buildAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Unable to update password.");
      }

      setPassword("");
      setConfirmPassword("");
      setPasswordNotice("Password updated. Please sign in again.");
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("tokenType");
      }
      setReauthNotice("Password updated. Please sign in again.");
      setRequiresAuth(true);
    } catch (saveError) {
      setPasswordError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update password."
      );
    } finally {
      setIsSavingPassword(false);
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
            {reauthNotice ? (
              <p className="mt-3 text-sm font-medium text-emerald-200">
                {reauthNotice}
              </p>
            ) : null}
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
            {!user.stripeSubscription ? (
              <Link
                href="/offers"
                className="flex w-full flex-col items-center justify-center gap-1 rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
              >
                <span>Start subscription</span>
                <span className="text-xs font-medium text-rose-50/90">
                  Przejdź do wyboru planu
                </span>
              </Link>
            ) : subscriptionActive ? (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-80"
              >
                Subscription active
              </button>
            ) : (
              <Link
                href="/offers"
                className="flex w-full items-center justify-center rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
              >
                Purchase subscription
              </Link>
            )}
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
              <div className="mt-6 space-y-6 text-sm">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Account details
                  </h3>
                  <dl className="mt-3 space-y-4">
                    {profileDetails.map((item) => (
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
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Payment details
                  </h3>
                  <dl className="mt-3 space-y-4">
                    {billingDetails.map((item) => (
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
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Editable settings</h2>
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-white">Workspace usage</label>
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/70">workspaceUsed</span>
                    <span className="font-semibold text-white">
                      {formatValue(user?.workspaceUsed ?? null)} /{" "}
                      {formatValue(user?.currentWorkspaceCount ?? null)}
                    </span>
                  </div>
                  {canAddToSlack ? (
                    <button
                      type="button"
                      className="mt-4 flex w-full items-center justify-center rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                    >
                      Dodaj do Slack
                    </button>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-600/70 px-5 py-2 text-sm font-semibold text-slate-300"
                      >
                        Dodaj do Slack
                      </button>
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
                        <span>Limit currentWorkspaceCount przekroczony.</span>
                        <Link
                          href="/offers"
                          className="rounded-full bg-amber-400 px-3 py-1 font-semibold text-amber-950 transition hover:bg-amber-300"
                        >
                          Dodaj workspace
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
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
              <div className="pt-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-semibold text-white">
                    Change password
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Enter the new password twice. You will be asked to sign in
                    again.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-white/70">
                        New password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                        placeholder="Enter a new password"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/70">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordSave}
                    disabled={isSavingPassword || isLoading}
                    className="mt-4 flex w-full items-center justify-center rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingPassword ? "Updating..." : "Change password"}
                  </button>
                  {passwordNotice ? (
                    <div className="mt-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                      {passwordNotice}
                    </div>
                  ) : null}
                  {passwordError ? (
                    <div className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
                      {passwordError}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
