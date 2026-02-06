export type OfferType = "INDIVIDUAL" | "BUSINESS";

export interface SetupIntentResponse {
  clientSecret: string;
}

export interface StripeSubscriptionVM {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionActive: boolean;
  emailLimit: number;
}

export interface OfferPlanResponse {
  type: OfferType;
  title: string;
  audience: string;
  pricePerMonthUsd: number;
  included: string[];
}
