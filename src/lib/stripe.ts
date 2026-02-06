import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. Stripe Elements will not initialize.",
  );
}

export const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : null;
