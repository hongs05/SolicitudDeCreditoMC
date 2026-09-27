# Bitácora de uso de Inteligencia Artificial

Este documento registra cómo se utilizaron herramientas de IA durante el desarrollo de la prueba técnica, qué produjeron y qué decisiones se tomaron sobre sus propuestas. Cada entrada se incorpora en el mismo commit que el trabajo que describe, de modo que el historial de git respalda el registro.

---

## 1. Herramientas utilizadas

| Herramienta | Modelo | Uso principal |
|---|---|---|
| Claude Code, aplicación de escritorio | Claude Fable 5.1 | Análisis del enunciado, conversión de formato y diseño inicial |
| Claude Code, aplicación de escritorio | Claude Opus 5.5 | Diseño de autenticación, frontend, infraestructura, pruebas y entregables; redacción de la especificación |
| Superpowers, skill de brainstorming | No aplica | Proceso guiado de diseño con aprobación explícita por etapa |

---

## 2. Metodología

El trabajo con IA siguió cuatro principios:

1. **Diseño antes que código.** No se generó código de producto hasta cerrar y aprobar una especificación completa.
2. **Aprobación explícita por sección.** Cada sección del diseño se presentó por separado y solo avanzó con aprobación del autor.
3. **Recomendación justificada, no menús.** Se pidió a la herramienta una recomendación con su justificación en cada decisión, para poder evaluarla y, cuando correspondía, rechazarla.
4. **Verificación de resultados numéricos.** Los valores financieros de referencia se calcularon con un script, no se aceptaron cifras redactadas a mano.

---

## 3. Registro de sesiones

### 3.1 Análisis del enunciado

- **Fecha:** 2026-09-24
- **Modelo:** Claude Fable 5.1
- **Objetivo:** comprender el alcance real de la prueba e identificar ambigüedades antes de diseñar.

**Instrucciones dadas a la herramienta**

- Analizar el enunciado en profundidad y proponer una estrategia de resolución, sin ejecutar cambios.
- Convertir el enunciado del formato Word a Markdown para versionarlo junto al código.

**Resultados**

- Separación entre los requisitos funcionales y los criterios que realmente se evalúan: reglas de estado, atomicidad, calidad de código y Docker.
- Identificación de ambigüedades del enunciado: relación entre plazo y cantidad de cuotas, factor `n = 24` para la periodicidad quincenal, tasa de interés del 0 %, obligatoriedad de observaciones al rechazar y ausencia de un modelo de usuarios y roles.
- Conversión del enunciado a [prueba-tecnica.md](prueba-tecnica.md). Ante la ausencia de pandoc, la herramienta extrajo el contenido directamente del XML del documento, conservando títulos y listas.

**Validación del autor:** revisión del Markdown contra el documento original.

### 3.2 Diseño de la solución

- **Fecha:** 2026-09-24
- **Modelos:** Claude Fable 5.1 y Claude Opus 5.5
- **Objetivo:** definir la arquitectura y cerrar el diseño completo antes de implementar.

**Instrucciones dadas a la herramienta**

- Proponer la arquitectura más adecuada según los principios de Clean Architecture y Clean Code aplicados a TypeScript.
- Evaluar el uso de tablas de catálogo en lugar de enumeraciones, incluida una tabla de bancos relacionada con el desembolso.
- Diseñar un manejo de errores unificado con mensajes en español e inglés.
- Cerrar el diseño mediante un prompt estructurado, redactado por el autor, que fija las decisiones ya tomadas y exige avanzar sección por sección:

```text
Vamos a cerrar el diseño sección por sección: API y contratos, máquina de
estados, motor financiero, autenticación, frontend, infraestructura, pruebas
y entregables. Presenta una sola sección y espera aprobación. Da tu
recomendación con su justificación, no un menú de opciones. Al final
escribe la especificación, revísala contra placeholders, contradicciones,
ambigüedades y reglas del enunciado no reflejadas, y solicita revisión.
No escribas código hasta que la especificación esté aprobada.
```

**Resultados**

- Comparación de tres enfoques de organización del código. Se adoptó un monorepo con un paquete de dominio compartido y Prisma como ORM.
- Arquitectura hexagonal con regla de dependencia verificada mediante lint.
- Ocho secciones de diseño aprobadas: API y contratos, máquina de estados, motor financiero, autenticación, frontend, infraestructura, pruebas y entregables.
- Casos de prueba financieros con valores exactos, generados mediante un script de cálculo.
- Especificación consolidada en [2026-09-24-solicitud-credito-design.md](superpowers/specs/2026-09-24-solicitud-credito-design.md). En su revisión final la herramienta detectó y corrigió cinco inconsistencias entre secciones, documentadas en la sección 12 de la especificación.

### 3.3 Implementación del paquete de dominio

- **Fecha:** 2026-09-26
- **Modelo:** Claude Fable 5.1 como controlador; Claude Haiku 4.5 y Claude Sonnet como implementadores; Claude Sonnet como revisor
- **Objetivo:** implementar `packages/domain` según el plan 1.

**Instrucciones dadas a la herramienta**

- Ejecutar el plan `docs/superpowers/plans/2026-09-25-01-fundacion-dominio.md` con TDD, tarea por tarea.

**Resultados**

- Monorepo con npm workspaces y paquete de dominio compilado a ESM y CommonJS.
- Motor financiero, máquina de estados, cálculo de edad, roles, errores y catálogo bilingüe con pruebas.
- Pruebas de propiedades con fast-check sobre las invariantes del plan de amortización.

**Validación del autor:** revisión del código y de la cobertura del dominio.

**Validación del autor:** aprobación explícita de cada sección y revisión de la especificación final.

### 3.4 Implementación de la API

- **Fecha:** 2026-09-26
- **Modelo:** Claude Fable 5.1 como controlador; Claude Sonnet como implementador y revisor
- **Objetivo:** implementar `apps/api` según el plan 2.

**Instrucciones dadas a la herramienta**

- Ejecutar el plan `docs/superpowers/plans/2026-09-25-02-api.md` y sus partes B y C con TDD, tarea por tarea.

**Resultados**

- API NestJS con arquitectura hexagonal y límites de capas verificados por lint.
- Autenticación con JWT y refresh token opaco en cookie, con rotación y detección de reuso.
- Aprobación atómica con prueba de fallo a mitad de la inserción y prueba de concurrencia.
- Contrato de error unificado en español e inglés, y documentación OpenAPI.

**Validación del autor:** revisión del código, ejecución de la suite completa y prueba manual con curl.

### 3.5 Implementación del frontend

- **Fecha:** 2026-09-26
- **Modelo:** Claude Fable 5.1 como controlador; Claude Sonnet como implementador y revisor
- **Objetivo:** implementar `apps/web` según el plan 3.

**Instrucciones dadas a la herramienta**

- Ejecutar el plan `docs/superpowers/plans/2026-09-25-03-web.md` y sus partes B a E con TDD, tarea por tarea.

**Resultados**

- Seis pantallas con menú por rol, idioma español e inglés y cuota nivelada calculada en vivo con el mismo código que usa la API.
- Sesión con access token en memoria, refresh en cookie `httpOnly` y arranque silencioso al recargar.
- Protección contra doble envío en el dictamen y el desembolso.

**Validación del autor:** recorrido manual completo con los cuatro roles y revisión del código. El recorrido de la tarea 8 se hizo con `curl` contra la API (login por rol, registro, aprobación, desembolso y consulta del plan) y verificación del proxy de Vite hacia `/api/v1/health`, en lugar de un navegador interactivo.

### 3.6 Infraestructura y entrega

- **Fecha:** 2026-09-26
- **Modelo:** Claude Fable 5.1 como controlador; Claude Sonnet y Claude Haiku 4.5 como implementadores; Claude Sonnet como revisor por tarea y Claude Opus como revisor final de cada plan
- **Objetivo:** contenerizar la solución, configurar CI y preparar la entrega.

**Resultados**

- Imágenes multi-stage para API y web, y `docker-compose.yml` que levanta todo con un comando.
- Workflow de CI con lint, pruebas, cobertura del dominio y prueba de humo sobre Docker.
- README con arranque, recorrido guiado, arquitectura, interpretaciones del enunciado y limitaciones.

**Validación del autor:** ejecución de `docker compose up --build` en limpio y recorrido completo en el navegador.

### 3.7 Alineación del frontend con el diseño visual

- **Fecha:** 2026-09-27
- **Herramienta:** Claude Code
- **Objetivo:** comparar el frontend con el prototipo visual "Crédito MC" y llevarlo a ese diseño sin perder funcionalidad.

**Instrucciones dadas a la herramienta**

- Revisar si el frontend cumple la especificación y el diseño, listar las diferencias y aplicarlas conservando lo que ya funciona.

**Resultados**

- Tema del diseño con tokens de color, tipografía Plus Jakarta Sans y DM Mono, y modo oscuro automático.
- Menú lateral agrupado con contadores de pendientes y aprobados, cajón en móvil y menú de usuario.
- Login en dos columnas, listado con tarjetas de estado, formulario en bloques numerados con periodicidad segmentada y relación cuota / ingreso, comité ordenado por antigüedad y días de espera, desembolso y plan de pagos con totales y próxima cuota.
- Pantalla nueva de expediente (`/solicitudes/:solicitudId`) con historial, observaciones y acciones según el rol, usando solo rutas existentes de la API.
- Los errores de red o de servidor en acciones ofrecen Reintentar; el diálogo de confirmación cita las observaciones o el banco y la cuenta.

**Qué se mantuvo:** idioma español e inglés, textos y accesibilidad que usan las pruebas, reglas de rol, validaciones, refresh de sesión y protección contra doble envío.

**Qué quedó fuera:** la portada pública, Usuarios, Mi cuenta y el cambio de contraseña del prototipo, porque requieren rutas nuevas en la API; y la búsqueda por nombre del listado, porque la API filtra por cédula exacta.

**Validación del autor:** pruebas del frontend, lint, verificación de tipos, build de producción y recorrido en el navegador con los cuatro roles, en escritorio, móvil y modo oscuro.
---

### 3.8 Revisión final, validaciones de negocio y preparación de la entrega

- **Fecha:** 2026-09-27
- **Herramienta:** Claude Code
- **Objetivo:** revisar el frontend contra el diseño, corregir los defectos encontrados, completar las validaciones pendientes y dejar el repositorio listo para entregar.

**Instrucciones dadas a la herramienta**

- Revisar el frontend y el estado del repositorio, y corregir los defectos encontrados.
- Comparar pantalla por pantalla con el prototipo "Crédito MC" y aplicar las diferencias.
- Dar estilo a los desplegables y al selector de fecha.
- Validar cédulas repetidas, buscar otras validaciones pendientes y mostrar los errores con mensajes o modales.

**Resultados**

- Bandeja del comité por orden de llegada en todas las páginas: la API acepta `orden=asc|desc` en lugar de invertir cada página en el navegador.
- La consulta del plan de pagos guarda la cédula y el crédito elegido en la URL y se mantiene sincronizada con Atrás y Adelante.
- Tokens de color de la revisión de contraste del diseño, menú lateral claro y controles de formulario con los colores del tema.
- Calendario propio para la fecha de nacimiento, con selector de mes y año y uso completo con teclado, porque el selector nativo no admite estilos.
- Validaciones nuevas en el dominio, compartidas por la API y el formulario: una sola solicitud abierta por cédula, fecha de nacimiento coherente con solicitudes anteriores, edad mínima de 18 años, antigüedad laboral posible para la edad, plazo máximo con mensaje propio y formatos de nombre y teléfono.
- Modales para los errores que bloquean: cédula con solicitud abierta, fecha de nacimiento distinta, y solicitudes o créditos procesados por otro usuario al mismo tiempo.
- La imagen de la API se adueña de `data/` al arrancar y ejecuta la API sin privilegios, así Docker funciona en Linux sin cambiar permisos.
- Se retiraron del repositorio las skills locales de Claude Code, ajenas a la solución.

**Validación del autor:** pruebas del dominio con cobertura, pruebas unitarias, de integración y e2e de la API, pruebas del frontend, lint, verificación de tipos, build y recorrido en el navegador sobre `docker compose`.

---

## 4. Decisiones del autor frente a las propuestas de la IA

| Tema | Propuesta de la IA | Decisión final | Justificación |
|---|---|---|---|
| Stack | NestJS + React | Aceptada | TypeScript en ambos extremos permite una única implementación de la fórmula de la cuota |
| Plan de pagos | Amortización completa | Aceptada | Refleja el comportamiento esperado en una entidad financiera |
| Usuarios | Usuarios sembrados con un solo rol | **Modificada:** cuatro roles | Representa la separación real de funciones entre oficial, analista y cajero |
| Extras | Incluirlos en el diseño desde el inicio | Aceptada | Evita rediseñar el modelo de datos y la autenticación al final |
| Catálogos | Enumeraciones para todos los valores fijos | **Modificada:** tablas para bancos y tipos de empleo | Criterio acordado: tablas para datos sin lógica, enumeraciones para valores con lógica de negocio |
| Errores | Formato único con mensajes en español | **Modificada:** catálogo bilingüe con códigos estables | Separa la identificación del error de su presentación y habilita la internacionalización |
| Documentación de la API | Swagger | Aceptada | Permite al evaluador probar la API sin el frontend |
| Integración continua | GitHub Actions con prueba de humo sobre Docker | Aceptada | Demuestra que el entorno se levanta sin fallos |
| Pantalla del comité | Mostrar solo los siete campos que exige el enunciado | Aceptada | Es la instrucción explícita del enunciado |
| Moneda | Córdobas | Aceptada | Los cuatro bancos del enunciado operan en Nicaragua |
| Redondeo del caso C | Redondeo mitad al par para cuadrar una tabla | **Rechazada:** se mantuvo mitad hacia arriba | Se corrigió la referencia en lugar de cambiar la regla de redondeo |
| Registro de Swagger | Parche sobre las entrañas de Express para registrarlo tras `init()` | **Rechazada** | Swagger se registra antes de `init()` también en pruebas, sin modificar internos de Express |
| Guardas del motor financiero | Plazo máximo 30 años, cuota mayor que el interés inicial, monto mínimo un centavo | Aceptada | Propuestas por la revisión final del dominio |
| Cierre de sesión con access token vencido | No revocaba la sesión | **Corregida** | Detectado en la revisión final del frontend |
| Cédula con una solicitud abierta | Aviso que no bloquea el registro | **Modificada:** se bloquea en la API y en el formulario | Dos solicitudes simultáneas del mismo cliente duplicarían la evaluación de riesgo |
| Selector de fecha | Estilizar el control nativo | **Modificada:** calendario propio | El calendario nativo no admite estilos y obliga a retroceder mes a mes para una fecha de nacimiento |
| Trailer de autoría de los commits | La herramienta insertaba otro modelo | **Corregida:** normalizado a Claude Fable 5.1 en cada commit | Mantiene la trazabilidad de quién controló cada sesión |

---

## 5. Control de calidad sobre el contenido generado

- Ninguna propuesta se incorporó sin revisión y aprobación explícita.
- Las decisiones que modifican o interpretan el enunciado quedan documentadas en la especificación y se reflejarán en el README.
- El código que se genere en etapas posteriores se validará con pruebas automatizadas, lint de límites de arquitectura e integración continua antes de su incorporación.
