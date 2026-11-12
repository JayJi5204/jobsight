package com.jobsight.backend.domain.event.controller;

import com.jobsight.backend.domain.event.dto.request.EventCreateRequest;
import com.jobsight.backend.domain.event.dto.request.EventEndRequest;
import com.jobsight.backend.domain.event.dto.request.EventReviewRequest;
import com.jobsight.backend.domain.event.dto.response.EventResponse;
import com.jobsight.backend.domain.event.enumType.EventKind;
import com.jobsight.backend.domain.event.enumType.EventStatus;
import com.jobsight.backend.domain.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/events")
public class EventController {

    private final EventService service;

    @GetMapping
    public List<EventResponse> eventList(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) Long cameraId,
            @RequestParam(required = false) EventKind kind,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(defaultValue = "500") int limit) {

        return service.eventList(from, to, cameraId, kind, status, limit);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(@Valid @RequestBody EventCreateRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    public EventResponse review(@PathVariable Long id, @Valid @RequestBody EventReviewRequest request) {
        return service.review(id, request);
    }

    @PatchMapping("/{id}/end")
    public EventResponse end(@PathVariable Long id, @Valid @RequestBody EventEndRequest request) {
        return service.end(id, request);
    }


}
