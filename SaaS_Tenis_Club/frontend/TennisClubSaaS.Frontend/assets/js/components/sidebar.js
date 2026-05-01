import { t } from "../preferences.js?v=2026050124";

const linksByRole = {
  SuperAdmin: [
    ["#/superadmin", "D", "dashboardSaas"],
    ["#/tenants", "C", "tenants"],
    ["#/profile", "P", "profile"]
  ],
  ClubAdmin: [
    ["#/admin", "D", "dashboardClub"],
    ["#/reservations", "R", "reservations"],
    ["#/classes", "C", "classes"],
    ["#/coaches", "P", "coaches"],
    ["#/members", "S", "members"],
    ["#/payments", "$", "payments"],
    ["#/courts", "T", "courts"],
    ["#/settings", "A", "settings"],
    ["#/profile", "P", "profile"]
  ],
  Coach: [
    ["#/coach", "D", "classes"],
    ["#/classes", "C", "classes"],
    ["#/reservations", "R", "calendar"],
    ["#/profile", "P", "profile"]
  ],
  Member: [
    ["#/member", "D", "myPanel"],
    ["#/reservations", "R", "book"],
    ["#/classes", "C", "classes"],
    ["#/payments", "$", "myPayments"],
    ["#/profile", "P", "profile"]
  ]
};

const roleLabel = {
  SuperAdmin: "superAdmin",
  ClubAdmin: "clubAdmin",
  Coach: "coach",
  Member: "member"
};

function linksFor(role) {
  return linksByRole[role] || linksByRole.Member;
}

export function sidebar(currentHash, user) {
  const links = linksFor(user?.role);
  return `<aside class="sidebar">
    <div class="brand"><div class="brand-mark">T</div><div><div class="brand-title">SaaS Tenis</div><div class="brand-subtitle">${t("appSubtitle")}</div></div></div>
    <nav class="nav-links">${links.map(([href, icon, label]) => `<a class="nav-link ${currentHash === href ? "active" : ""}" href="${href}"><span>${icon}</span>${t(label)}</a>`).join("")}</nav>
    <div class="muted" style="padding: 8px 12px; margin-top: auto;">${t(roleLabel[user?.role] || "user")}</div>
    <button class="nav-link" data-action="logout">${t("logout")}</button>
  </aside>`;
}

export function mobileNav(currentHash, user) {
  const allLinks = linksFor(user?.role);
  const profileLink = allLinks.find(([href]) => href === "#/profile");
  const baseLinks = allLinks.filter(([href]) => href !== "#/profile").slice(0, profileLink ? 4 : 5);
  const links = profileLink ? baseLinks.concat([profileLink]) : baseLinks;
  return `<nav class="mobile-nav">${links.map(([href, icon, label]) => `<button class="${currentHash === href ? "active" : ""}" onclick="location.hash='${href}'"><span>${icon}</span><span>${t(label)}</span></button>`).join("")}</nav>`;
}
