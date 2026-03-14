"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CheckoutModal from "../../components/CheckoutModal";
import StripeCheckoutForm from "../../components/StripeCheckoutForm";
import {
  fetchOfferPlans,
  formatUsdPrice,
  getOfferDisplayPrice,
} from "../../lib/offers";
import type { OfferPlanResponse } from "../../types";

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<OfferPlanResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOffers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchOfferPlans();

        if (isMounted) {
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load offers."
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

  const handleSelectOffer = (offer: OfferPlanResponse) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Choose an offer</h1>
          <Link
            href="/admin"
            className="text-sm font-medium text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400">
            Back to admin
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <span className="inline-flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
              Loading offers...
            </span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-100">
            {error}
          </div>
        ) : offers.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            No offers available to display.
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2">
            {offers.map((offer) => (
              <article
                key={`${offer.type}-${offer.title}`}
                className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6">
                {(() => {
                  const { amount, unitLabel } = getOfferDisplayPrice(offer);

                  return (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                        {offer.type}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">
                        {offer.title}
                      </h2>
                      <p className="mt-1 text-sm text-white/70">{offer.audience}</p>
                      <p className="mt-5 text-3xl font-bold text-white">
                        {formatUsdPrice(amount)}
                        <span className="ml-1 text-sm font-medium text-white/60">
                          {unitLabel}
                        </span>
                      </p>

                      <ul className="mt-6 flex-1 space-y-2 text-sm text-white/85">
                        {offer.included.map((item) => (
                          <li
                            key={item}
                            className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                            {item}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => handleSelectOffer(offer)}
                          className="w-full rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300">
                          Select
                        </button>
                      </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </section>
        )}
      </main>
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Complete checkout">
        {selectedOffer ? <StripeCheckoutForm offer={selectedOffer} /> : null}
      </CheckoutModal>
    </div>
  );
}
