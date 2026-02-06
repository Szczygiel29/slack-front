"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { OfferPlanResponse, OfferType } from "../../types/stripe";
import { fetchOffers } from "../../lib/offersApi";
import { createSetupIntent } from "../../lib/stripeApi";
import { stripePromise } from "../../lib/stripeClient";
import CheckoutModal from "../../components/CheckoutModal";
import StripeCheckoutForm from "../../components/StripeCheckoutForm";

const formatPrice = (price: number) => {
  if (!Number.isFinite(price)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
};

const PricingClient = () => {
  const [offers, setOffers] = useState<OfferPlanResponse[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [selectedOfferType, setSelectedOfferType] = useState<OfferType | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingSetupIntent, setIsCreatingSetupIntent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOffers = async () => {
      setIsLoadingOffers(true);
      setErrorMessage(null);
      try {
        const data = await fetchOffers();
        if (isMounted) {
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : "Unable to load offers.";
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingOffers(false);
        }
      }
    };

    void loadOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChoosePlan = async (offerType: OfferType) => {
    setSelectedOfferType(offerType);
    setErrorMessage(null);
    setIsCreatingSetupIntent(true);
    try {
      const response = await createSetupIntent(offerType);
      setClientSecret(response.clientSecret);
      setIsModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the SetupIntent.";
      setErrorMessage(message);
    } finally {
      setIsCreatingSetupIntent(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClientSecret(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Choose a plan</h1>
        <p className="mt-3 text-lg text-gray-500">
          Pay inside the app using Stripe Payment Element.
        </p>
      </div>

      {errorMessage && (
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isLoadingOffers ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Loading offers...
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          No offers available.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {offers.map((offer) => (
          <div
            key={`${offer.type}-${offer.title}`}
            className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{offer.title}</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {offer.type}
                </span>
              </div>
              <p className="mt-2 text-gray-500">{offer.audience}</p>
              <p className="mt-4 text-3xl font-bold">
                {formatPrice(offer.pricePerMonthUsd)}
                <span className="ml-1 text-base font-medium text-gray-500">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {offer.included.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-black" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleChoosePlan(offer.type)}
              className="mt-6 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreatingSetupIntent}
            >
              {isCreatingSetupIntent && selectedOfferType === offer.type
                ? "Loading..."
                : "Choose"}
            </button>
          </div>
          ))}
        </div>
      )}

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Complete your subscription"
      >
        {clientSecret && selectedOfferType ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <StripeCheckoutForm
              offerType={selectedOfferType}
              clientSecret={clientSecret}
            />
          </Elements>
        ) : (
          <p className="text-sm text-gray-500">Loading payment details...</p>
        )}
      </CheckoutModal>
    </div>
  );
};

export default PricingClient;
