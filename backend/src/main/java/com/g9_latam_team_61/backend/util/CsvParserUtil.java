package com.g9_latam_team_61.backend.util;

import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class CsvParserUtil {

    private static final int MIN_LENGTH = 30;
    private static final int MAX_LENGTH = 5000;
    private static final int MAX_REGISTROS = 100;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private CsvParserUtil() {
    }

    public static List<String> parsearCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo CSV no puede estar vacío");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("El tamaño del archivo CSV no puede superar los 5 MB");
        }

        List<String> lineas = new ArrayList<>();
        int numeroLinea = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String linea;
            boolean primeraLinea = true;
            while ((linea = reader.readLine()) != null) {
                numeroLinea++;
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

                if (textoLimpio.length() < MIN_LENGTH || textoLimpio.length() > MAX_LENGTH) {
                    throw new IllegalArgumentException("El registro en la línea " + numeroLinea + " debe tener entre " + MIN_LENGTH + " y " + MAX_LENGTH + " caracteres");
                }

                lineas.add(textoLimpio);

                if (lineas.size() > MAX_REGISTROS) {
                    throw new IllegalArgumentException("El archivo CSV no puede contener más de " + MAX_REGISTROS + " registros");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Error al procesar el archivo CSV: " + e.getMessage());
        }

        if (lineas.isEmpty()) {
            throw new IllegalArgumentException("El archivo CSV no contiene registros válidos");
        }

        return lineas;
    }
}
