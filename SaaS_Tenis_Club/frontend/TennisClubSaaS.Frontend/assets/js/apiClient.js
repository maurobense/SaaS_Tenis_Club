import { config } from "./config.js?v=2026050145";
import { toast } from "./components/toast.js?v=2026050124";
import { currentTenantSlug } from "./tenantContext.js?v=2026050145";

const store = {
  get token() { return localStorage.getItem("accessToken"); },
  get tenantSlug() { return currentTenantSlug(config.defaultTenantSlug); }
};

async function request(method, path, body) {
  if (!config.apiBaseUrl) {
    const message = "API no configurada. Defini la URL de Somee en assets/js/env.js.";
    toast(message, "error");
    throw new Error(message);
  }

  const headers = { "Content-Type": "application/json" };
  if (store.tenantSlug) headers["X-Tenant-Slug"] = store.tenantSlug;
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

async function upload(method, path, formData) {
  if (!config.apiBaseUrl) {
    const message = "API no configurada. Defini la URL de Somee en assets/js/env.js.";
    toast(message, "error");
    throw new Error(message);
  }

  const headers = {};
  if (store.tenantSlug) headers["X-Tenant-Slug"] = store.tenantSlug;
  if (store.token) headers.Authorization = `Bearer ${store.token}`;

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers,
    body: formData
  });

  if (response.status === 401) {
    localStorage.removeItem("accessToken");
    location.hash = "#/login";
    throw new Error("Sesion expirada.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const message = payload.message || "No se pudo completar la operacion.";
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
  delete: path => request("DELETE", path),
  upload: (path, formData) => upload("POST", path, formData)
};
