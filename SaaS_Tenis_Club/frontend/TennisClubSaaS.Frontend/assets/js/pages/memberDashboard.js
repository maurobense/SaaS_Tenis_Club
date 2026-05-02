import { apiClient } from "../apiClient.js?v=2026050145";
import { metricCard, badge } from "../components/cards.js?v=2026050123";

export async function memberDashboard() {
  const cards = await apiClient.get("/api/dashboard/member").catch(() => emptyMemberCards());
  const membership = cards.find(card => normalize(card.label) === "membresia") || emptyMemberCards()[0];

  return `<section class="page">
    <div class="page-head">
      <div><h1 class="page-title">Mi panel</h1><p class="page-subtitle">Tus reservas, clases, membresia y pagos del club.</p></div>
      <a class="btn" href="#/reservations">Reservar cancha</a>
    </div>
    <div class="grid cards">${cards.map(metricCard).join("")}</div>
    <div class="grid two-col">
      <article class="card panel"><h2>Accesos rapidos</h2><div class="toolbar"><a class="btn" href="#/reservations">Reservar cancha</a><a class="btn ghost" href="#/classes">Ver clases</a><a class="btn ghost" href="#/payments">Mis pagos</a></div></article>
      <article class="card panel"><h2>Estado de socio</h2><p>${badge(membership.value, membershipTone(membership.value))} ${membershipMessage(membership)}</p><p class="muted">Si aparece una deuda, el club puede bloquear reservas segun su configuracion.</p></article>
    </div>
  </section>`;
}

function emptyMemberCards() {
  return [
    { label: "Membresia", value: "-", trend: "sin datos", tone: "primary" },
    { label: "Proxima reserva", value: "-", trend: "sin reservas", tone: "primary" },
    { label: "Proxima clase", value: "-", trend: "sin clases", tone: "primary" },
    { label: "Pagos pendientes", value: "0", trend: "sin deuda", tone: "success" }
  ];
}

function membershipTone(value) {
  return value === "Activa" ? "Active" : value === "Vencida" || value === "Suspendida" ? "Overdue" : "Pending";
}

function membershipMessage(card) {
  if (card.value === "-") return "No hay informacion de membresia disponible.";
  return `Tu membresia figura ${String(card.value).toLowerCase()}.`;
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
