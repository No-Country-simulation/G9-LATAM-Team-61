# ADR-0001: Arquitectura de integración y estado de los contratos

- Estado: Aceptada parcialmente
- Fecha inicial: 2026-07-22
- Última actualización: 2026-07-23
- Responsables de decisión: Tech Lead y áreas involucradas en cada contrato

## Contexto

TechMind distribuye el trabajo entre React, Spring Boot, FastAPI, Data,
PostgreSQL y OCI. El equipo necesita documentar esa integración sin presentar
como definitivas las decisiones que Data, Backend o DevOps aún deben validar.

La planificación por sprints definida por el Tech Lead continúa vigente. Esta
ADR no sustituye esa planificación ni cambia el alcance asignado a cada área.

## Decisiones confirmadas

- La arquitectura general mantiene el flujo React → Spring Boot →
  FastAPI/modelo, PostgreSQL para persistencia y despliegue en OCI.
- Frontend consume únicamente la API pública de Spring Boot.
- El contrato confirmado Frontend → Spring Boot es `POST /api/contenido`, con
  `titulo` y `descripcion`.
- Spring Boot concentra la API pública, la orquestación y la persistencia.
- FastAPI concentra la inferencia del modelo una vez que su contrato real sea
  validado.
- PostgreSQL es gestionado por Backend y no es consumido directamente por
  Frontend.
- El trabajo se integra mediante ramas cortas y pull requests revisados.

## Estado temporal aceptado

Durante la etapa actual, Spring Boot invoca un mock en `POST /analizar` y envía
`contenido_crudo`. Este mock permite que Backend continúe con los DTOs, la
orquestación y la persistencia antes de disponer del FastAPI real.

El mock:

- no se considera el contrato definitivo de FastAPI;
- debe poder reemplazarse durante la integración real;
- no convierte sus decisiones internas en obligaciones para Data.

## Propuesta pendiente de validación por Data

Como punto de partida para Spring Boot → FastAPI real se propuso:

- `POST /predict`;
- solicitud con `contenido_crudo`;
- respuesta con `categoria`, `probabilidad` y `palabras_clave`.

El archivo `contracts/inference-api.yaml` permanece en estado borrador. Data
definirá idioma y dataset y validará o ajustará esta propuesta antes del meet
del lunes. Backend revisará posteriormente su compatibilidad.

No están aprobados aún:

- la forma definitiva del endpoint o los esquemas;
- la taxonomía y los límites de campos;
- errores, healthcheck y timeouts;
- identificadores de trazabilidad;
- versión del modelo en la respuesta;
- procesamiento por lotes dentro de este contrato.

## Recomendaciones DevOps pendientes

DevOps puede avanzar con preflight, seguridad y opciones de despliegue en OCI,
pero la topología concreta se documentará como una decisión separada. Por ahora
son recomendaciones, no acuerdos:

- Docker Compose para integración local;
- OCI Compute como primera opción de alojamiento;
- red privada para Spring Boot, FastAPI y PostgreSQL;
- punto de entrada único, secretos fuera de Git, healthchecks y rollback;
- Object Storage para artefactos grandes cuando sea necesario.

## Consecuencias

### Positivas

- Conserva la planificación y la distribución tecnológica del equipo.
- Permite continuar Backend con un mock explícitamente temporal.
- Evita implementar un contrato de inferencia que Data todavía no validó.
- Hace visible qué decisiones puede preparar DevOps sin confundirlas con
  acuerdos del equipo.

### Costos y riesgos

- La integración real no puede cerrarse hasta validar el contrato con Data.
- Backend deberá reemplazar el mock y quizá adaptar DTOs.
- Los documentos y ejemplos deben actualizarse cuando cambie una decisión.
- Varios servicios implican más puntos de fallo y operación.

## Alternativas descartadas en esta ADR

No se decide aquí reemplazar Spring Boot por FastAPI, embeber el modelo Python
en Java ni usar ramas permanentes por rol, porque esas alternativas contradicen
la distribución de trabajo vigente.

Tampoco se decide reducir el alcance de los sprints: cualquier ajuste de
prioridad corresponde al Tech Lead y al equipo.

## Criterio para completar esta ADR

La ADR podrá pasar a estado `Aceptada` cuando:

1. Data confirme idioma, dataset y contrato real de FastAPI.
2. Backend valide el contrato resultante.
3. DevOps documente la topología elegida para OCI.
4. El Tech Lead confirme los puntos transversales que hayan cambiado.
