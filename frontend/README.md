# KMS Frontend — Sistema de Gestión Inteligente del Conocimiento

Plataforma Web interactiva para la organización, clasificación temática y exploración de contenido técnico utilizando técnicas de Inteligencia Artificial y Machine Learning. Desarrollada para el **Hackathon ONE G9 — Alura & Oracle LATAM**.

---

## Descripción del Proyecto

El sistema permite a profesionales y estudiantes de tecnología transformar grandes volúmenes de documentación desestructurada en una base de conocimiento organizada automáticamente.

### Características Principales:
- **Clasificación Automática**: Inferencia temática de textos en 5 categorías principales (*Backend*, *Frontend*, *DevOps*, *Data Science*, *Mobile*).
- **Extracción de Palabras Clave**: Algoritmo TF-IDF para identificar etiquetas clave de cada documento.
- **Analítica en Tiempo Real**: Métricas de precisión, volumen indexado y latencia de inferencia.
- **Tendencias y Clustering**: Agrupamiento no supervisado mediante el algoritmo K-Means.
- **Procesamiento por Lotes**: Carga masiva de archivos `.csv` para clasificación asíncrona.
- **Búsqueda e Historial**: Tabla responsiva con filtro semántico y paginación.

---

## Stack Tecnológico

| Capa | Tecnología | Descripción |
|------|-----------|-------------|
| **Framework Web** | React (Vite) | SPA ligera, rápida y moderna |
| **Estilos & UI** | Vanilla CSS (Tokens) | Sistema de diseño SaaS Enterprise Light basado en `mockup_single_page.html` |
| **Backend Orquestador** | Java (Spring Boot) | API REST pública y persistencia en PostgreSQL (Integración) |
| **Inferencia IA** | Python (FastAPI) | Microservicio de inferencia con modelos Scikit-Learn / TF-IDF / K-Means |

---

## Estructura del Repositorio

```text
Front Hackathon/
├── public/
├── sandbox/
│   ├── hack.txt                # Requerimientos oficiales del Hackathon
│   ├── planning.md             # Plan general de arquitectura e hitos
│   ├── mockup_single_page.html # Prototipo interactivo de referencia UI/UX
│   └── estado_implementacion.md # Seguimiento de avance por fases
├── src/
│   ├── assets/
│   ├── components/             # Componentes modales y del dashboard
│   ├── services/               # Cliente API de inferencia
│   ├── styles/                 # Tokens CSS de diseño visual
│   ├── App.jsx
│   └── main.jsx
├── .gitignore
├── package.json
└── README.md
```

---

## Roadmap de Estado del Sistema (Integración Real vs Componentes Demo)

- [x] **Integración HTTP en Vivo (Spring Boot)**: Módulo de Clasificación (`POST /api/contenido`) con validación de contrato DTO (`titulo`, `descripcion`), sanitización y manejo transparente de errores HTTP.
- [x] **Fases 1 a 2 UI**: Layout Shell, Tokens CSS de diseño visual, Módulo de Ingreso de Datos e Inferencia.
- [x] **Fases 3 a 5 UI (Modo Demo / Próximamente)**: Componentes visuales preparados para futuros desarrollos del backend:
  - Búsqueda y Analítica *(Filtro textual local / Métricas Demo)*
  - Historial y Paginación *(Visualización de registros locales)*
  - Clusters K-Means y Carga Masiva CSV *(Simulación demostrativa)*
