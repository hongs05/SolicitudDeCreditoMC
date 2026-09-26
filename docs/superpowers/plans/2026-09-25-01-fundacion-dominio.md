# Plan 1 de 4: Fundación del monorepo y paquete de dominio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear el monorepo con npm workspaces y el paquete `@credito/domain` con toda la lógica de negocio pura: fechas, errores, catálogo bilingüe, motor financiero, máquina de estados, edad, roles y entidades.

**Architecture:** `packages/domain` es TypeScript puro sin dependencias en tiempo de ejecución. Se compila con tsup a ESM y CommonJS para que lo consuman el frontend (Vite) y la API (Nest). Todo se desarrolla con TDD sobre Vitest.

**Tech Stack:** Node 22, npm workspaces, TypeScript 5, tsup 8, Vitest 3, fast-check 3.

**Spec:** [docs/superpowers/specs/2026-09-24-solicitud-credito-design.md](../specs/2026-09-24-solicitud-credito-design.md)

**Orden de los planes:**

1. **Este plan:** fundación y dominio.
2. [API NestJS](2026-09-25-02-api.md).
3. [Frontend React](2026-09-25-03-web.md).
4. [Infraestructura y entrega](2026-09-25-04-infraestructura-entrega.md).

## Global Constraints

- Node `>=22`. TypeScript en modo `strict`.
- `packages/domain` no declara `dependencies`. Solo `devDependencies`.
- Nombres de negocio en español, términos técnicos en inglés. Archivos en kebab-case.
- Fechas de calendario como texto `YYYY-MM-DD`. Instantes como `Date` en UTC.
- Dinero: la única operación en punto flotante es la fórmula de la cuota. Todo lo demás en centavos enteros, redondeo mitad hacia arriba.
- Periodicidad: `ANUAL = 1`, `MENSUAL = 12`, `QUINCENAL = 24`.
- Edad máxima 80 inclusive.
- Mensajes de commit con Conventional Commits en español. Todo commit termina con la línea de atribución de IA vigente en la sesión.
- Trabajar en la rama `feat/solicitud-credito`.

## Review Focus

1. **Plazos largos con tasa alta.** Con la cuota redondeada al centavo, el sobrepago de fracciones de centavo se capitaliza. En 360 cuotas mensuales al 24 % el saldo llegaría a cero antes de la última cuota. Se espera que el saldo nunca sea negativo y que la suma del capital siga siendo exactamente el monto. Prueba en la tarea 4.
2. **Montos diminutos.** Con 0,09 en 6 cuotas, la cuota redondeada sobrepasa el monto antes del final. Se espera saldo no negativo y suma de capital exacta. Prueba en la tarea 4.
3. **Fecha base al final de mes.** Una base del 31 de enero con periodicidad quincenal debe producir vencimientos estrictamente crecientes. Prueba en la tarea 4.
4. **Cumpleaños el 29 de febrero.** Una persona nacida el 29 de febrero aún no cumple años el 28 de febrero de un año no bisiesto. Prueba en la tarea 5.
5. **Observaciones con espacios.** Las observaciones se guardan recortadas, sin espacios al inicio ni al final. Prueba en la tarea 6.

## Estructura de archivos

```
package.json                       workspaces y scripts raíz
tsconfig.base.json                 opciones compartidas
.nvmrc                             22
packages/domain/
  package.json
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  src/
    index.ts                       exportaciones públicas
    fechas.ts                      aritmética de fechas YYYY-MM-DD
    i18n/codigos.ts                códigos de error y de validación
    i18n/locale.ts                 Locale y normalización de Accept-Language
    i18n/mensajes.ts               catálogo es y en
    i18n/resolver-mensaje.ts       interpolación y traducción de parámetros
    errors/domain-error.ts         clase base y guarda de tipo
    errors/errores.ts              subclases de error
    credito/periodicidad.ts        enum y periodos por año
    credito/dinero.ts              conversión a centavos
    credito/cuota-nivelada.ts      validación de condiciones y fórmula
    credito/vencimientos.ts        fechas de vencimiento
    credito/plan-amortizacion.ts   generador del plan
    credito/credito.ts             entidad Credito
    solicitud/estado-solicitud.ts  máquina de estados
    solicitud/edad.ts              cálculo y validación de edad
    solicitud/solicitud.ts         entidad Solicitud
    auth/rol.ts                    roles y autorización
```

Cada archivo `*.ts` tiene su `*.spec.ts` al lado cuando tiene lógica.

---

### Task 1: Monorepo, paquete de dominio y aritmética de fechas

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.nvmrc`
- Create: `packages/domain/package.json`, `packages/domain/tsconfig.json`, `packages/domain/tsup.config.ts`, `packages/domain/vitest.config.ts`
- Create: `packages/domain/src/fechas.ts`, `packages/domain/src/index.ts`
- Test: `packages/domain/src/fechas.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `esFechaValida(texto: string): boolean`
  - `parsearFecha(texto: string): { anio: number; mes: number; dia: number }`, lanza `RangeError` si no es válida
  - `formatearFecha(anio: number, mes: number, dia: number): string`
  - `diasEnMes(anio: number, mes: number): number`, con `mes` de 1 a 12
  - `sumarMeses(fecha: string, meses: number): string`, recorta al último día del mes
  - `sumarDias(fecha: string, dias: number): string`
  - `fechaEnZona(instante: Date, zona: string): string`

- [ ] **Step 1: Crear los archivos del monorepo**

`package.json`:

```json
{
  "name": "solicitud-credito",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "npm run build -w @credito/domain",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^3.2.0",
    "typescript": "^5.6.0",
    "vitest": "^3.2.0"
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

`.nvmrc`:

```
22
```

- [ ] **Step 2: Crear el paquete de dominio**

`packages/domain/package.json`:

```json
{
  "name": "@credito/domain",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:cov": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "fast-check": "^3.23.0",
    "tsup": "^8.3.0"
  }
}
```

`packages/domain/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

`packages/domain/tsup.config.ts`:

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
});
```

`packages/domain/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts'],
      thresholds: { lines: 95 },
    },
  },
});
```

Run: `npm install`
Expected: se crea `package-lock.json` y `node_modules` sin errores.

- [ ] **Step 3: Escribir las pruebas de fechas**

`packages/domain/src/fechas.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  diasEnMes, esFechaValida, fechaEnZona, formatearFecha,
  parsearFecha, sumarDias, sumarMeses,
} from './fechas';

describe('fechas', () => {
  it('valida el formato YYYY-MM-DD y fechas reales', () => {
    expect(esFechaValida('2026-02-28')).toBe(true);
    expect(esFechaValida('2024-02-29')).toBe(true);
    expect(esFechaValida('2026-02-29')).toBe(false);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('26-01-01')).toBe(false);
    expect(esFechaValida('2026-1-01')).toBe(false);
  });

  it('parsea y formatea', () => {
    expect(parsearFecha('2026-09-24')).toEqual({ anio: 2026, mes: 9, dia: 24 });
    expect(formatearFecha(2026, 1, 5)).toBe('2026-01-05');
    expect(() => parsearFecha('2026-02-30')).toThrow(RangeError);
  });

  it('calcula los días de cada mes', () => {
    expect(diasEnMes(2026, 2)).toBe(28);
    expect(diasEnMes(2024, 2)).toBe(29);
    expect(diasEnMes(2026, 4)).toBe(30);
    expect(diasEnMes(2026, 12)).toBe(31);
  });

  it('suma meses recortando al último día del mes', () => {
    expect(sumarMeses('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMeses('2026-01-31', 2)).toBe('2026-03-31');
    expect(sumarMeses('2026-01-31', 12)).toBe('2027-01-31');
    expect(sumarMeses('2024-02-29', 12)).toBe('2025-02-28');
    expect(sumarMeses('2026-11-15', 3)).toBe('2027-02-15');
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-01-10', 15)).toBe('2026-01-25');
    expect(sumarDias('2026-02-28', 15)).toBe('2026-03-15');
    expect(sumarDias('2026-12-20', 15)).toBe('2027-01-04');
  });

  it('obtiene la fecha local de una zona horaria', () => {
    const instante = new Date('2026-09-25T01:00:00Z');
    expect(fechaEnZona(instante, 'America/Managua')).toBe('2026-09-24');
    expect(fechaEnZona(instante, 'UTC')).toBe('2026-09-25');
  });
});
```

- [ ] **Step 4: Ejecutar las pruebas y ver que fallan**

Run: `npm test -w @credito/domain`
Expected: FAIL, no se puede resolver `./fechas`.

- [ ] **Step 5: Implementar fechas**

`packages/domain/src/fechas.ts`:

```ts
const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
}

export function diasEnMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

export function esFechaValida(texto: string): boolean {
  const coincidencia = PATRON_FECHA.exec(texto);
  if (!coincidencia) return false;
  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);
  return mes >= 1 && mes <= 12 && dia >= 1 && dia <= diasEnMes(anio, mes);
}

export function parsearFecha(texto: string): PartesFecha {
  if (!esFechaValida(texto)) {
    throw new RangeError(`Fecha inválida: ${texto}`);
  }
  const [anio, mes, dia] = texto.split('-').map(Number) as [number, number, number];
  return { anio, mes, dia };
}

export function formatearFecha(anio: number, mes: number, dia: number): string {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function sumarMeses(fecha: string, meses: number): string {
  const { anio, mes, dia } = parsearFecha(fecha);
  const total = anio * 12 + (mes - 1) + meses;
  const nuevoAnio = Math.floor(total / 12);
  const nuevoMes = (total % 12) + 1;
  return formatearFecha(nuevoAnio, nuevoMes, Math.min(dia, diasEnMes(nuevoAnio, nuevoMes)));
}

export function sumarDias(fecha: string, dias: number): string {
  const { anio, mes, dia } = parsearFecha(fecha);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return formatearFecha(
    resultado.getUTCFullYear(),
    resultado.getUTCMonth() + 1,
    resultado.getUTCDate(),
  );
}

export function fechaEnZona(instante: Date, zona: string): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}
```

`packages/domain/src/index.ts`:

```ts
export * from './fechas';
```

- [ ] **Step 6: Ejecutar las pruebas y ver que pasan**

Run: `npm test -w @credito/domain`
Expected: PASS, 6 pruebas.

- [ ] **Step 7: Verificar la compilación**

Run: `npm run build -w @credito/domain`
Expected: existen `packages/domain/dist/index.js`, `index.cjs`, `index.d.ts` e `index.d.cts`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json .nvmrc packages/domain
git commit -m "feat(domain): monorepo y aritmética de fechas"
```

---

### Task 2: Errores de dominio y catálogo bilingüe

**Files:**
- Create: `packages/domain/src/i18n/codigos.ts`, `packages/domain/src/i18n/locale.ts`, `packages/domain/src/i18n/mensajes.ts`, `packages/domain/src/i18n/resolver-mensaje.ts`
- Create: `packages/domain/src/errors/domain-error.ts`, `packages/domain/src/errors/errores.ts`
- Create: `packages/domain/src/solicitud/estado-solicitud.ts` (solo el enum y el tipo `Accion`; la lógica llega en la tarea 5)
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/i18n/i18n.spec.ts`, `packages/domain/src/errors/errores.spec.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `type Locale = 'es' | 'en'`, `LOCALES: readonly Locale[]`, `LOCALE_POR_DEFECTO: Locale`
  - `normalizarLocale(valor?: string | string[] | null): Locale`
  - `CODIGOS_ERROR`, `type CodigoError`, `CODIGOS_VALIDACION`, `type CodigoValidacion`, `type CodigoMensaje = CodigoError | CodigoValidacion`
  - `MENSAJES: Record<Locale, Record<CodigoMensaje, string>>`
  - `resolverMensaje(code: string, params?: Record<string, unknown>, locale?: Locale): string`
  - `abstract class DomainError extends Error { code: CodigoError; httpStatus: number; params: Record<string, unknown> }`
  - `esDomainError(valor: unknown): valor is DomainError`
  - `type Recurso = 'Solicitud' | 'Credito' | 'Banco' | 'TipoEmpleo' | 'Usuario' | 'Recurso'`
  - Clases: `TransicionInvalidaError(accion: Accion, estado: EstadoSolicitud)`, `CreditoYaDesembolsadoError()`, `EdadMaximaExcedidaError(edad: number)`, `ObservacionesRequeridasError()`, `CreditoNoAprobadoError(estado: EstadoSolicitud)`, `ParametrosCreditoInvalidosError(campo: CampoCredito)`, `NoEncontradoError(recurso: Recurso)`, `TokenRevocadoError()`, `NoAutenticadoError()`
  - `type CampoCredito = 'monto' | 'cuotas' | 'tasaAnual' | 'periodicidad'`
  - `enum EstadoSolicitud { PENDIENTE, APROBADA, RECHAZADA, DESEMBOLSADA }` con valores string iguales al nombre
  - `type Accion = 'aprobar' | 'rechazar' | 'desembolsar'`

- [ ] **Step 1: Crear el enum de estados y el tipo de acción**

`packages/domain/src/solicitud/estado-solicitud.ts`:

```ts
export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  DESEMBOLSADA = 'DESEMBOLSADA',
}

export type Accion = 'aprobar' | 'rechazar' | 'desembolsar';
```

- [ ] **Step 2: Escribir las pruebas del catálogo**

`packages/domain/src/i18n/i18n.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CODIGOS_ERROR, CODIGOS_VALIDACION } from './codigos';
import { normalizarLocale } from './locale';
import { MENSAJES } from './mensajes';
import { resolverMensaje } from './resolver-mensaje';

const TODOS = [...CODIGOS_ERROR, ...CODIGOS_VALIDACION];
const placeholders = (texto: string) =>
  [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('catálogo de mensajes', () => {
  it.each(TODOS)('%s tiene mensaje en es y en con los mismos placeholders', (code) => {
    expect(MENSAJES.es[code]).toBeTruthy();
    expect(MENSAJES.en[code]).toBeTruthy();
    expect(placeholders(MENSAJES.en[code])).toEqual(placeholders(MENSAJES.es[code]));
  });

  it.each(TODOS)('%s no deja placeholders sin reemplazar', (code) => {
    const params = Object.fromEntries(
      placeholders(MENSAJES.es[code]).map((clave) => [clave, 'x']),
    );
    expect(resolverMensaje(code, params, 'es')).not.toMatch(/\{\w+\}/);
    expect(resolverMensaje(code, params, 'en')).not.toMatch(/\{\w+\}/);
  });
});

describe('resolverMensaje', () => {
  it('interpola y traduce valores conocidos', () => {
    expect(resolverMensaje('TRANSICION_INVALIDA', { accion: 'aprobar', estado: 'APROBADA' }, 'es'))
      .toBe('No se puede aprobar una solicitud en estado aprobada');
    expect(resolverMensaje('TRANSICION_INVALIDA', { accion: 'aprobar', estado: 'APROBADA' }, 'en'))
      .toBe('Cannot approve an application in approved state');
    expect(resolverMensaje('NO_ENCONTRADO', { recurso: 'Credito' }, 'es'))
      .toBe('No se encontró el crédito');
    expect(resolverMensaje('NO_ENCONTRADO', { recurso: 'Credito' }, 'en'))
      .toBe('Credit not found');
    expect(resolverMensaje('EDAD_MAXIMA_EXCEDIDA', { edad: 81 }, 'es'))
      .toBe('El solicitante tiene 81 años; el máximo es 80');
  });

  it('usa ERROR_INTERNO para un código desconocido', () => {
    expect(resolverMensaje('NO_EXISTE', {}, 'en')).toBe(MENSAJES.en.ERROR_INTERNO);
  });

  it('usa es por defecto', () => {
    expect(resolverMensaje('PROHIBIDO')).toBe(MENSAJES.es.PROHIBIDO);
  });
});

describe('normalizarLocale', () => {
  it.each([
    [undefined, 'es'],
    [null, 'es'],
    ['', 'es'],
    ['en', 'en'],
    ['en-US,en;q=0.9', 'en'],
    ['fr-FR,en;q=0.8', 'en'],
    ['fr-FR', 'es'],
    ['ES-ni', 'es'],
    [['en-GB'], 'en'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarLocale(entrada as string | string[] | null | undefined)).toBe(esperado);
  });
});
```

`packages/domain/src/errors/errores.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { EstadoSolicitud } from '../solicitud/estado-solicitud';
import { esDomainError } from './domain-error';
import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError, EdadMaximaExcedidaError,
  NoAutenticadoError, NoEncontradoError, ObservacionesRequeridasError,
  ParametrosCreditoInvalidosError, TokenRevocadoError, TransicionInvalidaError,
} from './errores';

describe('errores de dominio', () => {
  it.each([
    [new TransicionInvalidaError('aprobar', EstadoSolicitud.APROBADA), 'TRANSICION_INVALIDA', 409, { accion: 'aprobar', estado: 'APROBADA' }],
    [new CreditoYaDesembolsadoError(), 'CREDITO_YA_DESEMBOLSADO', 409, {}],
    [new EdadMaximaExcedidaError(81), 'EDAD_MAXIMA_EXCEDIDA', 422, { edad: 81 }],
    [new ObservacionesRequeridasError(), 'OBSERVACIONES_REQUERIDAS', 422, {}],
    [new CreditoNoAprobadoError(EstadoSolicitud.PENDIENTE), 'CREDITO_NO_APROBADO', 422, { estado: 'PENDIENTE' }],
    [new ParametrosCreditoInvalidosError('monto'), 'PARAMETROS_CREDITO_INVALIDOS', 422, { campo: 'monto' }],
    [new NoEncontradoError('Banco'), 'NO_ENCONTRADO', 404, { recurso: 'Banco' }],
    [new TokenRevocadoError(), 'TOKEN_REVOCADO', 401, {}],
    [new NoAutenticadoError(), 'NO_AUTENTICADO', 401, {}],
  ])('%o expone code, httpStatus y params', (error, code, status, params) => {
    expect(error.code).toBe(code);
    expect(error.httpStatus).toBe(status);
    expect(error.params).toEqual(params);
    expect(error).toBeInstanceOf(Error);
    expect(esDomainError(error)).toBe(true);
  });

  it('esDomainError rechaza errores comunes', () => {
    expect(esDomainError(new Error('x'))).toBe(false);
    expect(esDomainError({ code: 'X' })).toBe(false);
    expect(esDomainError(null)).toBe(false);
  });
});
```

- [ ] **Step 3: Ejecutar las pruebas y ver que fallan**

Run: `npm test -w @credito/domain`
Expected: FAIL, no se resuelven `./codigos` ni `./domain-error`.

- [ ] **Step 4: Implementar códigos y locale**

`packages/domain/src/i18n/codigos.ts`:

```ts
export const CODIGOS_ERROR = [
  'VALIDACION',
  'NO_AUTENTICADO',
  'TOKEN_REVOCADO',
  'PROHIBIDO',
  'NO_ENCONTRADO',
  'TRANSICION_INVALIDA',
  'CREDITO_YA_DESEMBOLSADO',
  'EDAD_MAXIMA_EXCEDIDA',
  'OBSERVACIONES_REQUERIDAS',
  'CREDITO_NO_APROBADO',
  'PARAMETROS_CREDITO_INVALIDOS',
  'ERROR_INTERNO',
] as const;

export type CodigoError = (typeof CODIGOS_ERROR)[number];

export const CODIGOS_VALIDACION = [
  'REQUERIDO',
  'CORREO_INVALIDO',
  'VALOR_MINIMO',
  'VALOR_MAXIMO',
  'LONGITUD_INVALIDA',
  'ENTERO_REQUERIDO',
  'FECHA_INVALIDA',
  'FORMATO_INVALIDO',
  'VALOR_NO_PERMITIDO',
  'VALOR_INVALIDO',
] as const;

export type CodigoValidacion = (typeof CODIGOS_VALIDACION)[number];

export type CodigoMensaje = CodigoError | CodigoValidacion;
```

`packages/domain/src/i18n/locale.ts`:

```ts
export type Locale = 'es' | 'en';

export const LOCALES: readonly Locale[] = ['es', 'en'];
export const LOCALE_POR_DEFECTO: Locale = 'es';

const esLocale = (valor: string): valor is Locale => (LOCALES as readonly string[]).includes(valor);

export function normalizarLocale(valor?: string | string[] | null): Locale {
  const texto = Array.isArray(valor) ? valor.join(',') : valor ?? '';
  for (const parte of texto.split(',')) {
    const primario = parte.split(';')[0]?.trim().toLowerCase().split('-')[0] ?? '';
    if (esLocale(primario)) return primario;
  }
  return LOCALE_POR_DEFECTO;
}
```

- [ ] **Step 5: Implementar el catálogo de mensajes**

`packages/domain/src/i18n/mensajes.ts`:

```ts
import type { CodigoMensaje } from './codigos';
import type { Locale } from './locale';

export const MENSAJES: Record<Locale, Record<CodigoMensaje, string>> = {
  es: {
    VALIDACION: 'Datos inválidos',
    NO_AUTENTICADO: 'Credenciales inválidas o sesión expirada',
    TOKEN_REVOCADO: 'La sesión fue revocada, inicia sesión de nuevo',
    PROHIBIDO: 'No tienes permiso para esta acción',
    NO_ENCONTRADO: 'No se encontró {recurso}',
    TRANSICION_INVALIDA: 'No se puede {accion} una solicitud en estado {estado}',
    CREDITO_YA_DESEMBOLSADO: 'El crédito ya fue desembolsado',
    EDAD_MAXIMA_EXCEDIDA: 'El solicitante tiene {edad} años; el máximo es 80',
    OBSERVACIONES_REQUERIDAS: 'Las observaciones son obligatorias',
    CREDITO_NO_APROBADO: 'Solo se desembolsan créditos aprobados',
    PARAMETROS_CREDITO_INVALIDOS: 'Condiciones del crédito inválidas: {campo}',
    ERROR_INTERNO: 'Ocurrió un error inesperado',
    REQUERIDO: 'Este campo es obligatorio',
    CORREO_INVALIDO: 'El correo electrónico no es válido',
    VALOR_MINIMO: 'El valor mínimo es {min}',
    VALOR_MAXIMO: 'El valor máximo es {max}',
    LONGITUD_INVALIDA: 'Debe tener entre {min} y {max} caracteres',
    ENTERO_REQUERIDO: 'Debe ser un número entero',
    FECHA_INVALIDA: 'La fecha no es válida',
    FORMATO_INVALIDO: 'El formato no es válido',
    VALOR_NO_PERMITIDO: 'El valor no está permitido',
    VALOR_INVALIDO: 'El valor no es válido',
  },
  en: {
    VALIDACION: 'Invalid data',
    NO_AUTENTICADO: 'Invalid credentials or expired session',
    TOKEN_REVOCADO: 'Session revoked, please sign in again',
    PROHIBIDO: 'You are not allowed to perform this action',
    NO_ENCONTRADO: '{recurso} not found',
    TRANSICION_INVALIDA: 'Cannot {accion} an application in {estado} state',
    CREDITO_YA_DESEMBOLSADO: 'Credit already disbursed',
    EDAD_MAXIMA_EXCEDIDA: 'Applicant is {edad}; maximum is 80',
    OBSERVACIONES_REQUERIDAS: 'Observations are required',
    CREDITO_NO_APROBADO: 'Only approved credits can be disbursed',
    PARAMETROS_CREDITO_INVALIDOS: 'Invalid credit terms: {campo}',
    ERROR_INTERNO: 'An unexpected error occurred',
    REQUERIDO: 'This field is required',
    CORREO_INVALIDO: 'Invalid email address',
    VALOR_MINIMO: 'Minimum value is {min}',
    VALOR_MAXIMO: 'Maximum value is {max}',
    LONGITUD_INVALIDA: 'Must be between {min} and {max} characters',
    ENTERO_REQUERIDO: 'Must be a whole number',
    FECHA_INVALIDA: 'Invalid date',
    FORMATO_INVALIDO: 'Invalid format',
    VALOR_NO_PERMITIDO: 'Value not allowed',
    VALOR_INVALIDO: 'Invalid value',
  },
};

export const VALORES_TRADUCIBLES: Record<Locale, Record<string, Record<string, string>>> = {
  es: {
    recurso: {
      Solicitud: 'la solicitud',
      Credito: 'el crédito',
      Banco: 'el banco',
      TipoEmpleo: 'el tipo de empleo',
      Usuario: 'el usuario',
      Recurso: 'el recurso',
    },
    accion: { aprobar: 'aprobar', rechazar: 'rechazar', desembolsar: 'desembolsar' },
    estado: {
      PENDIENTE: 'pendiente',
      APROBADA: 'aprobada',
      RECHAZADA: 'rechazada',
      DESEMBOLSADA: 'desembolsada',
    },
    campo: {
      monto: 'monto',
      cuotas: 'cantidad de cuotas',
      tasaAnual: 'tasa anual',
      periodicidad: 'periodicidad',
    },
  },
  en: {
    recurso: {
      Solicitud: 'Application',
      Credito: 'Credit',
      Banco: 'Bank',
      TipoEmpleo: 'Employment type',
      Usuario: 'User',
      Recurso: 'Resource',
    },
    accion: { aprobar: 'approve', rechazar: 'reject', desembolsar: 'disburse' },
    estado: {
      PENDIENTE: 'pending',
      APROBADA: 'approved',
      RECHAZADA: 'rejected',
      DESEMBOLSADA: 'disbursed',
    },
    campo: {
      monto: 'amount',
      cuotas: 'number of installments',
      tasaAnual: 'annual rate',
      periodicidad: 'payment frequency',
    },
  },
};
```

El mensaje de `NO_ENCONTRADO` en español se redacta como "No se encontró {recurso}" en vez de "{recurso} no encontrado", para que concuerde en género con cada recurso.

`packages/domain/src/i18n/resolver-mensaje.ts`:

```ts
import type { CodigoMensaje } from './codigos';
import { LOCALE_POR_DEFECTO, type Locale } from './locale';
import { MENSAJES, VALORES_TRADUCIBLES } from './mensajes';

export function resolverMensaje(
  code: string,
  params: Record<string, unknown> = {},
  locale: Locale = LOCALE_POR_DEFECTO,
): string {
  const clave = code as CodigoMensaje;
  const plantilla =
    MENSAJES[locale][clave] ?? MENSAJES[LOCALE_POR_DEFECTO][clave] ?? MENSAJES[locale].ERROR_INTERNO;

  return plantilla.replace(/\{(\w+)\}/g, (original, nombre: string) => {
    if (!(nombre in params)) return original;
    const valor = String(params[nombre]);
    return VALORES_TRADUCIBLES[locale][nombre]?.[valor] ?? valor;
  });
}
```

- [ ] **Step 6: Implementar los errores**

`packages/domain/src/errors/domain-error.ts`:

```ts
import type { CodigoError } from '../i18n/codigos';

export abstract class DomainError extends Error {
  protected constructor(
    readonly code: CodigoError,
    readonly httpStatus: number,
    readonly params: Record<string, unknown> = {},
  ) {
    super(code);
    this.name = new.target.name;
  }
}

export function esDomainError(valor: unknown): valor is DomainError {
  if (valor instanceof DomainError) return true;
  return (
    valor instanceof Error &&
    typeof (valor as Partial<DomainError>).code === 'string' &&
    typeof (valor as Partial<DomainError>).httpStatus === 'number' &&
    typeof (valor as Partial<DomainError>).params === 'object'
  );
}
```

`esDomainError` también reconoce errores por su forma. Así sigue funcionando si alguna vez se cargan a la vez la copia ESM y la CommonJS del paquete.

`packages/domain/src/errors/errores.ts`:

```ts
import type { Accion, EstadoSolicitud } from '../solicitud/estado-solicitud';
import { DomainError } from './domain-error';

export type Recurso = 'Solicitud' | 'Credito' | 'Banco' | 'TipoEmpleo' | 'Usuario' | 'Recurso';
export type CampoCredito = 'monto' | 'cuotas' | 'tasaAnual' | 'periodicidad';

export class TransicionInvalidaError extends DomainError {
  constructor(accion: Accion, estado: EstadoSolicitud) {
    super('TRANSICION_INVALIDA', 409, { accion, estado });
  }
}

export class CreditoYaDesembolsadoError extends DomainError {
  constructor() {
    super('CREDITO_YA_DESEMBOLSADO', 409);
  }
}

export class EdadMaximaExcedidaError extends DomainError {
  constructor(edad: number) {
    super('EDAD_MAXIMA_EXCEDIDA', 422, { edad });
  }
}

export class ObservacionesRequeridasError extends DomainError {
  constructor() {
    super('OBSERVACIONES_REQUERIDAS', 422);
  }
}

export class CreditoNoAprobadoError extends DomainError {
  constructor(estado: EstadoSolicitud) {
    super('CREDITO_NO_APROBADO', 422, { estado });
  }
}

export class ParametrosCreditoInvalidosError extends DomainError {
  constructor(campo: CampoCredito) {
    super('PARAMETROS_CREDITO_INVALIDOS', 422, { campo });
  }
}

export class NoEncontradoError extends DomainError {
  constructor(recurso: Recurso) {
    super('NO_ENCONTRADO', 404, { recurso });
  }
}

export class TokenRevocadoError extends DomainError {
  constructor() {
    super('TOKEN_REVOCADO', 401);
  }
}

export class NoAutenticadoError extends DomainError {
  constructor() {
    super('NO_AUTENTICADO', 401);
  }
}
```

`packages/domain/src/index.ts`:

```ts
export * from './fechas';
export * from './i18n/codigos';
export * from './i18n/locale';
export * from './i18n/mensajes';
export * from './i18n/resolver-mensaje';
export * from './errors/domain-error';
export * from './errors/errores';
export * from './solicitud/estado-solicitud';
```

- [ ] **Step 7: Ejecutar las pruebas y ver que pasan**

Run: `npm test -w @credito/domain`
Expected: PASS en `i18n.spec.ts`, `errores.spec.ts` y `fechas.spec.ts`.

- [ ] **Step 8: Commit**

```bash
git add packages/domain/src
git commit -m "feat(domain): errores de dominio y catálogo de mensajes es/en"
```

---

### Task 3: Periodicidad, dinero y cuota nivelada

**Files:**
- Create: `packages/domain/src/credito/periodicidad.ts`, `packages/domain/src/credito/dinero.ts`, `packages/domain/src/credito/cuota-nivelada.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/credito/cuota-nivelada.spec.ts`

**Interfaces:**
- Consumes: `ParametrosCreditoInvalidosError` de la tarea 2.
- Produces:
  - `enum Periodicidad { QUINCENAL = 'QUINCENAL', MENSUAL = 'MENSUAL', ANUAL = 'ANUAL' }`
  - `PERIODOS_POR_ANIO: Record<Periodicidad, number>`
  - `esPeriodicidad(valor: string): valor is Periodicidad`
  - `aCentavos(monto: number): number`, `aUnidades(centavos: number): number`
  - `interface CondicionesCredito { monto: number; tasaAnual: number; cuotas: number; periodicidad: Periodicidad }`
  - `validarCondiciones(c: CondicionesCredito): void`
  - `tasaPeriodica(tasaAnual: number, periodicidad: Periodicidad): number`
  - `cuotaNiveladaEnCentavos(c: CondicionesCredito): number`
  - `calcularCuotaNivelada(c: CondicionesCredito): number`

- [ ] **Step 1: Escribir las pruebas**

`packages/domain/src/credito/cuota-nivelada.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ParametrosCreditoInvalidosError } from '../errors/errores';
import { calcularCuotaNivelada, tasaPeriodica, validarCondiciones } from './cuota-nivelada';
import { aCentavos, aUnidades } from './dinero';
import { esPeriodicidad, Periodicidad, PERIODOS_POR_ANIO } from './periodicidad';

describe('periodicidad', () => {
  it('usa n = 1, 12 y 24', () => {
    expect(PERIODOS_POR_ANIO).toEqual({ ANUAL: 1, MENSUAL: 12, QUINCENAL: 24 });
  });

  it('reconoce valores válidos', () => {
    expect(esPeriodicidad('MENSUAL')).toBe(true);
    expect(esPeriodicidad('SEMANAL')).toBe(false);
  });
});

describe('dinero', () => {
  it('convierte a centavos redondeando', () => {
    expect(aCentavos(10000)).toBe(1_000_000);
    expect(aCentavos(0.1 + 0.2)).toBe(30);
    expect(aCentavos(1.005)).toBe(100);
    expect(aUnidades(88849)).toBe(888.49);
  });
});

describe('tasaPeriodica', () => {
  it.each([
    [12, Periodicidad.MENSUAL, 0.01],
    [24, Periodicidad.QUINCENAL, 0.01],
    [10, Periodicidad.ANUAL, 0.1],
    [0, Periodicidad.MENSUAL, 0],
  ])('%d %% %s → %d', (tasa, periodicidad, esperado) => {
    expect(tasaPeriodica(tasa, periodicidad)).toBeCloseTo(esperado, 12);
  });
});

describe('calcularCuotaNivelada', () => {
  it.each([
    ['A', 10000, 12, 12, Periodicidad.MENSUAL, 888.49],
    ['B', 1000, 0, 3, Periodicidad.MENSUAL, 333.33],
    ['C', 5000, 10, 2, Periodicidad.ANUAL, 2880.95],
    ['D', 2000, 24, 24, Periodicidad.QUINCENAL, 94.15],
  ])('caso %s', (_caso, monto, tasaAnual, cuotas, periodicidad, esperado) => {
    expect(calcularCuotaNivelada({ monto, tasaAnual, cuotas, periodicidad })).toBe(esperado);
  });

  it('una sola cuota sin interés devuelve el monto', () => {
    expect(calcularCuotaNivelada({ monto: 500, tasaAnual: 0, cuotas: 1, periodicidad: Periodicidad.ANUAL })).toBe(500);
  });
});

describe('validarCondiciones', () => {
  const base = { monto: 1000, tasaAnual: 12, cuotas: 12, periodicidad: Periodicidad.MENSUAL };

  it.each([
    [{ monto: 0 }, 'monto'],
    [{ monto: -5 }, 'monto'],
    [{ monto: Number.NaN }, 'monto'],
    [{ cuotas: 0 }, 'cuotas'],
    [{ cuotas: 1.5 }, 'cuotas'],
    [{ tasaAnual: -1 }, 'tasaAnual'],
    [{ tasaAnual: 100.01 }, 'tasaAnual'],
    [{ periodicidad: 'SEMANAL' as Periodicidad }, 'periodicidad'],
  ])('%o falla en %s', (cambio, campo) => {
    const accion = () => validarCondiciones({ ...base, ...cambio });
    expect(accion).toThrow(ParametrosCreditoInvalidosError);
    try {
      accion();
    } catch (error) {
      expect((error as ParametrosCreditoInvalidosError).params).toEqual({ campo });
    }
  });

  it('acepta tasa 0 y tasa 100', () => {
    expect(() => validarCondiciones({ ...base, tasaAnual: 0 })).not.toThrow();
    expect(() => validarCondiciones({ ...base, tasaAnual: 100 })).not.toThrow();
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y ver que fallan**

Run: `npm test -w @credito/domain -- cuota-nivelada`
Expected: FAIL, no se resuelve `./cuota-nivelada`.

- [ ] **Step 3: Implementar**

`packages/domain/src/credito/periodicidad.ts`:

```ts
export enum Periodicidad {
  QUINCENAL = 'QUINCENAL',
  MENSUAL = 'MENSUAL',
  ANUAL = 'ANUAL',
}

export const PERIODOS_POR_ANIO: Record<Periodicidad, number> = {
  [Periodicidad.ANUAL]: 1,
  [Periodicidad.MENSUAL]: 12,
  [Periodicidad.QUINCENAL]: 24,
};

export function esPeriodicidad(valor: string): valor is Periodicidad {
  return (Object.values(Periodicidad) as string[]).includes(valor);
}
```

`packages/domain/src/credito/dinero.ts`:

```ts
export const aCentavos = (monto: number): number => Math.round(monto * 100);

export const aUnidades = (centavos: number): number => centavos / 100;
```

`packages/domain/src/credito/cuota-nivelada.ts`:

```ts
import { ParametrosCreditoInvalidosError } from '../errors/errores';
import { aCentavos, aUnidades } from './dinero';
import { esPeriodicidad, Periodicidad, PERIODOS_POR_ANIO } from './periodicidad';

export interface CondicionesCredito {
  monto: number;
  tasaAnual: number;
  cuotas: number;
  periodicidad: Periodicidad;
}

export function validarCondiciones(c: CondicionesCredito): void {
  if (!Number.isFinite(c.monto) || c.monto <= 0) {
    throw new ParametrosCreditoInvalidosError('monto');
  }
  if (!Number.isInteger(c.cuotas) || c.cuotas < 1) {
    throw new ParametrosCreditoInvalidosError('cuotas');
  }
  if (!Number.isFinite(c.tasaAnual) || c.tasaAnual < 0 || c.tasaAnual > 100) {
    throw new ParametrosCreditoInvalidosError('tasaAnual');
  }
  if (!esPeriodicidad(c.periodicidad)) {
    throw new ParametrosCreditoInvalidosError('periodicidad');
  }
}

export function tasaPeriodica(tasaAnual: number, periodicidad: Periodicidad): number {
  return tasaAnual / 100 / PERIODOS_POR_ANIO[periodicidad];
}

export function cuotaNiveladaEnCentavos(c: CondicionesCredito): number {
  validarCondiciones(c);
  const montoCentavos = aCentavos(c.monto);
  const i = tasaPeriodica(c.tasaAnual, c.periodicidad);
  if (i === 0) {
    return Math.round(montoCentavos / c.cuotas);
  }
  const factor = Math.pow(1 + i, c.cuotas);
  return Math.round((montoCentavos * (i * factor)) / (factor - 1));
}

export function calcularCuotaNivelada(c: CondicionesCredito): number {
  return aUnidades(cuotaNiveladaEnCentavos(c));
}
```

Agregar a `packages/domain/src/index.ts`:

```ts
export * from './credito/periodicidad';
export * from './credito/dinero';
export * from './credito/cuota-nivelada';
```

- [ ] **Step 4: Ejecutar las pruebas y ver que pasan**

Run: `npm test -w @credito/domain -- cuota-nivelada`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src
git commit -m "feat(domain): periodicidad y cálculo de cuota nivelada"
```

---

### Task 4: Vencimientos y plan de amortización

**Files:**
- Create: `packages/domain/src/credito/vencimientos.ts`, `packages/domain/src/credito/plan-amortizacion.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/credito/vencimientos.spec.ts`, `packages/domain/src/credito/plan-amortizacion.spec.ts`

**Interfaces:**
- Consumes: `sumarMeses`, `sumarDias` de la tarea 1. `CondicionesCredito`, `cuotaNiveladaEnCentavos`, `tasaPeriodica`, `aCentavos`, `aUnidades`, `Periodicidad` de la tarea 3.
- Produces:
  - `fechaVencimiento(fechaBase: string, periodicidad: Periodicidad, numero: number): string`
  - `interface CuotaPlan { numero: number; fechaVencimiento: string; capital: number; interes: number; valorCuota: number; saldoRestante: number }`
  - `interface ParametrosPlan extends CondicionesCredito { fechaBase: string }`
  - `generarPlanAmortizacion(p: ParametrosPlan): CuotaPlan[]`

- [ ] **Step 1: Escribir las pruebas de vencimientos**

`packages/domain/src/credito/vencimientos.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Periodicidad } from './periodicidad';
import { fechaVencimiento } from './vencimientos';

describe('fechaVencimiento', () => {
  it.each([
    ['2026-01-31', Periodicidad.MENSUAL, 1, '2026-02-28'],
    ['2026-01-31', Periodicidad.MENSUAL, 2, '2026-03-31'],
    ['2026-01-31', Periodicidad.MENSUAL, 12, '2027-01-31'],
    ['2026-01-10', Periodicidad.QUINCENAL, 1, '2026-01-25'],
    ['2026-01-10', Periodicidad.QUINCENAL, 2, '2026-02-10'],
    ['2026-01-10', Periodicidad.QUINCENAL, 3, '2026-02-25'],
    ['2026-01-10', Periodicidad.QUINCENAL, 24, '2027-01-10'],
    ['2024-02-29', Periodicidad.ANUAL, 1, '2025-02-28'],
  ])('base %s %s cuota %d vence %s', (base, periodicidad, numero, esperado) => {
    expect(fechaVencimiento(base, periodicidad, numero)).toBe(esperado);
  });

  it('una base a fin de mes produce vencimientos quincenales estrictamente crecientes', () => {
    const fechas = Array.from({ length: 48 }, (_, k) =>
      fechaVencimiento('2026-01-31', Periodicidad.QUINCENAL, k + 1),
    );
    for (let k = 1; k < fechas.length; k++) {
      expect(fechas[k]! > fechas[k - 1]!).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Escribir las pruebas del plan**

`packages/domain/src/credito/plan-amortizacion.spec.ts`:

```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { aCentavos } from './dinero';
import { Periodicidad } from './periodicidad';
import { type CuotaPlan, generarPlanAmortizacion } from './plan-amortizacion';

const fila = (plan: CuotaPlan[], numero: number) => {
  const { capital, interes, valorCuota, saldoRestante } = plan[numero - 1]!;
  return [capital, interes, valorCuota, saldoRestante];
};
const sumaCentavos = (plan: CuotaPlan[], campo: 'capital' | 'interes') =>
  plan.reduce((total, cuota) => total + aCentavos(cuota[campo]), 0);

describe('generarPlanAmortizacion: casos de referencia', () => {
  it('A: 10 000 al 12 %, 12 cuotas mensuales', () => {
    const plan = generarPlanAmortizacion({
      monto: 10000, tasaAnual: 12, cuotas: 12,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-31',
    });
    expect(plan).toHaveLength(12);
    expect(fila(plan, 1)).toEqual([788.49, 100, 888.49, 9211.51]);
    expect(fila(plan, 2)).toEqual([796.37, 92.12, 888.49, 8415.14]);
    expect(fila(plan, 11)).toEqual([870.98, 17.51, 888.49, 879.67]);
    expect(fila(plan, 12)).toEqual([879.67, 8.8, 888.47, 0]);
    expect(sumaCentavos(plan, 'capital')).toBe(1_000_000);
    expect(sumaCentavos(plan, 'interes')).toBe(66_186);
    expect(plan[0]!.fechaVencimiento).toBe('2026-02-28');
    expect(plan[11]!.fechaVencimiento).toBe('2027-01-31');
  });

  it('B: 1 000 al 0 %, 3 cuotas mensuales', () => {
    const plan = generarPlanAmortizacion({
      monto: 1000, tasaAnual: 0, cuotas: 3,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-10',
    });
    expect(fila(plan, 1)).toEqual([333.33, 0, 333.33, 666.67]);
    expect(fila(plan, 2)).toEqual([333.33, 0, 333.33, 333.34]);
    expect(fila(plan, 3)).toEqual([333.34, 0, 333.34, 0]);
  });

  it('C: 5 000 al 10 %, 2 cuotas anuales', () => {
    const plan = generarPlanAmortizacion({
      monto: 5000, tasaAnual: 10, cuotas: 2,
      periodicidad: Periodicidad.ANUAL, fechaBase: '2026-01-10',
    });
    expect(fila(plan, 1)).toEqual([2380.95, 500, 2880.95, 2619.05]);
    expect(fila(plan, 2)).toEqual([2619.05, 261.9, 2880.95, 0]);
  });

  it('D: 2 000 al 24 %, 24 cuotas quincenales', () => {
    const plan = generarPlanAmortizacion({
      monto: 2000, tasaAnual: 24, cuotas: 24,
      periodicidad: Periodicidad.QUINCENAL, fechaBase: '2026-01-10',
    });
    expect(fila(plan, 1)).toEqual([74.15, 20, 94.15, 1925.85]);
    expect(fila(plan, 2)).toEqual([74.89, 19.26, 94.15, 1850.96]);
    expect(fila(plan, 23)).toEqual([92.3, 1.85, 94.15, 93.13]);
    expect(fila(plan, 24)).toEqual([93.13, 0.93, 94.06, 0]);
    expect(plan[0]!.fechaVencimiento).toBe('2026-01-25');
    expect(plan[23]!.fechaVencimiento).toBe('2027-01-10');
  });
});

describe('generarPlanAmortizacion: casos límite', () => {
  it('con un monto diminuto el saldo nunca es negativo y el capital suma el monto', () => {
    const plan = generarPlanAmortizacion({
      monto: 0.09, tasaAnual: 0, cuotas: 6,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-10',
    });
    expect(plan).toHaveLength(6);
    expect(sumaCentavos(plan, 'capital')).toBe(9);
    expect(plan.every((c) => c.saldoRestante >= 0 && c.capital >= 0)).toBe(true);
    expect(plan[5]!.saldoRestante).toBe(0);
  });

  it('con 360 cuotas al 24 % el saldo nunca es negativo y el capital suma el monto', () => {
    const plan = generarPlanAmortizacion({
      monto: 100000, tasaAnual: 24, cuotas: 360,
      periodicidad: Periodicidad.MENSUAL, fechaBase: '2026-01-10',
    });
    expect(plan).toHaveLength(360);
    expect(sumaCentavos(plan, 'capital')).toBe(10_000_000);
    expect(plan.every((c) => c.saldoRestante >= 0 && c.interes >= 0)).toBe(true);
    expect(plan[359]!.saldoRestante).toBe(0);
  });
});

describe('generarPlanAmortizacion: invariantes', () => {
  const periodicidadYMaximo = fc.constantFrom(
    [Periodicidad.MENSUAL, 120] as const,
    [Periodicidad.QUINCENAL, 180] as const,
    [Periodicidad.ANUAL, 20] as const,
  );

  it('se cumplen para condiciones realistas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100_000, max: 1_000_000_000 }),
        fc.integer({ min: 0, max: 3_600 }),
        periodicidadYMaximo.chain(([periodicidad, maximo]) =>
          fc.tuple(fc.constant(periodicidad), fc.integer({ min: 1, max: maximo })),
        ),
        (montoCentavos, tasaCentesimas, [periodicidad, cuotas]) => {
          const plan = generarPlanAmortizacion({
            monto: montoCentavos / 100,
            tasaAnual: tasaCentesimas / 100,
            cuotas,
            periodicidad,
            fechaBase: '2026-01-31',
          });
          expect(plan).toHaveLength(cuotas);
          expect(sumaCentavos(plan, 'capital')).toBe(montoCentavos);
          expect(plan[cuotas - 1]!.saldoRestante).toBe(0);
          for (const cuota of plan) {
            expect(cuota.interes).toBeGreaterThanOrEqual(0);
            expect(cuota.saldoRestante).toBeGreaterThanOrEqual(0);
          }
          const primeras = plan.slice(0, -1).map((c) => c.valorCuota);
          expect(new Set(primeras).size).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 300 },
    );
  });
});
```

Los rangos de la prueba de invariantes limitan monto, tasa y plazo a valores donde la regla "todas las cuotas iguales salvo la última" se cumple con cuota redondeada al centavo. Fuera de ese rango, el caso de 360 cuotas al 24 % cubre las garantías que sí deben mantenerse siempre.

- [ ] **Step 3: Ejecutar las pruebas y ver que fallan**

Run: `npm test -w @credito/domain -- vencimientos plan-amortizacion`
Expected: FAIL, no se resuelven los módulos.

- [ ] **Step 4: Implementar vencimientos**

`packages/domain/src/credito/vencimientos.ts`:

```ts
import { sumarDias, sumarMeses } from '../fechas';
import { Periodicidad } from './periodicidad';

export function fechaVencimiento(fechaBase: string, periodicidad: Periodicidad, numero: number): string {
  switch (periodicidad) {
    case Periodicidad.ANUAL:
      return sumarMeses(fechaBase, 12 * numero);
    case Periodicidad.MENSUAL:
      return sumarMeses(fechaBase, numero);
    case Periodicidad.QUINCENAL: {
      const inicioDeMes = sumarMeses(fechaBase, Math.floor(numero / 2));
      return numero % 2 === 1 ? sumarDias(inicioDeMes, 15) : inicioDeMes;
    }
  }
}
```

- [ ] **Step 5: Implementar el plan**

`packages/domain/src/credito/plan-amortizacion.ts`:

```ts
import { type CondicionesCredito, cuotaNiveladaEnCentavos, tasaPeriodica } from './cuota-nivelada';
import { aCentavos, aUnidades } from './dinero';
import { fechaVencimiento } from './vencimientos';

export interface CuotaPlan {
  numero: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  valorCuota: number;
  saldoRestante: number;
}

export interface ParametrosPlan extends CondicionesCredito {
  fechaBase: string;
}

export function generarPlanAmortizacion(p: ParametrosPlan): CuotaPlan[] {
  const cuotaCentavos = cuotaNiveladaEnCentavos(p);
  const i = tasaPeriodica(p.tasaAnual, p.periodicidad);
  let saldoCentavos = aCentavos(p.monto);
  const plan: CuotaPlan[] = [];

  for (let numero = 1; numero <= p.cuotas; numero++) {
    const interesCentavos = Math.round(saldoCentavos * i);
    const esUltima = numero === p.cuotas;
    const capitalCentavos = esUltima
      ? saldoCentavos
      : Math.min(cuotaCentavos - interesCentavos, saldoCentavos);
    const valorCentavos = esUltima || capitalCentavos < cuotaCentavos - interesCentavos
      ? capitalCentavos + interesCentavos
      : cuotaCentavos;
    saldoCentavos -= capitalCentavos;

    plan.push({
      numero,
      fechaVencimiento: fechaVencimiento(p.fechaBase, p.periodicidad, numero),
      capital: aUnidades(capitalCentavos),
      interes: aUnidades(interesCentavos),
      valorCuota: aUnidades(valorCentavos),
      saldoRestante: aUnidades(saldoCentavos),
    });
  }

  return plan;
}
```

El tope `Math.min(..., saldoCentavos)` evita saldos negativos cuando el redondeo de la cuota salda el crédito antes de la última cuota. En ese caso la cuota se reduce a capital más interés, y las cuotas siguientes valen cero. En los casos A a D el tope no se activa.

Agregar a `packages/domain/src/index.ts`:

```ts
export * from './credito/vencimientos';
export * from './credito/plan-amortizacion';
```

- [ ] **Step 6: Ejecutar las pruebas y ver que pasan**

Run: `npm test -w @credito/domain -- vencimientos plan-amortizacion`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/domain/src
git commit -m "feat(domain): vencimientos y plan de amortización"
```

---

### Task 5: Máquina de estados, edad y roles

**Files:**
- Modify: `packages/domain/src/solicitud/estado-solicitud.ts`
- Create: `packages/domain/src/solicitud/edad.ts`, `packages/domain/src/auth/rol.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/solicitud/estado-solicitud.spec.ts`, `packages/domain/src/solicitud/edad.spec.ts`, `packages/domain/src/auth/rol.spec.ts`

**Interfaces:**
- Consumes: `EstadoSolicitud`, `Accion` de la tarea 2. `parsearFecha` de la tarea 1. `EdadMaximaExcedidaError` de la tarea 2.
- Produces:
  - `TRANSICIONES: Record<Accion, { desde: EstadoSolicitud; hacia: EstadoSolicitud }>`
  - `puedeEjecutar(estado: EstadoSolicitud, accion: Accion): boolean`
  - `esEstadoSolicitud(valor: string): valor is EstadoSolicitud`
  - `EDAD_MAXIMA = 80`
  - `calcularEdad(fechaNacimiento: string, hoy: string): number`
  - `validarEdadMaxima(fechaNacimiento: string, hoy: string): number`
  - `enum Rol { OFICIAL = 'OFICIAL', ANALISTA = 'ANALISTA', CAJERO = 'CAJERO', ADMIN = 'ADMIN' }`
  - `esRol(valor: string): valor is Rol`
  - `tieneRol(rol: Rol, permitidos: readonly Rol[]): boolean`, ADMIN siempre pasa

- [ ] **Step 1: Escribir las pruebas**

`packages/domain/src/solicitud/estado-solicitud.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { type Accion, EstadoSolicitud, esEstadoSolicitud, puedeEjecutar } from './estado-solicitud';

const { PENDIENTE, APROBADA, RECHAZADA, DESEMBOLSADA } = EstadoSolicitud;

describe('puedeEjecutar', () => {
  it.each<[EstadoSolicitud, Accion, boolean]>([
    [PENDIENTE, 'aprobar', true],
    [PENDIENTE, 'rechazar', true],
    [PENDIENTE, 'desembolsar', false],
    [APROBADA, 'aprobar', false],
    [APROBADA, 'rechazar', false],
    [APROBADA, 'desembolsar', true],
    [RECHAZADA, 'aprobar', false],
    [RECHAZADA, 'rechazar', false],
    [RECHAZADA, 'desembolsar', false],
    [DESEMBOLSADA, 'aprobar', false],
    [DESEMBOLSADA, 'rechazar', false],
    [DESEMBOLSADA, 'desembolsar', false],
  ])('%s + %s → %s', (estado, accion, esperado) => {
    expect(puedeEjecutar(estado, accion)).toBe(esperado);
  });

  it('reconoce estados válidos', () => {
    expect(esEstadoSolicitud('APROBADA')).toBe(true);
    expect(esEstadoSolicitud('ANULADA')).toBe(false);
  });
});
```

`packages/domain/src/solicitud/edad.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { EdadMaximaExcedidaError } from '../errors/errores';
import { calcularEdad, validarEdadMaxima } from './edad';

describe('calcularEdad', () => {
  it.each([
    ['1946-01-01', '2026-09-24', 80],
    ['1945-09-24', '2026-09-24', 81],
    ['1945-09-25', '2026-09-24', 80],
    ['2000-02-29', '2027-02-28', 26],
    ['2000-02-29', '2027-03-01', 27],
  ])('nace %s, hoy %s → %d', (nacimiento, hoy, esperado) => {
    expect(calcularEdad(nacimiento, hoy)).toBe(esperado);
  });
});

describe('validarEdadMaxima', () => {
  it('acepta exactamente 80 años', () => {
    expect(validarEdadMaxima('1946-01-01', '2026-09-24')).toBe(80);
  });

  it('rechaza 81 años con la edad en los parámetros', () => {
    expect(() => validarEdadMaxima('1945-09-24', '2026-09-24')).toThrow(EdadMaximaExcedidaError);
    try {
      validarEdadMaxima('1945-09-24', '2026-09-24');
    } catch (error) {
      expect((error as EdadMaximaExcedidaError).params).toEqual({ edad: 81 });
    }
  });
});
```

`packages/domain/src/auth/rol.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { esRol, Rol, tieneRol } from './rol';

describe('tieneRol', () => {
  it('permite los roles listados', () => {
    expect(tieneRol(Rol.ANALISTA, [Rol.ANALISTA])).toBe(true);
    expect(tieneRol(Rol.CAJERO, [Rol.ANALISTA])).toBe(false);
  });

  it('ADMIN pasa cualquier restricción', () => {
    expect(tieneRol(Rol.ADMIN, [Rol.CAJERO])).toBe(true);
    expect(tieneRol(Rol.ADMIN, [])).toBe(true);
  });

  it('reconoce roles válidos', () => {
    expect(esRol('OFICIAL')).toBe(true);
    expect(esRol('GERENTE')).toBe(false);
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y ver que fallan**

Run: `npm test -w @credito/domain -- estado-solicitud edad rol`
Expected: FAIL, faltan `puedeEjecutar`, `./edad` y `./rol`.

- [ ] **Step 3: Implementar**

Reemplazar `packages/domain/src/solicitud/estado-solicitud.ts`:

```ts
export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  DESEMBOLSADA = 'DESEMBOLSADA',
}

export type Accion = 'aprobar' | 'rechazar' | 'desembolsar';

export const TRANSICIONES: Record<Accion, { desde: EstadoSolicitud; hacia: EstadoSolicitud }> = {
  aprobar: { desde: EstadoSolicitud.PENDIENTE, hacia: EstadoSolicitud.APROBADA },
  rechazar: { desde: EstadoSolicitud.PENDIENTE, hacia: EstadoSolicitud.RECHAZADA },
  desembolsar: { desde: EstadoSolicitud.APROBADA, hacia: EstadoSolicitud.DESEMBOLSADA },
};

export function puedeEjecutar(estado: EstadoSolicitud, accion: Accion): boolean {
  return TRANSICIONES[accion].desde === estado;
}

export function esEstadoSolicitud(valor: string): valor is EstadoSolicitud {
  return (Object.values(EstadoSolicitud) as string[]).includes(valor);
}
```

`packages/domain/src/solicitud/edad.ts`:

```ts
import { EdadMaximaExcedidaError } from '../errors/errores';
import { parsearFecha } from '../fechas';

export const EDAD_MAXIMA = 80;

export function calcularEdad(fechaNacimiento: string, hoy: string): number {
  const nacimiento = parsearFecha(fechaNacimiento);
  const actual = parsearFecha(hoy);
  let edad = actual.anio - nacimiento.anio;
  const aunNoCumple =
    actual.mes < nacimiento.mes || (actual.mes === nacimiento.mes && actual.dia < nacimiento.dia);
  if (aunNoCumple) edad--;
  return edad;
}

export function validarEdadMaxima(fechaNacimiento: string, hoy: string): number {
  const edad = calcularEdad(fechaNacimiento, hoy);
  if (edad > EDAD_MAXIMA) throw new EdadMaximaExcedidaError(edad);
  return edad;
}
```

`packages/domain/src/auth/rol.ts`:

```ts
export enum Rol {
  OFICIAL = 'OFICIAL',
  ANALISTA = 'ANALISTA',
  CAJERO = 'CAJERO',
  ADMIN = 'ADMIN',
}

export function esRol(valor: string): valor is Rol {
  return (Object.values(Rol) as string[]).includes(valor);
}

export function tieneRol(rol: Rol, permitidos: readonly Rol[]): boolean {
  return rol === Rol.ADMIN || permitidos.includes(rol);
}
```

Agregar a `packages/domain/src/index.ts`:

```ts
export * from './solicitud/edad';
export * from './auth/rol';
```

- [ ] **Step 4: Ejecutar las pruebas y ver que pasan**

Run: `npm test -w @credito/domain`
Expected: PASS en todos los archivos.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src
git commit -m "feat(domain): máquina de estados, cálculo de edad y roles"
```

---

### Task 6: Entidades Solicitud y Credito

**Files:**
- Create: `packages/domain/src/solicitud/solicitud.ts`, `packages/domain/src/credito/credito.ts`
- Create: `packages/domain/src/testing/fixtures.ts` (datos de prueba compartidos; no se exporta desde `index.ts`)
- Modify: `packages/domain/src/index.ts`, `packages/domain/vitest.config.ts`
- Test: `packages/domain/src/solicitud/solicitud.spec.ts`, `packages/domain/src/credito/credito.spec.ts`
- Modify: `docs/bitacora-ia.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces:
  - `interface DatosSolicitud { nombreCompleto: string; cedula: string; correo: string; telefono: string; fechaNacimiento: string; tipoEmpleoId: number; empresa: string; antiguedadAnios: number; ingresoMensual: number; montoSolicitado: number; cantidadCuotas: number; tasaAnual: number; periodicidad: Periodicidad }`
  - `interface SolicitudProps extends DatosSolicitud { id: number | null; estado: EstadoSolicitud; observaciones: string | null; dictaminadaPorId: number | null; dictaminadaEn: Date | null; creadaPorId: number; creadaEn: Date }`
  - `class Solicitud`:
    - `static crear(datos: DatosSolicitud, creadaPorId: number, hoy: string, ahora: Date): Solicitud`
    - `static reconstituir(props: SolicitudProps): Solicitud`
    - `get id(): number | null`, `get estado(): EstadoSolicitud`
    - `snapshot(): SolicitudProps`
    - `condiciones(): CondicionesCredito`
    - `edad(hoy: string): number`
    - `cuotaNivelada(): number`
    - `aprobar(observaciones: string, usuarioId: number, ahora: Date): void`
    - `rechazar(observaciones: string, usuarioId: number, ahora: Date): void`
    - `desembolsar(): void`
  - `interface CreditoProps { id: number | null; secuencia: number; numero: string; solicitudId: number; monto: number; tasaAnual: number; periodicidad: Periodicidad; plazo: number; cuotaNivelada: number; fechaBase: string }`
  - `formatearNumeroCredito(secuencia: number): string`
  - `class Credito`:
    - `static desde(solicitud: Solicitud, secuencia: number, fechaBase: string): Credito`
    - `static reconstituir(props: CreditoProps): Credito`
    - `get id(): number | null`, `get solicitudId(): number`
    - `snapshot(): CreditoProps`
    - `generarPlan(): CuotaPlan[]`

`Solicitud.desembolsar()` no recibe `ahora`, a diferencia de la firma de la spec. El instante de actualización lo registra Prisma con `@updatedAt`, y el del desembolso lo guarda la tabla `Desembolso`. Un parámetro sin uso no aporta nada.

- [ ] **Step 1: Escribir los fixtures y las pruebas**

En `packages/domain/vitest.config.ts`, agregar `'src/testing/**'` a `coverage.exclude`:

```ts
      exclude: ['src/**/*.spec.ts', 'src/index.ts', 'src/testing/**'],
```

`packages/domain/src/testing/fixtures.ts`:

```ts
import { Periodicidad } from '../credito/periodicidad';
import type { DatosSolicitud } from '../solicitud/solicitud';

export const datosValidos = (cambios: Partial<DatosSolicitud> = {}): DatosSolicitud => ({
  nombreCompleto: 'Ana López',
  cedula: '001-010190-0001A',
  correo: 'ana@example.com',
  telefono: '88887777',
  fechaNacimiento: '1990-01-01',
  tipoEmpleoId: 1,
  empresa: 'Empresa S.A.',
  antiguedadAnios: 5,
  ingresoMensual: 30000,
  montoSolicitado: 10000,
  cantidadCuotas: 12,
  tasaAnual: 12,
  periodicidad: Periodicidad.MENSUAL,
  ...cambios,
});
```

`packages/domain/src/solicitud/solicitud.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError, EdadMaximaExcedidaError,
  ObservacionesRequeridasError, ParametrosCreditoInvalidosError, TransicionInvalidaError,
} from '../errors/errores';
import { datosValidos } from '../testing/fixtures';
import { EstadoSolicitud } from './estado-solicitud';
import { Solicitud } from './solicitud';

const HOY = '2026-09-24';
const AHORA = new Date('2026-09-24T15:00:00Z');

const pendiente = () => {
  const s = Solicitud.crear(datosValidos(), 7, HOY, AHORA);
  return Solicitud.reconstituir({ ...s.snapshot(), id: 1 });
};

describe('Solicitud.crear', () => {
  it('crea en PENDIENTE sin dictamen', () => {
    const s = Solicitud.crear(datosValidos(), 7, HOY, AHORA);
    expect(s.estado).toBe(EstadoSolicitud.PENDIENTE);
    expect(s.id).toBeNull();
    expect(s.snapshot()).toMatchObject({
      creadaPorId: 7, creadaEn: AHORA, observaciones: null,
      dictaminadaPorId: null, dictaminadaEn: null,
    });
  });

  it('acepta exactamente 80 años', () => {
    expect(() => Solicitud.crear(datosValidos({ fechaNacimiento: '1946-01-01' }), 7, HOY, AHORA)).not.toThrow();
  });

  it('rechaza mayores de 80 años', () => {
    expect(() => Solicitud.crear(datosValidos({ fechaNacimiento: '1945-09-24' }), 7, HOY, AHORA))
      .toThrow(EdadMaximaExcedidaError);
  });

  it('rechaza condiciones inválidas', () => {
    expect(() => Solicitud.crear(datosValidos({ montoSolicitado: 0 }), 7, HOY, AHORA))
      .toThrow(ParametrosCreditoInvalidosError);
  });

  it('calcula edad y cuota', () => {
    const s = pendiente();
    expect(s.edad(HOY)).toBe(36);
    expect(s.cuotaNivelada()).toBe(888.49);
  });
});

describe('dictamen', () => {
  it('aprobar llena el dictamen con observaciones recortadas', () => {
    const s = pendiente();
    s.aprobar('  Buen historial  ', 9, AHORA);
    expect(s.estado).toBe(EstadoSolicitud.APROBADA);
    expect(s.snapshot()).toMatchObject({
      observaciones: 'Buen historial', dictaminadaPorId: 9, dictaminadaEn: AHORA,
    });
  });

  it('rechazar pasa a RECHAZADA', () => {
    const s = pendiente();
    s.rechazar('Ingresos insuficientes', 9, AHORA);
    expect(s.estado).toBe(EstadoSolicitud.RECHAZADA);
  });

  it('exige observaciones no vacías', () => {
    expect(() => pendiente().aprobar('   ', 9, AHORA)).toThrow(ObservacionesRequeridasError);
    expect(() => pendiente().rechazar('', 9, AHORA)).toThrow(ObservacionesRequeridasError);
  });

  it('valida el estado antes que las observaciones', () => {
    const s = pendiente();
    s.aprobar('ok', 9, AHORA);
    expect(() => s.aprobar('', 9, AHORA)).toThrow(TransicionInvalidaError);
  });

  it('no permite dictaminar dos veces', () => {
    const s = pendiente();
    s.rechazar('no', 9, AHORA);
    expect(() => s.aprobar('sí', 9, AHORA)).toThrow(TransicionInvalidaError);
  });
});

describe('desembolsar', () => {
  it('pasa de APROBADA a DESEMBOLSADA', () => {
    const s = pendiente();
    s.aprobar('ok', 9, AHORA);
    s.desembolsar();
    expect(s.estado).toBe(EstadoSolicitud.DESEMBOLSADA);
  });

  it('rechaza PENDIENTE y RECHAZADA con CREDITO_NO_APROBADO', () => {
    expect(() => pendiente().desembolsar()).toThrow(CreditoNoAprobadoError);
    const rechazada = pendiente();
    rechazada.rechazar('no', 9, AHORA);
    expect(() => rechazada.desembolsar()).toThrow(CreditoNoAprobadoError);
  });

  it('rechaza DESEMBOLSADA con CREDITO_YA_DESEMBOLSADO', () => {
    const s = pendiente();
    s.aprobar('ok', 9, AHORA);
    s.desembolsar();
    expect(() => s.desembolsar()).toThrow(CreditoYaDesembolsadoError);
  });
});

describe('snapshot', () => {
  it('devuelve una copia que no altera la entidad', () => {
    const s = pendiente();
    const copia = s.snapshot();
    copia.estado = EstadoSolicitud.DESEMBOLSADA;
    expect(s.estado).toBe(EstadoSolicitud.PENDIENTE);
  });
});
```

`packages/domain/src/credito/credito.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CreditoNoAprobadoError } from '../errors/errores';
import { Solicitud } from '../solicitud/solicitud';
import { datosValidos } from '../testing/fixtures';
import { Credito, formatearNumeroCredito } from './credito';
import { Periodicidad } from './periodicidad';

const AHORA = new Date('2026-09-24T15:00:00Z');

const aprobada = () => {
  const s = Solicitud.reconstituir({ ...Solicitud.crear(datosValidos(), 7, '2026-09-24', AHORA).snapshot(), id: 5 });
  s.aprobar('ok', 9, AHORA);
  return s;
};

describe('formatearNumeroCredito', () => {
  it.each([
    [1, 'CR-000001'],
    [42, 'CR-000042'],
    [999999, 'CR-999999'],
    [1000000, 'CR-1000000'],
  ])('%d → %s', (secuencia, esperado) => {
    expect(formatearNumeroCredito(secuencia)).toBe(esperado);
  });
});

describe('Credito.desde', () => {
  it('congela las condiciones de la solicitud aprobada', () => {
    const credito = Credito.desde(aprobada(), 1, '2026-01-31');
    expect(credito.snapshot()).toEqual({
      id: null,
      secuencia: 1,
      numero: 'CR-000001',
      solicitudId: 5,
      monto: 10000,
      tasaAnual: 12,
      periodicidad: Periodicidad.MENSUAL,
      plazo: 12,
      cuotaNivelada: 888.49,
      fechaBase: '2026-01-31',
    });
  });

  it('genera el plan del caso A', () => {
    const plan = Credito.desde(aprobada(), 1, '2026-01-31').generarPlan();
    expect(plan).toHaveLength(12);
    expect(plan[0]).toEqual({
      numero: 1, fechaVencimiento: '2026-02-28',
      capital: 788.49, interes: 100, valorCuota: 888.49, saldoRestante: 9211.51,
    });
  });

  it('exige una solicitud aprobada', () => {
    const pendiente = Solicitud.reconstituir({ ...aprobada().snapshot(), estado: 'PENDIENTE' as never });
    expect(() => Credito.desde(pendiente, 1, '2026-01-31')).toThrow(CreditoNoAprobadoError);
  });

  it('exige una solicitud persistida', () => {
    const sinId = Solicitud.reconstituir({ ...aprobada().snapshot(), id: null });
    expect(() => Credito.desde(sinId, 1, '2026-01-31')).toThrow('persistida');
  });
});
```

- [ ] **Step 2: Ejecutar las pruebas y ver que fallan**

Run: `npm test -w @credito/domain -- solicitud credito`
Expected: FAIL, no se resuelven `./solicitud` ni `./credito`.

- [ ] **Step 3: Implementar la entidad Solicitud**

`packages/domain/src/solicitud/solicitud.ts`:

```ts
import { type CondicionesCredito, calcularCuotaNivelada, validarCondiciones } from '../credito/cuota-nivelada';
import type { Periodicidad } from '../credito/periodicidad';
import {
  CreditoNoAprobadoError, CreditoYaDesembolsadoError,
  ObservacionesRequeridasError, TransicionInvalidaError,
} from '../errors/errores';
import { calcularEdad, validarEdadMaxima } from './edad';
import { EstadoSolicitud, puedeEjecutar, TRANSICIONES } from './estado-solicitud';

export interface DatosSolicitud {
  nombreCompleto: string;
  cedula: string;
  correo: string;
  telefono: string;
  fechaNacimiento: string;
  tipoEmpleoId: number;
  empresa: string;
  antiguedadAnios: number;
  ingresoMensual: number;
  montoSolicitado: number;
  cantidadCuotas: number;
  tasaAnual: number;
  periodicidad: Periodicidad;
}

export interface SolicitudProps extends DatosSolicitud {
  id: number | null;
  estado: EstadoSolicitud;
  observaciones: string | null;
  dictaminadaPorId: number | null;
  dictaminadaEn: Date | null;
  creadaPorId: number;
  creadaEn: Date;
}

export class Solicitud {
  private constructor(private props: SolicitudProps) {}

  static crear(datos: DatosSolicitud, creadaPorId: number, hoy: string, ahora: Date): Solicitud {
    validarEdadMaxima(datos.fechaNacimiento, hoy);
    const solicitud = new Solicitud({
      ...datos,
      id: null,
      estado: EstadoSolicitud.PENDIENTE,
      observaciones: null,
      dictaminadaPorId: null,
      dictaminadaEn: null,
      creadaPorId,
      creadaEn: ahora,
    });
    validarCondiciones(solicitud.condiciones());
    return solicitud;
  }

  static reconstituir(props: SolicitudProps): Solicitud {
    return new Solicitud({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get estado(): EstadoSolicitud {
    return this.props.estado;
  }

  snapshot(): SolicitudProps {
    return { ...this.props };
  }

  condiciones(): CondicionesCredito {
    return {
      monto: this.props.montoSolicitado,
      tasaAnual: this.props.tasaAnual,
      cuotas: this.props.cantidadCuotas,
      periodicidad: this.props.periodicidad,
    };
  }

  edad(hoy: string): number {
    return calcularEdad(this.props.fechaNacimiento, hoy);
  }

  cuotaNivelada(): number {
    return calcularCuotaNivelada(this.condiciones());
  }

  aprobar(observaciones: string, usuarioId: number, ahora: Date): void {
    this.dictaminar('aprobar', observaciones, usuarioId, ahora);
  }

  rechazar(observaciones: string, usuarioId: number, ahora: Date): void {
    this.dictaminar('rechazar', observaciones, usuarioId, ahora);
  }

  desembolsar(): void {
    if (this.props.estado === EstadoSolicitud.DESEMBOLSADA) {
      throw new CreditoYaDesembolsadoError();
    }
    if (!puedeEjecutar(this.props.estado, 'desembolsar')) {
      throw new CreditoNoAprobadoError(this.props.estado);
    }
    this.props = { ...this.props, estado: TRANSICIONES.desembolsar.hacia };
  }

  private dictaminar(
    accion: 'aprobar' | 'rechazar',
    observaciones: string,
    usuarioId: number,
    ahora: Date,
  ): void {
    if (!puedeEjecutar(this.props.estado, accion)) {
      throw new TransicionInvalidaError(accion, this.props.estado);
    }
    const limpias = observaciones.trim();
    if (!limpias) throw new ObservacionesRequeridasError();
    this.props = {
      ...this.props,
      estado: TRANSICIONES[accion].hacia,
      observaciones: limpias,
      dictaminadaPorId: usuarioId,
      dictaminadaEn: ahora,
    };
  }
}
```

- [ ] **Step 4: Implementar la entidad Credito**

`packages/domain/src/credito/credito.ts`:

```ts
import { CreditoNoAprobadoError } from '../errors/errores';
import { EstadoSolicitud } from '../solicitud/estado-solicitud';
import type { Solicitud } from '../solicitud/solicitud';
import { calcularCuotaNivelada } from './cuota-nivelada';
import type { Periodicidad } from './periodicidad';
import { type CuotaPlan, generarPlanAmortizacion } from './plan-amortizacion';

export interface CreditoProps {
  id: number | null;
  secuencia: number;
  numero: string;
  solicitudId: number;
  monto: number;
  tasaAnual: number;
  periodicidad: Periodicidad;
  plazo: number;
  cuotaNivelada: number;
  fechaBase: string;
}

export function formatearNumeroCredito(secuencia: number): string {
  return `CR-${String(secuencia).padStart(6, '0')}`;
}

export class Credito {
  private constructor(private readonly props: CreditoProps) {}

  static desde(solicitud: Solicitud, secuencia: number, fechaBase: string): Credito {
    const s = solicitud.snapshot();
    if (s.id === null) {
      throw new Error('La solicitud debe estar persistida antes de crear el crédito');
    }
    if (s.estado !== EstadoSolicitud.APROBADA) {
      throw new CreditoNoAprobadoError(s.estado);
    }
    const condiciones = solicitud.condiciones();
    return new Credito({
      id: null,
      secuencia,
      numero: formatearNumeroCredito(secuencia),
      solicitudId: s.id,
      monto: condiciones.monto,
      tasaAnual: condiciones.tasaAnual,
      periodicidad: condiciones.periodicidad,
      plazo: condiciones.cuotas,
      cuotaNivelada: calcularCuotaNivelada(condiciones),
      fechaBase,
    });
  }

  static reconstituir(props: CreditoProps): Credito {
    return new Credito({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get solicitudId(): number {
    return this.props.solicitudId;
  }

  snapshot(): CreditoProps {
    return { ...this.props };
  }

  generarPlan(): CuotaPlan[] {
    return generarPlanAmortizacion({
      monto: this.props.monto,
      tasaAnual: this.props.tasaAnual,
      cuotas: this.props.plazo,
      periodicidad: this.props.periodicidad,
      fechaBase: this.props.fechaBase,
    });
  }
}
```

Agregar a `packages/domain/src/index.ts`:

```ts
export * from './solicitud/solicitud';
export * from './credito/credito';
```

- [ ] **Step 5: Ejecutar las pruebas y ver que pasan**

Run: `npm test -w @credito/domain`
Expected: PASS en todos los archivos.

- [ ] **Step 6: Verificar cobertura, tipos y compilación**

Run: `npm run test:cov -w @credito/domain`
Expected: PASS con cobertura de líneas mayor o igual a 95 %.

Run: `npm run typecheck -w @credito/domain`
Expected: sin errores.

Run: `npm run build -w @credito/domain`
Expected: compila sin errores.

- [ ] **Step 7: Registrar en la bitácora de IA**

Agregar al final de la sección 3 de `docs/bitacora-ia.md`:

```markdown
### 3.3 Implementación del paquete de dominio

- **Fecha:** fecha de ejecución
- **Modelo:** modelo usado en la sesión de implementación
- **Objetivo:** implementar `packages/domain` según el plan 1.

**Instrucciones dadas a la herramienta**

- Ejecutar el plan `docs/superpowers/plans/2026-09-25-01-fundacion-dominio.md` con TDD, tarea por tarea.

**Resultados**

- Monorepo con npm workspaces y paquete de dominio compilado a ESM y CommonJS.
- Motor financiero, máquina de estados, cálculo de edad, roles, errores y catálogo bilingüe con pruebas.
- Pruebas de propiedades con fast-check sobre las invariantes del plan de amortización.

**Validación del autor:** revisión del código y de la cobertura del dominio.
```

Reemplazar "fecha de ejecución" y "modelo usado en la sesión de implementación" por los valores reales al ejecutar.

- [ ] **Step 8: Commit**

```bash
git add packages/domain docs/bitacora-ia.md
git commit -m "feat(domain): entidades Solicitud y Credito"
```
