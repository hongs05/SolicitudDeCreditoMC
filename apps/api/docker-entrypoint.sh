#!/bin/sh
set -e

cd /app/apps/api

echo "Aplicando migraciones..."
npx prisma migrate deploy

echo "Sembrando datos de demostración..."
node dist/seed.js

echo "Iniciando la API en el puerto ${PORT:-3000}"
exec node dist/main.js
