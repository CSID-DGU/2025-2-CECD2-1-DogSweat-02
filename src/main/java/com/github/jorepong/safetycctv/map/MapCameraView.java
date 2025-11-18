package com.github.jorepong.safetycctv.map;

import com.github.jorepong.safetycctv.analysis.CameraAnalyticsSummary;
import com.github.jorepong.safetycctv.analysis.CongestionLevel;
import com.github.jorepong.safetycctv.entity.Camera;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public record MapCameraView(
    Long id,
    String name,
    String level,
    String levelLabel,
    String tone,
    String locationZone,
    String address,
    Double latitude,
    Double longitude,
    Double latestDensity,
    String densityFormatted,
    String updatedAt
) {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static MapCameraView from(Camera camera, CameraAnalyticsSummary summary) {
        if (camera == null) {
            return null;
        }
        CongestionLevel level = summary != null ? summary.level() : CongestionLevel.NO_DATA;
        Double density = summary != null ? summary.latestDensity() : null;
        LocalDateTime timestamp = summary != null ? summary.latestTimestamp() : null;
        return new MapCameraView(
            camera.getId(),
            camera.getName(),
            level.name(),
            level.label(),
            level.tone(),
            camera.getLocationZone(),
            camera.getAddress(),
            camera.getLatitude(),
            camera.getLongitude(),
            density,
            density != null ? String.format("%.2f", density) : "--",
            timestamp != null ? timestamp.format(FORMATTER) : null
        );
    }
}
