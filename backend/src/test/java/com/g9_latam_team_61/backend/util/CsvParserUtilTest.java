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
    void parsearCsv_debeAceptarRegistrosCon30Y5000Caracteres() {
        String texto30 = "123456789012345678901234567890";
        String texto5000 = "a".repeat(5000);
        String csvContent = "contenido\n" + texto30 + "\n" + texto5000 + "\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        List<String> resultado = CsvParserUtil.parsearCsv(file);

        assertEquals(2, resultado.size());
        assertEquals(texto30, resultado.get(0));
        assertEquals(texto5000, resultado.get(1));
    }

    @Test
    void parsearCsv_debeRechazarRegistroCon29Caracteres() {
        String texto29 = "12345678901234567890123456789";
        String csvContent = "contenido\n" + texto29 + "\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(file));
        assertTrue(ex.getMessage().contains("entre 30 y 5000 caracteres"));
    }

    @Test
    void parsearCsv_debeRechazarRegistroCon5001Caracteres() {
        String texto5001 = "a".repeat(5001);
        String csvContent = "contenido\n" + texto5001 + "\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(file));
        assertTrue(ex.getMessage().contains("entre 30 y 5000 caracteres"));
    }

    @Test
    void parsearCsv_debeRechazarArchivoQueSupera100Registros() {
        StringBuilder sb = new StringBuilder("contenido\n");
        for (int i = 0; i < 101; i++) {
            sb.append("Texto de prueba numero ").append(i).append(" con mas de 30 caracteres\n");
        }
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", sb.toString().getBytes(StandardCharsets.UTF_8));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(file));
        assertTrue(ex.getMessage().contains("no puede contener más de 100 registros"));
    }

    @Test
    void parsearCsv_debeLanzarExcepcion_siArchivoEsNuloOVacio() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0]);

        assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(null));
        assertThrows(IllegalArgumentException.class, () -> CsvParserUtil.parsearCsv(emptyFile));
    }
}
