import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "../../../../lib/backend";

type ResendVerificationEmailResponse = {
  message?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const backendResponse = await fetch(
      buildBackendUrl("/auth/resend-verification-email"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
        cache: "no-store",
      }
    );

    const payload = (await backendResponse.json().catch(() => null)) as
      | ResendVerificationEmailResponse
      | null;

    return NextResponse.json(
      {
        message: payload?.message ?? "Unable to resend verification email.",
      },
      { status: backendResponse.status }
    );
  } catch {
    return NextResponse.json(
      { message: "Authentication service is unavailable." },
      { status: 502 }
    );
  }
}
