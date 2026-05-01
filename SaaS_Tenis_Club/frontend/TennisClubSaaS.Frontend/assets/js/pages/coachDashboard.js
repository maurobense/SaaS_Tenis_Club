import { apiClient } from "../apiClient.js?v=2026050123";
import { badge, metricCard } from "../components/cards.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050123";
import { toast } from "../components/toast.js?v=2026050123";
import { formatDate, formatDateTime, translateElement } from "../preferences.js?v=2026050123";

const attendanceOptions = [
  [1, "Presente"],
  [2, "Ausente"],
  [3, "Tarde"],
  [4, "Justificado"]
];
const classSessionsApi = "/api/classsessions";

export async function coachDashboard() {
  const classes = await apiClient.get("/api/classes").catch(() => demoClasses());
  const rows = classes.map(normalizeClass);
  const totalStudents = rows.reduce((sum, item) => sum + item.activeStudents, 0);

  setTimeout(() => {
    document.querySelectorAll("[data-attendance-class]").forEach(button => {
      button.addEventListener("click", () => {
        const item = rows.find(x => String(x.id) === button.dataset.attendanceClass);
        if (item) openAttendanceModal(item);
      });
    });
  }, 0);

  return `<section class="page">
    <div class="page-head">
      <div><h1 class="page-title">Panel del profesor</h1><p class="page-subtitle">Clases asignadas, alumnos, asistencia y notas.</p></div>
    </div>
    <div class="grid cards">${[
      { label: "Clases hoy", value: rows.length, trend: "agenda" },
      { label: "Alumnos", value: totalStudents, trend: "activos" },
      { label: "Asistencia", value: "91%", trend: "ultimos 7 dias" },
      { label: "Notas", value: rows.filter(x => x.activeStudents > 0).length, trend: "seguimiento" }
    ].map(metricCard).join("")}</div>
    <article class="card panel">
      <div class="section-title"><h2>Agenda del profesor</h2><span class="badge">${rows.length} clases</span></div>
      ${rows.length ? `<div class="class-grid">${rows.map(renderClassCard).join("")}</div>` : `<div class="empty-state"><strong>Sin clases asignadas</strong><span>Cuando el club te asigne clases apareceran aca.</span></div>`}
    </article>
  </section>`;
}

function renderClassCard(item) {
  return `<article class="card class-card coach-class-card">
    <div class="class-card-head">${badge(item.level)}<span class="badge success">${item.activeStudents}/${item.maxStudents} cupos</span></div>
    <div>
      <h2>${escapeHtml(item.name)}</h2>
      <p class="muted">${escapeHtml(item.courtName || "Cancha a confirmar")} - ${item.day} ${item.startTime}</p>
    </div>
    <div class="capacity" aria-label="Ocupacion de cupos"><span style="width:${item.capacityPercent}%"></span></div>
    <div class="toolbar compact">
      <button class="btn" data-attendance-class="${escapeAttr(item.id)}">Marcar asistencia</button>
      <a class="btn ghost" href="#/classes">Ver alumnos</a>
    </div>
  </article>`;
}

export async function openAttendanceModal(trainingClass) {
  const modal = openModal({
    title: `Asistencia de clase - ${trainingClass.name}`,
    content: `<div class="skeleton-list"><span></span><span></span><span></span></div>`
  });

  const students = await apiClient.get(`/api/classes/${trainingClass.id}/students`).catch(() => []);
  const activeStudents = students.filter(x => x.status !== "WaitingList");
  modal.querySelector(".modal").classList.add("attendance-modal");
  modal.querySelector(".modal").innerHTML = `<div class="section-title"><div><h2>Asistencia de clase</h2><p class="muted">${escapeHtml(trainingClass.name)} - ${formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</p></div><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>
    ${activeStudents.length ? `<form id="attendance-form" class="grid">
      <div class="field"><label>Notas de la clase</label><textarea name="sessionNotes" rows="2" placeholder="Observaciones generales"></textarea></div>
      <div class="attendance-list">
        ${activeStudents.map(renderAttendanceRow).join("")}
      </div>
      <button class="btn" type="submit">Guardar asistencia</button>
    </form>` : `<div class="empty-state"><strong>Sin alumnos para esta clase</strong><span>Reserva cupos para poder marcar asistencia.</span></div>`}`;
  translateElement(modal);

  modal.querySelector("[data-close]")?.addEventListener("click", () => modal.remove());
  modal.querySelector("#attendance-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = activeStudents.map(student => ({
      memberProfileId: student.memberProfileId,
      attendanceStatus: Number(values.get(`status-${student.memberProfileId}`) || 1),
      notes: values.get(`notes-${student.memberProfileId}`) || null
    }));

    try {
      const session = await ensureClassSession(trainingClass, values.get("sessionNotes"));
      await apiClient.post(`${classSessionsApi}/${session.id}/attendance`, payload);
      await apiClient.patch(`${classSessionsApi}/${session.id}/complete`, {});
      toast("Asistencia guardada.");
      modal.remove();
    } catch {}
  });
}

function renderAttendanceRow(student) {
  return `<div class="attendance-row">
    <div>
      <strong>${escapeHtml(student.fullName)}</strong>
      <span class="muted">${escapeHtml(student.email || "")}</span>
    </div>
    <div class="field"><label>Estado</label><select name="status-${escapeAttr(student.memberProfileId)}">
      ${attendanceOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
    </select></div>
    <div class="field"><label>Notas del alumno</label><input name="notes-${escapeAttr(student.memberProfileId)}" placeholder="Opcional"></div>
  </div>`;
}

async function ensureClassSession(trainingClass, notes) {
  const today = new Date().toISOString().slice(0, 10);
  const sessions = await apiClient.get(classSessionsApi).catch(() => []);
  const existing = sessions.find(session =>
    String(session.trainingClassId || session.TrainingClassId) === String(trainingClass.id) &&
    String(session.sessionDate || session.SessionDate).slice(0, 10) === today &&
    Number(session.status || session.Status || 1) !== 3
  );
  if (existing) return normalizeSession(existing);

  const startTime = trainingClass.startTime || "19:00";
  const endTime = trainingClass.endTime || addOneHour(startTime);
  const created = await apiClient.post(classSessionsApi, {
    trainingClassId: trainingClass.id,
    sessionDate: today,
    startDateTime: `${today}T${startTime}:00`,
    endDateTime: `${today}T${endTime}:00`,
    status: 1,
    notes: notes || null
  });

  return { id: created };
}

function normalizeClass(item) {
  const activeStudents = Number(item.activeStudents || 0);
  const maxStudents = Number(item.maxStudents || 0);
  return {
    id: item.id,
    name: item.name || "Clase",
    courtName: item.courtName,
    day: dayName(item.dayOfWeek),
    startTime: timeOnly(item.startTime),
    endTime: timeOnly(item.endTime),
    activeStudents,
    maxStudents,
    level: levelName(item.level),
    capacityPercent: Math.min(100, (activeStudents / Math.max(maxStudents, 1)) * 100)
  };
}

function normalizeSession(session) {
  return { id: session.id || session.Id };
}

function addOneHour(value) {
  const [hour, minute] = String(value || "19:00").split(":").map(Number);
  return `${String((hour + 1) % 24).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
}

function dayName(value) {
  return { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miercoles", 4: "Jueves", 5: "Viernes", 6: "Sabado", Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miercoles", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sabado", Sunday: "Domingo" }[value] || value || "Horario";
}

function levelName(value) {
  return { 1: "Inicial", 2: "Intermedio", 3: "Avanzado", 4: "Ninos", 5: "Adultos", 6: "Competicion", 7: "Personalizado", Beginner: "Inicial", Intermediate: "Intermedio", Advanced: "Avanzado", Kids: "Ninos", Adults: "Adultos", Competition: "Competicion", Custom: "Personalizado" }[value] || value || "Nivel";
}

function timeOnly(value) {
  return String(value || "").slice(0, 5);
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function demoClasses() {
  return [
    { id: "1", name: "Adultos intermedio", courtName: "Cancha 1", dayOfWeek: new Date().getDay(), startTime: "19:00", endTime: "20:00", maxStudents: 8, activeStudents: 6, level: 2 },
    { id: "2", name: "Ninos inicial", courtName: "Cancha 2", dayOfWeek: 6, startTime: "10:00", endTime: "11:00", maxStudents: 10, activeStudents: 8, level: 4 }
  ];
}
