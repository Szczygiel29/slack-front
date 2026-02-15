"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";

import { fetchJSON } from "../lib/api";
import type {
  OfferType,
  SubscriptionResponse,
  SubscriptionRequest,
} from "../types";

interface StripeCheckoutFormProps {
  clientSecret: string;
  offerType: OfferType;
}

export default function StripeCheckoutForm({
  clientSecret,
  offerType,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubscriptionResponse | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Stripe nie jest jeszcze gotowy.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setErrorMessage(
        submitError.message ?? "Nie udało się przesłać formularza."
      );
      setIsSubmitting(false);
      return;
    }

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      clientSecret,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Nie udało się potwierdzić płatności.");
      setIsSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : null;

    if (!paymentMethodId) {
      setErrorMessage("Brak payment method po potwierdzeniu.");
      setIsSubmitting(false);
      return;
    }

    try {
      const subscription = await fetchJSON<SubscriptionResponse>(
        "/stripe/subscriptions",
        {
          method: "POST",
          body: JSON.stringify({
            paymentMethodId,
            offerType,
          } satisfies SubscriptionRequest),
        }
      );
      setResult(subscription);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się utworzyć subskrypcji.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {result ? (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <p>
            Status subskrypcji:{" "}
            {result.subscriptionActive ? "Aktywna" : "Nieaktywna"}
          </p>
          <p>Limit emaili: {result.emailLimit}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
        {isSubmitting ? "Przetwarzanie..." : "Potwierdź"}
      </button>
    </form>
  );
}
