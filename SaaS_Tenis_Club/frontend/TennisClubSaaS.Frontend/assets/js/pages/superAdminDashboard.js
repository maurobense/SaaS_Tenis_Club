import { apiClient } from "../apiClient.js?v=2026050124";
import { badge, metricCard } from "../components/cards.js?v=2026050124";
import { table } from "../components/table.js?v=2026050124";

const fallbackCards = [
  { label: "Clubes", value: "0", trend: "total", tone: "primary" },
  { label: "Clubes activos", value: "0", trend: "operativos", tone: "success" },
  { label: "Usuarios", value: "0", trend: "plataforma", tone: "primary" }
];

export async function superAdminDashboard() {
  const [dashboardCards, tenants] = await Promise.all([
    apiClient.get("/api/dashboard/superadmin").catch(() => fallbackCards),
    apiClient.get("/api/tenants").catch(() => [])
  ]);

  const realCards = normalizeCards(dashboardCards, tenants);
  const tenantRows = tenants.slice(0, 8).map(tenant => `<tr>
    <td><strong>${escapeHtml(tenant.name)}</strong><div class="muted">${escapeHtml(tenant.slug)}</div></td>
    <td><strong>${escapeHtml(planLabel(tenant.planType))}</strong><div class="muted">${formatMoney(tenant.monthlyPrice, tenant.billingCurrency)} / mes</div></td>
    <td>${escapeHtml(tenant.contactEmail || "-")}</td>
    <td><span class="color-dot" style="--dot:${escapeAttr(tenant.primaryColor || "#2563eb")}"></span>${escapeHtml(tenant.primaryColor || "-")}</td>
    <td>${badge(tenant.isActive ? "Activo" : "Inactivo", tenant.isActive ? "Active" : "Cancelled")}<div class="muted">${escapeHtml(billingStatusLabel(tenant.billingStatus))}</div></td>
    <td><a class="btn ghost" href="#/tenants">Gestionar</a></td>
  </tr>`);

  return `<section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">Panel SaaS</h1>
        <p class="page-subtitle">Gestion global de clubes, tenants, administradores y estado de la plataforma.</p>
      </div>
      <a class="btn" href="#/tenants">Administrar clubes</a>
    </div>

    <div class="grid cards">${realCards.map(metricCard).join("")}</div>

    <div class="grid two-col">
      <article class="card panel">
        <div class="section-title">
          <h2>Clubes recientes</h2>
          <a class="btn ghost" href="#/tenants">Ver todos</a>
        </div>
        ${tenantRows.length ? table(["Club", "Plan", "Contacto", "Marca", "Estado", "Accion"], tenantRows) : emptyState("Sin clubes", "Crea el primer club para empezar a operar la plataforma.")}
      </article>

      <aside class="card panel">
        <h2>Alcance del SuperAdmin</h2>
        <div class="permission-list">
          <div><strong>Plataforma</strong><span class="muted">Crear, editar, activar y desactivar clubes.</span></div>
          <div><strong>Administradores de club</strong><span class="muted">Crear credenciales, activar usuarios y resetear claves.</span></div>
          <div><strong>Aislamiento tenant</strong><span class="muted">Los admins, profes y socios operan solamente dentro de su club.</span></div>
          <div><strong>Perfil propio</strong><span class="muted">Cambiar datos personales, idioma, tema y contrasena desde Perfil.</span></div>
        </div>
      </aside>
    </div>
  </section>`;
}

function normalizeCards(cards, tenants) {
  const active = tenants.filter(x => x.isActive).length;
  const inactive = tenants.filter(x => !x.isActive).length;
  const fromApi = Array.isArray(cards) ? cards : fallbackCards;
  const enriched = fromApi.map(card => ({
    label: card.label,
    value: card.value,
    trend: card.trend,
    tone: card.tone || "primary"
  }));

  if (!enriched.some(x => x.label === "Clubes inactivos")) {
    enriched.push({ label: "Clubes inactivos", value: String(inactive), trend: "requieren revision", tone: inactive ? "danger" : "success" });
  }

  if (tenants.length && !enriched.some(x => x.label === "Clubes activos")) {
    enriched.push({ label: "Clubes activos", value: String(active), trend: "operativos", tone: "success" });
  }

  if (!enriched.some(x => x.label === "MRR estimado")) {
    const mrr = tenants
      .filter(x => x.isActive && x.slug !== "platform")
      .reduce((sum, tenant) => sum + Number(tenant.monthlyPrice || 0), 0);
    enriched.push({ label: "MRR estimado", value: formatMoney(mrr, "UYU"), trend: "suscripciones", tone: "success" });
  }

  return enriched.slice(0, 4);
}

function planLabel(value) {
  return ({ 1: "Basico", 2: "Pro", 3: "Premium", 4: "Personalizado" })[Number(value)] || "Pro";
}

function billingStatusLabel(value) {
  return ({ 1: "Prueba", 2: "Activo", 3: "Pago vencido", 4: "Suspendido", 5: "Cancelado" })[Number(value)] || "Prueba";
}

function formatMoney(value, currency = "UYU") {
  const amount = Number(value || 0);
  const prefix = currency === "UYU" ? "$U" : currency;
  return `${prefix} ${amount.toLocaleString("es-UY", { maximumFractionDigits: 0 })}`;
}

function emptyState(title, text) {
  return `<div class="empty-state"><strong>${title}</strong><span>${text}</span></div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
