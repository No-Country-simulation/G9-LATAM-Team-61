package com.g9_latam_team_61.backend.repository;

import com.g9_latam_team_61.backend.model.Nota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotaRepository extends JpaRepository<Nota, Long> {
}
