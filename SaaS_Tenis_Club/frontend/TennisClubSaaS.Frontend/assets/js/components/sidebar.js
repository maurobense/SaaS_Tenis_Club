import { t } from "../preferences.js?v=2026050124";

const linksByRole = {
  SuperAdmin: [
    ["#/superadmin", "layout-dashboard", "dashboardSaas"],
    ["#/tenants", "building-2", "tenants"],
    ["#/profile", "user-circle", "profile"]
  ],
  ClubAdmin: [
    ["#/admin", "layout-dashboard", "dashboardClub"],
    ["#/reservations", "calendar-days", "reservations"],
    ["#/classes", "graduation-cap", "classes"],
    ["#/coaches", "badge-user", "coaches"],
    ["#/members", "users", "members"],
    ["#/payments", "credit-card", "payments"],
    ["#/courts", "rectangle-horizontal", "courts"],
    ["#/settings", "settings", "settings"],
    ["#/profile", "user-circle", "profile"]
  ],
  Coach: [
    ["#/coach", "layout-dashboard", "classes"],
    ["#/classes", "graduation-cap", "classes"],
    ["#/reservations", "calendar-days", "calendar"],
    ["#/profile", "user-circle", "profile"]
  ],
  Member: [
    ["#/member", "home", "myPanel"],
    ["#/reservations", "calendar-plus", "book"],
    ["#/classes", "graduation-cap", "classes"],
    ["#/payments", "wallet", "myPayments"],
    ["#/profile", "user-circle", "profile"]
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
  const brand = brandFor(user);
  return `<aside class="sidebar">
    <div class="brand"><div class="brand-mark">${brand.logoUrl ? `<img src="${escapeAttr(brand.logoUrl)}" alt="${escapeAttr(brand.title)}">` : escapeHtml(initials(brand.title))}</div><div><div class="brand-title">${escapeHtml(brand.title)}</div><div class="brand-subtitle">${escapeHtml(brand.subtitle)}</div></div></div>
    <nav class="nav-links">${links.map(([href, iconName, label]) => `<a class="nav-link ${currentHash === href ? "active" : ""}" href="${href}"><span class="nav-icon" aria-hidden="true">${icon(iconName)}</span><span class="nav-label">${t(label)}</span></a>`).join("")}</nav>
    <div class="muted" style="padding: 8px 12px; margin-top: auto;">${t(roleLabel[user?.role] || "user")}</div>
    <button class="nav-link" data-action="logout">${t("logout")}</button>
  </aside>`;
}

export function mobileNav(currentHash, user) {
  const allLinks = linksFor(user?.role);
  const profileLink = allLinks.find(([href]) => href === "#/profile");
  const baseLinks = allLinks.filter(([href]) => href !== "#/profile").slice(0, profileLink ? 4 : 5);
  const links = profileLink ? baseLinks.concat([profileLink]) : baseLinks;
  return `<nav class="mobile-nav">${links.map(([href, iconName, label]) => `<button class="${currentHash === href ? "active" : ""}" onclick="location.hash='${href}'"><span class="mobile-nav-icon" aria-hidden="true">${icon(iconName)}</span><span>${t(label)}</span></button>`).join("")}</nav>`;
}

function icon(name) {
  const paths = {
    "layout-dashboard": `<rect width="7" height="9" x="3" y="3" rx="1.5"></rect><rect width="7" height="5" x="14" y="3" rx="1.5"></rect><rect width="7" height="9" x="14" y="12" rx="1.5"></rect><rect width="7" height="5" x="3" y="16" rx="1.5"></rect>`,
    "calendar-days": `<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path>`,
    "calendar-plus": `<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path><path d="M12 14v5"></path><path d="M9.5 16.5h5"></path>`,
    "graduation-cap": `<path d="M21.4 10.5 12 5 2.6 10.5 12 16l9.4-5.5Z"></path><path d="M6 12.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"></path><path d="M22 10v6"></path>`,
    "badge-user": `<path d="M3.8 5.8A2 2 0 0 1 5.8 4h12.4a2 2 0 0 1 2 1.8l.7 12.4a2 2 0 0 1-2 2.2H5.1a2 2 0 0 1-2-2.2l.7-12.4Z"></path><circle cx="12" cy="10" r="2.5"></circle><path d="M7.8 17c.8-2 2.3-3 4.2-3s3.4 1 4.2 3"></path>`,
    users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`,
    "credit-card": `<rect width="20" height="14" x="2" y="5" rx="2"></rect><path d="M2 10h20"></path><path d="M6 15h2"></path><path d="M10 15h4"></path>`,
    wallet: `<path d="M19 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7"></path><path d="M16 14h.01"></path>`,
    "rectangle-horizontal": `<rect width="20" height="12" x="2" y="6" rx="2"></rect><path d="M6 10h12"></path><path d="M6 14h12"></path>`,
    settings: `<path d="M12.2 2h-.4a2 2 0 0 0-2 2l-.1.7a2 2 0 0 1-1 1.5l-.6.3a2 2 0 0 1-1.8 0l-.6-.3a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.6.4a2 2 0 0 1 0 3.4l-.6.4a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.6-.3a2 2 0 0 1 1.8 0l.6.3a2 2 0 0 1 1 1.5l.1.7a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2l.1-.7a2 2 0 0 1 1-1.5l.6-.3a2 2 0 0 1 1.8 0l.6.3a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.6-.4a2 2 0 0 1 0-3.4l.6-.4a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.6.3a2 2 0 0 1-1.8 0l-.6-.3a2 2 0 0 1-1-1.5l-.1-.7a2 2 0 0 0-2-2Z"></path><circle cx="12" cy="12" r="3"></circle>`,
    "user-circle": `<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.7c.9-2.7 2.6-4.1 5-4.1s4.1 1.4 5 4.1"></path>`,
    "building-2": `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"></path><path d="M6 12H4a2 2 0 0 0-2 2v8"></path><path d="M18 9h2a2 2 0 0 1 2 2v11"></path><path d="M10 6h4"></path><path d="M10 10h4"></path><path d="M10 14h4"></path><path d="M10 18h4"></path>`,
    home: `<path d="m3 11 9-8 9 8"></path><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path><path d="M9 21v-6h6v6"></path>`
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths["layout-dashboard"]}</svg>`;
}

function brandFor(user) {
  if (user?.role === "SuperAdmin") {
    return { title: "SaaS Tenis", subtitle: t("appSubtitle"), logoUrl: "" };
  }

  const tenant = safeJson(localStorage.getItem("tenant"));
  return {
    title: tenant?.name || "Club",
    subtitle: "Gestion del club",
    logoUrl: tenant?.logoUrl || ""
  };
}

function initials(value) {
  return String(value || "Club")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "C";
}

function safeJson(value) {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
