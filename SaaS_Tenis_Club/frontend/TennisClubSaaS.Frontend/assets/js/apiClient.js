import { config } from "./config.js?v=2026050123";
import { toast } from "./components/toast.js?v=2026050124";

const store = {
  get token() { return localStorage.getItem("accessToken"); },
  get tenantSlug() { return localStorage.getItem("tenantSlug") || config.defaultTenantSlug; }
};

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json", "X-Tenant-Slug": store.tenantSlug };
  if (store.token) headers.Authorization = `Bearer ${store.token}`;
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    location.hash = "#/login";
    throw new Error("Sesión expirada.");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = payload.message || "No se pudo completar la operación.";
    toast(message, "error");
    throw new Error(message);
  }
  return payload.data ?? payload;
}

export const apiClient = {
  get: path => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: path => request("DELETE", path)
};
