package com.jobsight.backend.domain.event.enumType;

import lombok.Getter;

@Getter
public enum EventKind {

    FALL("추락"),
    FIRE("화재"),
    INTRUSION("침입"),
    LOITERING("배회");

    private final String label;

    EventKind(String label){
        this.label=label;
    }
}

