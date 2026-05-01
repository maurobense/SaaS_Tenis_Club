import { apiClient } from "../apiClient.js?v=2026050123";
import { auth } from "../auth.js?v=2026050123";
import { badge } from "../components/cards.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050123";
import { table } from "../components/table.js?v=2026050123";
import { toast } from "../components/toast.js?v=2026050123";
import { translateElement, translateLiteral } from "../preferences.js?v=2026050123";

const purpose = {
  Membership: 1,
  CourtGuestFee: 2,
  CourtReservation: 3,
  Other: 4
};

export async function paymentsPage() {
  const user = auth.user();
  const isMember = user?.role === "Member";
  const fallbackRows = [
    { memberName: "Sofia Socio", purpose: "Membership", amount: 1800, paymentDate: new Date(), paymentMethod: "Cash", status: "Paid", reference: "REC-001" },
    { memberName: isMember ? "Sofia Socio" : "Reserva invitados", purpose: "CourtGuestFee", amount: 300, paymentDate: new Date(), paymentMethod: "Cash", status: "Paid", reference: "Invitado no socio" }
  ];
  const rows = isMember ? fallbackRows : await apiClient.get("/api/payments").catch(() => fallbackRows);
  const metrics = buildMetrics(rows);

  setTimeout(() => {
    document.querySelector("[data-register-payment]")?.addEventListener("click", () => openPaymentModal());
  }, 0);

  if (isMember) {
    return `<section class="page">
      <div class="page-head"><div><h1 class="page-title">Mis pagos</h1><p class="page-subtitle">Estado de tu membresia y pagos del club.</p></div></div>
      <div class="grid cards">${[
        { label: "Membresia", value: "Activa", trend: "al dia" },
        { label: "Pendiente", value: "$ 0", trend: "sin deuda" },
        { label: "Vencimientos", value: "1 al 10", trend: "cada mes" },
        { label: "Ultimo pago", value: "$ 1.800", trend: "registrado" }
      ].map(metricCard).join("")}</div>
      <article class="card panel">${renderPaymentsTable(rows, false)}</article>
    </section>`;
  }

  return `<section class="page">
    <div class="page-head"><div><h1 class="page-title">Pagos</h1><p class="page-subtitle">Membresias, pagos de invitados de cancha y otros conceptos diferenciados.</p></div><button class="btn" data-register-payment>Registrar pago</button></div>
    <div class="grid cards">${[
      { label: "Membresias", value: money(metrics.membership), trend: "cuotas sociales" },
      { label: "Invitados cancha", value: money(metrics.guests), trend: "no socios" },
      { label: "Reservas cancha", value: money(metrics.court), trend: "turnos" },
      { label: "Otros", value: money(metrics.other), trend: "varios" }
    ].map(metricCard).join("")}</div>
    <article class="card panel">${renderPaymentsTable(rows, true)}</article>
  </section>`;
}

function renderPaymentsTable(rows, showMember) {
  const headers = showMember ? ["Motivo", "Socio / Reserva", "Monto", "Fecha", "Metodo", "Estado", "Referencia"] : ["Motivo", "Monto", "Fecha", "Metodo", "Estado", "Referencia"];
  const body = rows.map(p => `<tr>
    <td>${badge(purposeLabel(p.purpose), purposeTone(p.purpose))}</td>
    ${showMember ? `<td><strong>${escapeHtml(p.memberName || p.reservationLabel || "-")}</strong><div class="muted">${escapeHtml(p.reservationLabel || "")}</div></td>` : ""}
    <td>${money(p.amount)}</td>
    <td>${formatDate(p.paymentDate)}</td>
    <td>${badge(methodLabel(p.paymentMethod))}</td>
    <td>${badge(p.status)}</td>
    <td>${escapeHtml(p.reference || "")}</td>
  </tr>`);
  return table(headers, body);
}

async function openPaymentModal() {
  const modal = openModal({
    title: "Registrar pago",
    content: `<div class="skeleton-list"><span></span><span></span><span></span></div>`
  });

  const [members, reservations] = await Promise.all([
    apiClient.get("/api/members").catch(() => []),
    apiClient.get("/api/reservations").catch(() => [])
  ]);
  const guestReservations = reservations.filter(x => Number(x.guestFeeTotal || 0) > 0 && !x.guestFeePaid);

  modal.querySelector(".modal").innerHTML = `<div class="section-title"><h2>Registrar pago</h2><button class="btn ghost icon-btn" data-close aria-label="Cerrar">X</button></div>
    <form id="payment-form" class="grid">
      <div class="field"><label>Motivo del pago</label><select name="purpose" data-payment-purpose>
        <option value="${purpose.Membership}">Membresia mensual</option>
        <option value="${purpose.CourtGuestFee}">Invitados no socios de cancha</option>
        <option value="${purpose.CourtReservation}">Reserva de cancha</option>
        <option value="${purpose.Other}">Otro concepto</option>
      </select></div>

      <div class="field" data-member-field><label>Socio</label><select name="memberProfileId">
        <option value="">Seleccionar socio</option>
        ${members.map(m => `<option value="${m.id}">${escapeHtml(m.fullName)} - ${escapeHtml(m.memberNumber)}</option>`).join("")}
      </select></div>

      <div class="field" data-reservation-field hidden><label>Reserva</label><select name="reservationId">
        <option value="">Seleccionar reserva</option>
        ${guestReservations.map(r => `<option value="${r.id}" data-amount="${Number(r.guestFeeTotal || 0)}">${escapeHtml(reservationText(r))}</option>`).join("")}
      </select><small class="muted">Solo se muestran reservas con invitados no socios pendientes de cobro.</small></div>

      <div class="field"><label>Monto</label><input name="amount" type="number" min="1" step="1" value="1800" required></div>
      <div class="field"><label>Metodo</label><select name="paymentMethod"><option value="1">Efectivo</option><option value="2">Transferencia</option><option value="3">Tarjeta</option><option value="4">Mercado Pago</option><option value="5">Otro</option></select></div>
      <div class="field"><label>Referencia</label><input name="reference" value="Membresia mensual"></div>
      <div class="field"><label>Notas</label><textarea name="notes" rows="3" placeholder="Observaciones internas"></textarea></div>
      <button class="btn" type="submit">Guardar pago</button>
    </form>`;
  translateElement(modal);

  modal.querySelector("[data-close]").addEventListener("click", () => modal.remove());
  const form = modal.querySelector("#payment-form");
  const purposeSelect = form.querySelector("[data-payment-purpose]");
  const reservationSelect = form.elements.reservationId;
  const syncFields = () => {
    const selectedPurpose = Number(purposeSelect.value);
    const isGuestPayment = selectedPurpose === purpose.CourtGuestFee;
    form.querySelector("[data-reservation-field]").hidden = !isGuestPayment;
    form.querySelector("[data-member-field]").hidden = selectedPurpose === purpose.CourtGuestFee && guestReservations.length > 0;
    form.elements.reference.value = referenceForPurpose(selectedPurpose);
    form.elements.amount.value = selectedPurpose === purpose.Membership ? 1800 : selectedPurpose === purpose.CourtGuestFee ? (reservationSelect.selectedOptions[0]?.dataset.amount || 300) : form.elements.amount.value;
  };
  purposeSelect.addEventListener("change", syncFields);
  reservationSelect.addEventListener("change", syncFields);
  syncFields();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const selectedPurpose = Number(values.purpose);
    if (selectedPurpose === purpose.Membership && !values.memberProfileId) {
      toast("Selecciona un socio para registrar una membresia.", "error");
      return;
    }
    if (selectedPurpose === purpose.CourtGuestFee && !values.reservationId) {
      toast("Selecciona la reserva con invitados no socios.", "error");
      return;
    }

    const payload = {
      purpose: selectedPurpose,
      memberProfileId: values.memberProfileId || null,
      membershipId: null,
      reservationId: values.reservationId || null,
      amount: Number(values.amount),
      paymentMethod: Number(values.paymentMethod),
      reference: values.reference || null,
      notes: values.notes || null
    };
    await apiClient.post("/api/payments", payload);
    toast("Pago registrado.");
    modal.remove();
    setTimeout(() => location.reload(), 500);
  });
}

function buildMetrics(rows) {
  return rows.reduce((acc, p) => {
    const key = purposeKey(p.purpose);
    acc[key] += Number(p.amount || 0);
    return acc;
  }, { membership: 0, guests: 0, court: 0, other: 0 });
}

function purposeKey(value) {
  const normalized = Number(value) || value;
  if (normalized === 1 || normalized === "Membership") return "membership";
  if (normalized === 2 || normalized === "CourtGuestFee") return "guests";
  if (normalized === 3 || normalized === "CourtReservation") return "court";
  return "other";
}

function purposeLabel(value) {
  const labels = { 1: "Membresia", 2: "Invitados cancha", 3: "Reserva cancha", 4: "Otro", Membership: "Membresia", CourtGuestFee: "Invitados cancha", CourtReservation: "Reserva cancha", Other: "Otro" };
  return labels[value] || value || "Pago";
}

function purposeTone(value) {
  const normalized = Number(value) || value;
  if (normalized === 1 || normalized === "Membership") return "Active";
  if (normalized === 2 || normalized === "CourtGuestFee") return "WaitingList";
  if (normalized === 3 || normalized === "CourtReservation") return "Confirmed";
  return "Pending";
}

function methodLabel(value) {
  const labels = { 1: "Cash", 2: "BankTransfer", 3: "Card", 4: "MercadoPago", 5: "Other" };
  return labels[value] || value || "-";
}

function referenceForPurpose(value) {
  const label = {
    1: "Membresia mensual",
    2: "Pago invitados no socios",
    3: "Reserva de cancha",
    4: "Otro pago"
  }[value] || "";
  return translateLiteral(label);
}

function reservationText(r) {
  const date = r.startDateTime ? new Date(r.startDateTime).toLocaleString("es-UY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
  return `${r.courtName || "Cancha"} ${date} - invitados: ${r.guestPlayerCount || 0} - ${money(r.guestFeeTotal || 0)}`;
}

function metricCard(x) {
  return `<article class="card metric"><span class="metric-label">${x.label}</span><strong class="metric-value">${x.value}</strong><span class="metric-trend">${x.trend}</span></article>`;
}

function money(value) {
  return `$ ${Number(value || 0).toLocaleString("es-UY")}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-UY");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
