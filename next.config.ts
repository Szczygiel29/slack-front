import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const getBackendOrigin = () => {
  const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!rawUrl) {
    return "http://localhost:8080";
  }

  try {
    return new URL(rawUrl).origin;
  } catch {
    return "http://localhost:8080";
  }
};

const buildContentSecurityPolicy = () => {
  const backendOrigin = getBackendOrigin();
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    "https://js.stripe.com",
    "https://slack.com",
  ];

  if (!isProduction) {
    scriptSources.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${backendOrigin} https://api.stripe.com https://r.stripe.com https://m.stripe.network https://slack.com`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
};

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
