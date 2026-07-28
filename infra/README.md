# Infraestructura

Esta carpeta albergará la infraestructura y la automatización de despliegue de
TechMind.

OCI es el proveedor objetivo del proyecto. La topología, región, servicios y
recursos que se utilizarán todavía no están definidos.

Terraform es una opción prevista para gestionar infraestructura como código,
pero aún no constituye una decisión aprobada. Por ese motivo,
`infra/terraform/` permanecerá pendiente hasta que exista una definición
validable.

No deben versionarse en esta carpeta:

- credenciales o secretos;
- claves privadas o archivos de configuración de OCI;
- archivos de estado de Terraform;
- variables sensibles;
- artefactos generados que permitan acceder a recursos reales.
