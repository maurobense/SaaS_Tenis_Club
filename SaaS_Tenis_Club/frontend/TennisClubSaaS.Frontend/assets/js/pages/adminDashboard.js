import { apiClient } from "../apiClient.js?v=2026050123";
import { metricCard, badge } from "../components/cards.js?v=2026050123";
import { table } from "../components/table.js?v=2026050123";

const fallback = {
  cards: [
    { label: "Socios activos", value: "128", trend: "en el club" },
    { label: "Pagos vencidos", value: "14", trend: "requiere gestion" },
    { label: "Reservas hoy", value: "36", trend: "78% ocupacion" },
    { label: "Ingresos mes", value: "$ 284k", trend: "cobrados" }
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
  return `<section class="page">
    <div class="page-head"><div><h1 class="page-title">Panel del club</h1><p class="page-subtitle">Metricas operativas, reservas y pagos criticos.</p></div><a class="btn" href="#/reservations">Nueva reserva</a></div>
    <div class="grid cards">${cards.map(metricCard).join("")}</div>
    <div class="grid two-col">
      <article class="card panel"><h2>Ocupacion de canchas</h2><div class="grid">${["Lun","Mar","Mie","Jue","Vie","Sab","Dom"].map((d,i)=>`<div><div class="toolbar"><strong>${d}</strong><span class="muted">${55+i*6}%</span></div><div class="skeleton" style="width:${55+i*6}%"></div></div>`).join("")}</div></article>
      <article class="card panel"><h2>Alertas</h2><p>${badge("Overdue")} 14 socios requieren seguimiento.</p><p>${badge("WaitingList")} 2 clases completas.</p><p>${badge("Confirmed")} Torneo bloquea Cancha 1 el sabado.</p></article>
    </div>
    <article class="card panel"><h2>Proximas reservas</h2>${table(["Cancha","Socio","Horario","Estado"], (data.upcomingReservations || []).map(r => `<tr><td>${r.courtName}</td><td>${r.memberName || "Administracion"}</td><td>${new Date(r.startDateTime).toLocaleString("es-UY")}</td><td>${badge(reservationStatusLabel(r.status), reservationStatusTone(r.status))}</td></tr>`))}</article>
  </section>`;
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
