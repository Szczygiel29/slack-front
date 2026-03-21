const DEFAULT_BACKEND_URL = "http://localhost:8080/api/v1";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

export const getBackendUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  return normalizeBaseUrl(envUrl ?? DEFAULT_BACKEND_URL);
};

export const buildBackendUrl = (path: string) => {
  const baseUrl = getBackendUrl();
  if (path.startsWith("/")) {
    return `${baseUrl}${path}`;
  }
  return `${baseUrl}/${path}`;
};
