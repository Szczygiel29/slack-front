"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { apiFetch } from "../../lib/api";
import { fetchOfferPlan, formatUsdPrice } from "../../lib/offers";
import {
  EMAIL_LIST_ITEM_MAX_LENGTH,
  EMAIL_LIST_TEXT_MAX_LENGTH,
  LANGUAGE_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  hasControlChars,
  isReasonableLength,
  normalizeEmail,
} from "../../lib/validation";
import type { BillingInterval, OfferPlanResponse, OfferType } from "../../types";

type SlackUserType = "INDIVIDUAL" | "BUSINESS_ADMIN" | "BUSINESS_MEMBER";

type SlackUserVM = {
  id: number;
  email: string;
  type?: SlackUserType | null;
  offerType?: OfferType | null;
  admin?: boolean;
  regularUserSeats?: number;
  defaultLanguage: string | null;
  subscriptionStartedAt: string | null;
  nextBillingAt: string | null;
  workspaceUsed: number;
  workspaceLimit: number | null;
  stripeSubscription: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionActive: boolean;
    currentAmountCents?: number | null;
    currency?: string | null;
    workspaceLimit?: number | null;
    offerType?: OfferType | null;
    admin?: boolean;
    regularUserSeats?: number;
    regularUserEmails?: string[];
    availableRegularUserEmails?: string[];
  } | null;
  regularUserEmails?: string[];
  availableRegularUserEmails?: string[];
  handledWorkspaces: SlackWorkspaceVM[] | null;
  createdAt: string | null;
};

type SlackWorkspaceVM = {
  code: string;
  name: string;
  link: string | null;
};

type OrganizationVM = {
  id: number;
  companyName: string;
  nip: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  countryCode: string;
  billingEmail: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type BusinessOrganizationVM = {
  id?: number;
  companyName?: string | null;
};

type BusinessUserVM = {
  id: number;
  email: string;
  defaultLanguage: string | null;
  handledWorkspaces: SlackWorkspaceVM[];
  organization?: BusinessOrganizationVM | null;
};

type StripeSubscriptionVM = {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionActive: boolean;
  currentAmountCents?: number | null;
  currency?: string | null;
  workspaceLimit: number;
  offerType: OfferType;
  admin: boolean;
  regularUserSeats: number;
  regularUserEmails: string[];
};

type AccountDeletionVM = {
  activeSubscription: boolean;
  deletedUser: boolean;
};

type DangerAction =
  | "cancel-subscription"
  | "delete-account"
  | "add-workspace"
  | "remove-workspace"
  | "save-business-emails"
  | "add-business-seat"
  | "remove-business-seat";

type LanguageOption = {
  value: string;
  label: string;
};

type OrganizationFormState = {
  companyName: string;
  nip: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  countryCode: string;
  billingEmail: string;
};

type NoticeTone = "success" | "error" | "warning" | "muted";

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

const formatCurrencyAmount = (
  amountCents: number | null | undefined,
  currency: string | null | undefined
) => {
  if (amountCents === null || amountCents === undefined || !currency) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
};

const getBillingModelFromDates = (
  subscriptionStartedAt: string | null,
  nextBillingAt: string | null
) => {
  const interval = getBillingIntervalFromDates(
    subscriptionStartedAt,
    nextBillingAt
  );

  if (interval === "YEARLY") {
    return "Yearly billing";
  }

  if (interval === "MONTHLY") {
    return "Monthly billing";
  }

  return null;
};

const getBillingIntervalFromDates = (
  subscriptionStartedAt: string | null,
  nextBillingAt: string | null
): BillingInterval | null => {
  if (!subscriptionStartedAt || !nextBillingAt) {
    return null;
  }

  const started = new Date(subscriptionStartedAt);
  const nextBilling = new Date(nextBillingAt);

  if (Number.isNaN(started.getTime()) || Number.isNaN(nextBilling.getTime())) {
    return null;
  }

  const diffMs = nextBilling.getTime() - started.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays >= 300) {
    return "YEARLY";
  }

  if (diffDays >= 25) {
    return "MONTHLY";
  }

  return null;
};

const normalizeWorkspaceLink = (link: string | null) => {
  if (!link) {
    return "";
  }

  if (link.startsWith("http://") || link.startsWith("https://")) {
    return link;
  }

  return `https://${link}`;
};

const normalizeEmailList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const countryCodeRegex = /^[A-Za-z]{2}$/;
const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;

const emptyOrganizationForm: OrganizationFormState = {
  companyName: "",
  nip: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  countryCode: "",
  billingEmail: "",
};

const getSensitiveActionErrorMessage = (status: number, fallback: string) => {
  if (status === 400) {
    return "The request was rejected. Check the entered data and try again.";
  }

  if (status === 401 || status === 403) {
    return "Your session could not be verified. Sign in again and retry.";
  }

  if (status >= 500) {
    return "The server could not complete the operation. Try again later.";
  }

  return fallback;
};

const ui = {
  page: "min-h-screen bg-slate-950 text-white",
  header: "border-b border-white/10 bg-slate-950/80",
  headerInner:
    "mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4",
  brandWrap: "flex items-center gap-3",
  brandBadge:
    "flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40",
  brandText: "text-lg font-semibold tracking-tight",
  ghostLink:
    "text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
  shell: "mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-14",
  card: "rounded-3xl border border-white/10 bg-white/5 p-6",
  subCard: "rounded-2xl border border-white/10 bg-slate-950/60 p-4",
  emptyCard:
    "rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-white/60",
  detailCard:
    "flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/60 p-4",
  input:
    "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none",
  textarea:
    "w-full rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-400 focus:outline-none",
  select:
    "w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 pr-10 text-sm text-white focus:border-indigo-400 focus:outline-none",
  multiSelect:
    "h-56 w-full rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-sm text-white focus:border-indigo-400 focus:outline-none",
  primaryButton:
    "rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60",
  primaryButtonWide:
    "flex w-full items-center justify-center rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-60",
  secondaryButton:
    "rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20",
  iconButton:
    "rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50",
  tabBase:
    "rounded-full border px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300",
  tabActive:
    "border-indigo-400 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30",
  tabIdle: "border-white/20 bg-white/5 text-white/70 hover:bg-white/10",
};

function Notice({
  tone,
  children,
  className = "",
}: {
  tone: NoticeTone;
  children: ReactNode;
  className?: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
      : tone === "error"
      ? "border-rose-400/40 bg-rose-500/10 text-rose-100"
      : tone === "warning"
      ? "border-amber-300/30 bg-amber-500/10 text-amber-100"
      : "border-white/10 bg-slate-950/60 text-white/60";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-xs ${toneClass} ${className}`}>
      {children}
    </div>
  );
}

function DetailList({
  items,
}: {
  items: Array<{ label: string; value: string | number | null }>;
}) {
  return (
    <dl className="mt-3 space-y-4">
      {items.map((item) => (
        <div key={item.label} className={ui.detailCard}>
          <dt className="text-xs uppercase tracking-wide text-white/60">
            {item.label}
          </dt>
          <dd className="text-white">{formatValue(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${ui.tabBase} ${isActive ? ui.tabActive : ui.tabIdle}`}>
      {children}
    </button>
  );
}

function DangerConfirmModal({
  isOpen,
  eyebrow = "Danger zone",
  title,
  description,
  confirmLabel,
  accent = "danger",
  cancelLabel = "Keep account",
  isProcessing,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  eyebrow?: string;
  title: string;
  description: string;
  confirmLabel: string;
  accent?: "danger" | "success";
  cancelLabel?: string;
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  const containerClass =
    accent === "success"
      ? "border-emerald-400/30 bg-slate-900"
      : "border-rose-400/30 bg-slate-900";
  const eyebrowClass =
    accent === "success"
      ? "text-emerald-300"
      : "text-rose-300";
  const confirmButtonClass =
    accent === "success"
      ? "rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl shadow-black/40 ${containerClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${eyebrowClass}`}>
              {eyebrow}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
            Close
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/70">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={confirmButtonClass}>
            {isProcessing ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"general" | "payments" | "business">(
    "general"
  );
  const [user, setUser] = useState<SlackUserVM | null>(null);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
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
  const [availableBusinessEmails, setAvailableBusinessEmails] = useState<
    string[]
  >([]);
  const [usedBusinessEmails, setUsedBusinessEmails] = useState<string[]>([]);
  const [persistedUsedBusinessEmails, setPersistedUsedBusinessEmails] =
    useState<string[]>([]);
  const [selectedAvailableEmails, setSelectedAvailableEmails] = useState<
    string[]
  >([]);
  const [selectedUsedEmails, setSelectedUsedEmails] = useState<string[]>([]);
  const [availableEmailDraft, setAvailableEmailDraft] = useState("");
  const [organization, setOrganization] = useState<OrganizationVM | null>(null);
  const [currentOfferPlan, setCurrentOfferPlan] =
    useState<OfferPlanResponse | null>(null);
  const [organizationForm, setOrganizationForm] =
    useState<OrganizationFormState>(emptyOrganizationForm);
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(false);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [organizationNotice, setOrganizationNotice] = useState("");
  const [organizationError, setOrganizationError] = useState("");
  const [isSavingBusinessEmails, setIsSavingBusinessEmails] = useState(false);
  const [businessNotice, setBusinessNotice] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [businessEmailsConfirmText, setBusinessEmailsConfirmText] = useState("");
  const [memberLanguageDrafts, setMemberLanguageDrafts] = useState<
    Record<string, string>
  >({});
  const [businessUsers, setBusinessUsers] = useState<BusinessUserVM[]>([]);
  const [isLoadingBusinessUsers, setIsLoadingBusinessUsers] = useState(false);
  const [isSavingMemberLanguage, setIsSavingMemberLanguage] = useState<
    Record<string, boolean>
  >({});
  const [isUpdatingMemberWorkspace, setIsUpdatingMemberWorkspace] = useState<
    Record<string, boolean>
  >({});
  const [memberManagementNotice, setMemberManagementNotice] = useState("");
  const [memberManagementError, setMemberManagementError] = useState("");
  const [isUpdatingBusinessSeats, setIsUpdatingBusinessSeats] = useState(false);
  const [businessSeatsNotice, setBusinessSeatsNotice] = useState("");
  const [businessSeatsError, setBusinessSeatsError] = useState("");
  const [isUpdatingWorkspaceLimit, setIsUpdatingWorkspaceLimit] = useState(false);
  const [workspaceLimitNotice, setWorkspaceLimitNotice] = useState("");
  const [workspaceLimitError, setWorkspaceLimitError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [dangerNotice, setDangerNotice] = useState("");
  const [dangerError, setDangerError] = useState("");
  const [pendingDangerAction, setPendingDangerAction] =
    useState<DangerAction | null>(null);
  const slackClientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
  const slackOauthConfigured = Boolean(slackClientId);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      setRequiresAuth(false);
      try {
        const userResponse = await apiFetch("/users/me");

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
        const languageResponse = await apiFetch("/translate/languages");

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

  useEffect(() => {
    if (!organization) {
      setOrganizationForm(emptyOrganizationForm);
      setIsEditingOrganization(false);
      return;
    }

    setOrganizationForm({
      companyName: organization.companyName ?? "",
      nip: organization.nip ?? "",
      addressLine1: organization.addressLine1 ?? "",
      addressLine2: organization.addressLine2 ?? "",
      city: organization.city ?? "",
      postalCode: organization.postalCode ?? "",
      countryCode: organization.countryCode ?? "",
      billingEmail: organization.billingEmail ?? "",
    });
  }, [organization]);

  useEffect(() => {
    if (!user) {
      setAvailableBusinessEmails([]);
      setUsedBusinessEmails([]);
      setSelectedAvailableEmails([]);
      setSelectedUsedEmails([]);
      setMemberLanguageDrafts({});
      setBusinessUsers([]);
      setMemberManagementNotice("");
      setMemberManagementError("");
      return;
    }

    const used = normalizeEmailList(
      user.stripeSubscription?.regularUserEmails ?? user.regularUserEmails
    );
    const available = normalizeEmailList(
      user.stripeSubscription?.availableRegularUserEmails ??
        user.availableRegularUserEmails
    ).filter((email) => !used.includes(email));

    setUsedBusinessEmails(used);
    setPersistedUsedBusinessEmails(used);
    setAvailableBusinessEmails(available);
    setSelectedAvailableEmails([]);
    setSelectedUsedEmails([]);
    setAvailableEmailDraft("");
    setBusinessNotice("");
    setBusinessError("");
    setMemberManagementNotice("");
    setMemberManagementError("");
  }, [user]);

  const canAddToSlack =
    subscriptionActive &&
    slackOauthConfigured &&
    (user?.workspaceLimit ?? 0) > 0 &&
    user !== null &&
    user.workspaceUsed <= (user.workspaceLimit ?? 0);
  const currentOfferType =
    user?.stripeSubscription?.offerType ?? user?.offerType ?? null;
  const currentAdmin = user?.stripeSubscription?.admin ?? user?.admin ?? false;
  const currentRegularUserSeats =
    user?.stripeSubscription?.regularUserSeats ?? user?.regularUserSeats ?? 0;
  const currentUserType = user?.type ?? "INDIVIDUAL";
  const isBusinessAdmin = currentUserType === "BUSINESS_ADMIN";
  const isBusinessMember = currentUserType === "BUSINESS_MEMBER";
  const isBusinessOffer =
    currentOfferType === "BUSINESS" || isBusinessAdmin || isBusinessMember;
  const canManageBilling = !isBusinessMember;
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId || !isBusinessOffer) {
      setOrganization(null);
      setOrganizationForm(emptyOrganizationForm);
      setIsEditingOrganization(false);
      setOrganizationNotice("");
      setOrganizationError("");
      return;
    }

    let isMounted = true;

    const loadOrganization = async () => {
      setIsLoadingOrganization(true);
      setOrganizationError("");

      try {
        const response = await apiFetch("/organizations/me");

        if (response.status === 404) {
          if (isMounted) {
            setOrganization(null);
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load organization details.");
        }

        const data = (await response.json()) as OrganizationVM;

        if (isMounted) {
          setOrganization(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setOrganizationError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load organization details."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingOrganization(false);
        }
      }
    };

    void loadOrganization();

    return () => {
      isMounted = false;
    };
  }, [isBusinessOffer, userId]);

  const loadBusinessUsers = async () => {
    const response = await apiFetch("/users/me/business-users");

    if (!response.ok) {
      throw new Error("Unable to load business users.");
    }

    const data = (await response.json()) as BusinessUserVM[];

    setBusinessUsers(Array.isArray(data) ? data : []);
    setMemberLanguageDrafts(
      (Array.isArray(data) ? data : []).reduce<Record<string, string>>(
        (accumulator, member) => {
          accumulator[String(member.id)] = member.defaultLanguage ?? "";
          return accumulator;
        },
        {}
      )
    );
  };

  useEffect(() => {
    if (!isBusinessAdmin) {
      setBusinessUsers([]);
      setMemberLanguageDrafts({});
      setMemberManagementNotice("");
      setMemberManagementError("");
      return;
    }

    let isMounted = true;

    const run = async () => {
      setIsLoadingBusinessUsers(true);
      setMemberManagementError("");

      try {
        const response = await apiFetch("/users/me/business-users");

        if (!response.ok) {
          throw new Error("Unable to load business users.");
        }

        const data = (await response.json()) as BusinessUserVM[];

        if (!isMounted) {
          return;
        }

        setBusinessUsers(Array.isArray(data) ? data : []);
        setMemberLanguageDrafts(
          (Array.isArray(data) ? data : []).reduce<Record<string, string>>(
            (accumulator, member) => {
              accumulator[String(member.id)] = member.defaultLanguage ?? "";
              return accumulator;
            },
            {}
          )
        );
      } catch (loadError) {
        if (isMounted) {
          setMemberManagementError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load business users."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingBusinessUsers(false);
        }
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [isBusinessAdmin]);

  const currentBillingInterval = getBillingIntervalFromDates(
    user?.subscriptionStartedAt ?? null,
    user?.nextBillingAt ?? null
  );

  useEffect(() => {
    if (!currentOfferType || !currentBillingInterval) {
      setCurrentOfferPlan(null);
      return;
    }

    let isMounted = true;

    const loadCurrentOffer = async () => {
      try {
        const data = await fetchOfferPlan(currentOfferType, currentBillingInterval);

        if (isMounted) {
          setCurrentOfferPlan(data);
        }
      } catch {
        if (isMounted) {
          setCurrentOfferPlan(null);
        }
      }
    };

    void loadCurrentOffer();

    return () => {
      isMounted = false;
    };
  }, [currentBillingInterval, currentOfferType]);

  const profileDetails = useMemo(() => {
    if (!user) {
      return [];
    }
    return [
      { label: "Email", value: user.email },
      { label: "Offer type", value: currentOfferType },
      { label: "Workspace used", value: user.workspaceUsed },
      { label: "Created at", value: formatDateTime(user.createdAt) },
    ];
  }, [currentOfferType, user]);

  const businessDetails = useMemo(() => {
    if (!user || currentOfferType !== "BUSINESS") {
      return [];
    }

    return [
      { label: "Admin", value: currentAdmin ? "Yes" : "No" },
      { label: "Regular user seats", value: currentRegularUserSeats },
    ];
  }, [currentAdmin, currentOfferType, currentRegularUserSeats, user]);

  const organizationDetails = useMemo(() => {
    if (!organization) {
      return [];
    }

    return [
      { label: "Company name", value: organization.companyName },
      { label: "NIP", value: organization.nip },
      { label: "Address line 1", value: organization.addressLine1 },
      { label: "Address line 2", value: organization.addressLine2 },
      { label: "City", value: organization.city },
      { label: "Postal code", value: organization.postalCode },
      { label: "Country code", value: organization.countryCode },
      { label: "Billing email", value: organization.billingEmail },
      { label: "Created at", value: formatDateTime(organization.createdAt) },
      { label: "Updated at", value: formatDateTime(organization.updatedAt) },
    ];
  }, [organization]);

  const businessMemberRows = useMemo(
    () =>
      businessUsers.map((member) => ({
        id: member.id,
        email: member.email,
        workspaceUsed: member.handledWorkspaces?.length ?? 0,
        defaultLanguage: memberLanguageDrafts[String(member.id)] ?? "",
        handledWorkspaces: member.handledWorkspaces ?? [],
      })),
    [businessUsers, memberLanguageDrafts]
  );

  const billingDetails = useMemo(() => {
    if (!user) {
      return [];
    }

    const currentAmount = formatCurrencyAmount(
      user.stripeSubscription?.currentAmountCents,
      user.stripeSubscription?.currency
    );
    const billingModel = getBillingModelFromDates(
      user.subscriptionStartedAt,
      user.nextBillingAt
    );

    return [
      {
        label: "Subscription started",
        value: formatDateTime(user.subscriptionStartedAt),
      },
      { label: "Next billing", value: formatDateTime(user.nextBillingAt) },
      {
        label: "Current amount",
        value:
          currentAmount && billingModel
            ? `${currentAmount} (${billingModel})`
            : currentAmount,
      },
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

  const businessSeatPriceText = useMemo(() => {
    if (!currentOfferPlan || !currentBillingInterval) {
      return null;
    }

    const amount =
      currentBillingInterval === "MONTHLY"
        ? currentOfferPlan.pricePerMonthUsd
        : currentOfferPlan.pricePerYearUsd;

    if (!Number.isFinite(amount)) {
      return null;
    }

    const formattedAmount = formatUsdPrice(amount);

    if (currentBillingInterval === "YEARLY") {
      return `${formattedAmount} charged immediately for the full year`;
    }

    return `${formattedAmount} added to your monthly billing`;
  }, [currentBillingInterval, currentOfferPlan]);

  const workspacePriceText = useMemo(() => {
    if (!currentOfferPlan || !currentBillingInterval) {
      return null;
    }

    const amount = currentOfferPlan.additionalWorkspacePriceUsd;

    if (!Number.isFinite(amount)) {
      return null;
    }

    const formattedAmount = formatUsdPrice(amount);
    const perUserSuffix = currentOfferPlan.additionalWorkspacePricedPerUser
      ? " calculated per user"
      : "";

    if (currentBillingInterval === "YEARLY") {
      return `${formattedAmount} charged immediately for the full year billing${perUserSuffix}`;
    }

    return `${formattedAmount} added to your monthly billing${perUserSuffix}`;
  }, [currentBillingInterval, currentOfferPlan]);

  const applyStripeSubscriptionState = (data: StripeSubscriptionVM) => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        offerType: data.offerType,
        admin: data.admin,
        regularUserSeats: data.regularUserSeats,
        workspaceLimit: data.workspaceLimit,
        regularUserEmails: data.regularUserEmails,
        stripeSubscription: {
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          subscriptionActive: data.subscriptionActive,
          currentAmountCents: data.currentAmountCents,
          currency: data.currency,
          workspaceLimit: data.workspaceLimit,
          offerType: data.offerType,
          admin: data.admin,
          regularUserSeats: data.regularUserSeats,
          regularUserEmails: data.regularUserEmails,
          availableRegularUserEmails:
            prev.stripeSubscription?.availableRegularUserEmails ??
            prev.availableRegularUserEmails,
        },
      };
    });
  };

  useEffect(() => {
    if (!isBusinessOffer && activeTab === "business") {
      setActiveTab("general");
    }
  }, [activeTab, isBusinessOffer]);

  useEffect(() => {
    if (!canManageBilling && activeTab === "payments") {
      setActiveTab("general");
    }

    if (isBusinessMember && activeTab === "business") {
      setActiveTab("general");
    }
  }, [activeTab, canManageBilling, isBusinessMember]);

  const handleSave = async () => {
    setIsSaving(true);
    setNotice("");
    setError("");

    if (!isReasonableLength(defaultLanguage, LANGUAGE_MAX_LENGTH)) {
      setError("Default language value is too long.");
      setIsSaving(false);
      return;
    }

    if (hasControlChars(defaultLanguage)) {
      setError("Default language contains invalid characters.");
      setIsSaving(false);
      return;
    }

    try {
      const payload = {
        defaultLanguage: defaultLanguage.trim(),
      };

      const response = await apiFetch("/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
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

    if (!currentPassword) {
      setPasswordError("Enter your current password to confirm this change.");
      setIsSavingPassword(false);
      return;
    }

    if (!password) {
      setPasswordError("Enter a new password.");
      setIsSavingPassword(false);
      return;
    }

    if (
      !isReasonableLength(currentPassword, PASSWORD_MAX_LENGTH) ||
      !isReasonableLength(password, PASSWORD_MAX_LENGTH) ||
      !isReasonableLength(confirmPassword, PASSWORD_MAX_LENGTH)
    ) {
      setPasswordError("Password fields are too long.");
      setIsSavingPassword(false);
      return;
    }

    if (
      hasControlChars(currentPassword) ||
      hasControlChars(password) ||
      hasControlChars(confirmPassword)
    ) {
      setPasswordError("Password fields contain invalid characters.");
      setIsSavingPassword(false);
      return;
    }

    if (currentPassword === password) {
      setPasswordError("The new password must be different from the current password.");
      setIsSavingPassword(false);
      return;
    }

    if (!passwordStrengthRegex.test(password)) {
      setPasswordError(
        "Use at least 12 characters, including uppercase, lowercase and a number."
      );
      setIsSavingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setIsSavingPassword(false);
      return;
    }

    try {
      const response = await apiFetch("/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, password }),
      });

      if (!response.ok) {
        throw new Error(
          getSensitiveActionErrorMessage(
            response.status,
            "Unable to update password."
          )
        );
      }

      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setPasswordNotice("Password updated. Please sign in again.");
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
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

  const moveEmailsToUsed = () => {
    if (selectedAvailableEmails.length === 0) {
      return;
    }

    setUsedBusinessEmails((prev) =>
      Array.from(new Set([...prev, ...selectedAvailableEmails]))
    );
    setAvailableBusinessEmails((prev) =>
      prev.filter((email) => !selectedAvailableEmails.includes(email))
    );
    setSelectedAvailableEmails([]);
  };

  const handleAddAvailableEmails = () => {
    if (!isReasonableLength(availableEmailDraft, EMAIL_LIST_TEXT_MAX_LENGTH)) {
      setBusinessError("The email list is too long.");
      return;
    }

    if (hasControlChars(availableEmailDraft.replace(/\r?\n/g, ""))) {
      setBusinessError("The email list contains invalid characters.");
      return;
    }

    const parsedEmails = Array.from(
      new Set(
        availableEmailDraft
          .split(/\r?\n/)
          .map((item) => normalizeEmail(item))
          .filter(Boolean)
      )
    );

    if (parsedEmails.length === 0) {
      setBusinessError("Enter at least one email.");
      return;
    }

    const invalidEmails = parsedEmails.filter(
      (email) =>
        !isReasonableLength(email, EMAIL_LIST_ITEM_MAX_LENGTH) ||
        hasControlChars(email) ||
        !emailRegex.test(email)
    );
    if (invalidEmails.length > 0) {
      setBusinessError(`Invalid email format: ${invalidEmails.join(", ")}`);
      return;
    }

    setBusinessError("");
    setBusinessNotice("");
    setUsedBusinessEmails((prev) =>
      Array.from(new Set([...prev, ...parsedEmails]))
    );
    setAvailableBusinessEmails((prev) =>
      prev.filter((email) => !parsedEmails.includes(email))
    );
    setBusinessNotice("Emails added to used list.");
    setAvailableEmailDraft("");
  };

  const moveEmailsToAvailable = () => {
    if (selectedUsedEmails.length === 0) {
      return;
    }

    setAvailableBusinessEmails((prev) =>
      Array.from(new Set([...prev, ...selectedUsedEmails]))
    );
    setUsedBusinessEmails((prev) =>
      prev.filter((email) => !selectedUsedEmails.includes(email))
    );
    setSelectedUsedEmails([]);
  };

  const executeBusinessEmailsSubmit = async () => {
    if (!user) {
      return;
    }

    setIsSavingBusinessEmails(true);
    setBusinessNotice("");
    setBusinessError("");

    try {
      const addedEmails = usedBusinessEmails.filter(
        (email) => !persistedUsedBusinessEmails.includes(email)
      );
      const removedEmails = persistedUsedBusinessEmails.filter(
        (email) => !usedBusinessEmails.includes(email)
      );

      if (addedEmails.length === 0 && removedEmails.length === 0) {
        setBusinessNotice("No changes to save.");
        return;
      }

      for (const email of addedEmails) {
        const response = await apiFetch("/users/me/business-users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error(
            getSensitiveActionErrorMessage(
              response.status,
              `Unable to add business user email: ${email}`
            )
          );
        }
      }

      for (const email of removedEmails) {
        const response = await apiFetch(
          `/users/me/business-users?email=${encodeURIComponent(email)}`,
          {
          method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error(
            getSensitiveActionErrorMessage(
              response.status,
              `Unable to remove business user email: ${email}`
            )
          );
        }

        const data = (await response.json()) as StripeSubscriptionVM;
        applyStripeSubscriptionState(data);
      }

      setBusinessNotice("Business emails updated.");
      setBusinessEmailsConfirmText("");
      setPersistedUsedBusinessEmails(usedBusinessEmails);
      setUser((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          regularUserEmails: usedBusinessEmails,
          stripeSubscription: prev.stripeSubscription
            ? {
                ...prev.stripeSubscription,
                regularUserEmails: usedBusinessEmails,
              }
            : prev.stripeSubscription,
        };
      });
    } catch (saveError) {
      setBusinessError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update business emails."
      );
    } finally {
      closeDangerModal();
      setIsSavingBusinessEmails(false);
    }
  };

  const handleBusinessEmailsSubmit = () => {
    if (!user) {
      return;
    }

    setBusinessNotice("");
    setBusinessError("");

    const addedEmails = usedBusinessEmails.filter(
      (email) => !persistedUsedBusinessEmails.includes(email)
    );
    const removedEmails = persistedUsedBusinessEmails.filter(
      (email) => !usedBusinessEmails.includes(email)
    );

    if (addedEmails.length === 0 && removedEmails.length === 0) {
      setBusinessNotice("No changes to save.");
      return;
    }

    const summaryParts = [
      addedEmails.length > 0
        ? `${addedEmails.length} email${addedEmails.length === 1 ? "" : "s"} added`
        : null,
      removedEmails.length > 0
        ? `${removedEmails.length} email${removedEmails.length === 1 ? "" : "s"} removed`
        : null,
    ].filter(Boolean);

    setBusinessEmailsConfirmText(
      `Are you sure you want to save these business email changes? ${summaryParts.join(
        " and "
      )}.`
    );
    setPendingDangerAction("save-business-emails");
  };

  const handleOrganizationFieldChange = (
    field: keyof OrganizationFormState,
    value: string
  ) => {
    setOrganizationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMemberLanguageDraftChange = (email: string, value: string) => {
    setMemberLanguageDrafts((prev) => ({
      ...prev,
      [email]: value,
    }));
  };

  const handleMemberLanguageSave = async (memberId: number) => {
    const draft = memberLanguageDrafts[String(memberId)] ?? "";

    setMemberManagementNotice("");
    setMemberManagementError("");

    if (!draft) {
      setMemberManagementError("Select a default language before saving.");
      return;
    }

    if (!isReasonableLength(draft, LANGUAGE_MAX_LENGTH) || hasControlChars(draft)) {
      setMemberManagementError("Default language contains invalid characters.");
      return;
    }

    setIsSavingMemberLanguage((prev) => ({ ...prev, [String(memberId)]: true }));

    try {
      const response = await apiFetch(`/users/me/business-users/${memberId}/language`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ defaultLanguage: draft }),
      });

      if (!response.ok) {
        throw new Error("Unable to update the business user language.");
      }

      const data = (await response.json()) as BusinessUserVM;
      setBusinessUsers((prev) =>
        prev.map((member) => (member.id === memberId ? data : member))
      );
      setMemberManagementNotice("Business user language updated.");
    } catch (saveError) {
      setMemberManagementError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the business user language."
      );
    } finally {
      setIsSavingMemberLanguage((prev) => ({
        ...prev,
        [String(memberId)]: false,
      }));
    }
  };

  const handleMemberWorkspaceAdd = async (memberId: number) => {
    setMemberManagementNotice("");
    setMemberManagementError("");

    setIsUpdatingMemberWorkspace((prev) => ({ ...prev, [String(memberId)]: true }));

    try {
      const response = await apiFetch(
        `/stripe/subscriptions/business-users/${memberId}/workspace`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to add a workspace for this business user.");
      }

      await loadBusinessUsers();
      setMemberManagementNotice("Workspace added to the business user.");
    } catch (saveError) {
      setMemberManagementError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to add a workspace for this business user."
      );
    } finally {
      setIsUpdatingMemberWorkspace((prev) => ({
        ...prev,
        [String(memberId)]: false,
      }));
    }
  };

  const handleMemberWorkspaceRemove = async (memberId: number) => {
    setMemberManagementNotice("");
    setMemberManagementError("");

    setIsUpdatingMemberWorkspace((prev) => ({ ...prev, [String(memberId)]: true }));

    try {
      const response = await apiFetch(
        `/stripe/subscriptions/business-users/${memberId}/workspace`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to remove a workspace for this business user.");
      }

      await loadBusinessUsers();
      setMemberManagementNotice("Workspace removed from the business user.");
    } catch (saveError) {
      setMemberManagementError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to remove a workspace for this business user."
      );
    } finally {
      setIsUpdatingMemberWorkspace((prev) => ({
        ...prev,
        [String(memberId)]: false,
      }));
    }
  };

  const handleStartOrganizationEdit = () => {
    setOrganizationNotice("");
    setOrganizationError("");
    setIsEditingOrganization(true);
  };

  const handleCancelOrganizationEdit = () => {
    setOrganizationNotice("");
    setOrganizationError("");
    setOrganizationForm(
      organization
        ? {
            companyName: organization.companyName ?? "",
            nip: organization.nip ?? "",
            addressLine1: organization.addressLine1 ?? "",
            addressLine2: organization.addressLine2 ?? "",
            city: organization.city ?? "",
            postalCode: organization.postalCode ?? "",
            countryCode: organization.countryCode ?? "",
            billingEmail: organization.billingEmail ?? "",
          }
        : emptyOrganizationForm
    );
    setIsEditingOrganization(false);
  };

  const handleOrganizationSave = async () => {
    if (!user || !isBusinessOffer) {
      return;
    }

    setIsSavingOrganization(true);
    setOrganizationNotice("");
    setOrganizationError("");

    const payload: OrganizationFormState = {
      companyName: organizationForm.companyName.trim(),
      nip: organizationForm.nip.trim(),
      addressLine1: organizationForm.addressLine1.trim(),
      addressLine2: organizationForm.addressLine2.trim(),
      city: organizationForm.city.trim(),
      postalCode: organizationForm.postalCode.trim(),
      countryCode: organizationForm.countryCode.trim().toUpperCase(),
      billingEmail: normalizeEmail(organizationForm.billingEmail),
    };

    const requiredFields: Array<[keyof OrganizationFormState, string]> = [
      ["companyName", "Company name"],
      ["nip", "NIP"],
      ["addressLine1", "Address line 1"],
      ["city", "City"],
      ["postalCode", "Postal code"],
      ["countryCode", "Country code"],
      ["billingEmail", "Billing email"],
    ];

    const missingField = requiredFields.find(([field]) => !payload[field]);

    if (missingField) {
      setOrganizationError(`${missingField[1]} is required.`);
      setIsSavingOrganization(false);
      return;
    }

    const lengthChecks: Array<[string, string, number]> = [
      [payload.companyName, "Company name", 255],
      [payload.nip, "NIP", 64],
      [payload.addressLine1, "Address line 1", 255],
      [payload.addressLine2, "Address line 2", 255],
      [payload.city, "City", 128],
      [payload.postalCode, "Postal code", 64],
      [payload.countryCode, "Country code", 2],
      [payload.billingEmail, "Billing email", 255],
    ];

    const invalidLength = lengthChecks.find(
      ([value, , maxLength]) => !isReasonableLength(value, maxLength)
    );

    if (invalidLength) {
      setOrganizationError(`${invalidLength[1]} is too long.`);
      setIsSavingOrganization(false);
      return;
    }

    const fieldsWithControlChars = [
      payload.companyName,
      payload.nip,
      payload.addressLine1,
      payload.addressLine2,
      payload.city,
      payload.postalCode,
      payload.countryCode,
      payload.billingEmail,
    ];

    if (fieldsWithControlChars.some((value) => hasControlChars(value))) {
      setOrganizationError("Organization fields contain invalid characters.");
      setIsSavingOrganization(false);
      return;
    }

    if (!countryCodeRegex.test(payload.countryCode)) {
      setOrganizationError("Country code must contain exactly two letters.");
      setIsSavingOrganization(false);
      return;
    }

    if (!emailRegex.test(payload.billingEmail)) {
      setOrganizationError("Billing email format is invalid.");
      setIsSavingOrganization(false);
      return;
    }

    try {
      const response = await apiFetch("/organizations/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to update organization details.");
      }

      const data = (await response.json()) as OrganizationVM;
      setOrganization(data);
      setOrganizationNotice("Organization details updated.");
      setIsEditingOrganization(false);
    } catch (saveError) {
      setOrganizationError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update organization details."
      );
    } finally {
      setIsSavingOrganization(false);
    }
  };

  const executeCancelSubscription = async () => {
    setDangerNotice("");
    setDangerError("");

    setIsCancellingSubscription(true);

    try {
      const response = await apiFetch("/stripe/subscriptions", {
        method: "DELETE",
      });

      if (response.status === 401 || response.status === 403) {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        setPendingDangerAction(null);
        setReauthNotice("Your session expired. Please sign in again.");
        setRequiresAuth(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to cancel subscription.");
      }

      const data = (await response.json()) as StripeSubscriptionVM;

      applyStripeSubscriptionState(data);
      setPendingDangerAction(null);
      setDangerNotice("Subscription cancelled.");
    } catch (cancelError) {
      setDangerError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel subscription."
      );
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const executeDeleteAccount = async () => {
    setDangerNotice("");
    setDangerError("");

    setIsDeletingAccount(true);

    try {
      const response = await apiFetch("/users/me", {
        method: "DELETE",
      });

      if (response.status === 401 || response.status === 403) {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        setPendingDangerAction(null);
        setReauthNotice("Your session expired. Please sign in again.");
        setRequiresAuth(true);
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | AccountDeletionVM
        | null;

      if (!response.ok) {
        throw new Error("Unable to delete account.");
      }

      if (data?.deletedUser) {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        setPendingDangerAction(null);
        setReauthNotice("Your account has been deleted.");
        setRequiresAuth(true);
        return;
      }

      if (data?.activeSubscription) {
        setDangerError(
          "You must cancel your active subscription before deleting the account."
        );
        return;
      }

      setDangerError("The account could not be deleted.");
    } catch (deleteError) {
      setDangerError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete account."
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelSubscription = () => {
    setDangerNotice("");
    setDangerError("");
    setPendingDangerAction("cancel-subscription");
  };

  const handleDeleteAccount = () => {
    setDangerNotice("");
    setDangerError("");
    setPendingDangerAction("delete-account");
  };

  const executeAddWorkspace = async () => {
    setWorkspaceLimitNotice("");
    setWorkspaceLimitError("");
    setIsUpdatingWorkspaceLimit(true);
    const workspaceEndpoint = isBusinessAdmin
      ? "/stripe/subscriptions/business-workspaces"
      : "/stripe/subscriptions/workspaces";

    try {
      const response = await apiFetch(workspaceEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ additionalWorkspaces: 1 }),
      });

      if (response.status === 401 || response.status === 403) {
        setWorkspaceLimitError(
          "Your session could not be verified. Sign in again and retry."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to add workspace.");
      }

      const data = (await response.json()) as StripeSubscriptionVM;
      applyStripeSubscriptionState(data);
      setPendingDangerAction(null);
      setWorkspaceLimitNotice("Workspace limit increased.");
    } catch (workspaceError) {
      setWorkspaceLimitError(
        workspaceError instanceof Error
          ? workspaceError.message
          : "Unable to add workspace."
      );
    } finally {
      setIsUpdatingWorkspaceLimit(false);
    }
  };

  const executeRemoveWorkspace = async () => {
    setWorkspaceLimitNotice("");
    setWorkspaceLimitError("");
    setIsUpdatingWorkspaceLimit(true);
    const workspaceEndpoint = isBusinessAdmin
      ? "/stripe/subscriptions/business-workspaces"
      : "/stripe/subscriptions/workspaces";

    try {
      const response = await apiFetch(workspaceEndpoint, {
        method: "DELETE",
      });

      if (response.status === 401 || response.status === 403) {
        setWorkspaceLimitError(
          "Your session could not be verified. Sign in again and retry."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to remove workspace.");
      }

      const data = (await response.json()) as StripeSubscriptionVM;
      applyStripeSubscriptionState(data);
      setPendingDangerAction(null);
      setWorkspaceLimitNotice("Workspace limit reduced.");
    } catch (workspaceError) {
      setWorkspaceLimitError(
        workspaceError instanceof Error
          ? workspaceError.message
          : "Unable to remove workspace."
      );
    } finally {
      setIsUpdatingWorkspaceLimit(false);
    }
  };

  const handleAddWorkspace = () => {
    setWorkspaceLimitNotice("");
    setWorkspaceLimitError("");
    setPendingDangerAction("add-workspace");
  };

  const handleRemoveWorkspace = () => {
    setWorkspaceLimitNotice("");
    setWorkspaceLimitError("");
    setPendingDangerAction("remove-workspace");
  };

  const executeAddBusinessSeat = async () => {
    setBusinessSeatsNotice("");
    setBusinessSeatsError("");
    setIsUpdatingBusinessSeats(true);

    try {
      const response = await apiFetch("/stripe/subscriptions/business-seats", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ additionalSeats: 1 }),
      });

      if (response.status === 401 || response.status === 403) {
        setBusinessSeatsError(
          "Your session could not be verified. Sign in again and retry."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to add a business seat.");
      }

      const data = (await response.json()) as StripeSubscriptionVM;
      applyStripeSubscriptionState(data);
      setPendingDangerAction(null);
      setBusinessSeatsNotice("Business seat added.");
    } catch (seatError) {
      setBusinessSeatsError(
        seatError instanceof Error
          ? seatError.message
          : "Unable to add a business seat."
      );
    } finally {
      setIsUpdatingBusinessSeats(false);
    }
  };

  const executeRemoveBusinessSeat = async () => {
    setBusinessSeatsNotice("");
    setBusinessSeatsError("");
    setIsUpdatingBusinessSeats(true);

    try {
      const response = await apiFetch("/stripe/subscriptions/business-seats", {
        method: "DELETE",
      });

      if (response.status === 401 || response.status === 403) {
        setBusinessSeatsError(
          "Your session could not be verified. Sign in again and retry."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to remove a business seat.");
      }

      const data = (await response.json()) as StripeSubscriptionVM;
      applyStripeSubscriptionState(data);
      setPendingDangerAction(null);
      setBusinessSeatsNotice("Business seat removed.");
    } catch (seatError) {
      setBusinessSeatsError(
        seatError instanceof Error
          ? seatError.message
          : "Unable to remove a business seat."
      );
    } finally {
      setIsUpdatingBusinessSeats(false);
    }
  };

  const handleAddBusinessSeat = () => {
    setBusinessSeatsNotice("");
    setBusinessSeatsError("");
    setPendingDangerAction("add-business-seat");
  };

  const handleRemoveBusinessSeat = () => {
    setBusinessSeatsNotice("");
    setBusinessSeatsError("");
    setPendingDangerAction("remove-business-seat");
  };

  const closeDangerModal = () => {
    if (isDeletingAccount) {
      return;
    }

    if (
      isCancellingSubscription ||
      isUpdatingWorkspaceLimit ||
      isSavingBusinessEmails ||
      isUpdatingBusinessSeats
    ) {
      return;
    }

    setBusinessEmailsConfirmText("");
    setPendingDangerAction(null);
  };

  if (requiresAuth) {
    return (
      <div className={ui.page}>
        <header className={ui.header}>
          <div className={ui.headerInner}>
            <div className={ui.brandWrap}>
              <div className={ui.brandBadge}>S</div>
              <span className={ui.brandText}>ThreadoAI</span>
            </div>
            <Link
              href="/"
              className={ui.ghostLink}>
              Back to home
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
          <section className={`${ui.card} p-8 text-center`}>
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
              className={`mt-6 inline-flex items-center justify-center ${ui.primaryButton}`}>
              Go to sign in
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <header className={ui.header}>
        <div className={ui.headerInner}>
          <div className={ui.brandWrap}>
            <div className={ui.brandBadge}>S</div>
            <span className={ui.brandText}>ThreadoAI</span>
          </div>
          <Link href="/" className={ui.ghostLink}>
            Back to home
          </Link>
        </div>
      </header>

      <main className={ui.shell}>
        {user ? (
          <section className="space-y-3">
            {!user.stripeSubscription ? (
              <Link
                href="/offers"
                className="flex w-full flex-col items-center justify-center gap-1 rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200">
                <span>Start subscription</span>
                <span className="text-xs font-medium text-rose-50/90">
                  Go to plan selection
                </span>
              </Link>
            ) : subscriptionActive ? (
              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center rounded-3xl bg-emerald-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-80">
                Subscription active
              </button>
            ) : (
              <Link
                href="/offers"
                className="flex w-full items-center justify-center rounded-3xl bg-rose-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200">
                Purchase subscription
              </Link>
            )}
          </section>
        ) : null}
        <section className="flex flex-wrap items-center gap-3">
          <TabButton
            isActive={activeTab === "general"}
            onClick={() => setActiveTab("general")}>
            General information
          </TabButton>
          {canManageBilling ? (
            <TabButton
              isActive={activeTab === "payments"}
              onClick={() => setActiveTab("payments")}>
              Payments
            </TabButton>
          ) : null}
          {isBusinessOffer && !isBusinessMember ? (
            <TabButton
              isActive={activeTab === "business"}
              onClick={() => setActiveTab("business")}>
              Business
            </TabButton>
          ) : null}
        </section>

        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Admin settings
          </div>
          <h1 className="text-3xl font-semibold text-white">Admin profile</h1>
          <p className="text-sm text-white/70">
            Review your ThreadoAI admin details and update your default language
            preferences.
          </p>
        </section>

        <section
          className={`grid gap-8 ${
            activeTab === "general" ? "lg:grid-cols-[1.1fr_0.9fr]" : ""
          }`}>
          <div className={ui.card}>
            <h2 className="text-lg font-semibold text-white">
              {activeTab === "general"
                ? "Profile overview"
                : activeTab === "payments"
                ? "Payment details"
                : "Business details"}
            </h2>
            {activeTab === "general" ? (
              <p className="mt-2 text-sm text-white/60">
                All fields are read-only except handled emails and default
                language.
              </p>
            ) : activeTab === "payments" ? (
              <p className="mt-2 text-sm text-white/60">
                Subscription and billing information for your account.
              </p>
            ) : (
              <p className="mt-2 text-sm text-white/60">
                Business-only account information.
              </p>
            )}
            {isLoading ? (
              <div className={`mt-6 ${ui.emptyCard}`}>
                Loading admin profile...
              </div>
            ) : error ? (
              <Notice tone="error" className="mt-6 p-4 text-sm">
                {error}
              </Notice>
            ) : (
              <div className="mt-6 space-y-6 text-sm">
                {activeTab === "general" ? (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Handled workspaces
                      </h3>
                      {user?.handledWorkspaces &&
                      user.handledWorkspaces.length > 0 ? (
                        <ul className="mt-3 space-y-4">
                          {user.handledWorkspaces.map((workspace) => (
                            <li
                              key={workspace.code}
                              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-white/60">
                                  Workspace name
                                </p>
                                <p className="text-white">{workspace.name}</p>
                              </div>
                              <a
                                href={normalizeWorkspaceLink(workspace.link)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                                Go to workspace
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-white/60">
                          No handled workspaces connected yet.
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Account details
                      </h3>
                      <DetailList items={profileDetails} />
                      {canManageBilling ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                          <p className="text-xs uppercase tracking-wide text-white/60">
                            Workspace limit
                          </p>
                          <p className="mt-1 text-white">
                            {formatValue(user?.workspaceLimit ?? null)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleAddWorkspace}
                              disabled={isUpdatingWorkspaceLimit}
                              className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                              Add workspace
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveWorkspace}
                              disabled={isUpdatingWorkspaceLimit}
                              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60">
                              Remove workspace
                            </button>
                          </div>
                          {workspaceLimitNotice ? (
                            <p className="mt-3 text-xs text-emerald-200">
                              {workspaceLimitNotice}
                            </p>
                          ) : null}
                          {workspaceLimitError ? (
                            <Notice tone="error" className="mt-3">
                              {workspaceLimitError}
                            </Notice>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-rose-100">
                          Danger zone
                        </h3>
                        <p className="text-xs text-rose-100/80">
                          Sensitive account actions live here. These actions will
                          require confirmation before they are enabled.
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {canManageBilling ? (
                          <button
                            type="button"
                            onClick={handleCancelSubscription}
                            className="rounded-full border border-rose-300/40 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/10">
                            Cancel subscription
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60">
                          {isDeletingAccount ? "Deleting..." : "Delete account"}
                        </button>
                      </div>
                      {dangerNotice ? (
                        <p className="mt-3 text-xs text-rose-100/80">
                          {dangerNotice}
                        </p>
                      ) : null}
                      {dangerError ? (
                        <Notice tone="error" className="mt-3">
                          {dangerError}
                        </Notice>
                      ) : null}
                    </div>
                  </>
                ) : activeTab === "payments" ? (
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Payment details
                    </h3>
                    <DetailList items={billingDetails} />
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Business details
                    </h3>
                    <div className={`mt-3 ${ui.subCard}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-white/60">
                            Current business seats
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {formatValue(currentRegularUserSeats)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleAddBusinessSeat}
                            disabled={isUpdatingBusinessSeats}
                            className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                            Add seat
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveBusinessSeat}
                            disabled={isUpdatingBusinessSeats}
                            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60">
                            Remove seat
                          </button>
                        </div>
                      </div>
                      {businessSeatsNotice ? (
                        <p className="mt-3 text-xs text-emerald-200">
                          {businessSeatsNotice}
                        </p>
                      ) : null}
                      {businessSeatsError ? (
                        <Notice tone="error" className="mt-3">
                          {businessSeatsError}
                        </Notice>
                      ) : null}
                    </div>
                    {businessDetails.length > 0 ? (
                      <div className="mt-6">
                        <DetailList items={businessDetails} />
                      </div>
                    ) : (
                      <div className={`mt-6 ${ui.emptyCard}`}>
                        No business details available.
                      </div>
                    )}
                    <div className={`mt-6 ${ui.subCard}`}>
                      <h4 className="text-sm font-semibold text-white">
                        Business user emails
                      </h4>
                      <p className="mt-1 text-xs text-white/60">
                        Assign emails with arrows like Salesforce dual listbox.
                        Left side is remove list, right side is used list.
                      </p>

                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/60">
                          Add available emails (one per line)
                        </label>
                        <textarea
                          value={availableEmailDraft}
                          onChange={(event) => setAvailableEmailDraft(event.target.value)}
                          rows={4}
                          maxLength={EMAIL_LIST_TEXT_MAX_LENGTH}
                          placeholder={"user1@example.com\nuser2@example.com"}
                          className={ui.textarea}
                        />
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={handleAddAvailableEmails}
                            className={ui.secondaryButton}>
                            Add to used
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/60">
                            Remove emails
                          </label>
                          <select
                            multiple
                            value={selectedAvailableEmails}
                            onChange={(event) =>
                              setSelectedAvailableEmails(
                                Array.from(event.target.selectedOptions).map(
                                  (option) => option.value
                                )
                              )
                            }
                            className={ui.multiSelect}>
                            {availableBusinessEmails.map((email) => (
                              <option key={`available-${email}`} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-row justify-center gap-2 lg:flex-col">
                          <button
                            type="button"
                            onClick={moveEmailsToUsed}
                            disabled={selectedAvailableEmails.length === 0}
                            className={ui.iconButton}>
                            &gt;
                          </button>
                          <button
                            type="button"
                            onClick={moveEmailsToAvailable}
                            disabled={selectedUsedEmails.length === 0}
                            className={ui.iconButton}>
                            &lt;
                          </button>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/60">
                            Used emails
                          </label>
                          <select
                            multiple
                            value={selectedUsedEmails}
                            onChange={(event) =>
                              setSelectedUsedEmails(
                                Array.from(event.target.selectedOptions).map(
                                  (option) => option.value
                                )
                              )
                            }
                            className={ui.multiSelect}>
                            {usedBusinessEmails.map((email) => (
                              <option key={`used-${email}`} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleBusinessEmailsSubmit}
                          disabled={isSavingBusinessEmails}
                          className={ui.primaryButton}>
                          {isSavingBusinessEmails ? "Submitting..." : "Submit"}
                        </button>
                        {businessNotice ? (
                          <span className="text-xs font-medium text-emerald-200">
                            {businessNotice}
                          </span>
                        ) : null}
                      </div>
                      {businessError ? (
                        <Notice tone="error" className="mt-3">
                          {businessError}
                        </Notice>
                      ) : null}
                    </div>
                    {isBusinessAdmin ? (
                      <div className={`mt-6 ${ui.subCard}`}>
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold text-white">
                            Business members
                          </h4>
                          {isLoadingBusinessUsers ? (
                            <span className="text-xs text-white/60">Loading...</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-white/60">
                          Manage each business user workspace and default language.
                        </p>
                        {businessMemberRows.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            {businessMemberRows.map((member) => (
                              <div
                                key={member.id}
                                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="grid gap-4 lg:grid-cols-[1.5fr_0.7fr_1.1fr_1fr] lg:items-end">
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-white/60">
                                      User email
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-white">
                                      {member.email}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-white/60">
                                      Workspaces
                                    </p>
                                    <p className="mt-1 text-sm text-white">
                                      {member.workspaceUsed}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-xs uppercase tracking-wide text-white/60">
                                      Default language
                                    </label>
                                    <select
                                      value={member.defaultLanguage}
                                      onChange={(event) =>
                                        handleMemberLanguageDraftChange(
                                          String(member.id),
                                          event.target.value
                                        )
                                      }
                                      className={ui.select}>
                                      <option value="">Select a language</option>
                                      {languages.map((option) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleMemberLanguageSave(member.id)}
                                      disabled={Boolean(
                                        isSavingMemberLanguage[String(member.id)]
                                      )}
                                      className="mt-3 w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60">
                                      {isSavingMemberLanguage[String(member.id)]
                                        ? "Saving..."
                                        : "Save language"}
                                    </button>
                                  </div>
                                  <div className="flex flex-col gap-3 lg:pb-[2px]">
                                    <button
                                      type="button"
                                      onClick={() => handleMemberWorkspaceAdd(member.id)}
                                      disabled={Boolean(
                                        isUpdatingMemberWorkspace[String(member.id)]
                                      )}
                                      className={ui.secondaryButton}>
                                      {isUpdatingMemberWorkspace[String(member.id)]
                                        ? "Updating..."
                                        : "Add workspace"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMemberWorkspaceRemove(member.id)
                                      }
                                      disabled={Boolean(
                                        isUpdatingMemberWorkspace[String(member.id)]
                                      )}
                                      className={ui.secondaryButton}>
                                      {isUpdatingMemberWorkspace[String(member.id)]
                                        ? "Updating..."
                                        : "Remove workspace"}
                                    </button>
                                  </div>
                                </div>
                                {member.handledWorkspaces.length > 0 ? (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {member.handledWorkspaces.map((workspace) => (
                                      <span
                                        key={`${member.id}-${workspace.code}`}
                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                                        {workspace.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`mt-4 ${ui.emptyCard}`}>
                            {isLoadingBusinessUsers
                              ? "Loading business members..."
                              : "No business members available yet."}
                          </div>
                        )}
                        {memberManagementNotice ? (
                          <p className="mt-3 text-xs text-amber-200">
                            {memberManagementNotice}
                          </p>
                        ) : null}
                        {memberManagementError ? (
                          <Notice tone="error" className="mt-3">
                            {memberManagementError}
                          </Notice>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={`mt-6 ${ui.subCard}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-semibold text-white">
                          Organization details
                        </h4>
                        {isLoadingOrganization ? (
                          <span className="text-xs text-white/60">Loading...</span>
                        ) : organization ? (
                          <button
                            type="button"
                            onClick={
                              isEditingOrganization
                                ? handleCancelOrganizationEdit
                                : handleStartOrganizationEdit
                            }
                            className={ui.secondaryButton}>
                            {isEditingOrganization ? "Cancel" : "Edit"}
                          </button>
                        ) : null}
                      </div>
                      {organizationDetails.length > 0 && !isEditingOrganization ? (
                        <div className="mt-4">
                          <DetailList items={organizationDetails} />
                        </div>
                      ) : organization && isEditingOrganization ? (
                        <>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="text-sm font-medium text-white">
                                Company name
                              </label>
                              <input
                                type="text"
                                value={organizationForm.companyName}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "companyName",
                                    event.target.value
                                  )
                                }
                                maxLength={255}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                NIP
                              </label>
                              <input
                                type="text"
                                value={organizationForm.nip}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "nip",
                                    event.target.value
                                  )
                                }
                                maxLength={64}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                Address line 1
                              </label>
                              <input
                                type="text"
                                value={organizationForm.addressLine1}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "addressLine1",
                                    event.target.value
                                  )
                                }
                                maxLength={255}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                Address line 2
                              </label>
                              <input
                                type="text"
                                value={organizationForm.addressLine2}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "addressLine2",
                                    event.target.value
                                  )
                                }
                                maxLength={255}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                City
                              </label>
                              <input
                                type="text"
                                value={organizationForm.city}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "city",
                                    event.target.value
                                  )
                                }
                                maxLength={128}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                Postal code
                              </label>
                              <input
                                type="text"
                                value={organizationForm.postalCode}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "postalCode",
                                    event.target.value
                                  )
                                }
                                maxLength={64}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                Country code
                              </label>
                              <input
                                type="text"
                                value={organizationForm.countryCode}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "countryCode",
                                    event.target.value.toUpperCase()
                                  )
                                }
                                maxLength={2}
                                className={ui.input}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-white">
                                Billing email
                              </label>
                              <input
                                type="email"
                                value={organizationForm.billingEmail}
                                onChange={(event) =>
                                  handleOrganizationFieldChange(
                                    "billingEmail",
                                    event.target.value
                                  )
                                }
                                maxLength={255}
                                className={ui.input}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={handleOrganizationSave}
                              disabled={isSavingOrganization || isLoadingOrganization}
                              className={ui.primaryButton}>
                              {isSavingOrganization ? "Saving..." : "Save changes"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelOrganizationEdit}
                              disabled={isSavingOrganization}
                              className={ui.secondaryButton}>
                              Cancel
                            </button>
                            {organizationNotice ? (
                              <span className="text-xs font-medium text-emerald-200">
                                {organizationNotice}
                              </span>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <div className={`mt-4 ${ui.emptyCard}`}>
                          No organization details available.
                        </div>
                      )}
                      {organizationError ? (
                        <Notice tone="error" className="mt-4">
                          {organizationError}
                        </Notice>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`${ui.card} ${
              activeTab !== "general" ? "hidden" : ""
            }`}>
            <h2 className="text-lg font-semibold text-white">
              Editable settings
            </h2>
            <div className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-white">
                  Workspace usage
                </label>
                <div className={`mt-3 ${ui.subCard}`}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/70">Used workspaces</span>
                    <span className="font-semibold text-white">
                      {formatValue(user?.workspaceUsed ?? null)} /{" "}
                      {formatValue(user?.workspaceLimit ?? null)}
                    </span>
                  </div>
                  {canAddToSlack ? (
                    <a
                      href="/api/slack/oauth/start"
                      className={`mt-4 flex w-full items-center justify-center ${ui.primaryButton}`}>
                      Add to Slack
                    </a>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-600/70 px-5 py-2 text-sm font-semibold text-slate-300">
                        Add to Slack
                      </button>
                      <Notice tone="warning" className="flex items-center justify-between gap-3 text-xs">
                        <span>
                          {!subscriptionActive
                            ? "Purchase and activate a subscription to connect Slack."
                            : slackOauthConfigured
                            ? "Workspace limit reached."
                            : "Slack OAuth is not configured (NEXT_PUBLIC_SLACK_CLIENT_ID)."}
                        </span>
                        <Link
                          href="/offers"
                          className="rounded-full bg-amber-400 px-3 py-1 font-semibold text-amber-950 transition hover:bg-amber-300">
                          Add workspace
                        </Link>
                      </Notice>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white">
                  Default language
                </label>
                <p className="mt-1 text-xs text-white/60">
                  Choose the default Translate language.
                </p>
                <div className="relative mt-3">
                  <select
                    value={defaultLanguage}
                    onChange={(event) => setDefaultLanguage(event.target.value)}
                    className={ui.select}>
                    <option value="">Select a language</option>
                    {languages.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/70">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="size-4"
                      aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.939a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className={ui.primaryButtonWide}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              {notice ? (
                <Notice tone="success">
                  {notice}
                </Notice>
              ) : null}
              {error ? (
                <Notice tone="error">
                  {error}
                </Notice>
              ) : null}
              <div className="pt-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <h3 className="text-sm font-semibold text-white">
                    Change password
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    Confirm with your current password. The new password must
                    have at least 12 characters, including uppercase,
                    lowercase and a number.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-white/70">
                        Current password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        autoComplete="current-password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        className={ui.input}
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-white/70">
                        New password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        className={ui.input}
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
                        autoComplete="new-password"
                        maxLength={PASSWORD_MAX_LENGTH}
                        className={ui.input}
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordSave}
                    disabled={isSavingPassword || isLoading}
                    className="mt-4 flex w-full items-center justify-center rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60">
                    {isSavingPassword ? "Updating..." : "Change password"}
                  </button>
                  {passwordNotice ? (
                    <Notice tone="success" className="mt-3">
                      {passwordNotice}
                    </Notice>
                  ) : null}
                  {passwordError ? (
                    <Notice tone="error" className="mt-3">
                      {passwordError}
                    </Notice>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <DangerConfirmModal
        isOpen={pendingDangerAction === "cancel-subscription"}
        title="Cancel subscription"
        description="Are you sure you want to cancel your subscription? This will disable your active subscription for the current workspace plan."
        confirmLabel="Confirm cancellation"
        isProcessing={isCancellingSubscription}
        onCancel={closeDangerModal}
        onConfirm={executeCancelSubscription}
      />
      <DangerConfirmModal
        isOpen={pendingDangerAction === "delete-account"}
        title="Delete account"
        description="This action permanently deletes your account. If you still have an active subscription, the API may reject the request until the subscription is cancelled."
        confirmLabel="Delete account"
        isProcessing={isDeletingAccount}
        onCancel={closeDangerModal}
        onConfirm={executeDeleteAccount}
      />
      <DangerConfirmModal
        isOpen={pendingDangerAction === "add-workspace"}
        eyebrow="Workspace update"
        title="Add one workspace"
        description={
          workspacePriceText
            ? `Are you sure you want to add one workspace? This workspace will cost ${workspacePriceText}. You can find how much you currently pay in Payments -> Current amount.`
            : "Are you sure you want to add one workspace? You can find how much you currently pay in Payments -> Current amount."
        }
        confirmLabel="Add workspace"
        accent="success"
        cancelLabel="Not now"
        isProcessing={isUpdatingWorkspaceLimit}
        onCancel={closeDangerModal}
        onConfirm={executeAddWorkspace}
      />
      <DangerConfirmModal
        isOpen={pendingDangerAction === "remove-workspace"}
        eyebrow="Workspace update"
        title="Remove one workspace"
        description={
          workspacePriceText
            ? `Are you sure you want to remove one workspace? This removes the workspace priced at ${workspacePriceText}. You can find how much you currently pay in Payments -> Current amount.`
            : "Are you sure you want to remove one workspace? You can find how much you currently pay in Payments -> Current amount."
        }
        confirmLabel="Remove workspace"
        accent="success"
        cancelLabel="Keep current limit"
        isProcessing={isUpdatingWorkspaceLimit}
        onCancel={closeDangerModal}
        onConfirm={executeRemoveWorkspace}
      />
      <DangerConfirmModal
        isOpen={pendingDangerAction === "save-business-emails"}
        eyebrow="Business update"
        title="Save business emails"
        description={businessEmailsConfirmText}
        confirmLabel="Save changes"
        accent="success"
        cancelLabel="Not now"
        isProcessing={isSavingBusinessEmails}
        onCancel={closeDangerModal}
        onConfirm={executeBusinessEmailsSubmit}
      />
      <DangerConfirmModal
        isOpen={pendingDangerAction === "add-business-seat"}
        eyebrow="Business update"
        title="Add one business seat"
        description={
          businessSeatPriceText
            ? `Are you sure you want to add one business seat to this subscription? This seat will cost ${businessSeatPriceText}.`
            : "Are you sure you want to add one business seat to this subscription?"
        }
        confirmLabel="Add seat"
        accent="success"
        cancelLabel="Not now"
        isProcessing={isUpdatingBusinessSeats}
        onCancel={closeDangerModal}
        onConfirm={executeAddBusinessSeat}
      />
      <DangerConfirmModal
        isOpen={pendingDangerAction === "remove-business-seat"}
        eyebrow="Business update"
        title="Remove one business seat"
        description={
          businessSeatPriceText
            ? `Are you sure you want to remove one business seat from this subscription? This removes the seat priced at ${businessSeatPriceText}.`
            : "Are you sure you want to remove one business seat from this subscription?"
        }
        confirmLabel="Remove seat"
        accent="success"
        cancelLabel="Keep current seats"
        isProcessing={isUpdatingBusinessSeats}
        onCancel={closeDangerModal}
        onConfirm={executeRemoveBusinessSeat}
      />
    </div>
  );
}
