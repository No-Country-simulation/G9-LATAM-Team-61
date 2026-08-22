CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS clusters (
    id INTEGER PRIMARY KEY,
    nombre_sugerido VARCHAR(255) NOT NULL,
    total_documentos INTEGER,
    fecha_generacion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cluster_palabras_clave (
    cluster_id INTEGER NOT NULL,
    palabra VARCHAR(255),
    CONSTRAINT fk_cluster_palabras FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notas (
    id BIGSERIAL PRIMARY KEY,
    contenido_original TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    probabilidad DOUBLE PRECISION NOT NULL,
    fecha_analisis TIMESTAMP,
    tiempo_procesamiento_ms DOUBLE PRECISION,
    cluster_id INTEGER,
    version_modelo VARCHAR(50),
    feedback_usuario VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_nota_categoria ON notas(categoria);
CREATE INDEX IF NOT EXISTS idx_nota_fecha ON notas(fecha_analisis);

CREATE TABLE IF NOT EXISTS nota_palabras_clave (
    nota_id BIGINT NOT NULL,
    palabra VARCHAR(255),
    CONSTRAINT fk_nota_palabras FOREIGN KEY (nota_id) REFERENCES notas(id) ON DELETE CASCADE
);
