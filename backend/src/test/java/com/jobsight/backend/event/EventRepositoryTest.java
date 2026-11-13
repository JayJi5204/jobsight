package com.jobsight.backend.event;

import com.jobsight.backend.TestcontainersConfiguration;
import com.jobsight.backend.domain.camera.entity.CameraEntity;
import com.jobsight.backend.domain.camera.enumType.Zone;
import com.jobsight.backend.domain.camera.repository.CameraRepository;
import com.jobsight.backend.domain.event.entity.EventEntity;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import com.jobsight.backend.domain.event.repository.EventRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;

@Slf4j
@Import(TestcontainersConfiguration.class)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class EventRepositoryTest {

    private static final PageRequest TEN = PageRequest.of(0, 10);

    @Autowired
    EventRepository eventRepository;

    @Autowired
    CameraRepository cameraRepository;

    private Long cameraId;

    private OffsetDateTime now;

    @BeforeEach
    void 사건_셋을_깔아_둔다() {
        cameraId = cameraRepository.save(new CameraEntity("CAM-000", "신논현역", Zone.GANGNAM)).getId();

        now = OffsetDateTime.now();

        save(EventKind.FALL, now.minusHours(1));
        save(EventKind.FIRE, now.minusHours(2));

        EventEntity old = save(EventKind.LOITERING, now.minusDays(10));

        old.ack(now);

        eventRepository.flush();

    }

    private EventEntity save(EventKind kind, OffsetDateTime at) {
        return eventRepository.save(new EventEntity(cameraId, kind, at, "yolo", 0.9f));
    }

    @Test
    void 거르개를_하나도_안_주면_다_나온다() {
        List<EventEntity> found = eventRepository.search(null, null, null, null, null, TEN);
        log.info("전부 = {}건", found.size());

        assertThat(found).hasSize(3);
    }

    @Test
    void 처리가_남은_것만_거른다() {
        List<EventEntity> found = eventRepository.search(null, null, null, null, EventStatus.OPEN, TEN);

        assertThat(found).hasSize(2).allMatch(e -> e.getStatus() == EventStatus.OPEN);
    }

    @Test
    void 종류로_거른다() {
        List<EventEntity> found = eventRepository.search(null, null, null, EventKind.FIRE, null, TEN);

        assertThat(found).hasSize(1);
        assertThat(found.getFirst().getKind()).isEqualTo(EventKind.FIRE);
    }

    @Test
    void 기간_밖은_빠진다() {
        List<EventEntity> found = eventRepository.search(now.minusHours(3), now, null, null, null, TEN);

        log.info("최근 세 시간 = {}건", found.size());

        assertThat(found).hasSize(2);
    }

    @Test
    void 다른_카메라_것은_안_나온다() {
        List<EventEntity> found = eventRepository.search(null, null, cameraId + 1, null, null, TEN);

        assertThat(found).isEmpty();
    }

    @Test
    void 최근_것이_위로_온다() {
        List<EventEntity> found = eventRepository.search(null, null, null, null, null, TEN);

        assertThat(found).extracting(EventEntity::getKind).containsExactly(EventKind.FALL, EventKind.FIRE, EventKind.LOITERING);
    }

    @Test
    void limit_만큼만_나온다() {
        List<EventEntity> found = eventRepository.search(null, null, null, null, null, PageRequest.of(0, 2));

        assertThat(found).hasSize(2);
    }
}
