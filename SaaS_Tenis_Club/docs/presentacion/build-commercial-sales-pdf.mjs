import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const nodeModules = "C:/Users/mauro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const require = createRequire(path.join(nodeModules, "noop.js"));
const { chromium } = require("playwright");

const root = path.resolve(process.cwd());
const outDir = path.join(root, "docs", "presentacion");
const shotDir = path.join(outDir, "capturas");
const qaDir = path.join(outDir, "qa-ventas");
const htmlPath = path.join(outDir, "SaaS_Tenis_Club_Presentacion_Ventas.html");
const pdfPath = path.join(outDir, "SaaS_Tenis_Club_Presentacion_Ventas.pdf");

const shots = {
  admin: "capturas/desktop-admin-dashboard.png",
  reservas: "capturas/desktop-reservas.png",
  clases: "capturas/desktop-clases.png",
  socios: "capturas/desktop-socios.png",
  pagos: "capturas/desktop-pagos.png",
  canchas: "capturas/desktop-canchas.png",
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
  return `<section class="slide slide-cover ink">
    <div class="brand"><div class="mark">T</div><div><b>SaaS Tenis Club</b><span>Club OS</span></div></div>
    <div class="cover-copy">
      <p class="eyebrow">Presentación comercial</p>
      <h1>La plataforma SaaS para digitalizar clubes de tenis.</h1>
      <p class="lead">Reservas, clases, socios, profesores, pagos, membresías, configuración y dashboards en un producto listo para vender a múltiples clubes.</p>
      <div class="cover-actions">
        ${badge("Mobile first")}
        ${badge("Multi club")}
        ${badge("Roles y permisos")}
        ${badge("Pagos trazables")}
      </div>
    </div>
    <div class="cover-panel">
      <div class="mini-window">${img(shots.admin, "Dashboard admin")}</div>
      <div class="mini-phone">${img(shots.mobilePanel, "Panel mobile")}</div>
    </div>
    <div class="page-number">01</div>
  </section>`;
}

function problem() {
  return `<section class="slide">
    <div class="split">
      <div>
        <p class="eyebrow">El problema</p>
        <h2>Muchos clubes todavía operan con WhatsApp, planillas y memoria.</h2>
        <p class="lead muted">Eso funciona hasta que aparecen reservas duplicadas, socios con deuda, cupos mal contados, profesores sin visibilidad y administradores apagando incendios.</p>
      </div>
      <div class="pain-grid">
        ${pain("Reservas desordenadas", "Turnos confirmados por chat, cambios manuales y poca trazabilidad.")}
        ${pain("Pagos mezclados", "Cuotas, invitados y reservas sin una separación clara por motivo.")}
        ${pain("Clases sin control", "Cupos, lista de espera y asistencia dependen de seguimiento manual.")}
        ${pain("Roles confusos", "Profesores, socios y administradores terminan viendo más de lo que corresponde.")}
        ${pain("Poca información", "El club no ve ocupación, deuda, demanda y actividad en tiempo real.")}
        ${pain("Escala limitada", "Cada nuevo club exige rehacer procesos si no hay multitenancy real.")}
      </div>
    </div>
    <div class="page-number">02</div>
  </section>`;
}

function pain(title, text) {
  return `<article class="pain"><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function solution() {
  return `<section class="slide">
    <p class="eyebrow">La solución</p>
    <h2>Un sistema operativo moderno para clubes de tenis.</h2>
    <div class="solution-map">
      ${moduleCard("Reservas", "Grilla visual, disponibilidad, bloqueos, singles/dobles e invitados no socios.")}
      ${moduleCard("Clases", "Cupos, niveles, profesores, asistencia, lista de espera e inscripciones.")}
      ${moduleCard("Socios", "Perfil, estado de membresía, pagos, reservas, clases, notas y actividad.")}
      ${moduleCard("Pagos", "Membresía, invitados, reservas y otros conceptos con reportes claros.")}
      ${moduleCard("Settings", "Reglas por club: límites, horarios, idioma, colores, deuda y costo de invitados.")}
      ${moduleCard("SaaS", "SuperAdmin, tenants, aislamiento de datos y alta de nuevos clubes.")}
    </div>
    <div class="page-number">03</div>
  </section>`;
}

function moduleCard(title, text) {
  return `<article class="module"><div class="module-icon">${esc(title[0])}</div><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function screenshotSlide(kicker, title, text, image, bullets, page) {
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
    <div class="page-number">${page}</div>
  </section>`;
}

function adminDashboard() {
  return screenshotSlide(
    "Dashboard admin",
    "El administrador entiende el club en una mirada.",
    "Métricas, alertas, reservas, pagos y ocupación aparecen en un panel preparado para la gestión diaria.",
    shots.admin,
    ["Socios activos e inactivos", "Pagos vencidos y pendientes", "Reservas de hoy y de la semana", "Ocupación de canchas y alertas accionables"],
    "04"
  );
}

function reservations() {
  return `<section class="slide">
    <p class="eyebrow">Reservas de cancha</p>
    <h2>Reservar, bloquear y cobrar invitados desde un flujo profesional.</h2>
    <div class="reservation-layout">
      <div class="wide-screen">${img(shots.reservas, "Reservas desktop")}</div>
      <div class="phone-frame">${img(shots.mobileModal, "Reserva mobile")}</div>
    </div>
    <div class="feature-row">
      ${feature("Singles o dobles", "El socio indica si juega con una persona o con tres.")}
      ${feature("Socios e invitados", "Se marca quién es socio y quién paga como invitado.")}
      ${feature("Reglas automáticas", "Límites semanales, disponibilidad y deuda se validan antes de confirmar.")}
    </div>
    <div class="page-number">05</div>
  </section>`;
}

function feature(title, text) {
  return `<article class="feature"><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function mobileExperience() {
  return `<section class="slide ink">
    <p class="eyebrow">Mobile first</p>
    <h2>La experiencia del socio está pensada para celular desde el primer día.</h2>
    <div class="phone-row">
      ${phone(shots.mobilePanel, "Mi panel")}
      ${phone(shots.mobileReservas, "Reservas")}
      ${phone(shots.mobileClases, "Clases")}
      ${phone(shots.mobilePagos, "Pagos")}
    </div>
    <div class="dark-note">El club reduce consultas repetidas porque el socio puede ver reservas, clases, pagos y perfil sin depender de mensajes manuales.</div>
    <div class="page-number">06</div>
  </section>`;
}

function phone(src, caption) {
  return `<figure class="phone"><div>${img(src, caption)}</div><figcaption>${esc(caption)}</figcaption></figure>`;
}

function classesAndCoach() {
  return `<section class="slide">
    <div class="two-screens">
      <div>
        <p class="eyebrow">Clases y profesores</p>
        <h2>Cupos, asistencia y alumnos quedan bajo control.</h2>
        <p class="muted">El socio se anota cuando hay cupo, el profesor reserva cupos para alumnos y el sistema evita duplicados. Si la clase está llena, puede operar con lista de espera.</p>
        <div class="bullet-list compact">
          <div><i></i><span>Cupo máximo parametrizable por clase.</span></div>
          <div><i></i><span>Límite semanal de clases configurable por club.</span></div>
          <div><i></i><span>Profesor con credenciales propias y permisos acotados.</span></div>
          <div><i></i><span>Asistencia con presente, ausente, tarde o justificado.</span></div>
        </div>
      </div>
      <div class="screen-stack">
        <div class="screen-card small">${img(shots.clases, "Clases")}</div>
        <div class="screen-card small overlap">${img(shots.coach, "Profesor")}</div>
      </div>
    </div>
    <div class="page-number">07</div>
  </section>`;
}

function members() {
  return screenshotSlide(
    "Socios",
    "Cada socio tiene un perfil comercial y operativo completo.",
    "El club puede consultar membresía, estado, teléfono, notas, pagos, reservas, clases y no-shows desde una misma vista.",
    shots.socios,
    ["Alta y edición de socios", "Activación o desactivación", "Historial de pagos y clases", "Notas administrativas para seguimiento"],
    "08"
  );
}

function payments() {
  return `<section class="slide">
    <div class="screen-slide reverse">
      <div class="screen-card">${img(shots.pagos, "Pagos")}</div>
      <div class="copy">
        <p class="eyebrow">Pagos e ingresos</p>
        <h2>Los cobros se separan por motivo para evitar una caja confusa.</h2>
        <p class="muted">Al registrar un pago, el administrador elige el concepto. Esto permite distinguir cuota social, invitados no socios, reserva de cancha y otros ingresos.</p>
        <div class="money-grid">
          ${money("Membresía", "Cuota mensual del socio")}
          ${money("Invitados", "Cargo por jugadores no socios")}
          ${money("Reserva", "Pago asociado al uso de cancha")}
          ${money("Otros", "Conceptos administrativos")}
        </div>
      </div>
    </div>
    <div class="page-number">09</div>
  </section>`;
}

function money(title, text) {
  return `<article class="money"><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function settings() {
  return screenshotSlide(
    "Configuración",
    "Cada club maneja sus reglas sin tocar código.",
    "El admin ajusta límites semanales, horarios, costo de invitados, reglas de deuda, idioma, tema visual, colores y zona horaria.",
    shots.settings,
    ["Límite semanal de reservas", "Máximo de clases por semana", "Costo de invitado no socio", "Modo claro/oscuro e idioma"],
    "10"
  );
}

function roles() {
  return `<section class="slide">
    <p class="eyebrow">Roles y permisos</p>
    <h2>Cada usuario ve solamente lo que necesita para trabajar.</h2>
    <div class="role-matrix">
      ${role("SuperAdmin", "Gestiona tenants, activa clubes y mira métricas generales del SaaS.", ["Clubes", "Usuarios", "Métricas SaaS"])}
      ${role("Admin del club", "Opera el club: socios, pagos, canchas, clases, reglas y dashboard.", ["Canchas", "Pagos", "Settings"])}
      ${role("Profesor", "Ve sus clases, alumnos, asistencia y puede reservar cupos para socios.", ["Clases", "Asistencia", "Alumnos"])}
      ${role("Socio", "Reserva cancha, se anota a clases, consulta pagos y actualiza perfil.", ["Reservas", "Clases", "Perfil"])}
    </div>
    <div class="page-number">11</div>
  </section>`;
}

function role(title, text, tags) {
  return `<article class="role"><b>${esc(title)}</b><p>${esc(text)}</p><div>${tags.map(badge).join("")}</div></article>`;
}

function tenancySecurity() {
  return `<section class="slide">
    <p class="eyebrow">Seguridad y multitenancy</p>
    <h2>Preparado como producto SaaS, no como sistema de un solo club.</h2>
    <div class="architecture">
      <div class="lane"><b>Frontend</b><span>Vanilla JS, rutas por hash, API client centralizado, localStorage/sessionStorage y deploy estático en Netlify.</span></div>
      <div class="lane"><b>API .NET</b><span>ASP.NET Core Web API, JWT, refresh tokens, role-based authorization, Swagger y CORS.</span></div>
      <div class="lane"><b>Application</b><span>Servicios con reglas de reservas, clases, membresías, pagos, usuarios y dashboards.</span></div>
      <div class="lane"><b>SQL Server</b><span>Entity Framework Core Code First, migrations, seed inicial, índices y filtros por ClubTenantId.</span></div>
    </div>
    <div class="security-strip">
      ${badge("Hash seguro de passwords")}
      ${badge("Tenant por X-Tenant-Slug")}
      ${badge("Manejo global de errores")}
      ${badge("Auditoría preparada")}
      ${badge("Deploy Somee + Netlify")}
    </div>
    <div class="page-number">12</div>
  </section>`;
}

function operations() {
  return `<section class="slide">
    <p class="eyebrow">Impacto para el club</p>
    <h2>Menos administración manual. Más control comercial.</h2>
    <div class="impact-grid">
      ${impact("Ahorro operativo", "Menos mensajes, menos planillas y menos coordinación manual.")}
      ${impact("Más ocupación", "El socio reserva fácil y el admin visualiza disponibilidad real.")}
      ${impact("Cobros claros", "Membresías, reservas e invitados quedan trazados por motivo.")}
      ${impact("Mejor experiencia", "Socios y profesores tienen paneles propios con acciones reales.")}
      ${impact("Menos errores", "Reglas automáticas reducen solapamientos, duplicados y exceso de cupos.")}
      ${impact("Escala SaaS", "El mismo producto permite vender a varios clubes con datos aislados.")}
    </div>
    <div class="page-number">13</div>
  </section>`;
}

function impact(title, text) {
  return `<article class="impact"><strong>${esc(title)}</strong><span>${esc(text)}</span></article>`;
}

function onboarding() {
  return `<section class="slide">
    <p class="eyebrow">Implementación</p>
    <h2>Un club puede quedar operativo con una puesta en marcha guiada.</h2>
    <div class="timeline">
      ${step("01", "Configuración", "Alta del tenant, colores, reglas, canchas, horarios y usuarios iniciales.")}
      ${step("02", "Migración", "Carga de socios, profesores, clases, membresías y deuda inicial si corresponde.")}
      ${step("03", "Capacitación", "Admin, profesores y socios clave aprenden los flujos principales.")}
      ${step("04", "Salida en vivo", "Acompañamiento inicial, ajustes finos y seguimiento de adopción.")}
    </div>
    <div class="page-number">14</div>
  </section>`;
}

function step(num, title, text) {
  return `<article class="step"><i>${esc(num)}</i><b>${esc(title)}</b><span>${esc(text)}</span></article>`;
}

function pricing() {
  return `<section class="slide ink">
    <p class="eyebrow">Modelo comercial sugerido</p>
    <h2>Precio simple para clubes, con margen para soporte y personalización.</h2>
    <div class="pricing-grid">
      ${plan("Básico", "$U 3.490", "Club chico", ["Reservas", "Socios", "Canchas", "Soporte estándar"])}
      ${plan("Pro", "$U 5.990", "Plan recomendado", ["Reservas avanzadas", "Clases y profesores", "Pagos", "Dashboards y settings"])}
      ${plan("Premium", "$U 9.990+", "Club grande", ["Multi sede", "Reportes avanzados", "Soporte prioritario", "Personalizaciones"])}
    </div>
    <div class="pricing-note">Setup inicial recomendado: $U 12.000 a $U 30.000 según carga de datos, capacitación y personalización. Los precios pueden ajustarse por cantidad de canchas, socios y soporte incluido.</div>
    <div class="page-number">15</div>
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
    <p class="eyebrow">Demo comercial</p>
    <h2>Una demostración clara para cada decisor del club.</h2>
    <div class="demo-grid">
      <article><b>Dueño o comisión directiva</b><span>Mostrar dashboard, pagos, ocupación, modelo de ingresos y reducción de trabajo manual.</span></article>
      <article><b>Administración</b><span>Mostrar socios, canchas, reservas, pagos, settings y manejo de deuda.</span></article>
      <article><b>Profesor</b><span>Mostrar clases, alumnos, cupos, asistencia y reserva de cupos para socios.</span></article>
      <article><b>Socio</b><span>Mostrar experiencia mobile: reservar cancha, anotarse a clase, ver pagos y cambiar preferencias.</span></article>
    </div>
    <div class="credentials">
      <b>Credenciales demo</b>
      <span>Club: club-demo | Admin: admin@clubdemo.com / Admin123! | Profesor: coach@clubdemo.com / Coach123! | Socio: socio@clubdemo.com / Socio123!</span>
    </div>
    <div class="page-number">16</div>
  </section>`;
}

function close() {
  return `<section class="slide slide-close ink">
    <div class="brand"><div class="mark">T</div><div><b>SaaS Tenis Club</b><span>Club OS</span></div></div>
    <div class="close-copy">
      <p class="eyebrow">Propuesta</p>
      <h1>Digitalizar el club no debería sentirse complejo.</h1>
      <p class="lead">SaaS Tenis Club reúne la operación diaria en una experiencia moderna, configurable y vendible a múltiples clubes.</p>
      <div class="close-grid">
        ${badge("Reservas")}
        ${badge("Clases")}
        ${badge("Socios")}
        ${badge("Pagos")}
        ${badge("Profesores")}
        ${badge("Dashboards")}
        ${badge("Multitenant")}
        ${badge("Mobile first")}
      </div>
    </div>
    <div class="page-number">17</div>
  </section>`;
}

function html() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>SaaS Tenis Club - Presentación de ventas</title>
  <style>
    @page { size: 16in 9in; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; color: #0f172a; font-family: "Segoe UI", Arial, sans-serif; }
    .slide { width: 1600px; height: 900px; padding: 62px 78px; position: relative; overflow: hidden; background: #f8fafc; page-break-after: always; }
    .slide:before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 82% 8%, rgba(37,99,235,.10), transparent 24%), linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,0)); }
    .ink { background: #07111f; color: #f8fafc; }
    .ink:before { background: radial-gradient(circle at 80% 0%, rgba(37,99,235,.45), transparent 28%), radial-gradient(circle at 5% 90%, rgba(16,185,129,.26), transparent 25%), linear-gradient(135deg, #08111f, #0d1b2e); }
    .brand { position: absolute; top: 48px; left: 78px; z-index: 2; display: flex; align-items: center; gap: 14px; }
    .brand b { display: block; font-size: 22px; }
    .brand span { display: block; color: #94a3b8; font-size: 15px; margin-top: 2px; }
    .mark { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; color: white; font-weight: 900; background: linear-gradient(135deg, #2563eb, #10b981); box-shadow: 0 18px 44px rgba(16,185,129,.25); }
    .eyebrow { color: #2563eb; font-weight: 900; font-size: 15px; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 16px; }
    .ink .eyebrow { color: #67e8f9; }
    h1, h2 { position: relative; z-index: 1; margin: 0; letter-spacing: -0.035em; }
    h1 { font-size: 70px; line-height: .94; max-width: 850px; }
    h2 { font-size: 50px; line-height: 1.02; max-width: 820px; }
    .lead { font-size: 24px; line-height: 1.42; color: #cbd5e1; max-width: 770px; margin-top: 24px; position: relative; z-index: 1; }
    .muted { color: #52627a; font-size: 22px; line-height: 1.42; }
    .badge { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; border-radius: 999px; padding: 7px 14px; background: #eaf1ff; color: #1d4ed8; font-weight: 800; font-size: 15px; white-space: nowrap; }
    .ink .badge { color: #dff7ff; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.12); }
    .page-number { position: absolute; right: 56px; bottom: 40px; color: #94a3b8; font-size: 14px; font-weight: 800; letter-spacing: .12em; z-index: 2; }
    .slide-cover .cover-copy { position: absolute; left: 78px; top: 190px; z-index: 2; }
    .cover-actions { margin-top: 34px; display: flex; gap: 10px; flex-wrap: wrap; }
    .cover-panel { position: absolute; right: 72px; top: 118px; width: 650px; height: 620px; z-index: 2; }
    .mini-window { position: absolute; right: 0; top: 0; width: 620px; padding: 14px; border-radius: 26px; background: rgba(255,255,255,.96); box-shadow: 0 34px 100px rgba(0,0,0,.42); }
    .mini-window img, .screen-card img, .wide-screen img { width: 100%; display: block; border-radius: 16px; }
    .mini-phone { position: absolute; width: 205px; right: 400px; top: 320px; padding: 10px; border-radius: 30px; background: #020617; box-shadow: 0 28px 80px rgba(0,0,0,.42); }
    .mini-phone img { width: 100%; display: block; border-radius: 22px; }
    .split { display: grid; grid-template-columns: 560px 1fr; gap: 58px; align-items: center; height: 100%; position: relative; z-index: 1; }
    .pain-grid, .solution-map, .impact-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .pain, .module, .impact, .feature, .money, .role, .lane, .demo-grid article { border: 1px solid #dbe4f0; background: rgba(255,255,255,.86); border-radius: 22px; padding: 24px; box-shadow: 0 18px 46px rgba(15,23,42,.07); }
    .pain b, .module b, .impact strong, .feature b, .money b, .role b, .lane b, .demo-grid b { display: block; font-size: 22px; margin-bottom: 10px; }
    .pain span, .module span, .impact span, .feature span, .money span, .role p, .lane span, .demo-grid span { color: #64748b; font-size: 18px; line-height: 1.35; }
    .solution-map { grid-template-columns: repeat(3, 1fr); margin-top: 42px; position: relative; z-index: 1; }
    .module { min-height: 190px; }
    .module-icon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; margin-bottom: 18px; background: linear-gradient(135deg, #2563eb, #10b981); color: white; font-weight: 900; }
    .screen-slide { display: grid; grid-template-columns: 515px 1fr; gap: 46px; align-items: center; height: 100%; position: relative; z-index: 1; }
    .screen-slide.reverse { grid-template-columns: 1fr 525px; }
    .screen-card { background: #fff; border: 1px solid #dbe4f0; border-radius: 28px; padding: 16px; box-shadow: 0 28px 76px rgba(15,23,42,.13); }
    .bullet-list { margin-top: 34px; display: grid; gap: 14px; }
    .bullet-list div { display: flex; gap: 12px; align-items: flex-start; color: #152033; font-size: 19px; line-height: 1.35; font-weight: 650; }
    .bullet-list i { width: 10px; height: 10px; border-radius: 99px; background: #10b981; margin-top: 9px; flex: 0 0 auto; }
    .bullet-list.compact { gap: 10px; margin-top: 26px; }
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
    .dark-note { position: relative; z-index: 1; color: #dbeafe; font-size: 22px; line-height: 1.4; margin-top: 30px; max-width: 1000px; }
    .two-screens { display: grid; grid-template-columns: 540px 1fr; gap: 48px; align-items: center; height: 100%; position: relative; z-index: 1; }
    .screen-stack { position: relative; height: 590px; }
    .screen-card.small { position: absolute; width: 820px; right: 0; top: 0; }
    .screen-card.overlap { width: 650px; right: 160px; top: 285px; }
    .money-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px; }
    .role-matrix { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 46px; position: relative; z-index: 1; }
    .role { min-height: 360px; display: flex; flex-direction: column; justify-content: space-between; }
    .role b { font-size: 26px; }
    .role div { display: flex; flex-wrap: wrap; gap: 8px; }
    .architecture { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 48px; position: relative; z-index: 1; }
    .lane { min-height: 240px; border-top: 8px solid #2563eb; }
    .security-strip { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 36px; }
    .impact-grid { grid-template-columns: repeat(3, 1fr); margin-top: 46px; }
    .impact strong { font-size: 27px; color: #2563eb; }
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
    .pricing-note { color: #cbd5e1; font-size: 20px; line-height: 1.4; margin-top: 16px; max-width: 1100px; position: relative; z-index: 1; }
    .demo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 46px; position: relative; z-index: 1; }
    .credentials { margin-top: 28px; padding: 24px; border-radius: 22px; background: #0f172a; color: white; position: relative; z-index: 1; }
    .credentials b { display: block; font-size: 22px; margin-bottom: 8px; }
    .credentials span { color: #cbd5e1; font-size: 18px; }
    .slide-close .close-copy { position: absolute; top: 190px; left: 78px; z-index: 1; }
    .close-grid { display: flex; gap: 10px; flex-wrap: wrap; width: 760px; margin-top: 36px; }
  </style>
</head>
<body>
${[
  cover(),
  problem(),
  solution(),
  adminDashboard(),
  reservations(),
  mobileExperience(),
  classesAndCoach(),
  members(),
  payments(),
  settings(),
  roles(),
  tenancySecurity(),
  operations(),
  onboarding(),
  pricing(),
  demo(),
  close()
].join("\n")}
</body>
</html>`;
}

async function ensureInputs() {
  for (const [key, src] of Object.entries(shots)) {
    const fullPath = path.join(outDir, src);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`Falta la captura requerida ${key}: ${fullPath}`);
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
  await page.pdf({
    path: pdfPath,
    width: "16in",
    height: "9in",
    printBackground: true,
    preferCSSPageSize: true
  });

  const slides = page.locator(".slide");
  const count = await slides.count();
  const previewPaths = [];
  for (let i = 0; i < count; i += 1) {
    const previewPath = path.join(qaDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await slides.nth(i).screenshot({ path: previewPath });
    previewPaths.push(path.relative(outDir, previewPath).replaceAll("\\", "/"));
  }

  const contactHtmlPath = path.join(qaDir, "contact-sheet.html");
  const contactHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin:0; background:#111827; font-family:Arial,sans-serif; color:white; }
    .grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:18px; padding:18px; }
    figure { margin:0; background:#020617; border-radius:10px; overflow:hidden; border:1px solid #334155; }
    img { width:100%; display:block; }
    figcaption { padding:8px 10px; font-size:13px; color:#cbd5e1; }
  </style></head><body><div class="grid">${previewPaths.map((src, index) => `<figure><img src="../${src}"><figcaption>${index + 1}</figcaption></figure>`).join("")}</div></body></html>`;
  await fs.writeFile(contactHtmlPath, contactHtml, "utf8");
  const contact = await browser.newPage({ viewport: { width: 1500, height: 2000 }, deviceScaleFactor: 1 });
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
