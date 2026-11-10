package com.jobsight.backend.domain.camera.service;

import com.jobsight.backend.domain.camera.dto.response.CameraResponse;

import java.util.List;

public interface CameraService {

    List<CameraResponse> cameraList();

}
