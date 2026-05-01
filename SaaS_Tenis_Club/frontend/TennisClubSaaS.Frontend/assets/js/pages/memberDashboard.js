import { metricCard, badge } from "../components/cards.js?v=2026050123";

export async function memberDashboard() {
  return `<section class="page">
    <div class="page-head">
      <div><h1 class="page-title">Mi panel</h1><p class="page-subtitle">Tus reservas, clases, membresia y pagos del club.</p></div>
      <a class="btn" href="#/reservations">Reservar cancha</a>
    </div>
    <div class="grid cards">${[
      { label: "Membresia", value: "Activa", trend: "al dia" },
      { label: "Proxima reserva", value: "19:00", trend: "Cancha 2" },
      { label: "Proxima clase", value: "Mar", trend: "Intermedio" },
      { label: "Pagos pendientes", value: "0", trend: "sin deuda" }
    ].map(metricCard).join("")}</div>
    <div class="grid two-col">
      <article class="card panel"><h2>Accesos rapidos</h2><div class="toolbar"><a class="btn" href="#/reservations">Reservar cancha</a><a class="btn ghost" href="#/classes">Ver clases</a><a class="btn ghost" href="#/payments">Mis pagos</a></div></article>
      <article class="card panel"><h2>Estado de socio</h2><p>${badge("Active")} Tu membresia esta al dia.</p><p class="muted">Si aparece una deuda, el club puede bloquear reservas segun su configuracion.</p></article>
    </div>
  </section>`;
}
