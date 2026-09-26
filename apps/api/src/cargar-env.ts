import { existsSync } from 'node:fs';
import path from 'node:path';

export function cargarArchivoEnv(): void {
  const ruta = path.resolve(__dirname, '../.env');
  if (existsSync(ruta)) process.loadEnvFile(ruta);
}
