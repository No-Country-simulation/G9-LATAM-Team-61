# StackPulse 778K - Pipeline de Ciencia de Datos (EDA & ML)

**Proyecto:** Oracle ONE - No Country Hackathon[cite: 1]  
**Equipo:** Team 61  
**Sprint:** Sprint 2 

**Autoría y Contribuciones:**
* **Baseline y Fases 1–3 (EDA):** Adolfo Fuentes Hormazábal  
* **Auditoría Técnica y Fase 4 (Arquitectura Productiva y Optimización):** Eduardo Benavides Castillo  

---

## 1. Resumen Ejecutivo
El presente repositorio documenta el desarrollo, auditoría técnica y despliegue productivo del pipeline analítico para **StackPulse 778K**. El proceso integra análisis exploratorio de datos (EDA), ingeniería de características, modelado predictivo mediante Machine Learning (Random Forest) y una arquitectura de persistencia robusta orientada a la optimización de la eficiencia comercial y la toma de decisiones gerenciales[cite: 1].

---

## 2. Auditoría de Integridad y Trazabilidad (Fases 1–3)
Se realizó una rigurosa auditoría técnica sobre el trabajo base para garantizar la solidez y reproducibilidad del flujo de datos[cite: 1]:
* **Consistencia del Pipeline:** Se verificó la linealidad secuencial, asegurando que el conjunto de datos procesado sea la fuente única para el entrenamiento sin saltos arbitrarios[cite: 1].
* **Trazabilidad de Variables:** Estandarización de nomenclaturas y sincronización dinámica de métricas en consola, eliminando por completo valores estáticos (*hardcoded*)[cite: 1].
* **Cumplimiento de Directivas:** Validación del uso de Random Forest para la extracción de importancia de variables basada en la reducción de impureza (Gini)[cite: 1].

---

## 3. Fase 4: Arquitectura Productiva y Optimización
La Fase 4 consolida el modelo hacia un entorno productivo y escalable:
* **Estandarización de Rutas (`BASE_DIR`):** Integración con Google Drive para la gestión segura y persistente de directorios de entrada y salida (`models/`, `output/`).
* **Persistencia de Activos Atómicos:** Exportación del modelo optimizado junto con sus transformadores en artefactos serializados (`.joblib` / `.pkl`), garantizando la reproducibilidad en producción[cite: 1].
* **Calibración de Umbrales:** Ajuste del umbral de decisión para maximizar el rendimiento predictivo y operativo[cite: 1].

---

## 4. Métricas y Rendimiento del Modelo

| Métrica Clave | Valor | Interpretación Ejecutiva |
| :--- | :--- | :--- |
| **AUC** | 0.8214 | Excelente capacidad de discriminación entre perfiles estables y de riesgo[cite: 1]. |
| **Recall** | 67.65% | Alta sensibilidad para la detección efectiva de casos críticos en el pipeline[cite: 1]. |