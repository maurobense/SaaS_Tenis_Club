export function metricCard({ label, value, trend, tone = "primary" }) {
  return `<article class="card metric"><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong><span class="metric-trend">${trend || ""}</span></article>`;
}

export function badge(text, tone = "primary") {
  const label = translateBadge(text);
  const cls = tone === "Paid" || tone === "Active" || tone === "Confirmed" ? "success" : tone === "Overdue" || tone === "Cancelled" ? "danger" : tone === "Pending" || tone === "WaitingList" ? "warning" : "";
  return `<span class="badge ${cls}">${label}</span>`;
}

export function applyTenantTheme(tenant) {
  if (!tenant) return;
  const root = document.documentElement;
  if (tenant.primaryColor) root.style.setProperty("--primary", tenant.primaryColor);
  if (tenant.secondaryColor) root.style.setProperty("--secondary", tenant.secondaryColor);
}

function translateBadge(text) {
  const labels = {
    Paid: "Pago",
    Active: "Activo",
    Confirmed: "Confirmado",
    Overdue: "Vencido",
    Cancelled: "Cancelado",
    Pending: "Pendiente",
    NoShow: "No-show",
    WaitingList: "Lista de espera",
    Inactive: "Inactivo",
    Intermediate: "Intermedio",
    Beginner: "Inicial",
    Advanced: "Avanzado",
    Kids: "Ninos",
    Adults: "Adultos",
    Competition: "Competicion",
    Clay: "Polvo de ladrillo",
    Hard: "Dura",
    Grass: "Cesped",
    Synthetic: "Sintetica",
    Outdoor: "Exterior",
    Indoor: "Techada",
    Cash: "Efectivo",
    BankTransfer: "Transferencia",
    Card: "Tarjeta",
    MercadoPago: "Mercado Pago"
  };
  return labels[text] || text;
}
