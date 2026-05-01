import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const nodeModules = "C:/Users/mauro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const require = createRequire(path.join(nodeModules, "noop.js"));
const { chromium } = require("playwright");

const root = path.resolve(process.cwd());
const outDir = path.join(root, "docs", "presentacion");
const qaDir = path.join(outDir, "qa-clubes");
const htmlPath = path.join(outDir, "SaaS_Tenis_Club_Presentacion_Clubes.html");
const pdfPath = path.join(outDir, "SaaS_Tenis_Club_Presentacion_Clubes.pdf");

const shots = {
  admin: "capturas/desktop-admin-dashboard.png",
  reservas: "capturas/desktop-reservas.png",
  clases: "capturas/desktop-clases.png",
  socios: "capturas/desktop-socios.png",
  pagos: "capturas/desktop-pagos.png",
  settings: "capturas/desktop-configuracion.png",
  coach: "capturas/desktop-profesor.png",
  mobilePanel: "capturas/mobile-panel.png",
  mobileReservas: "capturas/mobile-reservas.png",
  mobileModal: "capturas/mobile-reserva-modal.png",
  mobileClases: "capturas/mobile-clases.png",
  mobilePagos: "capturas/mobile-pagos.png",
  mobilePerfil: "capturas/mobile-perfil.png"
};

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function img(src, alt = "") {
  return `<img src="${esc(src)}" alt="${esc(alt)}" />`;
}

function badge(text) {
  return `<span class="badge">${esc(text)}</span>`;
}

function cover() {
  return `<section class="slide ink cover">
    <div class="brand"><div class="mark">T</div><div><b>SaaS Tenis Club</b><span>Reservas y gestión para clubes</span></div></div>
    <div class="cover-copy">
      <p class="eyebrow">Propuesta para clubes de tenis</p>
      <h1>Tu club ordenado, online y fácil de usar.</h1>
      <p class="lead">Una plataforma moderna para reservas de canchas, clases, socios, profesores, pagos y comunicación interna, pensada para clubes que quieren dejar atrás WhatsApp y planillas.</p>
      <div class="cover-actions">${badge("Sin instalar apps")}${badge("Celular y desktop")}${badge("Soporte local")}${badge("Listo para Uruguay")}</div>
    </div>
    <div class="hero-device">
      <div class="desktop-card">${img(shots.admin, "Dashboard del club")}</div>
      <div class="phone-card">${img(shots.mobilePanel, "Panel mobile del socio")}</div>
    </div>
    <div class="page-number">01</div>
  </section>`;
}

function problem() {
  return `<section class="slide">
    <div class="split">
      <div>
        <p class="eyebrow">Lo que suele pasar</p>
        <h2>El club crece, pero la gestión queda atada al chat.</h2>
        <p class="muted">Las reservas se piden por mensaje, los pagos se controlan en planillas, los profesores manejan listas aparte y el socio nunca sabe exactamente qué está disponible.</p>
      </div>
      <div class="pain-grid">
        ${pain("Mensajes todo el día", "Consultas repetidas para reservar, cancelar, cambiar horario o preguntar cupos.")}
        ${pain("Reservas duplicadas", "Sin agenda visual centralizada, aparecen solapamientos y errores de coordinación.")}
        ${pain("Pagos difíciles de seguir", "Cuotas, invitados y reservas mezclados sin reporte claro.")}
        ${pain("Clases desordenadas", "Cupos, lista de espera y asistencia dependen de controles manuales.")}
        ${pain("Poca visibilidad", "La comisión o administración no ve ocupación, deuda y uso real del club.")}
        ${pain("Experiencia vieja", "El socio espera resolver todo desde el celular, rápido y sin llamar.")}
      </div>
    </div>
    <div class="page-number">02</div>
  </section>`;
}

function pain(title, text) {
  return `<article class="card pain"><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function promise() {
  return `<section class="slide">
    <p class="eyebrow">La propuesta</p>
    <h2>Una plataforma única para administrar el club y mejorar la experiencia del socio.</h2>
    <div class="promise-grid">
      ${promiseCard("Reservas online", "El socio elige fecha, cancha, horario y confirma desde el celular.")}
      ${promiseCard("Clases con cupos", "Inscripciones, lista de espera, alumnos y asistencia en un solo lugar.")}
      ${promiseCard("Pagos ordenados", "Cuotas, reservas e invitados separados por motivo de pago.")}
      ${promiseCard("Panel administrativo", "Métricas de ocupación, pagos pendientes, socios y actividad.")}
      ${promiseCard("Profesores conectados", "Cada profe ve sus clases, alumnos y asistencia sin acceder a todo el club.")}
      ${promiseCard("Configuración del club", "Reglas de reserva, deuda, colores, idioma, costos y límites ajustables.")}
    </div>
    <div class="page-number">03</div>
  </section>`;
}

function promiseCard(title, text) {
  return `<article class="module"><div>${esc(title[0])}</div><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function adminValue() {
  return screenSlide(
    "Administración",
    "El club ve sus números importantes en segundos.",
    "El panel ayuda a tomar decisiones: reservas de hoy, ocupación, pagos vencidos, próximos turnos y alertas operativas.",
    shots.admin,
    ["Menos llamadas y mensajes para coordinar", "Socios activos, deuda y reservas visibles", "Ocupación de canchas para detectar horarios fuertes", "Datos claros para comisión directiva o administración"],
    "04"
  );
}

function reservations() {
  return `<section class="slide">
    <p class="eyebrow">Reservas online</p>
    <h2>Reservar cancha se vuelve simple para el socio y controlado para el club.</h2>
    <div class="reservation-layout">
      <div class="wide-screen">${img(shots.reservas, "Reservas desktop")}</div>
      <div class="phone-frame">${img(shots.mobileModal, "Reserva mobile")}</div>
    </div>
    <div class="feature-row">
      ${feature("Singles o dobles", "El sistema pide los jugadores que corresponden.")}
      ${feature("Invitados no socios", "Se cargan nombres y se calcula el cargo de invitado.")}
      ${feature("Reglas del club", "Límite semanal, deuda, horarios y disponibilidad se validan automáticamente.")}
    </div>
    <div class="page-number">05</div>
  </section>`;
}

function feature(title, text) {
  return `<article class="feature"><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function mobile() {
  return `<section class="slide ink">
    <p class="eyebrow">Experiencia del socio</p>
    <h2>El socio puede resolver lo principal desde el celular.</h2>
    <div class="phone-row">
      ${phone(shots.mobilePanel, "Mi panel")}
      ${phone(shots.mobileReservas, "Reservar")}
      ${phone(shots.mobileClases, "Clases")}
      ${phone(shots.mobilePagos, "Pagos")}
    </div>
    <p class="dark-note">No necesita descargar una app pesada: entra desde el navegador, inicia sesión y opera con una interfaz moderna y rápida.</p>
    <div class="page-number">06</div>
  </section>`;
}

function phone(src, caption) {
  return `<figure class="phone"><div>${img(src, caption)}</div><figcaption>${esc(caption)}</figcaption></figure>`;
}

function classes() {
  return `<section class="slide">
    <div class="two-screens">
      <div>
        <p class="eyebrow">Clases y profesores</p>
        <h2>Los cupos y la asistencia dejan de estar en listas sueltas.</h2>
        <p class="muted">El club administra clases por nivel, profesor, cancha, día y horario. El profesor ve sus alumnos, reserva cupos y marca asistencia.</p>
        <div class="bullet-list">
          <div><i></i><span>Cupo máximo por clase.</span></div>
          <div><i></i><span>Lista de espera si el grupo está lleno.</span></div>
          <div><i></i><span>Profesor con usuario propio.</span></div>
          <div><i></i><span>Asistencia y seguimiento de alumnos.</span></div>
        </div>
      </div>
      <div class="screen-stack">
        <div class="screen-card top">${img(shots.clases, "Clases")}</div>
        <div class="screen-card lower">${img(shots.coach, "Panel profesor")}</div>
      </div>
    </div>
    <div class="page-number">07</div>
  </section>`;
}

function payments() {
  return screenSlide(
    "Pagos",
    "Cada ingreso queda registrado con su motivo.",
    "El club puede diferenciar cuota social, pago de invitados, reserva de cancha u otros conceptos. Esto simplifica el seguimiento mensual.",
    shots.pagos,
    ["Pagos pendientes y vencidos", "Historial por socio", "Motivos de pago separados", "Base preparada para integraciones futuras"],
    "08"
  );
}

function members() {
  return screenSlide(
    "Socios",
    "Cada socio tiene un historial claro para la administración.",
    "Perfil, estado de membresía, pagos, clases, reservas y notas quedan disponibles para operar con más contexto.",
    shots.socios,
    ["Estado activo o inactivo", "Historial de pagos y reservas", "Membresía visible", "Notas administrativas y seguimiento"],
    "09"
  );
}

function settings() {
  return screenSlide(
    "Reglas del club",
    "La plataforma se adapta a cómo trabaja cada club.",
    "Se pueden configurar límites, horarios, reglas de deuda, costo de invitados, idioma, modo visual y colores propios del club.",
    shots.settings,
    ["Costo de invitado no socio", "Límite semanal de reservas", "Máximo de clases por semana", "Tema claro/oscuro e idioma"],
    "10"
  );
}

function roles() {
  return `<section class="slide">
    <p class="eyebrow">Usuarios</p>
    <h2>Cada persona entra a su propio panel.</h2>
    <div class="role-grid">
      ${role("Administrador", "Gestiona socios, canchas, reservas, pagos, clases, profesores y configuración del club.", ["Operación", "Pagos", "Reportes"])}
      ${role("Profesor", "Ve sus clases, sus alumnos, cupos reservados y marca asistencia.", ["Clases", "Alumnos", "Asistencia"])}
      ${role("Socio", "Reserva canchas, se anota a clases, revisa pagos y actualiza su perfil.", ["Reservas", "Clases", "Pagos"])}
      ${role("SuperAdmin", "Alta de clubes y soporte de plataforma. No interfiere con la operación diaria.", ["Soporte", "Planes", "Tenants"])}
    </div>
    <div class="page-number">11</div>
  </section>`;
}

function role(title, text, tags) {
  return `<article class="role"><b>${esc(title)}</b><p>${esc(text)}</p><div>${tags.map(badge).join("")}</div></article>`;
}

function benefits() {
  return `<section class="slide">
    <p class="eyebrow">Beneficios para el club</p>
    <h2>La mejora se nota en la operación y en la experiencia del socio.</h2>
    <div class="benefit-grid">
      ${benefit("Menos trabajo manual", "Menos coordinación por WhatsApp y menos planillas paralelas.")}
      ${benefit("Más control de deuda", "El club puede bloquear o alertar reservas con pagos vencidos.")}
      ${benefit("Mejor uso de canchas", "La ocupación se ve con más claridad y ayuda a tomar decisiones.")}
      ${benefit("Profes más ordenados", "Alumnos, clases y asistencia quedan centralizados.")}
      ${benefit("Socios más autónomos", "Reservan, consultan clases y ven pagos sin depender de administración.")}
      ${benefit("Imagen más profesional", "El club ofrece una experiencia digital moderna y confiable.")}
    </div>
    <div class="page-number">12</div>
  </section>`;
}

function benefit(title, text) {
  return `<article class="benefit"><strong>${esc(title)}</strong><span>${esc(text)}</span></article>`;
}

function implementation() {
  return `<section class="slide">
    <p class="eyebrow">Puesta en marcha</p>
    <h2>Implementación guiada, sin frenar la operación del club.</h2>
    <div class="timeline">
      ${step("01", "Configuración", "Cargamos canchas, horarios, colores, reglas de reserva, pagos y usuarios.")}
      ${step("02", "Carga inicial", "Socios, profesores, clases y membresías pueden importarse desde planillas.")}
      ${step("03", "Capacitación", "Mostramos los flujos principales a administración, profesores y socios clave.")}
      ${step("04", "Salida en vivo", "Acompañamos los primeros días y ajustamos detalles de operación.")}
    </div>
    <div class="page-number">13</div>
  </section>`;
}

function step(number, title, text) {
  return `<article class="step"><i>${esc(number)}</i><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function pricing() {
  return `<section class="slide ink">
    <p class="eyebrow">Planes mensuales</p>
    <h2>Precios claros en dólares, según tamaño y necesidad del club.</h2>
    <div class="pricing-grid">
      ${plan("Básico", "USD 89", "Club chico", ["Hasta 4 canchas", "Reservas online", "Socios y pagos básicos", "Soporte estándar"])}
      ${plan("Pro", "USD 149", "Recomendado", ["Hasta 10 canchas", "Clases y profesores", "Pagos por motivo", "Dashboards y configuración"])}
      ${plan("Premium", "USD 249+", "Club grande", ["Canchas y socios ilimitados", "Reportes avanzados", "Soporte prioritario", "Personalizaciones"])}
    </div>
    <div class="setup-note"><b>Puesta en marcha:</b> desde USD 300 según cantidad de socios, carga inicial, capacitación y personalización. Descuento anual disponible.</div>
    <div class="page-number">14</div>
  </section>`;
}

function plan(name, price, label, items) {
  return `<article class="plan ${name === "Pro" ? "featured" : ""}">
    <span>${esc(label)}</span>
    <b>${esc(name)}</b>
    <strong>${esc(price)}<small>/mes</small></strong>
    <ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>
  </article>`;
}

function demo() {
  return `<section class="slide">
    <p class="eyebrow">Cómo se ve una demo</p>
    <h2>En 20 minutos se puede mostrar el valor completo.</h2>
    <div class="demo-grid">
      ${demoItem("1. Panel del club", "Métricas, reservas, deuda y actividad general.")}
      ${demoItem("2. Reserva de cancha", "Turnos, singles/dobles, invitados y reglas automáticas.")}
      ${demoItem("3. Clases", "Cupos, alumnos, lista de espera y profesor.")}
      ${demoItem("4. Pagos", "Cuotas, invitados, reservas e historial por socio.")}
      ${demoItem("5. Experiencia mobile", "Lo que ve el socio desde su celular.")}
      ${demoItem("6. Configuración", "Reglas propias del club, colores, idioma y límites.")}
    </div>
    <div class="page-number">15</div>
  </section>`;
}

function demoItem(title, text) {
  return `<article class="demo-item"><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function close() {
  return `<section class="slide ink close">
    <div class="brand"><div class="mark">T</div><div><b>SaaS Tenis Club</b><span>Reservas y gestión para clubes</span></div></div>
    <div class="close-copy">
      <p class="eyebrow">Próximo paso</p>
      <h1>Digitalizá la gestión del club sin complicarle la vida a tus socios.</h1>
      <p class="lead">Te mostramos una demo con datos de ejemplo y vemos qué plan se adapta mejor a la realidad de tu club.</p>
      <div class="cover-actions">${badge("Demo guiada")}${badge("Soporte local")}${badge("Planes en USD")}${badge("Implementación rápida")}</div>
    </div>
    <div class="page-number">16</div>
  </section>`;
}

function screenSlide(kicker, title, text, image, bullets, page) {
  return `<section class="slide">
    <div class="screen-slide">
      <div class="copy">
        <p class="eyebrow">${esc(kicker)}</p>
        <h2>${esc(title)}</h2>
        <p class="muted">${esc(text)}</p>
        <div class="bullet-list">${bullets.map(item => `<div><i></i><span>${esc(item)}</span></div>`).join("")}</div>
      </div>
      <div class="screen-card">${img(image, title)}</div>
    </div>
    <div class="page-number">${esc(page)}</div>
  </section>`;
}

function html() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>SaaS Tenis Club - Presentación para clubes</title>
  <style>
    @page { size: 16in 9in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; color: #101827; font-family: "Segoe UI", Arial, sans-serif; }
    .slide { width: 1600px; height: 900px; padding: 62px 78px; position: relative; overflow: hidden; page-break-after: always; background: #f8fafc; }
    .slide:before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 82% 4%, rgba(37,99,235,.10), transparent 25%), linear-gradient(180deg, rgba(255,255,255,.72), rgba(255,255,255,0)); }
    .ink { background: #07111f; color: #f8fafc; }
    .ink:before { background: radial-gradient(circle at 82% 0%, rgba(37,99,235,.42), transparent 28%), radial-gradient(circle at 2% 94%, rgba(16,185,129,.28), transparent 28%), linear-gradient(135deg, #07111f, #10213a); }
    .brand { position: absolute; top: 48px; left: 78px; z-index: 2; display: flex; align-items: center; gap: 14px; }
    .brand b { display: block; font-size: 22px; }
    .brand span { display: block; color: #94a3b8; font-size: 15px; margin-top: 2px; }
    .mark { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; color: white; font-weight: 900; background: linear-gradient(135deg, #2563eb, #10b981); box-shadow: 0 18px 44px rgba(16,185,129,.25); }
    .eyebrow { color: #2563eb; font-weight: 900; font-size: 15px; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 16px; }
    .ink .eyebrow { color: #67e8f9; }
    h1, h2 { position: relative; z-index: 1; margin: 0; letter-spacing: -0.034em; }
    h1 { font-size: 70px; line-height: .95; max-width: 875px; }
    h2 { font-size: 51px; line-height: 1.03; max-width: 850px; }
    .lead { font-size: 24px; line-height: 1.42; color: #cbd5e1; max-width: 790px; margin-top: 24px; position: relative; z-index: 1; }
    .muted { color: #52627a; font-size: 22px; line-height: 1.42; }
    .badge { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; border-radius: 999px; padding: 7px 14px; background: #eaf1ff; color: #1d4ed8; font-weight: 800; font-size: 15px; white-space: nowrap; }
    .ink .badge { color: #dff7ff; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.12); }
    .page-number { position: absolute; right: 56px; bottom: 40px; color: #94a3b8; font-size: 14px; font-weight: 800; letter-spacing: .12em; z-index: 2; }
    .cover-copy, .close-copy { position: absolute; left: 78px; top: 186px; z-index: 2; }
    .cover-actions { margin-top: 34px; display: flex; gap: 10px; flex-wrap: wrap; }
    .hero-device { position: absolute; right: 70px; top: 126px; width: 650px; height: 610px; z-index: 2; }
    .desktop-card { position: absolute; right: 0; top: 0; width: 620px; padding: 14px; border-radius: 26px; background: rgba(255,255,255,.96); box-shadow: 0 34px 100px rgba(0,0,0,.42); }
    .desktop-card img, .screen-card img, .wide-screen img { width: 100%; display: block; border-radius: 16px; }
    .phone-card { position: absolute; width: 205px; right: 400px; top: 318px; padding: 10px; border-radius: 30px; background: #020617; box-shadow: 0 28px 80px rgba(0,0,0,.42); }
    .phone-card img { width: 100%; display: block; border-radius: 22px; }
    .split { display: grid; grid-template-columns: 570px 1fr; gap: 58px; align-items: center; height: 100%; position: relative; z-index: 1; }
    .pain-grid, .promise-grid, .benefit-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .card, .module, .feature, .benefit, .role, .demo-item { border: 1px solid #dbe4f0; background: rgba(255,255,255,.9); border-radius: 22px; padding: 24px; box-shadow: 0 18px 46px rgba(15,23,42,.07); }
    .card b, .module b, .feature b, .benefit strong, .role b, .demo-item b { display: block; font-size: 22px; margin-bottom: 10px; }
    .card span, .module span, .feature span, .benefit span, .role p, .demo-item span { color: #64748b; font-size: 18px; line-height: 1.35; }
    .promise-grid { grid-template-columns: repeat(3, 1fr); margin-top: 42px; position: relative; z-index: 1; }
    .module { min-height: 190px; }
    .module div { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; margin-bottom: 18px; background: linear-gradient(135deg, #2563eb, #10b981); color: white; font-weight: 900; }
    .screen-slide { display: grid; grid-template-columns: 525px 1fr; gap: 46px; align-items: center; height: 100%; position: relative; z-index: 1; }
    .screen-card { background: #fff; border: 1px solid #dbe4f0; border-radius: 28px; padding: 16px; box-shadow: 0 28px 76px rgba(15,23,42,.13); }
    .bullet-list { margin-top: 34px; display: grid; gap: 14px; }
    .bullet-list div { display: flex; gap: 12px; align-items: flex-start; color: #152033; font-size: 19px; line-height: 1.35; font-weight: 650; }
    .bullet-list i { width: 10px; height: 10px; border-radius: 99px; background: #10b981; margin-top: 9px; flex: 0 0 auto; }
    .reservation-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 250px; gap: 24px; align-items: center; margin-top: 30px; }
    .wide-screen { padding: 14px; border: 1px solid #dbe4f0; border-radius: 26px; background: white; box-shadow: 0 26px 72px rgba(15,23,42,.13); }
    .phone-frame { width: 238px; padding: 11px; border-radius: 34px; background: #020617; box-shadow: 0 24px 70px rgba(15,23,42,.22); }
    .phone-frame img { width: 100%; display: block; border-radius: 24px; }
    .feature-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 22px; }
    .phone-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 26px; margin-top: 42px; position: relative; z-index: 1; }
    .phone { margin: 0; text-align: center; }
    .phone div { padding: 10px; border-radius: 34px; background: #020617; box-shadow: 0 24px 70px rgba(0,0,0,.36); }
    .phone img { width: 100%; display: block; border-radius: 24px; }
    .phone figcaption { color: #cbd5e1; margin-top: 12px; font-weight: 800; }
    .dark-note { position: relative; z-index: 1; color: #dbeafe; font-size: 22px; line-height: 1.4; margin-top: 30px; max-width: 1040px; }
    .two-screens { display: grid; grid-template-columns: 540px 1fr; gap: 48px; align-items: center; height: 100%; position: relative; z-index: 1; }
    .screen-stack { position: relative; height: 590px; }
    .screen-card.top { position: absolute; width: 820px; right: 0; top: 0; }
    .screen-card.lower { position: absolute; width: 650px; right: 160px; top: 285px; }
    .role-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 46px; position: relative; z-index: 1; }
    .role { min-height: 340px; display: flex; flex-direction: column; justify-content: space-between; }
    .role b { font-size: 26px; }
    .role div { display: flex; flex-wrap: wrap; gap: 8px; }
    .benefit-grid { grid-template-columns: repeat(3, 1fr); margin-top: 46px; }
    .benefit strong { font-size: 27px; color: #2563eb; }
    .timeline { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 70px; position: relative; z-index: 1; }
    .step { border: 1px solid #dbe4f0; background: white; border-radius: 24px; padding: 26px; min-height: 310px; box-shadow: 0 18px 48px rgba(15,23,42,.08); }
    .step i { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; background: #2563eb; color: white; font-weight: 900; font-style: normal; margin-bottom: 46px; }
    .step b { display: block; font-size: 28px; margin-bottom: 14px; }
    .step span { color: #64748b; font-size: 19px; line-height: 1.35; }
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 42px; position: relative; z-index: 1; }
    .plan { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15); border-radius: 28px; padding: 34px; min-height: 430px; }
    .plan.featured { background: white; color: #0f172a; transform: translateY(-18px); box-shadow: 0 28px 90px rgba(37,99,235,.28); }
    .plan span { color: #94a3b8; font-weight: 800; }
    .plan.featured span { color: #2563eb; }
    .plan b { display: block; font-size: 34px; margin-top: 16px; }
    .plan strong { display: block; font-size: 48px; margin-top: 16px; }
    .plan small { font-size: 18px; color: #94a3b8; }
    .plan ul { margin: 26px 0 0; padding-left: 21px; color: #cbd5e1; font-size: 19px; line-height: 1.8; }
    .plan.featured ul { color: #334155; }
    .setup-note { color: #dbeafe; font-size: 20px; line-height: 1.4; margin-top: 18px; max-width: 1100px; position: relative; z-index: 1; }
    .demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 46px; position: relative; z-index: 1; }
    .demo-item { min-height: 150px; }
    .close .close-copy { top: 205px; }
  </style>
</head>
<body>
${[
  cover(),
  problem(),
  promise(),
  adminValue(),
  reservations(),
  mobile(),
  classes(),
  payments(),
  members(),
  settings(),
  roles(),
  benefits(),
  implementation(),
  pricing(),
  demo(),
  close()
].join("\n")}
</body>
</html>`;
}

async function ensureInputs() {
  for (const [key, src] of Object.entries(shots)) {
    try {
      await fs.access(path.join(outDir, src));
    } catch {
      throw new Error(`Falta la captura requerida ${key}: ${path.join(outDir, src)}`);
    }
  }
}

async function build() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(qaDir, { recursive: true });
  await ensureInputs();
  await fs.writeFile(htmlPath, html(), "utf8");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.pdf({ path: pdfPath, width: "16in", height: "9in", printBackground: true, preferCSSPageSize: true });

  const slides = page.locator(".slide");
  const count = await slides.count();
  const previews = [];
  for (let i = 0; i < count; i += 1) {
    const previewPath = path.join(qaDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await slides.nth(i).screenshot({ path: previewPath });
    previews.push(path.relative(qaDir, previewPath).replaceAll("\\", "/"));
  }

  const contactHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#111827;color:white;font-family:Arial,sans-serif}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:18px}figure{margin:0;background:#020617;border-radius:10px;overflow:hidden;border:1px solid #334155}img{width:100%;display:block}figcaption{padding:8px 10px;font-size:13px;color:#cbd5e1}
  </style></head><body><div class="grid">${previews.map((src, index) => `<figure><img src="${src}"><figcaption>${index + 1}</figcaption></figure>`).join("")}</div></body></html>`;
  const contactHtmlPath = path.join(qaDir, "contact-sheet.html");
  await fs.writeFile(contactHtmlPath, contactHtml, "utf8");
  const contact = await browser.newPage({ viewport: { width: 1500, height: 1900 }, deviceScaleFactor: 1 });
  await contact.goto(pathToFileURL(contactHtmlPath).href, { waitUntil: "networkidle" });
  await contact.screenshot({ path: path.join(qaDir, "contact-sheet.png"), fullPage: true });
  await browser.close();

  const stat = await fs.stat(pdfPath);
  console.log(JSON.stringify({ pdfPath, htmlPath, qaDir, slides: count, bytes: stat.size }, null, 2));
}

build().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
