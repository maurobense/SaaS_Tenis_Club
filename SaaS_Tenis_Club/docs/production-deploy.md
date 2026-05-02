# Deploy a produccion

## Backend en Somee

1. Crear la base SQL Server en Somee.
2. Configurar estas variables o reemplazarlas en `appsettings.Production.json` antes de publicar:
   - `ASPNETCORE_ENVIRONMENT=Production`
   - `ConnectionStrings__DefaultConnection`
   - `Jwt__Key` con una clave aleatoria de 64+ caracteres
   - `Cors__AllowedOrigins__0=https://tenis-club.netlify.app`
3. Primer arranque: usar `Database__SeedOnStartup=true` solo para crear el tenant `platform` y el usuario inicial. Despues de entrar, cambiar la clave del superadmin y volver a `false`.
4. Publicar desde `backend/TennisClubSaaS.Api`:

```bash
dotnet publish TennisClubSaaS.Api/TennisClubSaaS.Api.csproj -c Release -o ./publish
```

5. Subir el contenido de `publish` a Somee.

## Frontend en Netlify

1. Publicar la carpeta `frontend/TennisClubSaaS.Frontend`.
2. No usar build command.
3. Editar `assets/js/env.js` en el deploy:

```js
window.TennisClubRuntimeConfig = {
  apiBaseUrl: "https://saastenisclub.somee.com",
  frontendBaseUrl: "https://tenis-club.netlify.app",
  defaultTenantSlug: ""
};
```

## Links por club

Cada club puede entrar por su slug:

```text
https://tenis-club.netlify.app/club-demo/#/login
```

El frontend toma ese slug, consulta `/api/public/tenants/{slug}` para cargar nombre, logo y colores, y envia `X-Tenant-Slug` en las llamadas a la API.
