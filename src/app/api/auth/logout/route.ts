import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  TOKEN_TYPE_COOKIE,
} from "../../../../lib/session-constants";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out." });

  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(TOKEN_TYPE_COOKIE);
  response.cookies.delete(CSRF_COOKIE);

  return response;
}
