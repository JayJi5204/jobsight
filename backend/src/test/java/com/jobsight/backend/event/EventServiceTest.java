package com.jobsight.backend.event;

import com.jobsight.backend.TestcontainersConfiguration;
import com.jobsight.backend.domain.event.dto.request.EventCreateRequest;
import com.jobsight.backend.domain.event.dto.request.EventEndRequest;
import com.jobsight.backend.domain.event.dto.request.EventReviewRequest;
import com.jobsight.backend.domain.event.entity.EventEntity;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import com.jobsight.backend.domain.event.repository.EventRepository;
import com.jobsight.backend.domain.event.service.EventService;
import com.jobsight.backend.global.exception.BusinessException;
import com.jobsight.backend.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

@Slf4j
@Import(TestcontainersConfiguration.class)
@SpringBootTest
public class EventServiceTest {

    @Autowired
    EventService service;

    @Autowired
    EventRepository repository;

    private OffsetDateTime now;

    @BeforeEach
    void 비우고_시작한다() {
        repository.deleteAll();
        now = OffsetDateTime.now();
    }

    /** V2 가 심어 둔 CAM-001 로 사건 하나를 만든다 */
    private Long 사건_하나() {
        EventCreateRequest request = new EventCreateRequest();
        request.setStreamKey("CAM-001");
        request.setKind(EventKind.FALL);
        request.setDetectedAt(now.minusMinutes(3));
        request.setModel("yolo");
        request.setConfidence(0.9f);

        return service.create(request).getId();
    }

    @Test
    void 사건은_미확인으로_들어간다() {
        Long id = 사건_하나();

        EventEntity saved = repository.findById(id).orElseThrow();

        log.info("만들어짐 - id = {} status = {} endedAt = {}", saved.getId(), saved.getStatus(), saved.getEndedAt());

        assertThat(saved.getStatus()).isEqualTo(EventStatus.OPEN);
        assertThat(saved.getEndedAt()).isNull();
        assertThat(saved.getAckedAt()).isNull();
    }

    @Test
    void 확인하면_확인한_시각이_남는다() {
        Long id = 사건_하나();

        EventReviewRequest request = new EventReviewRequest();
        request.setStatus(EventStatus.ACKED);
        service.review(id, request);

        EventEntity saved = repository.findById(id).orElseThrow();

        log.info("확인됨 - status = {} ackedAt = {}", saved.getStatus(), saved.getAckedAt());

        assertThat(saved.getStatus()).isEqualTo(EventStatus.ACKED);
        assertThat(saved.getAckedAt()).isNotNull();
    }

    @Test
    void 구간을_닫으면_끝난_시각이_남는다() {
        Long id = 사건_하나();

        EventEndRequest request = new EventEndRequest();
        request.setEndedAt(now.minusMinutes(1));
        service.end(id, request);

        EventEntity saved = repository.findById(id).orElseThrow();

        log.info("닫힘 - detectedAt = {} endedAt = {}", saved.getDetectedAt(), saved.getEndedAt());

        assertThat(saved.getEndedAt()).isNotNull();
    }

    @Test
    void 모르는_카메라면_거절한다() {
        EventCreateRequest request = new EventCreateRequest();
        request.setStreamKey("CAM-999");
        request.setKind(EventKind.FIRE);
        request.setDetectedAt(now);

        BusinessException thrown = catchThrowableOfType(BusinessException.class, () -> service.create(request));

        log.info("거부됨 = {} / {}", thrown.getErrorCode(), thrown.getMessage());

        assertThat(thrown.getErrorCode()).isEqualTo(ErrorCode.CAMERA_NOT_FOUND);
    }

    @Test
    void 끝난_시각이_시작보다_빠르면_거절한다() {
        Long id = 사건_하나();

        EventEndRequest request = new EventEndRequest();
        request.setEndedAt(now.minusHours(1));

        BusinessException thrown = catchThrowableOfType(BusinessException.class, () -> service.end(id, request));

        log.info("거부됨 = {} / {}", thrown.getErrorCode(), thrown.getMessage());

        assertThat(thrown.getErrorCode()).isEqualTo(ErrorCode.EVENT_RANGE_INVALID);
    }

    @Test
    void 확인_취소는_아직_없다() {
        Long id = 사건_하나();

        EventReviewRequest request = new EventReviewRequest();
        request.setStatus(EventStatus.OPEN);

        BusinessException thrown = catchThrowableOfType(BusinessException.class, () -> service.review(id, request));

        log.info("거부됨 = {} / {}", thrown.getErrorCode(), thrown.getMessage());

        assertThat(thrown.getErrorCode()).isEqualTo(ErrorCode.EVENT_REVIEW_UNSUPPORTED);
    }

    @Test
    void 없는_사건이면_거절한다() {
        EventReviewRequest request = new EventReviewRequest();
        request.setStatus(EventStatus.ACKED);

        BusinessException thrown = catchThrowableOfType(BusinessException.class, () -> service.review(9999L, request));

        log.info("거부됨 = {} / {}", thrown.getErrorCode(), thrown.getMessage());

        assertThat(thrown.getErrorCode()).isEqualTo(ErrorCode.EVENT_NOT_FOUND);
    }
}