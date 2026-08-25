# Estructura del monorepo

> Estado vigente al 25 de agosto de 2026: monorepo integrado y desplegado.

## Objetivo

Mantener límites claros entre los componentes integrados de TechMind y ubicar
el código, contratos, documentación e infraestructura reproducible en una única
estructura pública sin mezclar secretos ni documentación privada.

## Estructura

```text
.
├── backend/
├── frontend/
├── inference-service/
├── data-science/
├── infra/
├── contracts/
├── docs/
├── .github/
├── .gitattributes
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

| Ruta | Propósito | Responsable principal |
|---|---|---|
| `backend/` | Spring Boot: API pública, validación, orquestación y persistencia. | Backend |
| `frontend/` | React: experiencia de usuario y consumo exclusivo de Spring Boot. | Frontend / Full Stack |
| `inference-service/` | FastAPI: carga del pipeline y ejecución de inferencias. | Data / Backend de inferencia |
| `data-science/` | Exploración, preparación, entrenamiento y evaluación reproducible. | Data |
| `infra/` | Infraestructura, automatización de despliegue y preparación de OCI. | DevOps |
| `contracts/` | Contratos y ejemplos de integración versionados. | Áreas consumidoras y proveedoras |
| `docs/` | Arquitectura, ADR y decisiones transversales. | Equipo / Tech Lead |
| `.github/` | Plantillas y automatizaciones comunes del repositorio. | DevOps / Equipo |

## Reglas estructurales

1. Cada servicio debe poder instalarse, probarse y ejecutarse desde su propia
   carpeta.
2. Frontend no consume directamente FastAPI ni PostgreSQL.
3. Backend y FastAPI se integran mediante HTTP y un contrato versionado; no
   comparten código fuente ni importaciones entre carpetas.
4. `data-science/` produce procesos y artefactos reproducibles, pero los
   notebooks no forman parte del runtime de FastAPI.
5. Los contratos transversales viven en `contracts/`, no se duplican dentro de
   cada servicio.
6. La documentación específica permanece junto a su componente; las decisiones
   que afectan a varias áreas viven en `docs/`.
7. Una tarea que toque varios componentes debe explicar explícitamente la
   necesidad de integración en su pull request.

## Configuración y secretos

- Cada componente publica únicamente plantillas como `.env.example`.
- Los archivos `.env`, credenciales, claves OCI y configuraciones locales no se
  versionan.
- Las variables deben conservar el mismo nombre entre la documentación, Compose
  y la aplicación que las consume.
- Entre contenedores se utilizan nombres de servicio; `localhost` se reserva
  para accesos realizados desde la máquina anfitriona.

## Docker Compose

- Un Compose dentro de un componente puede levantar dependencias para su
  desarrollo aislado.
- `compose.yaml` es la baseline integrada de Frontend, Backend, inference y
  PostgreSQL.
- `compose.https.yaml` añade el overlay HTTPS utilizado en OCI sin reemplazar la
  baseline local.
- Los puertos y credenciales se configuran mediante variables; los secretos
  reales permanecen fuera de Git.

## Infraestructura y despliegue

- `infra/` concentra la infraestructura y la automatización de despliegue.
- OCI es el proveedor desplegado del MVP en `sa-santiago-1`.
- La topología vigente utiliza una VM ARM64/Ampere y Docker Compose; está
  detallada en `architecture.md` y `deployment-oci.md`.
- Terraform continúa como opción futura y no está aplicado.
- No se versionan credenciales, claves, archivos de estado ni secretos.
- `infra/terraform/` se creará únicamente cuando el equipo apruebe el uso de
  Terraform y exista una configuración que pueda validarse.

## Datos y modelos

- No se versionan datasets completos ni artefactos generados arbitrarios. El
  modelo canónico aprobado constituye la excepción explícita y vive únicamente
  en `inference-service/model/modelo_hacka.pkl`.
- Solo podrán incluirse muestras pequeñas, anonimizadas y compatibles con su
  licencia cuando el equipo las apruebe.
- Cada fuente de datos y artefacto deberá documentar procedencia, licencia y
  versión.

## Integración y operación actuales

- Frontend consume exclusivamente Spring Boot mediante `/api`.
- Spring Boot usa FastAPI mediante `/predict`, `/predict/lote` y
  `/predict/clustering`, y administra PostgreSQL con Flyway.
- Los workflows existentes proporcionan CI por componente. El despliegue hacia
  OCI continúa siendo manual; no existe CD automático.
- Terraform, autenticación pública y rate limiting permanecen fuera del alcance
  materializado del MVP.
