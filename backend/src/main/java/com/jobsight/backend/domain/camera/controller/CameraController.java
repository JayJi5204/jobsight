package com.jobsight.backend.domain.camera.controller;

import com.jobsight.backend.domain.camera.dto.response.CameraResponse;
import com.jobsight.backend.domain.camera.service.CameraService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cameras")
public class CameraController {

    private final CameraService service;

    @GetMapping
    public List<CameraResponse> cameraList(){
        return service.cameraList();
    }
}
