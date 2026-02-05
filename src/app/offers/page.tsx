"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buildAuthHeaders } from "../../lib/auth";
import { buildBackendUrl } from "../../lib/backend";

type OfferType = "INDIVIDUAL" | "BUSINESS";

type OfferPlanResponse = {
  type: OfferType;
  title: string;
  audience: string;
  pricePerMonthUsd: number;
  included: string[];
};

const formatPrice = (price: number) => {
  if (!Number.isFinite(price)) {
    return "$0";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
};

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadOffers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(buildBackendUrl("/offers"), {
          headers: buildAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Nie udało się pobrać ofert.");
        }

        const data = (await response.json()) as OfferPlanResponse[];

        if (isMounted) {
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Nie udało się pobrać ofert."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Wybierz ofertę</h1>
          <Link
            href="/admin"
            className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            Back to admin
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            Ładowanie ofert...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            {error}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            Brak ofert do wyświetlenia.
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {offers.map((offer) => (
              <article
                key={`${offer.type}-${offer.title}`}
                className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                  {offer.type}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{offer.title}</h2>
                <p className="mt-1 text-sm text-white/70">{offer.audience}</p>
                <p className="mt-5 text-3xl font-bold text-white">
                  {formatPrice(offer.pricePerMonthUsd)}
                  <span className="ml-1 text-sm font-medium text-white/60">/month</span>
                </p>

                <ul className="mt-6 flex-1 space-y-2 text-sm text-white/85">
                  {offer.included.map((item) => (
                    <li key={item} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="mt-6 w-full rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                >
                  Wybierz
                </button>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
