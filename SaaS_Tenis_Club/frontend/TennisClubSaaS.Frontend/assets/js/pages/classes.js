import { apiClient } from "../apiClient.js?v=2026050123";
import { auth } from "../auth.js?v=2026050123";
import { badge } from "../components/cards.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050131";
import { table } from "../components/table.js?v=2026050123";
import { toast } from "../components/toast.js?v=2026050123";
import { translateElement } from "../preferences.js?v=2026050123";
import { openAttendanceModal } from "./coachDashboard.js?v=2026050123";

const dayLabel = { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miercoles", 4: "Jueves", 5: "Viernes", 6: "Sabado", Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miercoles", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sabado", Sunday: "Domingo" };
const levelLabel = { 1: "Inicial", 2: "Intermedio", 3: "Avanzado", 4: "Ninos", 5: "Adultos", 6: "Competicion", 7: "Personalizado", Beginner: "Inicial", Intermediate: "Intermedio", Advanced: "Avanzado", Kids: "Ninos", Adults: "Adultos", Competition: "Competicion", Custom: "Personalizado" };
const enrollmentLabel = { Active: "Inscripto", WaitingList: "Lista de espera", Cancelled: "Cancelado", Removed: "Removido" };
let rowsCache = [];

export async function classesPage() {
  const user = auth.user();
  const isAdmin = user?.role === "ClubAdmin" || user?.role === "SuperAdmin";
  const isCoach = user?.role === "Coach";
  const isMember = user?.role === "Member";
  const [classes, myEnrollments] = await Promise.all([
    apiClient.get("/api/classes").catch(() => demoClasses()),
    isMember ? apiClient.get("/api/classes/my-enrollments").catch(() => []) : Promise.resolve([])
  ]);
  const enrollmentMap = new Map(myEnrollments.map(x => [x.trainingClassId || x.TrainingClassId, x.status || x.Status]));
  const rows = classes.map(c => normalizeClass(c, enrollmentMap));
  rowsCache = rows;

  setTimeout(() => wireClassActions({ isAdmin, isCoach, isMember }), 0);

  return `<section class="page">
    <div class="page-head">
      <div>
        <h1 class="page-title">${isCoach ? "Mis clases" : "Clases"}</h1>
        <p class="page-subtitle">${subtitleForRole(user?.role)}</p>
      </div>
      ${isAdmin ? `<button class="btn" data-new-class>Nueva clase</button>` : ""}
    </div>
    ${rows.length ? renderClasses(rows, { isAdmin, isCoach, isMember }) : `<div class="empty-state"><strong>No hay clases disponibles</strong><span>Cuando el club publique clases las vas a ver aca.</span></div>`}
  </section>`;
}

function subtitleForRole(role) {
  if (role === "ClubAdmin" || role === "SuperAdmin") return "Gestion de cupos, profesores, horarios y lista de espera.";
  if (role === "Coach") return "Administra tus grupos, reserva cupos y revisa alumnos inscriptos.";
  return "Anotate a clases disponibles, revisa tu cupo o cancela tu inscripcion.";
}

function renderClasses(rows, context) {
  if (!context.isAdmin) {
    return `<div class="class-grid">${rows.map(c => `<article class="card class-card">
      <div class="class-card-head">
        <span>${badge(c.level)}</span>
        ${c.enrollmentStatus ? badge(enrollmentLabel[c.enrollmentStatus] || c.enrollmentStatus, c.enrollmentStatus) : ""}
      </div>
      <div>
        <h2>${c.name}</h2>
        <p class="muted">${c.coachName || "Profesor a confirmar"} - ${c.courtName || "Cancha a confirmar"}</p>
      </div>
      <div class="class-meta"><span>${c.day} ${c.startTime}</span><span>${c.activeStudents}/${c.maxStudents} cupos</span></div>
      <div class="capacity" aria-label="Ocupacion de cupos"><span style="width:${c.capacityPercent}%"></span></div>
      ${context.isCoach ? coachActions(c) : memberActions(c)}
    </article>`).join("")}</div>`;
  }

  return `<article class="card panel">${table(["Clase","Profesor","Horario","Cupo","Nivel","Accion"], rows.map(c => `<tr>
    <td><strong>${c.name}</strong><div class="muted">${c.courtName || "Sin cancha fija"}</div></td>
    <td>${c.coachName || "-"}</td>
    <td>${c.day} ${c.startTime}</td>
    <td>${c.activeStudents}/${c.maxStudents} ${c.waitingList ? badge("Espera " + c.waitingList, "WaitingList") : ""}</td>
    <td>${badge(c.level)}</td>
    <td><div class="table-actions"><button class="btn ghost" data-view-students="${c.id}" data-class-name="${escapeAttr(c.name)}">Alumnos</button><button class="btn" data-add-student="${c.id}" data-class-name="${escapeAttr(c.name)}">Agregar socio</button></div></td>
  </tr>`))}</article>`;
}

function coachActions(c) {
  return `<div class="toolbar compact">
    <button class="btn ghost" data-view-students="${c.id}" data-class-name="${escapeAttr(c.name)}">Ver alumnos</button>
    <button class="btn" data-add-student="${c.id}" data-class-name="${escapeAttr(c.name)}">Reservar cupo</button>
    <button class="btn secondary" data-mark-attendance="${c.id}">Marcar asistencia</button>
  </div>`;
}

function memberActions(c) {
  if (c.enrollmentStatus) {
    const text = c.enrollmentStatus === "WaitingList" ? "Salir de lista" : "Cancelar inscripcion";
    return `<button class="btn danger-soft" data-cancel-enroll="${c.id}">${text}</button>`;
  }
  const full = c.activeStudents >= c.maxStudents;
  return `<button class="btn" data-enroll="${c.id}">${full ? "Sumarme a espera" : "Anotarme"}</button>`;
}

function wireClassActions({ isAdmin, isCoach, isMember }) {
  if (isMember) {
    document.querySelectorAll("[data-enroll]").forEach(btn => btn.addEventListener("click", async () => {
      try {
        await apiClient.post(`/api/classes/${btn.dataset.enroll}/enroll`, {});
        toast("Inscripcion procesada.");
        setTimeout(() => location.reload(), 500);
      } catch {}
    }));

    document.querySelectorAll("[data-cancel-enroll]").forEach(btn => btn.addEventListener("click", async () => {
      try {
        await apiClient.patch(`/api/classes/${btn.dataset.cancelEnroll}/cancel-enrollment`, {});
        toast("Inscripcion cancelada.");
        setTimeout(() => location.reload(), 500);
      } catch {}
    }));
  }

  if (isAdmin || isCoach) {
    document.querySelectorAll("[data-add-student]").forEach(btn => btn.addEventListener("click", () => openAddStudentModal(btn.dataset.addStudent, btn.dataset.className)));
    document.querySelectorAll("[data-view-students]").forEach(btn => btn.addEventListener("click", () => openStudentsModal(btn.dataset.viewStudents, btn.dataset.className)));
    document.querySelectorAll("[data-mark-attendance]").forEach(btn => btn.addEventListener("click", () => {
      const card = rowsCache.find(x => String(x.id) === btn.dataset.markAttendance);
      if (card) openAttendanceModal(card);
    }));
  }

  document.querySelector("[data-new-class]")?.addEventListener("click", () => openClassModal());
}

async function openAddStudentModal(classId, className) {
  const modal = openModal({
    title: `Reservar cupo - ${className}`,
    content: `<div class="skeleton-list"><span></span><span></span><span></span></div>`
  });

  const members = await apiClient.get(`/api/classes/${classId}/eligible-members`).catch(() => []);
  modal.querySelector(".modal").innerHTML = `<div class="section-title"><h2>Reservar cupo</h2><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>
    <p class="muted">${className}</p>
    ${members.length ? `<form id="reserve-seat-form" class="grid">
      <div class="field"><label>Socio</label><select name="memberProfileId" required>${members.map(m => `<option value="${m.memberProfileId}">${m.fullName} - ${m.memberNumber} (${statusText(m.membershipStatus)})</option>`).join("")}</select></div>
      <button class="btn" type="submit">Confirmar cupo</button>
    </form>` : `<div class="empty-state"><strong>No hay socios disponibles</strong><span>Todos los socios activos ya estan inscriptos o en espera para esta clase.</span></div>`}`;
  translateElement(modal);
  modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
  modal.querySelector("#reserve-seat-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await apiClient.post(`/api/classes/${classId}/enroll-member`, { memberProfileId: v.memberProfileId });
      toast("Cupo reservado.");
      modal.remove();
      setTimeout(() => location.reload(), 500);
    } catch {}
  });
}

async function openStudentsModal(classId, className) {
  const modal = openModal({
    title: `Alumnos - ${className}`,
    content: `<div class="skeleton-list"><span></span><span></span><span></span></div>`
  });

  const students = await apiClient.get(`/api/classes/${classId}/students`).catch(() => []);
  modal.querySelector(".modal").innerHTML = `<div class="section-title"><h2>Alumnos</h2><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>
    <p class="muted">${className}</p>
    ${students.length ? `<div class="student-list">${students.map(s => `<div class="student-row">
      <div><strong>${s.fullName}</strong><span>${s.email}</span></div>
      <div class="toolbar compact">${badge(enrollmentLabel[s.status] || s.status, s.status)}<button class="btn ghost danger-text" data-remove-student="${s.memberProfileId}">Quitar</button></div>
    </div>`).join("")}</div>` : `<div class="empty-state"><strong>Sin alumnos todavia</strong><span>Reserva cupos para socios desde esta misma pantalla.</span></div>`}`;
  translateElement(modal);
  modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
  modal.querySelectorAll("[data-remove-student]").forEach(btn => btn.addEventListener("click", async () => {
    try {
      await apiClient.patch(`/api/classes/${classId}/members/${btn.dataset.removeStudent}/cancel-enrollment`, {});
      toast("Inscripcion cancelada.");
      modal.remove();
      setTimeout(() => location.reload(), 500);
    } catch {}
  }));
}

function openClassModal() {
  const modal = openModal({
    title: "Nueva clase",
    content: `<form id="class-form" class="grid">
      <div class="field"><label>Nombre</label><input name="name" required placeholder="Ej: Adultos intermedio"></div>
      <div class="field"><label>Descripcion</label><textarea name="description" rows="2"></textarea></div>
      <div class="grid two-fields">
        <div class="field"><label>Profesor</label><select name="coachId"><option value="55555555-5555-5555-5555-555555555555">Carla Profesora</option></select></div>
        <div class="field"><label>Cancha</label><select name="courtId"><option value="">Sin cancha fija</option><option value="77777777-7777-7777-7777-777777777771">Cancha 1</option><option value="77777777-7777-7777-7777-777777777772">Cancha 2</option></select></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Dia</label><select name="dayOfWeek"><option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miercoles</option><option value="4">Jueves</option><option value="5">Viernes</option><option value="6">Sabado</option><option value="0">Domingo</option></select></div>
        <div class="field"><label>Nivel</label><select name="level"><option value="1">Inicial</option><option value="2">Intermedio</option><option value="3">Avanzado</option><option value="4">Ninos</option><option value="5">Adultos</option><option value="6">Competicion</option></select></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Inicio</label><input name="startTime" type="time" value="19:00" required></div>
        <div class="field"><label>Fin</label><input name="endTime" type="time" value="20:00" required></div>
      </div>
      <div class="field"><label>Cupo maximo</label><input name="maxStudents" type="number" min="1" value="8" required></div>
      <button class="btn" type="submit">Crear clase</button>
    </form>`
  });

  modal.querySelector("#class-form").addEventListener("submit", async event => {
    event.preventDefault();
    const v = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await apiClient.post("/api/classes", {
        name: v.name,
        description: v.description || null,
        coachId: v.coachId,
        courtId: v.courtId || null,
        dayOfWeek: Number(v.dayOfWeek),
        startTime: v.startTime,
        endTime: v.endTime,
        maxStudents: Number(v.maxStudents),
        level: Number(v.level),
        isActive: true
      });
      toast("Clase creada.");
      modal.remove();
      setTimeout(() => location.reload(), 600);
    } catch {}
  });
}

function normalizeClass(c, enrollmentMap) {
  const activeStudents = c.activeStudents || 0;
  const maxStudents = c.maxStudents || 0;
  return {
    id: c.id,
    name: c.name,
    coachName: c.coachName,
    courtName: c.courtName,
    day: dayLabel[c.dayOfWeek] || c.dayOfWeek,
    startTime: String(c.startTime || "").slice(0, 5),
    endTime: String(c.endTime || "").slice(0, 5),
    maxStudents,
    activeStudents,
    waitingList: c.waitingList || 0,
    level: levelLabel[c.level] || c.level,
    enrollmentStatus: enrollmentMap.get(c.id),
    capacityPercent: Math.min(100, (activeStudents / Math.max(maxStudents, 1)) * 100)
  };
}

function statusText(value) {
  return { Active: "Activo", Inactive: "Inactivo", Suspended: "Suspendido", PendingApproval: "Pendiente" }[value] || value || "Sin estado";
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function demoClasses() {
  return [
    { id: "1", name: "Adultos intermedio", coachName: "Carla Profesora", courtName: "Cancha 1", dayOfWeek: 2, startTime: "19:00", maxStudents: 8, activeStudents: 6, waitingList: 0, level: 2 },
    { id: "2", name: "Ninos inicial", coachName: "Carla Profesora", courtName: "Cancha 2", dayOfWeek: 6, startTime: "10:00", maxStudents: 10, activeStudents: 8, waitingList: 1, level: 4 }
  ];
}
