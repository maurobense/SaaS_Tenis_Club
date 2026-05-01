import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const nodeModules = "C:/Users/mauro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";
const require = createRequire(path.join(nodeModules, "noop.js"));
const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");

const root = path.resolve(process.cwd());
const outDir = path.join(root, "docs", "presentacion");
const shotDir = path.join(outDir, "capturas");
const appUrl = "http://localhost:5500";
const apiUrl = "http://localhost:64652";
const tenantSlug = "club-demo";

const users = {
  admin: { email: "admin@clubdemo.com", password: "Admin123!" },
  coach: { email: "coach@clubdemo.com", password: "Coach123!" },
  member: { email: "socio@clubdemo.com", password: "Socio123!" }
};

async function ensureDirs() {
  await fs.mkdir(shotDir, { recursive: true });
}

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${options.method || "GET"} ${url} -> ${response.status}`);
  return response.json();
}

async function login(kind) {
  const credentials = users[kind];
  const payload = await getJson(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Tenant-Slug": tenantSlug },
    body: JSON.stringify({ ...credentials, tenantSlug })
  });
  return payload.data;
}

async function setSession(page, session, theme = "light", language = "es") {
  await page.addInitScript(({ session, tenantSlug, theme, language }) => {
    localStorage.setItem("accessToken", session.accessToken);
    localStorage.setItem("refreshToken", session.refreshToken);
    localStorage.setItem("tenantSlug", tenantSlug);
    localStorage.setItem("user", JSON.stringify(session.user));
    localStorage.setItem("tenant", JSON.stringify(session.tenant || {
      name: "Club Demo Tenis",
      slug: tenantSlug,
      primaryColor: "#2563eb",
      secondaryColor: "#10b981"
    }));
    localStorage.setItem("uiTheme", theme);
    localStorage.setItem("uiLanguage", language);
    sessionStorage.setItem("reservationDate", "2026-05-08");
  }, { session, tenantSlug, theme, language });
}

async function capture(page, route, fileName, options = {}) {
  await page.goto(`${appUrl}/${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(options.delay ?? 900);
  if (options.click) {
    const target = page.locator(options.click).first();
    if (await target.count()) {
      await target.click();
      await page.waitForTimeout(600);
    }
  }
  const filePath = path.join(shotDir, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  return `capturas/${fileName}`;
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const sessions = {
    admin: await login("admin"),
    coach: await login("coach"),
    member: await login("member")
  };

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const desktop = await desktopContext.newPage();
  await setSession(desktop, sessions.admin, "light", "es");
  const desktopShots = {
    admin: await capture(desktop, "#/admin", "desktop-admin-dashboard.png"),
    reservations: await capture(desktop, "#/reservations", "desktop-reservas.png"),
    classes: await capture(desktop, "#/classes", "desktop-clases.png"),
    members: await capture(desktop, "#/members", "desktop-socios.png"),
    payments: await capture(desktop, "#/payments", "desktop-pagos.png"),
    courts: await capture(desktop, "#/courts", "desktop-canchas.png"),
    settings: await capture(desktop, "#/settings", "desktop-configuracion.png")
  };

  const coachContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const coach = await coachContext.newPage();
  await setSession(coach, sessions.coach, "light", "es");
  desktopShots.coach = await capture(coach, "#/coach", "desktop-profesor.png");

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobile = await mobileContext.newPage();
  await setSession(mobile, sessions.member, "dark", "es");
  const mobileShots = {
    panel: await capture(mobile, "#/member", "mobile-panel.png"),
    reservations: await capture(mobile, "#/reservations", "mobile-reservas.png"),
    reservationModal: await capture(mobile, "#/reservations", "mobile-reserva-modal.png", { click: "[data-slot]" }),
    classes: await capture(mobile, "#/classes", "mobile-clases.png"),
    payments: await capture(mobile, "#/payments", "mobile-pagos.png"),
    profile: await capture(mobile, "#/profile", "mobile-perfil.png")
  };

  await browser.close();
  return { desktopShots, mobileShots };
}

function img(src, alt = "") {
  return `<img src="${src}" alt="${escapeHtml(alt)}" />`;
}

function desktopHtml(s) {
  return baseHtml("desktop", `
    ${slideCover("Una plataforma lista para vender a clubes de tenis", "Reservas, clases, socios, pagos, profesores y configuracion multitenant en una sola experiencia SaaS.", "Presentacion comercial desktop")}
    ${slideTextImage("ADMINISTRACION", "El administrador ve el pulso completo del club en segundos.", "Metricas operativas, alertas de pagos, reservas de hoy, ocupacion de canchas y accesos rapidos para operar el dia a dia.", s.admin, [
      "Socios activos e inactivos",
      "Pagos vencidos y pendientes",
      "Reservas de hoy y de la semana",
      "Ocupacion por cancha y alertas comerciales"
    ])}
    ${slideTextImage("RESERVAS", "Agenda visual para reservar, bloquear y controlar disponibilidad.", "Cada reserva respeta reglas configurables: limite semanal, ventana de apertura, disponibilidad de cancha, membresia activa y pagos.", s.reservations, [
      "Singles o dobles con jugadores adicionales",
      "Socios e invitados no socios",
      "Bloqueos por mantenimiento, torneo o uso interno",
      "Costo por invitado configurable"
    ])}
    ${slideTextImage("CLASES", "Clases con cupos, lista de espera y control por profesor.", "El club puede crear grupos por nivel, asignar profesor y cancha, controlar inscripciones y permitir que el profesor reserve cupos para alumnos.", s.classes, [
      "Cupo maximo por clase",
      "Lista de espera inteligente",
      "Profesor ve sus alumnos",
      "Socio puede anotarse o cancelar"
    ])}
    ${slideTextImage("SOCIOS", "Perfil completo del socio para administrar relacion y riesgo.", "El admin puede consultar membresia, pagos, reservas, clases, no-shows, notas y estado de actividad sin mezclar datos de otros tenants.", s.members, [
      "Historial de pagos y reservas",
      "Estado de membresia",
      "Activar o desactivar socios",
      "Notas administrativas"
    ])}
    ${slideTextImage("PAGOS", "Los ingresos quedan separados por motivo, no mezclados en una caja generica.", "El sistema distingue cuota social, invitados no socios, reserva de cancha y otros conceptos. Esto hace mas claro el reporte y evita errores contables.", s.payments, [
      "Membresia mensual",
      "Pago de invitados de cancha",
      "Reserva de cancha",
      "Otros conceptos"
    ])}
    ${slideTextImage("CANCHAS", "Gestion de canchas con estilo premium y acciones reales.", "Alta, edicion, superficie, luces, horarios, duracion de turnos y desactivacion con confirmacion.", s.courts, [
      "Polvo de ladrillo, dura, cesped o sintetica",
      "Techada o exterior",
      "Turnos configurables",
      "Alta de nuevas canchas"
    ])}
    ${slideTextImage("PROFESORES", "El profesor tiene su propio panel y no ve lo que no corresponde.", "Cada rol tiene navegacion y permisos propios. El profesor gestiona sus clases, asistencia, alumnos y agenda sin acceso administrativo completo.", s.coach, [
      "Usuario profesor con credenciales",
      "Cambio de contrasena desde Perfil",
      "Reserva cupos para socios",
      "Marca asistencia"
    ])}
    ${slideTextImage("CONFIGURACION", "Cada club controla sus propias reglas de negocio.", "Nada importante queda hardcodeado: dias de pago, limite de reservas, limite de clases, invitados, colores, idioma y zona horaria se ajustan por tenant.", s.settings, [
      "Costo por invitado no socio",
      "Reservas por semana",
      "Clases por semana",
      "Idioma, colores y reglas"
    ])}
    ${slideArchitecture()}
    ${slideUseCases()}
    ${slideClose("SaaS Tenis Club convierte la operacion diaria del club en un producto digital vendible.", "Demo lista para mostrar: reservas, pagos, socios, clases, profesores y configuracion multitenant.")}
  `);
}

function mobileHtml(s) {
  return baseHtml("mobile", `
    ${mobileCover("La experiencia mobile que el socio realmente usa", "Reservar, anotarse a clases, revisar pagos y gestionar su perfil desde el celular.")}
    ${mobileShot("SOCIO", "Mi panel resume lo que importa: membresia, proxima reserva, proxima clase y pagos pendientes.", s.panel)}
    ${mobileShot("RESERVAR", "La grilla mobile prioriza accion rapida: fecha, cancha, turnos disponibles y estado visual.", s.reservations)}
    ${mobileShot("INVITADOS", "Al reservar se elige singles o dobles y se cargan socios o invitados no socios. El costo se calcula en vivo.", s.reservationModal)}
    ${mobileShot("CLASES", "El socio ve cupos, nivel, profesor y estado de inscripcion. Si ya esta anotado, no se le ofrece anotarse de nuevo.", s.classes)}
    ${mobileShot("PAGOS", "La pantalla de pagos muestra membresia y conceptos separados para evitar confusiones.", s.payments)}
    ${mobileShot("PREFERENCIAS", "Perfil permite idioma, tema claro/oscuro y cambio de contrasena.", s.profile)}
    ${mobileUseFlow()}
    ${mobileClose()}
  `);
}

function baseHtml(mode, slides) {
  const isMobile = mode === "mobile";
  return `<!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: ${isMobile ? "9in 16in" : "16in 9in"}; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, "Segoe UI", Arial, sans-serif; color: #0f172a; background: #eef2f7; }
      .slide { width: ${isMobile ? "9in" : "16in"}; height: ${isMobile ? "16in" : "9in"}; page-break-after: always; position: relative; overflow: hidden; background: #f8fafc; padding: ${isMobile ? ".55in" : ".58in .72in"}; }
      .slide.dark { background: #08111f; color: #f8fafc; }
      .kicker { color: #2563eb; font-weight: 900; letter-spacing: .12em; font-size: ${isMobile ? "18px" : "15px"}; text-transform: uppercase; }
      h1 { margin: .1in 0 .16in; font-size: ${isMobile ? "54px" : "58px"}; line-height: .96; letter-spacing: -0.02em; max-width: ${isMobile ? "7.7in" : "9.8in"}; }
      h2 { margin: .08in 0 .14in; font-size: ${isMobile ? "38px" : "42px"}; line-height: 1.04; letter-spacing: -0.018em; max-width: ${isMobile ? "7.5in" : "7.1in"}; }
      p { font-size: ${isMobile ? "22px" : "19px"}; line-height: 1.45; color: #475569; margin: 0; }
      .dark p { color: #cbd5e1; }
      .brand { position: absolute; left: .72in; top: .55in; display: flex; gap: 12px; align-items: center; font-weight: 900; }
      .mark { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #10b981); color: white; display: grid; place-items: center; font-size: 24px; }
      .hero { display: grid; grid-template-columns: ${isMobile ? "1fr" : "1fr 1.1fr"}; gap: .5in; align-items: center; height: 100%; padding-top: ${isMobile ? ".3in" : ".2in"}; }
      .proof { border: 1px solid #dbe4f0; border-radius: 24px; background: white; box-shadow: 0 22px 60px rgba(15, 23, 42, .12); padding: .16in; }
      .proof img { width: 100%; height: auto; border-radius: 16px; display: block; }
      .text-image { display: grid; grid-template-columns: ${isMobile ? "1fr" : "6.2in 1fr"}; gap: .42in; align-items: center; height: 100%; }
      .bullets { margin-top: .34in; display: grid; gap: .12in; }
      .bullet { display: flex; gap: 12px; align-items: flex-start; font-size: ${isMobile ? "20px" : "18px"}; line-height: 1.3; color: #0f172a; }
      .bullet:before { content: ""; width: 9px; height: 9px; border-radius: 99px; background: #10b981; margin-top: 8px; flex: 0 0 auto; }
      .metric-rail { position: absolute; left: .72in; right: .72in; bottom: .6in; display: grid; grid-template-columns: repeat(4, 1fr); gap: .16in; }
      .metric { border-top: 1px solid rgba(255,255,255,.25); padding-top: .16in; }
      .metric strong { display:block; font-size: 32px; color: white; }
      .metric span { color: #cbd5e1; font-size: 15px; }
      .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: .22in; margin-top: .36in; }
      .card { border: 1px solid #dbe4f0; background: white; border-radius: 20px; padding: .28in; box-shadow: 0 16px 38px rgba(15,23,42,.08); min-height: 1.55in; }
      .card strong { display: block; font-size: 24px; margin-bottom: .08in; }
      .card span { color: #64748b; font-size: 17px; line-height: 1.35; }
      .diagram { margin-top: .35in; display: grid; grid-template-columns: repeat(4, 1fr); gap: .18in; align-items: stretch; }
      .node { border: 1px solid #dbe4f0; background: white; border-radius: 18px; padding: .22in; }
      .node b { display:block; color:#2563eb; margin-bottom: .08in; }
      .phone-wrap { height: 11.4in; display: grid; place-items: center; margin-top: .28in; }
      .phone { width: 4.35in; border-radius: .45in; padding: .14in; background: #0b1220; box-shadow: 0 30px 80px rgba(0,0,0,.28); }
      .phone img { width: 100%; border-radius: .32in; display: block; }
      .mobile-title h2 { font-size: 40px; }
      .flow { margin-top: .45in; display:grid; gap:.18in; }
      .step { display:grid; grid-template-columns:.55in 1fr; gap:.16in; align-items:start; background:white; border:1px solid #dbe4f0; border-radius:22px; padding:.24in; }
      .step i { width:.5in; height:.5in; border-radius:50%; background:#2563eb; color:white; display:grid; place-items:center; font-style:normal; font-weight:900; }
      .footer { position:absolute; left:.72in; bottom:.3in; color:#64748b; font-size:14px; }
    </style>
  </head>
  <body>${slides}</body>
  </html>`;
}

function slideCover(title, subtitle, kicker) {
  return `<section class="slide dark">
    <div class="brand"><div class="mark">T</div><div>SaaS Tenis Club</div></div>
    <div class="hero">
      <div>
        <div class="kicker">${kicker}</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
    </div>
    <div class="metric-rail">
      <div class="metric"><strong>4 roles</strong><span>SuperAdmin, admin, profesor y socio</span></div>
      <div class="metric"><strong>Multi club</strong><span>Datos aislados por tenant</span></div>
      <div class="metric"><strong>Mobile first</strong><span>Reservas desde el celular</span></div>
      <div class="metric"><strong>Pagos claros</strong><span>Membresia e invitados separados</span></div>
    </div>
  </section>`;
}

function slideTextImage(kicker, title, text, imageSrc, bullets) {
  return `<section class="slide">
    <div class="text-image">
      <div>
        <div class="kicker">${kicker}</div>
        <h2>${title}</h2>
        <p>${text}</p>
        <div class="bullets">${bullets.map(b => `<div class="bullet">${b}</div>`).join("")}</div>
      </div>
      <div class="proof">${img(imageSrc, title)}</div>
    </div>
    <div class="footer">SaaS Tenis Club - Plataforma comercial para clubes de tenis</div>
  </section>`;
}

function slideArchitecture() {
  return `<section class="slide">
    <div class="kicker">ARQUITECTURA</div>
    <h2>Base seria para vender a muchos clubes sin mezclar datos.</h2>
    <p>Backend .NET por capas, Entity Framework Core Code First, JWT, refresh tokens, roles y aislamiento por tenant usando el header X-Tenant-Slug.</p>
    <div class="diagram">
      <div class="node"><b>Frontend estatico</b><span>Vanilla JS, hash routing, API client centralizado, Netlify-ready.</span></div>
      <div class="node"><b>API .NET</b><span>Controllers, middlewares, Swagger, Serilog, CORS y manejo global de errores.</span></div>
      <div class="node"><b>Application</b><span>Servicios, DTOs, reglas de reservas, cupos, pagos y membresias.</span></div>
      <div class="node"><b>Infrastructure</b><span>SQL Server, EF Core, migrations, seed, repositorios y Unit of Work.</span></div>
    </div>
    <div class="cards">
      <div class="card"><strong>Tenant isolation</strong><span>Cada query relevante se filtra por ClubTenantId.</span></div>
      <div class="card"><strong>Reglas configurables</strong><span>Limites semanales, costo de invitados, horarios y pagos por club.</span></div>
      <div class="card"><strong>Preparado para deploy</strong><span>Backend Somee, frontend Netlify y SQL Server.</span></div>
    </div>
  </section>`;
}

function slideUseCases() {
  return `<section class="slide">
    <div class="kicker">EJEMPLOS DE USO</div>
    <h2>El sistema cubre la operacion real, no solo la demo visual.</h2>
    <div class="cards">
      <div class="card"><strong>Socio reserva dobles</strong><span>Elige cancha y horario, carga tres jugadores, marca quienes son invitados y ve el total a cobrar.</span></div>
      <div class="card"><strong>Admin registra pago</strong><span>Selecciona motivo: membresia, invitados de cancha, reserva u otro. El reporte queda separado.</span></div>
      <div class="card"><strong>Profesor reserva cupo</strong><span>Desde sus clases, busca socios elegibles y reserva cupos sin acceder a configuracion del club.</span></div>
      <div class="card"><strong>Club cambia reglas</strong><span>Actualiza limites semanales, dias de pago, lista de espera, costo de invitados e idioma.</span></div>
      <div class="card"><strong>Pago vencido bloquea reserva</strong><span>Segun configuracion, el socio con deuda queda bloqueado o advertido al reservar.</span></div>
      <div class="card"><strong>SuperAdmin escala SaaS</strong><span>Puede administrar clubes, activar tenants y mirar metricas generales de uso.</span></div>
    </div>
  </section>`;
}

function slideClose(title, subtitle) {
  return `<section class="slide dark">
    <div class="brand"><div class="mark">T</div><div>SaaS Tenis Club</div></div>
    <div class="hero">
      <div>
        <div class="kicker">CIERRE COMERCIAL</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
    </div>
    <div class="metric-rail">
      <div class="metric"><strong>Menos planillas</strong><span>Operacion centralizada</span></div>
      <div class="metric"><strong>Mas control</strong><span>Reglas por club</span></div>
      <div class="metric"><strong>Mas ingresos</strong><span>Invitados y membresias trazables</span></div>
      <div class="metric"><strong>Mejor UX</strong><span>Socio mobile first</span></div>
    </div>
  </section>`;
}

function mobileCover(title, subtitle) {
  return `<section class="slide dark">
    <div class="brand"><div class="mark">T</div><div>SaaS Tenis Club</div></div>
    <div style="position:absolute; left:.55in; right:.55in; top:2.3in;">
      <div class="kicker">Presentacion mobile</div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
    <div class="metric-rail" style="grid-template-columns:1fr 1fr; bottom:.7in;">
      <div class="metric"><strong>Reservas</strong><span>En segundos</span></div>
      <div class="metric"><strong>Pagos</strong><span>Transparentes</span></div>
      <div class="metric"><strong>Clases</strong><span>Con cupos</span></div>
      <div class="metric"><strong>Perfil</strong><span>Idioma y tema</span></div>
    </div>
  </section>`;
}

function mobileShot(kicker, title, src) {
  return `<section class="slide">
    <div class="mobile-title">
      <div class="kicker">${kicker}</div>
      <h2>${title}</h2>
    </div>
    <div class="phone-wrap"><div class="phone">${img(src, title)}</div></div>
  </section>`;
}

function mobileUseFlow() {
  return `<section class="slide">
    <div class="kicker">FLUJO MOBILE</div>
    <h2>Un socio puede resolver su dia a dia sin llamar al club.</h2>
    <div class="flow">
      <div class="step"><i>1</i><div><b>Abre Mi panel</b><p>Ve membresia, proxima clase, proxima reserva y pagos.</p></div></div>
      <div class="step"><i>2</i><div><b>Reserva cancha</b><p>Elige singles o dobles, agrega socios o invitados no socios y confirma.</p></div></div>
      <div class="step"><i>3</i><div><b>Se anota a clases</b><p>Si hay cupo entra activo; si esta lleno puede ir a lista de espera.</p></div></div>
      <div class="step"><i>4</i><div><b>Consulta pagos</b><p>Distingue deuda de membresia y cargos por invitados.</p></div></div>
    </div>
  </section>`;
}

function mobileClose() {
  return `<section class="slide dark">
    <div class="brand"><div class="mark">T</div><div>SaaS Tenis Club</div></div>
    <div style="position:absolute; left:.55in; right:.55in; top:2.1in;">
      <div class="kicker">Mobile first</div>
      <h1>La venta se vuelve mas simple cuando el socio entiende la app en la primera mirada.</h1>
      <p>Reservas, clases, pagos y perfil quedan en un recorrido claro, moderno y usable.</p>
    </div>
  </section>`;
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function writeAndPrint(browser, html, htmlName, pdfName, size) {
  const htmlPath = path.join(outDir, htmlName);
  const pdfPath = path.join(outDir, pdfName);
  await fs.writeFile(htmlPath, html, "utf8");
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.pdf({ path: pdfPath, width: size.width, height: size.height, printBackground: true, preferCSSPageSize: true });
  await page.close();
  return pdfPath;
}

async function mergePdfs(inputs, output) {
  const doc = await PDFDocument.create();
  for (const input of inputs) {
    const src = await PDFDocument.load(await fs.readFile(input));
    const pages = await doc.copyPages(src, src.getPageIndices());
    pages.forEach(page => doc.addPage(page));
  }
  await fs.writeFile(output, await doc.save());
}

async function main() {
  await ensureDirs();
  const shots = await captureScreenshots();
  const browser = await chromium.launch({ headless: true });
  const desktopPdf = await writeAndPrint(browser, desktopHtml(shots.desktopShots), "presentacion-desktop.html", "SaaS_Tenis_Club_Presentacion_Desktop.pdf", { width: "16in", height: "9in" });
  const mobilePdf = await writeAndPrint(browser, mobileHtml(shots.mobileShots), "presentacion-mobile.html", "SaaS_Tenis_Club_Presentacion_Mobile.pdf", { width: "9in", height: "16in" });
  await browser.close();
  const combined = path.join(outDir, "SaaS_Tenis_Club_Presentacion_Comercial.pdf");
  await mergePdfs([desktopPdf, mobilePdf], combined);
  console.log(JSON.stringify({ desktopPdf, mobilePdf, combined, screenshots: shotDir }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
