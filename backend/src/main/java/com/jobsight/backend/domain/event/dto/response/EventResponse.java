package com.jobsight.backend.domain.event.dto.response;

import com.jobsight.backend.domain.event.entity.EventEntity;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
public class EventResponse {

    private Long id;
    private Long cameraId;
    private EventKind kind;
    private OffsetDateTime detectedAt;
    private OffsetDateTime endedAt;
    private EventStatus status;
    private OffsetDateTime ackedAt;
    private String model;
    private Float confidence;

    private EventResponse() {
    }

    public static EventResponse from(EventEntity entity) {
        EventResponse response = new EventResponse();
        response.id = entity.getId();
        response.cameraId = entity.getCameraId();
        response.kind = entity.getKind();
        response.detectedAt = entity.getDetectedAt();
        response.endedAt = entity.getEndedAt();
        response.status = entity.getStatus();
        response.ackedAt = entity.getAckedAt();
        response.model = entity.getModel();
        response.confidence = entity.getConfidence();

        return response;
    }
}
