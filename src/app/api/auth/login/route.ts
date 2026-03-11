import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "../../../../lib/backend";
import {
  authCookieOptions,
  createCsrfToken,
  csrfCookieOptions,
} from "../../../../lib/session";
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  TOKEN_TYPE_COOKIE,
} from "../../../../lib/session-constants";

type LoginResponse = {
  accessToken?: string;
  tokenType?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const backendResponse = await fetch(buildBackendUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });

    const payload = (await backendResponse.json().catch(() => null)) as
      | LoginResponse
      | null;

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: payload?.message ?? "Unable to sign in.",
        },
        { status: backendResponse.status }
      );
    }

    if (!payload?.accessToken) {
      return NextResponse.json(
        { message: "Missing access token in login response." },
        { status: 502 }
      );
    }

    const csrfToken = createCsrfToken();
    const response = NextResponse.json({
      message: payload.message ?? "Signed in successfully.",
    });

    response.cookies.set(ACCESS_TOKEN_COOKIE, payload.accessToken, authCookieOptions);
    response.cookies.set(
      TOKEN_TYPE_COOKIE,
      payload.tokenType ?? "Bearer",
      authCookieOptions
    );
    response.cookies.set(CSRF_COOKIE, csrfToken, csrfCookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { message: "Authentication service is unavailable." },
      { status: 502 }
    );
  }
}
