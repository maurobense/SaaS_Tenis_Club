import { apiClient } from "../apiClient.js?v=2026050123";
import { metricCard, badge } from "../components/cards.js?v=2026050130";
import { table } from "../components/table.js?v=2026050123";

const fallback = {
  cards: [
    { label: "Socios activos", value: "0", trend: "en el club" },
    { label: "Pagos vencidos", value: "0", trend: "requiere gestion" },
    { label: "Reservas hoy", value: "0", trend: "agenda" },
    { label: "Ingresos mes", value: "$ 0", trend: "cobrados" }
  ],
  upcomingReservations: [],
  overduePayments: []
};

const cleanCard = (card) => ({
  ...card,
  trend: card?.trend === "+ club" ? "en el club" : card?.trend
});

export async function adminDashboard() {
  const data = await apiClient.get("/api/dashboard/admin").catch(() => fallback);
  const cards = (data.cards || fallback.cards).map(cleanCard);
  return `<section class="page admin-dashboard">
    <div class="page-head dashboard-head">
      <div>
        <span class="eyebrow">Operacion del club</span>
        <h1 class="page-title">Panel del club</h1>
        <p class="page-subtitle">Metricas operativas, reservas y pagos criticos.</p>
      </div>
      <a class="btn dashboard-action" href="#/reservations">Nueva reserva</a>
    </div>
    <div class="grid cards premium-metrics">${cards.map(metricCard).join("")}</div>
    <div class="grid dashboard-grid">
      ${renderOccupancyPanel()}
      ${renderAlertsPanel(data, cards)}
    </div>
    ${renderUpcomingReservations(data.upcomingReservations || [])}
  </section>`;
}

function renderOccupancyPanel() {
  const days = [
    ["Lun", 55],
    ["Mar", 61],
    ["Mie", 67],
    ["Jue", 73],
    ["Vie", 79],
    ["Sab", 85],
    ["Dom", 91]
  ];
  const average = Math.round(days.reduce((sum, [, value]) => sum + value, 0) / days.length);
  const peak = days.reduce((best, current) => current[1] > best[1] ? current : best, days[0]);
  return `<article class="card panel analytics-card occupancy-panel">
    <div class="section-title analytics-title">
      <div>
        <span class="eyebrow">Uso semanal</span>
        <h2>Ocupacion de canchas</h2>
      </div>
      <span class="analytics-pill">${average}% promedio</span>
    </div>
    <div class="occupancy-summary">
      <div><span>Pico semanal</span><strong>${peak[0]} ${peak[1]}%</strong></div>
      <div><span>Demanda alta</span><strong>Sab y Dom</strong></div>
      <div><span>Tendencia</span><strong>+12%</strong></div>
    </div>
    <div class="occupancy-list">
      ${days.map(([day, value]) => `<div class="occupancy-row ${value >= 88 ? "critical" : value >= 76 ? "high" : ""}" style="--value:${value};">
        <div class="occupancy-label"><strong>${day}</strong><span>${value}%</span></div>
        <div class="occupancy-track" aria-label="Ocupacion ${day} ${value}%"><span></span></div>
      </div>`).join("")}
    </div>
    <div class="occupancy-legend"><span><i></i>Normal</span><span><i></i>Alta demanda</span><span><i></i>Saturacion</span></div>
  </article>`;
}

function renderAlertsPanel(data, cards) {
  const overdueCount = numberFromCard(cards, "Pagos vencidos") || (data.overduePayments || []).length;
  const reservationsToday = numberFromCard(cards, "Reservas hoy");
  const alerts = [];

  if (overdueCount > 0) {
    alerts.push(["Overdue", "Pagos vencidos", `${overdueCount} ${plural(overdueCount, "socio requiere", "socios requieren")} seguimiento.`, "danger"]);
  }

  if (reservationsToday > 0) {
    alerts.push(["Confirmed", "Agenda activa", `${reservationsToday} ${plural(reservationsToday, "reserva programada", "reservas programadas")} para hoy.`, "success"]);
  }

  return `<article class="card panel analytics-card alerts-panel">
    <div class="section-title analytics-title">
      <div>
        <span class="eyebrow">Riesgos y agenda</span>
        <h2>Alertas</h2>
      </div>
      <span class="analytics-pill">${alerts.length} ${alerts.length === 1 ? "activa" : "activas"}</span>
    </div>
    ${alerts.length ? `<div class="alert-list">
      ${alerts.map(([status, title, message, tone]) => `<div class="alert-item ${tone}">
        <span class="alert-dot"></span>
        <div><strong>${title}</strong><p>${message}</p></div>
        ${badge(status)}
      </div>`).join("")}
    </div>` : `<div class="empty-state compact-empty"><strong>Sin alertas criticas</strong><span>No hay pagos vencidos ni riesgos operativos para revisar ahora.</span></div>`}
  </article>`;
}

function numberFromCard(cards, label) {
  const card = (cards || []).find(x => normalize(x.label) === normalize(label));
  const raw = String(card?.value ?? "").replace(/[^\d,-]/g, "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function plural(count, singular, pluralText) {
  return count === 1 ? singular : pluralText;
}

function renderUpcomingReservations(reservations) {
  const rows = reservations.map(r => `<tr>
    <td><strong>${r.courtName}</strong></td>
    <td>${r.memberName || "Administracion"}</td>
    <td>${new Date(r.startDateTime).toLocaleString("es-UY")}</td>
    <td>${badge(reservationStatusLabel(r.status), reservationStatusTone(r.status))}</td>
  </tr>`);
  return `<article class="card panel analytics-card">
    <div class="section-title analytics-title">
      <div>
        <span class="eyebrow">Agenda proxima</span>
        <h2>Proximas reservas</h2>
      </div>
      <a class="btn ghost" href="#/reservations">Ver agenda</a>
    </div>
    ${rows.length ? table(["Cancha","Socio","Horario","Estado"], rows) : `<div class="empty-state"><strong>Sin reservas proximas</strong><span>La agenda del club aparece aca cuando haya turnos confirmados.</span></div>`}
  </article>`;
}

function reservationStatusLabel(status) {
  const labels = {
    1: "Pending",
    2: "Confirmed",
    3: "Cancelled",
    4: "Completed",
    5: "NoShow",
    Pending: "Pending",
    Confirmed: "Confirmed",
    Cancelled: "Cancelled",
    Completed: "Completed",
    NoShow: "NoShow"
  };
  return labels[status] || status || "-";
}

function reservationStatusTone(status) {
  const normalized = reservationStatusLabel(status);
  if (normalized === "Confirmed" || normalized === "Completed") return "Confirmed";
  if (normalized === "Cancelled" || normalized === "NoShow") return "Cancelled";
  return "Pending";
}
