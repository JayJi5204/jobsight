package com.jobsight.backend.domain.event.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
public class EventEndRequest {

    @NotNull
    private OffsetDateTime endedAt;
}
