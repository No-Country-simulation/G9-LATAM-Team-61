# TechMind: Pipeline de Ingesta, EDA, ETL y Clasificación de Consultas TI

> El trabajo experimental se desarrolló inicialmente con el nombre
> **StackPulse**. El artefacto resultante fue integrado posteriormente como el
> modelo de clasificación de TechMind; se conserva este dato únicamente para
> trazabilidad histórica.


## 1. Descripción del Proyecto

El cuaderno documenta el pipeline de datos y modelamiento predictivo utilizado por **TechMind**, orientado a clasificar automáticamente consultas técnicas a gran escala sobre un corpus superior a 770,000 registros. El desarrollo cubre las fases de análisis exploratorio, saneamiento, ingeniería de características y generación del modelo estocástico incremental integrado en `inference-service`.

## 2. Flujo de Trabajo y Fases del Proceso

### Fase 1 y Fase 2: Ingesta y Análisis Exploratorio de Datos (EDA)

* **Carga del Corpus:** Ingesta masiva de registros de texto no estructurado provenientes de plataformas Q&A técnicas.
* **Diagnóstico de Calidad:** Identificación de problemas estructurales críticos: etiquetas atómicas hiperfragmentadas, valores nulos, texto contaminado con código HTML y URLs, y un severo desbalance de clases (predominio masivo de consultas generales frente a verticales especializadas).
* **Baseline Experimental:** Pruebas iniciales con vectorización de vocabulario acumulativo y sin control de desbalance, arrojando resultados limitados (Accuracy: 45.75%, F1 Macro: 37.94%) y alto riesgo de saturación de memoria RAM (OOM).

### Fase 3: Procesamiento ETL y Saneamiento Operacional

* **Mapeo Taxonómico (Token Set Matching):** Algoritmo determinista por teoría de conjuntos para agrupar la multiplicidad de etiquetas en 6 macro-dominios: Data Science, DevOps, Mobile, Frontend, Backend y Otros.
* **Limpieza de Datos:** Eliminación de nulos, deduplicación de instancias y supresión de ruido mediante expresiones regulares (etiquetas HTML, protocolos web).
* **Ventana de Longitud:** Filtrado estricto del contenido de texto al rango de caracteres $[30, 5000]$. Tras el saneamiento, el conjunto de prueba independiente quedó fijado en exactamente 19,268 registros efectivos.

### Fase 4: Modelamiento Avanzado y Producción

* **Vectorización Espacial:** Implementación de `HashingVectorizer` con $2^{18}$ dimensiones y n-gramas $[1,2]$ usando MurmurHash3 para evitar el almacenamiento de un vocabulario físico.
* **Pesaje Dinámico:** Ajuste de pesos por clase con un esquema de raíz cuadrada y un techo de amortiguamiento (Clipping a $4.0\times$) para proteger el aprendizaje de las clases minoritarias.
* **Entrenamiento Out-of-Core:** Uso de `SGDClassifier` con pérdida logarítmica (`log_loss`) procesando lotes incrementales para mantener un consumo de memoria constante $O(1)$.
## 3. Resultados y Benchmark Productivo

| Métrica / Dimensión | Baseline Experimental | Modelo Productivo (Fase 4) | Impacto Operativo |
| :--- | :---: | :---: | :--- |
| **Accuracy Global** | 45.75% | **71.75%** | Mejora de +26.0 puntos porcentuales. |
| **F1-Score (Macro)** | 37.94% | **73.06%** | Equilibrio predictivo inter-clase de +35.12 puntos. |
| **Tiempo de Procesamiento** | > 20 minutos | **~13 minutos** | Eficiencia computacional superior al 35%. |
| **Gestión de Memoria** | Riesgo de OOM | **Constante O(1)** | Procesamiento estable por lotes incrementales. |

## 4. Requisitos y Dependencias

El entorno de ejecución está validado para Python 3.12 con las siguientes librerías principales:

```text
scikit-learn==1.6.1
pandas==2.2.2
numpy==2.0.2
joblib==1.5.3
