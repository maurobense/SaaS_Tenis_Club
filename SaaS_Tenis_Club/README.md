# SaaS_Tenis_Club

Plataforma SaaS multitenant para clubes de tenis: reservas de canchas, clases, profesores, socios, membresías, pagos, settings por club, dashboards, auditoría y frontend estático mobile first.

## Estructura

```text
SaaS_Tenis_Club/
├── backend/
│   └── TennisClubSaaS.Api/
│       ├── TennisClubSaaS.Api/
│       ├── TennisClubSaaS.Application/
│       ├── TennisClubSaaS.Domain/
│       └── TennisClubSaaS.Infrastructure/
└── frontend/
    └── TennisClubSaaS.Frontend/
```

## Stack

- Backend: .NET 8, ASP.NET Core Web API, EF Core Code First, SQL Server, JWT, refresh tokens, roles, FluentValidation, Swagger, Serilog.
- Frontend: HTML5, CSS3, Vanilla JavaScript, Fetch API, hash routing, localStorage, CSS modular, listo para Netlify.
- Multitenancy: `X-Tenant-Slug`, claim `tenant_id`, filtros globales por `ClubTenantId` y estructura preparada para subdominios.

## Usuarios demo

- SuperAdmin: `superadmin@saastennis.com` / `Admin123!` con tenant slug `platform`
- ClubAdmin: `admin@clubdemo.com` / `Admin123!` con tenant slug `club-demo`
- Coach: `coach@clubdemo.com` / `Coach123!`
- Member: `socio@clubdemo.com` / `Socio123!`

## Backend

Requiere .NET SDK 8 y SQL Server.

```bash
cd backend/TennisClubSaaS.Api
dotnet restore
dotnet ef database update --project TennisClubSaaS.Infrastructure --startup-project TennisClubSaaS.Api
dotnet run --project TennisClubSaaS.Api
```

Configurar la connection string en:

- `backend/TennisClubSaaS.Api/TennisClubSaaS.Api/appsettings.json`
- `backend/TennisClubSaaS.Api/TennisClubSaaS.Api/appsettings.Production.json`

El proyecto incluye una migración inicial manual `InitialCreate` y seed automático controlado por `Database:SeedOnStartup`.

## Migraciones

Crear nueva migración:

```bash
dotnet ef migrations add NombreMigracion --project TennisClubSaaS.Infrastructure --startup-project TennisClubSaaS.Api
```

Aplicar migraciones:

```bash
dotnet ef database update --project TennisClubSaaS.Infrastructure --startup-project TennisClubSaaS.Api
```

## Frontend

No requiere build. Abrir `frontend/TennisClubSaaS.Frontend/index.html` o servirlo con cualquier servidor estático.

Configurar API en:

```text
frontend/TennisClubSaaS.Frontend/assets/js/config.js
```

Para Netlify, publicar la carpeta:

```text
frontend/TennisClubSaaS.Frontend
```

## Deploy Somee

1. Cambiar `ConnectionStrings:DefaultConnection` en `appsettings.Production.json`.
2. Cambiar `Jwt:Key` por una clave fuerte.
3. Configurar `Cors:AllowedOrigins` con la URL real de Netlify.
4. Publicar:

```bash
dotnet publish TennisClubSaaS.Api/TennisClubSaaS.Api.csproj -c Release -o ./publish
```

5. Subir el contenido de `publish` a Somee.
6. Ejecutar migraciones contra SQL Server antes del primer uso.

## Endpoints principales

- Auth: `/api/auth/login`, `/api/auth/register-member`, `/api/auth/refresh-token`, `/api/auth/logout`, `/api/auth/me`
- Tenants: `/api/tenants`
- Members: `/api/members`
- Courts: `/api/courts`, `/api/courts/availability`
- Reservations: `/api/reservations`, `/api/reservations/available-slots`, `/api/reservations/my-reservations`
- Classes: `/api/classes`, `/api/classes/{id}/enroll`
- Sessions: `/api/class-sessions/{id}/attendance`
- Payments: `/api/payments`, `/api/payments/overdue`, `/api/payments/monthly-summary`
- Memberships: `/api/memberships/generate-monthly`
- Settings: `/api/settings`
- Dashboards: `/api/dashboard/admin`, `/api/dashboard/coach`, `/api/dashboard/member`, `/api/dashboard/superadmin`

## Arquitectura

- `Domain`: entidades, enums y base de auditoría/soft delete.
- `Application`: DTOs, contratos, validadores y servicios de negocio.
- `Infrastructure`: EF Core, Unit of Work, repositories, JWT, password hashing, tenant provider y seed.
- `Api`: controllers, middlewares, Swagger, CORS, auth y composición.

Las reglas críticas de reservas y clases viven en servicios:

- `ReservationService`: membresía, deuda, ventana de apertura, disponibilidad, solapes y límite semanal.
- `ClassService`: cupos, duplicados, lista de espera y promoción automática.
- `SettingService`: configuración dinámica por club.

## Multitenancy

El cliente envía `X-Tenant-Slug`. El backend resuelve el tenant y aplica filtros globales por `ClubTenantId`. Los usuarios `SuperAdmin` pueden operar a nivel plataforma; los demás quedan limitados a su club.
