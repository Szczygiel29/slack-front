const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!envUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined.");
  }
  return normalizeBaseUrl(envUrl);
};

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
};

export const apiFetch = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};
