import { auth, homeForRole } from "./auth.js?v=2026050125";
import { layout } from "./pages/layout.js?v=2026050137";
import { loginPage } from "./pages/login.js?v=2026050125";
import { superAdminDashboard } from "./pages/superAdminDashboard.js?v=2026050126";
import { tenantsPage } from "./pages/tenants.js?v=2026050135";
import { adminDashboard } from "./pages/adminDashboard.js?v=2026050136";
import { memberDashboard } from "./pages/memberDashboard.js?v=2026050131";
import { coachDashboard } from "./pages/coachDashboard.js?v=2026050131";
import { reservationsPage } from "./pages/reservations.js?v=2026050131";
import { classesPage } from "./pages/classes.js?v=2026050131";
import { membersPage } from "./pages/members.js?v=2026050131";
import { coachesPage } from "./pages/coaches.js?v=2026050131";
import { paymentsPage } from "./pages/payments.js?v=2026050131";
import { settingsPage } from "./pages/settings.js?v=2026050131";
import { profilePage } from "./pages/profile.js?v=2026050131";
import { courtsPage } from "./pages/courts.js?v=2026050131";
import { wireGlobalSearch } from "./components/navbar.js?v=2026050131";
import { translatePage } from "./preferences.js?v=2026050126";

const routes = {
  "#/superadmin": superAdminDashboard,
  "#/tenants": tenantsPage,
  "#/admin": adminDashboard,
  "#/member": memberDashboard,
  "#/coach": coachDashboard,
  "#/reservations": reservationsPage,
  "#/classes": classesPage,
  "#/members": membersPage,
  "#/coaches": coachesPage,
  "#/payments": paymentsPage,
  "#/settings": settingsPage,
  "#/profile": profilePage,
  "#/courts": courtsPage
};

const permissions = {
  SuperAdmin: ["#/superadmin", "#/tenants", "#/profile"],
  ClubAdmin: ["#/admin", "#/reservations", "#/classes", "#/coaches", "#/members", "#/payments", "#/settings", "#/courts", "#/profile"],
  Coach: ["#/coach", "#/classes", "#/reservations", "#/profile"],
  Member: ["#/member", "#/reservations", "#/classes", "#/payments", "#/profile"]
};

export async function renderRoute() {
  const app = document.querySelector("#app");
  const user = auth.user();
  const hash = location.hash || homeForRole(user?.role);
  if (hash === "#/login" || !auth.isAuthenticated()) {
    app.innerHTML = await loginPage();
    translatePage();
    return;
  }
  if (!user) {
    auth.logout();
    return;
  }
  const allowed = permissions[user.role] || permissions.Member;
  const safeHash = allowed.includes(hash) ? hash : homeForRole(user.role);
  if (safeHash !== hash) {
    location.hash = safeHash;
    return;
  }
  const page = routes[safeHash] || routes[homeForRole(user.role)];
  app.innerHTML = layout(await page(), safeHash);
  translatePage();
  wireGlobalSearch();
  document.querySelector("[data-action='logout']")?.addEventListener("click", auth.logout);
}
