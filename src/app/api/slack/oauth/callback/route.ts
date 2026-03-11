import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "../../../../../lib/backend";
import { getSession } from "../../../../../lib/session";
import { SLACK_OAUTH_STATE_COOKIE } from "../../../../../lib/session-constants";

type SlackOauthErrorCode =
  | "invalid_state"
  | "backend_rejected"
  | "backend_unavailable";

const getFrontendOrigin = (request: NextRequest) => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  return request.nextUrl.origin;
};

export async function GET(request: NextRequest) {
  const incomingUrl = request.nextUrl;
  const frontendOrigin = getFrontendOrigin(request);
  const session = await getSession();
  const stateFromQuery = incomingUrl.searchParams.get("state");
  const stateFromCookie = request.cookies.get(SLACK_OAUTH_STATE_COOKIE)?.value;

  const buildErrorRedirect = (code: SlackOauthErrorCode) => {
    const response = NextResponse.redirect(new URL("/slack/connected", frontendOrigin));
    response.cookies.delete(SLACK_OAUTH_STATE_COOKIE);
    response.headers.set(
      "Location",
      `${frontendOrigin}/slack/connected?status=error&code=${encodeURIComponent(code)}`
    );
    return response;
  };

  if (!session.accessToken) {
    return NextResponse.redirect(new URL("/auth?mode=login", frontendOrigin));
  }

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return buildErrorRedirect("invalid_state");
  }

  const backendCallbackUrl = new URL(buildBackendUrl("/slack/oauth/callback"));
  incomingUrl.searchParams.forEach((value, key) => {
    backendCallbackUrl.searchParams.append(key, value);
  });

  try {
    const backendResponse = await fetch(backendCallbackUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `${session.tokenType} ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const successRedirect = new URL("/slack/connected", frontendOrigin);

    if (backendResponse.ok) {
      const response = NextResponse.redirect(successRedirect);
      response.cookies.delete(SLACK_OAUTH_STATE_COOKIE);
      return response;
    }

    return buildErrorRedirect("backend_rejected");
  } catch {
    return buildErrorRedirect("backend_unavailable");
  }
}
