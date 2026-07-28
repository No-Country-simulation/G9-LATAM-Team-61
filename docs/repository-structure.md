# Estructura del monorepo

> Estado: baseline para validación. Su fusión establecerá la estructura vigente.

## Objetivo

Establecer límites claros entre los componentes de TechMind antes de integrar
el primer servicio, sin modificar la planificación por sprints ni convertir
decisiones pendientes de Data o DevOps en acuerdos definitivos.

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
- El futuro Compose de la raíz será la definición para ejecutar la plataforma
  integrada.
- La definición raíz no se añadirá hasta contar con los servicios y Dockerfiles
  necesarios; así se evita publicar una configuración que no pueda validarse.
- Los puertos y credenciales locales deberán configurarse mediante variables,
  no mediante secretos confirmados en Git.

## Infraestructura y despliegue

- `infra/` concentra la infraestructura y la automatización de despliegue.
- OCI es el proveedor objetivo del proyecto.
- La topología, región, servicios y recursos todavía no están definidos.
- Terraform es una opción prevista, pero aún no una decisión aprobada.
- No se versionan credenciales, claves, archivos de estado ni secretos.
- `infra/terraform/` se creará únicamente cuando el equipo apruebe el uso de
  Terraform y exista una configuración que pueda validarse.

## Datos y modelos

- No se versionan datasets completos, datos procesados ni modelos generados.
- Solo podrán incluirse muestras pequeñas, anonimizadas y compatibles con su
  licencia cuando el equipo las apruebe.
- Cada fuente de datos y artefacto deberá documentar procedencia, licencia y
  versión.

## Integración de trabajos existentes

- El proyecto Spring Boot existente se conservará en `backend/`; este baseline
  no crea ni mueve su código.
- Después de fusionar esta estructura, cualquier rama de servicio abierta deberá
  actualizarse desde `main` antes de completar su revisión.
- Los documentos y contratos en revisión se integrarán en `docs/` y
  `contracts/` sin bloquear la creación de las demás carpetas.

## Decisiones que este baseline no toma

- Idioma, dataset o taxonomía del modelo.
- Contrato definitivo Spring Boot–FastAPI.
- Persistencia funcional definitiva.
- Topología final, región o servicios de OCI.
- Adopción definitiva de Terraform.
- Contenido del Compose integrado.
- Herramientas y reglas definitivas de CI/CD.

## Elementos pendientes

- `infra/terraform/`.
- `compose.yaml` en la raíz.
- `.env.example` en la raíz.
- `.github/workflows/`.
- Subdirectorios internos de `data-science/`.
- Reorganización adicional de `contracts/`.

## Criterios para aprobar la estructura

- El Tech Lead confirma los nombres y límites de las carpetas.
- Backend confirma que su proyecto permanecerá en `backend/`.
- Data confirma la separación entre `data-science/` e `inference-service/`.
- DevOps confirma que `infra/` permite preparar OCI, Compose y CI/CD sin
  introducir secretos ni dependencias circulares.
