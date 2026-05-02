import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const root = path.resolve("docs", "capacitacion");
const outDir = path.join(root, "previews");
const roles = [
  "Tutorial_Socio_Club",
  "Tutorial_Profesor_Club",
  "Tutorial_Administrador_Club"
];

function sectionMatches(html) {
  return [...html.matchAll(/<section class="page[^>]*>[\s\S]*?<\/section>/g)].map((match) => match[0]);
}

function styleBlock(html) {
  const match = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!match) throw new Error("No style block found");
  return match[1];
}

function runChrome(url, output) {
  execFileSync(chrome, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--run-all-compositor-stages-before-draw",
    "--force-device-scale-factor=1",
    "--window-size=864,1536",
    `--screenshot=${output}`,
    url
  ], { stdio: "pipe" });
}

function previewCss(css) {
  return `${css}
@media screen {
  html,
  body {
    width: 864px;
    height: 1536px;
    overflow: hidden;
    background: #f8fafc;
  }

  .page {
    width: 864px;
    height: 1536px;
  }
}`;
}

async function renderRole(role) {
  const htmlPath = path.join(root, `${role}.html`);
  const html = await fs.readFile(htmlPath, "utf8");
  const css = previewCss(styleBlock(html));
  const pages = sectionMatches(html);
  const roleDir = path.join(outDir, role);
  await fs.mkdir(roleDir, { recursive: true });

  const shots = [];
  for (let index = 0; index < pages.length; index += 1) {
    const pageName = `page-${String(index + 1).padStart(2, "0")}`;
    const baseHref = new URL(`file:///${root.replaceAll("\\", "/")}/`).href;
    const pageHtml = `<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="${baseHref}"><style>${css}</style></head><body>${pages[index]}</body></html>`;
    const pagePath = path.join(roleDir, `${pageName}.html`);
    const shotPath = path.join(roleDir, `${pageName}.png`);
    await fs.writeFile(pagePath, pageHtml, "utf8");
    runChrome(new URL(`file:///${pagePath.replaceAll("\\", "/")}`).href, shotPath);
    shots.push(`${pageName}.png`);
  }

  const contact = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#0f172a;font-family:Arial,sans-serif;color:#e5e7eb}
    .grid{display:grid;grid-template-columns:repeat(3, 1fr);gap:18px;padding:18px}
    figure{margin:0;background:#111827;border:1px solid #334155;border-radius:10px;overflow:hidden}
    img{width:100%;display:block}
    figcaption{padding:8px 10px;font-size:13px;color:#cbd5e1}
  </style></head><body><div class="grid">${shots.map((src, index) => `<figure><img src="${src}"><figcaption>${role} ${index + 1}</figcaption></figure>`).join("")}</div></body></html>`;
  const contactPath = path.join(roleDir, "contact-sheet.html");
  const contactPng = path.join(roleDir, "contact-sheet.png");
  await fs.writeFile(contactPath, contact, "utf8");
  runChrome(new URL(`file:///${contactPath.replaceAll("\\", "/")}`).href, contactPng);
  return { role, pages: pages.length, contactPng };
}

await fs.mkdir(outDir, { recursive: true });
const results = [];
for (const role of roles) {
  results.push(await renderRole(role));
}

console.log(JSON.stringify(results, null, 2));
