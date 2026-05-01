export function slotGrid(slots, onClickAttr = "data-slot") {
  if (!slots?.length) return `<div class="empty-state"><strong>No hay horarios para mostrar</strong><span>Proba con otra fecha o cancha.</span></div>`;
  return `<div class="slot-grid">${slots.map((s, i) => `<button class="slot ${s.isAvailable ? "available" : "busy"}" ${s.isAvailable ? `${onClickAttr}="${i}" aria-label="Reservar ${s.courtName}"` : "disabled"}><span class="slot-court">${s.courtName}</span><strong>${new Date(s.start).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" })}</strong><span class="muted">${s.isAvailable ? "Disponible" : s.blockReason || "Ocupado"}</span></button>`).join("")}</div>`;
}
