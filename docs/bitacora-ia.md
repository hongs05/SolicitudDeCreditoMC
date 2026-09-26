# Bitácora de uso de IA

Registro de cómo se usó la IA en este proyecto. Cada entrada se agrega en el mismo commit que el trabajo que describe.

---

### 2026-09-24 · Análisis del enunciado y conversión a Markdown

- **Herramienta y modelo:** Claude Code (app de escritorio), modelo Claude Fable 5.1.
- **Objetivo:** entender a fondo el enunciado antes de escribir código.
- **Prompts clave:**
  - "Analiza profundamente este documento y dime cómo podemos resolverlo, pero no hagas nada todavía; primero genera un plan y debatimos."
  - "Transforma el documento primero a uno .md."
- **Qué produjo la IA:**
  - Un análisis del enunciado que separa lo que se evalúa de lo que solo se describe, y una lista de ambigüedades: plazo contra cuotas, `n = 24` quincenal, tasa 0 %, observaciones al rechazar, roles.
  - La conversión del `.docx` a [prueba-tecnica.md](prueba-tecnica.md). Al no estar pandoc instalado, extrajo el XML del Word con Python conservando títulos y listas.
- **Qué decidí yo y por qué:** trabajar primero el diseño y posponer el código, para poder defender cada decisión.
- **Qué corregí o rechacé:** nada en esta etapa.
- **Commits:** commit de documentación de diseño.

### 2026-09-24 · Diseño de la solución

- **Herramienta y modelo:** Claude Code con la skill de brainstorming de Superpowers. Modelos Claude Fable 5.1 y, desde la sección de autenticación, Claude Opus 5.5.
- **Objetivo:** cerrar la arquitectura y el diseño completo antes de implementar.
- **Prompts clave:**
  - Pregunta sobre qué sería lo más limpio según Clean Architecture y Clean Code en TypeScript.
  - Propuesta de usar tablas de catálogo en vez de enums, con una tabla `Banco` relacionada por llave foránea desde el desembolso.
  - Pedido de un manejo de errores unificado, en inglés y en español.
  - Un prompt estructurado propio que fija las decisiones cerradas y exige cerrar el diseño sección por sección, con aprobación explícita en cada una:

    ```text
    Vamos a cerrar el diseño sección por sección: API y contratos, máquina de
    estados, motor financiero, autenticación, frontend, infraestructura, pruebas
    y entregables. Presenta una sola sección y espera "aprobado". Da tu
    recomendación con su justificación, no un menú de opciones. Al final
    escribe la spec, revísala contra placeholders, contradicciones,
    ambigüedades y reglas del enunciado no reflejadas, y pídeme que la revise.
    No escribas código hasta que apruebe la spec.
    ```

- **Qué produjo la IA:**
  - Propuesta de tres enfoques. Se eligió un monorepo con paquete de dominio compartido y Prisma.
  - Arquitectura hexagonal con regla de dependencia verificada por lint.
  - Ocho secciones de diseño: API, máquina de estados, motor financiero, autenticación, frontend, infraestructura, pruebas y entregables.
  - Casos de prueba financieros con números exactos, calculados con un script en vez de a mano.
  - La spec consolidada en [superpowers/specs/2026-09-24-solicitud-credito-design.md](superpowers/specs/2026-09-24-solicitud-credito-design.md).
- **Qué decidí yo y por qué:**
  - Stack NestJS + React, para compartir la fórmula de la cuota entre API y frontend en TypeScript.
  - Plan de amortización completo, con capital, interés y saldo por cuota.
  - Usuarios sembrados **con roles**. La IA recomendaba un solo rol. Elegí roles porque reflejan la separación real entre oficial, analista y cajero.
  - Incluir los dos extras en el diseño desde el inicio.
  - Tablas de catálogo para bancos y tipos de empleo. La IA proponía enums para todo. Acordamos un criterio: catálogos para datos, enums para valores que llevan lógica, como periodicidad, estado y rol.
  - Manejo de errores unificado y bilingüe, con códigos estables y mensajes traducidos.
  - Swagger, CI con smoke test de Docker, córdobas como moneda, y los siete campos exactos del enunciado en la pantalla del comité.
- **Qué corregí o rechacé:**
  - La recomendación inicial de un solo rol.
  - Los enums para bancos y tipos de empleo.
  - El formato de error original, solo en español, que reemplacé por el catálogo bilingüe.
- **Commits:** commit de documentación de diseño.
