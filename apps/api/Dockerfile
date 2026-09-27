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
# Sin USER: el entrypoint arranca como root, se adueña de /app/data y baja a node antes de iniciar la API.
EXPOSE 3000
ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
