const reservedPathSegments = new Set([
  "assets",
  "api",
  "favicon.ico",
  "index-html",
  "index.html",
  "robots.txt"
]);

export function normalizeTenantSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function tenantSlugFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const querySlug = normalizeTenantSlug(params.get("tenant") || params.get("club"));
  if (querySlug) return querySlug;

  const rawFirstSegment = window.location.pathname.split("/").filter(Boolean)[0] || "";
  const rawKey = rawFirstSegment.toLowerCase();
  if (!rawFirstSegment || reservedPathSegments.has(rawKey) || rawFirstSegment.includes(".")) return "";

  const firstSegment = normalizeTenantSlug(rawFirstSegment);
  if (!firstSegment || reservedPathSegments.has(firstSegment)) return "";
  return firstSegment;
}

export function syncTenantSlugFromLocation() {
  const slug = tenantSlugFromLocation();
  if (!slug) return "";

  const savedTenant = safeJson(localStorage.getItem("tenant"));
  if (savedTenant?.slug && normalizeTenantSlug(savedTenant.slug) !== slug) {
    localStorage.removeItem("tenant");
  }

  localStorage.setItem("tenantSlug", slug);
  return slug;
}

export function storedTenantSlug() {
  return normalizeTenantSlug(localStorage.getItem("tenantSlug"));
}

export function currentTenantSlug(fallback = "") {
  return syncTenantSlugFromLocation() || storedTenantSlug() || normalizeTenantSlug(fallback);
}

export function hasTenantInUrl() {
  return Boolean(tenantSlugFromLocation());
}

export function tenantDisplayNameFromSlug(slug) {
  const normalized = normalizeTenantSlug(slug);
  if (!normalized) return "Portal del club";
  if (normalized === "platform") return "Administracion";
  return normalized
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function tenantPortalUrl(slug, baseUrl = window.location.origin) {
  const normalized = normalizeTenantSlug(slug);
  const cleanBase = String(baseUrl || "").replace(/\/+$/, "");
  return `${cleanBase}/${normalized}/#/login`;
}

function safeJson(value) {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
}
