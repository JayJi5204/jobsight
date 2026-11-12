package com.jobsight.backend.domain.event.dto.request;

import com.jobsight.backend.domain.event.enumType.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class EventReviewRequest {

    @NotNull
    private EventStatus status;
}
