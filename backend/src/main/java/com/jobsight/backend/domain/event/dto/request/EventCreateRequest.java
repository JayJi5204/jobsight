package com.jobsight.backend.domain.event.dto.request;

import com.jobsight.backend.domain.event.enumType.EventKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
public class EventCreateRequest {

    @NotBlank
    private String streamKey;

    @NotNull
    private EventKind kind;

    @NotNull
    private OffsetDateTime detectedAt;

    private String model;

    private Float confidence;
}
