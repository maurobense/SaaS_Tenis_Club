import { auth, homeForRole } from "../auth.js?v=2026050125";
import { toast } from "../components/toast.js?v=2026050124";

export async function loginPage() {
  setTimeout(() => {
    document.querySelector("#login-form")?.addEventListener("submit", async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        const user = await auth.login(Object.fromEntries(form.entries()));
        location.hash = homeForRole(user.role);
      } catch (error) {
        toast(error.message || "No se pudo iniciar sesion. Verifica club y credenciales.", "error");
      }
    });
  }, 0);
  return `<section class="login-screen"><div class="login-panel">
    <div class="login-brand"><div><h1>SaaS Tenis Club</h1><p>Reservas, clases, membresias, pagos y metricas para clubes de tenis con operacion multiclub.</p></div><div>Club Demo Tenis - listo para Netlify + .NET</div></div>
    <form id="login-form" class="login-form">
      <div><h2>Ingresar</h2><p class="muted">Usa el club demo o configura la URL de tu API.</p></div>
      <div class="field"><label>Club</label><input name="tenantSlug" value="club-demo" required /></div>
      <div class="field"><label>Correo electronico</label><input name="email" type="email" value="admin@clubdemo.com" required /></div>
      <div class="field"><label>Contrasena</label><input name="password" type="password" value="Admin123!" required /></div>
      <button class="btn" type="submit">Ingresar al panel</button>
      <p class="muted">SuperAdmin: platform / superadmin@saastennis.com / Admin123!. Demo administrador: admin@clubdemo.com / Admin123!. Profesor: coach@clubdemo.com / Coach123!. Socio: socio@clubdemo.com / Socio123!.</p>
    </form>
  </div></section>`;
}
