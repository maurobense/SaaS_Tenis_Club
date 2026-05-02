import { apiClient } from "../apiClient.js?v=2026050201";
import { toast } from "../components/toast.js?v=2026050123";
import { setLanguage } from "../preferences.js?v=2026050123";

const settingMeta = {
  ReservationReleaseHour: ["Hora de apertura de reservas", "time", "Hora en que se habilitan las reservas."],
  ReservationReleaseDaysBefore: ["Dias de anticipacion para liberar reservas", "number", "Cuantos dias antes se abre la agenda."],
  MaxReservationsPerWeek: ["Reservas por socio por semana", "number", "Limite semanal total de reservas por socio."],
  WeekendReservationLimitPerWeek: ["Reservas de fin de semana por semana", "number", "Limite especifico para sabado/domingo."],
  MaxClassEnrollmentsPerWeek: ["Clases por socio por semana", "number", "Cantidad maxima de clases activas o en espera."],
  GuestPlayerFee: ["Costo por invitado no socio", "number", "Importe que paga cada invitado no socio por reserva."],
  AllowBookingWithOverduePayment: ["Permitir reservar con deuda", "boolean", "Si esta apagado, bloquea reservas con pagos vencidos."],
  PaymentDueStartDay: ["Dia inicial de pago", "number", "Primer dia del periodo de pago."],
  PaymentDueEndDay: ["Dia final de pago", "number", "Ultimo dia antes de marcar deuda."],
  DefaultSlotDurationMinutes: ["Duracion predeterminada del turno", "number", "Minutos por reserva."],
  AllowWaitingList: ["Permitir lista de espera", "boolean", "Permite entrar en espera cuando una clase esta llena."],
  MaxDaysAheadForBooking: ["Dias maximos hacia adelante", "number", "Hasta cuantos dias se puede reservar."],
  CancellationLimitHoursBefore: ["Horas minimas para cancelar", "number", "Bloquea cancelaciones tardias."],
  AllowMemberSelfRegistration: ["Permitir auto-registro de socios", "boolean", "Habilita registro publico."],
  ClubTimezone: ["Zona horaria del club", "text", "Zona horaria local."],
  Language: ["Idioma del sistema", "language", "Idioma visible para el club."]
};

const defaults = [
  setting("ReservationReleaseHour", "09:00"),
  setting("ReservationReleaseDaysBefore", "1"),
  setting("MaxReservationsPerWeek", "1"),
  setting("WeekendReservationLimitPerWeek", "1"),
  setting("MaxClassEnrollmentsPerWeek", "2"),
  setting("GuestPlayerFee", "300"),
  setting("AllowBookingWithOverduePayment", "false"),
  setting("PaymentDueStartDay", "1"),
  setting("PaymentDueEndDay", "10"),
  setting("DefaultSlotDurationMinutes", "60"),
  setting("AllowWaitingList", "true"),
  setting("MaxDaysAheadForBooking", "7"),
  setting("CancellationLimitHoursBefore", "12"),
  setting("AllowMemberSelfRegistration", "false"),
  setting("ClubTimezone", "America/Montevideo"),
  setting("Language", "es-UY")
];

export async function settingsPage() {
  const loaded = await apiClient.get("/api/settings").catch(() => []);
  const settings = mergeSettings(loaded);
  const tenant = safeJson(localStorage.getItem("tenant"));
  setTimeout(() => {
    document.querySelector("#logo-form")?.addEventListener("submit", saveLogo);
    document.querySelector("#logo-form input[type='file']")?.addEventListener("change", previewSelectedLogo);
    document.querySelector("#settings-form")?.addEventListener("submit", saveSettings);
  }, 0);
  return `<section class="page">
    <div class="page-head"><div><h1 class="page-title">Configuracion</h1><p class="page-subtitle">Reglas del club, reservas, pagos, cupos, colores, zona horaria e idioma.</p></div></div>
    ${renderLogoCard(tenant)}
    <form id="settings-form" class="card panel grid">${settings.map(renderSetting).join("")}<button class="btn">Guardar configuracion</button></form>
  </section>`;
}

async function saveLogo(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.logo?.files?.[0];
  if (!file) {
    toast("Selecciona un logo para subir.", "error");
    return;
  }

  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  submit.textContent = "Subiendo...";

  try {
    const data = new FormData();
    data.append("file", file);
    const result = await apiClient.upload("/api/tenant-assets/logo", data);
    const tenant = safeJson(localStorage.getItem("tenant")) || {};
    tenant.logoUrl = result.url;
    localStorage.setItem("tenant", JSON.stringify(tenant));
    toast("Logo actualizado.");
    setTimeout(() => location.reload(), 350);
  } finally {
    submit.disabled = false;
    submit.textContent = "Subir logo";
  }
}

async function saveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const items = [...form.querySelectorAll("[data-setting-key]")].map(input => ({
    key: input.dataset.settingKey,
    value: input.type === "checkbox" ? String(input.checked) : input.value,
    valueType: Number(input.dataset.valueType || 1),
    description: input.dataset.description || ""
  }));
  await apiClient.put("/api/settings", items);
  const language = items.find(x => x.key === "Language")?.value;
  if (language) setLanguage({ "es-UY": "es", "en-US": "en", "pt-BR": "pt" }[language] || "es");
  toast("Configuracion guardada.");
  setTimeout(() => location.reload(), 300);
}

function renderSetting(s) {
  const [label, type, description] = settingMeta[s.key] || [s.key, "text", s.description || ""];
  const valueType = valueTypeFor(type);
  if (type === "language") {
    return `<div class="field"><label>${label}</label><select data-setting-key="${s.key}" data-value-type="${valueType}" data-description="${description}"><option value="es-UY" ${s.value === "es-UY" ? "selected" : ""}>Espanol Uruguay</option><option value="en-US" ${s.value === "en-US" ? "selected" : ""}>English</option><option value="pt-BR" ${s.value === "pt-BR" ? "selected" : ""}>Portugues</option></select><small class="muted">${description}</small></div>`;
  }
  if (type === "boolean") {
    return `<label class="check-row"><input type="checkbox" data-setting-key="${s.key}" data-value-type="${valueType}" data-description="${description}" ${String(s.value).toLowerCase() === "true" ? "checked" : ""}> ${label}<small class="muted">${description}</small></label>`;
  }
  return `<div class="field"><label>${label}</label><input data-setting-key="${s.key}" data-value-type="${valueType}" data-description="${description}" type="${type}" min="0" value="${s.value ?? ""}"><small class="muted">${description}</small></div>`;
}

function renderLogoCard(tenant) {
  const clubName = tenant?.name || "Tu club";
  const logo = tenant?.logoUrl
    ? `<img src="${escapeAttr(tenant.logoUrl)}" alt="${escapeAttr(clubName)}">`
    : `<span>${initials(clubName)}</span>`;

  return `<article class="card panel logo-settings-card">
    <div class="logo-settings-copy">
      <div class="logo-preview">${logo}</div>
      <div>
        <h2>Logo del club</h2>
        <p class="muted">Se muestra en el login del club y en la navegacion interna.</p>
      </div>
    </div>
    <form id="logo-form" class="logo-upload-form">
      <div class="field">
        <label>Imagen</label>
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required>
      </div>
      <button class="btn" type="submit">Subir logo</button>
    </form>
  </article>`;
}

function previewSelectedLogo(event) {
  const file = event.currentTarget.files?.[0];
  if (!file) return;

  const preview = document.querySelector(".logo-preview");
  if (!preview) return;

  const url = URL.createObjectURL(file);
  preview.innerHTML = `<img src="${escapeAttr(url)}" alt="Vista previa del logo">`;
  const image = preview.querySelector("img");
  image?.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
}

function mergeSettings(loaded) {
  const map = new Map(defaults.map(s => [s.key, s]));
  loaded.forEach(s => map.set(s.key, { ...map.get(s.key), ...s }));
  return defaults.map(s => map.get(s.key));
}

function setting(key, value) {
  const [, type, description] = settingMeta[key];
  return { key, value, valueType: valueTypeFor(type), description };
}

function valueTypeFor(type) {
  return { number: 2, boolean: 3, time: 4, color: 5 }[type] || 1;
}

function initials(value) {
  return String(value || "Club")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("") || "C";
}

function safeJson(value) {
  try {
    return JSON.parse(value || "null");
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
