package com.github.jorepong.safetycctv.alert.dto;

import com.github.jorepong.safetycctv.analysis.StageSeverity;
import com.github.jorepong.safetycctv.analysis.StageAlertView;
import com.github.jorepong.safetycctv.entity.Camera;
import java.time.LocalDateTime;

public record AlertHistoryPayload(
    Long cameraId,
    String cameraName,
    String cameraLocation,
    String code,
    String title,
    String message,
    LocalDateTime timestamp,
    StageSeverity severity,
    String severityLabel,
    String severityTone
) {

    public static AlertHistoryPayload from(Camera camera, StageAlertView alert) {
        String location = resolveLocation(camera);
        return new AlertHistoryPayload(
            camera != null ? camera.getId() : null,
            camera != null ? camera.getName() : "-",
            location,
            alert.code(),
            alert.title(),
            alert.message(),
            alert.timestamp(),
            alert.severity(),
            labelFor(alert.severity()),
            toneFor(alert.severity())
        );
    }

    private static String resolveLocation(Camera camera) {
        if (camera == null) {
            return "-";
        }
        if (camera.getAddress() != null && !camera.getAddress().isBlank()) {
            return camera.getAddress();
        }
        if (camera.getLocationZone() != null && !camera.getLocationZone().isBlank()) {
            return camera.getLocationZone();
        }
        return "-";
    }

    private static String labelFor(StageSeverity severity) {
        if (severity == null) {
            return "정보";
        }
        return switch (severity) {
            case DANGER -> "위험";
            case WARNING -> "주의";
            case INFO -> "정보";
        };
    }

    private static String toneFor(StageSeverity severity) {
        if (severity == null) {
            return "info";
        }
        return switch (severity) {
            case DANGER -> "danger";
            case WARNING -> "warning";
            case INFO -> "info";
        };
    }
}
