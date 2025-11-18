package com.github.jorepong.safetycctv.analysis.dto;

public record AnomalyDetectionResult(
    boolean isAnomaly,
    double currentDensity,
    double averageDensity,
    double normalRangeUpper,
    String message
) {
}
