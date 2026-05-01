const defaultApiBaseUrl = "http://localhost:64652";
const savedApiBaseUrl = localStorage.getItem("apiBaseUrl");
const apiBaseUrl = savedApiBaseUrl && !savedApiBaseUrl.includes("7108")
  ? savedApiBaseUrl
  : defaultApiBaseUrl;

if (savedApiBaseUrl && savedApiBaseUrl.includes("7108")) {
  localStorage.removeItem("apiBaseUrl");
}

export const config = {
  apiBaseUrl,
  defaultTenantSlug: localStorage.getItem("tenantSlug") || "club-demo"
};
