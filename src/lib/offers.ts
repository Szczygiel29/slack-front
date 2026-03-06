import { fetchJSON } from "./api";
import type { OfferPlanResponse } from "../types";

export const formatUsdPrice = (price: number) => {
  if (!Number.isFinite(price)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
};

export const fetchOfferPlans = async () =>
  fetchJSON<OfferPlanResponse[]>("/offers");
