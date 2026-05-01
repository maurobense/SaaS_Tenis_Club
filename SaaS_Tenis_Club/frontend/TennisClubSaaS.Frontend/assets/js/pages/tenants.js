import { apiClient } from "../apiClient.js?v=2026050124";
import { badge } from "../components/cards.js?v=2026050124";
import { openModal } from "../components/modal.js?v=2026050124";
import { table } from "../components/table.js?v=2026050124";
import { toast } from "../components/toast.js?v=2026050124";
import { translateElement } from "../preferences.js?v=2026050126";

export async function tenantsPage() {
  const tenants = await apiClient.get("/api/tenants").catch(() => []);
  const active = tenants.filter(x => x.isActive).length;
  const inactive = tenants.length - active;
  const monthlyRevenue = tenants
    .filter(x => x.isActive && x.slug !== "platform")
    .reduce((sum, tenant) => sum + Number(tenant.monthlyPrice || 0), 0);

  setTimeout(() => wireTenantPage(tenants), 0);

  return `<section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">Clubes</h1>
        <p class="page-subtitle">Alta de tenants, identidad visual, estado operativo y administradores de cada club.</p>
      </div>
      <button class="btn" data-new-tenant>Nuevo club</button>
    </div>

    <div class="grid cards">
      ${metric("Clubes", tenants.length, "total")}
      ${metric("Activos", active, "operativos")}
      ${metric("Inactivos", inactive, "requieren revision")}
      ${metric("MRR estimado", formatMoney(monthlyRevenue, "UYU"), "suscripciones")}
    </div>

    <article class="card panel">
      ${tenants.length ? table(["Club", "Slug", "Plan", "Contacto", "Estado", "Acciones"], tenants.map(renderTenantRow)) : emptyState("Sin clubes", "Crea el primer club cliente del SaaS.")}
    </article>
  </section>`;
}

function wireTenantPage(tenants) {
  document.querySelector("[data-new-tenant]")?.addEventListener("click", () => openTenantModal());

  document.querySelectorAll("[data-edit-tenant]").forEach(button => {
    button.addEventListener("click", () => openTenantModal(findTenant(tenants, button.dataset.editTenant)));
  });

  document.querySelectorAll("[data-admins-tenant]").forEach(button => {
    button.addEventListener("click", () => openAdminsModal(findTenant(tenants, button.dataset.adminsTenant)));
  });

  document.querySelectorAll("[data-toggle-tenant]").forEach(button => {
    button.addEventListener("click", async () => {
      const tenant = findTenant(tenants, button.dataset.toggleTenant);
      if (!tenant || tenant.slug === "platform") return;
      const action = tenant.isActive ? "deactivate" : "activate";
      await apiClient.patch(`/api/tenants/${tenant.id}/${action}`, {});
      toast(tenant.isActive ? "Club desactivado." : "Club activado.");
      reloadSoon();
    });
  });

  document.querySelectorAll("[data-copy-slug]").forEach(button => {
    button.addEventListener("click", async () => {
      await navigator.clipboard?.writeText(button.dataset.copySlug || "");
      toast("Slug copiado.");
    });
  });
}

function renderTenantRow(tenant) {
  const isPlatform = tenant.slug === "platform";
  return `<tr>
    <td>
      <strong>${escapeHtml(tenant.name)}</strong>
      <div class="muted">${escapeHtml(tenant.address || "Sin direccion cargada")}</div>
    </td>
    <td><button class="tenant-slug" data-copy-slug="${escapeAttr(tenant.slug)}" title="Copiar slug">${escapeHtml(tenant.slug)}</button></td>
    <td>
      <strong>${escapeHtml(planLabel(tenant.planType))}</strong>
      <div class="muted">${formatMoney(tenant.monthlyPrice, tenant.billingCurrency)} / mes</div>
      <div class="muted">${escapeHtml(limitSummary(tenant))}</div>
    </td>
    <td>${escapeHtml(tenant.contactEmail || "-")}<div class="muted">${escapeHtml(tenant.contactPhone || "")}</div></td>
    <td>
      ${isPlatform ? badge("Plataforma") : badge(tenant.isActive ? "Activo" : "Inactivo", tenant.isActive ? "Active" : "Cancelled")}
      <div class="muted">${escapeHtml(billingStatusLabel(tenant.billingStatus))}</div>
    </td>
    <td>
      <div class="table-actions">
        <button class="btn ghost" data-edit-tenant="${escapeAttr(tenant.id)}">Editar</button>
        ${isPlatform ? "" : `<button class="btn ghost" data-admins-tenant="${escapeAttr(tenant.id)}">Admins</button>`}
        ${isPlatform ? "" : `<button class="btn ${tenant.isActive ? "danger-soft" : "secondary"}" data-toggle-tenant="${escapeAttr(tenant.id)}">${tenant.isActive ? "Desactivar" : "Activar"}</button>`}
      </div>
    </td>
  </tr>`;
}

function openTenantModal(tenant = null) {
  const isEdit = Boolean(tenant);
  const modal = openModal({
    title: isEdit ? "Editar club" : "Nuevo club",
    content: `<form id="tenant-form" class="grid">
      <div class="grid two-fields">
        <div class="field"><label>Nombre del club</label><input name="name" required value="${escapeAttr(tenant?.name || "")}" placeholder="Ej: Carrasco Lawn Tennis"></div>
        <div class="field"><label>Slug</label><input name="slug" required value="${escapeAttr(tenant?.slug || "")}" placeholder="carrasco-tenis" ${tenant?.slug === "platform" ? "readonly" : ""}></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Email de contacto</label><input name="contactEmail" type="email" required value="${escapeAttr(tenant?.contactEmail || "")}" placeholder="admin@club.com"></div>
        <div class="field"><label>Telefono</label><input name="contactPhone" value="${escapeAttr(tenant?.contactPhone || "")}" placeholder="Opcional"></div>
      </div>
      <div class="field"><label>Direccion</label><input name="address" value="${escapeAttr(tenant?.address || "")}" placeholder="Montevideo, Uruguay"></div>
      <div class="field"><label>Logo URL</label><input name="logoUrl" value="${escapeAttr(tenant?.logoUrl || "")}" placeholder="https://..."></div>
      <div class="tenant-admin-box">
        <div>
          <strong>Plan comercial</strong>
          <p class="form-hint">Define como se factura este club dentro del SaaS y que limites comerciales tiene.</p>
        </div>
        <div class="grid three-fields">
          <div class="field"><label>Plan</label><select name="planType">${planOptions(tenant?.planType)}</select></div>
          <div class="field"><label>Estado facturacion</label><select name="billingStatus">${billingStatusOptions(tenant?.billingStatus)}</select></div>
          <div class="field"><label>Moneda</label><input name="billingCurrency" value="${escapeAttr(tenant?.billingCurrency || "UYU")}" maxlength="8"></div>
        </div>
        <div class="grid three-fields">
          <div class="field"><label>Precio mensual</label><input name="monthlyPrice" type="number" min="0" step="1" value="${escapeAttr(tenant?.monthlyPrice ?? 5990)}"></div>
          <div class="field"><label>Inicio suscripcion</label><input name="subscriptionStartedAt" type="date" value="${dateInput(tenant?.subscriptionStartedAt)}"></div>
          <div class="field"><label>Fin de prueba</label><input name="trialEndsAt" type="date" value="${dateInput(tenant?.trialEndsAt)}"></div>
        </div>
        <div class="grid three-fields">
          <div class="field"><label>Max. canchas</label><input name="maxCourts" type="number" min="-1" value="${escapeAttr(tenant?.maxCourts ?? 10)}"><small class="form-hint">Usa -1 para ilimitado.</small></div>
          <div class="field"><label>Max. socios</label><input name="maxMembers" type="number" min="-1" value="${escapeAttr(tenant?.maxMembers ?? 500)}"><small class="form-hint">Usa -1 para ilimitado.</small></div>
          <div class="field"><label>Max. profesores</label><input name="maxCoaches" type="number" min="-1" value="${escapeAttr(tenant?.maxCoaches ?? 15)}"><small class="form-hint">Usa -1 para ilimitado.</small></div>
        </div>
        <div class="field"><label>Notas comerciales</label><textarea name="billingNotes" rows="3" placeholder="Condiciones especiales, descuento, contrato, contacto de facturacion...">${escapeHtml(tenant?.billingNotes || "")}</textarea></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Color principal</label><input name="primaryColor" type="color" value="${escapeAttr(tenant?.primaryColor || "#2563eb")}"></div>
        <div class="field"><label>Color secundario</label><input name="secondaryColor" type="color" value="${escapeAttr(tenant?.secondaryColor || "#10b981")}"></div>
      </div>
      ${isEdit ? "" : initialAdminFields()}
      <button class="btn" type="submit">${isEdit ? "Guardar club" : "Crear club"}</button>
    </form>`
  });

  modal.querySelector("#tenant-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = tenantPayload(values);
    const savedTenant = isEdit
      ? await apiClient.put(`/api/tenants/${tenant.id}`, payload)
      : await apiClient.post("/api/tenants", payload);

    if (!isEdit && values.adminEmail) {
      await createTenantAdmin(savedTenant.id, values);
    }

    toast(isEdit ? "Club actualizado correctamente." : "Club creado correctamente.");
    modal.remove();
    reloadSoon();
  });
}

function initialAdminFields() {
  return `<div class="tenant-admin-box">
    <div>
      <strong>Administrador inicial del club</strong>
      <p class="form-hint">Opcional, pero recomendado: deja creado el usuario ClubAdmin con sus credenciales.</p>
    </div>
    <div class="grid two-fields">
      <div class="field"><label>Nombre admin</label><input name="adminFirstName" placeholder="Nombre"></div>
      <div class="field"><label>Apellido admin</label><input name="adminLastName" placeholder="Apellido"></div>
    </div>
    <div class="field"><label>Email admin</label><input name="adminEmail" type="email" placeholder="admin@club.com"></div>
    <div class="grid two-fields">
      <div class="field"><label>Contrasena inicial</label><input name="adminPassword" type="password" placeholder="Admin123!"></div>
      <div class="field"><label>Confirmar contrasena</label><input name="adminConfirmPassword" type="password" placeholder="Admin123!"></div>
    </div>
  </div>`;
}

async function openAdminsModal(tenant) {
  if (!tenant) return;
  const modal = openModal({
    title: `Administradores - ${tenant.name}`,
    content: `<div class="skeleton-list"><span></span><span></span><span></span></div>`
  });
  modal.querySelector(".modal").classList.add("tenant-modal");

  const admins = await apiClient.get(`/api/tenants/${tenant.id}/admins`).catch(() => []);
  renderAdminsModal(modal, tenant, admins);
}

function renderAdminsModal(modal, tenant, admins) {
  const shell = modal.querySelector(".modal");
  shell.innerHTML = `<div class="section-title">
    <div><h2>Administradores - ${escapeHtml(tenant.name)}</h2><p class="muted">${escapeHtml(tenant.slug)}</p></div>
    <button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button>
  </div>
  <div class="section-title">
    <p class="form-hint">Estos usuarios pueden administrar canchas, socios, profesores, clases, pagos y configuracion del club.</p>
    <button class="btn" data-new-admin>Nuevo admin</button>
  </div>
  ${admins.length ? `<div class="admin-list">${admins.map(admin => adminRow(tenant, admin)).join("")}</div>` : emptyState("Sin administradores", "Crea un ClubAdmin para que el club pueda operar.")}
  `;

  translateElement(shell);
  shell.querySelector("[data-close]").addEventListener("click", () => modal.remove());
  shell.querySelector("[data-new-admin]").addEventListener("click", () => openCreateAdminModal(tenant, modal));
  shell.querySelectorAll("[data-toggle-admin]").forEach(button => {
    button.addEventListener("click", async () => {
      const action = button.dataset.adminActive === "true" ? "deactivate" : "activate";
      await apiClient.patch(`/api/tenants/${tenant.id}/admins/${button.dataset.toggleAdmin}/${action}`, {});
      toast(action === "activate" ? "Administrador activado." : "Administrador desactivado.");
      const updated = await apiClient.get(`/api/tenants/${tenant.id}/admins`).catch(() => []);
      renderAdminsModal(modal, tenant, updated);
    });
  });
  shell.querySelectorAll("[data-reset-admin]").forEach(button => {
    button.addEventListener("click", () => openResetAdminPasswordModal(tenant, button.dataset.resetAdmin));
  });
}

function adminRow(tenant, admin) {
  return `<div class="admin-row">
    <div>
      <strong>${escapeHtml(admin.firstName)} ${escapeHtml(admin.lastName)}</strong>
      <span class="muted">${escapeHtml(admin.email)}${admin.phone ? ` - ${escapeHtml(admin.phone)}` : ""}</span>
      <small class="muted">Ultimo ingreso: ${formatDateTime(admin.lastLoginAt)}</small>
    </div>
    <div class="table-actions">
      ${badge(admin.isActive ? "Active" : "Inactive", admin.isActive ? "Active" : "Cancelled")}
      <button class="btn ghost" data-reset-admin="${escapeAttr(admin.id)}">Resetear clave</button>
      <button class="btn ${admin.isActive ? "danger-soft" : "secondary"}" data-toggle-admin="${escapeAttr(admin.id)}" data-admin-active="${admin.isActive}">${admin.isActive ? "Desactivar" : "Activar"}</button>
    </div>
  </div>`;
}

function openCreateAdminModal(tenant, adminsModal) {
  const modal = openModal({
    title: "Nuevo administrador",
    content: `<form id="tenant-admin-form" class="grid">
      <div class="grid two-fields">
        <div class="field"><label>Nombre</label><input name="adminFirstName" required></div>
        <div class="field"><label>Apellido</label><input name="adminLastName" required></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Email</label><input name="adminEmail" type="email" required></div>
        <div class="field"><label>Telefono</label><input name="adminPhone"></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Contrasena inicial</label><input name="adminPassword" type="password" required></div>
        <div class="field"><label>Confirmar contrasena</label><input name="adminConfirmPassword" type="password" required></div>
      </div>
      <p class="form-hint">La clave debe tener mayuscula, minuscula, numero y simbolo. El admin luego puede cambiarla desde Perfil.</p>
      <button class="btn" type="submit">Crear administrador</button>
    </form>`
  });

  modal.querySelector("#tenant-admin-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await createTenantAdmin(tenant.id, values);
    toast("Administrador creado correctamente.");
    modal.remove();
    if (adminsModal?.isConnected) {
      const admins = await apiClient.get(`/api/tenants/${tenant.id}/admins`).catch(() => []);
      renderAdminsModal(adminsModal, tenant, admins);
    }
  });
}

function openResetAdminPasswordModal(tenant, adminId) {
  const modal = openModal({
    title: "Resetear clave",
    content: `<form id="reset-admin-form" class="grid">
      <div class="field"><label>Nueva contrasena</label><input name="newPassword" type="password" required></div>
      <div class="field"><label>Confirmar contrasena</label><input name="confirmPassword" type="password" required></div>
      <p class="form-hint">Usa al menos 8 caracteres con mayuscula, minuscula, numero y simbolo.</p>
      <button class="btn" type="submit">Actualizar clave</button>
    </form>`
  });

  modal.querySelector("#reset-admin-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await apiClient.patch(`/api/tenants/${tenant.id}/admins/${adminId}/reset-password`, {
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword
    });
    toast("Clave del administrador actualizada.");
    modal.remove();
  });
}

async function createTenantAdmin(tenantId, values) {
  if (!values.adminEmail) return;
  await apiClient.post(`/api/tenants/${tenantId}/admins`, {
    firstName: values.adminFirstName,
    lastName: values.adminLastName,
    email: values.adminEmail,
    phone: values.adminPhone || null,
    password: values.adminPassword,
    confirmPassword: values.adminConfirmPassword,
    isActive: true
  });
}

function tenantPayload(values) {
  return {
    name: values.name,
    slug: values.slug,
    contactEmail: values.contactEmail,
    contactPhone: values.contactPhone || null,
    logoUrl: values.logoUrl || null,
    primaryColor: values.primaryColor || "#2563eb",
    secondaryColor: values.secondaryColor || "#10b981",
    address: values.address || null,
    planType: numberOrNull(values.planType) || 2,
    billingStatus: numberOrNull(values.billingStatus) || 1,
    monthlyPrice: numberOrNull(values.monthlyPrice) ?? 5990,
    billingCurrency: (values.billingCurrency || "UYU").trim().toUpperCase(),
    maxCourts: numberOrNull(values.maxCourts),
    maxMembers: numberOrNull(values.maxMembers),
    maxCoaches: numberOrNull(values.maxCoaches),
    trialEndsAt: values.trialEndsAt || null,
    subscriptionStartedAt: values.subscriptionStartedAt || null,
    subscriptionEndsAt: values.subscriptionEndsAt || null,
    billingNotes: values.billingNotes || null
  };
}

function metric(label, value, trend) {
  return `<article class="card metric"><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><span class="metric-trend">${trend}</span></article>`;
}

function emptyState(title, text) {
  return `<div class="empty-state"><strong>${title}</strong><span>${text}</span></div>`;
}

function findTenant(tenants, id) {
  return tenants.find(x => String(x.id) === String(id));
}

function reloadSoon() {
  setTimeout(() => location.reload(), 350);
}

function formatDateTime(value) {
  if (!value) return "Sin ingresos";
  return new Date(value).toLocaleString("es-UY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function planLabel(value) {
  return ({ 1: "Basico", 2: "Pro", 3: "Premium", 4: "Personalizado" })[Number(value)] || "Pro";
}

function billingStatusLabel(value) {
  return ({ 1: "Prueba", 2: "Activo", 3: "Pago vencido", 4: "Suspendido", 5: "Cancelado" })[Number(value)] || "Prueba";
}

function planOptions(selected = 2) {
  return [
    [1, "Basico"],
    [2, "Pro"],
    [3, "Premium"],
    [4, "Personalizado"]
  ].map(([value, label]) => `<option value="${value}" ${Number(selected || 2) === value ? "selected" : ""}>${label}</option>`).join("");
}

function billingStatusOptions(selected = 1) {
  return [
    [1, "Prueba"],
    [2, "Activo"],
    [3, "Pago vencido"],
    [4, "Suspendido"],
    [5, "Cancelado"]
  ].map(([value, label]) => `<option value="${value}" ${Number(selected || 1) === value ? "selected" : ""}>${label}</option>`).join("");
}

function formatMoney(value, currency = "UYU") {
  const amount = Number(value || 0);
  const prefix = currency === "UYU" ? "$U" : currency;
  return `${prefix} ${amount.toLocaleString("es-UY", { maximumFractionDigits: 0 })}`;
}

function limitSummary(tenant) {
  return `${limitText(tenant.maxCourts, "canchas")} / ${limitText(tenant.maxMembers, "socios")}`;
}

function limitText(value, label) {
  return value === null || value === undefined ? `${label} ilimitado` : `${value} ${label}`;
}

function dateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number < 0 ? null : number;
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
