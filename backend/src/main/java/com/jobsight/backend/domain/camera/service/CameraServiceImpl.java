package com.jobsight.backend.domain.camera.service;

import com.jobsight.backend.domain.camera.dto.response.CameraResponse;
import com.jobsight.backend.domain.camera.repository.CameraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CameraServiceImpl implements CameraService {

    private final CameraRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<CameraResponse> cameraList() {
        return repository.findAll(Sort.by("id")).stream()
                .map(CameraResponse::from)
                .toList();
    }
}
