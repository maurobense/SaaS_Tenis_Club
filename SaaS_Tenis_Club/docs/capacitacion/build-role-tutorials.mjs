import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("docs", "capacitacion");
const shotsDir = "capturas-reales";

const css = String.raw`
@page { size: 9in 16in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; overflow-x: hidden; background: #e8eef6; color: #07111f; font-family: "Segoe UI", Arial, sans-serif; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 9in; height: 16in; position: relative; overflow: hidden; page-break-after: always; padding: .58in .56in; background: #f8fafc; }
.page:before { content: ""; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 92% 2%, rgba(37, 99, 235, .12), transparent 29%), linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,0)); }
.ink { background: #06111f; color: #f8fafc; }
.ink:before { background: radial-gradient(circle at 88% 0%, rgba(37,99,235,.34), transparent 30%), radial-gradient(circle at 8% 95%, rgba(16,185,129,.24), transparent 31%), linear-gradient(145deg, #06111f, #10243e); }
.brand { position: relative; z-index: 2; display: flex; align-items: center; gap: 14px; }
.mark { width: 54px; height: 54px; border-radius: 16px; display: grid; place-items: center; color: #fff; font-weight: 950; font-size: 25px; background: linear-gradient(135deg, #2563eb, #10b981); box-shadow: 0 20px 54px rgba(16,185,129,.22); }
.brand b { display: block; font-size: 22px; letter-spacing: 0; }
.brand span { display: block; margin-top: 2px; color: #8ea0b8; font-size: 15px; }
.ink .brand span { color: #aab8ca; }
h1, h2, p { position: relative; z-index: 2; margin: 0; letter-spacing: 0; }
h1 { margin-top: .9in; max-width: 7.25in; font-size: 50px; line-height: .99; }
h2 { max-width: 7.35in; font-size: 40px; line-height: 1.04; }
p { color: #52627a; font-size: 20px; line-height: 1.4; }
.ink p { color: #cbd5e1; }
.lead { margin-top: .22in; font-size: 24px; line-height: 1.35; max-width: 7.25in; }
.eyebrow { position: relative; z-index: 2; margin: 0 0 14px; color: #2563eb; font-weight: 950; letter-spacing: .12em; text-transform: uppercase; font-size: 15px; }
.ink .eyebrow { color: #67e8f9; }
.badges { position: relative; z-index: 2; display: flex; flex-wrap: wrap; gap: 10px; margin-top: .28in; }
.badge { display: inline-flex; min-height: 34px; align-items: center; justify-content: center; border-radius: 999px; padding: 7px 13px; background: #eaf1ff; color: #1d4ed8; font-weight: 850; font-size: 15px; white-space: nowrap; }
.ink .badge { color: #dff7ff; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.12); }
.number { position: absolute; right: .5in; bottom: .34in; z-index: 2; color: #8ea0b8; font-size: 13px; font-weight: 850; letter-spacing: .12em; }
.section { margin: .62in auto 0; max-width: 7.7in; }
.section p { margin-top: .14in; }
.page-stack { position: relative; z-index: 2; min-height: 100%; display: flex; flex-direction: column; justify-content: center; }
.page-stack .section { margin-top: 0; }
.page-stack .shot { margin-top: .26in; }
.page-stack .phone-stage { margin-top: .26in; }
.page-stack .steps { margin-top: .22in; }
.page-stack .checklist { margin-top: .28in; }
.cards { position: relative; z-index: 2; display: grid; grid-template-columns: 1fr; gap: .16in; margin: .34in auto 0; max-width: 7.7in; }
.cards.two { grid-template-columns: 1fr 1fr; gap: .16in; }
.card { border: 1px solid #dbe4f0; border-radius: 22px; background: rgba(255,255,255,.94); padding: .22in; box-shadow: 0 17px 42px rgba(15,23,42,.08); }
.card b { display: block; font-size: 22px; line-height: 1.12; margin-bottom: 7px; }
.card span { display: block; color: #64748b; font-size: 17px; line-height: 1.32; }
.steps { position: relative; z-index: 2; display: grid; gap: .14in; margin: .28in auto 0; max-width: 7.7in; }
.step { display: grid; grid-template-columns: .52in 1fr; gap: .16in; align-items: start; border-radius: 20px; border: 1px solid #dbe4f0; background: #fff; padding: .18in; box-shadow: 0 15px 38px rgba(15,23,42,.07); }
.step i { width: .44in; height: .44in; border-radius: 50%; display: grid; place-items: center; background: #2563eb; color: #fff; font-style: normal; font-weight: 950; }
.step b { display: block; font-size: 20px; margin-bottom: 5px; }
.step span { display: block; color: #64748b; font-size: 16px; line-height: 1.28; }
.link-box { position: relative; z-index: 2; margin: .36in auto 0; max-width: 7.7in; padding: .24in .26in; border-radius: 26px; background: #fff; border: 1px solid #dbe4f0; box-shadow: 0 20px 58px rgba(15,23,42,.12); }
.link-box b { display: block; font-size: 20px; margin-bottom: .08in; }
.link { display: block; padding: .18in; border-radius: 18px; background: #eef5ff; color: #1d4ed8; font-weight: 900; font-size: 18px; line-height: 1.25; word-break: break-word; }
.note { position: relative; z-index: 2; margin: .22in auto 0; max-width: 7.7in; padding: .18in .2in; border-radius: 20px; background: #fff7e6; border: 1px solid #f6d58b; color: #8a4c0b; font-size: 16px; line-height: 1.32; font-weight: 750; }
.mini { position: absolute; left: .56in; right: .56in; bottom: .64in; z-index: 2; color: #7b8aa0; font-size: 14px; line-height: 1.32; }
.ink .mini { color: #8fa5bf; }
.shot { position: relative; z-index: 2; margin: .34in auto 0; max-width: 7.7in; border-radius: 28px; background: #fff; border: 1px solid #dbe4f0; box-shadow: 0 24px 72px rgba(15,23,42,.12); overflow: hidden; }
.shot img { display: block; width: 100%; height: auto; }
.shot.desktop { height: 4.45in; }
.shot.desktop img { height: 100%; object-fit: cover; object-position: top center; }
.cover-shot { margin-top: .44in; }
.cover-shot.desktop { height: 4.62in; }
.cover-shot.desktop img { height: 100%; object-fit: cover; object-position: top center; }
.phone-stage { position: relative; z-index: 2; display: grid; place-items: center; margin-top: .34in; }
.phone { width: 3.75in; padding: .12in; border-radius: .48in; background: #020617; box-shadow: 0 30px 86px rgba(15,23,42,.28); }
.phone img { display: block; width: 100%; border-radius: .34in; }
.phone-cover { margin-top: .42in; }
.phone-cover .phone { width: 3.45in; }
.phone-page .phone { width: 4.05in; }
.phone-page .phone img { max-height: 9.75in; object-fit: cover; object-position: top center; }
.checklist { position: relative; z-index: 2; display: grid; gap: .14in; margin: .34in auto 0; max-width: 7.7in; }
.task { display: grid; grid-template-columns: .34in 1fr; gap: .14in; align-items: start; padding: .18in; border-radius: 20px; background: #fff; border: 1px solid #dbe4f0; }
.box { width: .26in; height: .26in; border-radius: 8px; border: 2px solid #2563eb; margin-top: 3px; }
.task b { display: block; font-size: 19px; margin-bottom: 5px; }
.task span { display: block; color: #64748b; font-size: 15px; line-height: 1.28; }
`;

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function img(name, alt) {
  return `<img src="${shotsDir}/${esc(name)}" alt="${esc(alt)}" />`;
}

function layout(title, pages) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>${esc(title)}</title><style>${css}</style></head><body>${pages.join("\n")}</body></html>`;
}

function brand(subtitle) {
  return `<div class="brand"><div class="mark">T</div><div><b>Portal del club</b><span>${esc(subtitle)}</span></div></div>`;
}

function page(content, index, ink = false) {
  return `<section class="page ${ink ? "ink" : ""}">${content}<div class="number">${String(index).padStart(2, "0")}</div></section>`;
}

function cover(role, title, lead, image, imageType, index) {
  const visual = imageType === "phone"
    ? `<div class="phone-stage phone-cover"><div class="phone">${img(image, title)}</div></div>`
    : `<div class="shot desktop cover-shot">${img(image, title)}</div>`;

  return page(`${brand(`Tutorial para ${role}`)}
    <h1>${esc(title)}</h1>
    <p class="lead">${esc(lead)}</p>
    <div class="badges"><span class="badge">Link del club</span><span class="badge">Acceso personal</span><span class="badge">Capturas reales</span></div>
    ${visual}
    <div class="mini">Las capturas fueron tomadas de la app real en entorno local. Cada club comparte su propio link y cada usuario entra con su acceso personal.</div>`, index, true);
}

function intro(title, text, steps, index) {
  return page(`${brand("Acceso")}
    <div class="page-stack"><div class="section"><p class="eyebrow">Antes de empezar</p><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
    <div class="link-box"><b>Formato del link del club</b><span class="link">https://tenis-club.netlify.app/slug-del-club/#/login</span></div>
    ${stepList(steps)}
    <div class="note">No compartas usuarios entre personas. Cada socio, profesor o responsable debe tener su propio acceso.</div></div>`, index);
}

function stepList(items) {
  return `<div class="steps">${items.map((item, i) => `<div class="step"><i>${i + 1}</i><div><b>${esc(item[0])}</b><span>${esc(item[1])}</span></div></div>`).join("")}</div>`;
}

function cards(items, two = false) {
  return `<div class="cards ${two ? "two" : ""}">${items.map(item => `<article class="card"><b>${esc(item[0])}</b><span>${esc(item[1])}</span></article>`).join("")}</div>`;
}

function phonePage(kicker, title, text, image, steps, index) {
  return page(`<div class="page-stack"><div class="section"><p class="eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
    <div class="phone-stage phone-page"><div class="phone">${img(image, title)}</div></div>
    ${stepList(steps)}</div>`, index);
}

function desktopPage(kicker, title, text, image, steps, index) {
  return page(`<div class="page-stack"><div class="section"><p class="eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
    <div class="shot desktop">${img(image, title)}</div>
    ${stepList(steps)}</div>`, index);
}

function checklist(title, text, tasks, index) {
  return page(`${brand("Checklist")}
    <div class="page-stack"><div class="section"><p class="eyebrow">Resumen</p><h2>${esc(title)}</h2><p>${esc(text)}</p></div>
    <div class="checklist">${tasks.map(task => `<div class="task"><div class="box"></div><div><b>${esc(task[0])}</b><span>${esc(task[1])}</span></div></div>`).join("")}</div></div>`, index);
}

function buildSocio() {
  return layout("Tutorial socio - Portal del club", [
    cover("socios", "Guia rapida para socios.", "Como entrar desde el link del club, reservar cancha, ver clases, consultar pagos y revisar el perfil.", "socio-panel-mobile.png", "phone", 1),
    intro("Entrar desde el link que comparte el club.", "El club comparte una direccion propia. Desde ese link cada socio entra con su acceso personal.", [["Abrir el link", "Usar el enlace enviado por el club."], ["Ingresar con tu acceso", "Usar el usuario personal asignado por administracion."], ["Revisar el menu", "En mobile vas a ver Mi panel, Reservar, Clases, Mis pagos y Perfil."]], 2),
    phonePage("Mi panel", "Ver tu estado general.", "Mi panel muestra membresia, proxima reserva, proxima clase y pagos pendientes si existen datos cargados.", "socio-panel-mobile.png", [["Revisar membresia", "Confirmar si estas al dia o si falta cargar informacion."], ["Usar accesos rapidos", "Reservar cancha, ver clases o ir a pagos."], ["Leer estados vacios", "Si aparece sin datos, todavia no hay actividad registrada para tu usuario."]], 3),
    phonePage("Reservar", "Consultar disponibilidad.", "La pantalla de reservas muestra agenda, fecha, canchas y turnos disponibles u ocupados.", "socio-reservas-mobile.png", [["Elegir fecha", "Usar el selector de fecha."], ["Buscar horario libre", "Revisar disponibilidad por cancha."], ["Confirmar reserva", "Seguir el flujo que indique el club para finalizar."]], 4),
    phonePage("Clases", "Anotarte o revisar clases.", "Desde Clases ves las actividades disponibles, cupos y estado de inscripcion.", "socio-clases-mobile.png", [["Revisar clase", "Mirar nivel, profesor, cancha, horario y cupos."], ["Anotarse si hay cupo", "Usar la accion disponible en la tarjeta."], ["Cancelar si corresponde", "Si ya estas inscripto, la app puede mostrar la opcion de cancelar."]], 5),
    phonePage("Mis pagos", "Consultar deuda y movimientos.", "La pantalla de pagos muestra membresia, deuda pendiente, vencimientos y pagos registrados.", "socio-pagos-mobile.png", [["Ver pendiente", "Confirmar si hay saldo por pagar."], ["Revisar ultimo pago", "Controlar fecha, metodo y concepto."], ["Avisar diferencias", "Si algo no coincide, enviar captura a administracion."]], 6),
    phonePage("Perfil", "Revisar datos personales.", "Perfil permite consultar datos del usuario y preferencias de visualizacion.", "socio-perfil-mobile.png", [["Actualizar datos", "Mantener telefono y datos de contacto al dia."], ["Cambiar preferencias", "Idioma o tema, si el club lo tiene habilitado."], ["Pedir soporte", "Reportar problemas con captura y descripcion del paso."]], 7),
    checklist("Buenas practicas para socios.", "Usar la app como canal principal ayuda a que el club tenga reservas, clases y pagos ordenados.", [["Reservar desde la app", "Evita pedir turnos por fuera si el horario esta disponible."], ["Cargar invitados correctamente", "Asi el club registra costos y jugadores."], ["Revisar pagos", "Consultar deuda antes de reservar o anotarte a clases."], ["Reportar con captura", "Si algo no funciona, enviar captura y descripcion breve."]], 8)
  ]);
}

function buildProfesor() {
  return layout("Tutorial profesor - Portal del club", [
    cover("profesores", "Guia rapida para profesores.", "Como entrar al portal del club, revisar clases asignadas, alumnos y perfil.", "profesor-panel-desktop.png", "desktop", 1),
    intro("Entrar desde el link del club.", "El profesor usa el mismo portal, pero con permisos enfocados en sus clases.", [["Abrir el link", "Usar la direccion enviada por el club."], ["Ingresar con acceso personal", "Cada profesor debe usar su propio usuario."], ["Validar el menu", "El menu muestra las opciones habilitadas para el rol profesor."]], 2),
    desktopPage("Panel profesor", "Revisar agenda y resumen.", "El panel del profesor muestra clases del dia, alumnos, asistencia y notas segun los datos cargados.", "profesor-panel-desktop.png", [["Mirar clases de hoy", "Confirmar si hay clases asignadas."], ["Revisar alumnos activos", "Controlar cantidad de alumnos relacionados."], ["Leer estados vacios", "Si no hay clases asignadas, la pantalla lo indica."]], 3),
    desktopPage("Clases", "Consultar clases asignadas.", "La pantalla de clases permite revisar actividades, cupos, nivel y horarios disponibles.", "profesor-clases-desktop.png", [["Buscar clase", "Usar buscador o listado."], ["Revisar cupos", "Validar alumnos inscriptos y cupos libres."], ["Coordinar cambios", "Si hay cambios de horario o cancha, avisar a administracion."]], 4),
    desktopPage("Perfil", "Mantener datos del profesor.", "El perfil sirve para revisar informacion personal y preferencias.", "profesor-perfil-desktop.png", [["Revisar datos", "Confirmar nombre, contacto y usuario."], ["Actualizar preferencias", "Tema o idioma si estan disponibles."], ["Reportar errores", "Enviar captura y detalle a administracion."]], 5),
    page(`${brand("Operacion")}
      <div class="section"><p class="eyebrow">Cambios y soporte</p><h2>Que hacer si una clase no coincide.</h2><p>Para que el sistema sea confiable, los cambios de agenda deben quedar registrados por administracion.</p></div>
      ${cards([["Cambio de horario", "Informar clase, fecha, horario actual y horario nuevo."], ["Cambio de cancha", "Confirmar que la cancha nueva este libre."], ["Alumno no aparece", "Pedir revision de inscripcion o pago."], ["Clase sin datos", "Avisar si deberia aparecer una clase asignada."]])}`, 6),
    checklist("Checklist del profesor.", "Usalo antes de cada jornada.", [["Abrir panel", "Mirar clases asignadas y estado general."], ["Revisar alumnos", "Confirmar cupos y alumnos de cada clase."], ["Evitar cambios por fuera", "Los cambios deben quedar registrados en el sistema."], ["Reportar con captura", "Enviar imagen y descripcion si algo no coincide."]], 7)
  ]);
}

function buildAdmin() {
  return layout("Tutorial administrador - Portal del club", [
    cover("administradores", "Guia para administrar el club.", "Como operar panel, reservas, socios, pagos, clases, canchas y configuracion usando pantallas reales.", "admin-panel-desktop.png", "desktop", 1),
    intro("Entrar desde el link del club.", "El administrador centraliza la operacion diaria desde el portal del club.", [["Abrir el link", "Usar la direccion propia del club."], ["Ingresar con acceso admin", "Cada responsable debe usar su propio usuario."], ["Validar el club", "Confirmar que la pantalla corresponda al club correcto."]], 2),
    desktopPage("Panel del club", "Leer el estado general.", "El panel muestra socios activos, pagos vencidos, reservas de hoy, ingresos y alertas segun datos reales.", "admin-panel-desktop.png", [["Revisar indicadores", "Mirar socios, pagos y reservas del dia."], ["Leer ocupacion", "Si no hay datos, el sistema lo muestra vacio."], ["Ir a acciones", "Usar Nueva reserva o Ver agenda cuando corresponda."]], 3),
    desktopPage("Reservas", "Gestionar agenda y turnos.", "La pantalla de reservas permite revisar disponibilidad, fecha, canchas y turnos.", "admin-reservas-desktop.png", [["Elegir fecha", "Usar la fecha solicitada."], ["Seleccionar cancha", "Buscar turno libre."], ["Registrar jugadores", "Confirmar socios e invitados si corresponde."]], 4),
    desktopPage("Socios", "Crear y revisar socios.", "Socios centraliza datos, estado, membresia y actividad de cada persona.", "admin-socios-desktop.png", [["Crear socio", "Cargar nombre, email y datos de contacto."], ["Revisar estado", "Activo, pendiente o bloqueado segun reglas internas."], ["Corregir datos", "Mantener informacion limpia y actualizada."]], 5),
    desktopPage("Pagos", "Registrar cobros por motivo.", "Pagos separa membresia, reservas, invitados de cancha y otros conceptos.", "admin-pagos-desktop.png", [["Buscar socio", "Seleccionar la persona correspondiente."], ["Elegir motivo", "Membresia, reserva, invitados u otro."], ["Registrar monto", "Cargar metodo, fecha y referencia si aplica."]], 6),
    desktopPage("Clases", "Administrar clases y cupos.", "Clases permite controlar profesor, nivel, cancha, horario, cupos y alumnos.", "admin-clases-desktop.png", [["Crear clase", "Definir nombre, nivel, profesor y horario."], ["Revisar cupos", "Evitar sobreinscripciones."], ["Actualizar alumnos", "Mantener inscritos y lista de espera al dia."]], 7),
    desktopPage("Canchas", "Mantener canchas disponibles.", "Canchas configura espacios, estado y datos operativos.", "admin-canchas-desktop.png", [["Crear cancha", "Cargar nombre, superficie y estado."], ["Pausar si corresponde", "Usar mantenimiento o inactiva cuando no este disponible."], ["Revisar reservas", "Evitar que una cancha no disponible reciba turnos."]], 8),
    desktopPage("Configuracion", "Ajustar reglas del club.", "Configuracion define marca, idioma, costo de invitados, limites y reglas de deuda.", "admin-configuracion-desktop.png", [["Revisar reglas", "Confirmar limites de reserva y bloqueo por deuda."], ["Actualizar costos", "Mantener precio de invitados y conceptos correctos."], ["Guardar cambios", "Probar una reserva luego de cambiar reglas importantes."]], 9),
    checklist("Rutina diaria del administrador.", "Una rutina simple evita reservas duplicadas, deuda sin revisar y clases desordenadas.", [["Abrir panel", "Mirar reservas del dia, pagos pendientes y alertas."], ["Controlar agenda", "Revisar cambios o cancelaciones."], ["Registrar pagos", "Cargar cobros apenas se reciben."], ["Actualizar socios", "Mantener estados y contactos correctos."], ["Revisar clases", "Validar cupos, profesores y horarios."]], 10)
  ]);
}

await fs.mkdir(outDir, { recursive: true });
const outputs = [
  ["Tutorial_Socio_Club.html", buildSocio()],
  ["Tutorial_Profesor_Club.html", buildProfesor()],
  ["Tutorial_Administrador_Club.html", buildAdmin()]
];

for (const [file, html] of outputs) {
  await fs.writeFile(path.join(outDir, file), html, "utf8");
}

console.log(JSON.stringify({ outDir, files: outputs.map(([file]) => file) }, null, 2));
