import { apiFetch } from "./api";
import type {
  OfferType,
  SetupIntentResponse,
  StripeSubscriptionVM,
} from "../types/stripe";

export const createSetupIntent = async (offerType: OfferType) =>
  apiFetch<SetupIntentResponse>("/api/v1/stripe/setup-intent", {
    method: "POST",
    body: JSON.stringify({ offerType }),
  });

export const createSubscription = async (
  paymentMethodId: string,
  offerType: OfferType,
) =>
  apiFetch<StripeSubscriptionVM>("/api/v1/stripe/subscriptions", {
    method: "POST",
    body: JSON.stringify({ paymentMethodId, offerType }),
  });
