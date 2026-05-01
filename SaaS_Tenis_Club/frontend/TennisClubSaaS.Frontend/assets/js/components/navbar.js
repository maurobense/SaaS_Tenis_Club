import { auth } from "../auth.js?v=2026050124";
import { config } from "../config.js?v=2026050123";
import { currentTheme, setTheme, t, translateElement } from "../preferences.js?v=2026050124";

const searchCache = new Map();

export function navbar() {
  const user = auth.user() || { firstName: "Demo", lastName: "Usuario", role: "ClubAdmin" };
  const initials = `${user.firstName?.[0] || "D"}${user.lastName?.[0] || "U"}`;
  const isDark = (document.documentElement.dataset.theme || currentTheme()) === "dark";
  const roleLabel = {
    SuperAdmin: t("superAdmin"),
    ClubAdmin: t("clubAdmin"),
    Coach: t("coach"),
    Member: t("member")
  }[user.role] || user.role;
  return `<header class="topbar">
    <div class="searchbox" data-global-search>
      <span class="search-icon" aria-hidden="true"></span>
      <input
        type="search"
        autocomplete="off"
        role="combobox"
        aria-label="Busqueda global"
        aria-controls="global-search-results"
        aria-expanded="false"
        placeholder="${placeholderForRole(user.role)}"
      />
      <div class="global-search-panel" id="global-search-results" role="listbox" hidden></div>
    </div>
    <div class="topbar-actions">
      <button class="theme-switch" type="button" data-theme-toggle aria-label="${t("theme")}" aria-pressed="${isDark}" title="${t("theme")}">
        <span class="theme-switch-track" aria-hidden="true"><span class="theme-switch-thumb"></span></span>
        <span class="sr-only">${t("theme")}</span>
      </button>
      <div class="user-chip"><span class="avatar">${initials}</span><div><strong>${user.firstName} ${user.lastName}</strong><div class="muted">${roleLabel}</div></div></div>
    </div>
  </header>`;
}

export function wireGlobalSearch() {
  const root = document.querySelector("[data-global-search]");
  if (!root) return;

  const input = root.querySelector("input");
  const panel = root.querySelector(".global-search-panel");
  const user = auth.user();
  let debounceId = null;
  let currentResults = [];

  const close = () => {
    panel.hidden = true;
    input.setAttribute("aria-expanded", "false");
  };

  const show = html => {
    panel.innerHTML = html;
    translateElement(panel);
    panel.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  const renderQuickActions = () => {
    currentResults = quickActionsForRole(user?.role);
    show(`<div class="search-section-label">Accesos rapidos</div>${renderResults(currentResults)}`);
  };

  const runSearch = async () => {
    const query = input.value.trim();
    if (!query) {
      renderQuickActions();
      return;
    }
    if (query.length < 2) {
      show(`<div class="search-empty">Escribi al menos 2 caracteres.</div>`);
      return;
    }

    show(`<div class="search-loading"><span></span><span></span><span></span></div>`);
    const index = await loadSearchIndex(user?.role);
    currentResults = filterResults(index, query).slice(0, 8);
    show(currentResults.length ? renderResults(currentResults) : `<div class="search-empty">No encontre resultados para "${escapeHtml(query)}".</div>`);
  };

  input.addEventListener("focus", () => {
    if (input.value.trim()) runSearch();
    else renderQuickActions();
  });

  input.addEventListener("input", () => {
    window.clearTimeout(debounceId);
    debounceId = window.setTimeout(runSearch, 180);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Escape") close();
    if (event.key === "Enter" && currentResults[0]) {
      event.preventDefault();
      navigateTo(currentResults[0].route, input, panel);
    }
  });

  panel.addEventListener("pointerdown", event => {
    const target = event.target.closest("[data-search-route]");
    if (!target) return;
    navigateTo(target.dataset.searchRoute, input, panel);
  });

  document.addEventListener("pointerdown", event => {
    if (!root.contains(event.target)) close();
  });

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", event => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    event.currentTarget.setAttribute("aria-pressed", String(nextTheme === "dark"));
  });
}

function navigateTo(route, input, panel) {
  input.value = "";
  panel.hidden = true;
  input.setAttribute("aria-expanded", "false");
  if (route) location.hash = route;
}

async function loadSearchIndex(role) {
  const normalizedRole = role || "Member";
  const cacheKey = `${localStorage.getItem("tenantSlug") || config.defaultTenantSlug}:${normalizedRole}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  const actions = quickActionsForRole(normalizedRole);
  const sources = sourcesForRole(normalizedRole);
  const results = await Promise.all(sources.map(async source => {
    const rows = await silentGet(source.path);
    return toArray(rows).map(source.map).filter(Boolean);
  }));

  const index = actions.concat(results.flat());
  searchCache.set(cacheKey, index);
  return index;
}

function sourcesForRole(role) {
  const classSource = { path: "/api/classes", map: mapClass };
  const ownReservations = { path: "/api/reservations/my-reservations", map: mapReservation };
  const clubReservations = { path: "/api/reservations", map: mapReservation };

  if (role === "SuperAdmin") {
    return [
      { path: "/api/tenants", map: mapTenant }
    ];
  }

  if (role === "Member") {
    return [ownReservations, classSource];
  }

  if (role === "Coach") {
    return [classSource, clubReservations];
  }

  return [
    { path: "/api/members", map: mapMember },
    { path: "/api/coaches", map: mapCoach },
    { path: "/api/courts", map: mapCourt },
    classSource,
    clubReservations,
    { path: "/api/payments", map: mapPayment }
  ];
}

async function silentGet(path) {
  try {
    const headers = {
      "Content-Type": "application/json",
      "X-Tenant-Slug": localStorage.getItem("tenantSlug") || config.defaultTenantSlug
    };
    const token = localStorage.getItem("accessToken");
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${config.apiBaseUrl}${path}`, { headers });
    if (!response.ok) return [];
    const payload = await response.json().catch(() => ({}));
    if (payload.success === false) return [];
    return payload.data ?? payload;
  } catch {
    return [];
  }
}

function quickActionsForRole(role) {
  const common = [
    item("Perfil", "Datos, idioma y contrasena", "Cuenta", "#/profile", "perfil cuenta password contrasena idioma")
  ];
  if (role === "SuperAdmin") {
    return [
      item("Panel SaaS", "Metricas globales de la plataforma", "Accion", "#/superadmin", "dashboard saas metricas clubes tenants"),
      item("Clubes", "Alta de tenants y administradores", "Accion", "#/tenants", "clubes tenants administradores activar desactivar crear club")
    ].concat(common);
  }
  if (role === "Member") {
    return [
      item("Reservar cancha", "Ver turnos libres y cargar jugadores", "Accion", "#/reservations", "reservar cancha turno horario singles dobles invitado"),
      item("Ver clases", "Anotarte o cancelar inscripcion", "Accion", "#/classes", "clases anotarme inscripcion cancelar"),
      item("Mis pagos", "Membresia y deuda pendiente", "Accion", "#/payments", "pagos membresia deuda cuota")
    ].concat(common);
  }
  if (role === "Coach") {
    return [
      item("Mis clases", "Alumnos, cupos y asistencia", "Accion", "#/classes", "clases alumnos cupos asistencia"),
      item("Reservas", "Agenda de canchas del club", "Accion", "#/reservations", "reservas cancha agenda")
    ].concat(common);
  }
  return [
    item("Dashboard", "Metricas del club", "Accion", "#/admin", "dashboard metricas panel"),
    item("Reservas", "Agenda, bloqueos y turnos", "Accion", "#/reservations", "reservas cancha bloqueos turnos"),
    item("Socios", "Altas, membresias y estado", "Accion", "#/members", "socios miembros altas membresias"),
    item("Profesores", "Usuarios profesor y claves", "Accion", "#/coaches", "profesores coach credenciales claves"),
    item("Pagos", "Cobros, vencidos e invitados", "Accion", "#/payments", "pagos cobros vencidos invitados"),
    item("Configuracion", "Reglas, colores y costos", "Accion", "#/settings", "configuracion reglas costo invitados colores")
  ].concat(common);
}

function filterResults(index, query) {
  const normalized = normalize(query);
  return index
    .map(result => ({ result, score: scoreResult(result, normalized) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.result);
}

function scoreResult(result, query) {
  const title = normalize(result.title);
  const detail = normalize(result.detail);
  const keywords = normalize(result.keywords);
  if (title.startsWith(query)) return 100;
  if (title.includes(query)) return 80;
  if (keywords.includes(query)) return 60;
  if (detail.includes(query)) return 40;
  return 0;
}

function renderResults(results) {
  return results.map(result => `<button type="button" class="search-result" role="option" data-search-route="${result.route}">
    <span class="search-result-type">${escapeHtml(result.type)}</span>
    <span class="search-result-main"><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml(result.detail)}</small></span>
  </button>`).join("");
}

function mapMember(member) {
  return item(member.fullName, `${member.email || ""} ${member.memberNumber || ""}`, "Socio", "#/members", `${member.membershipStatus || ""} ${member.isActive ? "activo" : "inactivo"}`);
}

function mapCoach(coach) {
  return item(coach.name || coach.fullName || "Profesor", `${coach.email || ""} ${coach.specialty || ""}`, "Profesor", "#/coaches", "coach profesor clases");
}

function mapCourt(court) {
  return item(court.name, `${court.surfaceType || ""} ${court.openingTime || ""} - ${court.closingTime || ""}`, "Cancha", "#/courts", "cancha reservas disponibilidad");
}

function mapTenant(tenant) {
  return item(tenant.name, `${tenant.slug || ""} - ${tenant.contactEmail || ""} - ${tenant.isActive ? "Activo" : "Inactivo"}`, "Club", "#/tenants", "tenant club plataforma administrador saas");
}

function mapClass(trainingClass) {
  return item(trainingClass.name, `${trainingClass.coachName || "Profesor a confirmar"} - ${trainingClass.courtName || "Sin cancha"} - ${dayName(trainingClass.dayOfWeek)} ${timeOnly(trainingClass.startTime)}`, "Clase", "#/classes", `${trainingClass.level || ""} cupos alumnos inscripcion`);
}

function mapReservation(reservation) {
  const players = toArray(reservation.players).map(x => x.fullName).join(" ");
  return item(
    reservation.courtName || "Reserva",
    `${dateTime(reservation.startDateTime)} - ${reservation.memberName || "Reserva propia"} - ${reservation.status || ""}`,
    "Reserva",
    "#/reservations",
    `${reservation.reservationType || ""} ${reservation.playFormat || ""} ${players}`
  );
}

function mapPayment(payment) {
  return item(`$ ${Number(payment.amount || 0).toLocaleString("es-UY")}`, `${payment.memberName || "Socio"} - ${dateOnly(payment.paymentDate)} - ${payment.status || ""}`, "Pago", "#/payments", `${payment.paymentMethod || ""} cuota membresia`);
}

function item(title, detail, type, route, keywords = "") {
  if (!title) return null;
  return { title: String(title), detail: String(detail || ""), type, route, keywords: `${title} ${detail} ${keywords}` };
}

function placeholderForRole(role) {
  if (role === "SuperAdmin") return t("searchSaas");
  if (role === "Member") return t("searchMember");
  if (role === "Coach") return t("searchCoach");
  return t("searchAdmin");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function timeOnly(value) {
  return String(value || "").slice(0, 5);
}

function dateOnly(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-UY");
}

function dateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-UY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function dayName(value) {
  return { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miercoles", 4: "Jueves", 5: "Viernes", 6: "Sabado", Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miercoles", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sabado", Sunday: "Domingo" }[value] || value || "Horario";
}
