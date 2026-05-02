# TennisClubSaaS.Frontend

Frontend estatico en Vanilla JS para el portal de clubes.

## Ejecutar local

Servir esta carpeta:

```bash
npx serve .
```

## Configurar API

Editar `assets/js/env.js`:

```js
window.TennisClubRuntimeConfig = {
  apiBaseUrl: "https://tu-api.somee.com",
  frontendBaseUrl: "https://tu-front.netlify.app",
  defaultTenantSlug: ""
};
```

Cada club puede entrar por `https://tu-front.netlify.app/slug-del-club/#/login`.

## Publicar en Netlify

Usar como publish directory:

```text
frontend/TennisClubSaaS.Frontend
```

No hay build command.
