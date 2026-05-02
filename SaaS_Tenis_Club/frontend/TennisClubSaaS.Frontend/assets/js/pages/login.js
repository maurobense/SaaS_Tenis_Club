import { auth, homeForRole } from "../auth.js?v=2026050145";
import { config } from "../config.js?v=2026050145";
import { applyTenantTheme } from "../components/cards.js?v=2026050124";
import { toast } from "../components/toast.js?v=2026050124";
import { currentTenantSlug, hasTenantInUrl, tenantDisplayNameFromSlug, tenantPortalUrl } from "../tenantContext.js?v=2026050145";

export async function loginPage() {
  const tenantSlug = currentTenantSlug(config.defaultTenantSlug);
  const tenant = await resolvePublicTenant(tenantSlug);
  const lockedTenant = hasTenantInUrl();
  const clubName = tenant?.name || tenantDisplayNameFromSlug(tenantSlug);
  const isPlatform = tenantSlug === "platform";
  const showDemoHelp = config.isLocalHost || window.location.protocol === "file:";
  const tenantLink = tenantSlug ? tenantPortalUrl(tenantSlug, config.frontendBaseUrl) : "";
  document.title = `${clubName} | Portal`;

  setTimeout(() => {
    document.querySelector("#login-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        const user = await auth.login(Object.fromEntries(form.entries()));
        location.hash = homeForRole(user.role);
      } catch (error) {
        toast(error.message || "No se pudo iniciar sesion. Verifica club y credenciales.", "error");
      }
    });
  }, 0);

  return `<section class="login-screen"><div class="login-panel">
    <div class="login-brand">
      <div class="login-brand-content">
        ${tenant?.logoUrl ? `<img class="login-logo" src="${escapeAttr(tenant.logoUrl)}" alt="${escapeAttr(clubName)}">` : `<div class="login-logo">${initials(clubName)}</div>`}
        <span class="login-kicker">${isPlatform ? "Acceso interno" : "Portal del club"}</span>
        <h1>${escapeHtml(clubName)}</h1>
        <p>${isPlatform ? "Administracion central de clubes y accesos." : "Reservas, clases y gestion diaria en un solo lugar."}</p>
      </div>
      <div class="login-access-card">
        <span>${tenantSlug ? "Link de acceso" : "Acceso por club"}</span>
        <strong>${tenantSlug ? escapeHtml(`/${tenantSlug}/`) : "Solicita el link de tu club"}</strong>
        ${tenantLink ? `<small>${escapeHtml(tenantLink)}</small>` : ""}
      </div>
    </div>
    <form id="login-form" class="login-form">
      <div><h2>Ingresar</h2><p class="muted">${lockedTenant ? "Usa las credenciales asignadas por tu club." : "Ingresa el slug del club junto con tus credenciales."}</p></div>
      ${lockedTenant
        ? `<input name="tenantSlug" type="hidden" value="${escapeAttr(tenantSlug)}"><div class="login-tenant-summary"><span>Club</span><strong>${escapeHtml(clubName)}</strong></div>`
        : `<div class="field"><label>Club</label><input name="tenantSlug" value="${escapeAttr(tenantSlug)}" placeholder="slug-del-club" required /></div>`}
      <div class="field"><label>Correo electronico</label><input name="email" type="email" value="${showDemoHelp ? "admin@clubdemo.com" : ""}" autocomplete="email" required /></div>
      <div class="field"><label>Contrasena</label><input name="password" type="password" value="${showDemoHelp ? "Admin123!" : ""}" autocomplete="current-password" required /></div>
      <button class="btn" type="submit">Ingresar al panel</button>
      ${config.apiBaseUrl ? "" : `<p class="login-warning">Falta configurar la URL de la API en assets/js/env.js antes de publicar.</p>`}
      ${showDemoHelp ? `<details class="login-dev-hint"><summary>Usuarios demo</summary><p>SuperAdmin: platform / superadmin@saastennis.com / Admin123!. Admin: club-demo / admin@clubdemo.com / Admin123!. Profesor: coach@clubdemo.com / Coach123!. Socio: socio@clubdemo.com / Socio123!.</p></details>` : ""}
    </form>
  </div></section>`;
}

async function resolvePublicTenant(slug) {
  const savedTenant = safeJson(localStorage.getItem("tenant"));
  const hasSavedTenant = savedTenant?.slug === slug;
  if (hasSavedTenant) {
    applyTenantTheme(savedTenant);
  }

  if (!slug || !config.apiBaseUrl) return hasSavedTenant ? savedTenant : null;

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/public/tenants/${encodeURIComponent(slug)}`, {
      headers: { "Content-Type": "application/json", "X-Tenant-Slug": slug }
    });
    if (!response.ok) return hasSavedTenant ? savedTenant : null;
    const payload = await response.json().catch(() => ({}));
    const tenant = payload.data ?? payload;
    if (!tenant?.slug) return hasSavedTenant ? savedTenant : null;
    localStorage.setItem("tenant", JSON.stringify(tenant));
    applyTenantTheme(tenant);
    return tenant;
  } catch {
    return hasSavedTenant ? savedTenant : null;
  }
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
