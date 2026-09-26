# Plan 4 de 4: Infraestructura y entrega

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levantar la solución completa con `docker compose up --build`, verificarla en CI y preparar los entregables: README, bitácora y Pull Request.

**Architecture:** Dos imágenes multi-stage construidas desde la raíz del repositorio. La API corre migraciones y seed al arrancar y guarda SQLite en `./data` mediante un bind mount. El frontend se sirve con nginx, que además hace proxy de `/api/` a la API para que ambos compartan origen.

**Tech Stack:** Docker, Docker Compose v2, nginx 1.27, GitHub Actions.

**Spec:** [docs/superpowers/specs/2026-09-24-solicitud-credito-design.md](../specs/2026-09-24-solicitud-credito-design.md)

**Prerequisito:** planes [1](2026-09-25-01-fundacion-dominio.md), [2](2026-09-25-02-api.md) y [3](2026-09-25-03-web.md) completos.

**Este plan está dividido en dos archivos:**

1. **Este archivo:** tareas 1 y 2. Docker y CI.
2. [Parte B](2026-09-25-04b-infraestructura-entrega.md): tareas 3 y 4. README y Pull Request.

## Global Constraints

- Todas las constraints de los planes anteriores siguen vigentes.
- Imágenes base `node:22-bookworm-slim` y `nginx:1.27-alpine`. Contexto de construcción: la raíz del repositorio.
- La API corre como usuario `node`, no como root.
- Un solo comando levanta todo sin archivo `.env`: `docker compose up --build`.
- Puertos: web en `8080`, API en `3000`.
- SQLite en `./data/credito.db` del host, mediante bind mount a `/app/data`.
- Nada se publica fuera del repositorio local sin confirmación explícita del autor: ni `git push` ni apertura del Pull Request.

## Review Focus

1. **Reiniciar los contenedores.** `docker compose restart` no debe duplicar usuarios, bancos ni tipos de empleo, y los datos deben seguir en `data/credito.db`. Verificación en la tarea 1.
2. **Recargar una ruta profunda del SPA**, como `http://localhost:8080/comite/5`. nginx debe devolver `index.html` y no un 404. Verificación en la tarea 1.
3. **Carpeta `data/` con otro dueño en Linux.** Si el uid del host no es 1000, la API no puede escribir la base. El CI lo reproduce y el README documenta la solución. Tarea 2 y parte B.
4. **La cookie de refresh a través de nginx.** El login por el puerto 8080 debe devolver `Set-Cookie` con `Path=/api/v1/auth` y el refresh posterior debe funcionar. Verificación en la tarea 1.
5. **Arranque en frío.** El frontend no debe aceptar tráfico antes de que la API esté sana. Lo garantiza `depends_on` con `service_healthy`. Verificación en la tarea 1.

---

### Task 1: Imágenes Docker y docker-compose

**Files:**
- Create: `apps/api/Dockerfile`, `apps/api/docker-entrypoint.sh`
- Create: `apps/web/Dockerfile`, `apps/web/nginx.conf`
- Create: `docker-compose.yml`, `.dockerignore`, `data/.gitkeep`
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: scripts `build` de cada workspace, `dist/main.js` y `dist/seed.js` de la API, `GET /api/v1/health`.
- Produces: servicios `api` y `web` en `docker-compose.yml`.

- [ ] **Step 1: Mover el CLI de Prisma a dependencias de producción**

La imagen de la API corre `prisma migrate deploy` al arrancar, así que el CLI debe estar en `dependencies`. En `apps/api/package.json`, quitar `"prisma"` de `devDependencies` y agregarlo a `dependencies`:

```json
    "prisma": "^6.5.0",
```

Run: `npm install`
Expected: sin errores; `package-lock.json` refleja el cambio.

- [ ] **Step 2: Crear la imagen de la API**

`apps/api/Dockerfile`:

```dockerfile
FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/api/prisma apps/api/prisma
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/domain packages/domain
COPY apps/api apps/api
RUN npm run build -w @credito/domain && npm run build -w @credito/api

FROM build AS prod-deps
RUN npm prune --omit=dev && cd apps/api && npx prisma generate

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/packages/domain/package.json packages/domain/package.json
COPY --from=build /app/packages/domain/dist packages/domain/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY apps/api/docker-entrypoint.sh apps/api/docker-entrypoint.sh
RUN chmod +x apps/api/docker-entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R node:node /app/data
USER node
EXPOSE 3000
ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
```

`npm ci` necesita los `package.json` de todos los workspaces, incluido el del frontend, para respetar el lockfile. El cliente Prisma se regenera después de `npm prune` porque la poda puede borrar la carpeta generada.

`apps/api/docker-entrypoint.sh`:

```sh
#!/bin/sh
set -e

cd /app/apps/api

echo "Aplicando migraciones..."
npx prisma migrate deploy

echo "Sembrando datos de demostración..."
node dist/seed.js

echo "Iniciando la API en el puerto ${PORT:-3000}"
exec node dist/main.js
```

`exec` reemplaza el shell por Node, así las señales de `docker compose stop` llegan a la API y Nest cierra ordenadamente.

- [ ] **Step 3: Crear la imagen del frontend**

`apps/web/Dockerfile`:

```dockerfile
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/domain/package.json packages/domain/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/domain packages/domain
COPY apps/web apps/web
RUN npm run build -w @credito/web

FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
```

`--ignore-scripts` evita que el `postinstall` de la API intente generar el cliente Prisma, que el frontend no necesita.

`apps/web/nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;

  location /api/ {
    proxy_pass http://api:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri /index.html;
  }
}
```

- [ ] **Step 4: Crear docker-compose y archivos auxiliares**

`docker-compose.yml`:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: file:/app/data/credito.db
      JWT_SECRET: ${JWT_SECRET:-secreto-de-demo-no-usar-en-produccion-0001}
      JWT_ACCESS_TTL: ${JWT_ACCESS_TTL:-15m}
      REFRESH_TTL_DAYS: ${REFRESH_TTL_DAYS:-7}
      COOKIE_SECURE: ${COOKIE_SECURE:-false}
      APP_TZ: ${APP_TZ:-America/Managua}
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    healthcheck:
      test:
        - CMD
        - node
        - -e
        - "fetch('http://localhost:3000/api/v1/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
      interval: 5s
      timeout: 3s
      retries: 20
      start_period: 15s

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "8080:80"
    depends_on:
      api:
        condition: service_healthy
```

La imagen slim no trae `curl`, así que el healthcheck usa el `fetch` nativo de Node 22.

`.dockerignore`:

```
**/node_modules
**/dist
**/coverage
.git
.github
data
docs
*.docx
**/.env
apps/api/prisma/*.db
apps/api/prisma/*.db-journal
```

`data/.gitkeep`: archivo vacío.

- [ ] **Step 5: Levantar y verificar**

Run: `docker compose up -d --build --wait`
Expected: ambos servicios quedan `healthy` o `running` sin errores.

```bash
curl -fsS http://localhost:8080/api/v1/health
curl -fsS -i -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"oficial","password":"Demo2026!"}'
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/comite/5
curl -fsS -o /dev/null -w '%{http_code}\n' http://localhost:8080/api/docs
ls -l data/credito.db
```

Expected:
- `{"status":"ok"}`.
- `200` con `accessToken` en el cuerpo y una cabecera `Set-Cookie: refresh_token=...; Path=/api/v1/auth; HttpOnly; SameSite=Strict`.
- `200` en la ruta profunda del SPA.
- `200` en la documentación.
- `data/credito.db` existe en el host.

Verificar el refresh por nginx con la cookie recibida:

```bash
curl -fsS -c /tmp/cookies.txt -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' -d '{"username":"cajero","password":"Demo2026!"}' > /dev/null
curl -fsS -b /tmp/cookies.txt -X POST http://localhost:8080/api/v1/auth/refresh
```

Expected: una respuesta con un `accessToken` nuevo.

- [ ] **Step 6: Verificar reinicio e idempotencia**

```bash
docker compose restart api
docker compose exec api node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();Promise.all([p.usuario.count(),p.banco.count(),p.tipoEmpleo.count()]).then(c=>{console.log(c.join(','));return p.\$disconnect()})"
```

Expected: `4,4,2`. Los datos creados antes del reinicio siguen presentes.

Abrir `http://localhost:8080` en el navegador y repetir el recorrido de la tarea 8 del plan 3 contra los contenedores.

Run: `docker compose down`
Expected: los contenedores se detienen y `data/credito.db` se conserva.

- [ ] **Step 7: Commit**

```bash
git add apps/api/Dockerfile apps/api/docker-entrypoint.sh apps/api/package.json package-lock.json \
  apps/web/Dockerfile apps/web/nginx.conf docker-compose.yml .dockerignore data/.gitkeep
git commit -m "build: imágenes Docker y docker-compose de un solo comando"
```

---

### Task 2: Integración continua

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: scripts `lint`, `test:all` y `test:cov` del dominio, y `docker-compose.yml`.
- Produces: workflow `CI` con los jobs `verificar` y `docker`, y su badge para el README.

- [ ] **Step 1: Crear el workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  verificar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - name: Cobertura del dominio (umbral 95 %)
        run: npm run test:cov -w @credito/domain
      - run: npm run test:all
      - run: npm run build

  docker:
    needs: verificar
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Permitir escritura del usuario node sobre data/
        run: chmod 777 data
      - name: Levantar la solución
        run: docker compose up -d --build --wait
      - name: Health a través de nginx
        run: curl -fsS http://localhost:8080/api/v1/health
      - name: Login a través de nginx
        run: |
          curl -fsS -X POST http://localhost:8080/api/v1/auth/login \
            -H 'Content-Type: application/json' \
            -d '{"username":"oficial","password":"Demo2026!"}' | grep -q accessToken
      - name: Logs si algo falló
        if: failure()
        run: docker compose logs
      - name: Apagar
        if: always()
        run: docker compose down
```

El runner de GitHub usa el uid 1001, distinto del usuario `node` del contenedor. El paso de `chmod` reproduce el problema de permisos que puede tener un evaluador en Linux y deja constancia de la solución.

- [ ] **Step 2: Validar la sintaxis localmente**

Run: `npx --yes @action-validator/cli .github/workflows/ci.yml`
Expected: sin errores. Si la herramienta no está disponible, revisar la indentación manualmente y confiar en la validación de GitHub al hacer push.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: lint, pruebas, cobertura y smoke test de docker compose"
```

---

Continúa en la [parte B](2026-09-25-04b-infraestructura-entrega.md).
