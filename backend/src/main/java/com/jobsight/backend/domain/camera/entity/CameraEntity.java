package com.jobsight.backend.domain.camera.entity;

import com.jobsight.backend.domain.camera.enumType.Zone;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Getter
@Entity
@Table(name = "cameras")
@NoArgsConstructor
public class CameraEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String streamKey;

    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Zone zone;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    public CameraEntity(String streamKey, String location,Zone zone) {
        this.streamKey = streamKey;
        this.location = location;
        this.zone=zone;
    }

}
