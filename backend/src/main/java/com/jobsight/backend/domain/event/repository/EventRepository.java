package com.jobsight.backend.domain.event.repository;

import com.jobsight.backend.domain.event.entity.EventEntity;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;

public interface EventRepository extends JpaRepository<EventEntity, Long> {

    @Query("""
            SELECT e FROM EventEntity e
            WHERE   e.detectedAt >= COALESCE(:from, e.detectedAt)
            AND     e.detectedAt <= COALESCE(:to, e.detectedAt)
            AND     e.cameraId = COALESCE(:cameraId, e.cameraId)
            AND     e.kind = COALESCE(:kind, e.kind)
            AND     e.status = COALESCE(:status, e.status)
            ORDER BY e.detectedAt DESC, e.id DESC
            """)
    List<EventEntity> search(@Param("from") OffsetDateTime from,
                             @Param("to") OffsetDateTime to,
                             @Param("cameraId") Long cameraId,
                             @Param("kind") EventKind kind,
                             @Param("status") EventStatus status,
                             Pageable pageable
    );
}
