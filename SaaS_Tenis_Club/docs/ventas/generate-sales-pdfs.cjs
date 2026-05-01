const fs = require("fs");
const path = require("path");
const { chromium } = require("C:\\Users\\mauro\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules\\playwright");

const projectRoot = "C:\\software\\SaaS_Tenis_Club\\SaaS_Tenis_Club";
const frontendUrl = "http://localhost:5510";
const outDir = path.join(projectRoot, "docs", "ventas");
const shotsDir = path.join(outDir, "screenshots");

const tenant = {
  id: "club-demo-id",
  name: "Club Demo Tenis",
  slug: "club-demo",
  contactEmail: "admin@clubdemo.com",
  contactPhone: "099 123 456",
  primaryColor: "#2563eb",
  secondaryColor: "#10b981",
  address: "Montevideo, Uruguay",
  isActive: true
};

const users = {
  superadmin: {
    id: "sa-1",
    firstName: "Super",
    lastName: "Admin",
    email: "superadmin@saastennis.com",
    role: "SuperAdmin",
    isActive: true,
    clubTenantId: null
  },
  admin: {
    id: "ad-1",
    firstName: "Admin",
    lastName: "Demo",
    email: "admin@clubdemo.com",
    role: "ClubAdmin",
    isActive: true,
    clubTenantId: "club-demo-id"
  },
  coach: {
    id: "co-1",
    firstName: "Carla",
    lastName: "Profesora",
    email: "coach@clubdemo.com",
    role: "Coach",
    isActive: true,
    clubTenantId: "club-demo-id"
  },
  member: {
    id: "me-1",
    firstName: "Sofia",
    lastName: "Socio",
    email: "socio@clubdemo.com",
    role: "Member",
    isActive: true,
    clubTenantId: "club-demo-id"
  }
};

const tenants = [
  {
    ...tenant,
    planType: 2,
    billingStatus: 2,
    monthlyPrice: 119,
    billingCurrency: "USD",
    maxCourts: 10,
    maxMembers: 500,
    maxCoaches: 15,
    subscriptionStartDate: "2026-05-01",
    trialEndsAt: "2026-05-15"
  },
  {
    id: "platform-id",
    name: "SaaS Platform",
    slug: "platform",
    contactEmail: "superadmin@saastennis.com",
    primaryColor: "#2563eb",
    secondaryColor: "#10b981",
    address: null,
    isActive: true,
    planType: 4,
    billingStatus: 2,
    monthlyPrice: 0,
    billingCurrency: "USD",
    maxCourts: null,
    maxMembers: null,
    maxCoaches: null
  }
];

const members = [
  {
    id: "m1",
    userId: "u1",
    fullName: "Sofia Socio",
    email: "socio@clubdemo.com",
    phone: "099 100 200",
    memberNumber: "M-0001",
    documentNumber: "5.111.222-3",
    membershipStatus: "Active",
    joinedAt: "2026-01-05",
    noShowCount: 0,
    isActive: true,
    notes: "Socia activa, participa en clases de adultos."
  },
  {
    id: "m2",
    userId: "u2",
    fullName: "Mateo Perez",
    email: "mateo@clubdemo.com",
    phone: "098 333 444",
    memberNumber: "M-0002",
    documentNumber: "4.222.333-4",
    membershipStatus: "Active",
    joinedAt: "2026-02-12",
    noShowCount: 1,
    isActive: true,
    notes: "Juega dobles los fines de semana."
  },
  {
    id: "m3",
    userId: "u3",
    fullName: "Lucia Rodriguez",
    email: "lucia@clubdemo.com",
    phone: "097 555 666",
    memberNumber: "M-0003",
    documentNumber: "3.888.777-1",
    membershipStatus: "Pending",
    joinedAt: "2026-03-01",
    noShowCount: 0,
    isActive: true,
    notes: "Pendiente de pago del mes."
  }
];

const courts = [
  { id: "c1", name: "Cancha 1", surfaceType: 1, indoorOutdoor: 2, hasLights: true, isActive: true, openingTime: "08:00", closingTime: "22:00", slotDurationMinutes: 60 },
  { id: "c2", name: "Cancha 2", surfaceType: 1, indoorOutdoor: 2, hasLights: true, isActive: true, openingTime: "08:00", closingTime: "22:00", slotDurationMinutes: 60 },
  { id: "c3", name: "Cancha 3", surfaceType: 2, indoorOutdoor: 2, hasLights: true, isActive: true, openingTime: "08:00", closingTime: "22:00", slotDurationMinutes: 60 },
  { id: "c4", name: "Cancha 4", surfaceType: 2, indoorOutdoor: 2, hasLights: false, isActive: true, openingTime: "08:00", closingTime: "22:00", slotDurationMinutes: 60 }
];

const classes = [
  { id: "cl1", name: "Adultos Intermedio", coachName: "Carla Profesora", courtName: "Cancha 1", dayOfWeek: 2, startTime: "19:00", endTime: "20:00", maxStudents: 8, activeStudents: 6, waitingList: 0, level: 2, isActive: true },
  { id: "cl2", name: "Kids Inicial", coachName: "Carla Profesora", courtName: "Cancha 2", dayOfWeek: 6, startTime: "10:00", endTime: "11:00", maxStudents: 10, activeStudents: 8, waitingList: 1, level: 4, isActive: true },
  { id: "cl3", name: "Competicion Avanzada", coachName: "Federico Coach", courtName: "Cancha 3", dayOfWeek: 4, startTime: "18:00", endTime: "19:30", maxStudents: 6, activeStudents: 6, waitingList: 2, level: 6, isActive: true }
];

const coaches = [
  { id: "coach1", userId: "coach-user-1", name: "Carla Profesora", email: "coach@clubdemo.com", phone: "098 111 222", specialty: "Competicion y adultos", isActive: true, userIsActive: true },
  { id: "coach2", userId: "coach-user-2", name: "Federico Coach", email: "federico@clubdemo.com", phone: "098 222 333", specialty: "Kids y formacion inicial", isActive: true, userIsActive: true }
];

const payments = [
  { id: "p1", memberProfileId: "m1", memberName: "Sofia Socio", purpose: "Membership", amount: 60, paymentDate: "2026-05-01T10:00:00", paymentMethod: "Cash", status: "Paid", reference: "Mayo 2026" },
  { id: "p2", memberName: "Reserva invitados", reservationLabel: "Cancha 1 - dobles", purpose: "CourtGuestFee", amount: 24, paymentDate: "2026-05-01T18:00:00", paymentMethod: "MercadoPago", status: "Paid", reference: "Invitados no socios" },
  { id: "p3", memberProfileId: "m2", memberName: "Mateo Perez", purpose: "Membership", amount: 60, paymentDate: "2026-04-08T10:00:00", paymentMethod: "BankTransfer", status: "Paid", reference: "Abril 2026" }
];

function availableSlots() {
  const times = ["08:00", "09:00", "10:00", "11:00", "18:00", "19:00", "20:00"];
  return courts.flatMap((court, courtIndex) => times.map((time, index) => {
    const busy = (courtIndex === 0 && ["09:00", "18:00"].includes(time)) || (courtIndex === 2 && time === "19:00");
    return {
      courtId: court.id,
      courtName: court.name,
      start: `2026-05-01T${time}:00`,
      end: `2026-05-01T${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00:00`,
      isAvailable: !busy,
      status: busy ? "Confirmed" : "Available",
      blockReason: busy ? (index % 2 ? "Reserva confirmada" : "Clase") : null
    };
  }));
}

function apiData(pathname) {
  if (pathname === "/api/auth/login") {
    return { accessToken: "demo-commercial-token", refreshToken: "refresh-token", user: users.admin, tenant };
  }
  if (pathname === "/api/auth/me") return users.admin;
  if (pathname === "/api/dashboard/admin") {
    return {
      cards: [
        { label: "Socios activos", value: "3", trend: "en el club", tone: "success" },
        { label: "Pagos vencidos", value: "0", trend: "al dia", tone: "success" },
        { label: "Reservas hoy", value: "3", trend: "agenda", tone: "primary" },
        { label: "Ingresos del mes", value: "USD 390", trend: "cobrados", tone: "success" }
      ],
      upcomingReservations: [
        { courtName: "Cancha 1", memberName: "Sofia Socio", startDateTime: "2026-05-01T09:00:00", status: "Confirmed" },
        { courtName: "Cancha 2", memberName: "Administracion", startDateTime: "2026-05-01T18:00:00", status: "Confirmed" },
        { courtName: "Cancha 3", memberName: "Mateo Perez", startDateTime: "2026-05-02T19:00:00", status: "Confirmed" }
      ],
      overduePayments: []
    };
  }
  if (pathname === "/api/dashboard/superadmin") {
    return {
      cards: [
        { label: "Clubes", value: "2", trend: "total", tone: "primary" },
        { label: "Clubes activos", value: "2", trend: "operativos", tone: "success" },
        { label: "Usuarios", value: "9", trend: "plataforma", tone: "primary" },
        { label: "MRR estimado", value: "USD 119", trend: "suscripciones", tone: "success" }
      ],
      recentTenants: tenants,
      topClubs: [{ name: "Club Demo Tenis", reservations: 86, revenue: 390 }]
    };
  }
  if (pathname === "/api/tenants") return tenants;
  if (pathname === "/api/courts") return courts;
  if (pathname === "/api/members") return members;
  if (pathname === "/api/members/directory") {
    return members.map(m => ({
      memberProfileId: m.id,
      fullName: m.fullName,
      memberNumber: m.memberNumber,
      membershipStatus: m.membershipStatus
    }));
  }
  if (/^\/api\/members\/[^/]+$/.test(pathname)) return members[0];
  if (/^\/api\/members\/[^/]+\/payments$/.test(pathname)) return payments.filter(p => p.memberProfileId === "m1");
  if (/^\/api\/members\/[^/]+\/reservations$/.test(pathname)) return [
    { courtName: "Cancha 1", startDateTime: "2026-05-01T09:00:00", status: "Confirmed" }
  ];
  if (/^\/api\/members\/[^/]+\/classes$/.test(pathname)) return [
    { className: "Adultos Intermedio", status: "Active", enrolledAt: "2026-05-01T10:00:00" }
  ];
  if (pathname === "/api/coaches") return coaches;
  if (pathname === "/api/classes") return classes;
  if (pathname === "/api/classes/my-enrollments") return [{ trainingClassId: "cl1", status: "Active" }];
  if (/^\/api\/classes\/[^/]+\/students$/.test(pathname)) {
    return [
      { memberProfileId: "m1", fullName: "Sofia Socio", email: "socio@clubdemo.com", status: "Active", enrolledAt: "2026-05-01T10:00:00" },
      { memberProfileId: "m2", fullName: "Mateo Perez", email: "mateo@clubdemo.com", status: "Active", enrolledAt: "2026-05-01T10:00:00" }
    ];
  }
  if (/^\/api\/classes\/[^/]+\/eligible-members$/.test(pathname)) return members;
  if (pathname === "/api/classsessions" || pathname === "/api/class-sessions") {
    return [
      { id: "session1", trainingClassId: "cl1", sessionDate: "2026-05-01", startDateTime: "2026-05-01T19:00:00", endDateTime: "2026-05-01T20:00:00", status: "Scheduled", notes: "" }
    ];
  }
  if (pathname === "/api/payments") return payments;
  if (pathname === "/api/payments/overdue") return [];
  if (pathname === "/api/reservations/available-slots") return availableSlots();
  if (pathname === "/api/reservations/rules") {
    return { guestPlayerFee: 12, maxReservationsPerWeek: 1, maxClassEnrollmentsPerWeek: 2 };
  }
  if (pathname === "/api/reservations") {
    return [
      { id: "r1", courtName: "Cancha 1", memberName: "Sofia Socio", startDateTime: "2026-05-01T09:00:00", status: "Confirmed", guestPlayerCount: 2, guestFeeTotal: 24, guestFeePaid: false },
      { id: "r2", courtName: "Cancha 2", memberName: "Administracion", startDateTime: "2026-05-01T18:00:00", status: "Confirmed", guestPlayerCount: 0, guestFeeTotal: 0, guestFeePaid: true }
    ];
  }
  if (pathname === "/api/settings") {
    return [
      { key: "ReservationReleaseHour", value: "09:00", valueType: "Time" },
      { key: "MaxReservationsPerWeek", value: "1", valueType: "Number" },
      { key: "MaxClassEnrollmentsPerWeek", value: "2", valueType: "Number" },
      { key: "GuestPlayerFee", value: "12", valueType: "Money" },
      { key: "PaymentDueStartDay", value: "1", valueType: "Number" },
      { key: "PaymentDueEndDay", value: "10", valueType: "Number" },
      { key: "AllowWaitingList", value: "true", valueType: "Boolean" },
      { key: "ClubTimezone", value: "America/Montevideo", valueType: "Text" },
      { key: "Language", value: "es", valueType: "Text" }
    ];
  }
  if (pathname === "/api/notifications") return [];
  return [];
}

async function attachRoutes(page, persona) {
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    let data = apiData(url.pathname);
    if (url.pathname === "/api/auth/me") data = persona.user;
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, message: "ok", data })
    });
  });
}

async function capture(browser, name, hash, persona, options = {}) {
  const viewport = options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
  const context = await browser.newContext({
    viewport,
    isMobile: Boolean(options.mobile),
    deviceScaleFactor: options.mobile ? 2 : 1
  });
  await context.addInitScript(({ user, tenant, tenantSlug, theme }) => {
    localStorage.setItem("accessToken", "demo-commercial-token");
    localStorage.setItem("refreshToken", "demo-refresh-token");
    localStorage.setItem("tenantSlug", tenantSlug);
    localStorage.setItem("tenant", JSON.stringify(tenant));
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("uiTheme", theme);
    localStorage.setItem("uiLanguage", "es");
  }, {
    user: persona.user,
    tenant: persona.tenant || tenant,
    tenantSlug: persona.tenantSlug || "club-demo",
    theme: options.theme || "light"
  });
  const page = await context.newPage();
  await attachRoutes(page, persona);
  await page.goto(`${frontendUrl}/${hash}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(options.wait || 1100);
  const file = path.join(shotsDir, `${name}.jpg`);
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: false });
  await context.close();
  return file;
}

async function captureLogin(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await attachRoutes(page, { user: users.admin });
  await page.goto(`${frontendUrl}/#/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const file = path.join(shotsDir, "login-light.jpg");
  await page.screenshot({ path: file, type: "jpeg", quality: 84, fullPage: false });
  await context.close();
  return file;
}

function imageData(file) {
  const encoded = fs.readFileSync(file).toString("base64");
  return `data:image/jpeg;base64,${encoded}`;
}

function shotImg(shots, key, label = "") {
  return `<figure class="shot"><img src="${imageData(shots[key])}" alt="${label || key}">${label ? `<figcaption>${label}</figcaption>` : ""}</figure>`;
}

function smallShot(shots, key, label) {
  return `<figure class="mini-shot"><img src="${imageData(shots[key])}" alt="${label}"><figcaption>${label}</figcaption></figure>`;
}

function baseCss() {
  return `
  @page { size: 1280px 720px; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, Arial, sans-serif; color: #0f172a; background: #eef3fb; }
  .page { width: 1280px; height: 720px; padding: 46px 56px; page-break-after: always; position: relative; overflow: hidden; background: linear-gradient(135deg, #f8fbff 0%, #eef5ff 52%, #f7fffb 100%); }
  .page.dark { color: #f8fafc; background: radial-gradient(circle at 10% 10%, rgba(37, 99, 235, .22), transparent 30%), linear-gradient(135deg, #07111f 0%, #0f172a 70%, #111827 100%); }
  .cover { display: grid; grid-template-columns: 1fr 1.05fr; gap: 36px; align-items: center; }
  .eyebrow { color: #2563eb; text-transform: uppercase; font-size: 15px; font-weight: 900; letter-spacing: .12em; margin-bottom: 14px; }
  .dark .eyebrow { color: #7dd3fc; }
  h1 { font-size: 58px; line-height: .96; margin: 0 0 20px; letter-spacing: -.04em; }
  h2 { font-size: 40px; line-height: 1; margin: 0 0 14px; letter-spacing: -.035em; }
  h3 { font-size: 24px; margin: 0 0 10px; letter-spacing: -.02em; }
  p { font-size: 20px; line-height: 1.45; color: #475569; margin: 0 0 16px; }
  .dark p { color: #cbd5e1; }
  .lead { font-size: 24px; line-height: 1.38; max-width: 760px; color: #334155; }
  .dark .lead { color: #dbeafe; }
  .brand { display: inline-flex; align-items: center; gap: 12px; font-weight: 900; font-size: 24px; margin-bottom: 34px; }
  .mark { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #2563eb, #10b981); color: white; display: grid; place-items: center; font-weight: 900; }
  .pill { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(37,99,235,.18); background: rgba(37,99,235,.09); color: #1d4ed8; padding: 8px 12px; border-radius: 999px; font-weight: 800; font-size: 14px; }
  .dark .pill { color: #bfdbfe; background: rgba(96,165,250,.16); border-color: rgba(147,197,253,.22); }
  .grid { display: grid; gap: 20px; }
  .cols-2 { grid-template-columns: 1fr 1fr; }
  .cols-3 { grid-template-columns: repeat(3, 1fr); }
  .cols-4 { grid-template-columns: repeat(4, 1fr); }
  .card { background: rgba(255,255,255,.92); border: 1px solid #dbe5f3; border-radius: 24px; padding: 24px; box-shadow: 0 20px 54px rgba(15,23,42,.08); }
  .dark .card { background: rgba(15,23,42,.72); border-color: rgba(148,163,184,.22); box-shadow: 0 20px 54px rgba(0,0,0,.22); }
  .stat { font-size: 42px; font-weight: 950; letter-spacing: -.04em; margin: 8px 0; }
  .list { display: grid; gap: 14px; margin-top: 20px; }
  .li { display: flex; gap: 12px; align-items: flex-start; font-size: 18px; line-height: 1.35; color: #334155; }
  .dark .li { color: #e2e8f0; }
  .dot { width: 10px; height: 10px; margin-top: 7px; border-radius: 50%; flex: 0 0 auto; background: linear-gradient(135deg, #2563eb, #10b981); }
  .shot, .mini-shot { margin: 0; background: white; border: 1px solid #dbe5f3; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 70px rgba(15,23,42,.14); }
  .dark .shot, .dark .mini-shot { background: #0f172a; border-color: rgba(148,163,184,.25); }
  .shot img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .shot figcaption, .mini-shot figcaption { font-size: 14px; font-weight: 900; padding: 10px 14px; color: #475569; background: #f8fafc; }
  .dark figcaption { color: #cbd5e1; background: #111827; }
  .hero-shot { height: 470px; }
  .screen-row { display: grid; grid-template-columns: 1.2fr .8fr; gap: 20px; align-items: stretch; }
  .screen-row .shot { height: 460px; }
  .mini-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .mini-shot { height: 192px; }
  .mini-shot img { width: 100%; height: 154px; object-fit: cover; display: block; }
  .area-map { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 18px; }
  .area-map .mini-shot { height: 168px; border-radius: 18px; }
  .area-map .mini-shot img { height: 128px; }
  .phone-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; align-items: start; }
  .phone { height: 500px; border-radius: 34px; overflow: hidden; border: 8px solid #111827; box-shadow: 0 28px 60px rgba(15,23,42,.22); background: #111827; }
  .phone img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .plan { border-top: 5px solid #2563eb; }
  .price { font-size: 42px; font-weight: 950; letter-spacing: -.04em; }
  .muted { color: #64748b; }
  .dark .muted { color: #94a3b8; }
  .footer { position: absolute; left: 56px; right: 56px; bottom: 24px; display: flex; justify-content: space-between; color: #64748b; font-size: 13px; font-weight: 800; }
  .dark .footer { color: #94a3b8; }
  table { width: 100%; border-collapse: collapse; font-size: 17px; overflow: hidden; border-radius: 18px; }
  th { text-align: left; background: #eef4ff; color: #475569; text-transform: uppercase; font-size: 13px; letter-spacing: .06em; }
  td, th { padding: 15px 16px; border-bottom: 1px solid #e2e8f0; }
  .dark th { background: rgba(96,165,250,.16); color: #bfdbfe; }
  .dark td, .dark th { border-color: rgba(148,163,184,.22); }
  .tag { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #dcfce7; color: #15803d; font-size: 13px; font-weight: 900; }
  .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; }
  .quote { font-size: 28px; line-height: 1.28; font-weight: 850; color: #0f172a; }
  .dark .quote { color: #f8fafc; }
  `;
}

function footer(label) {
  return `<div class="footer"><span>SaaS Tenis Club</span><span>${label}</span></div>`;
}

function page(html, theme = "light", label = "") {
  return `<section class="page ${theme === "dark" ? "dark" : ""}">${html}${footer(label)}</section>`;
}

function investorDeck(shots) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}</style></head><body>
  ${page(`
    <div class="cover">
      <div>
        <div class="brand"><span class="mark">T</span><span>SaaS Tenis Club</span></div>
        <div class="eyebrow">Producto SaaS multiclub</div>
        <h1>La plataforma para operar y escalar clubes de tenis.</h1>
        <p class="lead">Reservas, clases, socios, profesores, pagos, reglas configurables y analitica en una sola experiencia premium, lista para venderse por suscripcion.</p>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Multitenant: cada club opera aislado con su identidad, reglas y usuarios.</span></div>
          <div class="li"><span class="dot"></span><span>Mobile first para socios y profesores; escritorio potente para administradores.</span></div>
          <div class="li"><span class="dot"></span><span>Modelo comercial SaaS con planes mensuales, onboarding y soporte.</span></div>
        </div>
      </div>
      ${shotImg(shots, "admin-dashboard-light", "Panel operativo del club")}
    </div>`, "light", "Resumen ejecutivo")}

  ${page(`
    <div class="eyebrow">Oportunidad</div>
    <h2>Un mercado con operativa diaria y dolor real.</h2>
    <div class="grid cols-3" style="margin-top:28px">
      <div class="card"><h3>Reservas dispersas</h3><p>Muchos clubes siguen gestionando turnos por WhatsApp, llamadas y planillas, sin control fino de cupos ni reglas.</p></div>
      <div class="card"><h3>Pagos manuales</h3><p>Membresias, invitados y reservas quedan mezclados, dificultando seguimiento, cobros y deuda.</p></div>
      <div class="card"><h3>Experiencia desigual</h3><p>Socios, profesores y administradores necesitan permisos distintos y una interfaz simple desde el celular.</p></div>
    </div>
    <div class="kpi-strip">
      <div class="card"><div class="stat">24/7</div><p>Reservas autoservicio.</p></div>
      <div class="card"><div class="stat">4</div><p>Roles claros: SaaS, admin, profe y socio.</p></div>
      <div class="card"><div class="stat">100%</div><p>Configuracion por club.</p></div>
      <div class="card"><div class="stat">USD</div><p>Suscripcion recurrente.</p></div>
    </div>`, "light", "Oportunidad")}

  ${page(`
    <div class="eyebrow">Vision de producto</div>
    <h2>Una sola plataforma, multiples clubes, datos aislados.</h2>
    <div class="screen-row" style="margin-top:24px">
      ${shotImg(shots, "superadmin-light", "Panel SaaS y control global")}
      <div class="card">
        <h3>Arquitectura SaaS</h3>
        <div class="list">
          <div class="li"><span class="dot"></span><span>SuperAdmin para crear, activar, pausar y monitorear clubes.</span></div>
          <div class="li"><span class="dot"></span><span>Tenant por club con colores, reglas, planes y administradores propios.</span></div>
          <div class="li"><span class="dot"></span><span>Roles y permisos pensados para evitar cruces de datos.</span></div>
          <div class="li"><span class="dot"></span><span>Backend .NET 8, SQL Server, JWT, EF Core y API preparada para produccion.</span></div>
        </div>
      </div>
    </div>`, "dark", "Multitenancy")}

  ${page(`
    <div class="eyebrow">Areas del sistema</div>
    <h2>Modulo completo para operar un club de tenis.</h2>
    <div class="mini-grid" style="margin-top:22px">
      ${smallShot(shots, "reservations-light", "Reservas")}
      ${smallShot(shots, "classes-light", "Clases y cupos")}
      ${smallShot(shots, "members-light", "Socios")}
      ${smallShot(shots, "payments-light", "Pagos")}
      ${smallShot(shots, "courts-light", "Canchas")}
      ${smallShot(shots, "settings-dark", "Configuracion")}
    </div>`, "light", "Cobertura funcional")}

  ${page(`
    <div class="eyebrow">Mapa completo</div>
    <h2>Todas las areas listas para demo y venta.</h2>
    <div class="area-map">
      ${smallShot(shots, "superadmin-light", "SaaS")}
      ${smallShot(shots, "tenants-light", "Clubes")}
      ${smallShot(shots, "admin-dashboard-light", "Panel club")}
      ${smallShot(shots, "reservations-light", "Reservas")}
      ${smallShot(shots, "classes-light", "Clases")}
      ${smallShot(shots, "coaches-light", "Profesores")}
      ${smallShot(shots, "members-light", "Socios")}
      ${smallShot(shots, "payments-light", "Pagos")}
      ${smallShot(shots, "courts-light", "Canchas")}
      ${smallShot(shots, "settings-dark", "Settings")}
    </div>`, "light", "Mapa del producto")}

  ${page(`
    <div class="eyebrow">Experiencia responsive</div>
    <h2>Desktop para gestion, mobile para uso diario.</h2>
    <div class="phone-strip" style="margin-top:24px">
      <div class="phone"><img src="${imageData(shots["member-mobile-light"])}"></div>
      <div class="phone"><img src="${imageData(shots["reservations-mobile-dark"])}"></div>
      <div class="phone"><img src="${imageData(shots["classes-mobile-light"])}"></div>
      <div class="phone"><img src="${imageData(shots["payments-mobile-dark"])}"></div>
    </div>`, "light", "Mobile + light/dark")}

  ${page(`
    <div class="eyebrow">Roles y permisos</div>
    <h2>Cada usuario ve solo lo que corresponde.</h2>
    <div class="grid cols-4" style="margin-top:30px">
      <div class="card"><h3>SuperAdmin</h3><p>Gestiona tenants, planes, estado comercial, administradores y metricas SaaS.</p></div>
      <div class="card"><h3>ClubAdmin</h3><p>Administra su club: canchas, reservas, socios, profesores, pagos, reglas y dashboards.</p></div>
      <div class="card"><h3>Profesor</h3><p>Ve sus clases, alumnos, cupos y asistencia. Puede reservar cupos a socios.</p></div>
      <div class="card"><h3>Socio</h3><p>Reserva cancha, se anota a clases, consulta pagos, membresia y perfil.</p></div>
    </div>
    <div class="grid cols-2" style="margin-top:20px">
      ${smallShot(shots, "coach-dashboard-light", "Panel profesor")}
      ${smallShot(shots, "profile-light", "Perfil y seguridad")}
    </div>`, "light", "Gobierno de acceso")}

  ${page(`
    <div class="eyebrow">Monetizacion SaaS</div>
    <h2>Planes simples para vender y escalar.</h2>
    <div class="grid cols-3" style="margin-top:28px">
      <div class="card plan"><h3>Starter</h3><div class="price">USD 79</div><p>Hasta 3 canchas, 150 socios y 3 profesores. Ideal para clubes chicos.</p></div>
      <div class="card plan"><h3>Pro</h3><div class="price">USD 119</div><p>Hasta 8 canchas, 500 socios, 10 profesores, reportes y soporte estandar.</p></div>
      <div class="card plan"><h3>Premium</h3><div class="price">USD 199</div><p>Mayor escala, soporte prioritario, configuracion avanzada y acompanamiento.</p></div>
    </div>
    <p class="lead" style="margin-top:28px">Setup inicial sugerido: USD 250 a USD 600 segun migracion de datos, carga inicial y capacitacion.</p>`, "dark", "Modelo comercial")}

  ${page(`
    <div class="eyebrow">Roadmap comercial</div>
    <h2>De MVP vendible a plataforma regional.</h2>
    <div class="grid cols-2" style="margin-top:28px">
      <div class="card">
        <h3>Validacion inmediata</h3>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Demo con clubes de Uruguay.</span></div>
          <div class="li"><span class="dot"></span><span>Piloto pago de 30 dias con carga inicial asistida.</span></div>
          <div class="li"><span class="dot"></span><span>Medir reservas, uso mobile, conversion y churn.</span></div>
        </div>
      </div>
      <div class="card">
        <h3>Escalabilidad</h3>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Integracion de pagos online.</span></div>
          <div class="li"><span class="dot"></span><span>Notificaciones WhatsApp/email.</span></div>
          <div class="li"><span class="dot"></span><span>Reportes exportables y analitica por tenant.</span></div>
        </div>
      </div>
    </div>
    <p class="quote" style="margin-top:34px">El producto ya conversa en el idioma del club: canchas, socios, profesores, invitados, cupos, pagos y reglas.</p>`, "light", "Proximos pasos")}

  ${page(`
    <div class="cover">
      <div>
        <div class="brand"><span class="mark">T</span><span>SaaS Tenis Club</span></div>
        <h1>Listo para demo comercial.</h1>
        <p class="lead">La siguiente etapa es empaquetar onboarding, soporte, precios y pilotos con clubes reales.</p>
        <div class="list">
          <div class="li"><span class="dot"></span><span>URL demo local: localhost:5510.</span></div>
          <div class="li"><span class="dot"></span><span>Usuarios demo: SuperAdmin, ClubAdmin, Profesor y Socio.</span></div>
          <div class="li"><span class="dot"></span><span>Base lista para deploy frontend estatico + API .NET.</span></div>
        </div>
      </div>
      ${shotImg(shots, "tenants-light", "Alta de clubes y planes")}
    </div>`, "dark", "Cierre")}
  </body></html>`;
}

function clubSalesDeck(shots) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${baseCss()}</style></head><body>
  ${page(`
    <div class="cover">
      <div>
        <div class="brand"><span class="mark">T</span><span>SaaS Tenis Club</span></div>
        <div class="eyebrow">Para clubes de tenis</div>
        <h1>Moderniza reservas, clases y cobros de tu club.</h1>
        <p class="lead">Una plataforma simple para socios, potente para administradores y practica para profesores.</p>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Reservas online con reglas y limites configurables.</span></div>
          <div class="li"><span class="dot"></span><span>Clases con cupos, lista de espera y asistencia.</span></div>
          <div class="li"><span class="dot"></span><span>Pagos separados por membresia, invitados y otros conceptos.</span></div>
        </div>
      </div>
      ${shotImg(shots, "admin-dashboard-light", "Vista de administracion")}
    </div>`, "light", "Propuesta comercial")}

  ${page(`
    <div class="eyebrow">Problema actual</div>
    <h2>Cuando el club crece, WhatsApp y planillas se quedan cortos.</h2>
    <div class="grid cols-3" style="margin-top:28px">
      <div class="card"><h3>Turnos dificiles</h3><p>Conflictos por horarios, reservas duplicadas, bloqueos manuales y poca visibilidad.</p></div>
      <div class="card"><h3>Cupos sin control</h3><p>Clases llenas, listas de espera informales y asistencia poco registrada.</p></div>
      <div class="card"><h3>Cobros mezclados</h3><p>Membresias, invitados y reservas necesitan conceptos claros y seguimiento.</p></div>
    </div>
    <p class="quote" style="margin-top:36px">SaaS Tenis Club ordena la operativa diaria sin obligar al club a cambiar su forma de trabajar.</p>`, "light", "Dolor del club")}

  ${page(`
    <div class="eyebrow">Administracion</div>
    <h2>Control operativo desde un panel profesional.</h2>
    <div class="screen-row" style="margin-top:24px">
      ${shotImg(shots, "admin-dashboard-dark", "Dashboard en modo oscuro")}
      <div class="card">
        <h3>El administrador ve</h3>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Socios activos, pagos, reservas del dia e ingresos.</span></div>
          <div class="li"><span class="dot"></span><span>Ocupacion de canchas y proximas reservas.</span></div>
          <div class="li"><span class="dot"></span><span>Alertas reales sobre pagos, listas de espera y bloqueos.</span></div>
          <div class="li"><span class="dot"></span><span>Accesos rapidos para operar sin perder tiempo.</span></div>
        </div>
      </div>
    </div>`, "dark", "Panel del club")}

  ${page(`
    <div class="eyebrow">Reservas de cancha</div>
    <h2>Agenda visual con singles, dobles e invitados.</h2>
    <div class="screen-row" style="margin-top:24px">
      ${shotImg(shots, "reservations-light", "Reservas y disponibilidad")}
      <div class="card">
        <h3>Reglas incluidas</h3>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Limite semanal configurable por socio.</span></div>
          <div class="li"><span class="dot"></span><span>Reserva singles o dobles, con socios o invitados no socios.</span></div>
          <div class="li"><span class="dot"></span><span>Costo por invitado configurable desde el admin.</span></div>
          <div class="li"><span class="dot"></span><span>Bloqueos por mantenimiento, torneo, clase o uso interno.</span></div>
        </div>
      </div>
    </div>`, "light", "Reservas")}

  ${page(`
    <div class="eyebrow">Clases y profesores</div>
    <h2>Cupos, lista de espera y asistencia sin friccion.</h2>
    <div class="grid cols-2" style="margin-top:24px">
      ${shotImg(shots, "classes-light", "Clases y cupos")}
      ${shotImg(shots, "coach-dashboard-light", "Panel profesor")}
    </div>`, "light", "Academia")}

  ${page(`
    <div class="eyebrow">Socios y pagos</div>
    <h2>Historial, membresia y cobros en un solo lugar.</h2>
    <div class="mini-grid" style="margin-top:22px">
      ${smallShot(shots, "members-light", "Socios")}
      ${smallShot(shots, "payments-light", "Pagos")}
      ${smallShot(shots, "coaches-light", "Profesores")}
      ${smallShot(shots, "courts-light", "Canchas")}
      ${smallShot(shots, "settings-dark", "Reglas")}
      ${smallShot(shots, "member-mobile-light", "Socio mobile")}
    </div>`, "light", "Gestion integral")}

  ${page(`
    <div class="eyebrow">Todo incluido</div>
    <h2>Una plataforma completa para administrar el club.</h2>
    <div class="area-map">
      ${smallShot(shots, "login-light", "Ingreso")}
      ${smallShot(shots, "admin-dashboard-light", "Panel")}
      ${smallShot(shots, "reservations-light", "Reservas")}
      ${smallShot(shots, "classes-light", "Clases")}
      ${smallShot(shots, "coaches-light", "Profesores")}
      ${smallShot(shots, "members-light", "Socios")}
      ${smallShot(shots, "payments-light", "Pagos")}
      ${smallShot(shots, "courts-light", "Canchas")}
      ${smallShot(shots, "settings-dark", "Configuracion")}
      ${smallShot(shots, "profile-light", "Perfil")}
    </div>`, "light", "Areas del club")}

  ${page(`
    <div class="eyebrow">Mobile first</div>
    <h2>La experiencia que el socio usa en la cancha.</h2>
    <div class="phone-strip" style="margin-top:24px">
      <div class="phone"><img src="${imageData(shots["member-mobile-light"])}"></div>
      <div class="phone"><img src="${imageData(shots["reservations-mobile-dark"])}"></div>
      <div class="phone"><img src="${imageData(shots["classes-mobile-light"])}"></div>
      <div class="phone"><img src="${imageData(shots["payments-mobile-dark"])}"></div>
    </div>`, "dark", "Mobile claro/oscuro")}

  ${page(`
    <div class="eyebrow">Configuracion por club</div>
    <h2>Cada club mantiene sus propias reglas.</h2>
    <div class="screen-row" style="margin-top:24px">
      ${shotImg(shots, "settings-dark", "Configuracion avanzada")}
      <div class="card">
        <h3>Parametrizable</h3>
        <div class="list">
          <div class="li"><span class="dot"></span><span>Hora de apertura de reservas y dias de anticipacion.</span></div>
          <div class="li"><span class="dot"></span><span>Reservas por socio por semana y limite especial de fin de semana.</span></div>
          <div class="li"><span class="dot"></span><span>Maximo de clases por socio por semana.</span></div>
          <div class="li"><span class="dot"></span><span>Precio de invitado no socio, colores, idioma, zona horaria y pagos.</span></div>
        </div>
      </div>
    </div>`, "dark", "Reglas del club")}

  ${page(`
    <div class="eyebrow">Planes en dolares</div>
    <h2>Elegis el plan segun el tamano del club.</h2>
    <div class="grid cols-3" style="margin-top:28px">
      <div class="card plan"><h3>Starter</h3><div class="price">USD 79/mes</div><p>Hasta 3 canchas, 150 socios y 3 profesores. Incluye reservas, clases y pagos.</p></div>
      <div class="card plan"><h3>Pro</h3><div class="price">USD 119/mes</div><p>Hasta 8 canchas, 500 socios y 10 profesores. Ideal para clubes en crecimiento.</p></div>
      <div class="card plan"><h3>Premium</h3><div class="price">USD 199/mes</div><p>Mayor escala, soporte prioritario, reportes avanzados y acompanamiento.</p></div>
    </div>
    <p class="lead" style="margin-top:28px">Implementacion inicial: desde USD 250, segun carga de datos, configuracion y capacitacion.</p>`, "light", "Precios")}

  ${page(`
    <div class="eyebrow">Implementacion</div>
    <h2>Tu club puede empezar rapido.</h2>
    <div class="grid cols-4" style="margin-top:28px">
      <div class="card"><div class="stat">1</div><h3>Configuracion</h3><p>Creamos el club, reglas, colores, canchas y usuarios.</p></div>
      <div class="card"><div class="stat">2</div><h3>Carga inicial</h3><p>Importamos socios, profesores, clases y saldos si corresponde.</p></div>
      <div class="card"><div class="stat">3</div><h3>Capacitacion</h3><p>Admin, profesores y socios aprenden los flujos principales.</p></div>
      <div class="card"><div class="stat">4</div><h3>Salida en vivo</h3><p>Acompanamiento durante los primeros dias de operacion.</p></div>
    </div>
    <p class="quote" style="margin-top:34px">Tiempo estimado: 7 a 14 dias segun el tamano del club y datos iniciales.</p>`, "light", "Onboarding")}

  ${page(`
    <div class="cover">
      <div>
        <div class="brand"><span class="mark">T</span><span>SaaS Tenis Club</span></div>
        <h1>Agenda una demo para tu club.</h1>
        <p class="lead">Mostramos la plataforma con un flujo real: socio reserva, profesor gestiona asistencia y admin controla pagos y reglas.</p>
        <table style="margin-top:28px">
          <tr><th>Incluido</th><th>Resultado</th></tr>
          <tr><td>Demo guiada</td><td>Conocer la experiencia completa por rol.</td></tr>
          <tr><td>Piloto</td><td>Probar reservas y clases con usuarios reales.</td></tr>
          <tr><td>Onboarding</td><td>Dejar el club configurado para operar.</td></tr>
        </table>
      </div>
      ${shotImg(shots, "login-light", "Ingreso por club y usuario")}
    </div>`, "dark", "Cierre comercial")}
  </body></html>`;
}

async function writePdf(browser, html, fileName) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent(html, { waitUntil: "networkidle" });
  const file = path.join(outDir, fileName);
  await page.pdf({
    path: file,
    width: "1280px",
    height: "720px",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" }
  });
  await page.close();
  return file;
}

async function main() {
  fs.mkdirSync(shotsDir, { recursive: true });
  const response = await fetch(frontendUrl).catch(() => null);
  if (!response || !response.ok) {
    throw new Error(`No pude acceder a ${frontendUrl}. Levanta el frontend antes de generar los PDFs.`);
  }

  const browser = await chromium.launch({ headless: true });
  const shots = {};
  shots["login-light"] = await captureLogin(browser);
  shots["superadmin-light"] = await capture(browser, "superadmin-light", "#/superadmin", { user: users.superadmin, tenant: tenants[1], tenantSlug: "platform" }, { theme: "light" });
  shots["tenants-light"] = await capture(browser, "tenants-light", "#/tenants", { user: users.superadmin, tenant: tenants[1], tenantSlug: "platform" }, { theme: "light" });
  shots["admin-dashboard-light"] = await capture(browser, "admin-dashboard-light", "#/admin", { user: users.admin }, { theme: "light" });
  shots["admin-dashboard-dark"] = await capture(browser, "admin-dashboard-dark", "#/admin", { user: users.admin }, { theme: "dark" });
  shots["reservations-light"] = await capture(browser, "reservations-light", "#/reservations", { user: users.admin }, { theme: "light" });
  shots["classes-light"] = await capture(browser, "classes-light", "#/classes", { user: users.admin }, { theme: "light" });
  shots["members-light"] = await capture(browser, "members-light", "#/members", { user: users.admin }, { theme: "light" });
  shots["coaches-light"] = await capture(browser, "coaches-light", "#/coaches", { user: users.admin }, { theme: "light" });
  shots["payments-light"] = await capture(browser, "payments-light", "#/payments", { user: users.admin }, { theme: "light" });
  shots["courts-light"] = await capture(browser, "courts-light", "#/courts", { user: users.admin }, { theme: "light" });
  shots["settings-dark"] = await capture(browser, "settings-dark", "#/settings", { user: users.admin }, { theme: "dark" });
  shots["profile-light"] = await capture(browser, "profile-light", "#/profile", { user: users.admin }, { theme: "light" });
  shots["coach-dashboard-light"] = await capture(browser, "coach-dashboard-light", "#/coach", { user: users.coach }, { theme: "light" });
  shots["member-mobile-light"] = await capture(browser, "member-mobile-light", "#/member", { user: users.member }, { mobile: true, theme: "light" });
  shots["reservations-mobile-dark"] = await capture(browser, "reservations-mobile-dark", "#/reservations", { user: users.member }, { mobile: true, theme: "dark" });
  shots["classes-mobile-light"] = await capture(browser, "classes-mobile-light", "#/classes", { user: users.member }, { mobile: true, theme: "light" });
  shots["payments-mobile-dark"] = await capture(browser, "payments-mobile-dark", "#/payments", { user: users.member }, { mobile: true, theme: "dark" });

  const investorPdf = await writePdf(browser, investorDeck(shots), "SaaS_Tenis_Club_presentacion_socios.pdf");
  const clubPdf = await writePdf(browser, clubSalesDeck(shots), "SaaS_Tenis_Club_presentacion_clubes.pdf");
  await browser.close();

  console.log(JSON.stringify({ investorPdf, clubPdf, screenshots: Object.keys(shots).length }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
