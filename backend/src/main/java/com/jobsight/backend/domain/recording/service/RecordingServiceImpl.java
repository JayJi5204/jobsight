package com.jobsight.backend.domain.recording.service;

import com.jobsight.backend.domain.camera.entity.CameraEntity;
import com.jobsight.backend.domain.camera.repository.CameraRepository;
import com.jobsight.backend.domain.recording.config.RecordingProperties;
import com.jobsight.backend.domain.recording.dto.response.PlaybackSegmentResponse;
import com.jobsight.backend.domain.recording.dto.response.RecordingResponse;
import com.jobsight.backend.global.exception.BusinessException;
import com.jobsight.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecordingServiceImpl implements RecordingService {

    private static final ParameterizedTypeReference<List<PlaybackSegmentResponse>> SEGMENT_LIST =
            new ParameterizedTypeReference<>() {
            };

    private static final long NANOS_PER_SECOND = 1_000_000_000L;

    private final CameraRepository cameraRepository;
    private final RecordingProperties recordingProperties;
    private final RestClient restClient = RestClient.create();

    @Override
    public List<RecordingResponse> segmentList(Long cameraId, LocalDate date) {
        CameraEntity cameraEntity = cameraRepository.findById(cameraId).orElseThrow(
                () -> new BusinessException(ErrorCode.CAMERA_NOT_FOUND, String.valueOf(cameraId)));

        ZoneId zone = recordingProperties.zoneId();
        OffsetDateTime from = date.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime to = date.plusDays(1).atStartOfDay(zone).toOffsetDateTime();

        return fetch(cameraEntity.getStreamKey(), from, to).stream()
                .map(segment -> toResponse(cameraId, segment, zone))
                .toList();
    }

    private List<PlaybackSegmentResponse> fetch(String streamKey, OffsetDateTime from, OffsetDateTime to) {
        try {
            List<PlaybackSegmentResponse> segments = restClient.get()
                    .uri(recordingProperties.getPlaybackUrl() + "/list?path={path}&start={start}&end={end}",
                            streamKey, from.toInstant().toString(), to.toInstant().toString())
                    .retrieve()
                    .body(SEGMENT_LIST);

            return segments == null ? List.of() : segments;
        } catch (HttpClientErrorException.NotFound e) {
            return List.of();
        } catch (RestClientException e) {
            log.warn("녹화 구간을 받지 못했습니다 - {} {}", streamKey, e.getMessage());
            throw new BusinessException(ErrorCode.RECORDING_UNAVAILABLE, streamKey);
        }
    }

    private RecordingResponse toResponse(Long cameraId, PlaybackSegmentResponse segment, ZoneId zone) {
        OffsetDateTime start = segment.getStart().atZoneSameInstant(zone).toOffsetDateTime();
        OffsetDateTime end = start.plus(Duration.ofNanos(Math.round(segment.getDuration() * NANOS_PER_SECOND)));

        return RecordingResponse.of(cameraId, start, end);
    }
}