package com.jobsight.backend.domain.recording.service;

import com.jobsight.backend.domain.camera.entity.CameraEntity;
import com.jobsight.backend.domain.camera.repository.CameraRepository;
import com.jobsight.backend.domain.recording.dto.response.RecordingResponse;
import com.jobsight.backend.global.exception.BusinessException;
import com.jobsight.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecordingServiceImpl implements RecordingService {

    private final CameraRepository cameraRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RecordingResponse> segmentList(Long cameraId, LocalDate date) {
        CameraEntity cameraEntity = cameraRepository.findById(cameraId).orElseThrow(
                () -> new BusinessException(ErrorCode.CAMERA_NOT_FOUND, String.valueOf(cameraId)));

        log.debug("녹화 구간 조회 - {} {}", cameraEntity.getStreamKey(), date);

        return List.of();
    }
}
