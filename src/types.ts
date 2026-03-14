export type OfferType = "INDIVIDUAL" | "BUSINESS";
export type BillingInterval = "MONTHLY" | "YEARLY";

export interface OfferPlanResponse {
  type: OfferType;
  billingInterval: BillingInterval;
  title: string;
  audience: string;
  pricePerMonthUsd: number | null;
  pricePerYearUsd: number | null;
  additionalWorkspacePriceUsd: number | null;
  additionalWorkspacePricedPerUser: boolean;
  pricedPerUser: boolean;
  included: string[];
}

export interface CheckoutSessionRequest {
  offerType: OfferType;
  billingInterval: BillingInterval;
  seats?: number;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}
