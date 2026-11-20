package com.jobsight.backend.domain.recording.controller;

import com.jobsight.backend.domain.recording.dto.response.RecordingResponse;
import com.jobsight.backend.domain.recording.service.RecordingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recordings")
public class RecordingController {

    private final RecordingService recordingService;

    @GetMapping
    public List<RecordingResponse> segmentList(
            @RequestParam Long cameraId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date){
        return recordingService.segmentList(cameraId,date);
    }
}
