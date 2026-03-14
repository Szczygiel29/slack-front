import { redirect } from "next/navigation";

import PricingClient from "./PricingClient";

interface PricingPageProps {
  searchParams?: Promise<{
    checkout?: string;
  }>;
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = searchParams ? await searchParams : undefined;

  if (params?.checkout === "cancelled") {
    redirect("/offers");
  }

  return <PricingClient />;
}
