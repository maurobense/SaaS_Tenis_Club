import { apiClient } from "./apiClient.js?v=2026050145";
import { applyTenantTheme } from "./components/cards.js?v=2026050124";
import { currentTenantSlug, normalizeTenantSlug } from "./tenantContext.js?v=2026050145";

export const auth = {
  user() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user) user.role = normalizeRole(user.role);
    return user;
  },
  isAuthenticated() {
    return Boolean(localStorage.getItem("accessToken"));
  },
  async login({ email, password, tenantSlug }) {
    const selectedTenantSlug = normalizeTenantSlug(tenantSlug || currentTenantSlug());
    if (!selectedTenantSlug) {
      throw new Error("Ingresa con el link de tu club o escribi el slug asignado.");
    }

    localStorage.setItem("tenantSlug", selectedTenantSlug);
    const data = await apiClient.post("/api/auth/login", { email, password, tenantSlug: selectedTenantSlug });
    data.user.role = normalizeRole(data.user.role);
    const resolvedTenantSlug = normalizeTenantSlug(data.tenant?.slug || selectedTenantSlug);
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("tenantSlug", resolvedTenantSlug);
    localStorage.setItem("user", JSON.stringify(data.user));
    if (data.tenant) {
      localStorage.setItem("tenant", JSON.stringify(data.tenant));
      applyTenantTheme(data.tenant);
    }
    return data.user;
  },
  logout() {
    ["accessToken", "refreshToken", "user"].forEach(k => localStorage.removeItem(k));
    location.hash = "#/login";
  }
};

export function homeForRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === "SuperAdmin") return "#/superadmin";
  if (normalized === "Member") return "#/member";
  if (normalized === "Coach") return "#/coach";
  return "#/admin";
}

export function normalizeRole(role) {
  const roles = {
    1: "SuperAdmin",
    2: "ClubAdmin",
    3: "Coach",
    4: "Member"
  };
  return roles[role] || role;
}
