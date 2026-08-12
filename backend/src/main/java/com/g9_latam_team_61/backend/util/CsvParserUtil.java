package com.g9_latam_team_61.backend.util;

import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class CsvParserUtil {

    private CsvParserUtil() {
    }

    public static List<String> parsearCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo CSV no puede estar vacío");
        }

        List<String> lineas = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linea;
            boolean primeraLinea = true;
            while ((linea = reader.readLine()) != null) {
                String textoLimpio = linea.trim();
                if (textoLimpio.isEmpty()) continue;

                if (primeraLinea && (textoLimpio.equalsIgnoreCase("contenido") 
                        || textoLimpio.equalsIgnoreCase("texto") 
                        || textoLimpio.equalsIgnoreCase("contenido_original")
                        || textoLimpio.equalsIgnoreCase("descripcion"))) {
                    primeraLinea = false;
                    continue;
                }
                primeraLinea = false;
                lineas.add(textoLimpio);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al procesar el archivo CSV: " + e.getMessage());
        }

        if (lineas.isEmpty()) {
            throw new IllegalArgumentException("El archivo CSV no contiene registros válidos");
        }

        return lineas;
    }
}
