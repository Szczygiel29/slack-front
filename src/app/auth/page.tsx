"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  hasControlChars,
  isReasonableLength,
  normalizeEmail,
} from "../../lib/validation";

type Mode = "login" | "register";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const modes: Array<{ key: Mode; label: string }> = [
  { key: "login", label: "Sign in" },
  { key: "register", label: "Create account" },
];

const modeCopy: Record<
  Mode,
  { title: string; submitLabel: string; switchText: string }
> = {
  login: {
    title: "Welcome back",
    submitLabel: "Sign in",
    switchText: "Don't have an account? Create one",
  },
  register: {
    title: "Create your account",
    submitLabel: "Create account",
    switchText: "Already have an account? Sign in",
  },
};

const initialValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryMode = searchParams.get("mode");
  const initialMode = useMemo<Mode>(() => {
    return queryMode === "register" ? "register" : "login";
  }, [queryMode]);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setErrors({});
    setNotice(null);
    setCanResendVerification(false);
    setResendEmail("");
  }, [initialMode]);

  const handleChange = (field: keyof typeof initialValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const normalizedEmail = normalizeEmail(values.email);

    if (!normalizedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isReasonableLength(normalizedEmail, EMAIL_MAX_LENGTH)) {
      nextErrors.email = "Email is too long.";
    } else if (hasControlChars(normalizedEmail)) {
      nextErrors.email = "Email contains invalid characters.";
    } else if (!emailRegex.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!values.password) {
      nextErrors.password = "Password is required.";
    } else if (!isReasonableLength(values.password, PASSWORD_MAX_LENGTH)) {
      nextErrors.password = "Password is too long.";
    } else if (hasControlChars(values.password)) {
      nextErrors.password = "Password contains invalid characters.";
    } else if (values.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (mode === "register") {
      if (!values.confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (!isReasonableLength(values.confirmPassword, PASSWORD_MAX_LENGTH)) {
        nextErrors.confirmPassword = "Confirmation password is too long.";
      } else if (hasControlChars(values.confirmPassword)) {
        nextErrors.confirmPassword =
          "Confirmation password contains invalid characters.";
      } else if (values.confirmPassword !== values.password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setNotice(null);
      setCanResendVerification(false);
      setIsSubmitting(true);
      try {
        const normalizedEmail = normalizeEmail(values.email);
        const endpoint =
          mode === "register" ? "/api/auth/register" : "/api/auth/login";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            email: normalizedEmail,
            password: values.password,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          if (response.status === 401 && mode === "login") {
            setMode("register");
            setValues(initialValues);
            setErrors({});
            setNotice({
              type: "error",
              message: "Account not found or invalid credentials. Create a new account.",
            });
            return;
          }

          if (response.status === 403) {
            setResendEmail(normalizedEmail);
            setCanResendVerification(true);
            setNotice({
              type: "error",
              message:
                "A verification email has already been sent to this email address. If you did not receive it, send it again.",
            });
            return;
          }

          const message =
            data?.message ??
            (response.status === 409
              ? "User already exists."
              : response.status === 401
                ? "Invalid credentials."
                : response.status === 403
                  ? "Email not verified."
                  : "Unable to complete request.");
          setNotice({ type: "error", message });
          return;
        }

        if (mode === "register") {
          setCanResendVerification(false);
          setNotice({
            type: "success",
            message: data?.message ?? "Activation email sent.",
          });
        } else {
          setCanResendVerification(false);
          setNotice({
            type: "success",
            message: "Signed in successfully.",
          });
          router.push("/admin");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setNotice(null);
    }
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setErrors({});
    setNotice(null);
    setCanResendVerification(false);
    setResendEmail("");
  };

  const handleResendVerificationEmail = async () => {
    if (!resendEmail) {
      return;
    }

    setIsResendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ email: resendEmail }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setNotice({
          type: "error",
          message:
            data?.message ??
            "Unable to resend the verification email.",
        });
        return;
      }

      setCanResendVerification(false);
      setNotice({
        type: "success",
        message:
          data?.message ??
          "The verification email has been sent again. Check your inbox.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">ThreadoAI</span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 lg:flex-row lg:items-start">
        <section className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Secure Slack access
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white">
            {modeCopy[mode].title}
          </h1>
          <p className="mt-4 text-base text-white/70">
            Connect your Slack workspace and unlock AI assistance.
          </p>
          <div className="mt-8 flex max-w-sm flex-wrap gap-3 rounded-full border border-white/10 bg-white/5 p-2 text-sm">
            {modes.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleModeChange(item.key)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                  mode === item.key
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/60">
            {mode === "login"
              ? "Use your existing ThreadoAI credentials to continue."
              : "Create an account to set up ThreadoAI for your team."}
          </p>
        </section>

        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-white">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                maxLength={EMAIL_MAX_LENGTH}
                value={values.email}
                onChange={(event) => handleChange("email", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                placeholder="you@company.com"
              />
              {errors.email ? (
                <p className="mt-2 text-xs text-rose-300">{errors.email}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-white">Password</label>
              <input
                type="password"
                name="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                maxLength={PASSWORD_MAX_LENGTH}
                value={values.password}
                onChange={(event) => handleChange("password", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                placeholder="Enter your password"
              />
              {errors.password ? (
                <p className="mt-2 text-xs text-rose-300">{errors.password}</p>
              ) : null}
            </div>
            {mode === "register" ? (
              <div>
                <label className="text-sm font-medium text-white">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={values.confirmPassword}
                  onChange={(event) =>
                    handleChange("confirmPassword", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none"
                  placeholder="Re-enter your password"
                />
                {errors.confirmPassword ? (
                  <p className="mt-2 text-xs text-rose-300">
                    {errors.confirmPassword}
                  </p>
                ) : null}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              {isSubmitting ? "Submitting..." : modeCopy[mode].submitLabel}
            </button>
            {notice ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-xs ${
                  notice.type === "success"
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border-rose-400/40 bg-rose-500/10 text-rose-100"
                }`}
              >
                {notice.message}
              </div>
            ) : null}
            {canResendVerification ? (
              <button
                type="button"
                onClick={handleResendVerificationEmail}
                disabled={isResendingVerification}
                className="w-full rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingVerification
                  ? "Resending..."
                  : "Resend verification email"}
              </button>
            ) : null}
          </form>
          <button
            type="button"
            onClick={() => handleModeChange(mode === "login" ? "register" : "login")}
            className="mt-6 w-full text-center text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            {modeCopy[mode].switchText}
          </button>
        </section>
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
