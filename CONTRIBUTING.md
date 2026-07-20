# Guía de contribución

Este repositorio contiene únicamente los entregables públicos de TechMind. La documentación privada de planificación permanece fuera del repositorio.

## Flujo de trabajo

1. Actualiza `main` antes de comenzar.
2. Crea una rama corta y descriptiva: `feature/...`, `fix/...`, `chore/...` o `docs/...`.
3. Trabaja en cambios pequeños y enfocados. Los experimentos locales deben vivir en `sandbox/`, que Git ignora.
4. Abre el pull request como borrador mientras siga en desarrollo.
5. Marca el pull request como listo únicamente cuando cumpla sus criterios de aceptación y pasen las validaciones aplicables.
6. Solicita al menos una revisión. El autor no debe aprobar ni fusionar su propio cambio.

No se permiten commits directos a `main`. Cada tarea debe tener una persona responsable y un revisor identificados en Trello, GitHub o el pull request.

## Seguridad y privacidad

- Nunca copies al repositorio documentación interna, enlaces privados, credenciales ni datos internos del equipo.
- No confirmes archivos `.env`, claves OCI, certificados, tokens ni secretos. Publica solamente variables de ejemplo sin valores sensibles en `.env.example`.
- Antes de confirmar cambios, revisa `git status` y el diff para evitar archivos accidentales.
- Si un secreto entra en Git, avisa al equipo y revócalo inmediatamente; eliminarlo en un commit posterior no basta.

## Pull requests

Cada pull request debe explicar qué cambia, por qué se necesita, cómo se validó y qué tarea atiende. Incluye capturas cuando haya cambios visuales y documenta cualquier riesgo, migración o configuración requerida.

Usa mensajes de commit breves y orientados a la intención, por ejemplo: `feat: add document classification endpoint` o `fix: reject unsupported file types`.

## Criterio mínimo de finalización

- El cambio cumple los criterios de aceptación acordados.
- Las pruebas, linters y comprobaciones relevantes pasan.
- No se incorporaron secretos ni material privado.
- La documentación afectada está actualizada.
- El pull request recibió la revisión requerida.
