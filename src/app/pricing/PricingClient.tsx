"use client";

import { Elements } from "@stripe/react-stripe-js";
import { useState } from "react";

import CheckoutModal from "../../components/CheckoutModal";
import StripeCheckoutForm from "../../components/StripeCheckoutForm";
import { fetchJSON } from "../../lib/api";
import { stripePromise } from "../../lib/stripe";
import type { OfferType, SetupIntentResponse } from "../../types";

interface PlanConfig {
  title: string;
  price: string;
  description: string;
  offerType: OfferType;
}

const plans: PlanConfig[] = [
  {
    title: "Individual",
    price: "$12 / month",
    description: "Dla osób lub małych zespołów.",
    offerType: "INDIVIDUAL",
  },
  {
    title: "Business",
    price: "$24 / month",
    description: "Dla firm z większym limitem użycia.",
    offerType: "BUSINESS",
  },
];

export default function PricingClient() {
  const [selectedOffer, setSelectedOffer] = useState<OfferType | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć SetupIntent.";
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
        <h1 className="text-3xl font-bold text-slate-900">Wybierz plan</h1>
        <p className="mt-2 text-slate-600">
          Subskrypcje Stripe bez przekierowania — Stripe Elements + SetupIntent.
        </p>
      </header>

      {errorMessage ? (
        <p className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.offerType}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              {plan.title}
            </h2>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {plan.price}
            </p>
            <p className="mt-3 text-sm text-slate-600">{plan.description}</p>
            <button
              type="button"
              onClick={() => handleSelectPlan(plan.offerType)}
              className="mt-6 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isLoading}>
              {isLoading && selectedOffer === plan.offerType
                ? "Ładowanie..."
                : "Wybierz"}
            </button>
          </div>
        ))}
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Potwierdź subskrypcję">
        {!stripePromise ? (
          <p className="text-sm text-red-600">
            Brak klucza Stripe. Ustaw NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
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
