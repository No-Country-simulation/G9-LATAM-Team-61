# Despliegue manual del MVP en OCI

> Estado al 25 de agosto de 2026. Esta guía documenta el despliegue manual
> actualmente utilizado. El repositorio dispone de CI, pero no de CD automático
> hacia OCI ni de Terraform aplicado.

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
| Dominio | `techmind-kms.duckdns.org` |
| URL principal con overlay HTTPS | `https://techmind-kms.duckdns.org` |
| Certificados | Let's Encrypt administrado por Certbot en el host |

El frontend/Nginx es el único entrypoint web. Backend, inference y PostgreSQL
permanecen en redes internas de Docker.

La documentación de inference se publica exclusivamente a través del Nginx
HTTPS, sin exponer el puerto 8000:

- `https://techmind-kms.duckdns.org/inference/docs`
- `https://techmind-kms.duckdns.org/inference/redoc`
- `https://techmind-kms.duckdns.org/inference/openapi.json`

El overlay configura `ROOT_PATH=/inference` para que Swagger solicite el
OpenAPI JSON mediante el prefijo público. Nginx retira ese prefijo únicamente
para las tres rutas documentales; los endpoints de inferencia continúan
accesibles solo dentro de la red Docker.

## Prerrequisitos

- acceso SSH mediante clave como usuario administrativo autorizado;
- Git;
- Docker Engine;
- Docker Compose v2;
- Buildx y soporte ARM64;
- acceso de salida para obtener el repositorio, dependencias e imágenes;
- TCP 22, 80 y 443 permitidos conforme a las reglas de OCI y UFW;
- Certbot instalado en el host y certificado válido para el dominio;
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
FRONTEND_HTTPS_PORT=443
LETSENCRYPT_PATH=/etc/letsencrypt
ACME_WEBROOT_PATH=/var/lib/techmind/acme

POSTGRES_DB=techmind
POSTGRES_USER=techmind_app
POSTGRES_PASSWORD=<CONTRASENA_FUERTE_NO_VERSIONADA>

CORS_ALLOWED_ORIGINS=http://techmind-kms.duckdns.org,https://techmind-kms.duckdns.org
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

Después del smoke HTTPS, el valor final de CORS debe reducirse a:

```dotenv
CORS_ALLOWED_ORIGINS=https://techmind-kms.duckdns.org
```

No incluyas en Git el `.env`, contraseñas, claves SSH, tokens, certificados ni
claves privadas.

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
docker compose -f compose.yaml -f compose.https.yaml up -d postgres
docker compose -f compose.yaml -f compose.https.yaml up -d inference
docker compose -f compose.yaml -f compose.https.yaml up -d backend
docker compose -f compose.yaml -f compose.https.yaml up -d frontend
docker compose -f compose.yaml -f compose.https.yaml ps
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

Con el overlay desplegado, abre
[https://techmind-kms.duckdns.org](https://techmind-kms.duckdns.org) y ejecuta
un smoke test de:

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
5. recrear los servicios necesarios sin eliminar volúmenes; en el despliegue
   HTTPS se utilizan juntos `compose.yaml` y `compose.https.yaml`, también para
   inference porque el overlay define su `ROOT_PATH`;
6. esperar todos los healthchecks;
7. ejecutar el smoke test público y validar persistencia.

No existe actualmente un pipeline CD que realice estos pasos.

Los workflows de CI sí validan por separado Backend, Frontend e inference antes
de integrar cambios. Esos checks no sustituyen el procedimiento manual de
actualización y smoke test de la VM.

## Rollback simple

1. Omitir `compose.https.yaml` y recrear exclusivamente Frontend con
   `docker compose up -d frontend`.
2. Confirmar nuevamente HTTP en el puerto 80.
3. Si además se requiere volver de versión, usar el commit previamente
   registrado y reconstruir únicamente las imágenes afectadas.
4. Confirmar healthchecks y smoke test.
5. Conservar `postgres_data`; para cambios de esquema futuros debe existir un
   respaldo verificable antes de migrar.

Los errores de Flyway o Hibernate deben investigarse conservando el volumen y
los logs, no recreando la base de manera destructiva.

## Red y seguridad

| Puerto | Uso actual | Exposición |
|---|---|---|
| 22/tcp | SSH por clave | Público |
| 80/tcp | Health, ACME y redirección HTTPS | Público |
| 443/tcp | Nginx/React y proxy `/api` con overlay | Público |
| 8080/tcp | Spring Boot | Solo Docker |
| 8000/tcp | FastAPI | Solo Docker |
| 5432/tcp | PostgreSQL | Solo Docker |

## HTTPS y renovación de certificados

El certificado de `techmind-kms.duckdns.org` fue emitido inicialmente con
Certbot `standalone`. Para que las renovaciones no detengan Frontend, la
autenticación debe cambiarse a `webroot` usando:

```text
/var/lib/techmind/acme
```

El overlay monta ese directorio en `/var/www/certbot`, donde Nginx sirve
`/.well-known/acme-challenge/` por HTTP sin redirigirlo.

Con la versión instalada de Certbot, revisa primero las opciones disponibles:

```bash
sudo certbot help reconfigure
```

La reconfiguración esperada es:

```bash
sudo certbot reconfigure \
  --cert-name techmind-kms.duckdns.org \
  --webroot \
  --webroot-path /var/lib/techmind/acme \
  --deploy-hook /usr/local/sbin/techmind-reload-nginx \
  --run-deploy-hooks
```

El deploy hook debe ser propiedad de `root`, no contener secretos y ejecutar
con rutas absolutas:

```bash
docker compose -f compose.yaml -f compose.https.yaml exec -T frontend nginx -t
docker compose -f compose.yaml -f compose.https.yaml exec -T frontend nginx -s reload
```

El hook debe cambiar antes al directorio real del checkout. La recarga solo se
ejecuta después de validar correctamente la configuración de Nginx.

Comprueba la renovación y el timer instalado:

```bash
sudo certbot renew --dry-run --run-deploy-hooks
systemctl list-timers | grep certbot
```

Los certificados permanecen en `/etc/letsencrypt` y se montan en Frontend como
solo lectura. Nunca se copian al repositorio. El puerto 80 debe permanecer
accesible para los desafíos HTTP-01.

No se habilita HSTS en esta fase, para conservar un rollback sencillo a HTTP.
