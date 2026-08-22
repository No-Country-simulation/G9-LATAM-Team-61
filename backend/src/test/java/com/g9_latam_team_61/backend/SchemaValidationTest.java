package com.g9_latam_team_61.backend;

import com.g9_latam_team_61.backend.model.Cluster;
import com.g9_latam_team_61.backend.model.Nota;
import com.g9_latam_team_61.backend.repository.ClusterRepository;
import com.g9_latam_team_61.backend.repository.NotaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SchemaValidationTest {

    @Autowired
    private NotaRepository notaRepository;

    @Autowired
    private ClusterRepository clusterRepository;

    @Test
    void debeCrearYPersistirTablasCorrectamenteEnBaseDeDatosReproducible() {
        Cluster cluster = new Cluster(1, "DevOps", List.of("docker", "k8s"), 1, LocalDateTime.now());
        Cluster clusterGuardado = clusterRepository.save(cluster);
        assertNotNull(clusterGuardado);

        Nota nota = new Nota();
        nota.setContenidoOriginal("Configuracion de balanceador de carga en OCI");
        nota.setCategoria("DevOps");
        nota.setProbabilidad(0.95);
        nota.setPalabrasClave(List.of("oci", "docker"));
        nota.setClusterId(1);
        nota.setVersionModelo("v1.0.0");
        nota.setFeedbackUsuario("Correcto");

        Nota notaGuardada = notaRepository.save(nota);
        assertNotNull(notaGuardada.getId());

        Nota notaRecuperada = notaRepository.findById(notaGuardada.getId()).orElseThrow();
        assertEquals("DevOps", notaRecuperada.getCategoria());
        assertEquals(List.of("oci", "docker"), notaRecuperada.getPalabrasClave());
        assertEquals(1, notaRecuperada.getClusterId());
    }
}