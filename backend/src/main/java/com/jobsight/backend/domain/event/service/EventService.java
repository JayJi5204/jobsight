package com.jobsight.backend.domain.event.service;

import com.jobsight.backend.domain.event.dto.request.EventCreateRequest;
import com.jobsight.backend.domain.event.dto.request.EventEndRequest;
import com.jobsight.backend.domain.event.dto.request.EventReviewRequest;
import com.jobsight.backend.domain.event.dto.response.EventResponse;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;

import java.time.OffsetDateTime;
import java.util.List;

public interface EventService {

    List<EventResponse> eventList(OffsetDateTime from,
                                  OffsetDateTime to,
                                  Long cameraId,
                                  EventKind kind,
                                  EventStatus status,
                                  int limit);

    EventResponse create(EventCreateRequest request);

    EventResponse review(Long id, EventReviewRequest request);

    EventResponse end(Long id, EventEndRequest request);


}
