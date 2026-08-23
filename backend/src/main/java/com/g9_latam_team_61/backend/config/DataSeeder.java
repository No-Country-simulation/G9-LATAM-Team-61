package com.g9_latam_team_61.backend.config;

import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
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
                crearNota("DevOps", 0.94,
                        List.of("OCI", "Docker", "Balanceadores"),
                        "Configuración de balanceadores de carga en OCI usando Docker."),

                crearNota("DevOps", 0.91,
                        List.of("GitHub Actions", "CI/CD"),
                        "Automatización de despliegues con GitHub Actions."),

                crearNota("Frontend", 0.87,
                        List.of("react", "hooks"),
                        "Patrones de uso del hook useEffect en componentes funcionales."),

                crearNota("Backend", 0.92,
                        List.of("Spring Boot", "Jackson"),
                        "Actualización del proyecto de Spring Boot 3.5 a la versión 4.1."),

                crearNota("Backend", 0.89,
                        List.of("spring", "auth", "token"),
                        "Implementación de autenticación JWT con manejo de excepciones."),

                crearNota("Otros", 0.75,
                        List.of("misceláneo"),
                        "Contenido de ejemplo que no encaja en una categoría específica.")
        ));

        log.info("Datos de prueba (seed) cargados correctamente.");
    }

    private Nota crearNota(String categoria, Double probabilidad,
                           List<String> palabrasClave, String contenidoOriginal) {
        Nota nota = new Nota();
        nota.setCategoria(categoria);
        nota.setProbabilidad(probabilidad);
        nota.setPalabrasClave(palabrasClave);
        nota.setContenidoOriginal(contenidoOriginal);
        nota.setFechaAnalisis(LocalDateTime.now());
        nota.setTiempoProcesamientoMs(25.0);
        return nota;
    }
}
