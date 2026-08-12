package com.g9_latam_team_61.backend.repository;

import com.g9_latam_team_61.backend.dto.CategoriaConteoResponse;
import com.g9_latam_team_61.backend.model.Nota;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    @Query("SELECT n FROM Nota n WHERE LOWER(n.categoria) = LOWER(:categoria)")
    Page<Nota> findByCategoriaIgnoreCase(@Param("categoria") String categoria, Pageable pageable);

    @Query("SELECT AVG(n.probabilidad) FROM Nota n")
    Double findConfianzaPromedio();

    @Query(value = """
        SELECT n.* FROM notas n
        WHERE LOWER(n.contenido_original) LIKE LOWER(CONCAT('%', :query, '%'))
           OR EXISTS (
               SELECT 1 FROM nota_palabras_clave pc 
               WHERE pc.nota_id = n.id AND LOWER(pc.palabra) = LOWER(:query)
           )
        ORDER BY 
           CASE 
              WHEN EXISTS (
                  SELECT 1 FROM nota_palabras_clave pc 
                  WHERE pc.nota_id = n.id AND LOWER(pc.palabra) = LOWER(:query)
              ) THEN 1
              ELSE 2
           END,
           n.fecha_analisis DESC
        LIMIT 20
    """, nativeQuery = true)
    List<Nota> buscarPorSimilitud(@Param("query") String query);

    @Query(value = """
        SELECT n.* FROM notas n
        JOIN nota_palabras_clave pc ON pc.nota_id = n.id
        WHERE n.categoria = (SELECT categoria FROM notas WHERE id = :notaId)
          AND n.id <> :notaId
          AND pc.palabra IN (SELECT palabra FROM nota_palabras_clave WHERE nota_id = :notaId)
        GROUP BY n.id
        ORDER BY COUNT(pc.palabra) DESC, n.probabilidad DESC
        LIMIT 5
    """, nativeQuery = true)
    List<Nota> encontrarRecomendados(@Param("notaId") Long notaId);

    @Query("SELECT new com.g9_latam_team_61.backend.dto.CategoriaConteoResponse(n.categoria, COUNT(n)) FROM Nota n GROUP BY n.categoria")
    List<CategoriaConteoResponse> contarNotasPorCategoria();
}
