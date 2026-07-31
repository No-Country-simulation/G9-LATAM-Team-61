package com.g9_latam_team_61.backend.config;

import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Profile("local")
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final NotaRepository notaRepository;

    @Override
    public void run(String... args) {
        if (notaRepository.count() > 0) {
            return;
        }

        notaRepository.saveAll(List.of(
                crearNota("Documentación de Servidores", "DevOps", 0.94,
                        List.of("OCI", "Docker", "Balanceadores"),
                        "Configuración de balanceadores de carga en OCI usando Docker."),

                crearNota("Pipeline de CI/CD", "DevOps", 0.91,
                        List.of("GitHub Actions", "CI/CD"),
                        "Automatización de despliegues con GitHub Actions."),

                crearNota("Optimización de Consultas SQL", "Base de Datos", 0.88,
                        List.of("PostgreSQL", "Índices"),
                        "Análisis de índices en PostgreSQL para mejorar rendimiento."),

                crearNota("Migración a Spring Boot 4", "Backend", 0.92,
                        List.of("Spring Boot", "Jackson"),
                        "Actualización del proyecto de Spring Boot 3.5 a la versión 4.1."),

                crearNota("Autenticación JWT", "Seguridad", 0.89,
                        List.of("JWT", "Auth"),
                        "Implementación de autenticación JWT con refresh tokens.")
        ));

        System.out.println(">>> Datos de prueba (seed) cargados correctamente.");
    }

    private Nota crearNota(String titulo, String categoria, Double probabilidad,
                           List<String> palabrasClave, String contenidoOriginal) {
        Nota nota = new Nota();
        nota.setTitulo(titulo);
        nota.setCategoria(categoria);
        nota.setProbabilidad(probabilidad);
        nota.setPalabrasClave(palabrasClave);
        nota.setContenidoOriginal(contenidoOriginal);
        nota.setFechaAnalisis(LocalDateTime.now());
        return nota;
    }
}
