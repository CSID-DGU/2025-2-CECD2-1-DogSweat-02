package com.github.jorepong.safetycctv.dashboard;

public record DashboardSummary(
    long totalCameras,
    long streamingCameras,
    long camerasWithData,
    long camerasInDanger,
    long recentAnalysisEvents
) {
}

