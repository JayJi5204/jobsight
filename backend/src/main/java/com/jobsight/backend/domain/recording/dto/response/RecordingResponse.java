package com.jobsight.backend.domain.recording.dto.response;

import lombok.Getter;

import java.time.OffsetDateTime;

@Getter
public class RecordingResponse {

    private Long cameraId;
    private OffsetDateTime start;
    private OffsetDateTime end;

    private RecordingResponse() {
    }

    public static RecordingResponse of(Long cameraId, OffsetDateTime start, OffsetDateTime end) {
        RecordingResponse recordingResponse = new RecordingResponse();
        recordingResponse.cameraId = cameraId;
        recordingResponse.start = start;
        recordingResponse.end = end;

        return recordingResponse;
    }
}
