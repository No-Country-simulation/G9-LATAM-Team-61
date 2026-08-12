package com.g9_latam_team_61.backend.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CsvParserUtilTest {

    @Test
    void parsearCsv_debeParsearLíneasOmiteEncabezadoYVacias() {
        String csvContent = "contenido\nTexto de prueba 1 con suficiente contenido\n\nTexto de prueba 2 con suficiente contenido\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        List<String> resultado = CsvParserUtil.parsearCsv(file);

        assertEquals(2, resultado.size());
        assertEquals("Texto de prueba 1 con suficiente contenido", resultado.get(0));
        assertEquals("Texto de prueba 2 con suficiente contenido", resultado.get(1));
    }

    @Test
    void parsearCsv_debeLanzarExcepcion_siArchivoEsNuloOVacio() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0]);

        assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(null));
        assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(emptyFile));
    }
}
