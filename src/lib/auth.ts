export const getAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("accessToken");
};

export const getTokenType = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("tokenType");
};

export const buildAuthHeaders = (headers: HeadersInit = {}) => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return headers;
  }
  const tokenType = getTokenType() ?? "Bearer";
  return {
    ...headers,
    Authorization: `${tokenType} ${accessToken}`,
  };
};
