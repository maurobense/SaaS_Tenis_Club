import { apiClient } from "../apiClient.js?v=2026050123";
import { auth } from "../auth.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050131";
import { toast } from "../components/toast.js?v=2026050123";
import { currentLocale, translateElement } from "../preferences.js?v=2026050123";

const playFormat = { Singles: 1, Doubles: 2 };
const adminReservationTypes = {
  Maintenance: 3,
  Tournament: 4,
  ClassBlock: 5,
  Weather: 6,
  InternalUse: 7
};

export async function reservationsPage() {
  const selectedDate = sessionStorage.getItem("reservationDate") || new Date().toISOString().slice(0, 10);
  const selectedCourt = sessionStorage.getItem("reservationCourt") || "all";
  const user = auth.user();
  const isAdmin = user?.role === "ClubAdmin" || user?.role === "SuperAdmin";
  const [slots, members, rules] = await Promise.all([
    apiClient.get(`/api/reservations/available-slots?date=${selectedDate}`).catch(() => demoSlots(selectedDate)),
    apiClient.get("/api/members/directory").catch(() => []),
    apiClient.get("/api/reservations/rules").catch(() => ({ guestPlayerFee: 300, maxReservationsPerWeek: 1, maxClassEnrollmentsPerWeek: 2 }))
  ]);
  const allCourts = groupByCourt(slots);
  const visibleSlots = selectedCourt === "all" ? slots : slots.filter(slot => slot.courtName === selectedCourt);
  const courts = groupByCourt(visibleSlots);

  setTimeout(() => {
    document.querySelector("#reservation-filter")?.addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      sessionStorage.setItem("reservationDate", form.get("date"));
      sessionStorage.setItem("reservationCourt", form.get("court") || "all");
      location.reload();
    });
    document.querySelectorAll("[data-slot]").forEach(btn => btn.addEventListener("click", () => openReservationModal(visibleSlots[Number(btn.dataset.slot)], members, rules)));
    document.querySelector("[data-block-time]")?.addEventListener("click", () => openBlockTimeModal(courts, slots, selectedDate));
  }, 0);

  return `<section class="page reservations-page">
    <div class="page-head">
      <div><h1 class="page-title">Reservas</h1><p class="page-subtitle">Agenda visual por cancha con disponibilidad en tiempo real.</p></div>
      ${isAdmin ? `<button class="btn ghost" data-block-time>Bloquear horario</button>` : ""}
    </div>

    <section class="booking-hero card">
      <div>
        <span class="eyebrow">Agenda</span>
        <h2>${new Date(`${selectedDate}T00:00:00`).toLocaleDateString(currentLocale(), { weekday: "long", day: "numeric", month: "long" })}</h2>
        <p>Al reservar se debe indicar si el partido es singles o dobles y cargar los jugadores adicionales.</p>
      </div>
      <div class="booking-stats">
        <div><strong>${visibleSlots.filter(x => x.isAvailable).length}</strong><span>turnos libres</span></div>
        <div><strong>${courts.length}</strong><span>canchas</span></div>
        <div><strong>${visibleSlots.filter(x => !x.isAvailable).length}</strong><span>ocupados</span></div>
      </div>
    </section>

    <article class="card panel filters-panel">
      <form id="reservation-filter" class="reservation-filter-form">
        <div class="field"><label>Fecha</label><input name="date" type="date" value="${selectedDate}"></div>
        <div class="field"><label>Cancha</label><select name="court"><option value="all">Todas las canchas</option>${allCourts.map(c => `<option value="${escapeAttr(c.name)}" ${selectedCourt === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></div>
        <button class="btn reservation-filter-button" type="submit">Buscar horarios</button>
      </form>
    </article>

    <section class="court-board">
      ${courts.length ? courts.map(court => `<article class="card court-lane">
        <div class="court-lane-head"><div><h2>${court.name}</h2><p class="muted">${court.available} libres de ${court.slots.length}</p></div><span class="badge success">Activa</span></div>
        <div class="slot-grid pro">${court.slots.map(s => renderSlot(s, visibleSlots.indexOf(s))).join("")}</div>
      </article>`).join("") : `<div class="empty-state"><strong>No hay horarios para mostrar</strong><span>Proba con otra fecha o cancha.</span></div>`}
    </section>
  </section>`;
}

function openBlockTimeModal(courts, slots, selectedDate) {
  const firstAvailable = slots.find(slot => slot.isAvailable) || slots[0];
  const defaults = blockDefaults(firstAvailable, selectedDate);
  const modal = openModal({
    title: "Bloquear horario",
    content: courts.length ? `<form id="block-time-form" class="grid">
      <div class="field"><label>Cancha</label><select name="courtId" required>${courts.map(court => `<option value="${escapeAttr(court.courtId)}" ${court.courtId === firstAvailable?.courtId ? "selected" : ""}>${escapeHtml(court.name)}</option>`).join("")}</select></div>
      <div class="grid three-fields">
        <div class="field"><label>Fecha</label><input name="date" type="date" value="${defaults.date}" required></div>
        <div class="field"><label>Inicio</label><input name="startTime" type="time" value="${defaults.startTime}" required></div>
        <div class="field"><label>Fin</label><input name="endTime" type="time" value="${defaults.endTime}" required></div>
      </div>
      <div class="field"><label>Motivo del bloqueo</label><select name="reservationType" required>
        <option value="${adminReservationTypes.Maintenance}">Mantenimiento</option>
        <option value="${adminReservationTypes.Tournament}">Torneo</option>
        <option value="${adminReservationTypes.ClassBlock}">Clase</option>
        <option value="${adminReservationTypes.Weather}">Clima</option>
        <option value="${adminReservationTypes.InternalUse}">Uso interno</option>
      </select></div>
      <div class="field"><label>Detalle interno</label><textarea name="reason" rows="3" placeholder="Ej: mantenimiento de luces, torneo o evento del club"></textarea></div>
      <p class="form-hint">El bloqueo ocupa la cancha y evita reservas superpuestas en ese horario.</p>
      <button class="btn" type="submit">Guardar bloqueo</button>
    </form>` : `<div class="empty-state"><strong>No hay canchas disponibles</strong><span>Primero crea una cancha activa para poder bloquear horarios.</span></div>`
  });
  translateElement(modal);

  modal.querySelector("#block-time-form")?.addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const startDateTime = `${values.date}T${values.startTime}:00`;
    const endDateTime = `${values.date}T${values.endTime}:00`;

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      toast("El horario de fin debe ser posterior al inicio.", "error");
      return;
    }

    try {
      await apiClient.post("/api/reservations/admin", {
        courtId: values.courtId,
        memberProfileId: null,
        startDateTime,
        endDateTime,
        reservationType: Number(values.reservationType),
        reason: values.reason || null,
        playFormat: playFormat.Singles,
        players: []
      });
      toast("Horario bloqueado.");
      modal.remove();
      setTimeout(() => location.reload(), 500);
    } catch {}
  });
}

function openReservationModal(slot, members, rules) {
  const guestFee = Number(rules?.guestPlayerFee ?? 300);
  const modal = openModal({
    title: "Confirmar reserva",
    content: `<form id="reservation-form" class="grid">
      <div class="reservation-summary">
        <strong>${slot.courtName}</strong>
        <span>${new Date(slot.start).toLocaleDateString("es-UY")} ${time(slot.start)} - ${time(slot.end)}</span>
      </div>
      <div class="field"><label>Tipo de partido</label><select name="playFormat" data-play-format><option value="${playFormat.Singles}">Singles - 1 jugador adicional</option><option value="${playFormat.Doubles}">Dobles - 3 jugadores adicionales</option></select></div>
      <div id="players-area" class="players-area"></div>
      <div class="guest-fee-box"><span>Invitados no socios</span><strong data-guest-fee-total>$ 0</strong><small>$ ${guestFee.toLocaleString("es-UY")} por invitado</small></div>
      <button class="btn" type="submit">Confirmar reserva</button>
    </form>`
  });

  const form = modal.querySelector("#reservation-form");
  const area = modal.querySelector("#players-area");
  const renderPlayers = () => {
    const count = Number(form.playFormat.value) === playFormat.Doubles ? 3 : 1;
    area.innerHTML = Array.from({ length: count }, (_, i) => playerRow(i, members)).join("");
    translateElement(area);
    area.querySelectorAll("[data-player-kind]").forEach(select => select.addEventListener("change", () => { updatePlayerKind(select.closest(".player-row")); updateGuestFee(form, guestFee); }));
    area.querySelectorAll(".player-row").forEach(row => updatePlayerKind(row));
    updateGuestFee(form, guestFee);
  };
  form.playFormat.addEventListener("change", renderPlayers);
  renderPlayers();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = new FormData(form);
    const count = Number(data.get("playFormat")) === playFormat.Doubles ? 3 : 1;
    const players = Array.from({ length: count }, (_, i) => {
      const kind = data.get(`playerKind${i}`);
      return {
        isClubMember: kind === "member",
        memberProfileId: kind === "member" ? data.get(`memberProfileId${i}`) : null,
        fullName: kind === "member" ? null : data.get(`guestName${i}`)
      };
    });

    try {
      await apiClient.post("/api/reservations", {
        courtId: slot.courtId,
        startDateTime: slot.start,
        endDateTime: slot.end,
        playFormat: Number(data.get("playFormat")),
        players
      });
      toast("Reserva confirmada.");
      modal.remove();
      setTimeout(() => location.reload(), 500);
    } catch {}
  });
}

function playerRow(index, members) {
  return `<div class="player-row">
    <div class="field"><label>Jugador ${index + 1}</label><select name="playerKind${index}" data-player-kind><option value="member">Socio</option><option value="guest">No socio</option></select></div>
    <div class="field member-field"><label>Socio</label><select name="memberProfileId${index}">${members.map(m => `<option value="${m.memberProfileId}">${m.fullName} - ${m.memberNumber}</option>`).join("")}</select></div>
    <div class="field guest-field"><label>Nombre completo</label><input name="guestName${index}" placeholder="Nombre de la persona"></div>
  </div>`;
}

function updatePlayerKind(row) {
  const isMember = row.querySelector("[data-player-kind]").value === "member";
  row.querySelector(".member-field").style.display = isMember ? "grid" : "none";
  row.querySelector(".guest-field").style.display = isMember ? "none" : "grid";
}

function updateGuestFee(form, guestFee) {
  const guestCount = [...form.querySelectorAll("[data-player-kind]")].filter(x => x.value === "guest").length;
  const total = guestCount * guestFee;
  const target = form.querySelector("[data-guest-fee-total]");
  if (target) target.textContent = `$ ${total.toLocaleString("es-UY")}`;
}

function renderSlot(slot, index) {
  const slotTime = time(slot.start);
  return `<button class="slot ${slot.isAvailable ? "available" : "busy"}" ${slot.isAvailable ? `data-slot="${index}"` : "disabled"}>
    <span class="slot-court">${slot.isAvailable ? "Disponible" : slot.blockReason || "Ocupado"}</span>
    <strong>${slotTime}</strong>
    <span class="muted">${slot.isAvailable ? "Reservar" : "No disponible"}</span>
  </button>`;
}

function time(value) {
  return new Date(value).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
}

function groupByCourt(slots) {
  const map = new Map();
  slots.forEach(slot => {
    if (!map.has(slot.courtName)) map.set(slot.courtName, []);
    map.get(slot.courtName).push(slot);
  });
  return [...map.entries()].map(([name, courtSlots]) => ({ courtId: courtSlots[0]?.courtId, name, slots: courtSlots, available: courtSlots.filter(x => x.isAvailable).length }));
}

function blockDefaults(slot, selectedDate) {
  const date = slot?.start ? toDateInput(slot.start) : selectedDate;
  const startTime = slot?.start ? toTimeInput(slot.start) : "08:00";
  const endTime = slot?.end ? toTimeInput(slot.end) : "09:00";
  return { date, startTime, endTime };
}

function toDateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toTimeInput(value) {
  return new Date(value).toTimeString().slice(0, 5);
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function demoSlots(date) {
  const courtIds = [
    "77777777-7777-7777-7777-777777777771",
    "77777777-7777-7777-7777-777777777772",
    "77777777-7777-7777-7777-777777777773"
  ];
  return courtIds.flatMap((courtId, courtIndex) => Array.from({ length: 7 }, (_, i) => {
    const start = new Date(`${date}T${String(8 + i * 2).padStart(2, "0")}:00:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const busy = (i + courtIndex) % 4 === 2;
    return { courtId, courtName: `Cancha ${courtIndex + 1}`, start, end, isAvailable: !busy, blockReason: busy ? "Reservado" : null };
  }));
}
