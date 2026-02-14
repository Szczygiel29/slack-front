import { buildAuthHeaders } from "./auth";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  return normalizeBaseUrl(envUrl ?? DEFAULT_API_BASE_URL);
};

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
};

export async function fetchJSON<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = buildAuthHeaders({
    "Content-Type": "application/json",
    ...options.headers,
  });

  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
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
