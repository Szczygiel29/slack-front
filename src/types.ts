export type OfferType = "INDIVIDUAL" | "BUSINESS";

export interface OfferPlanResponse {
  type: OfferType;
  title: string;
  audience: string;
  pricePerMonthUsd: number;
  included: string[];
}

export interface SetupIntentRequest {
  offerType: OfferType;
}

export interface SetupIntentResponse {
  clientSecret: string;
}

export interface SubscriptionRequest {
  paymentMethodId: string;
  offerType: OfferType;
}

export interface SubscriptionResponse {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionActive: boolean;
  emailLimit: number;
}
