"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "../lib/api";
import type {
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  OfferPlanResponse,
} from "../types";

interface StripeCheckoutFormProps {
  offer: OfferPlanResponse;
}

const formatBillingInterval = (value: OfferPlanResponse["billingInterval"]) =>
  value === "YEARLY" ? "Yearly billing" : "Monthly billing";

export default function StripeCheckoutForm({ offer }: StripeCheckoutFormProps) {
  const router = useRouter();
  const [seats, setSeats] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CheckoutSessionRequest = {
        offerType: offer.type,
        billingInterval: offer.billingInterval,
      };

      if (offer.type === "BUSINESS") {
        const parsedSeats = Number.parseInt(seats, 10);

        if (!Number.isInteger(parsedSeats) || parsedSeats < 1) {
          setErrorMessage("Enter at least 1 seat for the Business plan.");
          return;
        }

        payload.seats = parsedSeats;
      }

      const response = await apiFetch("/stripe/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push("/auth?mode=login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to start Stripe Checkout.");
      }

      const data = (await response.json()) as CheckoutSessionResponse;

      if (!data.url) {
        throw new Error("Missing checkout URL.");
      }

      window.location.assign(data.url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start Stripe Checkout.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">Selected plan</p>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{offer.title}</p>
          <p className="mt-1 text-sm text-slate-600">
            {offer.type} · {formatBillingInterval(offer.billingInterval)}
          </p>
        </div>
      </div>

      {offer.type === "BUSINESS" ? (
        <div>
          <label className="text-sm font-semibold text-slate-900">Seats</label>
          <input
            type="number"
            min={1}
            step={1}
            value={seats}
            onChange={(event) => setSeats(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">
        {isSubmitting ? "Redirecting..." : "Continue to Stripe Checkout"}
      </button>
    </form>
  );
}
