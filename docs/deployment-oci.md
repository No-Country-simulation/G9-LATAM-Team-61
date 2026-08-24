# Despliegue manual del MVP en OCI

> Estado al 23 de agosto de 2026. Esta guía documenta el despliegue manual
> actualmente utilizado. No describe CI/CD automático ni Terraform aplicado.

## Entorno desplegado

| Elemento | Valor actual |
|---|---|
| Región | Chile Central (Santiago), `sa-santiago-1` |
| Compartment | `techmind` |
| Instancia | `instance-20260822-1253` |
| Shape | `VM.Standard.A1.Flex`, ARM64/Ampere |
| Capacidad | 1 OCPU, 6 GB RAM |
| Sistema operativo | Ubuntu 24.04 |
| IP pública | Reservada, `146.181.43.81` |
| URL de demo | `http://146.181.43.81` |

El frontend/Nginx es el único entrypoint web. Backend, inference y PostgreSQL
permanecen en redes internas de Docker.

## Prerrequisitos

- acceso SSH mediante clave como usuario administrativo autorizado;
- Git;
- Docker Engine;
- Docker Compose v2;
- Buildx y soporte ARM64;
- acceso de salida para obtener el repositorio, dependencias e imágenes;
- TCP 22 y 80 permitidos conforme a las reglas de OCI y UFW;
- espacio disponible suficiente para código, capas Docker y volumen de datos.

La VM utiliza UFW, Fail2ban, `FORWARD DROP`, controles en `DOCKER-USER` e
IMDSv2. Esos controles deben conservarse durante las actualizaciones.

## Obtener y verificar el código

El despliegue utiliza una copia de este repositorio y la rama `main`. Antes de
construir debe verificarse el commit autorizado y que no existan cambios locales
inesperados.

Para una instalación inicial:

```bash
git clone https://github.com/No-Country-simulation/G9-LATAM-Team-61.git
cd G9-LATAM-Team-61
git switch main
```

Las actualizaciones posteriores se realizan mediante un `pull` controlado y
fast-forward, después de revisar el estado local.

## Configuración privada

Crea `.env` a partir de `.env.example`. El archivo real permanece en la VM y no
se versiona.

Valores relevantes para OCI:

```dotenv
FRONTEND_BIND_ADDRESS=0.0.0.0
FRONTEND_HTTP_PORT=80

POSTGRES_DB=techmind
POSTGRES_USER=techmind_app
POSTGRES_PASSWORD=<CONTRASENA_FUERTE_NO_VERSIONADA>

CORS_ALLOWED_ORIGINS=http://146.181.43.81
VITE_API_BASE_URL=/api
VITE_ENABLE_DEMO=false
```

Compose configura internamente:

```text
SPRING_PROFILES_ACTIVE=prod
FASTAPI_URL=http://inference:8000
DB_URL=jdbc:postgresql://postgres:5432/<POSTGRES_DB>
TRANSLATOR_BACKEND=none
```

No incluyas en Git el `.env`, contraseñas, claves SSH, tokens ni otros secretos.

## Build en ARM64

Las imágenes del proyecto y sus dependencias fueron validadas para ARM64. Como
la VM dispone de 1 OCPU y 6 GB de RAM, se recomiendan builds secuenciales:

```bash
docker compose build frontend
docker compose build backend
docker compose build inference
```

Evita construir todos los servicios simultáneamente. Ante presión de recursos,
detén la operación y revisa memoria y disco antes de reintentar.

## Inicio controlado

Inicia los servicios respetando sus dependencias:

```bash
docker compose up -d postgres
docker compose up -d inference
docker compose up -d backend
docker compose up -d frontend
docker compose ps
```

El estado esperado es `healthy` para los cuatro servicios. Compose conserva el
siguiente orden lógico:

```text
postgres ─┐
          ├─→ backend ─→ frontend
inference ┘
```

## Flyway y PostgreSQL

Al iniciar Backend, Flyway ejecuta las migraciones V1 y V2 antes de que
Hibernate valide el esquema. La configuración productiva mantiene
`ddl-auto=validate`.

No se crean tablas manualmente y no debe cambiarse Hibernate a `update`,
`create` o `create-drop` para ocultar errores de migración.

PostgreSQL persiste sus datos en el volumen Docker `postgres_data`.

## Validación

### Estado de contenedores

```bash
docker compose ps
```

Los healthchecks verifican:

- PostgreSQL mediante `pg_isready`;
- inference mediante `/health`, estado `ok` y modelo cargado;
- Backend mediante `/api/health`, estado global `UP`;
- Frontend mediante `/health` de Nginx.

### Validación pública

Abre [http://146.181.43.81](http://146.181.43.81) y ejecuta un smoke test de:

- health;
- clasificación;
- historial;
- batch JSON;
- feedback;
- búsqueda y recomendaciones;
- estadísticas;
- clustering.

Backend `8080`, inference `8000` y PostgreSQL `5432` no deben responder desde
Internet.

## Persistencia y reinicio

La persistencia fue validada después de:

```bash
docker compose restart
```

Después de un reinicio deben volver a comprobarse los healthchecks y consultarse
los datos previamente persistidos.

Para detener los contenedores conservando la base:

```bash
docker compose down
```

> **No ejecutar `docker compose down -v` durante una operación normal.** La
> opción `-v` elimina `postgres_data`.

## Actualización manual desde `main`

OCI no monitoriza GitHub automáticamente. Una actualización controlada sigue
este flujo:

1. comprobar el estado del checkout y registrar el commit desplegado;
2. incorporar `origin/main` mediante fast-forward;
3. revisar el delta;
4. reconstruir únicamente las imágenes afectadas;
5. recrear los servicios necesarios sin eliminar volúmenes;
6. esperar todos los healthchecks;
7. ejecutar el smoke test público y validar persistencia.

No existe actualmente un pipeline CD que realice estos pasos.

## Rollback simple

1. Retirar temporalmente la exposición deteniendo Frontend si existe un riesgo
   público.
2. Volver al commit previamente registrado y reconstruir las imágenes afectadas.
3. Levantar los servicios sin la opción `-v`.
4. Confirmar healthchecks y smoke test.
5. Conservar `postgres_data`; para cambios de esquema futuros debe existir un
   respaldo verificable antes de migrar.

Los errores de Flyway o Hibernate deben investigarse conservando el volumen y
los logs, no recreando la base de manera destructiva.

## Red y seguridad

| Puerto | Uso actual | Exposición |
|---|---|---|
| 22/tcp | SSH por clave | Público |
| 80/tcp | Nginx/React y proxy `/api` | Público |
| 443/tcp | Preparado en OCI | Sin servicio HTTPS todavía |
| 8080/tcp | Spring Boot | Solo Docker |
| 8000/tcp | FastAPI | Solo Docker |
| 5432/tcp | PostgreSQL | Solo Docker |

La futura fase de dominio y TLS deberá publicar HTTPS, redirigir HTTP y
actualizar `CORS_ALLOWED_ORIGINS`. Hasta entonces la URL oficial temporal sigue
siendo HTTP.
