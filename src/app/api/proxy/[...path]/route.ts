import { NextRequest, NextResponse } from "next/server";

import { buildBackendUrl } from "../../../../lib/backend";
import { getSession } from "../../../../lib/session";
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  CSRF_HEADER,
  TOKEN_TYPE_COOKIE,
} from "../../../../lib/session-constants";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const canHaveBody = (method: string) =>
  !["GET", "HEAD"].includes(method.toUpperCase());

const requiresCsrfProtection = (method: string) =>
  !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

async function handleProxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const backendUrl = new URL(buildBackendUrl(`/${path.join("/")}`));
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const session = await getSession();

  if (requiresCsrfProtection(request.method)) {
    if (!session.accessToken) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const csrfHeader = request.headers.get(CSRF_HEADER);
    if (!csrfHeader || csrfHeader !== session.csrfToken) {
      return NextResponse.json({ message: "Invalid CSRF token." }, { status: 403 });
    }
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  if (accept) {
    headers.set("Accept", accept);
  }

  if (session.accessToken) {
    headers.set("Authorization", `${session.tokenType} ${session.accessToken}`);
  }

  const backendResponse = await fetch(backendUrl.toString(), {
    method: request.method,
    headers,
    body: canHaveBody(request.method) ? await request.text() : undefined,
    cache: "no-store",
  });

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
  });

  const responseContentType = backendResponse.headers.get("content-type");
  if (responseContentType) {
    response.headers.set("Content-Type", responseContentType);
  }

  if (backendResponse.status === 401) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(TOKEN_TYPE_COOKIE);
    response.cookies.delete(CSRF_COOKIE);
  }

  return response;
}

export function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}
