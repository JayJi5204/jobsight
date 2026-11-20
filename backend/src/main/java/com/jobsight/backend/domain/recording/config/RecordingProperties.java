package com.jobsight.backend.domain.recording.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;

@Data
@ConfigurationProperties(prefix = "jobsight.recording")
public class RecordingProperties {

    private String zone;
    private String playbackUrl;

    public ZoneId zoneId(){
        return ZoneId.of(zone);
    }
}
