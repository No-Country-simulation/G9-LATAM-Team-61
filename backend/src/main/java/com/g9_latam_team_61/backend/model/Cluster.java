package com.g9_latam_team_61.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "clusters")
public class Cluster {

    @Id
    private Integer id;

    @Column(name = "nombre_sugerido", nullable = false)
    private String nombreSugerido;

    @ElementCollection
    @CollectionTable(
            name = "cluster_palabras_clave",
            joinColumns = @JoinColumn(name = "cluster_id"))
    @Column(name = "palabra")
    private List<String> palabrasClaveTop;

    @Column(name = "total_documentos")
    private Integer totalDocumentos;

    @Column(name = "fecha_generacion")
    private LocalDateTime fechaGeneracion = LocalDateTime.now();
}
