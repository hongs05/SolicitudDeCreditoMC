# Diseño: ciclo de vida de una solicitud de crédito

- **Fecha:** 2026-09-24
- **Estado:** pendiente de revisión
- **Enunciado:** [docs/prueba-tecnica.md](../../prueba-tecnica.md)

Esta spec recoge las decisiones cerradas y las ocho secciones de diseño aprobadas. Los ajustes que una sección aprobada introdujo sobre otra ya están aplicados en su lugar; la sección 12 los lista junto con las correcciones de la revisión final.

---

## 1. Objetivo

Aplicación web full stack que simula el ciclo de vida de una solicitud de crédito en una entidad financiera: autenticación, captura de la solicitud, dictamen del comité de riesgo, desembolso y consulta del plan de pagos. Se entrega como un monorepo que se levanta completo con `docker compose up --build`.

Lo que el enunciado evalúa, y que guía cada decisión:

1. Que no se puedan desembolsar créditos no aprobados.
2. Que aprobar, crear el crédito y crear las cuotas sea atómico.
3. Código modular, con abstracciones claras y sin duplicación.
4. Un `docker-compose.yml` que levante todo sin fallos.

---

## 2. Decisiones cerradas

### 2.1 Stack

- NestJS + React (Vite) + SQLite con Prisma. TypeScript estricto en todo el proyecto.
- Node 22 LTS.
- Monorepo con npm workspaces: `apps/api`, `apps/web`, `packages/domain`.

### 2.2 Arquitectura

Arquitectura **hexagonal** (puertos y adaptadores) con principios de Clean Architecture. Monolito modular. No es DDD completo, ni CQRS, ni microservicios.

**Regla de dependencia.** `domain` no importa nada. `application` importa `domain` y sus propios puertos. `infrastructure` importa todo. Se verifica con `eslint-plugin-boundaries`.

**Qué va en `packages/domain`.** Todo lo que necesitan la API y el frontend, o que es núcleo del negocio:

- Entidades `Solicitud` y `Credito`, con comportamiento.
- Enums `EstadoSolicitud`, `Periodicidad`, `Rol`.
- Máquina de estados.
- Motor financiero: cuota nivelada, plan de amortización, vencimientos.
- Cálculo de edad.
- Todos los errores de dominio (`DomainError` y subclases).
- Catálogo de mensajes `es` y `en`, y `resolverMensaje`.

`packages/domain` no tiene dependencias en tiempo de ejecución. La fórmula de la cuota existe una sola vez.

**Estructura de la API.**

```
apps/api/src/
  shared/
    application/ports/     UnitOfWork, Clock
    infrastructure/        PrismaService, PrismaUnitOfWork, SystemClock,
                           errors/ErrorHandlerFilter, i18n/LocaleInterceptor,
                           config/ (validación de variables de entorno)
  auth/
    domain/                Usuario, RefreshToken (entidades solo del servidor)
    application/           casos de uso y puertos
    infrastructure/        adaptadores, controlador, guards, módulo
  solicitudes/
    application/
    infrastructure/
  creditos/
    application/
    infrastructure/
  desembolsos/
    application/
    infrastructure/
  health/
```

Un módulo tiene carpeta `domain/` solo cuando tiene entidades que el frontend no necesita. Hoy eso ocurre únicamente en `auth`. Las entidades de `solicitudes`, `creditos` y `desembolsos` viven en `packages/domain`.

**Reglas de diseño.**

- Un caso de uso por acción de negocio.
- Un repositorio por agregado.
- Un puerto `UnitOfWork` con `run<T>(fn: (repos) => Promise<T>): Promise<T>`, implementado con la transacción interactiva de Prisma. Dentro de `fn`, los repositorios que recibe el caso de uso usan el cliente transaccional.
- Las entidades tienen comportamiento. `Solicitud.aprobar(...)` valida y lanza errores de dominio. Ninguna regla de negocio vive en controladores.
- Nombres de negocio en español (`Solicitud.aprobar`), términos técnicos en inglés (`Repository`, `UseCase`, `Controller`).

### 2.3 Modelo de datos

Ocho tablas. Las fechas de calendario se guardan como texto `YYYY-MM-DD`. Los instantes se guardan como `DateTime` en UTC. El dinero y las tasas se guardan como `Decimal`. Los enums se guardan como `String` y el dominio los valida.

**Usuario**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| username | String | único |
| passwordHash | String | bcrypt costo 10 |
| rol | String | `Rol` |
| creadoEn | DateTime | |

**RefreshToken**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| usuarioId | Int FK → Usuario | |
| familiaId | String | UUID, índice |
| tokenHash | String | SHA-256, único |
| expiraEn | DateTime | |
| creadoEn | DateTime | |
| revocadoEn | DateTime? | |
| reemplazadoPorId | Int? FK → RefreshToken | |

**TipoEmpleo**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| codigo | String | único: `ASALARIADO`, `INDEPENDIENTE` |
| nombre | String | |

**Banco**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| codigo | String | único: `LAFISE`, `FICOHSA`, `BAC_CREDOMATIC`, `BANPRO` |
| nombre | String | LAFISE, FICOHSA, BAC Credomatic, Banpro |
| activo | Boolean | por defecto `true` |

**Solicitud**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| estado | String | `EstadoSolicitud`, índice |
| nombreCompleto | String | |
| cedula | String | índice, no único |
| correo | String | |
| telefono | String | |
| fechaNacimiento | String | `YYYY-MM-DD` |
| tipoEmpleoId | Int FK → TipoEmpleo | |
| empresa | String | |
| antiguedadAnios | Int | |
| ingresoMensual | Decimal | |
| montoSolicitado | Decimal | |
| cantidadCuotas | Int | |
| tasaAnual | Decimal | |
| periodicidad | String | `Periodicidad` |
| observaciones | String? | |
| dictaminadaPorId | Int? FK → Usuario | |
| dictaminadaEn | DateTime? | |
| creadaPorId | Int FK → Usuario | |
| creadaEn | DateTime | |
| actualizadaEn | DateTime | |

**Credito**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| secuencia | Int | único |
| numero | String | único, `CR-` + `secuencia` con 6 dígitos |
| solicitudId | Int FK → Solicitud | único, relación 1 a 1 |
| monto | Decimal | congelado |
| tasaAnual | Decimal | congelada |
| periodicidad | String | congelada |
| plazo | Int | congelado, igual a cantidad de cuotas |
| cuotaNivelada | Decimal | |
| fechaBase | String | `YYYY-MM-DD`, fecha de aprobación en `APP_TZ` |
| creadoEn | DateTime | |

**Cuota**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| creditoId | Int FK → Credito | |
| numero | Int | único junto con `creditoId` |
| fechaVencimiento | String | `YYYY-MM-DD` |
| capital | Decimal | |
| interes | Decimal | |
| valorCuota | Decimal | |
| saldoRestante | Decimal | |

**Desembolso**

| Campo | Tipo | Notas |
|---|---|---|
| id | Int PK autoincrement | |
| creditoId | Int FK → Credito | único, relación 1 a 1 |
| bancoId | Int FK → Banco | |
| numeroCuenta | String | |
| ejecutadoPorId | Int FK → Usuario | |
| ejecutadoEn | DateTime | |

**Criterios del modelo.**

- El estado vive solo en `Solicitud`. `Credito` existe si y solo si la solicitud fue aprobada. `Desembolso` existe si y solo si está desembolsada. Las restricciones de unicidad lo garantizan en la base de datos.
- `Credito` congela las condiciones del contrato.
- Catálogos en tabla para datos sin lógica (`Banco`, `TipoEmpleo`). Enums en código para valores que llevan lógica (`Periodicidad`, `EstadoSolicitud`, `Rol`).
- No hay tabla `Cliente`. Los datos personales van en `Solicitud`.
- El número de crédito se calcula como `max(secuencia) + 1` dentro de la transacción de aprobación. Es seguro porque SQLite serializa las escrituras.

### 2.4 Reglas de negocio

| Regla | Decisión |
|---|---|
| Plazo | Igual a la cantidad de cuotas |
| Periodicidad | `n = 1` anual, `12` mensual, `24` quincenal, como dice el enunciado. Se documenta que financieramente serían 26 |
| Tasa 0 % | `cuota = monto / cuotas` |
| Edad máxima | Mayor que 80 se rechaza. Exactamente 80 se acepta. Se valida en frontend y backend |
| Observaciones | Obligatorias al aprobar y al rechazar |
| Aprobación | Crea crédito y todas las cuotas en una sola transacción |
| Desembolso | Solo sobre `APROBADA`, validado en el dominio |
| Moneda | Córdobas, símbolo `C$`, definido en una constante |

### 2.5 Usuarios

Cuatro usuarios sembrados, uno por rol. La contraseña de demo de todos es `Demo2026!` y queda documentada en el README.

| username | Rol | Puede |
|---|---|---|
| `oficial` | OFICIAL | Crear solicitudes |
| `analista` | ANALISTA | Aprobar y rechazar |
| `cajero` | CAJERO | Desembolsar |
| `admin` | ADMIN | Todo |

Cualquier usuario autenticado puede consultar solicitudes, créditos y planes de pago.

### 2.6 Extras en alcance

Refresh token y búsqueda del plan de pagos por cédula. Se implementan al final del plan.

---

## 3. API y contratos

### 3.1 Convenciones

- Prefijo `/api/v1`, con versionado por URI de Nest.
- JSON en todo. Instantes en ISO 8601 UTC. Fechas de calendario como `YYYY-MM-DD`.
- El dinero, las tasas y los ingresos viajan como string decimal con 2 decimales, por ejemplo `"1250.50"`.
- Ids numéricos. Ninguna respuesta expone `passwordHash` ni hashes de tokens.
- La validación de forma se hace con `class-validator` en los DTOs. La validación de negocio se hace en el dominio. No se duplica.
- Idioma por cabecera `Accept-Language`. Se aceptan `es` y `en`. Por defecto `es`.
- Documentación OpenAPI con `@nestjs/swagger` en `/api/docs`, pública.

### 3.2 Rutas

| Módulo | Método y ruta | Rol | Respuesta |
|---|---|---|---|
| health | `GET /health` | público | 200 `{ status: 'ok' }` |
| auth | `POST /auth/login` | público | 200 `TokensResponse` y cookie de refresh |
| auth | `POST /auth/refresh` | público, lee cookie | 200 `TokensResponse` y cookie nueva |
| auth | `POST /auth/logout` | autenticado | 204 y cookie expirada |
| auth | `GET /auth/me` | autenticado | 200 `UsuarioResponse` |
| solicitudes | `GET /tipos-empleo` | autenticado | 200 `CatalogoItem[]` |
| solicitudes | `POST /solicitudes` | OFICIAL, ADMIN | 201 `SolicitudResponse` |
| solicitudes | `GET /solicitudes` | autenticado | 200 `Paginado<SolicitudResumen>` |
| solicitudes | `GET /solicitudes/:id` | autenticado | 200 `SolicitudResponse` |
| solicitudes | `POST /solicitudes/:id/aprobar` | ANALISTA, ADMIN | 200 `DictamenResponse` |
| solicitudes | `POST /solicitudes/:id/rechazar` | ANALISTA, ADMIN | 200 `DictamenResponse` |
| creditos | `GET /creditos` | autenticado | 200 `Paginado<CreditoResumen>` |
| creditos | `GET /creditos/:id` | autenticado | 200 `CreditoResponse` |
| creditos | `GET /creditos/:id/plan-pagos` | autenticado | 200 `PlanPagosResponse` |
| desembolsos | `GET /bancos` | autenticado | 200 `CatalogoItem[]` |
| desembolsos | `POST /desembolsos` | CAJERO, ADMIN | 201 `DesembolsoResponse` |

Todas las rutas llevan el prefijo `/api/v1`. `GET /health` verifica que la base de datos responde antes de devolver 200.

**Filtros.**

| Ruta | Filtros | Orden |
|---|---|---|
| `GET /solicitudes` | `estado`, `cedula` | `creadaEn` descendente |
| `GET /creditos` | `estado`, `cedula`, `numero` | `creadoEn` descendente |

El filtro `estado` de `GET /creditos` se aplica sobre el estado de la solicitud asociada.

**Ubicación de los casos de uso.** Aprobar y rechazar viven en `solicitudes` porque cambian el estado de la solicitud. `AprobarSolicitud` usa los puertos `SolicitudRepository`, `CreditoRepository` y `UnitOfWork`. El módulo `creditos` es solo de lectura. `desembolsos` contiene `Desembolsar`.

### 3.3 DTOs de entrada

```ts
CrearSolicitudDto {
  nombreCompleto: string        // 3..120
  cedula: string                // 5..30, sin espacios
  correo: string                // email
  telefono: string              // 7..20
  fechaNacimiento: string       // YYYY-MM-DD, en el pasado
  tipoEmpleoId: number          // entero
  empresa: string               // 2..120
  antiguedadAnios: number       // entero, 0..60
  ingresoMensual: string        // decimal > 0, hasta 2 decimales
  montoSolicitado: string       // decimal > 0, hasta 2 decimales
  cantidadCuotas: number        // entero, 1..360
  tasaAnual: string             // decimal, 0..100, hasta 2 decimales
  periodicidad: 'QUINCENAL' | 'MENSUAL' | 'ANUAL'
}

DictamenDto { observaciones: string }   // 1..1000

DesembolsarDto {
  creditoId: number             // entero
  bancoId: number               // entero
  numeroCuenta: string          // 6..30, solo dígitos
}

LoginDto { username: string; password: string }
```

`POST /auth/refresh` y `POST /auth/logout` no llevan body.

### 3.4 DTOs de salida

```ts
TokensResponse   { accessToken: string; usuario: UsuarioResponse }
UsuarioResponse  { id; username; rol }
CatalogoItem     { id; codigo; nombre }

SolicitudResumen { id; cedula; nombreCompleto; montoSolicitado; cantidadCuotas;
                   periodicidad; estado; creadaEn }

SolicitudResponse {
  ...SolicitudResumen
  edad: number                  // calculada con Clock.hoy(), no almacenada
  correo; telefono; fechaNacimiento
  tipoEmpleo: CatalogoItem; empresa; antiguedadAnios; ingresoMensual
  tasaAnual
  cuotaNivelada                 // calculada con packages/domain
  observaciones: string | null
  dictaminadaPor: UsuarioResponse | null
  dictaminadaEn: string | null
  creditoId: number | null
}

DictamenResponse { solicitud: SolicitudResponse; credito: CreditoResponse | null }
                  // credito es null al rechazar

CreditoResumen   { id; numero; cedula; nombreCompleto; monto; plazo;
                   periodicidad; estado }     // estado de la solicitud

CreditoResponse  { ...CreditoResumen; tasaAnual; cuotaNivelada; solicitudId;
                   fechaBase; creadoEn; desembolso: DesembolsoResponse | null }

CuotaResponse    { numero; fechaVencimiento; capital; interes; valorCuota; saldoRestante }
PlanPagosResponse{ credito: CreditoResumen; cuotas: CuotaResponse[] }

DesembolsoResponse { id; creditoId; banco: CatalogoItem; numeroCuenta;
                     ejecutadoPor: UsuarioResponse; ejecutadoEn }

Paginado<T>      { items: T[]; total; page; pageSize }
```

### 3.5 Paginación

Offset simple en los dos listados. `page` empieza en 1. `pageSize` vale 20 por defecto y 100 como máximo.

### 3.6 Manejo de errores unificado

**Principio.** El dominio emite códigos, nunca texto. El texto se resuelve en un solo lugar, en el idioma de la petición.

**Piezas.**

| Pieza | Ubicación | Contenido |
|---|---|---|
| `DomainError` y subclases | `packages/domain/errors` | `code`, `httpStatus` sugerido, `params` para interpolar |
| Catálogo de mensajes | `packages/domain/i18n/es.ts`, `en.ts` | Mapa de `code` a plantilla, con placeholders como `{edad}` |
| `resolverMensaje(code, params, locale)` | `packages/domain/i18n` | Función pura. Si falta la clave en `en`, usa `es` |
| `ErrorHandlerFilter` | `apps/api/src/shared/infrastructure/errors` | Único filtro global |
| `LocaleInterceptor` | `apps/api/src/shared/infrastructure/i18n` | Lee `Accept-Language` y deja `locale` en la petición |

El frontend usa el mismo catálogo para sus validaciones locales.

**Contrato de error.**

```ts
{
  statusCode: number
  code: string                                  // estable
  message: string                               // traducido
  params?: Record<string, unknown>
  details?: { field: string; code: string; message: string }[]   // solo en 400
  timestamp: string
  path: string
}
```

**Cómo decide el filtro.**

1. `DomainError`: usa su `httpStatus` y su `code`, y traduce con el catálogo.
2. Error de `class-validator`: responde 400 `VALIDACION`. Cada restricción fallida se convierte en un elemento de `details` con código derivado según la tabla de abajo. Los textos de `class-validator` se descartan.
3. `HttpException` de Nest: conserva el status, asigna el `code` según la tabla de errores, y traduce.
4. Cualquier otra excepción: 500 `ERROR_INTERNO` con mensaje genérico. El error real va al log con `timestamp` y `path`. El stack nunca llega al cliente.

**Catálogo de errores.**

| `code` | HTTP | Origen | es | en |
|---|---|---|---|---|
| `VALIDACION` | 400 | pipe | Datos inválidos | Invalid data |
| `NO_AUTENTICADO` | 401 | guard y auth | Credenciales inválidas o sesión expirada | Invalid credentials or expired session |
| `TOKEN_REVOCADO` | 401 | dominio | La sesión fue revocada, inicia sesión de nuevo | Session revoked, please sign in again |
| `PROHIBIDO` | 403 | guard | No tienes permiso para esta acción | You are not allowed to perform this action |
| `NO_ENCONTRADO` | 404 | dominio y Nest | {recurso} no encontrado | {recurso} not found |
| `TRANSICION_INVALIDA` | 409 | dominio | No se puede {accion} una solicitud en estado {estado} | Cannot {accion} an application in {estado} state |
| `CREDITO_YA_DESEMBOLSADO` | 409 | dominio | El crédito ya fue desembolsado | Credit already disbursed |
| `EDAD_MAXIMA_EXCEDIDA` | 422 | dominio | El solicitante tiene {edad} años; el máximo es 80 | Applicant is {edad}; maximum is 80 |
| `OBSERVACIONES_REQUERIDAS` | 422 | dominio | Las observaciones son obligatorias | Observations are required |
| `CREDITO_NO_APROBADO` | 422 | dominio | Solo se desembolsan créditos aprobados | Only approved credits can be disbursed |
| `PARAMETROS_CREDITO_INVALIDOS` | 422 | dominio | Condiciones del crédito inválidas: {campo} | Invalid credit terms: {campo} |
| `ERROR_INTERNO` | 500 | filtro | Ocurrió un error inesperado | An unexpected error occurred |

Los valores de `{recurso}`, `{accion}`, `{estado}` y `{campo}` también se traducen por catálogo.

**Códigos de validación por campo.**

| Restricción de `class-validator` | `code` en `details` |
|---|---|
| `isNotEmpty`, `isDefined` | `REQUERIDO` |
| `isEmail` | `CORREO_INVALIDO` |
| `min` | `VALOR_MINIMO` |
| `max` | `VALOR_MAXIMO` |
| `length`, `minLength`, `maxLength` | `LONGITUD_INVALIDA` |
| `isInt` | `ENTERO_REQUERIDO` |
| `isDateString` y validador de fecha pasada | `FECHA_INVALIDA` |
| `matches` y validador de decimal | `FORMATO_INVALIDO` |
| `isEnum`, `isIn` | `VALOR_NO_PERMITIDO` |
| cualquier otra | `VALOR_INVALIDO` |

Cada uno de estos códigos tiene mensaje en `es` y `en` en el mismo catálogo, con placeholders para límites como `{min}` y `{max}`.

**En el frontend.** El cliente HTTP muestra `message` tal cual. Con 401 `NO_AUTENTICADO` intenta un refresh y reintenta. Con 401 `TOKEN_REVOCADO` cierra la sesión. Con 400 pinta `details` campo por campo. El selector de idioma fija `Accept-Language`.

---

## 4. Máquina de estados y reglas

### 4.1 Transiciones

| Desde | Acción | Hacia | Quién | Efecto |
|---|---|---|---|---|
| (nueva) | crear | PENDIENTE | OFICIAL, ADMIN | Ninguno |
| PENDIENTE | aprobar | APROBADA | ANALISTA, ADMIN | Crea Crédito y cuotas |
| PENDIENTE | rechazar | RECHAZADA | ANALISTA, ADMIN | Ninguno |
| APROBADA | desembolsar | DESEMBOLSADA | CAJERO, ADMIN | Crea Desembolso |

RECHAZADA y DESEMBOLSADA son terminales. No hay reapertura ni anulación.

### 4.2 Implementación

En `packages/domain/solicitud`:

```ts
enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE', APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA', DESEMBOLSADA = 'DESEMBOLSADA'
}
type Accion = 'aprobar' | 'rechazar' | 'desembolsar'

const TRANSICIONES: Record<Accion, { desde: EstadoSolicitud; hacia: EstadoSolicitud }>

function puedeEjecutar(estado: EstadoSolicitud, accion: Accion): boolean
```

`puedeEjecutar` es pura. El frontend la usa para mostrar u ocultar acciones y la entidad la usa para decidir si lanza error.

La entidad `Solicitud` expone:

```ts
aprobar(observaciones: string, usuarioId: number, ahora: Date): void
rechazar(observaciones: string, usuarioId: number, ahora: Date): void
desembolsar(ahora: Date): void
```

Cada método consulta `puedeEjecutar`, aplica su regla propia y cambia el estado. La entidad no conoce repositorios.

### 4.3 Efectos de cada acción

**Crear**

1. Calcular la edad con `calcularEdad(fechaNacimiento, clock.hoy())`. Si es mayor que 80, lanzar `EDAD_MAXIMA_EXCEDIDA` con `params { edad }`.
2. Verificar que `tipoEmpleoId` existe. Si no, lanzar `NO_ENCONTRADO` con `params { recurso: 'TipoEmpleo' }`.
3. Validar las condiciones con el motor financiero. Si fallan, lanzar `PARAMETROS_CREDITO_INVALIDOS`.
4. Persistir en PENDIENTE con `creadaPorId`.

**Aprobar**, todo dentro de `UnitOfWork.run`

1. Cargar la solicitud. Si no existe, lanzar `NO_ENCONTRADO` con `recurso: 'Solicitud'`.
2. Llamar a `solicitud.aprobar(observaciones, usuarioId, ahora)`. Si el estado no es PENDIENTE, lanza `TRANSICION_INVALIDA` con `params { accion, estado }`. Si las observaciones quedan vacías tras `trim`, lanza `OBSERVACIONES_REQUERIDAS`. Si todo va bien, llena `observaciones`, `dictaminadaPorId` y `dictaminadaEn`, y pasa a APROBADA.
3. Obtener la siguiente secuencia de crédito del repositorio.
4. Crear el crédito con `Credito.desde(solicitud, secuencia, clock.hoy())`. Congela monto, tasa, periodicidad y plazo, y calcula `cuotaNivelada`.
5. Generar las cuotas con `generarPlanAmortizacion(...)`, usando `fechaBase = clock.hoy()`.
6. Persistir solicitud, crédito y cuotas. Si cualquier paso lanza, Prisma revierte todo.

**Rechazar**, dentro de `UnitOfWork.run` por uniformidad

Mismos pasos 1 y 2 que aprobar, con destino RECHAZADA. No se crea crédito.

**Desembolsar**, dentro de `UnitOfWork.run`

1. Cargar el crédito con su solicitud. Si no existe, lanzar `NO_ENCONTRADO` con `recurso: 'Credito'`.
2. Verificar que `bancoId` existe y está activo. Si no, lanzar `NO_ENCONTRADO` con `recurso: 'Banco'`.
3. Llamar a `solicitud.desembolsar(ahora)`. Si el estado es DESEMBOLSADA, lanza `CREDITO_YA_DESEMBOLSADO`. Si es cualquier otro distinto de APROBADA, lanza `CREDITO_NO_APROBADO`. Para esta acción estos dos códigos reemplazan a `TRANSICION_INVALIDA`, porque el enunciado evalúa este caso en concreto.
4. Crear `Desembolso` con banco, cuenta, `ejecutadoPorId` y `ejecutadoEn`. Persistir solicitud y desembolso.

### 4.4 Concurrencia

Si dos analistas aprueban la misma solicitud a la vez, SQLite serializa las escrituras. El segundo relee el estado dentro de su transacción, lo encuentra APROBADA y recibe 409. La unicidad de `Credito.solicitudId` es una segunda barrera en la base de datos. `Desembolso.creditoId` funciona igual.

### 4.5 Errores de dominio

Todos en `packages/domain/errors`:

```ts
abstract class DomainError extends Error {
  constructor(readonly code: string, readonly httpStatus: number,
              readonly params: Record<string, unknown> = {})
}
class TransicionInvalidaError           extends DomainError  // 409
class CreditoYaDesembolsadoError        extends DomainError  // 409
class EdadMaximaExcedidaError           extends DomainError  // 422
class ObservacionesRequeridasError      extends DomainError  // 422
class CreditoNoAprobadoError            extends DomainError  // 422
class ParametrosCreditoInvalidosError   extends DomainError  // 422
class NoEncontradoError                 extends DomainError  // 404
class TokenRevocadoError                extends DomainError  // 401
class NoAutenticadoError                extends DomainError  // 401
```

`httpStatus` es un número. El dominio no importa nada de HTTP.

### 4.6 Cálculo de edad

```ts
function calcularEdad(fechaNacimiento: string, hoy: string): number   // ambas YYYY-MM-DD
```

Resta los años y descuenta uno si el cumpleaños de este año todavía no llegó. `hoy` se inyecta siempre: en producción viene de `Clock.hoy()`, en pruebas es una fecha fija. La edad no se almacena. El frontend usa la misma función.

### 4.7 Casos de prueba de la sección

| Caso | Esperado |
|---|---|
| Nace 1946-01-01, hoy 2026-09-24 | 80, se acepta |
| Nace 1945-09-24, hoy 2026-09-24 | 81, `EDAD_MAXIMA_EXCEDIDA` |
| Nace 1945-09-25, hoy 2026-09-24 | 80, se acepta |
| Aprobar en PENDIENTE con observaciones | APROBADA, crédito creado |
| Aprobar en APROBADA | `TRANSICION_INVALIDA` |
| Aprobar con observaciones `"   "` | `OBSERVACIONES_REQUERIDAS` |
| Desembolsar en PENDIENTE | `CREDITO_NO_APROBADO` |
| Desembolsar en DESEMBOLSADA | `CREDITO_YA_DESEMBOLSADO` |
| Falla al insertar cuotas | Solicitud sigue PENDIENTE, sin crédito ni cuotas |

---

## 5. Motor financiero

### 5.1 Representación del dinero

La única operación en punto flotante es la fórmula de la cuota. Todo lo demás se calcula en centavos enteros.

- Las funciones públicas reciben y devuelven `number` en unidades de moneda, con 2 decimales.
- Internamente convierten a centavos con `Math.round(x * 100)`, operan con enteros y vuelven a unidades al salir.
- Redondeo mitad hacia arriba.
- La API convierte `Decimal` de Prisma a `number` al entrar al dominio, y a string al salir por HTTP. El frontend no hace aritmética de dinero salvo la vista previa de la cuota, que usa las funciones del dominio.

### 5.2 Firmas

```ts
// packages/domain/credito/Periodicidad.ts
enum Periodicidad { QUINCENAL = 'QUINCENAL', MENSUAL = 'MENSUAL', ANUAL = 'ANUAL' }
const PERIODOS_POR_ANIO: Record<Periodicidad, number> = { ANUAL: 1, MENSUAL: 12, QUINCENAL: 24 }

// packages/domain/credito/CuotaNivelada.ts
function tasaPeriodica(tasaAnual: number, periodicidad: Periodicidad): number
  // (tasaAnual / 100) / n, sin redondear

function calcularCuotaNivelada(params: {
  monto: number; tasaAnual: number; cuotas: number; periodicidad: Periodicidad
}): number
  // i = 0 → round(monto / cuotas)
  // i > 0 → round(monto * i(1+i)^cuotas / ((1+i)^cuotas - 1))

// packages/domain/credito/PlanAmortizacion.ts
interface CuotaPlan {
  numero: number; fechaVencimiento: string        // YYYY-MM-DD
  capital: number; interes: number; valorCuota: number; saldoRestante: number
}

function generarPlanAmortizacion(params: {
  monto: number; tasaAnual: number; cuotas: number
  periodicidad: Periodicidad; fechaBase: string    // YYYY-MM-DD
}): CuotaPlan[]

// packages/domain/credito/Vencimientos.ts
function fechaVencimiento(fechaBase: string, periodicidad: Periodicidad, numero: number): string
```

Las tres funciones validan cuatro reglas: el `monto` debe representar al menos un centavo, `cuotas` debe ser un entero mayor o igual a 1 y no superar el plazo máximo de 30 años según la periodicidad, `tasaAnual` debe estar entre 0 y 100, y la cuota nivelada resultante debe superar el interés del primer periodo, de modo que se rechacen las combinaciones de tasa y plazo que no amortizan. Si algo falla, lanzan `ParametrosCreditoInvalidosError` con `params { campo }`.

### 5.3 Algoritmo del plan

```
cuotaC = calcularCuotaNivelada(...) en centavos
saldoC = monto en centavos
i      = tasaPeriodica(...)
para k = 1..cuotas:
  interesC = round(saldoC * i)
  si k < cuotas:
    capitalC = cuotaC - interesC
    valorC   = cuotaC
  si k = cuotas:                       // la última cuota absorbe el redondeo
    capitalC = saldoC
    valorC   = capitalC + interesC
  saldoC -= capitalC
  emitir { k, fechaVencimiento(fechaBase, periodicidad, k), capitalC, interesC, valorC, saldoC }
```

**Invariantes.** La suma de `capital` es exactamente `monto`. El último `saldoRestante` es 0. Ningún `interes` es negativo. `valorCuota` es igual en todas las cuotas salvo, como mucho, la última.

En combinaciones extremas de tasa y plazo, la cuota nivelada puede saldar el crédito antes de la última cuota por el redondeo al centavo; en ese caso las cuotas posteriores al saldo cero valen cero (`capital`, `interes` y `valorCuota` en 0), y esto no se considera un defecto.

### 5.4 Fechas de vencimiento

`fechaBase` es la fecha de aprobación en `APP_TZ`. El cálculo se hace con `Date.UTC` y se emite como `YYYY-MM-DD`.

| Periodicidad | La cuota k vence en |
|---|---|
| ANUAL | `fechaBase` + k años |
| MENSUAL | `fechaBase` + k meses |
| QUINCENAL | `fechaBase` + ⌊k/2⌋ meses, más 15 días si k es impar |

Si el mes destino no tiene ese día, se usa el último día del mes. Cada vencimiento se calcula desde `fechaBase`, nunca desde el anterior, para que el recorte no se arrastre.

### 5.5 Casos de referencia

**A. 10 000 al 12 % anual, 12 cuotas mensuales.** i = 0,01. Cuota 888,49.

| Nº | Capital | Interés | Cuota | Saldo |
|---|---|---|---|---|
| 1 | 788,49 | 100,00 | 888,49 | 9 211,51 |
| 2 | 796,37 | 92,12 | 888,49 | 8 415,14 |
| 11 | 870,98 | 17,51 | 888,49 | 879,67 |
| 12 | 879,67 | 8,80 | 888,47 | 0,00 |

Suma de capital 10 000,00. Suma de intereses 661,86.

**B. 1 000 al 0 %, 3 cuotas mensuales.** Cuota 333,33.

| Nº | Capital | Interés | Cuota | Saldo |
|---|---|---|---|---|
| 1 | 333,33 | 0,00 | 333,33 | 666,67 |
| 2 | 333,33 | 0,00 | 333,33 | 333,34 |
| 3 | 333,34 | 0,00 | 333,34 | 0,00 |

**C. 5 000 al 10 % anual, 2 cuotas anuales.** i = 0,10. Cuota 2 880,95.

| Nº | Capital | Interés | Cuota | Saldo |
|---|---|---|---|---|
| 1 | 2 380,95 | 500,00 | 2 880,95 | 2 619,05 |
| 2 | 2 619,05 | 261,91 | 2 880,96 | 0,00 |

**D. 2 000 al 24 % anual, 24 cuotas quincenales.** i = 0,01. Cuota 94,15.

| Nº | Capital | Interés | Cuota | Saldo |
|---|---|---|---|---|
| 1 | 74,15 | 20,00 | 94,15 | 1 925,85 |
| 2 | 74,89 | 19,26 | 94,15 | 1 850,96 |
| 23 | 92,30 | 1,85 | 94,15 | 93,13 |
| 24 | 93,13 | 0,93 | 94,06 | 0,00 |

**E. Fechas.**

| Base | Periodicidad | Cuota | Vence |
|---|---|---|---|
| 2026-01-31 | MENSUAL | 1 | 2026-02-28 |
| 2026-01-31 | MENSUAL | 2 | 2026-03-31 |
| 2026-01-31 | MENSUAL | 12 | 2027-01-31 |
| 2026-01-10 | QUINCENAL | 1 | 2026-01-25 |
| 2026-01-10 | QUINCENAL | 2 | 2026-02-10 |
| 2026-01-10 | QUINCENAL | 3 | 2026-02-25 |
| 2026-01-10 | QUINCENAL | 24 | 2027-01-10 |
| 2024-02-29 | ANUAL | 1 | 2025-02-28 |

---

## 6. Autenticación

### 6.1 Tokens

| Token | Formato | Duración | Contenido | Dónde vive en el cliente |
|---|---|---|---|---|
| Access | JWT HS256 firmado con `JWT_SECRET` | `JWT_ACCESS_TTL`, 15 min | `sub`, `username`, `rol`, `iat`, `exp` | Memoria de la aplicación React |
| Refresh | 32 bytes aleatorios en base64url | `REFRESH_TTL_DAYS`, 7 días | Nada, se valida contra la tabla | Cookie `httpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`, `Secure` según `COOKIE_SECURE` |

El refresh es opaco porque su función es ser revocable, y eso exige consultar la base de datos. Se guarda su hash SHA-256. Web y API comparten origen gracias al proxy de nginx en Docker y al proxy de Vite en desarrollo, así que la cookie funciona sin CORS.

### 6.2 Rotación y detección de reuso

Cada login crea una familia nueva con un `familiaId` UUID. Cada refresh emite un token nuevo de la misma familia y revoca el usado.

| Token recibido en `/auth/refresh` | Resultado |
|---|---|
| Falta la cookie, o el hash no existe | 401 `NO_AUTENTICADO` |
| Existe, no revocado, no expirado | Se marcan `revocadoEn` y `reemplazadoPorId`. Se emiten access y refresh nuevos. 200 |
| Existe pero expirado | Se revoca. 401 `NO_AUTENTICADO` |
| Existe y ya estaba revocado | Reuso detectado. Se revoca toda la familia. 401 `TOKEN_REVOCADO` |

`POST /auth/logout` revoca la familia entera y responde con la cookie vacía y expirada.

Un login con credenciales incorrectas responde 401 `NO_AUTENTICADO`, sin distinguir entre usuario inexistente y contraseña errónea.

### 6.3 Capas del módulo `auth`

- **domain:** entidades `Usuario` y `RefreshToken`, con `rotar(ahora)`, `revocar(ahora)` y `estaVigente(ahora)`.
- **application:** casos de uso `Login`, `RefrescarSesion` y `CerrarSesion`. Puertos `UsuarioRepository`, `RefreshTokenRepository`, `PasswordHasher` (`hash`, `comparar`) y `TokenIssuer` (`firmar`, `verificar`). Usa `Clock` de `shared`.
- **infrastructure:** `BcryptPasswordHasher`, `JwtTokenIssuer`, `PrismaUsuarioRepository`, `PrismaRefreshTokenRepository`. `JwtAuthGuard` global con `APP_GUARD` y decorador `@Public()`. `RolesGuard` con decorador `@Roles(...)`. ADMIN pasa cualquier `@Roles`.

Los errores `TokenRevocadoError` y `NoAutenticadoError` viven en `packages/domain/errors` junto con los demás, para compartir el catálogo de mensajes.

### 6.4 Matriz de endpoints por rol

| Endpoint | OFICIAL | ANALISTA | CAJERO | ADMIN |
|---|---|---|---|---|
| `GET /health` | público | público | público | público |
| `POST /auth/login`, `POST /auth/refresh` | público | público | público | público |
| `POST /auth/logout`, `GET /auth/me` | ✓ | ✓ | ✓ | ✓ |
| `GET /tipos-empleo`, `GET /bancos` | ✓ | ✓ | ✓ | ✓ |
| `POST /solicitudes` | ✓ | | | ✓ |
| `GET /solicitudes`, `GET /solicitudes/:id` | ✓ | ✓ | ✓ | ✓ |
| `POST /solicitudes/:id/aprobar`, `POST /solicitudes/:id/rechazar` | | ✓ | | ✓ |
| `GET /creditos`, `GET /creditos/:id`, `GET /creditos/:id/plan-pagos` | ✓ | ✓ | ✓ | ✓ |
| `POST /desembolsos` | | | ✓ | ✓ |

`/api/docs` es público y no forma parte de la API versionada.

### 6.5 Cliente HTTP del frontend

1. Adjunta `Authorization: Bearer` desde memoria y `Accept-Language` desde el selector de idioma.
2. Con 401 `NO_AUTENTICADO`, llama a `/auth/refresh` una sola vez. Las peticiones concurrentes esperan esa misma promesa y se reintentan con el nuevo access.
3. Si el refresh falla, o el código es `TOKEN_REVOCADO`, limpia la memoria y redirige a `/login`.
4. **Arranque silencioso.** Al cargar la aplicación, antes de renderizar rutas protegidas, llama a `/auth/refresh`. Si la cookie es válida, recupera access y usuario. Si no, muestra el login.

---

## 7. Frontend

### 7.1 Librerías

| Necesidad | Elección |
|---|---|
| Router | React Router v6 |
| Estado del servidor | TanStack Query |
| Formularios | React Hook Form + Zod |
| Estilos | Tailwind CSS |
| Idioma | Hook propio `useT()` con diccionarios `es` y `en` para etiquetas. Los errores usan `resolverMensaje` del dominio |

No se usa librería de componentes.

### 7.2 Estructura

```
apps/web/src/
  app/            router, providers, layout con menú según rol
  features/
    auth/         LoginPage, AuthProvider, RequireAuth, RequireRol
    solicitudes/  ListadoPage, NuevaSolicitudPage, api.ts
    comite/       BandejaPage, DictamenPage, api.ts
    desembolsos/  BandejaPage, DesembolsoPage, api.ts
    plan-pagos/   ConsultaPage, TablaPlan, api.ts
  shared/
    api/          httpClient, ApiError, hooks de catálogos
    ui/           Button, Field, Select, Card, Table, Badge, ConfirmDialog, Toast
    i18n/         useT, es.ts, en.ts
    format/       dinero, fechas, periodicidad
```

Los componentes no calculan. Todo cálculo sale de `packages/domain` y todo acceso a datos sale del `api.ts` de cada feature.

### 7.3 Rutas

| Ruta | Roles | Pantalla | Datos |
|---|---|---|---|
| `/login` | público | Login | `POST /auth/login` |
| `/` | autenticado | Redirige: OFICIAL y ADMIN a `/solicitudes`, ANALISTA a `/comite`, CAJERO a `/desembolsos` | |
| `/solicitudes` | todos | Listado con filtros de estado y cédula | `GET /solicitudes` |
| `/solicitudes/nueva` | OFICIAL, ADMIN | Captura | `GET /tipos-empleo`, `POST /solicitudes` |
| `/comite` | ANALISTA, ADMIN | Bandeja de PENDIENTE | `GET /solicitudes?estado=PENDIENTE` |
| `/comite/:solicitudId` | ANALISTA, ADMIN | Dictamen | `GET /solicitudes/:id`, aprobar o rechazar |
| `/desembolsos` | CAJERO, ADMIN | Bandeja de APROBADA | `GET /creditos?estado=APROBADA` |
| `/desembolsos/:creditoId` | CAJERO, ADMIN | Desembolso | `GET /creditos/:id`, `GET /bancos`, `POST /desembolsos`, `GET /creditos/:id/plan-pagos` |
| `/plan-pagos` | todos | Consulta por cédula | `GET /creditos?cedula=`, `GET /creditos/:id/plan-pagos` |

`RequireAuth` espera el arranque silencioso antes de decidir. `RequireRol` muestra una página 403. El menú solo muestra lo que el rol puede abrir.

### 7.4 Pantallas

**Nueva solicitud.** Tres bloques: personal, laboral y condiciones. Un panel lateral se actualiza mientras se escribe:

- Edad con `calcularEdad`. Si pasa de 80, el panel lo marca y el botón de enviar queda deshabilitado.
- Cuota nivelada con `calcularCuotaNivelada`, junto con total a pagar y total de intereses.
- Si las condiciones están incompletas o son inválidas, muestra "Completa las condiciones del crédito".

El esquema Zod llama a las funciones del dominio y usa el mismo catálogo de mensajes que la API.

**Dictamen del comité.** Solo lectura. Muestra exactamente los siete campos del enunciado, en dos grupos:

- *Cliente:* cédula, nombre completo y edad.
- *Crédito:* monto solicitado, cantidad de cuotas, periodicidad y plazo. El plazo se muestra como texto, por ejemplo "24 cuotas quincenales".

No se muestran datos laborales. Debajo van el campo Observaciones y los botones **Aprobar Crédito** y **Rechazar Crédito**. Ambos exigen observaciones y abren un diálogo de confirmación. Al aprobar, vuelve a la bandeja con un aviso que muestra el número de crédito creado. Si la solicitud ya no está PENDIENTE, la pantalla muestra su estado y oculta las acciones.

**Desembolso.** Solo lectura: cédula, nombre, monto, tasa, periodicidad y plazo. Debajo, el selector de banco y el número de cuenta. Procesar abre una confirmación con banco y cuenta. Tras el éxito, la misma pantalla muestra el estado DESEMBOLSADA y el plan de pagos. Si el crédito no está APROBADA al abrir la pantalla, se oculta el formulario y se muestra el estado. Si está DESEMBOLSADA, se muestran además los datos del desembolso y el plan.

**Consulta de plan.** Un campo de cédula. Si la cédula tiene un crédito, carga su plan directamente. Si tiene varios, muestra la lista para elegir. Si no tiene ninguno, lo indica. La tabla es el componente `TablaPlan`, compartido con la pantalla de desembolso.

### 7.5 Manejo de errores

- `httpClient` convierte toda respuesta de error en `ApiError { status, code, message, details }`.
- En formularios, `details` se asigna a cada campo con `setError`.
- Los errores de negocio se muestran en un aviso con el `message` traducido, y después se invalida la consulta para refrescar el estado real.
- Los errores de red o 500 muestran un aviso genérico con opción de reintentar.
- Un `ErrorBoundary` en el layout atrapa errores de renderizado.
- Los botones de acción se deshabilitan mientras su mutación está en curso.

### 7.6 Formato

Dinero y fechas con `Intl`, según el idioma elegido. El dinero se muestra con el símbolo `C$`. El selector de idioma está en la barra superior y se recuerda en `localStorage`.

---

## 8. Infraestructura

### 8.1 Monorepo

npm workspaces, sin herramientas adicionales de monorepo.

```
package.json            workspaces apps/* y packages/*; scripts raíz
package-lock.json
tsconfig.base.json      strict
.eslintrc.cjs           reglas comunes y límites de capas
docker-compose.yml
.env.example
.gitignore
.github/workflows/ci.yml
data/.gitkeep
docs/
apps/api/               Dockerfile, docker-entrypoint.sh, prisma/, src/, test/
apps/web/               Dockerfile, nginx.conf, src/
packages/domain/
```

`packages/domain` se compila con tsup a CommonJS y ESM, con declaraciones de tipos. tsup es dependencia de desarrollo. En desarrollo, Vite apunta al código fuente del dominio con un alias.

`eslint-plugin-boundaries` impide que `application` importe `infrastructure` y que `domain` importe cualquier otra capa. `npm run lint` falla si se rompe la regla.

### 8.2 Scripts raíz

| Script | Qué hace |
|---|---|
| `npm run dev` | domain en watch, API en watch y Vite con proxy de `/api` al puerto 3000 |
| `npm run build` | domain, luego api, luego web |
| `npm test` | Pruebas de dominio, casos de uso y frontend |
| `npm run test:int` | Integración con Prisma |
| `npm run test:e2e` | HTTP de punta a punta |
| `npm run test:all` | Todas las anteriores |
| `npm run lint` | ESLint con límites de capas |
| `npm run db:migrate` | Migraciones de Prisma sobre la base local |
| `npm run db:seed` | Seed sobre la base local |

### 8.3 Dockerfiles

Ambos usan la raíz del repositorio como contexto de construcción. Son multi-stage sobre `node:22-bookworm-slim`.

**API**

1. `deps`: copia los `package.json` y el lockfile y ejecuta `npm ci`.
2. `build`: copia el código, compila domain, genera el cliente Prisma y compila la API.
3. `runtime`: solo `dist`, dependencias de producción, `prisma/` y el entrypoint. Corre como usuario `node`.

El entrypoint ejecuta `prisma migrate deploy`, luego el seed y luego `node dist/main.js`. El seed usa `upsert` y es idempotente.

**Web**

1. `build`: igual que la API hasta `vite build`.
2. `runtime`: `nginx:alpine` con los estáticos. `nginx.conf` devuelve `index.html` para las rutas del SPA y hace proxy de `/api/` a `http://api:3000`.

### 8.4 docker-compose

| Servicio | Puerto en el host | Detalle |
|---|---|---|
| `api` | 3000 | Bind mount de `./data` en `/app/data`. Healthcheck contra `GET /api/v1/health` |
| `web` | 8080 | `depends_on: api` con `condition: service_healthy` |

SQLite no es un servicio. El archivo `data/credito.db` queda en el host gracias al bind mount. La carpeta `data/` se versiona con `.gitkeep` y los archivos `*.db` se ignoran.

Comando único:

```bash
docker compose up --build
```

### 8.5 Variables de entorno

La API valida su configuración al arrancar y no inicia si algo falta o es inválido. El compose trae valores de demo, así que funciona sin `.env`.

| Variable | Valor en compose | Validación |
|---|---|---|
| `DATABASE_URL` | `file:/app/data/credito.db` | requerida |
| `JWT_SECRET` | secreto de demo de 32 caracteres o más, marcado como tal en el README | mínimo 32 caracteres |
| `JWT_ACCESS_TTL` | `15m` | duración válida |
| `REFRESH_TTL_DAYS` | `7` | entero positivo |
| `COOKIE_SECURE` | `false` | booleano |
| `APP_TZ` | `America/Managua` | zona IANA válida |
| `PORT` | `3000` | entero |

`Clock` vive en `apps/api/src/shared/application/ports` y expone `ahora(): Date` y `hoy(): string`. `hoy()` devuelve la fecha `YYYY-MM-DD` en `APP_TZ`. De ahí salen la fecha base del plan y la fecha para calcular la edad. Los instantes siguen en UTC.

### 8.6 CI

`.github/workflows/ci.yml` corre en cada push y pull request:

1. `npm ci`
2. `npm run lint`
3. `npm run test:all`, con el umbral de cobertura del dominio
4. Smoke test: `docker compose up -d --build`, espera al healthcheck, hace login con `curl` contra `http://localhost:8080/api/v1/auth/login`, y termina con `docker compose down`.

---

## 9. Pruebas

### 9.1 Herramientas

| Herramienta | Uso |
|---|---|
| Vitest | Todos los workspaces. En la API, con `unplugin-swc` para los decoradores de Nest |
| Supertest | HTTP de la API |
| fast-check | Invariantes del motor financiero |
| Testing Library + MSW | Frontend |

No hay pruebas de navegador con Playwright. El flujo completo lo cubren las pruebas HTTP y el smoke test.

### 9.2 Por capa

**Dominio.** En `packages/domain`, archivos `*.spec.ts` junto al código.

- Cada par de estado y acción de la tabla de transiciones.
- Los casos de edad de la sección 4.7.
- Los casos A a E de la sección 5.5, con los números exactos.
- Invariantes con fast-check sobre montos, tasas, cuotas y periodicidades aleatorias.
- Cada `code` del catálogo tiene mensaje en `es` y en `en`, y ningún placeholder queda sin reemplazar.

**Casos de uso.** En `apps/api/src`, archivos `*.spec.ts`. Repositorios en memoria, `UnitOfWork` falso que ejecuta la función, `Clock` fijo.

- `AprobarSolicitud` crea `CR-000001` y el plan completo.
- `RechazarSolicitud` no crea crédito.
- `Desembolsar` rechaza los estados distintos de APROBADA.
- `RefrescarSesion` rota, detecta reuso y revoca la familia.
- Los errores de dominio se propagan sin transformarse.

**Integración.** En `apps/api/test`, archivos `*.int.spec.ts`. SQLite real en un archivo temporal por archivo de prueba, con migraciones aplicadas.

- **Atomicidad:** un repositorio de cuotas que falla a mitad de la inserción. La solicitud sigue PENDIENTE, no hay crédito y no quedó ninguna cuota.
- **Concurrencia:** dos aprobaciones en paralelo de la misma solicitud. Una tiene éxito, la otra recibe `TRANSICION_INVALIDA` y existe un solo crédito.
- **Secuencia:** tres aprobaciones dan `CR-000001`, `CR-000002` y `CR-000003`.
- **Decimal:** el plan leído de la base coincide al centavo con el calculado.

**HTTP.** En `apps/api/test`, archivos `*.e2e.spec.ts`. App Nest completa con Supertest y SQLite temporal.

- Flujo feliz: oficial crea, analista aprueba, cajero desembolsa, consulta del plan por cédula.
- Matriz de roles como tabla de datos: un test recorre cada fila de la sección 6.4 y verifica 2xx o 403.
- Contrato de error: 400 con `details`, 422 por edad, 409 por transición, 404 y 500 con el formato unificado.
- Idioma: el mismo error con `Accept-Language: en` y `es` devuelve el mismo `code` y distinto `message`.
- Autenticación: cookie `httpOnly` en login, rotación en refresh, `TOKEN_REVOCADO` en reuso, logout que invalida la cookie.

**Frontend.** En `apps/web/src`, archivos `*.spec.tsx`.

- El formulario muestra la cuota 888,49 con los datos del caso A.
- El formulario bloquea el envío con edad 81.
- Un 400 de la API aparece junto al campo correcto.
- Tres peticiones con 401 simultáneo disparan un solo refresh y se reintentan.
- `RequireRol` muestra 403 al rol equivocado.

### 9.3 Cobertura

Umbral de 95 % de líneas solo en `packages/domain`. CI falla si baja. No hay umbral global.

### 9.4 Trazabilidad con la evaluación

| Punto de evaluación | Prueba |
|---|---|
| No se desembolsan créditos no aprobados | Dominio, caso de uso y HTTP con 422 `CREDITO_NO_APROBADO` |
| Transacción ACID | Integración de atomicidad |
| Sin duplicación | Frontend y API prueban la misma función con el caso A |
| Docker funcional | Smoke test de CI |

---

## 10. Entregables

### 10.1 Git

- Rama `feat/solicitud-credito`. `main` conserva el commit inicial hasta el Pull Request final.
- Conventional Commits en español.
- Se versiona `docs/prueba-tecnica.md`. El `.docx` original se ignora.
- Repositorio público en GitHub.
- Documentación en español.

### 10.2 README.md

| # | Sección | Contenido |
|---|---|---|
| 1 | Título | Nombre, badge de CI y descripción de una línea |
| 2 | Arranque rápido | Requisito Docker, `docker compose up --build`, direcciones: web `http://localhost:8080`, API `http://localhost:3000/api/v1`, Swagger `http://localhost:3000/api/docs` |
| 3 | Usuarios de demo | Los cuatro usuarios, la contraseña de demo y lo que puede cada rol |
| 4 | Recorrido guiado | Flujo feliz en cinco pasos, más un intento de desembolsar algo no aprobado |
| 5 | Desarrollo sin Docker | Node 22, `npm install`, migrar, sembrar, `npm run dev` |
| 6 | Pruebas | Los scripts y qué cubre cada uno |
| 7 | Arquitectura | Diagrama Mermaid de capas, un párrafo por capa, dónde viven la fórmula, la transacción y las reglas, enlace a esta spec |
| 8 | Interpretaciones del enunciado | Las de la sección 2.4, más los siete campos del comité y la zona horaria |
| 9 | Estructura | Árbol de primer nivel |
| 10 | Limitaciones conocidas | Secuencia de crédito segura solo con escrituras serializadas, uid del bind mount en Linux, secreto de demo, sin HTTPS |
| 11 | Uso de IA | Enlace a la bitácora |

### 10.3 Bitácora de IA

`docs/bitacora-ia.md`. Se crea en el primer commit y se actualiza en el mismo commit que el trabajo que describe.

Formato de cada entrada:

```markdown
### AAAA-MM-DD · Título
- **Herramienta y modelo:**
- **Objetivo:**
- **Prompts clave:**
- **Qué produjo la IA:**
- **Qué decidí yo y por qué:**
- **Qué corregí o rechacé:**
- **Commits:**
```

### 10.4 Resumen del Pull Request

```markdown
## Qué incluye
## Decisiones de arquitectura
## Cumplimiento del enunciado     (tabla: requisito → implementación → prueba)
## Cómo probarlo
## Uso de IA
```

---

## 11. Trazabilidad con el enunciado

| Requisito del enunciado | Dónde queda cubierto |
|---|---|
| SQLite en archivo local mapeado por volumen | 8.4 |
| NestJS, React con Vite | 2.1 |
| Dockerfile y `docker-compose.yml` de un comando | 8.3, 8.4 |
| Login con usuario y contraseña que emite JWT | 6.1, 7.3 |
| Formulario con datos personales, laborales y condiciones | 3.3, 7.4 |
| Periodicidad quincenal, mensual y anual | 5.2 |
| Cuota nivelada visible en el frontend | 7.4 |
| Fórmulas de `n`, `i` y cuota | 5.2 |
| Rechazo de mayores de 80 años | 2.4, 4.3, 4.6 |
| Comité en solo lectura con los siete campos | 7.4 |
| Observaciones obligatorias al aprobar | 4.3 |
| Botones Aprobar Crédito y Rechazar Crédito | 7.4 |
| Crédito con número incremental relacionado con la solicitud | 2.3, 4.3 |
| Plan de pagos con tantas cuotas como el plazo | 5.3 |
| Desembolso solo para APROBADA | 4.3, 7.4 |
| Desembolso muestra cédula, nombre, monto, tasa, periodicidad y plazo | 7.4 |
| Banco destino entre los cuatro indicados y número de cuenta | 2.3, 3.3 |
| Estado DESEMBOLSADA tras procesar | 4.1, 4.3 |
| Extra: refresh token | 6.1, 6.2 |
| Extra: búsqueda del plan por cédula | 3.2, 7.4 |
| Evaluación: integridad de estados | 4, 9.4 |
| Evaluación: transacción ACID | 4.3, 9.2 |
| Evaluación: calidad y sin duplicación | 2.2, 8.1 |
| Evaluación: Docker funcional | 8.4, 8.6 |
| Entregable: README | 10.2 |
| Entregable: resumen de arquitectura y bitácora de IA | 10.3, 10.4 |

---

## 12. Ajustes entre secciones y correcciones de la revisión

**Ajustes introducidos por secciones aprobadas y ya aplicados:**

1. La sección de autenticación eliminó `RefreshDto`, cambió `TokensResponse` a `{ accessToken, usuario }` y agregó `familiaId` a `RefreshToken`.
2. La sección de frontend agregó el filtro `estado` a `GET /creditos`.
3. La sección de infraestructura agregó `GET /health`, la variable `APP_TZ` y `Clock.hoy()`.
4. Se aprobaron Swagger en `/api/docs`, el workflow de CI, córdobas como moneda, los siete campos del comité y el repositorio público.

**Correcciones de la revisión final:**

1. El motor financiero lanzaba un código `REGLA_NEGOCIO` que no estaba en el catálogo de errores. Se reemplazó por `PARAMETROS_CREDITO_INVALIDOS`, 422, agregado al catálogo y a la lista de errores de dominio.
2. La arquitectura decía que cada módulo de la API tiene carpeta `domain`, pero las entidades viven en `packages/domain`. Se precisó que solo `auth` tiene `domain/` propio, y que `UnitOfWork` y `Clock` viven en `shared`.
3. `TokenRevocadoError` figuraba a la vez en el dominio compartido y en el módulo `auth`. Queda solo en `packages/domain/errors`, junto con el nuevo `NoAutenticadoError`.
4. El número de crédito se derivaba de "máximo actual + 1" sobre un texto. Se agregó la columna entera única `secuencia`.
5. Se definieron el tipo de columna de cada campo, el formato `YYYY-MM-DD` para fechas de calendario, la contraseña de demo, los códigos de validación por campo y el comportamiento de las pantallas de comité y desembolso cuando la solicitud no está en el estado esperado.
