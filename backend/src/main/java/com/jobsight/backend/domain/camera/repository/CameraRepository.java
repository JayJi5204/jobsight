package com.jobsight.backend.domain.camera.repository;

import com.jobsight.backend.domain.camera.entity.CameraEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CameraRepository extends JpaRepository<CameraEntity,Long> {
    Optional<CameraEntity> findByStreamKey(String streamKey);
}
