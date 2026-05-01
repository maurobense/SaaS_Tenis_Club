import { renderRoute } from "./router.js?v=2026050137";
import { applyTenantTheme } from "./components/cards.js?v=2026050125";
import { applyPreferences } from "./preferences.js?v=2026050126";

applyPreferences();
applyTenantTheme(JSON.parse(localStorage.getItem("tenant") || "null"));
window.addEventListener("hashchange", renderRoute);
renderRoute();
