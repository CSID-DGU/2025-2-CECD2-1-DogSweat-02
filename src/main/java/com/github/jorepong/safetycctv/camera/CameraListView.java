package com.github.jorepong.safetycctv.camera;

import com.github.jorepong.safetycctv.entity.Camera;

public record CameraListView(
    Long id,
    String name,
    String location
) {

    public static CameraListView from(Camera camera) {
        if (camera == null) {
            return null;
        }
        return new CameraListView(
            camera.getId(),
            camera.getName(),
            camera.getLocationZone() != null ? camera.getLocationZone() : "위치 정보 없음"
        );
    }
}

