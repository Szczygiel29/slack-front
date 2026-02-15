import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "../../../../../lib/backend";

const getFrontendOrigin = (request: NextRequest) => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  return request.nextUrl.origin;
};

export async function GET(request: NextRequest) {
  const incomingUrl = request.nextUrl;
  const frontendOrigin = getFrontendOrigin(request);

  const backendCallbackUrl = new URL(buildBackendUrl("/slack/oauth/callback"));
  incomingUrl.searchParams.forEach((value, key) => {
    backendCallbackUrl.searchParams.append(key, value);
  });

  try {
    const backendResponse = await fetch(backendCallbackUrl.toString(), {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    const successRedirect = new URL("/slack/connected", frontendOrigin);

    if (backendResponse.ok) {
      return NextResponse.redirect(successRedirect);
    }

    const errorRedirect = new URL("/slack/connected", frontendOrigin);
    errorRedirect.searchParams.set("status", "error");

    try {
      const payload = (await backendResponse.json()) as { message?: string };
      if (payload.message) {
        errorRedirect.searchParams.set("message", payload.message);
      }
    } catch {
      errorRedirect.searchParams.set(
        "message",
        "Nie udało się połączyć aplikacji ze Slackiem."
      );
    }

    return NextResponse.redirect(errorRedirect);
  } catch {
    const errorRedirect = new URL("/slack/connected", frontendOrigin);
    errorRedirect.searchParams.set("status", "error");
    errorRedirect.searchParams.set(
      "message",
      "Błąd połączenia z serwerem podczas autoryzacji Slacka."
    );
    return NextResponse.redirect(errorRedirect);
  }
}
