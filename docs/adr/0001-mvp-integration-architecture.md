# ADR-0001: Arquitectura de integración y estado de los contratos

- Estado: Aceptada parcialmente
- Fecha inicial: 2026-07-22
- Última actualización: 2026-07-28
- Responsables de decisión: Tech Lead y áreas involucradas en cada contrato

## Contexto

TechMind distribuye el trabajo entre React, Spring Boot, FastAPI, Data,
PostgreSQL y OCI. El equipo necesita documentar esa integración sin presentar
como definitivas las decisiones operativas que todavía no se han cerrado.

La planificación por sprints definida por el Tech Lead continúa vigente. Esta
ADR no sustituye esa planificación ni cambia el alcance asignado a cada área.

## Decisiones confirmadas

- La arquitectura general mantiene el flujo React → Spring Boot →
  FastAPI/modelo, PostgreSQL para persistencia y despliegue en OCI.
- Frontend consume únicamente la API pública de Spring Boot.
- El contrato confirmado Frontend → Spring Boot es `POST /api/contenido`, con
  `titulo` y `descripcion`.
- Spring Boot concentra la API pública, la orquestación y la persistencia.
- FastAPI concentra la inferencia del modelo mediante el contrato base
  versionado.
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

## Baseline confirmado para FastAPI real

La planificación vigente establece para Spring Boot → FastAPI real:

- `POST /predict`;
- solicitud con `contenido_crudo`;
- respuesta con `categoria`, `probabilidad` y `palabras_clave`.

El archivo `contracts/inference-api.yaml` registra este baseline. Data debe
implementarlo y Backend debe consumirlo. Un cambio incompatible requiere acuerdo
explícito y actualización del contrato.

No están aprobados aún:

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
- Permite que Data y Backend trabajen en paralelo sobre un contrato común.
- Hace visible qué decisiones puede preparar DevOps sin confundirlas con
  acuerdos del equipo.

### Costos y riesgos

- La integración real no puede cerrarse hasta implementar y probar el contrato.
- Backend deberá reemplazar el mock por el servicio real.
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

1. Data defina idioma, dataset y taxonomía.
2. Data y Backend implementen y prueben el contrato base.
3. Data y Backend completen errores, límites, healthcheck y versionado.
4. DevOps documente la topología elegida para OCI.

## Materialización actual del MVP — 2026-08-23

Esta sección registra el resultado posterior sin reescribir las decisiones ni
el estado histórico descritos arriba.

El MVP fue integrado y desplegado con la siguiente materialización:

- una única VM OCI `VM.Standard.A1.Flex`, ARM64/Ampere, con Ubuntu 24.04;
- Docker Compose como orquestador de cuatro servicios;
- Frontend React servido por Nginx como único entrypoint web público;
- Spring Boot, FastAPI y PostgreSQL accesibles únicamente mediante redes Docker
  internas;
- PostgreSQL 16 contenedorizado y persistente mediante `postgres_data`;
- Flyway V1/V2 como administrador del esquema y Hibernate en modo
  `ddl-auto=validate`;
- comunicación Spring Boot → FastAPI mediante los endpoints reales, incluido
  el endpoint canónico `/predict`;
- healthchecks y dependencias de arranque para los cuatro servicios;
- despliegue manual desde `main`, seguido de validaciones funcionales y de
  persistencia.

La aplicación se encuentra temporalmente disponible mediante HTTP sobre la IP
pública reservada `146.181.43.81`. Dominio, HTTPS/TLS y CI/CD automático no
forman parte del estado desplegado actual.

La topología materializada y su operación están documentadas en
[`../architecture.md`](../architecture.md) y
[`../deployment-oci.md`](../deployment-oci.md).
