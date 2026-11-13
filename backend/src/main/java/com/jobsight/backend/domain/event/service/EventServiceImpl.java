package com.jobsight.backend.domain.event.service;

import com.jobsight.backend.domain.camera.entity.CameraEntity;
import com.jobsight.backend.domain.camera.repository.CameraRepository;
import com.jobsight.backend.domain.event.dto.request.EventCreateRequest;
import com.jobsight.backend.domain.event.dto.request.EventEndRequest;
import com.jobsight.backend.domain.event.dto.request.EventReviewRequest;
import com.jobsight.backend.domain.event.dto.response.EventResponse;
import com.jobsight.backend.domain.event.entity.EventEntity;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import com.jobsight.backend.domain.event.repository.EventRepository;
import com.jobsight.backend.global.exception.BusinessException;
import com.jobsight.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private static final int MAX_LIMIT = 1000;

    private final EventRepository eventRepository;
    private final CameraRepository cameraRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EventResponse> eventList(OffsetDateTime from, OffsetDateTime to, Long cameraId, EventKind kind, EventStatus status, int limit) {

        PageRequest page = PageRequest.of(0, Math.min(limit, MAX_LIMIT));

        return eventRepository.search(from, to, cameraId, kind, status, page).stream()
                .map(EventResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public EventResponse create(EventCreateRequest request) {

        CameraEntity cameraEntity = cameraRepository.findByStreamKey(request.getStreamKey())
                .orElseThrow(() -> {
                    log.warn("모르는 카메라로 사건이 들어왔습니다 - streamKey={}", request.getStreamKey());
                    return new BusinessException(ErrorCode.CAMERA_NOT_FOUND, request.getStreamKey());
                });


        EventEntity eventEntity = new EventEntity(
                cameraEntity.getId(),
                request.getKind(),
                request.getDetectedAt(),
                request.getModel(),
                request.getConfidence());

        eventRepository.save(eventEntity);

        log.debug("사건 들어옴 - streamKey = {} kind ={}", request.getStreamKey(), request.getKind());

        return EventResponse.from(eventEntity);
    }

    @Override
    @Transactional
    public EventResponse review(Long id, EventReviewRequest request) {
        if (request.getStatus() != EventStatus.ACKED) {
            throw new BusinessException(ErrorCode.EVENT_REVIEW_UNSUPPORTED);
        }
        EventEntity eventEntity = find(id);
        eventEntity.ack(OffsetDateTime.now());

        log.debug("사건 확인 - id = {}", id);

        return EventResponse.from(eventEntity);
    }

    @Override
    @Transactional
    public EventResponse end(Long id, EventEndRequest request) {

        EventEntity eventEntity = find(id);

        if (request.getEndedAt().isBefore(eventEntity.getDetectedAt())) {
            throw new BusinessException(ErrorCode.EVENT_RANGE_INVALID);
        }

        eventEntity.end(request.getEndedAt());

        log.debug("구간 닫힘 - id = {} endedAt = {}", id, request.getEndedAt());

        return EventResponse.from(eventEntity);
    }

    private EventEntity find(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EVENT_NOT_FOUND, String.valueOf(id)));
    }
}
