package com.jobsight.backend.camera;

import com.jobsight.backend.TestcontainersConfiguration;
import com.jobsight.backend.domain.camera.entity.CameraEntity;
import com.jobsight.backend.domain.camera.repository.CameraRepository;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.*;

@Slf4j
@Import(TestcontainersConfiguration.class)
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CameraRepositoryTest {


    @Autowired
    CameraRepository repository;

    @Test
    void streamKey로_카메라를_찾는다(){
        repository.save(new CameraEntity("cam1", "격납고 1"));

        Optional<CameraEntity> entity = repository.findByStreamKey("cam1");

        assertThat(entity).isPresent();
        
        log.info("찾음 - id={} streamKey={} location={}",
                entity.get().getId(), entity.get().getStreamKey(),entity.get().getLocation());
        
        assertThat(entity.get().getLocation()).isEqualTo("격납고 1");
    }

    @Test
    void  저장하면_createdAt이_자동으로_채워진다(){
        CameraEntity entity=repository.save(new CameraEntity("cam1","격납고 1"));

        log.info("createdAt = {}", entity.getCreatedAt());

        assertThat(entity.getCreatedAt()).isNotNull();
    }

    @Test
    void 같은_streamKey는_두_번_저장할_수_없다(){
        repository.save(new CameraEntity("cam1","격납고 1"));

        Throwable thrown= catchThrowable(() -> repository.saveAndFlush(new CameraEntity("cam1","격납고 2")));

        log.info("거부됨 = {}",thrown.getClass().getSimpleName());
        log.info("원인 = {}",thrown.getCause().getMessage());

        assertThat(thrown).isInstanceOf(DataIntegrityViolationException.class);

    }
}
