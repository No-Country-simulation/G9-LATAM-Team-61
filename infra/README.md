# Infraestructura

Esta carpeta queda reservada para infraestructura versionable y automatización
futura de TechMind.

El MVP ya está desplegado manualmente en OCI, región `sa-santiago-1`, sobre una
VM ARM64/Ampere. La topología vigente utiliza Docker Compose, Nginx como único
entrypoint público y redes internas para Spring Boot, FastAPI y PostgreSQL. La
configuración reproducible de los contenedores vive en los Compose de la raíz;
esta carpeta no contiene actualmente infraestructura aplicada.

Terraform es una opción prevista para gestionar infraestructura como código,
pero no se utiliza en el despliegue actual. `infra/terraform/` permanecerá
pendiente hasta que se apruebe una configuración validable y su adopción aporte
valor frente al procedimiento manual existente.

No deben versionarse en esta carpeta:

- credenciales o secretos;
- claves privadas o archivos de configuración de OCI;
- archivos de estado de Terraform;
- variables sensibles;
- artefactos generados que permitan acceder a recursos reales.
