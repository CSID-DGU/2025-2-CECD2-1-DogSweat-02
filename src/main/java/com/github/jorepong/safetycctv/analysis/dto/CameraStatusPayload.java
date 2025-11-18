package com.github.jorepong.safetycctv.analysis.dto;

import com.github.jorepong.safetycctv.analysis.CameraAnalyticsSummary;
import com.github.jorepong.safetycctv.analysis.CongestionLevel;
import com.github.jorepong.safetycctv.camera.TrainingStatus;

public record CameraStatusPayload(
    Long cameraId,
    String level,
    String levelLabel,
    String tone,
    TrainingStatus trainingStatus
) {
    public static CameraStatusPayload from(CameraAnalyticsSummary summary) {
        CongestionLevel lvl = summary.level() != null ? summary.level() : CongestionLevel.NO_DATA;
        return new CameraStatusPayload(
            summary.cameraId(),
            lvl.name(),
            lvl.label(),
            lvl.tone(),
            summary.trainingStatus()
        );
    }
}
