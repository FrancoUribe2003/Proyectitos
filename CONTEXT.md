# Gestor de Proyectos Colaborativo — Contexto

## 1. Qué es

Aplicación web para centralizar toda la información de tus proyectos personales (links, notas, tareas) y colaborar con otros usuarios en proyectos compartidos, pudiendo asignar tareas y filtrarlas por persona.

Idea en una línea: un gestor de proyectos para cada uno, donde lo más importante es poder **participar en proyectos de otros y asignar tareas**.

## 2. Objetivos

- Tener un solo lugar con toda la info de cada proyecto (deploys, repo, DB, notas, TODO).
- Permitir colaboración real: miembros, roles, tareas asignadas.
- Servir como proyecto de aprendizaje de backend (Express) y como pieza de portfolio.

## 3. Stack

| Capa | Tecnología |
|---|---|
| Front | Vite + React + TypeScript + Tailwind |
| Routing / data fetching | React Router + TanStack Query |
| Back | Node.js + Express + TypeScript |
| Validación | Zod |
| ORM | Prisma (o Drizzle) |
| Base de datos | PostgreSQL hosteado en Supabase (se usa solo como DB) |
| Auth | Propia en Express: JWT (access token + refresh token en cookie httpOnly), contraseñas con bcrypt/argon2 |
| Deploy front | Vercel o Netlify |
| Deploy back | Render o Railway |
| Repo | Monorepo con pnpm workspaces |

> Nota: Supabase se usa únicamente como Postgres hosteado. El auth se maneja en Express para practicar backend. Si más adelante se prefiere, se puede migrar a Supabase Auth.

## 4. Modos de uso

### Invitado
- Se puede entrar sin cuenta.
- Puede crear como maximo un proyecto, con links, notas y TODO (Todas las funcionalidades menos compartir proyectos).
- **No puede compartir proyectos.**
- Todo se guarda únicamente en local (localStorage / IndexedDB). No se sube nada al servidor.

### Usuario logueado
- Datos guardados en la base de datos.
- Puede compartir proyectos e invitar miembros.
- Puede asignar tareas y filtrar por usuario.

### Implementación del modo invitado
Interfaz `ProjectRepository` con dos implementaciones, para que los componentes no sepan cuál usan:

- `LocalRepository` → localStorage / IndexedDB
- `ApiRepository` → llama al backend

## 5. Funcionalidades

### Básicas
- Crear proyectos con nombre, subtítulo y descripción.
- Links por proyecto: deploy del back, deploy del front, repo de GitHub, DB, y links libres.
- Notas dentro del proyecto. Cada nota puede ser pública o privada.
- TODO por proyecto, exportable a `.md`.

### Colaboración
- Compartir proyectos con otros usuarios (todo lo que se agrega al proyecto se comparte).
- Roles: `owner`, `editor`, `viewer`.
- Asignar cada tarea a un miembro.
- Filtrar el TODO por usuario.

### Home
- Proyectos en cuadrícula de cards.
- Cada card permite abrir el proyecto o ir directo a su TODO.

## 6. Modelo de datos

```
users
  id, email, password_hash, name, created_at

projects
  id, owner_id -> users, name, subtitle, description, created_at

project_members
  project_id -> projects, user_id -> users, role (owner | editor | viewer)
  PK (project_id, user_id)

project_links
  id, project_id -> projects, type (front | back | repo | db | other), label, url

notes
  id, project_id -> projects, author_id -> users, content, is_public, created_at

tasks
  id, project_id -> projects, title, done, assignee_id -> users (nullable),
  created_by -> users, created_at
```

## 7. Permisos

| Acción | owner | editor | viewer |
|---|---|---|---|
| Ver proyecto, links, tareas | sí | sí | sí |
| Ver notas públicas | sí | sí | sí |
| Ver notas privadas | solo autor | solo autor | solo autor |
| Crear/editar links, notas, tareas | sí | sí | no |
| Asignar tareas | sí | sí | no |
| Gestionar miembros | sí | no | no |
| Editar/borrar proyecto | sí | no | no |

Se implementa con un middleware `requireProjectRole('editor')` que verifica la membresía antes de cada ruta de proyecto.

## 8. API (rutas base)

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id

POST   /projects/:id/members
PATCH  /projects/:id/members/:userId
DELETE /projects/:id/members/:userId

GET    /projects/:id/links
POST   /projects/:id/links
DELETE /projects/:id/links/:linkId

GET    /projects/:id/notes
POST   /projects/:id/notes
PATCH  /projects/:id/notes/:noteId
DELETE /projects/:id/notes/:noteId

GET    /projects/:id/tasks          (?assignee=userId)
POST   /projects/:id/tasks
PATCH  /projects/:id/tasks/:taskId
DELETE /projects/:id/tasks/:taskId
GET    /projects/:id/tasks/export.md
```

## 9. Estructura del repo

```
/
├─ Proyectitos/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ routes/
│  │  │  ├─ controllers/
│  │  │  ├─ middleware/     (auth, requireProjectRole, errorHandler)
│  │  │  ├─ schemas/        (Zod)
│  │  │  └─ db/             (cliente Prisma)
│  │  └─ prisma/schema.prisma
│  └─ web/
│     └─ src/
│        ├─ pages/
│        ├─ components/
│        └─ lib/storage/    (ProjectRepository, local, remote)
├─ pnpm-workspace.yaml
└─ README.md
```

## 10. Supabase como base de datos

1. Crear proyecto en Supabase y guardar la contraseña de la DB.
2. En *Project Settings → Database* copiar la connection string.
3. Para el backend en Render/Railway usar la **connection pooler** (puerto 6543, modo transaction) en `DATABASE_URL`, y la conexión directa (puerto 5432) en `DIRECT_URL` para migraciones.
4. Variables de entorno del back:

```
DATABASE_URL=postgresql://...pooler...:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://...:5432/postgres
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CLIENT_URL=http://localhost:5173
```

5. Migraciones: `prisma migrate dev` en local, `prisma migrate deploy` en producción.

## 11. Exportación del TODO a Markdown

Formato esperado de `export.md`:

```md
# Nombre del proyecto — TODO

- [ ] Tarea pendiente (@usuario)
- [x] Tarea completada (@usuario)
- [ ] Tarea sin asignar
```

## 12. Orden de desarrollo

1. Monorepo, Express base, conexión a Supabase, esquema Prisma y migración inicial.
2. Auth (registro, login, refresh, logout) y middleware de autenticación.
3. CRUD de proyectos y links.
4. TODO con exportación a `.md`.
5. Miembros, roles y asignación de tareas con filtro por usuario.
6. Front: home con cards, vista de proyecto, TODO.
7. Migración de datos de invitado a cuenta al registrarse.
8. Modo invitado con `LocalRepository`.
9. Notas públicas/privadas.
10. Deploy (front en Vercel, back en Render) y README.

## 13. Fuera de alcance por ahora

- Notificaciones por mail.
- Invitaciones por link con expiración.
- Realtime/colaboración simultánea.

