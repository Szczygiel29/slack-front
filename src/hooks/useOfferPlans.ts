"use client";

import { useEffect, useState } from "react";

import { fetchOfferPlans } from "../lib/offers";
import type { OfferPlanResponse } from "../types";

export const useOfferPlans = () => {
  const [offers, setOffers] = useState<OfferPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOffers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchOfferPlans();
        if (isMounted) {
          setOffers(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load offers."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  return { offers, isLoading, error };
};
