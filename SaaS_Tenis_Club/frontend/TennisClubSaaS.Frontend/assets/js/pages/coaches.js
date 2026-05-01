import { apiClient } from "../apiClient.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050131";
import { table } from "../components/table.js?v=2026050123";
import { toast } from "../components/toast.js?v=2026050123";
import { translateElement } from "../preferences.js?v=2026050123";

export async function coachesPage() {
  const rows = await apiClient.get("/api/coaches").catch(() => [
    { id: "55555555-5555-5555-5555-555555555555", name: "Carla Profesora", specialty: "Competicion y adultos", isActive: true }
  ]);

  setTimeout(() => {
    document.querySelector("[data-new-coach]")?.addEventListener("click", () => openCoachModal());
    document.querySelectorAll("[data-view-coach-classes]").forEach(btn => btn.addEventListener("click", () => openCoachClassesModal(btn.dataset.viewCoachClasses, btn.dataset.coachName)));
    document.querySelectorAll("[data-reset-coach-password]").forEach(btn => btn.addEventListener("click", () => openResetCoachPasswordModal(btn.dataset.resetCoachPassword, btn.dataset.coachName)));
  }, 0);

  return `<section class="page">
    <div class="page-head">
      <div><h1 class="page-title">Profesores</h1><p class="page-subtitle">Usuarios profesor, especialidades, clases asignadas y disponibilidad.</p></div>
      <button class="btn" data-new-coach>Nuevo profesor</button>
    </div>
    <div class="grid cards">${[
      { label: "Profesores activos", value: rows.filter(x => x.isActive !== false).length, trend: "habilitados" },
      { label: "Clases asignadas", value: "2", trend: "semana actual" },
      { label: "Asistencia", value: "91%", trend: "promedio reciente" },
      { label: "Notas pendientes", value: "5", trend: "seguimiento" }
    ].map(x=>`<article class="card metric"><span class="metric-label">${x.label}</span><strong class="metric-value">${x.value}</strong><span class="metric-trend">${x.trend}</span></article>`).join("")}</div>
    <article class="card panel">${table(["Profesor","Usuario","Especialidad","Estado","Accion"], rows.map(c => `<tr><td><strong>${c.name || "Profesor"}</strong></td><td><div>${c.email || "-"}</div><div class="muted">${c.phone || "Sin telefono"}</div></td><td>${c.specialty || "-"}</td><td><span class="badge ${c.isActive === false || c.userIsActive === false ? "danger" : "success"}">${c.isActive === false || c.userIsActive === false ? "Inactivo" : "Activo"}</span></td><td><div class="table-actions"><button class="btn ghost" data-view-coach-classes="${c.id}" data-coach-name="${escapeAttr(c.name || "Profesor")}">Ver clases</button><button class="btn ghost" data-reset-coach-password="${c.id}" data-coach-name="${escapeAttr(c.name || "Profesor")}">Resetear clave</button></div></td></tr>`))}</article>
  </section>`;
}

async function openCoachClassesModal(coachId, coachName) {
  const modal = openModal({
    title: `Clases de ${coachName}`,
    content: `<div class="skeleton-list"><span></span><span></span></div>`
  });
  const classes = await apiClient.get(`/api/coaches/${coachId}/classes`).catch(() => []);
  modal.querySelector(".modal").innerHTML = `<div class="section-title"><h2>Clases asignadas</h2><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>
    ${classes.length ? `<div class="student-list">${classes.map(c => `<div class="student-row"><div><strong>${c.name || "Clase"}</strong><span>${dayName(c.dayOfWeek)} ${String(c.startTime || "").slice(0, 5)} - cupo ${c.maxStudents || "-"}</span></div><span class="badge success">${c.isActive === false ? "Inactiva" : "Activa"}</span></div>`).join("")}</div>` : `<div class="empty-state"><strong>Sin clases asignadas</strong><span>Cuando se le asignen clases al profesor apareceran aca.</span></div>`}`;
  translateElement(modal);
  modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
}

function openResetCoachPasswordModal(coachId, coachName) {
  const modal = openModal({
    title: `Resetear clave - ${coachName}`,
    content: `<form id="reset-coach-password-form" class="grid">
      <div class="field"><label>Nueva contrasena</label><input name="newPassword" type="password" minlength="8" required autocomplete="new-password"></div>
      <div class="field"><label>Confirmar contrasena</label><input name="confirmPassword" type="password" minlength="8" required autocomplete="new-password"></div>
      <p class="form-hint">El profesor podra iniciar sesion con esta clave y cambiarla luego desde Perfil.</p>
      <button class="btn" type="submit">Actualizar clave</button>
    </form>`
  });
  modal.querySelector("#reset-coach-password-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (values.newPassword !== values.confirmPassword) {
      toast("La confirmacion de contrasena no coincide.");
      return;
    }
    try {
      await apiClient.patch(`/api/coaches/${coachId}/reset-password`, values);
      toast("Clave del profesor actualizada.");
      modal.remove();
    } catch {}
  });
}

function dayName(value) {
  return { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miercoles", 4: "Jueves", 5: "Viernes", 6: "Sabado", Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miercoles", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sabado", Sunday: "Domingo" }[value] || value || "Horario";
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function openCoachModal() {
  const modal = openModal({
    title: "Nuevo profesor",
    content: `<form id="coach-form" class="grid">
      <div class="grid two-fields">
        <div class="field"><label>Nombre</label><input name="firstName" required></div>
        <div class="field"><label>Apellido</label><input name="lastName" required></div>
      </div>
      <div class="field"><label>Correo electronico</label><input name="email" type="email" required></div>
      <div class="field"><label>Telefono</label><input name="phone"></div>
      <div class="grid two-fields">
        <div class="field"><label>Contrasena inicial</label><input name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="Minimo 8 caracteres"></div>
        <div class="field"><label>Confirmar contrasena</label><input name="confirmPassword" type="password" minlength="8" required autocomplete="new-password"></div>
      </div>
      <div class="field"><label>Especialidad</label><input name="specialty" placeholder="Ej: adultos, kids, competencia"></div>
      <div class="field"><label>Bio / observaciones</label><textarea name="bio" rows="2" placeholder="Resumen interno del perfil del profesor"></textarea></div>
      <label class="check-row"><input name="isActive" type="checkbox" checked> Profesor activo y habilitado para iniciar sesion</label>
      <p class="form-hint">La contrasena debe tener mayuscula, minuscula, numero y simbolo. El profesor puede cambiarla luego desde Perfil.</p>
      <button class="btn" type="submit">Crear profesor</button>
    </form>`
  });

  modal.querySelector("#coach-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (values.password !== values.confirmPassword) {
      toast("La confirmacion de contrasena no coincide.");
      return;
    }
    await apiClient.post("/api/coaches", {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || null,
      password: values.password,
      confirmPassword: values.confirmPassword,
      specialty: values.specialty || null,
      bio: values.bio || null,
      isActive: values.isActive === "on"
    });
    toast("Profesor creado con credenciales de acceso.");
    modal.remove();
    setTimeout(() => location.reload(), 600);
  });
}
