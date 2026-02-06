"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { OfferType, StripeSubscriptionVM } from "../types/stripe";
import { createSubscription } from "../lib/stripeApi";

interface StripeCheckoutFormProps {
  offerType: OfferType;
  clientSecret: string;
}

const StripeCheckoutForm = ({ offerType, clientSecret }: StripeCheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<StripeSubscriptionVM | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!stripe || !elements) {
      setErrorMessage("Stripe is not ready yet. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message ?? "Unable to confirm the payment setup.");
        return;
      }

      const paymentMethodId = setupIntent?.payment_method;
      if (!paymentMethodId || typeof paymentMethodId !== "string") {
        setErrorMessage("Missing payment method in the Stripe response.");
        return;
      }

      const subscription = await createSubscription(paymentMethodId, offerType);
      setResult(subscription);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">Subscription status</p>
          <p className="text-lg font-semibold">
            {result.subscriptionActive
              ? "Active"
              : "Pending activation (webhook)"}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Email limit: <span className="font-semibold">{result.emailLimit}</span>
          </p>
        </div>
        {!result.subscriptionActive && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Refresh
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || !stripe}
      >
        {isSubmitting ? "Confirming..." : "Confirm subscription"}
      </button>
    </form>
  );
};

export default StripeCheckoutForm;
