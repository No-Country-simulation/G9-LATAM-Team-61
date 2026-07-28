# KMS Frontend — Sistema de Gestión Inteligente del Conocimiento

Plataforma Web interactiva para la organización, clasificación temática y exploración de contenido técnico utilizando técnicas de Inteligencia Artificial y Machine Learning. Desarrollada para el **Hackathon ONE G9 — Alura & Oracle LATAM**.

---

## Descripción del Proyecto

El sistema permite a profesionales y estudiantes de tecnología transformar grandes volúmenes de documentación desestructurada en una base de conocimiento organizada automáticamente.

### Características Principales (Objetivo MVP y Post-MVP):
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
| **Iconografía** | Lucide React | Iconos vectoriales SaaS accesibles |
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

## Roadmap de Implementación Aditiva (6 Fases)

- [x] **Fase 1**: Setup Base, Tokens CSS y Contenedor Layout Shell.
- [x] **Fase 2**: Módulo de Ingreso de Datos y Modal de Inferencia MVP (`POST /api/contenido`).
- [x] **Fase 3**: Módulo de Analítica y Búsqueda Semántica.
- [x] **Fase 4**: Tabla de Últimos Procesados e Historial Paginado.
- [ ] **Fase 5**: Explorador de Clusters K-Means (`POST /agrupar`), Carga Masiva CSV (`POST /lote`), Configuración y API Docs.
- [ ] **Fase 6**: Conexión REST HTTP en Vivo con Backend Spring Boot / FastAPI y QA final.

