#!/bin/sh
set -e

# data/ es una carpeta del host montada como volumen; en Linux su dueño puede ser cualquier uid.
# Se arranca como root solo para adueñarse de ella y luego se sigue como el usuario node.
if [ "$(id -u)" = "0" ]; then
  chown -R node:node /app/data
  exec setpriv --reuid=node --regid=node --init-groups "$0" "$@"
fi

cd /app/apps/api

echo "Aplicando migraciones..."
npx prisma migrate deploy

echo "Sembrando datos de demostración..."
node dist/seed.js

echo "Iniciando la API en el puerto ${PORT:-3000}"
exec node dist/main.js
