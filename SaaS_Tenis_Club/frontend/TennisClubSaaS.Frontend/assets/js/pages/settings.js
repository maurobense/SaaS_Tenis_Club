import { apiClient } from "../apiClient.js?v=2026050123";
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
  setTimeout(() => document.querySelector("#settings-form")?.addEventListener("submit", saveSettings), 0);
  return `<section class="page">
    <div class="page-head"><div><h1 class="page-title">Configuracion</h1><p class="page-subtitle">Reglas del club, reservas, pagos, cupos, colores, zona horaria e idioma.</p></div></div>
    <form id="settings-form" class="card panel grid">${settings.map(renderSetting).join("")}<button class="btn">Guardar configuracion</button></form>
  </section>`;
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
