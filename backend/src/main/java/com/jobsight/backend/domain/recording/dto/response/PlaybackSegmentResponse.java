package com.jobsight.backend.domain.recording.dto.response;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class PlaybackSegmentResponse {

    private OffsetDateTime start;
    private double duration;
}
