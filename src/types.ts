export type OfferType = "INDIVIDUAL" | "BUSINESS";

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
