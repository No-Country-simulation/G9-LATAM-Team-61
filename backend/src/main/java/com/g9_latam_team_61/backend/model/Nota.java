package com.g9_latam_team_61.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "notas", indexes = {
        @Index(name = "idx_nota_categoria", columnList = "categoria"),
        @Index(name = "idx_nota_fecha", columnList = "fecha_analisis")
})
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500)
    private String titulo;

    @Column(name = "contenido_original", columnDefinition = "TEXT", nullable = false)
    private String contenidoOriginal;

    @Column(nullable = false, length = 100)
    private String categoria;

    @Column(nullable = false)
    private Double probabilidad;

    @ElementCollection
    @CollectionTable(
            name = "nota_palabras_clave",
            joinColumns = @JoinColumn(name = "nota_id"))
    @Column(name = "palabra")
    private List<String> palabrasClave;

    @Column(name = "fecha_analisis")
    private LocalDateTime fechaAnalisis = LocalDateTime.now();

//        Long tiempo_procesamiento_ms,
//        List<Long> textos_similares,
//        String version_modelo,
//        String feedback_usuario

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Nota nota = (Nota) o;
        return id != null && Objects.equals(id, nota.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

}
