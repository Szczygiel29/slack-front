"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#security" },
  { label: "Contact", href: "#contact" },
];

const benefits = [
  "Translate Slack messages instantly with AWS Translate",
  "Keep terminology consistent with Custom Terminology glossaries",
  "Generate summaries and replies on demand without message storage",
];

const featureCards = [
  {
    title: "Slack translation",
    description: "Translate messages in-channel with AWS Amazon Translate.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75l2.25 2.25L15 10.5m6 1.5a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Custom Terminology",
    description:
      "Apply approved company and product terms for consistent translations.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12h15m-7.5-7.5v15"
        />
      </svg>
    ),
  },
  {
    title: "Thread TL;DR summaries",
    description:
      "Get quick summaries of long Slack threads in a single response.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75h19.5M2.25 12h19.5m-19.5 5.25h19.5"
        />
      </svg>
    ),
  },
  {
    title: "Incremental summary updates",
    description:
      "Update summaries as new messages arrive using payload-based requests.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9L12 3z"
        />
      </svg>
    ),
  },
  {
    title: "Reply suggestions",
    description:
      "Receive three tone-based replies: FORMAL, CASUAL, SUPPORT, SALES.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 6.75h9m-9 4.5h6m-6 4.5h9"
        />
      </svg>
    ),
  },
  {
    title: "Stateless processing",
    description:
      "Message content is processed on-the-fly and not stored in a database.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
      </svg>
    ),
  },
];

const pricingPlans = [
  {
    name: "Individual",
    price: "$12",
    description: "For individuals or small teams getting started.",
    features: [
      "Translation + Custom Terminology",
      "Thread TL;DR summaries",
      "Reply suggestions (3 tones)",
      "Standard usage limits",
    ],
    cta: "Get started",
  },
  {
    name: "Business",
    price: "$24",
    description: "For teams with higher usage needs.",
    features: [
      "Everything in Individual",
      "Higher usage limits",
      "Business Q&A (add-on)",
    ],
    cta: "Coming soon",
    highlighted: true,
  },
];

const faqs = [
  {
    question: "How does pricing work?",
    answer:
      "Plans are billed per user per month. Limits depend on usage and model configuration.",
  },
  {
    question: "What permissions does the app request?",
    answer:
      "We request Slack scopes needed to read message payloads and post translations, summaries, or reply suggestions.",
  },
  {
    question: "Where is data stored?",
    answer:
      "Message content is processed on-the-fly and not stored in a database.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel or downgrade in seconds. Your data remains available during the term.",
  },
  {
    question: "How do summary updates work?",
    answer:
      "Send a new message payload to update an existing summary without storing prior messages.",
  },
  {
    question: "Which reply tones are supported?",
    answer:
      "Choose from FORMAL, CASUAL, SUPPORT, or SALES for three suggested replies.",
  },
  {
    question: "How does Slack installation work?",
    answer:
      "Install from Slack, authorize, then complete setup in your dashboard before going live.",
  },
];

const logos = ["VectorLab", "Pulse", "Northwind", "Orbit", "Nimbus"];

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/90 text-sm font-semibold shadow-lg shadow-indigo-500/40">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Slackmate
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium text-slate-200 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 rounded-full bg-indigo-400 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth"
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
              Sign in / Create account
            </Link>
            <a
              href="#pricing"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
              View plans
            </a>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-white/20 p-2 text-white/80 transition hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}>
            <span className="sr-only">Toggle navigation</span>
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </nav>
        {isMenuOpen ? (
          <div id="mobile-menu" className="border-t border-white/10 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white/80 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                  onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <a
                href="#pricing"
                className="rounded-full border border-white/20 px-4 py-2 text-center font-medium text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                View plans
              </a>
              <Link
                href="/auth"
                className="rounded-full bg-indigo-500 px-4 py-2 text-center font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                Add to Slack
              </Link>
              <Link
                href="/auth"
                className="rounded-full border border-white/20 px-4 py-2 text-center font-semibold text-white/80 transition hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                onClick={() => setIsMenuOpen(false)}>
                Sign in / Create account
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_60%)]" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16 md:flex-row md:items-center md:gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Translate, summarize, and draft replies in Slack
              </div>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-5xl">
                The Slack assistant for translation and summaries
              </h1>
              <p className="mt-4 text-base text-white/70 md:text-lg">
                Slackmate helps teams translate messages, apply consistent
                terminology, summarize threads, and draft replies without
                leaving Slack.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-white/80">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="relative">
                  <span className="absolute -top-3 left-4 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-900">
                    Popular
                  </span>
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                    Add to Slack
                  </Link>
                </div>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                  Sign in / Create account
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/60">
                Connect Slack first, then choose a plan for your users.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                <span className="font-semibold text-white">
                  Stateless by design
                </span>
                Payload-based processing with verified Slack requests.
              </div>
            </div>
            <div className="flex-1">
              <div className="relative mx-auto max-w-lg rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-6 shadow-2xl shadow-indigo-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Live assist preview
                  </span>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
                    Slackmate AI
                  </span>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Thread TL;DR</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-200">
                      Ready
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      "Translation applied",
                      "Summary generated",
                      "Reply options ready",
                    ].map((step) => (
                      <div
                        key={step}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-xs text-white/80">{step}</span>
                        <span className="text-xs text-white/50">Just now</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Translations", value: "48 today" },
                    { label: "Summaries", value: "12 today" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/60">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="absolute -right-6 -top-6 hidden rounded-2xl border border-white/10 bg-white/10 p-4 text-xs text-white/70 shadow-lg shadow-indigo-500/20 backdrop-blur sm:block">
                  Translations, summaries, and reply suggestions in Slack.
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-white/70">
                  Glass insight card · 3 teams onboarded this week · 98%
                  response satisfaction rate
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/5 bg-slate-950/80">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white/60">
                Trusted by teams at
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {logos.map((logo) => (
                  <div
                    key={logo}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70">
                    {logo}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-white/70">
                Teams keep global conversations moving with fast translations
                and summaries.
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <svg
                      key={`star-${index}`}
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      fill="currentColor"
                      aria-hidden="true">
                      <path d="M9.049 2.927a1 1 0 011.902 0l1.286 3.967a1 1 0 00.95.69h4.173a1 1 0 01.592 1.806l-3.377 2.455a1 1 0 00-.364 1.118l1.287 3.967a1 1 0 01-1.538 1.118L10 13.347l-3.377 2.456a1 1 0 01-1.538-1.118l1.287-3.967a1 1 0 00-.364-1.118L2.63 9.39a1 1 0 01.592-1.806h4.173a1 1 0 00.95-.69l1.286-3.967z" />
                    </svg>
                  ))}
                </div>
                <p className="mt-3 text-sm text-white/80">
                  “Translations are instant and the TL;DR keeps every thread
                  aligned.”
                </p>
                <p className="mt-3 text-xs text-white/50">
                  Jordan Lee · Ops Lead, Northwind
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              Everything you need for translation and summaries in Slack
            </h2>
            <p className="mt-4 text-sm text-white/70">
              Translate messages, summarize threads, and draft replies without
              leaving Slack.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-200">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/5 bg-slate-950/80">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  How it works
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Stateless assistance from payload to response
                </h2>
                <p className="mt-4 text-sm text-white/70">
                  Slack payloads flow through translation and optional summaries
                  or reply suggestions, then return to Slack without storing
                  message content.
                </p>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    title: "Slack payload received",
                    description:
                      "A message or thread payload arrives from Slack.",
                  },
                  {
                    title: "Translate and assist",
                    description:
                      "AWS Translate runs first, then summaries or reply suggestions are generated if requested.",
                  },
                  {
                    title: "Response back to Slack",
                    description:
                      "Results return to Slack immediately with no message database storage.",
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm text-white/70">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Simple pricing per user per month
              </h2>
              <p className="mt-4 text-sm text-white/70">
                Two plans for translation, summaries, and reply suggestions in
                Slack.
              </p>
            </div>
            <p className="text-sm text-white/60">
              Limits depend on usage and model configuration.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Included</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {pricingPlans.map((plan) => (
                  <tr
                    key={plan.name}
                    className="border-b border-white/5 last:border-b-0">
                    <td className="px-6 py-5 align-top">
                      <p className="text-base font-semibold text-white">
                        {plan.name}
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        {plan.description}
                      </p>
                    </td>
                    <td className="px-6 py-5 align-top text-lg font-semibold text-white">
                      {plan.price}
                      <span className="text-xs font-normal text-white/60">
                        /user/mo
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <a
                        href="#contact"
                        className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${
                          plan.highlighted
                            ? "bg-indigo-500 text-white hover:bg-indigo-400"
                            : "border border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                        }`}>
                        {plan.cta}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">
              Business Q&A (add-on)
            </h3>
            <p className="mt-2 text-sm text-white/70">
              Answer policy, product, and process questions using
              organization-provided context at request time, without storing
              message content.
            </p>
          </div>
        </section>

        <section
          id="security"
          className="border-t border-white/5 bg-slate-950/80">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  Security
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Secure, stateless processing for Slack teams
                </h2>
                <p className="mt-4 text-sm text-white/70">
                  We use least-privilege scopes and verified Slack requests
                  while keeping message content out of a database.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <ul className="space-y-3 text-sm text-white/70">
                  {[
                    "OAuth 2.0 with granular scopes",
                    "Verified Slack request signatures",
                    "Stateless processing (no message database)",
                    "Payload-based summaries and replies",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-white/60">
                  Secure by design · Verified requests · No message storage
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="border-t border-white/5 bg-slate-950/80">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">
                  FAQ
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Answers for security, billing, and Slack admins
                </h2>
                <p className="mt-4 text-sm text-white/70">
                  Everything you need to know before installing Slackmate.
                </p>
              </div>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-sm text-white/70">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pb-28 pt-20">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-white/5 to-white/0 p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-white">
                  Ready to translate and summarize in Slack?
                </h2>
                <p className="mt-3 text-sm text-white/70">
                  Install Slackmate in minutes and keep every thread aligned
                  with fast translations and TL;DRs.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                  Add to Slack
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <a
                key={`footer-${link.href}`}
                href={link.href}
                className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
                {link.label}
              </a>
            ))}
          </div>
          <p>© 2024 Slackmate. All rights reserved.</p>
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <span className="text-xs text-white/70">
            Ready to assist in Slack?
          </span>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
            Add to Slack
          </Link>
        </div>
      </div>
    </div>
  );
}
