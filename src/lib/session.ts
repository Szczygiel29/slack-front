import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  TOKEN_TYPE_COOKIE,
} from "./session-constants";

const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
};

export const csrfCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
};

export const createCsrfToken = () => crypto.randomUUID();
export const createNonce = () => crypto.randomUUID();

export const getSession = async () => {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    tokenType: cookieStore.get(TOKEN_TYPE_COOKIE)?.value ?? "Bearer",
    csrfToken: cookieStore.get(CSRF_COOKIE)?.value ?? null,
  };
};
