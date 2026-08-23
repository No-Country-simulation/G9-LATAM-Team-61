CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS notas (
    id BIGSERIAL PRIMARY KEY,
    contenido_original TEXT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    probabilidad DOUBLE PRECISION NOT NULL,
    fecha_analisis TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nota_categoria ON notas(categoria);
CREATE INDEX IF NOT EXISTS idx_nota_fecha ON notas(fecha_analisis);

CREATE TABLE IF NOT EXISTS nota_palabras_clave (
    nota_id BIGINT NOT NULL,
    palabra VARCHAR(255),
    CONSTRAINT fk_nota_palabras FOREIGN KEY (nota_id) REFERENCES notas(id) ON DELETE CASCADE
);