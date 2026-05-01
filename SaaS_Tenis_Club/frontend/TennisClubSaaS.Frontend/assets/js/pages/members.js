import { apiClient } from "../apiClient.js?v=2026050123";
import { badge } from "../components/cards.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050131";
import { table } from "../components/table.js?v=2026050123";
import { toast } from "../components/toast.js?v=2026050123";
import { translateElement } from "../preferences.js?v=2026050123";

export async function membersPage() {
  const rows = await apiClient.get("/api/members").catch(() => [
    { id: "demo-1", fullName: "Sofia Socio", email: "socio@clubdemo.com", memberNumber: "M-0001", membershipStatus: "Active", noShowCount: 0, isActive: true },
    { id: "demo-2", fullName: "Mateo Perez", email: "mateo@example.com", memberNumber: "M-0002", membershipStatus: "Overdue", noShowCount: 1, isActive: true }
  ]);

  setTimeout(() => {
    document.querySelector("[data-new-member]")?.addEventListener("click", () => openMemberModal());
    document.querySelectorAll("[data-view-member]").forEach(btn => {
      btn.addEventListener("click", () => {
        const member = rows.find(x => String(x.id) === btn.dataset.viewMember);
        openMemberProfileModal(member);
      });
    });
  }, 0);

  return `<section class="page">
    <div class="page-head">
      <div><h1 class="page-title">Socios</h1><p class="page-subtitle">Perfiles, membresias, pagos, historial y no-shows.</p></div>
      <button class="btn" data-new-member>Nuevo socio</button>
    </div>
    <div class="grid cards">${[
      { label: "Activos", value: rows.filter(x => x.isActive).length, trend: "habilitados" },
      { label: "Vencidos", value: rows.filter(x => isOverdue(x.membershipStatus)).length, trend: "requieren gestion" },
      { label: "No-shows", value: rows.reduce((sum, x) => sum + (x.noShowCount || 0), 0), trend: "acumulados" },
      { label: "Total socios", value: rows.length, trend: "en el club" }
    ].map(x=>`<article class="card metric"><span class="metric-label">${x.label}</span><strong class="metric-value">${x.value}</strong><span class="metric-trend">${x.trend}</span></article>`).join("")}</div>
    <article class="card panel">${table(["Socio","Correo","Nro","Membresia","No-show","Estado","Accion"], rows.map(m => `<tr><td><strong>${escapeHtml(m.fullName)}</strong></td><td>${escapeHtml(m.email)}</td><td>${escapeHtml(m.memberNumber)}</td><td>${membershipBadge(m.membershipStatus)}</td><td>${m.noShowCount || 0}</td><td>${badge(m.isActive ? "Active" : "Inactive")}</td><td><button class="btn ghost" data-view-member="${escapeAttr(m.id)}">Ver perfil</button></td></tr>`))}</article>
  </section>`;
}

async function openMemberProfileModal(member) {
  if (!member) return;
  const modal = openModal({
    title: "Perfil del socio",
    content: `<div class="skeleton-list"><span></span><span></span><span></span></div>`
  });
  modal.querySelector(".modal").classList.add("member-profile-modal");

  const [detail, payments, reservations, classes] = await Promise.all([
    apiClient.get(`/api/members/${member.id}`).catch(() => member),
    apiClient.get(`/api/members/${member.id}/payments`).catch(() => []),
    apiClient.get(`/api/members/${member.id}/reservations`).catch(() => []),
    apiClient.get(`/api/members/${member.id}/classes`).catch(() => [])
  ]);

  const profile = normalizeMemberDetail(member, detail);
  const shell = modal.querySelector(".modal");
  shell.classList.add("member-profile-modal");
  shell.innerHTML = `<div class="section-title"><div><h2>Perfil del socio</h2><p class="muted">${escapeHtml(profile.memberNumber || "")}</p></div><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>
    <div class="member-profile-grid">
      <aside class="profile-summary member-profile-card">
        <div class="profile-avatar">${initials(profile.fullName)}</div>
        <h2>${escapeHtml(profile.fullName)}</h2>
        <p class="muted">${escapeHtml(profile.email)}</p>
        ${membershipBadge(profile.membershipStatus)}
        <div class="profile-kpis">
          <div><span>No-shows</span><strong>${profile.noShowCount || 0}</strong></div>
          <div><span>Estado</span><strong>${profile.isActive ? "Activo" : "Inactivo"}</strong></div>
        </div>
      </aside>
      <div class="grid">
        <section class="member-profile-section">
          <h2>Datos principales</h2>
          <div class="detail-grid">
            ${detailItem("Nro. socio", profile.memberNumber)}
            ${detailItem("Telefono", profile.phone || "Sin telefono")}
            ${detailItem("Documento", profile.documentNumber || "Sin documento")}
            ${detailItem("Ingreso", formatDate(profile.joinedAt))}
            ${detailItem("No-shows", String(profile.noShowCount || 0))}
            ${detailItem("Estado usuario", profile.isActive ? "Activo" : "Inactivo")}
          </div>
          ${profile.notes ? `<p class="form-hint">${escapeHtml(profile.notes)}</p>` : ""}
        </section>
        <section class="member-profile-section">
          <div class="section-title"><h2>Actividad</h2><span class="badge">${payments.length + reservations.length + classes.length} registros</span></div>
          <div class="activity-grid">
            ${activityBlock("Pagos", payments, p => `$ ${Number(p.amount || 0).toLocaleString("es-UY")} - ${statusText(p.status)} - ${formatDate(p.paymentDate)}`)}
            ${activityBlock("Reservas", reservations, r => `${formatDateTime(r.startDateTime)} - ${statusText(r.status)}`)}
            ${activityBlock("Clases", classes, c => `${statusText(c.status)} - ${formatDate(c.enrolledAt)}`)}
          </div>
        </section>
        <div class="toolbar">
          <button class="btn ${profile.isActive ? "danger-soft" : ""}" data-toggle-member="${profile.isActive ? "deactivate" : "activate"}">${profile.isActive ? "Desactivar socio" : "Activar socio"}</button>
        </div>
      </div>
    </div>`;
  translateElement(modal);

  modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
  modal.querySelector("[data-toggle-member]")?.addEventListener("click", async event => {
    const action = event.currentTarget.dataset.toggleMember;
    try {
      await apiClient.patch(`/api/members/${member.id}/${action}`, {});
      toast(action === "activate" ? "Socio activado." : "Socio desactivado.");
      modal.remove();
      setTimeout(() => location.reload(), 400);
    } catch {}
  });
}

function openMemberModal() {
  const modal = openModal({
    title: "Nuevo socio",
    content: `<form id="member-form" class="grid">
      <div class="grid two-fields">
        <div class="field"><label>Nombre</label><input name="firstName" required></div>
        <div class="field"><label>Apellido</label><input name="lastName" required></div>
      </div>
      <div class="field"><label>Correo electronico</label><input name="email" type="email" required></div>
      <div class="field"><label>Telefono</label><input name="phone" placeholder="Opcional"></div>
      <div class="grid two-fields">
        <div class="field"><label>Documento</label><input name="documentNumber"></div>
        <div class="field"><label>Fecha de nacimiento</label><input name="birthDate" type="date"></div>
      </div>
      <div class="field"><label>Notas administrativas</label><textarea name="notes" rows="3"></textarea></div>
      <button class="btn" type="submit">Crear socio</button>
    </form>`
  });

  modal.querySelector("#member-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || null,
      documentNumber: values.documentNumber || null,
      birthDate: values.birthDate || null,
      notes: values.notes || null
    };
    await apiClient.post("/api/members", payload);
    toast("Socio creado. Se asigno la contrasena inicial Socio123!.");
    modal.remove();
    setTimeout(() => location.reload(), 600);
  });
}

function normalizeMemberDetail(row, detail) {
  const user = detail?.user || {};
  return {
    id: row.id,
    fullName: detail?.fullName || row.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: detail?.email || row.email || user.email || "",
    phone: detail?.phone || user.phone || "",
    memberNumber: row.memberNumber || detail?.memberNumber || "",
    documentNumber: detail?.documentNumber || "",
    joinedAt: detail?.joinedAt || null,
    notes: detail?.notes || "",
    membershipStatus: row.membershipStatus || detail?.membershipStatus || "Active",
    noShowCount: row.noShowCount ?? detail?.noShowCount ?? 0,
    isActive: row.isActive ?? user.isActive ?? true
  };
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${label}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
}

function activityBlock(title, items, map) {
  return `<div><strong>${title}</strong><div class="mini-list">${items.length ? items.slice(0, 4).map(x => `<div class="mini-row"><span>${escapeHtml(map(x))}</span></div>`).join("") : `<div class="mini-row"><span class="muted">Sin registros</span></div>`}</div></div>`;
}

function initials(name) {
  return String(name || "S").split(" ").filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase();
}

function statusText(value) {
  const labels = { 1: "Pendiente", 2: "Pago", 3: "Vencido", 4: "Cancelado", 5: "Exento", Active: "Activo", Pending: "Pendiente", Paid: "Pago", Overdue: "Vencido", Cancelled: "Cancelado", Confirmed: "Confirmado", Completed: "Completado", NoShow: "No-show", WaitingList: "Lista de espera" };
  return labels[value] || value || "-";
}

function membershipBadge(value) {
  const text = membershipText(value);
  const tone = isOverdue(value) || value === "Suspended" || value === 5 ? "Overdue" : value === "Inactive" || value === 2 ? "Cancelled" : "Active";
  return badge(text, tone);
}

function membershipText(value) {
  const labels = { 1: "Activo", 2: "Inactivo", 3: "Pendiente", 4: "Vencido", 5: "Suspendido", Active: "Activo", Inactive: "Inactivo", Pending: "Pendiente", Overdue: "Vencido", Suspended: "Suspendido" };
  return labels[value] || value || "-";
}

function isOverdue(value) {
  return value === "Overdue" || value === 4;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-UY");
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-UY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
