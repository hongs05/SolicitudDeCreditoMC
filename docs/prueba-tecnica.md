# Prueba Técnica: Simulación del ciclo de vida de una solicitud de crédito

## Descripción General

El objetivo de esta prueba es evaluar tus habilidades en el desarrollo de aplicaciones web de extremo a extremo (Full Stack), diseño de arquitectura, manejo de reglas de negocio, persistencia de datos y contenedorización.

Simular el ciclo de vida de una solicitud de crédito dentro de una entidad bancaria/fintech, desde su captura inicial hasta la evaluación en comité y el posterior desembolso con generación de plan de pagos.

Se permite y evalúa positivamente el uso eficiente de herramientas de Inteligencia Artificial (GitHub Copilot, ChatGPT, Claude, etc.), pero se esperará que comprendas, justifiques y mantengas la calidad arquitectónica en cada modificación realizada.

## Stack Tecnológico Esperado

- **Base de Datos:** SQLite (archivo local mapeado mediante volumen).
- **Backend:** NestJS (TypeScript) o ASP.NET Core (.NET 8+).
- **Frontend:** React (Vite / Next.js), Angular (v16+) o Windows Form.
- **Infraestructura:** Proyectos contenedorizados usando Dockerfile y un archivo docker-compose.yml en la raíz que permita levantar la solución completa con un solo comando.

## Flujo del Negocio y Funcionalidades

El sistema administra el crédito a través de 3 etapas principales:

```
[1. Login]───>[ 1. Solicitud ] ───> [ 2. Comité de Riesgo ] ───> [ 3. Desembolso ]
                 (Pendiente)          (Aprobada / Rechazada)        (Desembolsada)
```

### 1. Captura de la Solicitud

Implementar una interfaz de inicio de sesión (Login) que solicite credenciales de usuario y contraseña para autenticar la identidad del usuario y emitir un Token de Autenticación firmado (JWT).

### 2. Captura de la Solicitud

Formulario dedicado a recopilar toda la información requerida para iniciar el expediente del cliente:

- **Información Personal:** Nombre Completo, Cédula / Identificación, Correo Electrónico, Teléfono, Fecha de nacimiento.
- **Información Laboral:** Tipo de Empleo (Asalariado o Independiente), Empresa/Lugar de Trabajo, Antigüedad Laboral (años), e Ingreso Mensual.
- **Condiciones del Crédito:** Monto Solicitado, Cantidad de cuotas, Tasa de Interés Anual (%), y Periodicidad de Pago (Quincenal, Mensual y Anual).
- **Cálculo de la Cuota Nivelada:** El cálculo debe mostrarse a nivel de frontend en la solicitud.

Formulas:

1. Periodicidad (n):

   ```
   n = 1 (Anual), 12 (Mensual), 24 (Quincenal)
   ```

2. Tasa Periódica (i):

   ```
   i = (Tasa Anual / 100) / n
   ```

3. Cuota Nivelada:

   ```
   Cuota Nivelada = Monto Solicitado * [ i * (1 + i)^Cuotas ] / [ ((1 + i)^Cuotas) - 1 ]
   ```

- **Nota:** El sistema no debe permitir ingresar solicitudes de créditos a clientes mayores de 80 años.

### 3. Evaluación en Comité de Riesgo

Pantalla de lectura dedicada al analista o comité. No debe permitir edición de datos del crédito, únicamente la visualización organizada de la información personal, laboral y financiera para tomar el dictamen:

- Solo debe mostrar la Cédula / Identificación, Nombre Completo, Edad, Cantidad de cuotas, Periodicidad de Pago, Plazo y Monto solicitado.
- Agregar obligatoriamente un campo de texto llamado **Observaciones** al momento de aprobar la solicitud de crédito.
- Permitir ejecutar la acción mediante dos botones: **Aprobar Crédito** o **Rechazar Crédito**.
- Al aprobar la solicitud de crédito debe crear el crédito con su respectivo número de crédito de forma aleatoria o incremental y relacionar el crédito con la solicitud.
- Al crear el crédito, el sistema generará el plan de pagos relacionado con el crédito. Para ello, calculará el valor de la cuota nivelada e insertará tantas cuotas individuales como indique el plazo del crédito.

### 4. Desembolso y Plan de Pagos

Pantalla limpia enfocado en la transacción final del crédito (disponible únicamente para solicitudes en estado **APROBADA**):

- Muestra únicamente la información personal básica: Cédula, Nombre Completo, Monto, Tasa, Periodicidad y Plazo.
- **Transferencia:** Requiere la selección del Banco Destino (LAFISE, FICOHSA, BAC Credomatic o Banpro) y el Número de Cuenta Bancaria.
- **Ejecución del Desembolso:** Al procesar la transacción, se actualiza el estado a **DESEMBOLSADA**.

## 4. Extra / Plus (Puntos Adicionales)

- Refresh Token
- Pantalla con campo de búsqueda por Cédula / Identificación y carga el plan de pagos del crédito.

## Puntos Clave de Evaluación (Lo que evaluaremos)

- **Integridad del Negocio y Reglas de Estado:** Validar que no se puedan desembolsar créditos no aprobados.
- **Transaccionalidad en Base de Datos (ACID):** Garantizar que el cambio de estado del crédito y la creación de las cuotas de amortización se ejecuten de forma automática.
- **Calidad y Limpieza del Código:** Uso adecuado de abstracciones, patrones de diseño y modularidad (evitando código duplicado).
- **Dockerización:** Un archivo docker-compose.yml funcional que levante backend, frontend y base de datos local sin fallos.

## Entregables

- Enlace al repositorio de código GitHub.
- Instrucciones claras en el README.md para ejecutar el entorno localmente.
- Breve resumen en la entrega/Pull Request sobre las decisiones de arquitectura tomadas y la bitácora de uso de IA (prompts/herramientas utilizadas).
