"use client";

import { useState } from "react";

import CheckoutModal from "../../components/CheckoutModal";
import StripeCheckoutForm from "../../components/StripeCheckoutForm";
import { useOfferPlans } from "../../hooks/useOfferPlans";
import { formatUsdPrice, getOfferDisplayPrice } from "../../lib/offers";
import type { OfferPlanResponse } from "../../types";

export default function PricingClient() {
  const [selectedOffer, setSelectedOffer] = useState<OfferPlanResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { offers, isLoading: isOffersLoading, error: offersError } =
    useOfferPlans();

  const handleSelectPlan = (offer: OfferPlanResponse) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Choose a plan</h1>
        <p className="mt-2 text-slate-600">
          Start a Stripe Checkout session with monthly or yearly billing.
        </p>
      </header>

      {isOffersLoading ? (
        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            Loading plans...
          </div>
        </div>
      ) : offersError ? (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {offersError}
        </p>
      ) : offers.length === 0 ? (
        <p className="mt-6 rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-700">
          No plans available to display.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {offers.map((plan) => (
            <div
              key={`${plan.type}-${plan.title}`}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {(() => {
                const { amount, unitLabel } = getOfferDisplayPrice(plan);

                return (
                  <>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {plan.title}
                    </h2>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {formatUsdPrice(amount)}
                      <span className="ml-1 text-sm font-medium text-slate-500">
                        {unitLabel}
                      </span>
                    </p>
                    <p className="mt-3 text-sm text-slate-600">{plan.audience}</p>
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                        Select
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Complete checkout">
        {selectedOffer ? <StripeCheckoutForm offer={selectedOffer} /> : null}
      </CheckoutModal>
    </div>
  );
}
