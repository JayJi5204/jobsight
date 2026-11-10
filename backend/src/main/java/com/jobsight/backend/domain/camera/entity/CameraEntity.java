package com.jobsight.backend.domain.camera.entity;

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

    @CreationTimestamp
    private OffsetDateTime createdAt;

    public CameraEntity(String streamKey, String location) {
        this.streamKey = streamKey;
        this.location = location;
    }

}
