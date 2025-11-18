package com.github.jorepong.safetycctv.alert.dto;

import com.github.jorepong.safetycctv.analysis.StageSeverity;
import com.github.jorepong.safetycctv.analysis.StageAlertView;
import com.github.jorepong.safetycctv.entity.Camera;
import java.time.LocalDateTime;

public record AlertHistoryPayload(
    Long analysisLogId,
    Long cameraId,
    String cameraName,
    String code,
    String title,
    String message,
    LocalDateTime timestamp,
    StageSeverity severity,
    String severityLabel,
    String severityTone,
    double density
) {

    public static AlertHistoryPayload from(Camera camera, StageAlertView alert) {
        return new AlertHistoryPayload(
            alert.analysisLogId(),
            camera != null ? camera.getId() : null,
            camera != null ? camera.getName() : "-",
            alert.code(),
            alert.title(),
            alert.message(),
            alert.timestamp(),
            alert.severity(),
            labelFor(alert.severity()),
            toneFor(alert.severity()),
            alert.density()
        );
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
