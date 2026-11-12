package com.jobsight.backend.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    CAMERA_NOT_FOUND(HttpStatus.NOT_FOUND,"모르는 카메라 입니다."),
    EVENT_NOT_FOUND(HttpStatus.NOT_FOUND,"없는 사건입니다."),
    EVENT_RANGE_INVALID(HttpStatus.BAD_REQUEST,"끝난 시각이 시작보다 빠릅니다."),
    EVENT_REVIEW_UNSUPPORTED(HttpStatus.BAD_REQUEST,"확인 처리만 할 수 있습니다.");



    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status,String message){
        this.status=status;
        this.message=message;
    }



}
