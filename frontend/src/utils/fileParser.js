/**
 * File Parser Utility for CSV, JSON and TXT Batch Ingestion
 */

export function parseBatchFileContent(content, name, minChars = 30) {
  if (!content || typeof content !== 'string') {
    return { texts: [], error: 'El archivo está vacío o el formato no es válido.' };
  }

  try {
    let texts = [];

    if (name.toLowerCase().endsWith('.json')) {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        texts = json
          .map((item) => (typeof item === 'string' ? item : item.descripcion || item.texto || item.contenido || ''))
          .filter((t) => t && t.trim().length >= minChars);
      } else if (json.textos && Array.isArray(json.textos)) {
        texts = json.textos.filter((t) => typeof t === 'string' && t.trim().length >= minChars);
      }
    } else {
      // CSV or plain TXT
      const lines = content.split(/\r?\n/);
      for (let line of lines) {
        let trimmed = line.trim();
        // Remove wrapping quotes if CSV
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          trimmed = trimmed.substring(1, trimmed.length - 1);
        }
        const lower = trimmed.toLowerCase();
        if (trimmed.length >= minChars && !lower.startsWith('descripcion') && !lower.startsWith('contenido')) {
          texts.push(trimmed);
        }
      }
    }

    if (texts.length === 0) {
      return {
        texts: [],
        error: `No se encontraron textos válidos (mínimo ${minChars} caracteres por nota) en el archivo.`,
      };
    }

    return { texts, error: null };
  } catch (err) {
    return {
      texts: [],
      error: 'Error al parsear el archivo. Verifica que la codificación sea UTF-8 y el formato CSV/JSON sea válido.',
    };
  }
}
