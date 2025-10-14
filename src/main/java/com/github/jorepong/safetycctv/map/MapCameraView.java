package com.github.jorepong.safetycctv.map;

import com.github.jorepong.safetycctv.camera.Camera;
import com.github.jorepong.safetycctv.camera.CameraStatus;
import java.util.Optional;

public record MapCameraView(
    Long id,
    String name,
    String status,
    String statusDisplay,
    String locationZone,
    String address,
    Double latitude,
    Double longitude
) {

    public static MapCameraView from(final Camera camera) {
        if (camera == null) {
            return null;
        }
        final CameraStatus status = Optional.ofNullable(camera.getStatus())
            .orElse(CameraStatus.HEALTHY);
        return new MapCameraView(
            camera.getId(),
            camera.getName(),
            status.name(),
            status.getDisplayName(),
            camera.getLocationZone(),
            camera.getAddress(),
            camera.getLatitude(),
            camera.getLongitude()
        );
    }
}
