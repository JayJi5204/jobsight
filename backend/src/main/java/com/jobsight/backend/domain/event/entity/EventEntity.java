package com.jobsight.backend.domain.event.entity;

import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Getter
@Entity
@Table(name = "events")
@NoArgsConstructor
public class EventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long cameraId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EventKind kind;

    @Column(nullable = false)
    private OffsetDateTime detectedAt;

    private OffsetDateTime endedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EventStatus status;

    private OffsetDateTime ackedAt;

    private String model;

    private Float confidence;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    public EventEntity(Long cameraId, EventKind kind, OffsetDateTime detectedAt, String model, Float confidence) {
        this.cameraId = cameraId;
        this.kind = kind;
        this.detectedAt = detectedAt;
        this.status = EventStatus.OPEN;
        this.model = model;
        this.confidence = confidence;
    }

    public void end(OffsetDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public void ack(OffsetDateTime ackedAt) {
        this.status = EventStatus.ACKED;
        this.ackedAt = ackedAt;
    }


}
