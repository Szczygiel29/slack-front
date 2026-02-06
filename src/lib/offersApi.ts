import { apiFetch } from "./api";
import type { OfferPlanResponse } from "../types/stripe";

export const fetchOffers = async () =>
  apiFetch<OfferPlanResponse[]>("/api/v1/offers");
