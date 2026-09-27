# Simulación del ciclo de vida de una solicitud de crédito

## Qué incluye

- Login con JWT, refresh token rotativo en cookie `httpOnly` y cuatro roles.
- Captura de solicitudes con cuota nivelada calculada en vivo y rechazo de mayores de 80 años.
- Comité de riesgo en solo lectura con los siete campos del enunciado, observaciones obligatorias y botones Aprobar Crédito y Rechazar Crédito.
- Aprobación atómica que crea el crédito `CR-000001` y todas sus cuotas de amortización.
- Desembolso a LAFISE, FICOHSA, BAC Credomatic o Banpro, solo para créditos aprobados.
- Extras: refresh token y consulta del plan de pagos por cédula.
- Interfaz y mensajes de error en español e inglés.
- Errores unificados con código estable y mensaje en español o inglés según `Accept-Language`.

## Decisiones de arquitectura

- **Hexagonal con la regla de dependencia de Clean Architecture.** `application` no importa Nest ni Prisma, y el lint lo verifica.
- **Dominio compartido.** `packages/domain` es TypeScript puro que usan la API y el frontend. La fórmula de la cuota existe una sola vez.
- **Unidad de trabajo como puerto.** La aprobación declara que es atómica sin saber cómo. Prisma la implementa con una transacción interactiva, serializada en el proceso para que SQLite no falle con escrituras concurrentes.
- **Estado solo en la solicitud.** El crédito existe si y solo si la solicitud fue aprobada, y las restricciones de unicidad lo garantizan en la base.
- **Catálogos contra enums.** Bancos y tipos de empleo son tablas porque son datos. Periodicidad, estado y rol son enums porque llevan lógica.
- **Refresh opaco en cookie.** Se guarda solo su hash, rota en cada uso y un reuso revoca toda la familia de tokens.
- **Errores con código estable y mensaje traducido.** El dominio emite códigos. Un solo filtro los traduce según `Accept-Language`.
- **Fechas del negocio en `America/Managua`.** Evita que una aprobación nocturna quede con fecha del día siguiente.

## Cumplimiento del enunciado

| Requisito | Implementación | Prueba |
|---|---|---|
| No desembolsar créditos no aprobados | `Solicitud.desembolsar()` en el dominio | `solicitud.spec.ts`, `desembolsar.use-case.spec.ts`, `desembolsos.e2e.spec.ts` |
| Aprobación y cuotas atómicas | `AprobarSolicitud` sobre `PrismaUnitOfWork` | `aprobacion.int.spec.ts`, con fallo simulado a mitad de la inserción |
| Cuota nivelada en el frontend | `PanelCuota` con `calcularCuotaNivelada` del dominio | `NuevaSolicitudPage.spec.tsx`, caso A = 888.49 |
| Rechazo de mayores de 80 | `validarEdadMaxima` en dominio y formulario | `edad.spec.ts`, `solicitudes.e2e.spec.ts`, `NuevaSolicitudPage.spec.tsx` |
| Observaciones obligatorias | `Solicitud.aprobar()` y `DictamenPage` | `solicitud.spec.ts`, `DictamenPage.spec.tsx` |
| Número de crédito relacionado | `Credito.desde()` y columna `secuencia` | `aprobacion.int.spec.ts` |
| Plan con tantas cuotas como el plazo | `generarPlanAmortizacion` | `plan-amortizacion.spec.ts`, con pruebas de propiedades |
| JWT y refresh token | Módulo `auth` | `auth.e2e.spec.ts`, `cliente.spec.ts` |
| Búsqueda del plan por cédula | `GET /creditos?cedula=` y `ConsultaPage` | `creditos.e2e.spec.ts`, `ConsultaPage.spec.tsx` |
| Permisos por rol | Guards y `RequireRol` | `roles.e2e.spec.ts`, `auth.spec.tsx` |
| Docker de un solo comando | `docker-compose.yml` | Job `docker` de CI |

## Cómo probarlo

```bash
docker compose up --build
```

Abrir http://localhost:8080 con los usuarios de demostración del README. Todos usan la contraseña `Demo2026!`.

## Uso de IA

Se usó Claude Code para analizar el enunciado, diseñar la solución sección por sección con aprobación explícita, escribir los planes de implementación y ejecutarlos con TDD. Las decisiones propias frente a las propuestas de la IA están en la tabla de la sección 4 de [docs/bitacora-ia.md](docs/bitacora-ia.md).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
