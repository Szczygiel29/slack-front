"use client";

import { Elements } from "@stripe/react-stripe-js";
import { useState } from "react";

import CheckoutModal from "../../components/CheckoutModal";
import StripeCheckoutForm from "../../components/StripeCheckoutForm";
import { useOfferPlans } from "../../hooks/useOfferPlans";
import { fetchJSON } from "../../lib/api";
import { formatUsdPrice } from "../../lib/offers";
import { stripePromise } from "../../lib/stripe";
import type { OfferType, SetupIntentResponse } from "../../types";

export default function PricingClient() {
  const [selectedOffer, setSelectedOffer] = useState<OfferType | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { offers, isLoading: isOffersLoading, error: offersError } =
    useOfferPlans();

  const handleSelectPlan = async (offerType: OfferType) => {
    setSelectedOffer(offerType);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetchJSON<SetupIntentResponse>(
        "/stripe/setup-intent",
        {
          method: "POST",
          body: JSON.stringify({ offerType }),
        }
      );
      setClientSecret(response.clientSecret);
      setIsModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create SetupIntent.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Choose a plan</h1>
        <p className="mt-2 text-slate-600">
          Stripe subscriptions without redirect - Stripe Elements + SetupIntent.
        </p>
      </header>

      {errorMessage ? (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

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
              <h2 className="text-xl font-semibold text-slate-900">
                {plan.title}
              </h2>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatUsdPrice(plan.pricePerMonthUsd)}
                <span className="ml-1 text-sm font-medium text-slate-500">
                  /month
                </span>
              </p>
              <p className="mt-3 text-sm text-slate-600">{plan.audience}</p>
              <button
                type="button"
                onClick={() => handleSelectPlan(plan.type)}
                className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={isLoading}>
                {isLoading && selectedOffer === plan.type ? "Loading..." : "Select"}
              </button>
            </div>
          ))}
        </div>
      )}

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Confirm subscription">
        {!stripePromise ? (
          <p className="text-sm text-red-600">
            Missing Stripe key. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
          </p>
        ) : null}
        {clientSecret && selectedOffer && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeCheckoutForm
              clientSecret={clientSecret}
              offerType={selectedOffer}
            />
          </Elements>
        ) : null}
      </CheckoutModal>
    </div>
  );
}
