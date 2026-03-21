import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "../../../../../lib/backend";
import { authCookieOptions, createNonce, getSession } from "../../../../../lib/session";
import { SLACK_OAUTH_STATE_COOKIE } from "../../../../../lib/session-constants";

type UserProfileResponse = {
  email?: string | null;
};

const getFrontendOrigin = (request: NextRequest) => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  return request.nextUrl.origin;
};

export async function GET(request: NextRequest) {
  const frontendOrigin = getFrontendOrigin(request);
  const session = await getSession();

  if (!session.accessToken) {
    return NextResponse.redirect(new URL("/auth?mode=login", frontendOrigin));
  }

  const slackClientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
  if (!slackClientId) {
    const errorRedirect = new URL("/slack/connected", frontendOrigin);
    errorRedirect.searchParams.set("status", "error");
    errorRedirect.searchParams.set("message", "Slack OAuth is not configured.");
    return NextResponse.redirect(errorRedirect);
  }

  let state = createNonce();

  try {
    const profileResponse = await fetch(buildBackendUrl("/users/me"), {
      method: "GET",
      headers: {
        Authorization: `${session.tokenType} ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (profileResponse.ok) {
      const profile = (await profileResponse.json()) as UserProfileResponse;
      if (profile.email) {
        state = profile.email;
      }
    }
  } catch {
    // Fall back to a nonce if the profile lookup is temporarily unavailable.
  }

  const redirectUri = new URL("/api/slack/oauth/callback", frontendOrigin).toString();
  const slackAuthorizeUrl = new URL("https://slack.com/oauth/v2/authorize");

  slackAuthorizeUrl.searchParams.set("client_id", slackClientId);
  slackAuthorizeUrl.searchParams.set("scope", "chat:write,commands");
  slackAuthorizeUrl.searchParams.set("redirect_uri", redirectUri);
  slackAuthorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(slackAuthorizeUrl);
  response.cookies.set(SLACK_OAUTH_STATE_COOKIE, state, {
    ...authCookieOptions,
    maxAge: 60 * 10,
  });

  return response;
}
