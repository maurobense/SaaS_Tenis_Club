import { currentTenantSlug } from "./tenantContext.js?v=2026050145";

const runtimeConfig = window.TennisClubRuntimeConfig || {};
const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
const defaultApiBaseUrl = isLocalHost ? "http://localhost:64652" : "";
const savedApiBaseUrl = normalizeUrl(localStorage.getItem("apiBaseUrl"));
const runtimeApiBaseUrl = normalizeUrl(runtimeConfig.apiBaseUrl);
const apiBaseUrl = savedApiBaseUrl && !savedApiBaseUrl.includes("7108")
  ? savedApiBaseUrl
  : runtimeApiBaseUrl || defaultApiBaseUrl;

if (savedApiBaseUrl && savedApiBaseUrl.includes("7108")) {
  localStorage.removeItem("apiBaseUrl");
}

export const config = {
  apiBaseUrl,
  frontendBaseUrl: normalizeUrl(runtimeConfig.frontendBaseUrl) || (window.location.origin === "null" ? "" : window.location.origin),
  defaultTenantSlug: currentTenantSlug(runtimeConfig.defaultTenantSlug || (isLocalHost ? "club-demo" : "")),
  isLocalHost
};

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}
