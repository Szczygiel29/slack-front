import { CSRF_COOKIE, CSRF_HEADER } from "./session-constants";

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const target = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(target));

  return cookie ? decodeURIComponent(cookie.slice(target.length)) : null;
};

export const buildCsrfHeaders = (
  method: string | undefined,
  headers: HeadersInit = {}
) => {
  const normalizedMethod = (method ?? "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(normalizedMethod)) {
    return headers;
  }

  const csrfToken = getCookieValue(CSRF_COOKIE);
  if (!csrfToken) {
    return headers;
  }

  return {
    ...headers,
    [CSRF_HEADER]: csrfToken,
  };
};
