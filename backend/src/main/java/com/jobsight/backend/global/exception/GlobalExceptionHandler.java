package com.jobsight.backend.global.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handle(BusinessException e) {
        ErrorCode code = e.getErrorCode();
        log.debug("{} - {}", code.name(), e.getMessage());

        ProblemDetail body = ProblemDetail.forStatusAndDetail(code.getStatus(), e.getMessage());
        body.setProperty("code", code.name());

        return body;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handle(MethodArgumentNotValidException e) {
        String detail = e.getBindingResult().getFieldErrors().stream()
                .map(field -> field.getField() + " " + field.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        body.setProperty("code", "REQUEST_INVALID");

        return body;
    }

}
