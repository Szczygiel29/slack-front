import { buildCsrfHeaders } from "./auth";

export const buildApiUrl = (path: string) => {
  const baseUrl = "/api/proxy";
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = buildCsrfHeaders(options.method, {
    ...options.headers,
  });

  return fetch(buildApiUrl(path), {
    credentials: "same-origin",
    ...options,
    headers,
  });
}

export async function fetchJSON<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = buildCsrfHeaders(options.method, {
    "Content-Type": "application/json",
    ...options.headers,
  });

  const response = await fetch(buildApiUrl(path), {
    credentials: "same-origin",
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // Ignore JSON parse errors.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
