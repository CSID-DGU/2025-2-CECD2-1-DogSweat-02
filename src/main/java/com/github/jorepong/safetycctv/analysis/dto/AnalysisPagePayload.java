package com.github.jorepong.safetycctv.analysis.dto;

import com.github.jorepong.safetycctv.alert.RecentAlertView;
import com.github.jorepong.safetycctv.analysis.CameraAnalyticsSummary;
import com.github.jorepong.safetycctv.camera.CameraListView;

import java.util.List;

public record AnalysisPagePayload(
    List<CameraListView> allCameras,
    Long selectedCameraId,
    CameraAnalyticsSummary selectedCameraAnalytics,
    List<RecentAlertView> selectedCameraAlerts,
    List<CongestionHeatmapPoint> heatmapData
) {
}
