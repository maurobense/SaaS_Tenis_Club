import { auth, normalizeRole } from "../auth.js?v=2026050123";
import { apiClient } from "../apiClient.js?v=2026050123";
import { openModal } from "../components/modal.js?v=2026050131";
import { toast } from "../components/toast.js?v=2026050123";
import { applyPreferences, currentLanguage, currentTheme, setLanguage, setTheme, t } from "../preferences.js?v=2026050123";

const roleLabels = {
  SuperAdmin: "Super administrador",
  ClubAdmin: "Administrador del club",
  Coach: "Profesor",
  Member: "Socio"
};

export async function profilePage() {
  const cached = auth.user();
  const response = await apiClient.get("/api/auth/me").catch(() => cached);
  const user = response || cached;
  if (user) user.role = normalizeRole(user.role);
  setTimeout(() => {
    document.querySelector("#profile-form")?.addEventListener("submit", event => {
      event.preventDefault();
      saveProfile(event.currentTarget);
    });
    document.querySelector("[data-change-password]")?.addEventListener("click", openChangePasswordModal);
  }, 0);

  return `<section class="page">
    <div class="page-head"><div><h1 class="page-title">Perfil</h1><p class="page-subtitle">Datos personales, rol, seguridad y preferencias.</p></div></div>
    <div class="profile-grid">
      <article class="card panel profile-summary">
        <div class="profile-avatar">${(user?.firstName?.[0] || "U")}${(user?.lastName?.[0] || "")}</div>
        <h2>${user?.firstName || ""} ${user?.lastName || ""}</h2>
        <p class="muted">${roleLabels[user?.role] || user?.role || "Usuario"}</p>
        <span class="badge success">Activo</span>
      </article>
      <form id="profile-form" class="card panel grid">
        <div class="grid two-fields">
          <div class="field"><label>Nombre</label><input name="firstName" value="${escapeAttr(user?.firstName || "")}" required></div>
          <div class="field"><label>Apellido</label><input name="lastName" value="${escapeAttr(user?.lastName || "")}" required></div>
        </div>
        <div class="field"><label>Correo electronico</label><input value="${escapeAttr(user?.email || "")}" disabled></div>
        <div class="field"><label>Telefono</label><input name="phone" value="${escapeAttr(user?.phone || "")}" placeholder="Sin telefono cargado"></div>
        <div class="grid two-fields">
          <div class="field"><label>${t("language")}</label><select name="language">
            <option value="es" ${currentLanguage() === "es" ? "selected" : ""}>Espanol Uruguay</option>
            <option value="en" ${currentLanguage() === "en" ? "selected" : ""}>English</option>
            <option value="pt" ${currentLanguage() === "pt" ? "selected" : ""}>Portugues</option>
          </select></div>
          <div class="field"><label>${t("theme")}</label><select name="theme">
            <option value="light" ${currentTheme() === "light" ? "selected" : ""}>${t("light")}</option>
            <option value="dark" ${currentTheme() === "dark" ? "selected" : ""}>${t("dark")}</option>
            <option value="system" ${currentTheme() === "system" ? "selected" : ""}>${t("system")}</option>
          </select></div>
        </div>
        <div class="toolbar"><button class="btn" type="submit">Guardar perfil</button><button class="btn ghost" type="button" data-change-password>Cambiar contrasena</button></div>
      </form>
    </div>
    <article class="card panel">
      <h2>Permisos de tu usuario</h2>
      <div class="permission-list">${permissionsFor(user?.role).map(x => `<div><strong>${x.title}</strong><span class="muted">${x.text}</span></div>`).join("")}</div>
    </article>
  </section>`;
}

async function saveProfile(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  setLanguage(values.language);
  setTheme(values.theme);
  applyPreferences();
  try {
    const updated = await apiClient.put("/api/auth/profile", {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null
    });
    const merged = { ...auth.user(), ...updated, role: normalizeRole(updated.role) };
    localStorage.setItem("user", JSON.stringify(merged));
    toast("Perfil actualizado.");
    setTimeout(() => location.reload(), 250);
  } catch {}
}

function openChangePasswordModal() {
  const modal = openModal({
    title: "Cambiar contrasena",
    content: `<form id="password-form" class="grid">
      <div class="field"><label>Contrasena actual</label><input name="currentPassword" type="password" required autocomplete="current-password"></div>
      <div class="field"><label>Nueva contrasena</label><input name="newPassword" type="password" minlength="8" required autocomplete="new-password"></div>
      <div class="field"><label>Confirmar nueva contrasena</label><input name="confirmPassword" type="password" minlength="8" required autocomplete="new-password"></div>
      <p class="form-hint">Usa al menos 8 caracteres con mayuscula, minuscula, numero y simbolo.</p>
      <button class="btn" type="submit">Actualizar contrasena</button>
    </form>`
  });

  modal.querySelector("#password-form").addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (values.newPassword !== values.confirmPassword) {
      toast("La confirmacion no coincide.");
      return;
    }
    try {
      await apiClient.post("/api/auth/change-password", values);
      toast("Contrasena actualizada.");
      modal.remove();
    } catch {}
  });
}

function permissionsFor(role) {
  if (role === "ClubAdmin") return [
    { title: "Administrar club", text: "Canchas, socios, profesores, clases, pagos y configuracion." },
    { title: "Reservas", text: "Crear reservas y bloqueos administrativos." },
    { title: "Reportes", text: "Ver metricas operativas del club." }
  ];
  if (role === "Coach") return [
    { title: "Clases asignadas", text: "Ver alumnos, asistencia y agenda propia." },
    { title: "Calendario", text: "Consultar reservas y horarios vinculados a clases." }
  ];
  if (role === "Member") return [
    { title: "Reservas propias", text: "Reservar canchas y ver historial personal." },
    { title: "Clases", text: "Anotarse a clases y ver pagos propios." }
  ];
  return [{ title: "Plataforma", text: "Administracion general del SaaS." }];
}

function escapeAttr(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
