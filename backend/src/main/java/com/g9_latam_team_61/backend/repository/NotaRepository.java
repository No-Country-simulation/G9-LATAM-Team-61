package com.g9_latam_team_61.backend.repository;

import com.g9_latam_team_61.backend.model.Nota;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {

    @Query("SELECT n FROM Nota n WHERE LOWER(n.categoria) = LOWER(:categoria)")
    Page<Nota> findByCategoriaIgnoreCase(@Param("categoria") String categoria, Pageable pageable);

    @Query("SELECT AVG(n.probabilidad) FROM Nota n")
    Double findConfianzaPromedio();
}
