package com.g9_latam_team_61.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
@Table(name = "notas")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500)
    private String titulo;

    @Column(nullable = false, length = 100)
    private String categoria;

    @Column(nullable = false)
    private Double probabilidad;

    @ElementCollection
    @CollectionTable(name = "nota_palabras_clave", joinColumns = @JoinColumn(name = "nota_id"))
    @Column(name = "palabra")
    private List<String> palabrasClave;

    @Column(name = "fecha_analisis")
    private LocalDateTime fechaAnalisis = LocalDateTime.now();

//        Long tiempo_procesamiento_ms,
//        List<Long> textos_similares,
//        String version_modelo,
//        String feedback_usuario


}
