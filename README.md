# TechMind

Organización inteligente de conocimiento técnico para la Hackathon ONE G9
(Alura + Oracle), desarrollada por el equipo G9-LATAM-Team-61.

> Estado: MVP integrado, desplegado y validado en OCI.

## ¿Qué hace TechMind?

TechMind recibe contenido técnico, lo clasifica mediante un modelo de machine
learning y permite organizarlo, consultarlo y analizarlo posteriormente. El MVP
incluye clasificación individual, historial, procesamiento por lote, feedback,
búsqueda, recomendaciones, estadísticas y clustering.

## Demo actual

La demostración pública temporal está disponible por HTTP en:

**[http://146.181.43.81](http://146.181.43.81)**

La IP es reservada. Todavía no se han configurado dominio ni HTTPS/TLS, por lo
que no debe utilizarse esta instancia para enviar información sensible.

## Arquitectura resumida

```text
Internet
  → Frontend React servido por Nginx :80 (único entrypoint web)
      → Spring Boot :8080 (interno)
          → FastAPI/modelo :8000 (interno)
          → PostgreSQL 16 :5432 (interno y persistente)
```

Los cuatro servicios se ejecutan con Docker Compose en una instancia OCI
ARM64/Ampere. Backend, inference y PostgreSQL no publican puertos al host.

Consulta la [arquitectura vigente](docs/architecture.md) y la
[guía del despliegue OCI](docs/deployment-oci.md) para más detalle.

## Estructura del monorepo

```text
.
├── backend/             # API, orquestación y persistencia
├── frontend/            # Interfaz React y Nginx
├── inference-service/   # FastAPI, pipeline y modelo
├── data-science/        # Datos, notebooks y entrenamiento
├── infra/               # Infraestructura versionable
├── contracts/           # Contratos entre componentes
└── docs/                # Arquitectura, ADR y operación
```

Las responsabilidades y reglas completas se encuentran en
[`docs/repository-structure.md`](docs/repository-structure.md).

## Ejecución local integrada

Requisitos:

- Git;
- Docker Engine o Docker Desktop;
- Docker Compose v2.

```bash
git clone https://github.com/No-Country-simulation/G9-LATAM-Team-61.git
cd G9-LATAM-Team-61
cp .env.example .env
```

Define una contraseña no vacía en `POSTGRES_PASSWORD`. Para ejecución local se
mantienen estos valores:

```dotenv
FRONTEND_BIND_ADDRESS=127.0.0.1
FRONTEND_HTTP_PORT=8080
```

Construye e inicia la baseline:

```bash
docker compose up --build -d
docker compose ps
```

Cuando todos los servicios estén `healthy`, abre
[http://127.0.0.1:8080](http://127.0.0.1:8080).

Para detener los contenedores conservando PostgreSQL:

```bash
docker compose down
```

> **Advertencia:** `docker compose down -v` elimina `postgres_data` y los datos
> persistidos. No debe utilizarse durante una actualización normal.

## Despliegue actual

El MVP se ejecuta en una única VM OCI `VM.Standard.A1.Flex`, con Ubuntu 24.04,
1 OCPU y 6 GB de RAM, en `sa-santiago-1`.

El despliegue es **manual**. OCI no monitoriza GitHub ni actualiza la aplicación
automáticamente. Cuando `main` cambia se realiza una actualización controlada,
se reconstruyen o recrean únicamente los servicios afectados y se ejecuta un
smoke test. CI/CD automático queda fuera del MVP desplegado actualmente.

## Desarrollo

Cada componente conserva sus instrucciones específicas de instalación,
ejecución y pruebas. Los cambios se realizan mediante ramas cortas y pull
requests revisados. Consulta [`CONTRIBUTING.md`](CONTRIBUTING.md) antes de
contribuir.
