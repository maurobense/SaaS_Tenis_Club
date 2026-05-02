import { apiClient } from "../apiClient.js?v=2026050123";
import { badge } from "../components/cards.js?v=2026050123";
import { confirmModal, openModal } from "../components/modal.js?v=2026050131";
import { table } from "../components/table.js?v=2026050123";
import { toast } from "../components/toast.js?v=2026050123";

const surfaceOptions = [
  [1, "Polvo de ladrillo"],
  [2, "Dura"],
  [3, "Cesped"],
  [4, "Sintetica"],
  [5, "Otra"]
];

const locationOptions = [
  [1, "Techada"],
  [2, "Exterior"]
];

export async function courtsPage() {
  const courts = await apiClient.get("/api/courts").catch(() => []);

  setTimeout(() => {
    document.querySelector("[data-new-court]")?.addEventListener("click", () => openCourtModal());
    document.querySelectorAll("[data-edit-court]").forEach(btn => btn.addEventListener("click", () => openCourtModal(courts.find(x => String(x.id) === btn.dataset.editCourt))));
    document.querySelectorAll("[data-delete-court]").forEach(btn => btn.addEventListener("click", () => confirmDeleteCourt(btn.dataset.deleteCourt)));
  }, 0);

  return `<section class="page">
    <div class="page-head">
      <div><h1 class="page-title">Canchas</h1><p class="page-subtitle">Alta, disponibilidad, luces, superficie y horarios operativos.</p></div>
      <button class="btn" data-new-court>Nueva cancha</button>
    </div>

    <div class="grid cards">
      ${[
        { label: "Activas", value: courts.filter(x => x.isActive !== false).length, trend: "disponibles" },
        { label: "Con luces", value: courts.filter(x => x.hasLights).length, trend: "apto noche" },
        { label: "Slot promedio", value: `${averageSlot(courts)} min`, trend: "duracion" },
        { label: "Total", value: courts.length, trend: "canchas" }
      ].map(x => `<article class="card metric"><span class="metric-label">${x.label}</span><strong class="metric-value">${x.value}</strong><span class="metric-trend">${x.trend}</span></article>`).join("")}
    </div>

    <section class="court-grid">
      ${courts.length ? courts.map(c => `<article class="card court-card">
        <div class="court-card-head">
          <div style="display:flex; gap:12px; align-items:center;"><span class="court-mark">T</span><div><h2>${escapeHtml(c.name)}</h2><p class="muted">${surfaceName(c.surfaceType)} - ${locationName(c.indoorOutdoor)}</p></div></div>
          ${badge(c.isActive ? "Active" : "Inactive")}
        </div>
        <div class="court-meta">
          <div><span>Horario</span><strong>${timeOnly(c.openingTime)} - ${timeOnly(c.closingTime)}</strong></div>
          <div><span>Turno</span><strong>${c.slotDurationMinutes || 60} min</strong></div>
          <div><span>Luces</span><strong>${c.hasLights ? "Si" : "No"}</strong></div>
        </div>
        <div class="toolbar compact">
          <button class="btn ghost" data-edit-court="${escapeAttr(c.id)}">Editar</button>
          <button class="btn danger-soft" data-delete-court="${escapeAttr(c.id)}">Desactivar</button>
        </div>
      </article>`).join("") : `<div class="empty-state"><strong>Sin canchas cargadas</strong><span>Crea una cancha activa para comenzar a ofrecer turnos.</span></div>`}
    </section>

    <article class="card panel">${courts.length ? table(["Nombre","Superficie","Tipo","Luces","Horario","Slot","Estado"], courts.map(c => `<tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${surfaceName(c.surfaceType)}</td>
      <td>${locationName(c.indoorOutdoor)}</td>
      <td>${c.hasLights ? "Si" : "No"}</td>
      <td>${timeOnly(c.openingTime)} - ${timeOnly(c.closingTime)}</td>
      <td>${c.slotDurationMinutes || 60} min</td>
      <td>${badge(c.isActive ? "Active" : "Inactive")}</td>
    </tr>`)) : `<div class="empty-state compact-empty"><strong>No hay canchas para listar</strong><span>La tabla se completa cuando cargues la primera cancha.</span></div>`}</article>
  </section>`;
}

function openCourtModal(court = null) {
  const modal = openModal({
    title: court ? "Editar cancha" : "Nueva cancha",
    content: `<form id="court-form" class="grid">
      <div class="field"><label>Nombre</label><input name="name" required value="${escapeAttr(court?.name || "")}" placeholder="Ej: Cancha 5"></div>
      <div class="grid two-fields">
        <div class="field"><label>Superficie</label><select name="surfaceType">${surfaceOptions.map(([value, label]) => `<option value="${value}" ${enumValue(court?.surfaceType) === value ? "selected" : ""}>${label}</option>`).join("")}</select></div>
        <div class="field"><label>Tipo</label><select name="indoorOutdoor">${locationOptions.map(([value, label]) => `<option value="${value}" ${enumValue(court?.indoorOutdoor) === value ? "selected" : ""}>${label}</option>`).join("")}</select></div>
      </div>
      <div class="grid two-fields">
        <div class="field"><label>Apertura</label><input name="openingTime" type="time" value="${timeOnly(court?.openingTime) || "08:00"}" required></div>
        <div class="field"><label>Cierre</label><input name="closingTime" type="time" value="${timeOnly(court?.closingTime) || "22:00"}" required></div>
      </div>
      <div class="field"><label>Duracion del turno</label><input name="slotDurationMinutes" type="number" min="15" step="15" value="${court?.slotDurationMinutes || 60}" required></div>
      <div class="preference-strip">
        <label class="check-row"><input name="hasLights" type="checkbox" ${court?.hasLights ? "checked" : ""}> Tiene luces</label>
        <label class="check-row"><input name="isActive" type="checkbox" ${court?.isActive !== false ? "checked" : ""}> Cancha activa</label>
      </div>
      <button class="btn" type="submit">${court ? "Guardar cancha" : "Crear cancha"}</button>
    </form>`
  });

  modal.querySelector("#court-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const payload = {
      name: values.name.trim(),
      surfaceType: Number(values.surfaceType),
      indoorOutdoor: Number(values.indoorOutdoor),
      hasLights: values.hasLights === "on",
      isActive: values.isActive === "on",
      openingTime: normalizeTime(values.openingTime),
      closingTime: normalizeTime(values.closingTime),
      slotDurationMinutes: Number(values.slotDurationMinutes)
    };

    try {
      if (court?.id) await apiClient.put(`/api/courts/${court.id}`, payload);
      else await apiClient.post("/api/courts", payload);
      toast(court ? "Cancha actualizada." : "Cancha creada.");
      modal.remove();
      setTimeout(() => location.reload(), 500);
    } catch {}
  });
}

function confirmDeleteCourt(id) {
  confirmModal({
    title: "Desactivar cancha",
    body: "La cancha queda fuera de uso para nuevas reservas, pero se conserva el historial.",
    confirmText: "Desactivar",
    onConfirm: () => deleteCourt(id)
  });
}

async function deleteCourt(id) {
  if (!id) return;
  try {
    await apiClient.delete(`/api/courts/${id}`);
    toast("Cancha desactivada.");
    setTimeout(() => location.reload(), 500);
  } catch {}
}

function averageSlot(courts) {
  if (!courts.length) return 0;
  return Math.round(courts.reduce((sum, x) => sum + Number(x.slotDurationMinutes || 60), 0) / courts.length);
}

function enumValue(value) {
  if (typeof value === "number") return value;
  const map = { Clay: 1, Hard: 2, Grass: 3, Synthetic: 4, Other: 5, Indoor: 1, Outdoor: 2 };
  return map[value] || Number(value) || 1;
}

function surfaceName(value) {
  return surfaceOptions.find(([id]) => id === enumValue(value))?.[1] || value || "-";
}

function locationName(value) {
  return locationOptions.find(([id]) => id === enumValue(value))?.[1] || value || "-";
}

function timeOnly(value) {
  return String(value || "").slice(0, 5);
}

function normalizeTime(value) {
  return String(value || "").length === 5 ? `${value}:00` : value;
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
