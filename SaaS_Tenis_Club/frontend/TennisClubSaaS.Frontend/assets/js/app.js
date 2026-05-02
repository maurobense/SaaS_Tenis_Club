import { renderRoute } from "./router.js?v=2026050202";
import { applyTenantTheme } from "./components/cards.js?v=2026050125";
import { applyPreferences } from "./preferences.js?v=2026050126";
import { syncTenantSlugFromLocation } from "./tenantContext.js?v=2026050145";

syncTenantSlugFromLocation();
applyPreferences();
applyTenantTheme(JSON.parse(localStorage.getItem("tenant") || "null"));
window.addEventListener("hashchange", renderRoute);
renderRoute();
