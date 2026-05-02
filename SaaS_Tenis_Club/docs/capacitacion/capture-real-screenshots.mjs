import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const appUrl = "http://localhost:5500";
const apiUrl = "http://localhost:64652";
const tenantSlug = "club-demo";
const outDir = path.resolve("docs", "capacitacion", "capturas-reales");
const frontendRoot = path.resolve("frontend", "TennisClubSaaS.Frontend");
const capturePage = path.join(frontendRoot, "capture-session.html");
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const credentials = {
  admin: { email: "admin@clubdemo.com", password: "Admin123!" },
  coach: { email: "coach@clubdemo.com", password: "Coach123!" },
  member: { email: "socio@clubdemo.com", password: "Socio123!" }
};

const captures = [
  { name: "socio-panel-mobile.png", role: "member", route: "#/member", viewport: [390, 844], theme: "light" },
  { name: "socio-reservas-mobile.png", role: "member", route: "#/reservations", viewport: [390, 844], theme: "light" },
  { name: "socio-clases-mobile.png", role: "member", route: "#/classes", viewport: [390, 844], theme: "light" },
  { name: "socio-pagos-mobile.png", role: "member", route: "#/payments", viewport: [390, 844], theme: "light" },
  { name: "socio-perfil-mobile.png", role: "member", route: "#/profile", viewport: [390, 844], theme: "light" },

  { name: "profesor-panel-desktop.png", role: "coach", route: "#/coach", viewport: [1440, 900], theme: "light" },
  { name: "profesor-clases-desktop.png", role: "coach", route: "#/classes", viewport: [1440, 900], theme: "light" },
  { name: "profesor-perfil-desktop.png", role: "coach", route: "#/profile", viewport: [1440, 900], theme: "light" },

  { name: "admin-panel-desktop.png", role: "admin", route: "#/admin", viewport: [1440, 900], theme: "light" },
  { name: "admin-reservas-desktop.png", role: "admin", route: "#/reservations", viewport: [1440, 900], theme: "light" },
  { name: "admin-socios-desktop.png", role: "admin", route: "#/members", viewport: [1440, 900], theme: "light" },
  { name: "admin-pagos-desktop.png", role: "admin", route: "#/payments", viewport: [1440, 900], theme: "light" },
  { name: "admin-clases-desktop.png", role: "admin", route: "#/classes", viewport: [1440, 900], theme: "light" },
  { name: "admin-canchas-desktop.png", role: "admin", route: "#/courts", viewport: [1440, 900], theme: "light" },
  { name: "admin-configuracion-desktop.png", role: "admin", route: "#/settings", viewport: [1440, 900], theme: "light" }
];

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

async function login(role) {
  const payload = await postJson(`${apiUrl}/api/auth/login`, {
    ...credentials[role],
    tenantSlug
  }, { "X-Tenant-Slug": tenantSlug });

  const data = payload.data;
  const userNames = {
    admin: { firstName: "Admin", lastName: "Top Tenis", email: "admin@toptenis.local" },
    coach: { firstName: "Profesor", lastName: "Top Tenis", email: "profe@toptenis.local" },
    member: { firstName: "Socio", lastName: "Top Tenis", email: "socio@toptenis.local" }
  };

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: { ...data.user, ...userNames[role] },
    tenant: {
      ...(data.tenant || {}),
      name: "Top Tenis",
      slug: tenantSlug,
      primaryColor: "#2563eb",
      secondaryColor: "#10b981"
    }
  };
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function writeCapturePage() {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Capture session</title></head>
<body>
<script>
function decodePayload(value) {
  value = value.replace(/-/g, "+").replace(/_/g, "/");
  while (value.length % 4) value += "=";
  var binary = atob(value);
  var encoded = "";
  for (var i = 0; i < binary.length; i += 1) {
    encoded += "%" + binary.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return JSON.parse(decodeURIComponent(encoded));
}
var payload = decodePayload(location.hash.slice(1));
localStorage.clear();
sessionStorage.clear();
if (payload.session) {
  localStorage.setItem("accessToken", payload.session.accessToken);
  localStorage.setItem("refreshToken", payload.session.refreshToken);
  localStorage.setItem("tenantSlug", payload.tenantSlug);
  localStorage.setItem("tenant", JSON.stringify(payload.session.tenant));
  localStorage.setItem("user", JSON.stringify(payload.session.user));
  localStorage.setItem("uiTheme", payload.theme || "light");
  localStorage.setItem("uiLanguage", "es");
  sessionStorage.setItem("reservationDate", "2026-05-14");
}
location.replace(payload.target);
</script>
</body></html>`;
  await fs.writeFile(capturePage, html, "utf8");
}

function runChrome({ url, output, viewport, profileDir }) {
  const args = [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--run-all-compositor-stages-before-draw",
    "--force-device-scale-factor=1",
    `--user-data-dir=${profileDir}`,
    `--window-size=${viewport[0]},${viewport[1]}`,
    "--virtual-time-budget=8000",
    `--screenshot=${output}`,
    url
  ];
  execFileSync(chrome, args, { stdio: "pipe" });
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await writeCapturePage();

  const sessions = {
    admin: await login("admin"),
    coach: await login("coach"),
    member: await login("member")
  };

  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), "tenis-real-captures-"));
  const written = [];

  for (const capture of captures) {
    const payload = {
      tenantSlug,
      session: sessions[capture.role],
      theme: capture.theme,
      target: `${appUrl}/${capture.route}`
    };
    const url = `${appUrl}/capture-session.html#${encodePayload(payload)}`;
    const output = path.join(outDir, capture.name);
    runChrome({ url, output, viewport: capture.viewport, profileDir });
    written.push(path.relative(process.cwd(), output));
  }

  console.log(JSON.stringify({ outDir, count: written.length, written }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
