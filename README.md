# TechMind

Organización inteligente de conocimiento técnico para la Hackathon ONE G9
(Alura + Oracle), desarrollada por el equipo G9-LATAM-Team-61.

> Estado: baseline integrada del MVP disponible para ejecución local.

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

## Ejecución local integrada

Requisitos: Git, Docker Desktop y Docker Compose.

```bash
git clone https://github.com/No-Country-simulation/G9-LATAM-Team-61.git
cd G9-LATAM-Team-61
cp .env.example .env
```

Antes de iniciar, define una contraseña no vacía en `POSTGRES_PASSWORD` dentro
de `.env`. Luego construye y levanta los cuatro servicios:

```bash
docker compose up --build -d
docker compose ps
```

Cuando todos los servicios estén `healthy`, abre
[http://127.0.0.1:8080](http://127.0.0.1:8080).

Para detener la baseline conservando PostgreSQL:

```bash
docker compose down
```

> `docker compose down -v` elimina el volumen PostgreSQL y todos sus datos.

## Desarrollo

Cada componente conserva sus propias instrucciones de instalación, ejecución y
pruebas.

Los cambios se realizan mediante ramas cortas y pull requests revisados. Consulta
[`CONTRIBUTING.md`](CONTRIBUTING.md) antes de contribuir.
