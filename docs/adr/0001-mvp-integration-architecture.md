# ADR-0001: Arquitectura de integración del MVP

- Estado: Propuesta
- Fecha: 2026-07-22
- Responsables de decisión: Tech Lead, Backend, Data Science y DevOps

## Contexto

El equipo distribuyó el trabajo entre React, Spring Boot, FastAPI, Ciencia de Datos y OCI. Sin un contrato versionado, cada componente puede evolucionar hacia solicitudes, respuestas y errores incompatibles. Además, la planificación mezcla capacidades obligatorias con funciones opcionales como lotes, búsqueda, recomendaciones y clustering.

## Decisión propuesta

Adoptar una arquitectura de servicios separados dentro de un monorepo:

- React consume únicamente la API pública de Spring Boot.
- Spring Boot valida, orquesta y persiste.
- FastAPI encapsula exclusivamente el pipeline de inferencia.
- PostgreSQL solo es accedido por Spring Boot.
- Docker Compose define el entorno integrado local y de demostración.
- OCI Compute aloja la primera vertical desplegada.
- OpenAPI versiona el contrato Spring Boot–FastAPI.

La primera vertical debe limitarse a clasificación individual y palabras clave. Las demás capacidades no se incorporan hasta que esa vertical tenga pruebas y despliegue funcional.

## Consecuencias positivas

- Mantiene la distribución tecnológica ya asumida por el equipo.
- Aísla el ciclo de vida del modelo del backend de negocio.
- Permite pruebas de contrato y despliegues reproducibles.
- Reduce cambios coordinados mediante una API interna versionada.
- Hace visibles propiedad, salud y fallos de cada componente.

## Costos y riesgos

- Aumenta el número de servicios, contenedores y puntos de fallo.
- Requiere timeouts, healthchecks y traducción de errores.
- Obliga a coordinar cambios incompatibles del contrato.
- Puede superar la capacidad del equipo si se añaden funciones antes de integrar la ruta crítica.

## Alternativas consideradas

### FastAPI como único backend

Reduce componentes y costo operativo, pero reemplaza el trabajo planificado en Spring Boot y altera la asignación actual del equipo.

### Modelo embebido en Spring Boot

Simplifica el despliegue, pero complica el uso directo del pipeline Python y acopla la aplicación a la serialización del modelo.

### Ramas permanentes por rol

Se rechaza. Aumentan divergencia y conflictos, y convierten a DevOps en una cola manual de integración. Se usarán ramas cortas por tarea y pull requests pequeños.

## Criterio para aceptar esta ADR

- Tech Lead aprueba el límite de la primera vertical.
- Backend y Data Science validan el contrato OpenAPI.
- DevOps valida que la topología pueda ejecutarse en Compose y OCI.
- Las discrepancias se resuelven antes de crear los esqueletos definitivos.
