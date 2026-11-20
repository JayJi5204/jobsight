package com.jobsight.backend.domain.recording.service;

import com.jobsight.backend.domain.recording.dto.response.RecordingResponse;

import java.time.LocalDate;
import java.util.List;

public interface RecordingService {

    List<RecordingResponse> segmentList(Long cameraId, LocalDate date);
}
