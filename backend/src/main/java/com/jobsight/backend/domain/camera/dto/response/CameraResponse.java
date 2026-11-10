package com.jobsight.backend.domain.camera.dto.response;

import com.jobsight.backend.domain.camera.entity.CameraEntity;
import lombok.Getter;

@Getter
public class CameraResponse {

    private Long id;
    private String streamKey;
    private String location;

    private CameraResponse() {}

    public static CameraResponse from(CameraEntity entity){

        CameraResponse response=new CameraResponse();

        response.id= entity.getId();
        response.streamKey= entity.getStreamKey();
        response.location= entity.getLocation();

        return response;
    }
}
