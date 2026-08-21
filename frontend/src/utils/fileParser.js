/**
 * File Parser Utility for CSV, JSON and TXT Batch Ingestion (30 - 5000 chars)
 */

export function parseBatchFileContent(content, name, minChars = 30, maxChars = 5000) {
  if (!content || typeof content !== 'string') {
    return { texts: [], rejectedCount: 0, error: 'El archivo está vacío o el formato no es válido.' };
  }

  try {
    let rawItems = [];

    if (name.toLowerCase().endsWith('.json')) {
      const json = JSON.parse(content);
      if (Array.isArray(json)) {
        rawItems = json.map((item) =>
          typeof item === 'string' ? item : item.descripcion || item.texto || item.contenido || ''
        );
      } else if (json.textos && Array.isArray(json.textos)) {
        rawItems = json.textos.filter((t) => typeof t === 'string');
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
        if (trimmed && !lower.startsWith('descripcion') && !lower.startsWith('contenido')) {
          rawItems.push(trimmed);
        }
      }
    }

    const texts = [];
    let rejectedCount = 0;

    for (const item of rawItems) {
      const trimmed = typeof item === 'string' ? item.trim() : '';
      if (trimmed.length >= minChars && trimmed.length <= maxChars) {
        texts.push(trimmed);
      } else if (trimmed.length > 0) {
        rejectedCount++;
      }
    }

    if (texts.length === 0) {
      return {
        texts: [],
        rejectedCount,
        error: `No se encontraron textos válidos (${minChars} a ${maxChars} caracteres) en el archivo.`,
      };
    }

    return { texts, rejectedCount, error: null };
  } catch {
    return {
      texts: [],
      rejectedCount: 0,
      error: 'Error al parsear el archivo. Verifica que la codificación sea UTF-8 y el formato CSV/JSON sea válido.',
    };
  }
}
