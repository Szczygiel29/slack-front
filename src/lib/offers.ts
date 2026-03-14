import { fetchJSON } from "./api";
import type { BillingInterval, OfferPlanResponse } from "../types";

export const formatUsdPrice = (price: number | null | undefined) => {
  if (!Number.isFinite(price)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
};

export const getOfferBillingInterval = (
  offer: OfferPlanResponse
): BillingInterval => offer.billingInterval;

export const getOfferDisplayPrice = (offer: OfferPlanResponse) => {
  const billingInterval = getOfferBillingInterval(offer);
  const amount =
    billingInterval === "MONTHLY" ? offer.pricePerMonthUsd : offer.pricePerYearUsd;
  const unitLabel = offer.pricedPerUser
    ? billingInterval === "MONTHLY"
      ? "/ per user /month"
      : "/ per user /year"
    : billingInterval === "MONTHLY"
      ? "/month"
      : "/year";

  return {
    amount,
    billingInterval,
    unitLabel,
  };
};

export const fetchOfferPlans = async () =>
  fetchJSON<OfferPlanResponse[]>("/offers");

export const fetchOfferPlan = async (
  type: "INDIVIDUAL" | "BUSINESS",
  billingInterval: BillingInterval
) =>
  fetchJSON<OfferPlanResponse>(
    `/offers/${type}?billingInterval=${encodeURIComponent(billingInterval)}`
  );
