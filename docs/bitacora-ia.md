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

---

## 5. Control de calidad sobre el contenido generado

- Ninguna propuesta se incorporó sin revisión y aprobación explícita.
- Las decisiones que modifican o interpretan el enunciado quedan documentadas en la especificación y se reflejarán en el README.
- El código que se genere en etapas posteriores se validará con pruebas automatizadas, lint de límites de arquitectura e integración continua antes de su incorporación.
