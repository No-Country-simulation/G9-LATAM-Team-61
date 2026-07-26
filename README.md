# TechMind

Organización inteligente de conocimiento técnico para la Hackathon ONE G9
(Alura + Oracle), desarrollada por el equipo G9-LATAM-Team-61.

> Estado: en construcción.

## Objetivo

TechMind recibe contenido técnico y lo procesa para clasificarlo y extraer
información relevante, facilitando su organización y recuperación posterior.

## Arquitectura general

La solución mantiene la separación acordada entre interfaz, backend de negocio,
servicio de inferencia y trabajo de datos:

```text
Frontend React → Backend Spring Boot → FastAPI/modelo
                              └──────→ PostgreSQL
```

## Estructura del monorepo

```text
.
├── backend/             # API pública, orquestación y persistencia
├── frontend/            # Interfaz web React
├── inference-service/   # Servicio FastAPI de inferencia
├── data-science/        # Preparación de datos, notebooks y entrenamiento
├── infra/               # Infraestructura y automatización de despliegue
├── contracts/           # Contratos versionados entre componentes
└── docs/                # Arquitectura, ADR y documentación transversal
```

La definición completa de responsabilidades y reglas vive en
[`docs/repository-structure.md`](docs/repository-structure.md).

## Desarrollo

Cada componente conserva sus propias instrucciones de instalación, ejecución y
pruebas. La ejecución integrada se incorporará en la raíz cuando los servicios
necesarios estén disponibles.

Los cambios se realizan mediante ramas cortas y pull requests revisados. Consulta
[`CONTRIBUTING.md`](CONTRIBUTING.md) antes de contribuir.
